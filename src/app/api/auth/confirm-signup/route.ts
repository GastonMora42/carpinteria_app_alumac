// src/app/api/auth/confirm-signup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cognitoAuth } from '@/lib/auth/cognito';
import { z } from 'zod';

const confirmSchema = z.object({
  email: z.string().email(),
  code: z.string().min(6).max(6)
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, code } = confirmSchema.parse(body);

    await cognitoAuth.confirmSignUp(email, code);

    return NextResponse.json({
      message: 'Cuenta confirmada exitosamente. Ya puedes iniciar sesión.'
    });

  } catch (error: any) {
    console.error('Error en confirmación:', error);
    return NextResponse.json(
      { error: error.message || 'Error en la confirmación' },
      { status: 400 }
    );
  }
}

