import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Home, Search, Film, User, LogOut, Bell, Mail, Clapperboard, Globe, Moon, Sun, Bookmark, Settings, Plus, PenSquare, Video, X, Clock } from 'lucide-react'
import { useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { useProfile } from '../../hooks/useProfiles'
import { useUnreadMessagesCount } from '../../hooks/useMessages'
import { useUnreadNotificationsCount } from '../../hooks/useNotifications'
import { useThemeStore } from '../../store/themeStore'
import NotificationsPanel from '../notifications/NotificationsPanel'

function Navbar() {
  const { t, i18n } = useTranslation()
  const { user, signOut } = useAuthStore()
  const { data: profile } = useProfile(user?.id)
  const navigate = useNavigate()
  const location = useLocation()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showCreateMenu, setShowCreateMenu] = useState(false)

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
              <Link to="/" className="flex items-center space-x-2" aria-label="Seven - Ir al inicio">
                <Clapperboard className="h-8 w-8 text-primary-600" aria-hidden="true" />
                <span className="text-xl font-bold text-gray-900 dark:text-white">Seven</span>
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
            <Link to="/feed" className="flex items-center space-x-2" aria-label="Seven - Ir al feed">
              <Clapperboard className="h-8 w-8 text-primary-600" aria-hidden="true" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">Seven</span>
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
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Avatar"
                    className="h-8 w-8 rounded-full object-cover border-2 border-gray-200 hover:border-primary-600"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold border-2 border-gray-200 hover:border-primary-600">
                    {profile?.username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
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
                        {profile?.full_name || profile?.username || 'Usuario'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        @{profile?.username || user?.email?.split('@')[0]}
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
                    <Link
                      to="/saved"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <Bookmark className="h-4 w-4 mr-3" />
                      {t('nav.saved', 'Guardados')}
                    </Link>
                    <Link
                      to="/settings"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <Settings className="h-4 w-4 mr-3" />
                      {t('nav.settings', 'Configuración')}
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
            {/* En móvil, navegar a página completa de notificaciones */}
            <Link
              to="/notifications"
              className={`flex items-center ${
                isActive('/notifications')
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
            </Link>
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center"
              >
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Avatar"
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold">
                    {profile?.username?.[0]?.toUpperCase() || 'U'}
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
                        {profile?.full_name || profile?.username || 'Usuario'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        @{profile?.username || user?.email?.split('@')[0]}
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
                    <Link
                      to="/saved"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <Bookmark className="h-4 w-4 mr-3" />
                      {t('nav.saved', 'Guardados')}
                    </Link>
                    <Link
                      to="/settings"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <Settings className="h-4 w-4 mr-3" />
                      {t('nav.settings', 'Configuración')}
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

      {/* Create Menu Modal (Mobile) */}
      {showCreateMenu && (
        <div className="md:hidden fixed inset-0 z-[60]">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowCreateMenu(false)}
          />
          {/* Menu */}
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 min-w-[200px]">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {t('nav.create', 'Crear')}
              </h3>
              <button
                onClick={() => setShowCreateMenu(false)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-2">
              <Link
                to="/feed"
                state={{ openCreatePost: true }}
                onClick={() => setShowCreateMenu(false)}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-full">
                  <PenSquare className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {t('nav.createPost', 'Crear Post')}
                  </p>
                  <p className="text-xs text-gray-500">
                    {t('nav.createPostDesc', 'Comparte texto o imagen')}
                  </p>
                </div>
              </Link>
              <Link
                to="/stories/create"
                onClick={() => setShowCreateMenu(false)}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {t('nav.createStory', 'Subir Historia')}
                  </p>
                  <p className="text-xs text-gray-500">
                    {t('nav.createStoryDesc', 'Desaparece en 24 horas')}
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50">
        <div className="flex justify-around items-center h-16">
          {/* Home */}
          <Link
            to="/feed"
            className={`flex flex-col items-center justify-center flex-1 h-full ${
              isActive('/feed')
                ? 'text-primary-600'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            <Home className="h-6 w-6" />
            <span className="text-xs mt-1">{t('nav.home', 'Inicio')}</span>
          </Link>

          {/* Search */}
          <Link
            to="/search"
            className={`flex flex-col items-center justify-center flex-1 h-full ${
              isActive('/search')
                ? 'text-primary-600'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            <Search className="h-6 w-6" />
            <span className="text-xs mt-1">{t('nav.search', 'Buscar')}</span>
          </Link>

          {/* Create Button (Center) */}
          <button
            onClick={() => setShowCreateMenu(true)}
            className="flex flex-col items-center justify-center flex-1 h-full"
          >
            <div className="bg-primary-600 rounded-full p-3 -mt-4 shadow-lg">
              <Plus className="h-6 w-6 text-white" />
            </div>
          </button>

          {/* Movies */}
          <Link
            to="/movies"
            className={`flex flex-col items-center justify-center flex-1 h-full ${
              isActive('/movies')
                ? 'text-primary-600'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            <Film className="h-6 w-6" />
            <span className="text-xs mt-1">{t('nav.movies', 'Películas')}</span>
          </Link>

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
