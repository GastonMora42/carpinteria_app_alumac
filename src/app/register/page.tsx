// src/app/register/page.tsx - Versión mejorada profesional y minimalista
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { registerSchema, type RegisterFormData } from '@/lib/validations/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HiOutlineEye, HiOutlineEyeOff, HiOutlineExclamationCircle, HiOutlineCheckCircle, HiOutlineArrowLeft } from 'react-icons/hi';

export default function RegisterPage() {
  const router = useRouter();
  
  const [formData, setFormData] = useState<RegisterFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (field: keyof RegisterFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpiar errores al escribir
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: '' }));
    }
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    setFieldErrors({});

    try {
      // Validar con Zod
      const validatedData = registerSchema.parse(formData);

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validatedData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error en el registro');
      }

      setSuccess(result.message);
      
      // Si necesita confirmación, redirigir a la página de confirmación
      if (result.needsConfirmation) {
        setTimeout(() => {
          router.push(`/confirm-signup?email=${encodeURIComponent(formData.email)}`);
        }, 2000);
      } else {
        // Si no necesita confirmación, redirigir al login
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      }

    } catch (error: any) {
      console.error('Error de registro:', error);
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
        setError(error.message || 'Error en el registro');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden">
      {/* Elementos geométricos de fondo */}
      <div className="absolute inset-0">
        <div className="absolute top-20 right-20 w-72 h-72 bg-gradient-to-br from-blue-100/30 to-slate-100/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-gradient-to-tr from-slate-100/20 to-blue-100/30 rounded-full blur-3xl"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(148,163,184,0.15)_1px,transparent_0)] bg-[length:24px_24px]"></div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          
          {/* Header con logo */}
          <div className="text-center">
            <Link href="/" className="inline-flex items-center mb-8 group">
              <HiOutlineArrowLeft className="h-5 w-5 text-slate-400 group-hover:text-slate-600 transition-colors mr-3" />
              <span className="text-slate-600 group-hover:text-slate-800 transition-colors font-medium">Volver al inicio</span>
            </Link>
            
            <div className="mb-8">
              <div className="w-20 h-20 mx-auto mb-6 relative group">
                <div ></div>
                <Image 
                  src="/alumac.webp" 
                  alt="ALUMAC Logo" 
                  width={80} 
                  height={80}
                  className="relative rounded-2xl shadow-xl"
                />
              </div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">ALUMAC</h1>
              <p className="text-slate-600 font-light">
                Crea tu cuenta y comienza a gestionar tu negocio
              </p>
            </div>
          </div>

          {/* Register Form */}
          <div className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-3xl shadow-2xl shadow-slate-200/50 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
            
            <div className="px-8 py-10">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Crear Cuenta</h2>
                <p className="text-slate-600 text-sm">Completa tus datos para comenzar</p>
              </div>

              {error && (
                <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4">
                  <div className="flex">
                    <HiOutlineExclamationCircle className="h-5 w-5 text-red-500 mt-0.5" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">{error}</h3>
                    </div>
                  </div>
                </div>
              )}

              {success && (
                <div className="mb-6 rounded-xl bg-green-50 border border-green-200 p-4">
                  <div className="flex">
                    <HiOutlineCheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800">{success}</h3>
                      <p className="text-sm text-green-700 mt-1">Redirigiendo...</p>
                    </div>
                  </div>
                </div>
              )}

              <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                  <Input
                    label="Nombre completo"
                    type="text"
                    autoComplete="name"
                    placeholder="Tu nombre completo"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    error={fieldErrors.name}
                    className="rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <Input
                    label="Correo electrónico"
                    type="email"
                    autoComplete="email"
                    placeholder="tu@email.com"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    error={fieldErrors.email}
                    className="rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                  />
                </div>

                <div className="relative">
                  <Input
                    label="Contraseña"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    error={fieldErrors.password}
                    helperText="Mínimo 8 caracteres con mayúscula, minúscula y número"
                    className="rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 pr-12"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 top-6 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <HiOutlineEyeOff className="h-5 w-5" />
                    ) : (
                      <HiOutlineEye className="h-5 w-5" />
                    )}
                  </button>
                </div>

                <div className="relative">
                  <Input
                    label="Confirmar contraseña"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                    error={fieldErrors.confirmPassword}
                    className="rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 pr-12"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 top-6 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <HiOutlineEyeOff className="h-5 w-5" />
                    ) : (
                      <HiOutlineEye className="h-5 w-5" />
                    )}
                  </button>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={isLoading || !!success}
                    className="w-full flex justify-center items-center py-4 px-6 border border-transparent rounded-xl text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/25"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creando cuenta...
                      </>
                    ) : (
                      'Crear Cuenta'
                    )}
                  </button>
                </div>
              </form>

              {/* Links */}
              <div className="mt-8 text-center space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-slate-500">¿Ya tienes cuenta?</span>
                  </div>
                </div>
                
                <Link 
                  href="/login" 
                  className="inline-flex items-center justify-center w-full py-3 px-6 border-2 border-slate-200 rounded-xl text-base font-medium text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 transform hover:scale-[1.02]"
                >
                  Iniciar sesión
                </Link>
              </div>
              
              {/* Términos y condiciones */}
              <div className="mt-6 text-center">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Al registrarte, aceptas nuestros{' '}
                  <a href="#" className="text-blue-600 hover:text-blue-500 font-medium underline underline-offset-2">
                    Términos de Servicio
                  </a>
                  {' '}y{' '}
                  <a href="#" className="text-blue-600 hover:text-blue-500 font-medium underline underline-offset-2">
                    Política de Privacidad
                  </a>
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-slate-500 space-y-1">
            <p>© {new Date().getFullYear()} ALUMAC. Todos los derechos reservados.</p>
            <p className="flex items-center justify-center">
              <svg className="w-3 h-3 mr-1 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Autenticación segura con AWS Cognito
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}