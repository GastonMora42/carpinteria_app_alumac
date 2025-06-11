
// ===================================

// src/app/api/auth/register/route.ts (temporal)
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { generateToken } from '@/lib/auth/verify';
import { registerSchema } from '@/lib/validations/auth';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password } = registerSchema.parse(body);

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'El email ya está registrado' },
        { status: 400 }
      );
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generar código único
    const userCount = await prisma.user.count();
    const codigo = `USR-${String(userCount + 1).padStart(3, '0')}`;

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        codigo,
        name,
        email,
        password: hashedPassword,
        role: userCount === 0 ? 'ADMIN' : 'USER' // Primer usuario es admin
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    });

    // Generar token
    const token = generateToken({
      email: user.email,
      name: user.name,
      role: user.role
    });

    return NextResponse.json({
      token,
      user
    }, { status: 201 });

  } catch (error) {
    console.error('Error en registro:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}