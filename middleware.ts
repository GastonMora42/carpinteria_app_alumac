// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { cognitoAuth } from './src/lib/auth/cognito';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Rutas públicas que no requieren autenticación
  const publicPaths = ['/login', '/register', '/forgot-password', '/confirm-signup', '/api/auth'];
  const isPublicPath = publicPaths.some(path => 
    pathname === path || pathname.startsWith(path + '/')
  );

  // Obtener tokens de las cookies
  const idToken = request.cookies.get('cognito-id-token')?.value;
  const accessToken = request.cookies.get('cognito-access-token')?.value;

  if (isPublicPath) {
    // Si ya está autenticado y trata de acceder a una ruta pública, redirigir al dashboard
    if (idToken && accessToken) {
      try {
        await cognitoAuth.verifyToken(idToken);
        return NextResponse.redirect(new URL('/dashboard', request.url));
      } catch (error) {
        // Token inválido, limpiar cookies y continuar
        const response = NextResponse.next();
        response.cookies.delete('cognito-id-token');
        response.cookies.delete('cognito-access-token');
        response.cookies.delete('cognito-refresh-token');
        return response;
      }
    }
    return NextResponse.next();
  }

  // Verificar autenticación para rutas protegidas
  if (!idToken || !accessToken) {
    const url = new URL('/login', request.url);
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  try {
    // Verificar que el token es válido
    await cognitoAuth.verifyToken(idToken);
    return NextResponse.next();
  } catch (error) {
    console.error('Token verification failed:', error);
    
    // Token inválido o expirado, limpiar cookies y redirigir
    const url = new URL('/login', request.url);
    url.searchParams.set('from', pathname);
    url.searchParams.set('expired', 'true');
    
    const response = NextResponse.redirect(url);
    response.cookies.delete('cognito-id-token');
    response.cookies.delete('cognito-access-token');
    response.cookies.delete('cognito-refresh-token');
    
    return response;
  }
}

export const config = {
  matcher: [
    // Rutas que requieren autenticación
    '/dashboard/:path*',
    '/clientes/:path*',
    '/pedidos/:path*',
    '/ventas/:path*',
    '/presupuestos/:path*',
    '/finanzas/:path*',
    '/materiales/:path*',
    '/inventario/:path*',
    '/reportes/:path*',
    '/configuracion/:path*',
    '/api/clientes/:path*',
    '/api/presupuestos/:path*',
    '/api/ventas/:path*',
    '/api/transacciones/:path*',
    '/api/dashboard/:path*',
    // Rutas públicas (para redirigir si ya está autenticado)
    '/login',
    '/register',
    '/forgot-password',
    '/confirm-signup'
  ],
};