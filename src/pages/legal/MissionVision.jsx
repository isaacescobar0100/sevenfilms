import { Link } from 'react-router-dom'
import { ArrowLeft, Target, Eye, Compass, Award, Globe, Lightbulb } from 'lucide-react'

function MissionVision() {
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
              <Compass className="h-8 w-8 text-primary-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Mision y Vision
            </h1>
            <p className="text-gray-500">
              Nuestro proposito y hacia donde vamos
            </p>
          </div>

          <div className="space-y-8">
            {/* Mision */}
            <section className="bg-gradient-to-r from-primary-50 to-primary-100 p-6 rounded-xl">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center mr-4">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Nuestra Mision</h2>
              </div>
              <p className="text-gray-700 text-lg leading-relaxed">
                Democratizar el cine independiente proporcionando una plataforma accesible
                donde cada cineasta amateur pueda compartir su vision creativa, conectar
                con una comunidad global de creadores y encontrar la audiencia que su
                trabajo merece, sin barreras economicas ni tecnicas.
              </p>
            </section>

            {/* Vision */}
            <section className="bg-gradient-to-r from-purple-50 to-purple-100 p-6 rounded-xl">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mr-4">
                  <Eye className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Nuestra Vision</h2>
              </div>
              <p className="text-gray-700 text-lg leading-relaxed">
                Ser la plataforma lider mundial para el cine independiente y amateur,
                reconocida como el lugar donde nacen los grandes talentos cinematograficos
                del futuro y donde cada historia, sin importar su origen, tiene la
                oportunidad de ser contada y apreciada.
              </p>
            </section>

            {/* Objetivos */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <Award className="h-5 w-5 text-primary-600 mr-2" />
                Nuestros Objetivos
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-gray-200 p-4 rounded-lg hover:border-primary-300 transition-colors">
                  <div className="flex items-center mb-2">
                    <Globe className="h-5 w-5 text-primary-600 mr-2" />
                    <h3 className="font-semibold text-gray-900">Alcance Global</h3>
                  </div>
                  <p className="text-gray-600 text-sm">
                    Conectar cineastas de todos los paises y culturas, creando una
                    comunidad diversa e inclusiva.
                  </p>
                </div>

                <div className="border border-gray-200 p-4 rounded-lg hover:border-primary-300 transition-colors">
                  <div className="flex items-center mb-2">
                    <Lightbulb className="h-5 w-5 text-primary-600 mr-2" />
                    <h3 className="font-semibold text-gray-900">Innovacion Constante</h3>
                  </div>
                  <p className="text-gray-600 text-sm">
                    Desarrollar herramientas que faciliten la creacion, edicion y
                    distribucion de contenido cinematografico.
                  </p>
                </div>

                <div className="border border-gray-200 p-4 rounded-lg hover:border-primary-300 transition-colors">
                  <div className="flex items-center mb-2">
                    <Target className="h-5 w-5 text-primary-600 mr-2" />
                    <h3 className="font-semibold text-gray-900">Descubrimiento de Talento</h3>
                  </div>
                  <p className="text-gray-600 text-sm">
                    Ser el puente entre cineastas emergentes y la industria
                    profesional del entretenimiento.
                  </p>
                </div>

                <div className="border border-gray-200 p-4 rounded-lg hover:border-primary-300 transition-colors">
                  <div className="flex items-center mb-2">
                    <Award className="h-5 w-5 text-primary-600 mr-2" />
                    <h3 className="font-semibold text-gray-900">Calidad y Excelencia</h3>
                  </div>
                  <p className="text-gray-600 text-sm">
                    Promover altos estandares de produccion y narrativa en el cine
                    independiente.
                  </p>
                </div>
              </div>
            </section>

            {/* Compromiso */}
            <section className="bg-gray-900 text-white p-6 rounded-xl">
              <h2 className="text-xl font-semibold mb-4">Nuestro Compromiso</h2>
              <div className="space-y-3">
                <p className="flex items-start">
                  <span className="text-primary-400 mr-2">1.</span>
                  Mantener la plataforma accesible y gratuita para todos los creadores.
                </p>
                <p className="flex items-start">
                  <span className="text-primary-400 mr-2">2.</span>
                  Proteger los derechos de autor y la propiedad intelectual de los cineastas.
                </p>
                <p className="flex items-start">
                  <span className="text-primary-400 mr-2">3.</span>
                  Fomentar un ambiente seguro y respetuoso para toda la comunidad.
                </p>
                <p className="flex items-start">
                  <span className="text-primary-400 mr-2">4.</span>
                  Escuchar activamente las necesidades de nuestros usuarios.
                </p>
                <p className="flex items-start">
                  <span className="text-primary-400 mr-2">5.</span>
                  Evolucionar constantemente para ofrecer la mejor experiencia posible.
                </p>
              </div>
            </section>

            {/* CTA */}
            <section className="text-center py-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Se parte de nuestra mision
              </h3>
              <p className="text-gray-600 mb-4">
                Juntos podemos cambiar la forma en que el mundo descubre el cine independiente.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/register"
                  className="inline-block bg-primary-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors"
                >
                  Unirme ahora
                </Link>
                <Link
                  to="/about"
                  className="inline-block bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  Conocer mas
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MissionVision
