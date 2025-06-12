// src/app/api/auth/login/route.ts - VERSIÓN CON DEBUG DETALLADO
// Usar temporalmente para identificar el problema exacto

import { NextRequest, NextResponse } from 'next/server';
import { cognitoAuth } from '@/lib/auth/cognito';
import { prisma } from '@/lib/db/prisma';
import { loginSchema } from '@/lib/validations/auth';

export async function POST(req: NextRequest) {
  console.log('🚀 === INICIO LOGIN DEBUG ===');
  
  try {
    // DEBUG: Verificar que se recibe el request
    console.log('📨 Request recibido');
    
    const body = await req.json();
    console.log('📋 Body parseado:', { 
      email: body.email, 
      passwordLength: body.password?.length 
    });

    // DEBUG: Validar schema
    console.log('🔍 Validando schema...');
    const { email, password } = loginSchema.parse(body);
    console.log('✅ Schema validado correctamente');

    // DEBUG: Verificar configuración
    console.log('⚙️  Verificando configuración Cognito...');
    console.log('- AWS_REGION:', process.env.AWS_REGION);
    console.log('- USER_POOL_ID presente:', !!process.env.COGNITO_USER_POOL_ID);
    console.log('- CLIENT_ID presente:', !!process.env.COGNITO_CLIENT_ID);
    console.log('- CLIENT_SECRET presente:', !!process.env.COGNITO_CLIENT_SECRET);

    // DEBUG: Intentar signin
    console.log('🔐 Intentando signIn con Cognito...');
    console.log('Email:', email);
    
    let authResult;
    try {
      authResult = await cognitoAuth.signIn(email, password);
      console.log('✅ SignIn exitoso con Cognito');
      console.log('Usuario Cognito:', {
        sub: authResult.user.sub,
        email: authResult.user.email,
        name: authResult.user.name,
        email_verified: authResult.user.email_verified
      });
    } catch (cognitoError: any) {
      console.error('❌ Error en Cognito signIn:', {
        name: cognitoError.name,
        message: cognitoError.message,
        code: cognitoError.code,
        statusCode: cognitoError.statusCode
      });
      
      // Proporcionar información específica del error
      if (cognitoError.message?.includes('SECRET_HASH')) {
        console.error('🔴 PROBLEMA: El App Client requiere SECRET_HASH pero no se proporcionó correctamente');
        console.error('💡 SOLUCIÓN: Verificar COGNITO_CLIENT_SECRET en .env.local');
      }
      
      throw cognitoError;
    }

    // DEBUG: Buscar usuario en BD
    console.log('🗄️  Buscando usuario en BD local...');
    let dbUser = await prisma.user.findUnique({
      where: { email: authResult.user.email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        activo: true,
        cognitoId: true
      }
    });

    if (dbUser) {
      console.log('✅ Usuario encontrado en BD:', dbUser.id);
    } else {
      console.log('⚠️  Usuario no encontrado, creando nuevo...');
      const userCount = await prisma.user.count();
      const codigo = `USR-${String(userCount + 1).padStart(3, '0')}`;
      
      dbUser = await prisma.user.create({
        data: {
          codigo,
          email: authResult.user.email,
          name: authResult.user.name || 'Usuario',
          role: (authResult.user['custom:role'] as any) || 'USER',
          cognitoId: authResult.user.sub,
          activo: true
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          activo: true,
          cognitoId: true
        }
      });
      console.log('✅ Usuario creado en BD:', dbUser.id);
    }

    // DEBUG: Verificar usuario activo
    if (!dbUser.activo) {
      console.error('❌ Usuario inactivo:', dbUser.id);
      return NextResponse.json(
        { error: 'Usuario inactivo. Contacta al administrador.' },
        { status: 403 }
      );
    }

    // DEBUG: Actualizar último login
    console.log('🔄 Actualizando último login...');
    await prisma.user.update({
      where: { id: dbUser.id },
      data: { 
        lastLoginAt: new Date(),
        cognitoId: authResult.user.sub
      }
    });

    // DEBUG: Crear respuesta
    console.log('📝 Creando respuesta con cookies...');
    const response = NextResponse.json({
      user: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role
      },
      message: 'Inicio de sesión exitoso'
    });

    // DEBUG: Configurar cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      maxAge: 60 * 60 * 24 * 7,
      path: '/'
    };

    console.log('🍪 Configurando cookies...', cookieOptions);
    response.cookies.set('cognito-id-token', authResult.idToken, cookieOptions);
    response.cookies.set('cognito-access-token', authResult.accessToken, cookieOptions);
    response.cookies.set('cognito-refresh-token', authResult.refreshToken, cookieOptions);

    console.log('✅ === LOGIN EXITOSO ===');
    return response;

  } catch (error: any) {
    console.error('❌ === ERROR EN LOGIN ===');
    console.error('Error completo:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 5).join('\n'), // Primeras 5 líneas del stack
      code: error.code,
      statusCode: error.statusCode
    });
    
    // Analizar tipo de error
    let errorMessage = 'Error en el inicio de sesión';
    let statusCode = 400;

    if (error.errors) {
      // Errores de validación de Zod
      console.error('🔴 Error de validación Zod:', error.errors);
      return NextResponse.json(
        { 
          error: 'Datos inválidos',
          details: error.errors.map((err: any) => err.message),
          debug: 'Error en validación de datos de entrada'
        },
        { status: 400 }
      );
    }

    if (error.message) {
      console.error('🔴 Mensaje de error:', error.message);
      
      if (error.message.includes('Credenciales incorrectas')) {
        errorMessage = 'Email o contraseña incorrectos';
        console.error('💡 Verificar email y contraseña');
      } else if (error.message.includes('Usuario no confirmado')) {
        errorMessage = 'Debes confirmar tu cuenta. Revisa tu email.';
        statusCode = 409;
        console.error('💡 Usuario necesita confirmar email');
      } else if (error.message.includes('configuración')) {
        errorMessage = 'Error de configuración. Contacta al administrador.';
        statusCode = 500;
        console.error('💡 Verificar configuración de Cognito');
      } else if (error.message.includes('Demasiados intentos')) {
        errorMessage = 'Demasiados intentos fallidos. Intenta más tarde.';
        statusCode = 429;
        console.error('💡 Rate limit alcanzado');
      } else if (error.message.includes('SECRET_HASH')) {
        errorMessage = 'Error de configuración de autenticación';
        statusCode = 500;
        console.error('💡 Verificar COGNITO_CLIENT_SECRET');
      } else {
        errorMessage = error.message;
      }
    }

    console.error('📤 Enviando respuesta de error:', { errorMessage, statusCode });
    
    return NextResponse.json(
      { 
        error: errorMessage,
        debug: process.env.NODE_ENV === 'development' ? {
          originalError: error.message,
          errorType: error.name
        } : undefined
      },
      { status: statusCode }
    );
  }
}