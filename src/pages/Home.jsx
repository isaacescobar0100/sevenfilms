import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Film, Video, Users, Award } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

function Home() {
  const { t } = useTranslation()
  const { user } = useAuthStore()

  const features = [
    {
      icon: <Film className="h-12 w-12 text-primary-600" />,
      title: 'Proyectos Cinematográficos',
      description: 'Gestiona todos tus proyectos de cine en un solo lugar',
    },
    {
      icon: <Video className="h-12 w-12 text-primary-600" />,
      title: 'Portfolio Visual',
      description: 'Muestra tu trabajo y comparte tu visión creativa',
    },
    {
      icon: <Users className="h-12 w-12 text-primary-600" />,
      title: 'Comunidad',
      description: 'Conecta con otros cineastas y colabora en proyectos',
    },
    {
      icon: <Award className="h-12 w-12 text-primary-600" />,
      title: 'Recursos Profesionales',
      description: 'Accede a herramientas y recursos para mejorar tu trabajo',
    },
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              {t('home.title')}
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-100">
              {t('home.subtitle')}
            </p>
            <Link
              to={user ? '/dashboard' : '/register'}
              className="inline-block bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors"
            >
              {t('home.cta')}
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-md text-center">
                <div className="flex justify-center mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Brand */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Film className="h-8 w-8 text-primary-500" />
                <span className="text-xl font-bold">Seven Cineamateur</span>
              </div>
              <p className="text-gray-400">
                La plataforma social para cineastas amateurs. Comparte tu vision, conecta con creadores.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Enlaces</h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/register" className="text-gray-400 hover:text-white transition-colors">
                    Registrarse
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="text-gray-400 hover:text-white transition-colors">
                    Iniciar Sesion
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/privacy" className="text-gray-400 hover:text-white transition-colors">
                    Politica de Privacidad
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="text-gray-400 hover:text-white transition-colors">
                    Terminos y Condiciones
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} Seven Cineamateur. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Home
