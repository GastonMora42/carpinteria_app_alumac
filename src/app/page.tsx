// src/app/page.tsx - Versión mejorada profesional y minimalista
import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden">
      {/* Elementos geométricos sutiles de fondo */}
      <div className="absolute inset-0">
        <div className="absolute top-20 right-20 w-72 h-72 bg-gradient-to-br from-blue-100/30 to-slate-100/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-gradient-to-tr from-slate-100/20 to-blue-100/30 rounded-full blur-3xl"></div>
        
        {/* Grid pattern sutil */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(148,163,184,0.15)_1px,transparent_0)] bg-[length:24px_24px]"></div>
      </div>

      {/* Contenido principal */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-lg w-full mx-auto">
          
          {/* Contenedor principal con glassmorphism mejorado */}
          <div className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-3xl shadow-2xl shadow-slate-200/50 p-10 md:p-12 text-center relative overflow-hidden">
            
            {/* Efecto de brillo sutil */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
            
            {/* Logo mejorado */}
            <div className="mb-8">
              <div className="w-24 h-24 mx-auto relative group mb-6">
                <div ></div>
                <Image
                  src="/alumac.webp"
                  alt="ALUMAC Logo"
                  width={96}
                  height={96}
                  className="relative rounded-2xl shadow-xl"
                  priority
                />
                {/* Efecto de luz */}
                <div className="absolute -inset-2 bg-gradient-to-br from-blue-400/20 to-blue-600/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            </div>

            {/* Título principal mejorado */}
            <div className="mb-10">
              <h1 className="text-4xl font-bold text-slate-800 mb-3 tracking-tight">
                ALUMAC
              </h1>
              <div className="w-16 h-1 bg-gradient-to-r from-blue-500 to-blue-600 mx-auto rounded-full mb-4"></div>
              <p className="text-xl text-slate-600 font-light leading-relaxed">
                Sistema Integral de Gestión
                <br />
                <span className="text-lg text-slate-500">para Carpintería de Aluminio</span>
              </p>
            </div>

            {/* Botones de acción rediseñados */}
            <div className="space-y-4 mb-8">
              <Link href="/login" className="block group">
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all duration-300 ease-out transform group-hover:scale-[1.02] group-hover:shadow-2xl group-hover:shadow-blue-500/25">
                  {/* Efecto de brillo animado */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                  <div className="relative py-4 px-8">
                    <span className="text-white font-semibold text-lg tracking-wide flex items-center justify-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                      Acceder al Sistema
                    </span>
                  </div>
                </div>
              </Link>
              
              <Link href="/register" className="block group">
                <div className="relative overflow-hidden rounded-2xl border-2 border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all duration-300 ease-out transform group-hover:scale-[1.02] group-hover:shadow-xl group-hover:shadow-slate-200/50">
                  <div className="py-4 px-8">
                    <span className="text-slate-700 font-semibold text-lg tracking-wide flex items-center justify-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                      Crear Nueva Cuenta
                    </span>
                  </div>
                </div>
              </Link>
            </div>

            {/* Indicadores de características */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="text-center">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-slate-600">Seguro</span>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-slate-600">Rápido</span>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17v4a2 2 0 002 2h4M15 5l-4 4" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-slate-600">Completo</span>
              </div>
            </div>

            {/* Indicador de seguridad mejorado */}
            <div className="pt-6 border-t border-slate-200/70">
              <div className="flex items-center justify-center text-slate-500 text-sm">
                <svg className="w-4 h-4 mr-2 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Autenticación segura AWS Cognito</span>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Footer minimalista mejorado */}
      <div className="absolute bottom-6 left-0 right-0 z-10">
        <div className="text-center">
          <p className="text-slate-400 text-sm font-light tracking-wide">
            © {new Date().getFullYear()} ALUMAC Sistema Integral
            <span className="mx-2">•</span>
            <span className="font-medium">Solución Empresarial</span>
          </p>
        </div>
      </div>
    </div>
  );
}