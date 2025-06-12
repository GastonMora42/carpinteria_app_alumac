// src/app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const response = NextResponse.json({
      message: 'Sesión cerrada exitosamente'
    });

    // Limpiar todas las cookies de autenticación
    response.cookies.delete('cognito-id-token');
    response.cookies.delete('cognito-access-token');
    response.cookies.delete('cognito-refresh-token');

    return response;

  } catch (error: any) {
    console.error('Error en logout:', error);
    return NextResponse.json(
      { error: 'Error al cerrar sesión' },
      { status: 500 }
    );
  }
}

