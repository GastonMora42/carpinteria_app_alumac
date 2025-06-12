// src/app/api/auth/me/route.ts - CORREGIDO
import { NextRequest, NextResponse } from 'next/server';
import { cognitoAuth } from '@/lib/auth/cognito';
import { prisma } from '@/lib/db/prisma';

export async function GET(req: NextRequest) {
  try {
    const idToken = req.cookies.get('cognito-id-token')?.value;
    const accessToken = req.cookies.get('cognito-access-token')?.value;

    if (!idToken || !accessToken) {
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
        lastLoginAt: true,
        cognitoId: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!dbUser) {
      // Si el usuario no existe en BD local, crearlo
      const userCount = await prisma.user.count();
      const codigo = `USR-${String(userCount + 1).padStart(3, '0')}`;
      
      const newDbUser = await prisma.user.create({
        data: {
          codigo,
          email: cognitoUser.email,
          name: cognitoUser.name || 'Usuario',
          role: (cognitoUser['custom:role'] as any) || 'USER',
          cognitoId: cognitoUser.sub,
          activo: true
        },
        select: {
          id: true,
          codigo: true,
          email: true,
          name: true,
          role: true,
          activo: true,
          lastLoginAt: true,
          cognitoId: true,
          createdAt: true,
          updatedAt: true
        }
      });

      return NextResponse.json({
        user: {
          ...newDbUser,
          emailVerified: cognitoUser.email_verified
        }
      });
    }

    if (!dbUser.activo) {
      return NextResponse.json(
        { error: 'Usuario inactivo. Contacta al administrador.' },
        { status: 403 }
      );
    }

    // Actualizar cognitoId si es necesario
    if (dbUser.cognitoId !== cognitoUser.sub) {
      await prisma.user.update({
        where: { id: dbUser.id },
        data: { cognitoId: cognitoUser.sub }
      });
    }

    return NextResponse.json({
      user: {
        ...dbUser,
        emailVerified: cognitoUser.email_verified
      }
    });

  } catch (error: any) {
    console.error('Error obteniendo información del usuario:', error);
    
    // Si el token es inválido, limpiar cookies
    if (error.message?.includes('Token') || error.message?.includes('inválido') || error.message?.includes('expirado')) {
      const response = NextResponse.json(
        { error: 'Token inválido o expirado' },
        { status: 401 }
      );
      
      // Limpiar cookies
      response.cookies.delete('cognito-id-token');
      response.cookies.delete('cognito-access-token');
      response.cookies.delete('cognito-refresh-token');
      
      return response;
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}