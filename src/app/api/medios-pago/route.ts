// 4. CREAR API PARA MEDIOS DE PAGO
// src/app/api/medios-pago/route.ts - NUEVO ARCHIVO

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyCognitoAuth } from '@/lib/auth/cognito-verify';

export async function GET(req: NextRequest) {
  try {
    const user = await verifyCognitoAuth(req);
    
    console.log('🏦 Fetching medios de pago...');
    
    const mediosPago = await prisma.medioPago.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
      select: { id: true, nombre: true, descripcion: true }
    });
    
    console.log('✅ Medios de pago fetched:', mediosPago.length);
    
    return NextResponse.json({
      data: mediosPago
    });
  } catch (error: any) {
    console.error('❌ Error fetching medios de pago:', error);
    
    if (error.message?.includes('Token') || error.message?.includes('autenticación')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error al obtener medios de pago' },
      { status: 500 }
    );
  }
}