import { Film } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

function Footer() {
  const { t } = useTranslation()
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
          {/* Brand */}
          <div className="flex flex-col items-center md:items-start">
            <div className="flex items-center space-x-2 mb-4">
              <Film className="h-6 w-6 text-primary-600" />
              <span className="text-lg font-semibold text-gray-900 dark:text-white">Seven</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center md:text-left">
              La red social para cinéfilos apasionados
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-col items-center">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
              Información
            </h3>
            <div className="flex flex-col space-y-2 text-sm text-center">
              <Link
                to="/about"
                className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
              >
                Acerca de
              </Link>
              <Link
                to="/contact"
                className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
              >
                Contacto
              </Link>
            </div>
          </div>

          {/* Legal */}
          <div className="flex flex-col items-center md:items-end">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
              Legal
            </h3>
            <div className="flex flex-col space-y-2 text-sm text-center md:text-right">
              <Link
                to="/privacy"
                className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
              >
                Política de Privacidad
              </Link>
              <Link
                to="/terms"
                className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
              >
                Términos de Servicio
              </Link>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            © {currentYear} Seven. {t('common.allRightsReserved')}
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
