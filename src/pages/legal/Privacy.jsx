import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Privacy() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
        >
          <ArrowLeft className="h-5 w-5" />
          Volver
        </button>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">
            Política de Privacidad
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
            Última actualización: {new Date().toLocaleDateString('es-ES')}
          </p>

          <div className="prose dark:prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                1. Información que recopilamos
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Seven recopila la siguiente información cuando utilizas nuestra plataforma:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                <li><strong>Información de cuenta:</strong> Email, nombre de usuario, nombre completo</li>
                <li><strong>Contenido:</strong> Posts, comentarios, películas compartidas, mensajes</li>
                <li><strong>Interacciones:</strong> Likes, reacciones, seguidores, guardados</li>
                <li><strong>Medios:</strong> Imágenes y videos que subes a la plataforma</li>
                <li><strong>Uso:</strong> Páginas visitadas, tiempo de uso, interacciones</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                2. Cómo usamos tu información
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Utilizamos tu información para:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                <li>Proporcionar y mejorar nuestros servicios</li>
                <li>Personalizar tu experiencia en la plataforma</li>
                <li>Comunicarnos contigo sobre actualizaciones y novedades</li>
                <li>Proteger contra fraude y abuso</li>
                <li>Cumplir con obligaciones legales</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                3. Cookies y tecnologías similares
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Utilizamos cookies y tecnologías similares para:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                <li>Mantener tu sesión activa</li>
                <li>Recordar tus preferencias</li>
                <li>Analizar el uso de la plataforma</li>
                <li>Mostrar publicidad relevante (Google AdSense)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                4. Compartir información con terceros
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Compartimos información limitada con:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                <li><strong>Supabase:</strong> Nuestro proveedor de base de datos y autenticación</li>
                <li><strong>Vercel:</strong> Hosting de la aplicación</li>
                <li><strong>Google AdSense:</strong> Para mostrar publicidad (cuando esté activo)</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 mt-4">
                <strong>No vendemos</strong> tu información personal a terceros.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                5. Google AdSense y publicidad
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Seven utiliza Google AdSense para mostrar anuncios. Google puede usar cookies para:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                <li>Mostrar anuncios basados en tus intereses</li>
                <li>Limitar el número de veces que ves un anuncio</li>
                <li>Medir la efectividad de los anuncios</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 mt-4">
                Puedes optar por no recibir publicidad personalizada visitando{' '}
                <a
                  href="https://www.google.com/settings/ads"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Configuración de anuncios de Google
                </a>
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                6. Tus derechos
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Tienes derecho a:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                <li>Acceder a tu información personal</li>
                <li>Corregir información incorrecta</li>
                <li>Eliminar tu cuenta y datos</li>
                <li>Exportar tus datos</li>
                <li>Oponerte al procesamiento de tus datos</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                7. Seguridad
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                Implementamos medidas de seguridad para proteger tu información, incluyendo:
                encriptación de datos, autenticación segura, y acceso limitado a información personal.
                Sin embargo, ningún sistema es 100% seguro.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                8. Menores de edad
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                Seven está dirigido a personas mayores de 13 años. No recopilamos intencionalmente
                información de menores de 13 años.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                9. Cambios a esta política
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                Podemos actualizar esta política ocasionalmente. Te notificaremos de cambios
                significativos mediante un aviso en la plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                10. Contacto
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                Si tienes preguntas sobre esta política, contáctanos a través de la{' '}
                <a
                  href="/contact"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  página de contacto
                </a>
                .
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
