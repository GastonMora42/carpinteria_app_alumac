// src/lib/testing/calculation-tests.ts
  /**
   * Tests de cálculos financieros
   */
  
  import { CalculationUtils, CurrencyUtils } from '@/lib/utils/calculations';
  
  export function runCalculationTests() {
    const results: { test: string; passed: boolean; expected: any; actual: any }[] = [];
  
    // Test: Cálculo de total de item
    const itemTotal = CalculationUtils.calculateItemTotal(10, 100, 10); // 10 unidades a $100 con 10% descuento
    results.push({
      test: 'Item Total Calculation',
      passed: itemTotal === 900,
      expected: 900,
      actual: itemTotal
    });
  
    // Test: Cálculo de totales de orden
    const orderTotals = CalculationUtils.calculateOrderTotals([
      { cantidad: 2, precioUnitario: 1000, descuento: 0 },
      { cantidad: 1, precioUnitario: 500, descuento: 10 }
    ], 5, 21); // 5% descuento general, 21% impuestos
  
    results.push({
      test: 'Order Totals Calculation - Subtotal',
      passed: orderTotals.subtotal === 2450,
      expected: 2450,
      actual: orderTotals.subtotal
    });
  
    // Test: Formateo de moneda
    const formattedAmount = CurrencyUtils.formatAmount(1234.56, 'PESOS');
    results.push({
      test: 'Currency Formatting',
      passed: formattedAmount.includes('1.234,56'),
      expected: 'Contains 1.234,56',
      actual: formattedAmount
    });
  
    // Test: Conversión de moneda
    const convertedAmount = CurrencyUtils.convertCurrency(100, 'DOLARES', 'PESOS', 1000);
    results.push({
      test: 'Currency Conversion',
      passed: convertedAmount === 100000,
      expected: 100000,
      actual: convertedAmount
    });
  
    // Test: Cálculo de saldo pendiente
    const pendingBalance = CalculationUtils.calculatePendingBalance(10000, 3000);
    results.push({
      test: 'Pending Balance Calculation',
      passed: pendingBalance === 7000,
      expected: 7000,
      actual: pendingBalance
    });
  
    return results;
  }
  
  