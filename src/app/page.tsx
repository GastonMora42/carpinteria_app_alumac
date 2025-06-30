// src/app/page.tsx - Página de inicio profesional y minimalista
import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 relative font-sans text-gray-800">
      {/* Elementos geométricos de fondo */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-100/40 to-slate-200/30 rounded-full blur-3xl opacity-75"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-slate-200/30 to-blue-100/40 rounded-full blur-3xl opacity-75"></div>
        
        {/* Líneas geométricas sutiles */}
        <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-200/60 to-transparent"></div>
        <div className="absolute bottom-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-200/60 to-transparent"></div>
      </div>

      {/* Contenido principal */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full mx-auto">
          
          {/* Contenedor principal con efecto glassmorphism */}
          <div className="bg-white/70 backdrop-blur-lg border border-white/30 rounded-3xl shadow-2xl shadow-slate-200/60 p-8 sm:p-10 md:p-12 text-center transform transition-all duration-300 hover:shadow-3xl hover:shadow-slate-300/70">
            
            {/* Logo y nombre de la marca - MEJORADO */}
            <div className="">
              <div className="w-36 h-36 mx-auto relative group"> {/* Aumentado el tamaño */}
                <Image
                  src="/alumac.webp"
                  alt="AlumGestión Logo"
                  width={144} // Ajustado al nuevo tamaño del contenedor
                  height={144} // Ajustado al nuevo tamaño del contenedor
                  className="relative rounded-full border-4 border-white shadow-xl transform transition-transform duration-300 group-hover:scale-105"
                  priority
                />
              </div>
            </div>

            {/* Título principal */}
            <div className="mb-6">
              <div className="w-20 h-0.5 bg-gradient-to-r from-blue-500 to-slate-500 mx-auto mb-4 rounded-full"></div>
              <h1 className="text-3xl font-extrabold text-slate-700 mb-2 tracking-tight">
                ALUMAC Sistema integral
              </h1>
              <p className="text-xl text-slate-500 font-light">
                Sistema de Gestión para <br className="sm:hidden" /> Carpintería de Aluminio
              </p>
            </div>

            {/* Botones de acción rediseñados */}
            <div className="space-y-4">
              <Link href="/login" className="block group">
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 transition-all duration-300 ease-out transform group-hover:scale-[1.02] group-hover:shadow-xl group-hover:shadow-blue-300/40">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                  <div className="relative py-4 px-8">
                    <span className="text-white font-semibold text-lg tracking-wide">Acceder al Sistema</span>
                  </div>
                </div>
              </Link>
              
              <Link href="/register" className="block group">
                <div className="relative overflow-hidden rounded-2xl border-2 border-slate-300 bg-white hover:bg-slate-50 hover:border-slate-400 transition-all duration-300 ease-out transform group-hover:scale-[1.02] group-hover:shadow-lg group-hover:shadow-slate-200/40">
                  <div className="py-4 px-8">
                    <span className="text-slate-700 font-semibold text-lg tracking-wide">Crear Nueva Cuenta</span>
                  </div>
                </div>
              </Link>
            </div>

            {/* Indicador de seguridad */}
            <div className="mt-10 pt-6 border-t border-slate-200/70">
              <div className="flex items-center justify-center text-slate-500 text-sm">
                <svg className="w-4 h-4 mr-2 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Plataforma segura y confiable</span>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Footer minimalista */}
      <div className="absolute bottom-6 left-0 right-0">
        <div className="text-center">
          <p className="text-slate-400 text-sm font-light tracking-wide">
            © {new Date().getFullYear()} ALUMAC Sistema integral
            • Solución empresarial
          </p>
        </div>
      </div>
    </div>
  );
}