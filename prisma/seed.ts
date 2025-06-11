// ===================================

// prisma/seed.ts - Archivo para crear datos iniciales
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seeding...');

  // Crear usuario administrador
  const hashedPassword = await bcrypt.hash('admin123', 12);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@alumgestion.com' },
    update: {},
    create: {
      codigo: 'USR-001',
      email: 'admin@alumgestion.com',
      name: 'Administrador',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  console.log('✅ Usuario admin creado:', admin.email);

  // Crear medios de pago básicos
  const mediosPago = [
    { nombre: 'Efectivo', descripcion: 'Pago en efectivo' },
    { nombre: 'Transferencia Bancaria', descripcion: 'Transferencia electrónica' },
    { nombre: 'Cheque', descripcion: 'Pago con cheque' },
    { nombre: 'Tarjeta de Débito', descripcion: 'Pago con tarjeta de débito' },
    { nombre: 'Tarjeta de Crédito', descripcion: 'Pago con tarjeta de crédito' },
  ];

  for (const medio of mediosPago) {
    await prisma.medioPago.upsert({
      where: { nombre: medio.nombre },
      update: {},
      create: medio,
    });
  }

  console.log('✅ Medios de pago creados');

  // Crear configuraciones básicas
  const configuraciones = [
    { clave: 'cotizacion_dolar', valor: '1250.00', tipo: 'number', grupo: 'contabilidad' },
    { clave: 'iva_defecto', valor: '21', tipo: 'number', grupo: 'contabilidad' },
    { clave: 'dias_validez_presupuesto', valor: '30', tipo: 'number', grupo: 'general' },
    { clave: 'empresa_nombre', valor: 'Mi Empresa de Aluminio', tipo: 'string', grupo: 'general' },
    { clave: 'empresa_cuit', valor: '20-12345678-9', tipo: 'string', grupo: 'general' },
  ];

  for (const config of configuraciones) {
    await prisma.configuracion.upsert({
      where: { clave: config.clave },
      update: {},
      create: config,
    });
  }

  console.log('✅ Configuraciones creadas');

  // Crear cliente de ejemplo
  const clienteEjemplo = await prisma.cliente.upsert({
    where: { codigo: 'CLI-001' },
    update: {},
    create: {
      codigo: 'CLI-001',
      nombre: 'Cliente Ejemplo S.A.',
      email: 'cliente@ejemplo.com',
      telefono: '+54 11 1234-5678',
      direccion: 'Av. Ejemplo 1234, CABA',
      cuit: '20-87654321-0',
      notas: 'Cliente de ejemplo para testing',
    },
  });

  console.log('✅ Cliente ejemplo creado:', clienteEjemplo.nombre);

  // Crear proveedor de ejemplo
  const proveedorEjemplo = await prisma.proveedor.upsert({
    where: { codigo: 'PROV-001' },
    update: {},
    create: {
      codigo: 'PROV-001',
      nombre: 'Proveedor Aluminio S.R.L.',
      email: 'ventas@proveedor.com',
      telefono: '+54 11 9876-5432',
      direccion: 'Zona Industrial, Buenos Aires',
      cuit: '30-11223344-5',
    },
  });

  console.log('✅ Proveedor ejemplo creado:', proveedorEjemplo.nombre);

  // Crear materiales de ejemplo
  const materiales = [
    {
      codigo: 'ALU-001',
      nombre: 'Perfil de Aluminio 40x40',
      descripcion: 'Perfil cuadrado de aluminio 40x40mm',
      tipo: 'PERFIL',
      unidadMedida: 'metro',
      precioUnitario: 1500.00,
      moneda: 'PESOS',
      stockActual: 100,
      stockMinimo: 20,
      proveedorId: proveedorEjemplo.id,
    },
    {
      codigo: 'VID-001',
      nombre: 'Vidrio 4mm Transparente',
      descripcion: 'Vidrio float transparente 4mm',
      tipo: 'VIDRIO',
      unidadMedida: 'm2',
      precioUnitario: 2800.00,
      moneda: 'PESOS',
      stockActual: 50,
      stockMinimo: 10,
      proveedorId: proveedorEjemplo.id,
    },
    {
      codigo: 'ACC-001',
      nombre: 'Bisagra Reforzada',
      descripcion: 'Bisagra reforzada para ventanas',
      tipo: 'ACCESORIO',
      unidadMedida: 'unidad',
      precioUnitario: 850.00,
      moneda: 'PESOS',
      stockActual: 200,
      stockMinimo: 50,
      proveedorId: proveedorEjemplo.id,
    },
  ];

  for (const material of materiales) {
    await prisma.material.upsert({
      where: { codigo: material.codigo },
      update: {},
      create: material,
    });
  }

  console.log('✅ Materiales ejemplo creados');

  console.log('🎉 Seeding completado!');
  console.log('');
  console.log('📧 Usuario admin: admin@alumgestion.com');
  console.log('🔑 Contraseña: admin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });