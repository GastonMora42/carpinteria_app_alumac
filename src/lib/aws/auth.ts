import { 
    CognitoIdentityProviderClient, 
    InitiateAuthCommand,
    SignUpCommand,
    ConfirmSignUpCommand,
    ForgotPasswordCommand,
    ConfirmForgotPasswordCommand
  } from "@aws-sdk/client-cognito-identity-provider";
  
  const client = new CognitoIdentityProviderClient({ 
    region: process.env.AWS_REGION || 'us-east-1'
  });
  
  const clientId = process.env.COGNITO_CLIENT_ID as string;
  const userPoolId = process.env.COGNITO_USER_POOL_ID as string;
  
  export async function signIn(username: string, password: string) {
    const command = new InitiateAuthCommand({
      AuthFlow: "USER_PASSWORD_AUTH",
      ClientId: clientId,
      AuthParameters: {
        USERNAME: username,
        PASSWORD: password,
      },
    });
  
    try {
      const response = await client.send(command);
      return response;
    } catch (error) {
      console.error("Error signing in:", error);
      throw error;
    }
  }
  
  export async function signUp(username: string, password: string, email: string, name: string) {
    const command = new SignUpCommand({
      ClientId: clientId,
      Username: username,
      Password: password,
      UserAttributes: [
        { Name: "email", Value: email },
        { Name: "name", Value: name },
      ],
    });
  
    try {
      const response = await client.send(command);
      return response;
    } catch (error) {
      console.error("Error signing up:", error);
      throw error;
    }
  }
  
  export async function confirmSignUp(username: string, code: string) {
    const command = new ConfirmSignUpCommand({
      ClientId: clientId,
      Username: username,
      ConfirmationCode: code,
    });
  
    try {
      const response = await client.send(command);
      return response;
    } catch (error) {
      console.error("Error confirming sign up:", error);
      throw error;
    }
  }
  
  export async function forgotPassword(username: string) {
    const command = new ForgotPasswordCommand({
      ClientId: clientId,
      Username: username,
    });
  
    try {
      const response = await client.send(command);
      return response;
    } catch (error) {
      console.error("Error initiating forgot password:", error);
      throw error;
    }
  }
  
  export async function confirmForgotPassword(username: string, code: string, newPassword: string) {
    const command = new ConfirmForgotPasswordCommand({
      ClientId: clientId,
      Username: username,
      ConfirmationCode: code,
      Password: newPassword,
    });
  
    try {
      const response = await client.send(command);
      return response;
    } catch (error) {
      console.error("Error confirming forgot password:", error);
      throw error;
    }
  }