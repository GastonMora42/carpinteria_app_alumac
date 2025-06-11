// src/lib/auth/verify.ts
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/db/prisma';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export async function verifyAuth(token?: string): Promise<AuthUser> {
  if (!token) {
    throw new Error('Token no proporcionado');
  }

  try {
    // Verificar el token JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret') as any;
    
    // Buscar el usuario en la base de datos
    const user = await prisma.user.findUnique({
      where: { email: decoded.email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        activo: true
      }
    });

    if (!user || !user.activo) {
      throw new Error('Usuario no encontrado o inactivo');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    };
  } catch (error) {
    throw new Error('Token inválido o expirado');
  }
}

// Función para generar token JWT (temporal hasta AWS Cognito)
export function generateToken(user: { email: string; name: string; role: string }): string {
  return jwt.sign(
    {
      email: user.email,
      name: user.name,
      role: user.role
    },
    process.env.JWT_SECRET || 'default-secret',
    { expiresIn: '7d' }
  );
}

// Función para verificar permisos por rol
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

// Middleware helper para rutas que requieren roles específicos
export function requireRole(requiredRole: string) {
  return async (token?: string) => {
    const user = await verifyAuth(token);
    
    if (!hasPermission(user.role, requiredRole)) {
      throw new Error('Permisos insuficientes');
    }
    
    return user;
  };
}