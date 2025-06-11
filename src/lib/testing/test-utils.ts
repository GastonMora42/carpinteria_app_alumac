// src/lib/testing/test-utils.ts
/**
 * Utilidades para testing del sistema
 */

// Mock data para testing
export const mockUser = {
    id: 'test-user-1',
    email: 'test@alumgestion.com',
    name: 'Usuario Test',
    role: 'ADMIN' as const
  };
  
  export const mockCliente = {
    id: 'test-cliente-1',
    codigo: 'CLI-TEST-001',
    nombre: 'Cliente Test SA',
    email: 'cliente@test.com',
    telefono: '+54 11 1234-5678',
    direccion: 'Av. Test 1234',
    cuit: '30-12345678-9',
    activo: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  export const mockPresupuesto = {
    id: 'test-presupuesto-1',
    numero: 'PRES-TEST-001',
    clienteId: mockCliente.id,
    cliente: mockCliente,
    fechaEmision: new Date().toISOString(),
    fechaValidez: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    estado: 'PENDIENTE' as const,
    subtotal: 100000,
    descuento: 0,
    impuestos: 21000,
    total: 121000,
    moneda: 'PESOS' as const,
    descripcionObra: 'Obra de prueba',
    items: [
      {
        id: 'test-item-1',
        orden: 1,
        descripcion: 'Ventana 1x1',
        cantidad: 2,
        unidad: 'unidad',
        precioUnitario: 50000,
        total: 100000
      }
    ]
  };
  
  // src/lib/testing/validation-tests.ts
  /**
   * Tests de validación de schemas
   */
  
  import { clienteSchema } from '@/lib/validations/client';
  import { presupuestoSchema } from '@/lib/validations/presupuesto';
  import { transaccionSchema } from '@/lib/validations/transaccion';
  import { materialSchema } from '@/lib/validations/material';
  
  export function runValidationTests() {
    const results: { test: string; passed: boolean; error?: string }[] = [];
  
    // Test Cliente Schema
    try {
      clienteSchema.parse({
        nombre: 'Test Cliente',
        email: 'test@cliente.com',
        telefono: '+54 11 1234-5678',
        direccion: 'Dirección Test',
        cuit: '30-12345678-9',
        notas: 'Notas de prueba'
      });
      results.push({ test: 'Cliente Schema - Valid Data', passed: true });
    } catch (error) {
      results.push({ 
        test: 'Cliente Schema - Valid Data', 
        passed: false, 
        error: (error as Error).message 
      });
    }
  
    // Test Cliente Schema - Invalid Email
    try {
      clienteSchema.parse({
        nombre: 'Test Cliente',
        email: 'email-invalido',
        telefono: '+54 11 1234-5678'
      });
      results.push({ test: 'Cliente Schema - Invalid Email', passed: false, error: 'Should have failed' });
    } catch (error) {
      results.push({ test: 'Cliente Schema - Invalid Email', passed: true });
    }
  
    // Test Presupuesto Schema
    try {
      presupuestoSchema.parse({
        clienteId: 'test-client-id',
        fechaValidez: new Date(Date.now() + 24 * 60 * 60 * 1000),
        descripcionObra: 'Obra de prueba',
        moneda: 'PESOS',
        items: [
          {
            descripcion: 'Item test',
            cantidad: 1,
            unidad: 'unidad',
            precioUnitario: 1000,
            descuento: 0
          }
        ]
      });
      results.push({ test: 'Presupuesto Schema - Valid Data', passed: true });
    } catch (error) {
      results.push({ 
        test: 'Presupuesto Schema - Valid Data', 
        passed: false, 
        error: (error as Error).message 
      });
    }
  
    // Test Material Schema
    try {
      materialSchema.parse({
        codigo: 'MAT-001',
        nombre: 'Material Test',
        tipo: 'PERFIL',
        unidadMedida: 'metro',
        precioUnitario: 1500,
        moneda: 'PESOS',
        proveedorId: 'test-proveedor-id'
      });
      results.push({ test: 'Material Schema - Valid Data', passed: true });
    } catch (error) {
      results.push({ 
        test: 'Material Schema - Valid Data', 
        passed: false, 
        error: (error as Error).message 
      });
    }
  
    return results;
  }
  
  