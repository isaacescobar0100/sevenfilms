import { useTranslation } from 'react-i18next'
import type { LoadingSpinnerProps } from '../../types'

interface ExtendedLoadingSpinnerProps extends LoadingSpinnerProps {
  label?: string
}

const sizeClasses: Record<NonNullable<LoadingSpinnerProps['size']>, string> = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16',
}

function LoadingSpinner({ size = 'md', className = '', label }: ExtendedLoadingSpinnerProps) {
  const { t } = useTranslation()
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
