// src/lib/auth/cognito.ts
import { 
    CognitoIdentityProviderClient, 
    InitiateAuthCommand,
    SignUpCommand,
    ConfirmSignUpCommand,
    ForgotPasswordCommand,
    ConfirmForgotPasswordCommand,
    GetUserCommand,
    AdminCreateUserCommand,
    AdminDeleteUserCommand,
    AdminUpdateUserAttributesCommand
  } from "@aws-sdk/client-cognito-identity-provider";
  import jwt from 'jsonwebtoken';
  import { promisify } from 'util';
  
  export interface CognitoUser {
    sub: string;
    email: string;
    name: string;
    email_verified: boolean;
    'custom:role'?: string;
    'custom:user_id'?: string;
    aud: string;
    exp: number;
    iat: number;
  }
  
  export interface AuthResult {
    accessToken: string;
    idToken: string;
    refreshToken: string;
    user: CognitoUser;
  }
  
  class CognitoAuthService {
    private client: CognitoIdentityProviderClient;
    private userPoolId: string;
    private clientId: string;
    private clientSecret?: string;
    private jwksCache: any = null;
    private jwksCacheTime: number = 0;
  
    constructor() {
      this.userPoolId = process.env.COGNITO_USER_POOL_ID!;
      this.clientId = process.env.COGNITO_CLIENT_ID!;
      this.clientSecret = process.env.COGNITO_CLIENT_SECRET;
      
      this.client = new CognitoIdentityProviderClient({ 
        region: process.env.AWS_REGION || 'us-east-1'
      });
    }
  
    // Obtener JWKS de Cognito
    private async getJWKS(): Promise<any> {
      const now = Date.now();
      // Cache por 1 hora
      if (this.jwksCache && (now - this.jwksCacheTime) < 3600000) {
        return this.jwksCache;
      }
  
      try {
        const region = process.env.AWS_REGION || 'us-east-1';
        const jwksUrl = `https://cognito-idp.${region}.amazonaws.com/${this.userPoolId}/.well-known/jwks.json`;
        
        const response = await fetch(jwksUrl);
        if (!response.ok) {
          throw new Error('Failed to fetch JWKS');
        }
        
        this.jwksCache = await response.json();
        this.jwksCacheTime = now;
        return this.jwksCache;
      } catch (error) {
        console.error('Error fetching JWKS:', error);
        throw new Error('Failed to fetch Cognito JWKS');
      }
    }
  
    // Verificar token ID de Cognito
    async verifyToken(idToken: string): Promise<CognitoUser> {
      try {
        // Decodificar header para obtener kid
        const decodedHeader = jwt.decode(idToken, { complete: true });
        if (!decodedHeader || !decodedHeader.header.kid) {
          throw new Error('Invalid token header');
        }
  
        // Obtener JWKS
        const jwks = await this.getJWKS();
        const key = jwks.keys.find((k: any) => k.kid === decodedHeader.header.kid);
        
        if (!key) {
          throw new Error('Public key not found in JWKS');
        }
  
        // Construir certificado PEM desde JWK
        const publicKey = this.jwkToPem(key);
  
        // Verificar token
        const decoded = jwt.verify(idToken, publicKey, {
          algorithms: ['RS256'],
          audience: this.clientId,
          issuer: `https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${this.userPoolId}`
        }) as any;
  
        // Verificar que no haya expirado
        const now = Math.floor(Date.now() / 1000);
        if (decoded.exp < now) {
          throw new Error('Token expired');
        }
  
        return decoded as CognitoUser;
      } catch (error: any) {
        console.error('Token verification failed:', error);
        throw new Error('Token inválido o expirado');
      }
    }
  
    // Convertir JWK a PEM
    private jwkToPem(jwk: any): string {
      const { n, e } = jwk;
      
      // Decodificar base64url
      const nBuffer = this.base64urlToBuffer(n);
      const eBuffer = this.base64urlToBuffer(e);
      
      // Construir ASN.1 DER
      const modulusBytes = this.encodeAsn1Length(nBuffer.length) + nBuffer.toString('hex');
      const exponentBytes = this.encodeAsn1Length(eBuffer.length) + eBuffer.toString('hex');
      
      const sequenceBytes = '02' + modulusBytes + '02' + exponentBytes;
      const sequenceLength = this.encodeAsn1Length(sequenceBytes.length / 2);
      const sequence = '30' + sequenceLength + sequenceBytes;
      
      const algorithmIdentifier = '300d06092a864886f70d0101010500';
      const publicKeyInfo = '30' + this.encodeAsn1Length((algorithmIdentifier.length + sequence.length + 8) / 2) + 
                           algorithmIdentifier + '03' + this.encodeAsn1Length((sequence.length + 2) / 2) + '00' + sequence;
      
      const der = Buffer.from(publicKeyInfo, 'hex');
      const pem = '-----BEGIN PUBLIC KEY-----\n' + 
                  der.toString('base64').match(/.{1,64}/g)?.join('\n') + 
                  '\n-----END PUBLIC KEY-----';
      
      return pem;
    }
  
    private base64urlToBuffer(base64url: string): Buffer {
      const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
      const padding = base64.length % 4;
      const paddedBase64 = base64 + '='.repeat(padding ? 4 - padding : 0);
      return Buffer.from(paddedBase64, 'base64');
    }
  
    private encodeAsn1Length(length: number): string {
      if (length < 0x80) {
        return length.toString(16).padStart(2, '0');
      } else {
        const lengthBytes = [];
        let temp = length;
        while (temp > 0) {
          lengthBytes.unshift(temp & 0xFF);
          temp = temp >> 8;
        }
        return (0x80 | lengthBytes.length).toString(16).padStart(2, '0') + 
               lengthBytes.map(b => b.toString(16).padStart(2, '0')).join('');
      }
    }
  
    // Generar hash secreto si es necesario
    private generateSecretHash(username: string): string | undefined {
      if (!this.clientSecret) return undefined;
      
      const crypto = require('crypto');
      return crypto
        .createHmac('SHA256', this.clientSecret)
        .update(username + this.clientId)
        .digest('base64');
    }
  
    // Iniciar sesión
    async signIn(email: string, password: string): Promise<AuthResult> {
      try {
        const params: any = {
          AuthFlow: "USER_PASSWORD_AUTH",
          ClientId: this.clientId,
          AuthParameters: {
            USERNAME: email,
            PASSWORD: password,
          },
        };
  
        // Agregar secret hash si está configurado
        if (this.clientSecret) {
          params.AuthParameters.SECRET_HASH = this.generateSecretHash(email);
        }
  
        const command = new InitiateAuthCommand(params);
        const response = await this.client.send(command);
  
        if (response.AuthenticationResult) {
          const { AccessToken, IdToken, RefreshToken } = response.AuthenticationResult;
          
          // Verificar y extraer información del usuario del ID token
          const user = await this.verifyToken(IdToken!);
          
          return {
            accessToken: AccessToken!,
            idToken: IdToken!,
            refreshToken: RefreshToken!,
            user
          };
        }
  
        throw new Error('Error en la autenticación');
      } catch (error: any) {
        console.error("Error signing in:", error);
        throw this.handleCognitoError(error);
      }
    }
  
    // Registrar usuario
    async signUp(email: string, password: string, name: string): Promise<{ userSub: string; needsConfirmation: boolean }> {
      try {
        const params: any = {
          ClientId: this.clientId,
          Username: email,
          Password: password,
          UserAttributes: [
            { Name: "email", Value: email },
            { Name: "name", Value: name },
          ],
        };
  
        if (this.clientSecret) {
          params.SecretHash = this.generateSecretHash(email);
        }
  
        const command = new SignUpCommand(params);
        const response = await this.client.send(command);
  
        return {
          userSub: response.UserSub!,
          needsConfirmation: !response.UserConfirmed
        };
      } catch (error: any) {
        console.error("Error signing up:", error);
        throw this.handleCognitoError(error);
      }
    }
  
    // Confirmar registro
    async confirmSignUp(email: string, code: string): Promise<void> {
      try {
        const params: any = {
          ClientId: this.clientId,
          Username: email,
          ConfirmationCode: code,
        };
  
        if (this.clientSecret) {
          params.SecretHash = this.generateSecretHash(email);
        }
  
        const command = new ConfirmSignUpCommand(params);
        await this.client.send(command);
      } catch (error: any) {
        console.error("Error confirming sign up:", error);
        throw this.handleCognitoError(error);
      }
    }
  
    // Recuperar contraseña
    async forgotPassword(email: string): Promise<void> {
      try {
        const params: any = {
          ClientId: this.clientId,
          Username: email,
        };
  
        if (this.clientSecret) {
          params.SecretHash = this.generateSecretHash(email);
        }
  
        const command = new ForgotPasswordCommand(params);
        await this.client.send(command);
      } catch (error: any) {
        console.error("Error initiating forgot password:", error);
        throw this.handleCognitoError(error);
      }
    }
  
    // Confirmar nueva contraseña
    async confirmForgotPassword(email: string, code: string, newPassword: string): Promise<void> {
      try {
        const params: any = {
          ClientId: this.clientId,
          Username: email,
          ConfirmationCode: code,
          Password: newPassword,
        };
  
        if (this.clientSecret) {
          params.SecretHash = this.generateSecretHash(email);
        }
  
        const command = new ConfirmForgotPasswordCommand(params);
        await this.client.send(command);
      } catch (error: any) {
        console.error("Error confirming forgot password:", error);
        throw this.handleCognitoError(error);
      }
    }
  
    // Obtener información del usuario
    async getUser(accessToken: string): Promise<CognitoUser> {
      try {
        const command = new GetUserCommand({
          AccessToken: accessToken
        });
        
        const response = await this.client.send(command);
        
        // Convertir atributos a formato CognitoUser
        const attributes: any = {};
        response.UserAttributes?.forEach(attr => {
          attributes[attr.Name!] = attr.Value;
        });
  
        return {
          sub: response.Username!,
          email: attributes.email,
          name: attributes.name,
          email_verified: attributes.email_verified === 'true',
          'custom:role': attributes['custom:role'],
          'custom:user_id': attributes['custom:user_id'],
          aud: this.clientId,
          exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
          iat: Math.floor(Date.now() / 1000)
        };
      } catch (error: any) {
        console.error("Error getting user:", error);
        throw this.handleCognitoError(error);
      }
    }
  
    // Manejar errores de Cognito
    private handleCognitoError(error: any): Error {
      const errorCode = error.name || error.__type;
      
      switch (errorCode) {
        case 'NotAuthorizedException':
          return new Error('Credenciales incorrectas');
        case 'UserNotConfirmedException':
          return new Error('Usuario no confirmado. Revisa tu email.');
        case 'UsernameExistsException':
          return new Error('Este email ya está registrado');
        case 'InvalidPasswordException':
          return new Error('La contraseña no cumple con los requisitos');
        case 'CodeMismatchException':
          return new Error('Código de verificación incorrecto');
        case 'ExpiredCodeException':
          return new Error('El código de verificación ha expirado');
        case 'TooManyRequestsException':
          return new Error('Demasiados intentos. Intenta más tarde.');
        case 'LimitExceededException':
          return new Error('Límite de intentos excedido');
        case 'UserNotFoundException':
          return new Error('Usuario no encontrado');
        case 'InvalidParameterException':
          return new Error('Parámetros inválidos');
        default:
          return new Error(error.message || 'Error en el servicio de autenticación');
      }
    }
  }
  
  // Exportar instancia singleton
  export const cognitoAuth = new CognitoAuthService();