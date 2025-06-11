import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAuth } from './src/lib/auth';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  
  // Rutas públicas que no requieren autenticación
  const publicPaths = ['/login', '/register', '/forgot-password', '/api/auth'];
  const isPublicPath = publicPaths.some(path => 
    request.nextUrl.pathname === path || 
    request.nextUrl.pathname.startsWith(path + '/')
  );

  if (isPublicPath) {
    // Si ya está autenticado y trata de acceder a una ruta pública, redirigir al dashboard
    if (token) {
      try {
        await verifyAuth(token);
        return NextResponse.redirect(new URL('/dashboard', request.url));
      } catch (error) {
        // Token inválido, continuar con la ruta pública
      }
    }
    return NextResponse.next();
  }

  // Verificar autenticación para rutas protegidas
  if (!token) {
    const url = new URL('/login', request.url);
    url.searchParams.set('from', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  try {
    await verifyAuth(token);
    return NextResponse.next();
  } catch (error) {
    // Token inválido o expirado
    const url = new URL('/login', request.url);
    url.searchParams.set('from', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: [
    // Rutas que requieren autenticación
    '/dashboard/:path*',
    '/clientes/:path*',
    '/pedidos/:path*',
    '/finanzas/:path*',
    '/inventario/:path*',
    '/api/:path*',
    // Rutas públicas (para redirigir si ya está autenticado)
    '/login',
    '/register',
    '/forgot-password'
  ],
};