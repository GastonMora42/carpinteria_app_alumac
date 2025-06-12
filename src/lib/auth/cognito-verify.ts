// src/lib/auth/cognito-verify.ts - CORREGIDO
import { NextRequest } from 'next/server';
import { cognitoAuth, CognitoUser } from './cognito';
import { prisma } from '@/lib/db/prisma';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  cognitoId: string;
}

/**
 * Verifica tokens de Cognito desde cookies HTTP-only
 */
export async function verifyCognitoAuth(req: NextRequest): Promise<AuthUser> {
  console.log('🔍 Iniciando verificación de autenticación Cognito...');
  
  const idToken = req.cookies.get('cognito-id-token')?.value;
  
  if (!idToken) {
    console.error('❌ Token de autenticación no encontrado en cookies');
    throw new Error('Token de autenticación no encontrado');
  }

  console.log('🍪 Token encontrado en cookies');

  try {
    // Verificar token con Cognito
    console.log('🔐 Verificando token con Cognito...');
    const cognitoUser = await cognitoAuth.verifyToken(idToken);
    console.log('✅ Token verificado exitosamente:', cognitoUser.email);
    
    // Buscar usuario en base de datos local
    console.log('🗄️ Buscando usuario en BD local...');
    let dbUser = await prisma.user.findUnique({
      where: { email: cognitoUser.email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        activo: true,
        cognitoId: true
      }
    });

    if (!dbUser) {
      console.log('⚠️ Usuario no encontrado en BD, creando nuevo...');
      // Crear usuario si no existe
      const userCount = await prisma.user.count();
      const codigo = `USR-${String(userCount + 1).padStart(3, '0')}`;
      
      dbUser = await prisma.user.create({
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
          email: true,
          name: true,
          role: true,
          activo: true,
          cognitoId: true
        }
      });
      console.log('✅ Usuario creado en BD:', dbUser.id);
    }

    if (!dbUser.activo) {
      console.error('❌ Usuario encontrado pero está inactivo:', dbUser.id);
      throw new Error('Usuario no encontrado o inactivo');
    }

    // Actualizar cognitoId si es necesario
    if (dbUser.cognitoId !== cognitoUser.sub) {
      console.log('🔄 Actualizando cognitoId en BD...');
      await prisma.user.update({
        where: { id: dbUser.id },
        data: { cognitoId: cognitoUser.sub }
      });
    }

    console.log('✅ Autenticación exitosa para usuario:', dbUser.email);

    return {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role,
      cognitoId: dbUser.cognitoId || cognitoUser.sub
    };
  } catch (error: any) {
    console.error('❌ Error verificando token de Cognito:', error);
    
    // Manejar diferentes tipos de errores
    if (error.message?.includes('Token expirado')) {
      throw new Error('Token expirado - relogin requerido');
    } else if (error.message?.includes('decodificar')) {
      throw new Error('Token inválido - formato incorrecto');
    } else if (error.message?.includes('Usuario no encontrado')) {
      throw new Error('Usuario no autorizado');
    }
    
    throw new Error('Token inválido o expirado');
  }
}

/**
 * Función helper para verificar permisos por rol
 */
export function hasPermission(userRole: string, requiredRole: string): boolean {
  const roleHierarchy = {
    'ADMIN': 3,
    'MANAGER': 2,
    'USER': 1
  };

  const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0;
  const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;

  return userLevel >= requiredLevel;
}

/**
 * Middleware helper para rutas que requieren roles específicos
 */
export function requireRole(requiredRole: string) {
  return async (req: NextRequest) => {
    const user = await verifyCognitoAuth(req);
    
    if (!hasPermission(user.role, requiredRole)) {
      console.error(`❌ Permisos insuficientes - Usuario: ${user.role}, Requerido: ${requiredRole}`);
      throw new Error('Permisos insuficientes');
    }
    
    return user;
  };
}

/**
 * Helper para obtener usuario actual desde el request
 */
export async function getCurrentUser(req: NextRequest): Promise<AuthUser | null> {
  try {
    return await verifyCognitoAuth(req);
  } catch (error) {
    console.log('ℹ️ No hay usuario autenticado:', error);
    return null;
  }
}