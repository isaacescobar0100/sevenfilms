import { useTranslation } from 'react-i18next'

/**
 * Componente de spinner de carga accesible
 * @param {Object} props
 * @param {'sm' | 'md' | 'lg' | 'xl'} props.size - Tamaño del spinner
 * @param {string} props.className - Clases CSS adicionales
 * @param {string} props.label - Texto alternativo para lectores de pantalla
 */
function LoadingSpinner({ size = 'md', className = '', label }) {
  const { t } = useTranslation()

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  }

  const loadingText = label || t('common.loading')

  return (
    <div
      className={`flex justify-center items-center ${className}`}
      role="status"
      aria-live="polite"
    >
      <div
        className={`animate-spin rounded-full border-b-2 border-primary-600 ${sizeClasses[size]}`}
        aria-hidden="true"
      />
      <span className="sr-only">{loadingText}</span>
    </div>
  )
}

export default LoadingSpinner
