// src/app/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { loginSchema, type LoginFormData } from '@/lib/validations/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HiOutlineEye, HiOutlineEyeOff, HiOutlineExclamationCircle } from 'react-icons/hi';
import { ZodObject, ZodString, ZodTypeAny } from 'zod';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('from') || '/dashboard';
  
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al iniciar sesión');
      }

      // Guardar token en cookies
      document.cookie = `token=${result.token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=strict`;
      
      // Guardar datos del usuario en localStorage (opcional)
      localStorage.setItem('user', JSON.stringify(result.user));
      
      // Redireccionar
      router.push(redirectUrl);
    } catch (error) {
      console.error('Error de login:', error);
      setError(error instanceof Error ? error.message : 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-20 w-20 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <span className="text-white text-2xl font-bold">AG</span>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">
            AlumGestión
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sistema de Gestión para Carpintería de Aluminio
          </p>
        </div>

        {/* Login Form */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-center text-xl">Iniciar Sesión</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 rounded-md bg-red-50 p-4">
                <div className="flex">
                  <HiOutlineExclamationCircle className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">{error}</h3>
                  </div>
                </div>
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <Input
                  label="Email"
                  type="email"
                  autoComplete="email"
                  placeholder="admin@alumgestion.com"
                  error={errors.email?.message}
                  {...register('email')}
                />
              </div>

              <div className="relative">
                <Input
                  label="Contraseña"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  error={errors.password?.message}
                  {...register('password')}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 top-6 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <HiOutlineEyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <HiOutlineEye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>

              <div>
                <Button
                  type="submit"
                  loading={isLoading}
                  className="w-full"
                  size="lg"
                >
                  {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                </Button>
              </div>
            </form>

            {/* Demo Credentials */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Credenciales de Demo:</h4>
              <div className="text-sm text-blue-700 space-y-1">
                <p><strong>Email:</strong> admin@alumgestion.com</p>
                <p><strong>Contraseña:</strong> admin123</p>
              </div>
            </div>

            {/* Links */}
            <div className="mt-6 text-center space-y-2">
              <Link 
                href="/forgot-password" 
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                ¿Olvidaste tu contraseña?
              </Link>
              <div className="text-sm text-gray-600">
                ¿No tienes cuenta?{' '}
                <Link href="/register" className="text-blue-600 hover:text-blue-500">
                  Regístrate aquí
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500">
          <p>© 2024 AlumGestión. Todos los derechos reservados.</p>
          <p className="mt-1">Sistema desarrollado para carpinterías de aluminio.</p>
        </div>
      </div>
    </div>
  );
}

function useForm<T>(arg0: { resolver: any; }): { register: any; handleSubmit: any; formState: { errors: any; }; } {
  throw new Error('Function not implemented.');
}


function zodResolver(loginSchema: ZodObject<{ email: ZodString; password: ZodString; }, "strip", ZodTypeAny, { email: string; password: string; }, { email: string; password: string; }>) {
  throw new Error('Function not implemented.');
}
