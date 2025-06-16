// src/app/login/page.tsx - CORREGIDO PARA VERCEL DEPLOY
'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { loginSchema, type LoginFormData } from '@/lib/validations/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HiOutlineEye, HiOutlineEyeOff, HiOutlineExclamationCircle, HiOutlineInformationCircle } from 'react-icons/hi';

// Componente separado que usa useSearchParams
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('from') || '/dashboard';
  const expired = searchParams.get('expired');
  
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  const handleChange = (field: keyof LoginFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpiar errores al escribir
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: '' }));
    }
    if (error) {
      setError(null);
      setNeedsConfirmation(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setFieldErrors({});
    setNeedsConfirmation(false);

    try {
      // Validar con Zod
      const validatedData = loginSchema.parse(formData);

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validatedData),
      });

      const result = await response.json();

      if (!response.ok) {
        // Manejar casos específicos
        if (response.status === 409) {
          // Usuario no confirmado
          setNeedsConfirmation(true);
          setError('Tu cuenta no está confirmada. Revisa tu email o confirma tu cuenta manualmente.');
          return;
        }
        
        if (response.status === 429) {
          setError('Demasiados intentos fallidos. Intenta nuevamente en unos minutos.');
          return;
        }

        // Error general
        throw new Error(result.error || 'Error al iniciar sesión');
      }

      // Login exitoso
      console.log('Login exitoso:', result);
      
      // Redireccionar al dashboard o página solicitada
      router.push(redirectUrl);
      router.refresh(); // Forzar actualización del middleware
      
    } catch (error: any) {
      console.error('Error de login:', error);
      
      if (error.errors) {
        // Errores de validación de Zod
        const errors: Record<string, string> = {};
        error.errors.forEach((err: any) => {
          if (err.path?.[0]) {
            errors[err.path[0]] = err.message;
          }
        });
        setFieldErrors(errors);
      } else {
        setError(error.message || 'Error al iniciar sesión');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendConfirmation = () => {
    // Redirigir a página de confirmación con el email
    router.push(`/confirm-signup?email=${encodeURIComponent(formData.email)}`);
  };

  return (
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

      {/* Alertas */}
      {expired && (
        <div className="rounded-md bg-yellow-50 p-4">
          <div className="flex">
            <HiOutlineExclamationCircle className="h-5 w-5 text-yellow-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Tu sesión ha expirado. Por favor, inicia sesión nuevamente.
              </h3>
            </div>
          </div>
        </div>
      )}

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

          {needsConfirmation && (
            <div className="mb-4 rounded-md bg-blue-50 p-4">
              <div className="flex">
                <HiOutlineInformationCircle className="h-5 w-5 text-blue-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Confirmación requerida</h3>
                  <p className="mt-1 text-sm text-blue-700">
                    Necesitas confirmar tu cuenta antes de iniciar sesión.
                  </p>
                  <div className="mt-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleResendConfirmation}
                    >
                      Ir a confirmación
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <Input
                label="Email"
                type="email"
                autoComplete="email"
                placeholder="tu@email.com"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                error={fieldErrors.email}
              />
            </div>

            <div className="relative">
              <Input
                label="Contraseña"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                error={fieldErrors.password}
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
                disabled={needsConfirmation}
              >
                {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </Button>
            </div>
          </form>

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
        <p className="mt-1">Autenticación segura con AWS Cognito.</p>
      </div>
    </div>
  );
}

// Componente de carga para el Suspense
function LoadingFallback() {
  return (
    <div className="max-w-md w-full space-y-8">
      <div className="text-center">
        <div className="mx-auto h-20 w-20 bg-gray-200 rounded-full flex items-center justify-center mb-4 animate-pulse">
          <span className="text-gray-400 text-2xl font-bold">AG</span>
        </div>
        <h2 className="text-3xl font-extrabold text-gray-900">
          AlumGestión
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Cargando...
        </p>
      </div>

      <Card className="shadow-lg">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Componente principal de la página
export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <Suspense fallback={<LoadingFallback />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}