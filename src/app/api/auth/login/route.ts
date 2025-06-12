// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cognitoAuth } from '@/lib/auth/cognito';
import { prisma } from '@/lib/db/prisma';
import { loginSchema } from '@/lib/validations/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = loginSchema.parse(body);

    // Autenticar con Cognito
    const authResult = await cognitoAuth.signIn(email, password);

    // Buscar o crear usuario en la base de datos local
    let dbUser = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        activo: true
      }
    });

    // Si el usuario no existe en la BD local, crearlo
    if (!dbUser) {
      const userCount = await prisma.user.count();
      const codigo = `USR-${String(userCount + 1).padStart(3, '0')}`;
      
      dbUser = await prisma.user.create({
        data: {
          codigo,
          email: authResult.user.email,
          name: authResult.user.name,
          role: authResult.user['custom:role'] || 'USER',
          cognitoId: authResult.user.sub
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          activo: true
        }
      });
    }

    // Verificar que el usuario esté activo
    if (!dbUser.activo) {
      return NextResponse.json(
        { error: 'Usuario inactivo' },
        { status: 403 }
      );
    }

    // Actualizar último login
    await prisma.user.update({
      where: { id: dbUser.id },
      data: { lastLoginAt: new Date() }
    });

    // Crear respuesta con cookies seguras
    const response = NextResponse.json({
      user: dbUser,
      message: 'Inicio de sesión exitoso'
    });

    // Configurar cookies HttpOnly y Secure
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      maxAge: 60 * 60 * 24 * 7, // 7 días
      path: '/'
    };

    response.cookies.set('cognito-id-token', authResult.idToken, cookieOptions);
    response.cookies.set('cognito-access-token', authResult.accessToken, cookieOptions);
    response.cookies.set('cognito-refresh-token', authResult.refreshToken, cookieOptions);

    return response;

  } catch (error: any) {
    console.error('Error en login:', error);
    return NextResponse.json(
      { error: error.message || 'Error en el inicio de sesión' },
      { status: 400 }
    );
  }
}