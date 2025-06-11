// ===================================
  
  // src/lib/utils/validators.ts
  export class ValidationUtils {
    /**
     * Valida email
     */
    static isValidEmail(email: string): boolean {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    }
  
    /**
     * Valida CUIT argentino
     */
    static isValidCUIT(cuit: string): boolean {
      const cleanCuit = cuit.replace(/[^0-9]/g, '');
      if (cleanCuit.length !== 11) return false;
      
      // Algoritmo de validación de CUIT
      const mult = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
      let total = 0;
      
      for (let i = 0; i < 10; i++) {
        total += parseInt(cleanCuit[i]) * mult[i];
      }
      
      const resto = total % 11;
      const digitoVerificador = resto < 2 ? resto : 11 - resto;
      
      return digitoVerificador === parseInt(cleanCuit[10]);
    }
  
    /**
     * Valida teléfono argentino
     */
    static isValidPhone(phone: string): boolean {
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      // Acepta formatos como: +54911xxxxxxx, 011xxxxxxx, 911xxxxxxx
      return cleanPhone.length >= 8 && cleanPhone.length <= 13;
    }
  
    /**
     * Valida número de documento
     */
    static isValidDNI(dni: string): boolean {
      const cleanDni = dni.replace(/[^0-9]/g, '');
      return cleanDni.length >= 7 && cleanDni.length <= 8;
    }
  
    /**
     * Valida código postal argentino
     */
    static isValidPostalCode(postalCode: string): boolean {
      const cleanCode = postalCode.replace(/[^0-9A-Za-z]/g, '');
      return cleanCode.length === 4 || cleanCode.length === 8; // NNNN o ANNNNANN
    }
  }
  
  // ===================================
  
  // src/lib/constants/index.ts
  export const APP_CONFIG = {
    name: 'AlumGestión',
    version: '1.0.0',
    description: 'Sistema de Gestión para Carpintería de Aluminio'
  };
  
  export const CURRENCIES = {
    PESOS: { code: 'ARS', symbol: '$', name: 'Pesos Argentinos' },
    DOLARES: { code: 'USD', symbol: 'US$', name: 'Dólares Estadounidenses' }
  };
  
  export const ESTADOS_PRESUPUESTO = {
    BORRADOR: { label: 'Borrador', color: 'gray' },
    PENDIENTE: { label: 'Pendiente', color: 'yellow' },
    ENVIADO: { label: 'Enviado', color: 'blue' },
    APROBADO: { label: 'Aprobado', color: 'green' },
    RECHAZADO: { label: 'Rechazado', color: 'red' },
    VENCIDO: { label: 'Vencido', color: 'orange' },
    CONVERTIDO: { label: 'Convertido', color: 'purple' }
  };
  
  export const ESTADOS_PEDIDO = {
    BORRADOR: { label: 'Borrador', color: 'gray' },
    PENDIENTE: { label: 'Pendiente', color: 'yellow' },
    CONFIRMADO: { label: 'Confirmado', color: 'blue' },
    EN_PROCESO: { label: 'En Proceso', color: 'indigo' },
    EN_PRODUCCION: { label: 'En Producción', color: 'purple' },
    LISTO_ENTREGA: { label: 'Listo para Entrega', color: 'green' },
    ENTREGADO: { label: 'Entregado', color: 'emerald' },
    FACTURADO: { label: 'Facturado', color: 'teal' },
    COBRADO: { label: 'Cobrado', color: 'green' },
    CANCELADO: { label: 'Cancelado', color: 'red' }
  };
  
  export const TIPOS_MATERIAL = {
    PERFIL: { label: 'Perfil', icon: '🔧' },
    VIDRIO: { label: 'Vidrio', icon: '🪟' },
    ACCESORIO: { label: 'Accesorio', icon: '🔩' },
    HERRAMIENTAS: { label: 'Herramientas', icon: '🛠️' },
    INSUMOS: { label: 'Insumos', icon: '📦' },
    OTRO: { label: 'Otro', icon: '📋' }
  };
  
  export const ROLES_USUARIO = {
    ADMIN: { label: 'Administrador', permissions: ['all'] },
    MANAGER: { label: 'Gerente', permissions: ['read', 'write', 'approve'] },
    USER: { label: 'Usuario', permissions: ['read', 'write'] }
  };