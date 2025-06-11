// src/lib/testing/api-tests.ts
  /**
   * Tests básicos de API endpoints
   */
  
  export async function testApiEndpoints(baseUrl: string = 'http://localhost:3000') {
    const results: { endpoint: string; method: string; status: number; passed: boolean }[] = [];
  
    const endpoints = [
      { path: '/api/clientes', method: 'GET' },
      { path: '/api/presupuestos', method: 'GET' },
      { path: '/api/ventas', method: 'GET' },
      { path: '/api/transacciones', method: 'GET' },
      { path: '/api/dashboard', method: 'GET' }
    ];
  
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${baseUrl}${endpoint.path}`, {
          method: endpoint.method,
          headers: {
            'Content-Type': 'application/json',
            // Incluir token de prueba si es necesario
            'Cookie': 'token=test-token'
          }
        });
  
        results.push({
          endpoint: endpoint.path,
          method: endpoint.method,
          status: response.status,
          passed: response.status < 500 // Considerar exitoso si no es error de servidor
        });
      } catch (error) {
        results.push({
          endpoint: endpoint.path,
          method: endpoint.method,
          status: 0,
          passed: false
        });
      }
    }
  
    return results;
  }
  
  