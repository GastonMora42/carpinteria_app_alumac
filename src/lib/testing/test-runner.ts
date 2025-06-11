// src/lib/testing/test-runner.ts

import { runCalculationTests } from "./calculation-tests";
import { runIntegrationTests } from "./integration-tests";
import { runValidationTests } from "./test-utils";

export async function runAllTests() {
  console.log('🧪 Ejecutando tests del sistema AlumGestión...\n');

  // Tests de validación
  console.log('📋 Tests de Validación:');
  const validationResults = runValidationTests();
  validationResults.forEach(result => {
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} ${result.test}`);
    if (!result.passed && result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });

  // Tests de cálculos
  console.log('\n🧮 Tests de Cálculos:');
  const calculationResults = runCalculationTests();
  calculationResults.forEach(result => {
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} ${result.test}`);
    if (!result.passed) {
      console.log(`   Esperado: ${result.expected}, Obtenido: ${result.actual}`);
    }
  });

  // Tests de integración
  console.log('\n🔗 Tests de Integración:');
  const integrationResults = await runIntegrationTests();
  integrationResults.forEach((result) => {
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} ${result.test}`);
    if (result.details) {
      console.log(`   ${result.details}`);
    }
  });

  // Resumen
  const allResults = [...validationResults, ...calculationResults, ...integrationResults];
  const passedTests = allResults.filter(r => r.passed).length;
  const totalTests = allResults.length;

  console.log(`\n📊 Resumen: ${passedTests}/${totalTests} tests pasaron`);
  
  if (passedTests === totalTests) {
    console.log('🎉 ¡Todos los tests pasaron exitosamente!');
  } else {
    console.log('⚠️  Algunos tests fallaron. Revisar los errores arriba.');
  }

  return {
    passed: passedTests,
    total: totalTests,
    success: passedTests === totalTests
  };
}

// Ejecutar tests si se llama directamente
if (require.main === module) {
  runAllTests().catch(console.error);
}