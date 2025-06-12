// src/app/api/auth/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cognitoAuth } from '@/lib/auth/cognito';
import { prisma } from '@/lib/db/prisma';

export async function GET(req: NextRequest) {
  try {
    const idToken = req.cookies.get('cognito-id-token')?.value;

    if (!idToken) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Verificar token y obtener información del usuario
    const cognitoUser = await cognitoAuth.verifyToken(idToken);

    // Obtener información adicional de la base de datos local
    const dbUser = await prisma.user.findUnique({
      where: { email: cognitoUser.email },
      select: {
        id: true,
        codigo: true,
        email: true,
        name: true,
        role: true,
        activo: true,
        lastLoginAt: true
      }
    });

    if (!dbUser || !dbUser.activo) {
      return NextResponse.json(
        { error: 'Usuario no encontrado o inactivo' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      user: {
        ...dbUser,
        cognitoId: cognitoUser.sub,
        emailVerified: cognitoUser.email_verified
      }
    });

  } catch (error: any) {
    console.error('Error obteniendo información del usuario:', error);
    return NextResponse.json(
      { error: 'Token inválido o expirado' },
      { status: 401 }
    );
  }
}