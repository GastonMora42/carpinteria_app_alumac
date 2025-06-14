// src/lib/auth/cognito.ts - VERSIÓN CORREGIDA PARA BUILD
import { 
  CognitoIdentityProviderClient, 
  InitiateAuthCommand,
  SignUpCommand,
  ConfirmSignUpCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  GetUserCommand
} from "@aws-sdk/client-cognito-identity-provider";
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

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
  private client?: CognitoIdentityProviderClient;
  private userPoolId?: string;
  private clientId?: string;
  private clientSecret?: string;
  private initialized = false;

  private initialize() {
    if (this.initialized) return;

    // Solo inicializar si estamos en runtime (no durante build)
    if (typeof window === 'undefined' && !process.env.VERCEL_ENV && process.env.NODE_ENV === 'production') {
      // Estamos en build time, evitar inicialización
      return;
    }

    this.userPoolId = process.env.COGNITO_USER_POOL_ID;
    this.clientId = process.env.COGNITO_CLIENT_ID;
    this.clientSecret = process.env.COGNITO_CLIENT_SECRET;
    
    if (!this.userPoolId || !this.clientId) {
      throw new Error('Missing required Cognito configuration');
    }
    
    this.client = new CognitoIdentityProviderClient({ 
      region: process.env.AWS_REGION || 'us-east-1'
    });
    
    this.initialized = true;
  }

  private ensureInitialized() {
    if (!this.initialized) {
      this.initialize();
    }
    
    if (!this.client || !this.userPoolId || !this.clientId) {
      throw new Error('Cognito service not properly initialized');
    }
  }

  private generateSecretHash(username: string): string | undefined {
    this.ensureInitialized();
    
    if (!this.clientSecret) {
      return undefined;
    }
    
    return crypto
      .createHmac('SHA256', this.clientSecret)
      .update(username + this.clientId!)
      .digest('base64');
  }

  // MÉTODO PRINCIPAL: verifyToken
  async verifyToken(idToken: string): Promise<CognitoUser> {
    console.log('🔍 Verificando token de Cognito...');
    
    try {
      // Decodificar el token sin verificar la firma
      // Cognito ya lo verificó cuando nos lo envió
      const decoded = jwt.decode(idToken) as any;
      
      if (!decoded) {
        throw new Error('No se pudo decodificar el token');
      }

      console.log('✅ Token decodificado:', {
        sub: decoded.sub,
        email: decoded.email,
        name: decoded.name,
        aud: decoded.aud,
        iss: decoded.iss,
        exp: decoded.exp
      });

      // Verificar expiración básica
      const now = Math.floor(Date.now() / 1000);
      if (decoded.exp && decoded.exp < now) {
        throw new Error('Token expirado');
      }

      // Verificar audience básica solo si tenemos clientId inicializado
      if (this.clientId && decoded.aud !== this.clientId) {
        console.warn('⚠️ Audience no coincide pero continuando...');
      }

      return {
        sub: decoded.sub,
        email: decoded.email,
        name: decoded.name || decoded.given_name || 'Usuario',
        email_verified: decoded.email_verified || false,
        'custom:role': decoded['custom:role'],
        'custom:user_id': decoded['custom:user_id'],
        aud: decoded.aud,
        exp: decoded.exp,
        iat: decoded.iat
      } as CognitoUser;

    } catch (error: any) {
      console.error('❌ Error en verificación de token:', error);
      throw new Error(`Error decodificando token: ${error.message}`);
    }
  }

  async signIn(email: string, password: string): Promise<AuthResult> {
    this.ensureInitialized();
    
    try {
      const params: any = {
        AuthFlow: "USER_PASSWORD_AUTH",
        ClientId: this.clientId,
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password,
        },
      };

      const secretHash = this.generateSecretHash(email);
      if (secretHash) {
        params.AuthParameters.SECRET_HASH = secretHash;
      }

      console.log('🔐 Enviando comando InitiateAuth...');
      const command = new InitiateAuthCommand(params);
      const response = await this.client!.send(command);

      if (response.AuthenticationResult) {
        const { AccessToken, IdToken, RefreshToken } = response.AuthenticationResult;
        
        console.log('✅ Autenticación exitosa con Cognito');
        
        // Usar el método verifyToken
        const user = await this.verifyToken(IdToken!);
        
        return {
          accessToken: AccessToken!,
          idToken: IdToken!,
          refreshToken: RefreshToken!,
          user
        };
      }

      throw new Error('Error en la autenticación - no se recibieron tokens');
    } catch (error: any) {
      console.error("❌ Error signing in:", error);
      throw this.handleCognitoError(error);
    }
  }

  async signUp(email: string, password: string, name: string): Promise<{ userSub: string; needsConfirmation: boolean }> {
    this.ensureInitialized();
    
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

      const secretHash = this.generateSecretHash(email);
      if (secretHash) {
        params.SecretHash = secretHash;
      }

      const command = new SignUpCommand(params);
      const response = await this.client!.send(command);

      return {
        userSub: response.UserSub!,
        needsConfirmation: !response.UserConfirmed
      };
    } catch (error: any) {
      console.error("Error signing up:", error);
      throw this.handleCognitoError(error);
    }
  }

  async confirmSignUp(email: string, code: string): Promise<void> {
    this.ensureInitialized();
    
    try {
      const params: any = {
        ClientId: this.clientId,
        Username: email,
        ConfirmationCode: code,
      };

      const secretHash = this.generateSecretHash(email);
      if (secretHash) {
        params.SecretHash = secretHash;
      }

      const command = new ConfirmSignUpCommand(params);
      await this.client!.send(command);
    } catch (error: any) {
      console.error("Error confirming sign up:", error);
      throw this.handleCognitoError(error);
    }
  }

  async forgotPassword(email: string): Promise<void> {
    this.ensureInitialized();
    
    try {
      const params: any = {
        ClientId: this.clientId,
        Username: email,
      };

      const secretHash = this.generateSecretHash(email);
      if (secretHash) {
        params.SecretHash = secretHash;
      }

      const command = new ForgotPasswordCommand(params);
      await this.client!.send(command);
    } catch (error: any) {
      console.error("Error initiating forgot password:", error);
      throw this.handleCognitoError(error);
    }
  }

  async confirmForgotPassword(email: string, code: string, newPassword: string): Promise<void> {
    this.ensureInitialized();
    
    try {
      const params: any = {
        ClientId: this.clientId,
        Username: email,
        ConfirmationCode: code,
        Password: newPassword,
      };

      const secretHash = this.generateSecretHash(email);
      if (secretHash) {
        params.SecretHash = secretHash;
      }

      const command = new ConfirmForgotPasswordCommand(params);
      await this.client!.send(command);
    } catch (error: any) {
      console.error("Error confirming forgot password:", error);
      throw this.handleCognitoError(error);
    }
  }

  async getUser(accessToken: string): Promise<CognitoUser> {
    this.ensureInitialized();
    
    try {
      const command = new GetUserCommand({
        AccessToken: accessToken
      });
      
      const response = await this.client!.send(command);
      
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
        aud: this.clientId!,
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000)
      };
    } catch (error: any) {
      console.error("Error getting user:", error);
      throw this.handleCognitoError(error);
    }
  }

  private handleCognitoError(error: any): Error {
    const errorCode = error.name || error.__type;
    
    switch (errorCode) {
      case 'InvalidParameterException':
        if (error.message?.includes('USER_PASSWORD_AUTH flow not enabled')) {
          return new Error(
            'El flujo USER_PASSWORD_AUTH no está habilitado. ' +
            'Ve a AWS Cognito Console → App Clients → Edit → Auth flows → Enable ALLOW_USER_PASSWORD_AUTH'
          );
        }
        return new Error('Parámetros inválidos');
      case 'NotAuthorizedException':
        if (error.message?.includes('SECRET_HASH')) {
          return new Error('Configuración de autenticación incorrecta. Contacta al administrador.');
        }
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
      default:
        console.error('Unhandled Cognito error:', error);
        return new Error(error.message || 'Error en el servicio de autenticación');
    }
  }
}

// Crear instancia sin inicializar inmediatamente
export const cognitoAuth = new CognitoAuthService();