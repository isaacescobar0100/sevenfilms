import { Link } from 'react-router-dom'
import { ArrowLeft, Film, Heart, Users, Target, Sparkles } from 'lucide-react'

function AboutUs() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al inicio
        </Link>

        <div className="bg-white rounded-xl shadow-sm p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
              <Film className="h-8 w-8 text-primary-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Acerca de Seven Cineamateur
            </h1>
            <p className="text-gray-500">
              La plataforma que impulsa el cine independiente
            </p>
          </div>

          <div className="prose prose-gray max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Heart className="h-5 w-5 text-primary-600 mr-2" />
                Nuestra Historia
              </h2>
              <p className="text-gray-600 mb-4">
                Seven Cineamateur nacio de una pasion compartida: el cine. Fundada en 2025,
                nuestra plataforma surgio de la necesidad de crear un espacio donde los
                cineastas amateurs pudieran compartir su trabajo, conectar con otros
                creadores y recibir el reconocimiento que merecen.
              </p>
              <p className="text-gray-600">
                Creemos que el talento no tiene limites y que las grandes historias pueden
                venir de cualquier lugar. Por eso, hemos creado un espacio donde cada
                cineasta, sin importar su experiencia o recursos, puede mostrar su vision
                al mundo.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Sparkles className="h-5 w-5 text-primary-600 mr-2" />
                Que Hacemos
              </h2>
              <p className="text-gray-600 mb-4">
                Seven Cineamateur es una red social dedicada exclusivamente al cine
                independiente y amateur. Ofrecemos:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>
                  <strong>Plataforma de streaming:</strong> Sube y comparte tus peliculas,
                  cortometrajes y documentales con una audiencia global.
                </li>
                <li>
                  <strong>Comunidad activa:</strong> Conecta con otros cineastas, recibe
                  feedback constructivo y colabora en proyectos.
                </li>
                <li>
                  <strong>Perfiles profesionales:</strong> Crea tu portfolio de cineasta
                  y muestra tu trabajo a productores y estudios.
                </li>
                <li>
                  <strong>Descubrimiento de contenido:</strong> Encuentra peliculas unicas
                  que no encontraras en otras plataformas.
                </li>
                <li>
                  <strong>Herramientas para creadores:</strong> Estadisticas, subtitulos
                  automaticos y mas funciones para potenciar tu contenido.
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Users className="h-5 w-5 text-primary-600 mr-2" />
                Nuestro Equipo
              </h2>
              <p className="text-gray-600 mb-4">
                Somos un equipo apasionado de desarrolladores, disenadores y amantes del
                cine. Trabajamos constantemente para mejorar la plataforma y ofrecer la
                mejor experiencia posible a nuestra comunidad.
              </p>
              <p className="text-gray-600">
                Cada decision que tomamos esta guiada por nuestra comunidad. Escuchamos
                activamente sus sugerencias y trabajamos para implementar las funciones
                que mas necesitan los cineastas independientes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Target className="h-5 w-5 text-primary-600 mr-2" />
                Nuestros Valores
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Creatividad</h3>
                  <p className="text-gray-600 text-sm">
                    Celebramos la originalidad y apoyamos la expresion artistica sin limites.
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Comunidad</h3>
                  <p className="text-gray-600 text-sm">
                    Fomentamos un ambiente de apoyo mutuo entre creadores.
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Accesibilidad</h3>
                  <p className="text-gray-600 text-sm">
                    El cine debe ser accesible para todos, tanto creadores como espectadores.
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Innovacion</h3>
                  <p className="text-gray-600 text-sm">
                    Buscamos constantemente nuevas formas de empoderar a los cineastas.
                  </p>
                </div>
              </div>
            </section>

            <section className="mt-8 p-6 bg-primary-50 rounded-lg text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Unete a nuestra comunidad
              </h3>
              <p className="text-gray-600 mb-4">
                Se parte del movimiento del cine independiente. Comparte tu vision con el mundo.
              </p>
              <Link
                to="/register"
                className="inline-block bg-primary-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors"
              >
                Crear cuenta gratis
              </Link>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AboutUs
