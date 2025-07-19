import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedMediosPago() {
  console.log('🏦 Inicializando medios de pago...');

  const mediosPago = [
    { nombre: 'Efectivo', descripcion: 'Pago en efectivo' },
    { nombre: 'Transferencia Bancaria', descripcion: 'Transferencia bancaria' },
    { nombre: 'Cheque', descripcion: 'Pago con cheque' },
    { nombre: 'Tarjeta de Débito', descripcion: 'Pago con tarjeta de débito' },
    { nombre: 'Tarjeta de Crédito', descripcion: 'Pago con tarjeta de crédito' },
    { nombre: 'Mercado Pago', descripcion: 'Pago con Mercado Pago' },
    { nombre: 'Depósito Bancario', descripcion: 'Depósito en cuenta bancaria' },
    { nombre: 'Otro', descripcion: 'Otro medio de pago' }
  ];

  for (const medio of mediosPago) {
    await prisma.medioPago.upsert({
      where: { nombre: medio.nombre },
      update: {},
      create: medio
    });
  }

  console.log('✅ Medios de pago inicializados');
}

seedMediosPago()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
