/**
 * Pantalla de carga estilo HBO Max / Netflix
 * Logo con efecto de respiración/pulsación
 */
function SplashScreen() {
  return (
    <div className="fixed inset-0 z-[100] bg-gray-900 flex items-center justify-center">
      {/* Fondo con gradiente sutil */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" />

      {/* Contenedor del logo */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Logo con animación de respiración */}
        <div className="animate-breathe">
          <img
            src="/images/logo-full.svg"
            alt="Seven Art"
            className="h-24 w-24 sm:h-32 sm:w-32 drop-shadow-2xl"
          />
        </div>

        {/* Nombre con fade in */}
        <h1 className="mt-6 text-2xl sm:text-3xl font-bold text-white animate-fade-in">
          Seven Art
        </h1>

        {/* Indicador de carga sutil */}
        <div className="mt-8 flex space-x-2">
          <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce-dot" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce-dot" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce-dot" style={{ animationDelay: '300ms' }} />
        </div>
      </div>

      {/* Estilos de animación */}
      <style jsx>{`
        @keyframes breathe {
          0%, 100% {
            transform: scale(1);
            opacity: 0.9;
          }
          50% {
            transform: scale(1.08);
            opacity: 1;
          }
        }

        @keyframes fade-in {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes bounce-dot {
          0%, 80%, 100% {
            transform: scale(0.8);
            opacity: 0.5;
          }
          40% {
            transform: scale(1.2);
            opacity: 1;
          }
        }

        .animate-breathe {
          animation: breathe 2.5s ease-in-out infinite;
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out 0.3s both;
        }

        .animate-bounce-dot {
          animation: bounce-dot 1.4s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}

export default SplashScreen
