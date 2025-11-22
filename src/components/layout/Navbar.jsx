import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Home, Search, Film, User, LogOut, Bell, Mail, Clapperboard, Globe, Moon, Sun } from 'lucide-react'
import { useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { useUnreadMessagesCount } from '../../hooks/useMessages'
import { useUnreadNotificationsCount } from '../../hooks/useNotifications'
import { useThemeStore } from '../../store/themeStore'
import NotificationsPanel from '../notifications/NotificationsPanel'

function Navbar() {
  const { t, i18n } = useTranslation()
  const { user, signOut } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)

  // Obtener contadores reales
  const { data: unreadMessages = 0 } = useUnreadMessagesCount()
  const { data: unreadNotifications = 0 } = useUnreadNotificationsCount()

  const handleLogout = async () => {
    try {
      await signOut()
      navigate('/')
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  const { toggleTheme } = useThemeStore()

  const toggleLanguage = () => {
    const newLang = i18n.language === 'es' ? 'en' : 'es'
    i18n.changeLanguage(newLang)
  }

  // Si el usuario no está logueado, mostrar navbar simple
  if (!user) {
    return (
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50" role="navigation" aria-label={t('nav.main')}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2" aria-label="CineAmateur - Ir al inicio">
                <Clapperboard className="h-8 w-8 text-primary-600" aria-hidden="true" />
                <span className="text-xl font-bold text-gray-900 dark:text-white">CineAmateur</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label={t('settings.toggleTheme')}
              >
                <Sun className="h-5 w-5 text-gray-600 dark:text-gray-400 hidden dark:block" />
                <Moon className="h-5 w-5 text-gray-600 dark:text-gray-400 block dark:hidden" />
              </button>
              <Link to="/login" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 font-medium">
                {t('nav.login')}
              </Link>
              <Link to="/register" className="btn btn-primary">
                {t('nav.register')}
              </Link>
            </div>
          </div>
        </div>
      </nav>
    )
  }

  const navItems = [
    { icon: Home, label: 'Inicio', path: '/feed' },
    { icon: Search, label: 'Buscar', path: '/search' },
    { icon: Film, label: 'Películas', path: '/movies' },
  ]

  const isActive = (path) => location.pathname === path

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50" role="navigation" aria-label={t('nav.main')}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/feed" className="flex items-center space-x-2" aria-label="CineAmateur - Ir al feed">
              <Clapperboard className="h-8 w-8 text-primary-600" aria-hidden="true" />
              <span className="text-xl font-bold text-gray-900 dark:text-white hidden sm:block">CineAmateur</span>
            </Link>
          </div>

          {/* Navigation Icons - Desktop */}
          <div className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center transition-colors ${
                  isActive(item.path)
                    ? 'text-primary-600'
                    : 'text-gray-600 dark:text-gray-400 hover:text-primary-600'
                }`}
                title={item.label}
              >
                <item.icon className="h-6 w-6" />
                {isActive(item.path) && (
                  <div className="w-1 h-1 rounded-full bg-primary-600 mt-1"></div>
                )}
              </Link>
            ))}

            {/* Notificaciones */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`flex flex-col items-center transition-colors ${
                  showNotifications
                    ? 'text-primary-600'
                    : 'text-gray-600 dark:text-gray-400 hover:text-primary-600'
                }`}
                aria-label={`${t('nav.notifications')}${unreadNotifications > 0 ? ` (${unreadNotifications} ${t('nav.unread')})` : ''}`}
                aria-expanded={showNotifications}
                aria-haspopup="true"
              >
                <div className="relative">
                  <Bell className="h-6 w-6" aria-hidden="true" />
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center" aria-hidden="true">
                      {unreadNotifications > 9 ? '9+' : unreadNotifications}
                    </span>
                  )}
                </div>
                {showNotifications && (
                  <div className="w-1 h-1 rounded-full bg-primary-600 mt-1" aria-hidden="true"></div>
                )}
              </button>

              {showNotifications && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowNotifications(false)}
                  ></div>
                  <NotificationsPanel onClose={() => setShowNotifications(false)} />
                </>
              )}
            </div>

            {/* Mensajes directos */}
            <Link
              to="/messages"
              className={`flex flex-col items-center transition-colors ${
                isActive('/messages')
                  ? 'text-primary-600'
                  : 'text-gray-600 dark:text-gray-400 hover:text-primary-600'
              }`}
            >
              <div className="relative">
                <Mail className="h-6 w-6" />
                {unreadMessages > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </span>
                )}
              </div>
              {isActive('/messages') && (
                <div className="w-1 h-1 rounded-full bg-primary-600 mt-1"></div>
              )}
            </Link>

            {/* Avatar y menú usuario */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-full"
                aria-label={t('nav.userMenu')}
                aria-expanded={showUserMenu}
                aria-haspopup="menu"
              >
                {user?.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt="Avatar"
                    className="h-8 w-8 rounded-full border-2 border-gray-200 hover:border-primary-600"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold border-2 border-gray-200 hover:border-primary-600">
                    {user?.user_metadata?.name?.[0] || user?.email?.[0] || 'U'}
                  </div>
                )}
              </button>

              {/* Dropdown menu */}
              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowUserMenu(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-2 z-20 border border-gray-200 dark:border-gray-700">
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {user?.user_metadata?.name || 'Usuario'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        @{user?.user_metadata?.username || user?.email?.split('@')[0]}
                      </p>
                    </div>
                    <Link
                      to="/profile"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <User className="h-4 w-4 mr-3" />
                      {t('nav.profile')}
                    </Link>
                    <button
                      onClick={toggleLanguage}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Globe className="h-4 w-4 mr-3" />
                      {i18n.language === 'es' ? 'English' : 'Español'}
                    </button>
                    <button
                      onClick={toggleTheme}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Sun className="h-4 w-4 mr-3 hidden dark:block" />
                      <Moon className="h-4 w-4 mr-3 block dark:hidden" />
                      {t('settings.theme', 'Tema')}
                    </button>
                    <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                    <button
                      onClick={() => {
                        handleLogout()
                        setShowUserMenu(false)
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <LogOut className="h-4 w-4 mr-3" />
                      {t('nav.logout')}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className="flex md:hidden items-center space-x-4">
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="flex items-center text-gray-600 hover:text-primary-600"
              >
                <div className="relative">
                  <Bell className="h-6 w-6" />
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadNotifications > 9 ? '9+' : unreadNotifications}
                    </span>
                  )}
                </div>
              </button>

              {showNotifications && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowNotifications(false)}
                  ></div>
                  <NotificationsPanel onClose={() => setShowNotifications(false)} />
                </>
              )}
            </div>
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center"
              >
                {user?.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt="Avatar"
                    className="h-8 w-8 rounded-full"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold">
                    {user?.user_metadata?.name?.[0] || 'U'}
                  </div>
                )}
              </button>

              {/* Dropdown menu mobile */}
              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowUserMenu(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-2 z-20 border border-gray-200 dark:border-gray-700">
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {user?.user_metadata?.name || 'Usuario'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        @{user?.user_metadata?.username || user?.email?.split('@')[0]}
                      </p>
                    </div>
                    <Link
                      to="/profile"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <User className="h-4 w-4 mr-3" />
                      {t('nav.profile')}
                    </Link>
                    <button
                      onClick={toggleLanguage}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Globe className="h-4 w-4 mr-3" />
                      {i18n.language === 'es' ? 'English' : 'Español'}
                    </button>
                    <button
                      onClick={toggleTheme}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Sun className="h-4 w-4 mr-3 hidden dark:block" />
                      <Moon className="h-4 w-4 mr-3 block dark:hidden" />
                      {t('settings.theme', 'Tema')}
                    </button>
                    <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                    <button
                      onClick={() => {
                        handleLogout()
                        setShowUserMenu(false)
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <LogOut className="h-4 w-4 mr-3" />
                      {t('nav.logout')}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 h-full ${
                isActive(item.path)
                  ? 'text-primary-600'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              <item.icon className="h-6 w-6" />
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          ))}

          {/* Messages Icon */}
          <Link
            to="/messages"
            className={`flex flex-col items-center justify-center flex-1 h-full relative ${
              isActive('/messages')
                ? 'text-primary-600'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            <div className="relative">
              <Mail className="h-6 w-6" />
              {unreadMessages > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-semibold">
                  {unreadMessages > 9 ? '9+' : unreadMessages}
                </span>
              )}
            </div>
            <span className="text-xs mt-1">{t('nav.messages')}</span>
          </Link>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
