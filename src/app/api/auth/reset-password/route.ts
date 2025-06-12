
// src/app/api/auth/reset-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cognitoAuth } from '@/lib/auth/cognito';
import { resetPasswordSchema } from '@/lib/validations/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, code, newPassword } = body;

    await cognitoAuth.confirmForgotPassword(email, code, newPassword);

    return NextResponse.json({
      message: 'Contraseña actualizada exitosamente.'
    });

  } catch (error: any) {
    console.error('Error en reset password:', error);
    return NextResponse.json(
      { error: error.message || 'Error al cambiar contraseña' },
      { status: 400 }
    );
  }
}

