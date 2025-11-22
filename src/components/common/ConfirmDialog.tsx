import { useTranslation } from 'react-i18next'
import { AlertTriangle, Info, Trash2, X } from 'lucide-react'
import type { MouseEvent } from 'react'

type DialogType = 'danger' | 'warning' | 'info'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: DialogType
}

function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  type = 'danger'
}: ConfirmDialogProps) {
  const { t } = useTranslation()

  if (!isOpen) return null

  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  const handleBackdropClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <Trash2 className="h-6 w-6 text-red-600" />
      case 'warning':
        return <AlertTriangle className="h-6 w-6 text-yellow-600" />
      case 'info':
        return <Info className="h-6 w-6 text-blue-600" />
      default:
        return <AlertTriangle className="h-6 w-6 text-red-600" />
    }
  }

  const getIconBgColor = () => {
    switch (type) {
      case 'danger':
        return 'bg-red-100 dark:bg-red-900/20'
      case 'warning':
        return 'bg-yellow-100 dark:bg-yellow-900/20'
      case 'info':
        return 'bg-blue-100 dark:bg-blue-900/20'
      default:
        return 'bg-red-100 dark:bg-red-900/20'
    }
  }

  const getConfirmButtonClasses = () => {
    const baseClasses = 'flex-1 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 transform hover:scale-[1.02]'

    switch (type) {
      case 'danger':
        return `${baseClasses} bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 shadow-md hover:shadow-lg`
      case 'warning':
        return `${baseClasses} bg-yellow-600 hover:bg-yellow-700 text-white focus:ring-yellow-500 shadow-md hover:shadow-lg`
      case 'info':
        return `${baseClasses} bg-primary-600 hover:bg-primary-700 text-white focus:ring-primary-500 shadow-md hover:shadow-lg`
      default:
        return `${baseClasses} bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 shadow-md hover:shadow-lg`
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl transform transition-all animate-in zoom-in-95 duration-200">
        {/* Header con botón de cerrar */}
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Icon & Content */}
        <div className="px-6 pb-6">
          <div className="flex items-start space-x-4">
            <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${getIconBgColor()}`}>
              {getIcon()}
            </div>
            <div className="flex-1 pt-1">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                {title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {message}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-3 px-6 pb-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transform hover:scale-[1.02]"
          >
            {cancelText || t('common.cancel')}
          </button>
          <button
            onClick={handleConfirm}
            className={getConfirmButtonClasses()}
          >
            {confirmText || t('common.delete')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
