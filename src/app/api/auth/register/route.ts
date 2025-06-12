// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cognitoAuth } from '@/lib/auth/cognito';
import { registerSchema } from '@/lib/validations/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password } = registerSchema.parse(body);

    // Registrar en Cognito
    const result = await cognitoAuth.signUp(email, password, name);

    return NextResponse.json({
      userSub: result.userSub,
      needsConfirmation: result.needsConfirmation,
      message: result.needsConfirmation 
        ? 'Usuario registrado. Revisa tu email para confirmar la cuenta.'
        : 'Usuario registrado exitosamente.'
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error en registro:', error);
    return NextResponse.json(
      { error: error.message || 'Error en el registro' },
      { status: 400 }
    );
  }
}