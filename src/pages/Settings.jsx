import { useState } from 'react'
import { Settings as SettingsIcon, User, Bell, Shield, Palette, Globe, LogOut } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useThemeStore } from '../store/themeStore'
import { useProfile } from '../hooks/useProfiles'
import { useUserSettings, useToggleSetting } from '../hooks/useUserSettings'
import LeftSidebar from '../components/layout/LeftSidebar'
import ConfirmDialog from '../components/common/ConfirmDialog'

function Settings() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { user: authUser, signOut } = useAuthStore()
  const { data: profile } = useProfile(authUser?.id)
  const { data: settings, isLoading: settingsLoading } = useUserSettings()
  const toggleSetting = useToggleSetting()
  const { theme, setTheme } = useThemeStore()
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)
  const [activeSection, setActiveSection] = useState('account')

  const handleLogout = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    }
  }

  const handleLanguageChange = (lang) => {
    i18n.changeLanguage(lang)
    localStorage.setItem('language', lang)
  }

  const menuItems = [
    { id: 'account', icon: User, label: t('settings.account') || 'Cuenta' },
    { id: 'notifications', icon: Bell, label: t('settings.notifications') || 'Notificaciones' },
    { id: 'privacy', icon: Shield, label: t('settings.privacy') || 'Privacidad' },
    { id: 'appearance', icon: Palette, label: t('settings.appearance') || 'Apariencia' },
    { id: 'language', icon: Globe, label: t('settings.language') || 'Idioma' },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar */}
        <div className="lg:col-span-3">
          <LeftSidebar />
        </div>

        {/* Main Content */}
        <div className="lg:col-span-9 space-y-6">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center space-x-3">
              <SettingsIcon className="h-8 w-8 text-primary-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {t('settings.title') || 'Configuración'}
                </h1>
                <p className="text-gray-500 dark:text-gray-400">
                  {t('settings.subtitle') || 'Administra tu cuenta y preferencias'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Settings Menu */}
            <div className="md:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                <nav className="py-2">
                  {menuItems.map((item) => {
                    const Icon = item.icon
                    const active = activeSection === item.id
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveSection(item.id)}
                        className={`w-full flex items-center space-x-3 px-4 py-3 transition-colors ${
                          active
                            ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 border-l-4 border-primary-600'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border-l-4 border-transparent'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="font-medium text-sm">{item.label}</span>
                      </button>
                    )
                  })}

                  {/* Logout button */}
                  <button
                    onClick={() => setShowLogoutDialog(true)}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 border-l-4 border-transparent transition-colors"
                  >
                    <LogOut className="h-5 w-5" />
                    <span className="font-medium text-sm">{t('nav.logout')}</span>
                  </button>
                </nav>
              </div>
            </div>

            {/* Settings Content */}
            <div className="md:col-span-3">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                {/* Account Section */}
                {activeSection === 'account' && (
                  <div className="space-y-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {t('settings.account') || 'Cuenta'}
                    </h2>

                    {profile && (
                      <div className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        {profile.avatar_url ? (
                          <img
                            src={profile.avatar_url}
                            alt={profile.username}
                            className="h-16 w-16 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-16 w-16 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold text-xl">
                            {profile.full_name?.[0] || profile.username?.[0] || 'U'}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {profile.full_name || profile.username}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            @{profile.username}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {authUser?.email}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="space-y-4">
                      <button
                        onClick={() => navigate(`/profile/${profile?.username}`)}
                        className="w-full text-left px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                      >
                        <p className="font-medium text-gray-900 dark:text-white">
                          {t('settings.editProfile') || 'Editar perfil'}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {t('settings.editProfileDesc') || 'Cambia tu foto, nombre y biografía'}
                        </p>
                      </button>
                    </div>
                  </div>
                )}

                {/* Notifications Section */}
                {activeSection === 'notifications' && (
                  <div className="space-y-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {t('settings.notifications') || 'Notificaciones'}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400">
                      {t('settings.notificationsDesc') || 'Configura cómo quieres recibir notificaciones'}
                    </p>
                    <div className="space-y-4">
                      <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">Likes</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Cuando alguien le da like a tu post</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings?.notify_likes ?? true}
                          onChange={(e) => toggleSetting.mutate({ key: 'notify_likes', value: e.target.checked })}
                          disabled={settingsLoading || toggleSetting.isPending}
                          className="h-5 w-5 text-primary-600 rounded cursor-pointer"
                        />
                      </label>
                      <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">Comentarios</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Cuando alguien comenta tu post</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings?.notify_comments ?? true}
                          onChange={(e) => toggleSetting.mutate({ key: 'notify_comments', value: e.target.checked })}
                          disabled={settingsLoading || toggleSetting.isPending}
                          className="h-5 w-5 text-primary-600 rounded cursor-pointer"
                        />
                      </label>
                      <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">Seguidores</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Cuando alguien te sigue</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings?.notify_followers ?? true}
                          onChange={(e) => toggleSetting.mutate({ key: 'notify_followers', value: e.target.checked })}
                          disabled={settingsLoading || toggleSetting.isPending}
                          className="h-5 w-5 text-primary-600 rounded cursor-pointer"
                        />
                      </label>
                    </div>
                  </div>
                )}

                {/* Privacy Section */}
                {activeSection === 'privacy' && (
                  <div className="space-y-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {t('settings.privacy') || 'Privacidad'}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400">
                      {t('settings.privacyDesc') || 'Controla quién puede ver tu información'}
                    </p>
                    <div className="space-y-4">
                      <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">Perfil público</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Cualquiera puede ver tu perfil</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings?.public_profile ?? true}
                          onChange={(e) => toggleSetting.mutate({ key: 'public_profile', value: e.target.checked })}
                          disabled={settingsLoading || toggleSetting.isPending}
                          className="h-5 w-5 text-primary-600 rounded cursor-pointer"
                        />
                      </label>
                      <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">Mostrar actividad</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Mostrar cuando estás en línea</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings?.show_activity ?? true}
                          onChange={(e) => toggleSetting.mutate({ key: 'show_activity', value: e.target.checked })}
                          disabled={settingsLoading || toggleSetting.isPending}
                          className="h-5 w-5 text-primary-600 rounded cursor-pointer"
                        />
                      </label>
                    </div>
                  </div>
                )}

                {/* Appearance Section */}
                {activeSection === 'appearance' && (
                  <div className="space-y-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {t('settings.appearance') || 'Apariencia'}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400">
                      {t('settings.appearanceDesc') || 'Personaliza cómo se ve la aplicación'}
                    </p>
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-3">
                        <button
                          onClick={() => setTheme('light')}
                          className={`p-4 rounded-lg border-2 transition-colors ${
                            theme === 'light'
                              ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          <div className="h-8 w-full bg-white border border-gray-200 rounded mb-2"></div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">Claro</p>
                        </button>
                        <button
                          onClick={() => setTheme('dark')}
                          className={`p-4 rounded-lg border-2 transition-colors ${
                            theme === 'dark'
                              ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          <div className="h-8 w-full bg-gray-800 rounded mb-2"></div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">Oscuro</p>
                        </button>
                        <button
                          onClick={() => setTheme('system')}
                          className={`p-4 rounded-lg border-2 transition-colors ${
                            theme === 'system'
                              ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          <div className="h-8 w-full bg-gradient-to-r from-white to-gray-800 rounded mb-2"></div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">Sistema</p>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Language Section */}
                {activeSection === 'language' && (
                  <div className="space-y-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {t('settings.language') || 'Idioma'}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400">
                      {t('settings.languageDesc') || 'Selecciona el idioma de la aplicación'}
                    </p>
                    <div className="space-y-3">
                      <button
                        onClick={() => handleLanguageChange('es')}
                        className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-colors ${
                          i18n.language === 'es'
                            ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">🇪🇸</span>
                          <span className="font-medium text-gray-900 dark:text-white">Español</span>
                        </div>
                        {i18n.language === 'es' && (
                          <span className="text-primary-600">✓</span>
                        )}
                      </button>
                      <button
                        onClick={() => handleLanguageChange('en')}
                        className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-colors ${
                          i18n.language === 'en'
                            ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">🇺🇸</span>
                          <span className="font-medium text-gray-900 dark:text-white">English</span>
                        </div>
                        {i18n.language === 'en' && (
                          <span className="text-primary-600">✓</span>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showLogoutDialog}
        onClose={() => setShowLogoutDialog(false)}
        onConfirm={handleLogout}
        title={t('settings.logoutTitle') || 'Cerrar sesión'}
        message={t('settings.logoutMessage') || '¿Estás seguro de que quieres cerrar sesión?'}
        confirmText={t('nav.logout')}
        type="danger"
      />
    </div>
  )
}

export default Settings
