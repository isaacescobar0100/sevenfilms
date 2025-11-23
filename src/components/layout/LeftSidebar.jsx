import { Link, useLocation } from 'react-router-dom'
import { Home, Compass, Film, Bookmark, Settings, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../store/authStore'
import { useProfile } from '../../hooks/useProfiles'

function LeftSidebar() {
  const { t } = useTranslation()
  const location = useLocation()
  const { user: authUser } = useAuthStore()
  const { data: profile } = useProfile(authUser?.id)

  const menuItems = [
    { path: '/feed', icon: Home, label: t('nav.feed') },
    { path: '/search', icon: Compass, label: t('nav.explore') },
    { path: '/movies', icon: Film, label: t('nav.movies') },
    { path: '/saved', icon: Bookmark, label: t('nav.saved') || 'Guardados' },
  ]

  const isActive = (path) => location.pathname === path

  return (
    <aside className="hidden lg:block sticky top-20 h-fit space-y-4">
      {/* User Profile Card */}
      {profile && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
          <Link to={`/profile/${profile.username}`} className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.username}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold text-lg">
                {profile.full_name?.[0] || profile.username?.[0] || 'U'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 dark:text-white truncate">
                {profile.full_name || profile.username}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                @{profile.username}
              </p>
            </div>
          </Link>
        </div>
      )}

      {/* Navigation Menu */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <nav className="py-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.path)
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 transition-colors ${
                  active
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 border-l-4 border-primary-600'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border-l-4 border-transparent'
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? 'text-primary-600 dark:text-primary-400' : ''}`} />
                <span className="font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Quick Links */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm uppercase tracking-wide">
          {t('nav.quickLinks') || 'Accesos rápidos'}
        </h3>
        <div className="space-y-2">
          <Link
            to={profile ? `/profile/${profile.username}` : '/login'}
            className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors text-sm"
          >
            <User className="h-4 w-4" />
            <span>{t('nav.profile')}</span>
          </Link>
          <Link
            to="/settings"
            className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors text-sm"
          >
            <Settings className="h-4 w-4" />
            <span>{t('nav.settings')}</span>
          </Link>
        </div>
      </div>

      {/* Footer Links */}
      <div className="text-xs text-gray-500 dark:text-gray-400 px-2 space-y-1">
        <div className="flex flex-wrap gap-x-2 gap-y-1">
          <Link to="/about" className="hover:underline">{t('footer.about')}</Link>
          <span>·</span>
          <Link to="/privacy" className="hover:underline">{t('footer.privacy')}</Link>
          <span>·</span>
          <Link to="/terms" className="hover:underline">{t('footer.terms')}</Link>
        </div>
        <p className="mt-2">© 2024 Seven</p>
      </div>
    </aside>
  )
}

export default LeftSidebar
