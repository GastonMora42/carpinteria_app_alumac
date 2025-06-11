import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

// Schema de validación
const clienteSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  email: z.string().email().optional().nullable(),
  telefono: z.string().optional().nullable(),
  direccion: z.string().optional().nullable(),
  notas: z.string().optional().nullable(),
});

// GET - Listar todos los clientes
export async function GET() {
  try {
    const clientes = await prisma.cliente.findMany({
      orderBy: { nombre: 'asc' },
    });
    return NextResponse.json(clientes);
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    return NextResponse.json(
      { error: 'Error al obtener clientes' },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo cliente
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validar datos
    const validatedData = clienteSchema.parse(body);
    
    // Crear cliente
    const cliente = await prisma.cliente.create({
      data: validatedData,
    });
    
    return NextResponse.json(cliente, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error al crear cliente:', error);
    return NextResponse.json(
      { error: 'Error al crear cliente' },
      { status: 500 }
    );
  }
}