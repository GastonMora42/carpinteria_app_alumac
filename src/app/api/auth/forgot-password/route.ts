// src/app/api/auth/forgot-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cognitoAuth } from '@/lib/auth/cognito';
import { forgotPasswordSchema } from '@/lib/validations/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = forgotPasswordSchema.parse(body);

    await cognitoAuth.forgotPassword(email);

    return NextResponse.json({
      message: 'Se ha enviado un código de recuperación a tu email.'
    });

  } catch (error: any) {
    console.error('Error en forgot password:', error);
    return NextResponse.json(
      { error: error.message || 'Error al enviar código de recuperación' },
      { status: 400 }
    );
  }
}
