// src/lib/auth/cognito-verify.ts - Nueva función de verificación
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
  const idToken = req.cookies.get('cognito-id-token')?.value;
  
  if (!idToken) {
    throw new Error('Token de autenticación no encontrado');
  }

  try {
    // Verificar token con Cognito
    const cognitoUser = await cognitoAuth.verifyToken(idToken);
    
    // Buscar usuario en base de datos local
    const dbUser = await prisma.user.findUnique({
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

    if (!dbUser || !dbUser.activo) {
      throw new Error('Usuario no encontrado o inactivo');
    }

    return {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role,
      cognitoId: dbUser.cognitoId || cognitoUser.sub
    };
  } catch (error: any) {
    console.error('Error verificando token de Cognito:', error);
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
      throw new Error('Permisos insuficientes');
    }
    
    return user;
  };
}