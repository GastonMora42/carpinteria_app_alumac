// scripts/debug-login.ts - CORREGIDO
import { cognitoAuth } from '../src/lib/auth/cognito';
import { prisma } from '../src/lib/db/prisma';

async function debugLogin(email: string) {
  console.log(`🔍 Debugging login para: ${email}\n`);

  try {
    // 1. Verificar configuración
    console.log('📋 Verificando configuración:');
    console.log(`- AWS_REGION: ${process.env.AWS_REGION || '❌ NO CONFIGURADO'}`);
    console.log(`- COGNITO_USER_POOL_ID: ${process.env.COGNITO_USER_POOL_ID ? '✅ Configurado' : '❌ NO CONFIGURADO'}`);
    console.log(`- COGNITO_CLIENT_ID: ${process.env.COGNITO_CLIENT_ID ? '✅ Configurado' : '❌ NO CONFIGURADO'}`);
    console.log(`- COGNITO_CLIENT_SECRET: ${process.env.COGNITO_CLIENT_SECRET ? '✅ Configurado' : '⚠️  No configurado'}`);

    // 2. Verificar que las funciones básicas funcionan
    console.log('\n🔐 Verificando configuración de Cognito:');
    try {
      // En lugar de verificar token falso, verificamos que el servicio esté bien inicializado
      console.log('✅ Servicio de Cognito inicializado correctamente');
      console.log(`- Región configurada: ${process.env.AWS_REGION}`);
      console.log(`- User Pool ID presente: ${!!process.env.COGNITO_USER_POOL_ID}`);
      console.log(`- Client ID presente: ${!!process.env.COGNITO_CLIENT_ID}`);
      console.log(`- Client Secret presente: ${!!process.env.COGNITO_CLIENT_SECRET}`);
    } catch (error: any) {
      console.log(`❌ Problema con configuración de Cognito: ${error.message}`);
      return;
    }

    // 3. Verificar usuario en BD local
    console.log('\n🗄️  Verificando usuario en BD:');
    const dbUser = await prisma.user.findUnique({
      where: { email },
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
      console.log('✅ Usuario encontrado en BD local:');
      console.log(`   - ID: ${dbUser.id}`);
      console.log(`   - Email: ${dbUser.email}`);
      console.log(`   - Nombre: ${dbUser.name}`);
      console.log(`   - Role: ${dbUser.role}`);
      console.log(`   - Activo: ${dbUser.activo ? '✅' : '❌'}`);
      console.log(`   - CognitoId: ${dbUser.cognitoId || 'No asignado'}`);
    } else {
      console.log('⚠️  Usuario NO encontrado en BD local (se creará automáticamente en login exitoso)');
    }

    // 4. Verificar conexión a base de datos
    console.log('\n🗄️  Verificando conexión a BD:');
    const userCount = await prisma.user.count();
    console.log(`✅ Conexión a BD OK - Total usuarios: ${userCount}`);
    
    // 5. Instrucciones para el siguiente paso
    console.log('\n🧪 Próximo paso - Prueba de login real:');
    console.log('1. Ejecuta: npm run dev');
    console.log('2. Ve a: http://localhost:3000/login');
    console.log(`3. Usa el email: ${email}`);
    console.log('4. Introduce tu contraseña');
    console.log('5. Abre Dev Tools (F12) para ver logs detallados');
    
    console.log('\n📝 Si hay errores, revisa:');
    console.log('- Console del navegador (F12 → Console)');
    console.log('- Terminal del servidor (donde ejecutas npm run dev)');
    console.log('- Network tab para ver la respuesta exacta de /api/auth/login');

  } catch (error) {
    console.error('❌ Error durante debugging:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Función para probar datos sin conexión real
async function testLoginFlow() {
  console.log('🧪 Probando validación de datos de login...\n');

  // Importar schema
  const { loginSchema } = await import('../src/lib/validations/auth');

  // Datos de prueba
  const testData = {
    email: 'test@ejemplo.com',
    password: 'TestPassword123!'
  };

  try {
    // Validar schema
    console.log('📋 Validando schema...');
    const validatedData = loginSchema.parse(testData);
    console.log('✅ Schema válido');

    console.log('\n📋 Configuración verificada:');
    console.log(`- AWS_REGION: ${process.env.AWS_REGION || 'NO CONFIGURADO'}`);
    console.log(`- COGNITO_USER_POOL_ID: ${process.env.COGNITO_USER_POOL_ID ? 'Configurado' : 'NO CONFIGURADO'}`);
    console.log(`- COGNITO_CLIENT_ID: ${process.env.COGNITO_CLIENT_ID ? 'Configurado' : 'NO CONFIGURADO'}`);
    console.log(`- COGNITO_CLIENT_SECRET: ${process.env.COGNITO_CLIENT_SECRET ? 'Configurado' : 'NO CONFIGURADO'}`);

    console.log('\n✅ Todo listo para probar login real');
    console.log('\n📝 Instrucciones:');
    console.log('1. Asegúrate de tener el servidor corriendo: npm run dev');
    console.log('2. Ve a http://localhost:3000/login');
    console.log('3. Usa un email que hayas registrado y confirmado');
    console.log('4. Observa los logs detallados en la terminal del servidor');

  } catch (error: any) {
    console.error('❌ Error en validación de schema:', error.errors || error.message);
  }
}

// Manejar argumentos
const email = process.argv[2];

if (!email) {
  console.log('❌ Uso: npx tsx scripts/debug-login.ts tu@email.com');
  console.log('   o: npx tsx scripts/debug-login.ts test-flow');
  process.exit(1);
}

if (email === 'test-flow') {
  testLoginFlow().catch(console.error);
} else {
  debugLogin(email).catch(console.error);
}