import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Home, Search, Film, User, LogOut, Bell, Mail, Clapperboard, Globe } from 'lucide-react'
import { useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { useUnreadMessagesCount } from '../../hooks/useMessages'
import { useUnreadNotificationsCount } from '../../hooks/useNotifications'
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

  const toggleLanguage = () => {
    const newLang = i18n.language === 'es' ? 'en' : 'es'
    i18n.changeLanguage(newLang)
  }

  // Si el usuario no está logueado, mostrar navbar simple
  if (!user) {
    return (
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <Clapperboard className="h-8 w-8 text-primary-600" />
                <span className="text-xl font-bold text-gray-900">CineAmateur</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/login" className="text-gray-700 hover:text-primary-600 font-medium">
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
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/feed" className="flex items-center space-x-2">
              <Clapperboard className="h-8 w-8 text-primary-600" />
              <span className="text-xl font-bold text-gray-900 hidden sm:block">CineAmateur</span>
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
                    : 'text-gray-600 hover:text-primary-600'
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
                    : 'text-gray-600 hover:text-primary-600'
                }`}
              >
                <div className="relative">
                  <Bell className="h-6 w-6" />
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadNotifications > 9 ? '9+' : unreadNotifications}
                    </span>
                  )}
                </div>
                {showNotifications && (
                  <div className="w-1 h-1 rounded-full bg-primary-600 mt-1"></div>
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
                  : 'text-gray-600 hover:text-primary-600'
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
                className="flex items-center space-x-2 focus:outline-none"
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
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-2 z-20 border border-gray-200">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-semibold text-gray-900">
                        {user?.user_metadata?.name || 'Usuario'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        @{user?.user_metadata?.username || user?.email?.split('@')[0]}
                      </p>
                    </div>
                    <Link
                      to="/profile"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <User className="h-4 w-4 mr-3" />
                      {t('nav.profile')}
                    </Link>
                    <button
                      onClick={toggleLanguage}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Globe className="h-4 w-4 mr-3" />
                      {i18n.language === 'es' ? 'English' : 'Español'}
                    </button>
                    <div className="border-t border-gray-200 my-1"></div>
                    <button
                      onClick={() => {
                        handleLogout()
                        setShowUserMenu(false)
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
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
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-2 z-20 border border-gray-200">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-semibold text-gray-900">
                        {user?.user_metadata?.name || 'Usuario'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        @{user?.user_metadata?.username || user?.email?.split('@')[0]}
                      </p>
                    </div>
                    <Link
                      to="/profile"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <User className="h-4 w-4 mr-3" />
                      {t('nav.profile')}
                    </Link>
                    <button
                      onClick={toggleLanguage}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Globe className="h-4 w-4 mr-3" />
                      {i18n.language === 'es' ? 'English' : 'Español'}
                    </button>
                    <div className="border-t border-gray-200 my-1"></div>
                    <button
                      onClick={() => {
                        handleLogout()
                        setShowUserMenu(false)
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
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
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 h-full ${
                isActive(item.path)
                  ? 'text-primary-600'
                  : 'text-gray-600'
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
                : 'text-gray-600'
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
