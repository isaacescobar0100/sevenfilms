import { ArrowLeft, Film, Users, Heart, Zap } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function About() {
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
            Acerca de Seven
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            La red social para cinéfilos apasionados
          </p>

          <div className="prose dark:prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                ¿Qué es Seven?
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Seven es una plataforma social diseñada específicamente para amantes del cine. Un espacio
                donde puedes descubrir películas, compartir tus opiniones, conectar con otros cinéfilos y
                explorar el fascinante mundo del séptimo arte.
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                Nuestro nombre hace referencia al "séptimo arte", como se conoce comúnmente al cine,
                y representa nuestra pasión por crear una comunidad unida por el amor al cine.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                Características principales
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <Film className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Comparte películas
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300">
                      Crea posts sobre tus películas favoritas, comparte reseñas y descubre nuevas joyas del cine.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <Users className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Conecta con cinéfilos
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300">
                      Sigue a usuarios con gustos similares y mantente al día con sus recomendaciones.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <Heart className="h-8 w-8 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Reacciona y comenta
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300">
                      Expresa tu opinión con reacciones personalizadas y participa en conversaciones.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <Zap className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Descubre contenido
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300">
                      Explora trending, busca películas específicas y recibe recomendaciones personalizadas.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                Nuestra misión
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                Crear un espacio donde los amantes del cine puedan compartir su pasión, descubrir nuevas
                películas y conectar con personas que comparten sus gustos cinematográficos. Queremos hacer
                que la experiencia de descubrir y discutir películas sea social, divertida y enriquecedora.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                Tecnología
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Seven está construido con tecnologías modernas para ofrecerte la mejor experiencia:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                <li><strong>React:</strong> Para una interfaz rápida y responsive</li>
                <li><strong>Supabase:</strong> Base de datos en tiempo real y autenticación segura</li>
                <li><strong>Vercel:</strong> Hosting ultrarrápido con CDN global</li>
                <li><strong>React Query:</strong> Gestión eficiente de datos y caché</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                Únete a la comunidad
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Seven está en constante evolución gracias al feedback de nuestra comunidad. Si tienes
                sugerencias, reportes de bugs o simplemente quieres compartir tu experiencia, no dudes en
                contactarnos.
              </p>
              <a
                href="/contact"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition"
              >
                Contáctanos
              </a>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                Privacidad y seguridad
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                Tu privacidad es importante para nosotros. Lee nuestra{' '}
                <a
                  href="/privacy"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Política de Privacidad
                </a>
                {' '}y{' '}
                <a
                  href="/terms"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Términos de Servicio
                </a>
                {' '}para conocer cómo protegemos tus datos y qué esperamos de nuestra comunidad.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
