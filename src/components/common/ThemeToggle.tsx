import { Moon, Sun, Monitor } from 'lucide-react'
import { useThemeStore } from '../../store/themeStore'
import { useTranslation } from 'react-i18next'

interface ThemeToggleProps {
  showLabel?: boolean
  className?: string
}

function ThemeToggle({ showLabel = false, className = '' }: ThemeToggleProps) {
  const { t } = useTranslation()
  const { theme, setTheme, toggleTheme } = useThemeStore()

  // Simple toggle entre light y dark
  if (!showLabel) {
    return (
      <button
        onClick={toggleTheme}
        className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${className}`}
        aria-label={t('settings.toggleTheme')}
      >
        <Sun className="h-5 w-5 text-gray-600 dark:text-gray-400 hidden dark:block" />
        <Moon className="h-5 w-5 text-gray-600 dark:text-gray-400 block dark:hidden" />
      </button>
    )
  }

  // Selector completo con opciones
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-sm text-gray-600 dark:text-gray-400">{t('settings.theme')}</span>
      <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        <button
          onClick={() => setTheme('light')}
          className={`p-1.5 rounded-md transition-colors ${
            theme === 'light'
              ? 'bg-white dark:bg-gray-700 shadow-sm'
              : 'hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          aria-label={t('settings.lightMode')}
        >
          <Sun className="h-4 w-4" />
        </button>
        <button
          onClick={() => setTheme('dark')}
          className={`p-1.5 rounded-md transition-colors ${
            theme === 'dark'
              ? 'bg-white dark:bg-gray-700 shadow-sm'
              : 'hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          aria-label={t('settings.darkMode')}
        >
          <Moon className="h-4 w-4" />
        </button>
        <button
          onClick={() => setTheme('system')}
          className={`p-1.5 rounded-md transition-colors ${
            theme === 'system'
              ? 'bg-white dark:bg-gray-700 shadow-sm'
              : 'hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          aria-label={t('settings.systemMode')}
        >
          <Monitor className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export default ThemeToggle
