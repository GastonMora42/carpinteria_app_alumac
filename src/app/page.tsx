// src/app/page.tsx - Página de inicio profesional y minimalista
import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 relative">
      {/* Elementos geométricos de fondo */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-100/30 to-slate-200/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-slate-200/20 to-blue-100/30 rounded-full blur-3xl"></div>
        
        {/* Líneas geométricas sutiles */}
        <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-200/50 to-transparent"></div>
        <div className="absolute bottom-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-200/50 to-transparent"></div>
      </div>

      {/* Contenido principal */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-6">
        <div className="max-w-lg w-full">
          
          {/* Contenedor principal con efecto glassmorphism */}
          <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-2xl shadow-slate-200/50 p-12 text-center">
            
            {/* Logo con efecto flotante */}
            <div className="relative mb-8">
              <div className="w-28 h-28 mx-auto relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-slate-400/20 rounded-full blur-md"></div>
                <Image
                  src="/alumac.webp"
                  alt="AlumGestión"
                  width={112}
                  height={112}
                  className="relative rounded-full border-2 border-white shadow-xl"
                  priority
                />
              </div>
            </div>

            {/* Título principal */}
            <div className="mb-5">
              <div className="w-16 h-0.5 bg-gradient-to-r from-blue-400 to-slate-400 mx-auto mb-4"></div>
              <h2 className="text-xl font-medium text-slate-600 mb-3 tracking-wide">
                Sistema Profesional de Gestión
              </h2>
              <p className="text-lg text-slate-500 font-light">
                Carpintería de Aluminio
              </p>
            </div>

            {/* Botones de acción rediseñados */}
            <div className="space-y-4">
              <Link href="/login" className="block group">
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 transition-all duration-300 ease-out transform group-hover:scale-[1.02] group-hover:shadow-xl group-hover:shadow-slate-300/30">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                  <div className="relative py-4 px-8">
                    <span className="text-white font-medium text-lg tracking-wide">Acceder al Sistema</span>
                  </div>
                </div>
              </Link>
              
              <Link href="/register" className="block group">
                <div className="relative overflow-hidden rounded-2xl border-2 border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all duration-300 ease-out transform group-hover:scale-[1.02] group-hover:shadow-lg">
                  <div className="py-4 px-8">
                    <span className="text-slate-700 font-medium text-lg tracking-wide">Crear Nueva Cuenta</span>
                  </div>
                </div>
              </Link>
            </div>

            {/* Indicador de seguridad */}
            <div className="mt-8 pt-6 border-t border-slate-200/60">
              <div className="flex items-center justify-center text-slate-500 text-sm">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                <span className="font-light">Plataforma segura y confiable</span>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Footer minimalista */}
      <div className="absolute bottom-6 left-0 right-0">
        <div className="text-center">
          <p className="text-slate-400 text-sm font-light tracking-wide">
            © 2024 AlumGestión • Solución empresarial especializada
          </p>
        </div>
      </div>
    </div>
  );
}