// src/lib/utils/http.ts - UTILIDADES PARA PETICIONES HTTP CON COOKIES
export interface FetchOptions extends RequestInit {
    data?: any;
  }
  
  /**
   * Wrapper para fetch que incluye automáticamente cookies y manejo de errores
   */
  export async function apiFetch(url: string, options: FetchOptions = {}) {
    const { data, ...fetchOptions } = options;
  
    // Configuración base para todas las peticiones
    const config: RequestInit = {
      credentials: 'include', // IMPORTANTE: Incluir cookies
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...fetchOptions,
    };
  
    // Si hay data, convertir a JSON y usar POST por defecto
    if (data) {
      config.body = JSON.stringify(data);
      if (!config.method) {
        config.method = 'POST';
      }
    }
  
    console.log(`🌐 API Request: ${config.method || 'GET'} ${url}`);
    console.log('📋 Request config:', {
      method: config.method,
      credentials: config.credentials,
      hasBody: !!config.body,
      headers: config.headers
    });
  
    try {
      const response = await fetch(url, config);
      
      console.log(`📡 API Response: ${response.status} ${response.statusText}`);
      
      // Si la respuesta no es ok, intentar extraer el error
      if (!response.ok) {
        let errorMessage = `Error ${response.status}: ${response.statusText}`;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          console.error('❌ API Error data:', errorData);
        } catch (parseError) {
          console.error('❌ Could not parse error response:', parseError);
        }
        
        throw new Error(errorMessage);
      }
  
      // Parsear respuesta JSON
      const responseData = await response.json();
      console.log('✅ API Success:', Object.keys(responseData));
      
      return responseData;
    } catch (error) {
      console.error(`❌ API Request failed for ${url}:`, error);
      throw error;
    }
  }
  
  /**
   * Métodos de conveniencia
   */
  export const api = {
    get: (url: string, options?: FetchOptions) => 
      apiFetch(url, { ...options, method: 'GET' }),
      
    post: (url: string, data?: any, options?: FetchOptions) => 
      apiFetch(url, { ...options, method: 'POST', data }),
      
    put: (url: string, data?: any, options?: FetchOptions) => 
      apiFetch(url, { ...options, method: 'PUT', data }),
      
    delete: (url: string, options?: FetchOptions) => 
      apiFetch(url, { ...options, method: 'DELETE' }),
  };
  
  /**
   * Hook para verificar estado de autenticación
   */
  export async function checkAuthStatus(): Promise<{ authenticated: boolean; user?: any }> {
    try {
      const user = await api.get('/api/auth/me');
      return { authenticated: true, user: user.user };
    } catch (error) {
      console.log('Usuario no autenticado:', error);
      return { authenticated: false };
    }
  }