import { useState } from 'react'
import { X, AlertTriangle, Flag } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'

const REPORT_REASONS = [
  { value: 'spam', label: 'Spam', description: 'Contenido no deseado o repetitivo' },
  { value: 'harassment', label: 'Acoso', description: 'Comportamiento abusivo o intimidante' },
  { value: 'hate_speech', label: 'Discurso de odio', description: 'Contenido que promueve odio' },
  { value: 'violence', label: 'Violencia', description: 'Amenazas o contenido violento' },
  { value: 'nudity', label: 'Contenido sexual', description: 'Desnudez o contenido para adultos' },
  { value: 'misinformation', label: 'Desinformación', description: 'Información falsa o engañosa' },
  { value: 'copyright', label: 'Derechos de autor', description: 'Violación de propiedad intelectual' },
  { value: 'other', label: 'Otro', description: 'Otra razón no listada' },
]

function ReportContentModal({ isOpen, onClose, contentType, contentId, contentPreview }) {
  const { user } = useAuthStore()
  const [selectedReason, setSelectedReason] = useState('')
  const [description, setDescription] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const reportMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('content_reports')
        .insert({
          reporter_id: user.id,
          content_type: contentType,
          content_id: contentId,
          reason: selectedReason,
          description: description.trim() || null,
          status: 'pending'
        })

      if (error) throw error
    },
    onSuccess: () => {
      setSubmitted(true)
      setTimeout(() => {
        handleClose()
      }, 2000)
    },
  })

  const handleClose = () => {
    setSelectedReason('')
    setDescription('')
    setSubmitted(false)
    onClose()
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!selectedReason) return
    reportMutation.mutate()
  }

  if (!isOpen) return null

  const getContentTypeLabel = () => {
    switch (contentType) {
      case 'post': return 'publicación'
      case 'movie': return 'película'
      case 'comment': return 'comentario'
      case 'message': return 'mensaje'
      default: return 'contenido'
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-red-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Reportar {getContentTypeLabel()}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {submitted ? (
          // Success message
          <div className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Reporte enviado
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Gracias por ayudarnos a mantener la comunidad segura. Revisaremos tu reporte pronto.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Content Preview */}
            {contentPreview && (
              <div className="px-4 pt-4">
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Contenido a reportar:
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                    {contentPreview}
                  </p>
                </div>
              </div>
            )}

            {/* Reason Selection */}
            <div className="p-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Selecciona el motivo del reporte
              </label>
              <div className="space-y-2">
                {REPORT_REASONS.map((reason) => (
                  <label
                    key={reason.value}
                    className={`flex items-start p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedReason === reason.value
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={reason.value}
                      checked={selectedReason === reason.value}
                      onChange={(e) => setSelectedReason(e.target.value)}
                      className="sr-only"
                    />
                    <div className="flex-1">
                      <p className={`font-medium ${
                        selectedReason === reason.value
                          ? 'text-red-700 dark:text-red-400'
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {reason.label}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {reason.description}
                      </p>
                    </div>
                    {selectedReason === reason.value && (
                      <svg className="h-5 w-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Additional Description */}
            <div className="px-4 pb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Descripción adicional (opcional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Proporciona más detalles sobre el problema..."
                rows={3}
                maxLength={500}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
              />
              <p className="text-xs text-gray-500 mt-1 text-right">
                {description.length}/500
              </p>
            </div>

            {/* Warning */}
            <div className="px-4 pb-4">
              <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-700 dark:text-yellow-400">
                  Los reportes falsos o malintencionados pueden resultar en restricciones a tu cuenta.
                </p>
              </div>
            </div>

            {/* Error message */}
            {reportMutation.isError && (
              <div className="px-4 pb-4">
                <p className="text-sm text-red-600 dark:text-red-400">
                  Error al enviar el reporte. Inténtalo de nuevo.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!selectedReason || reportMutation.isPending}
                className="flex-1 px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {reportMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Flag className="h-4 w-4" />
                    Enviar reporte
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default ReportContentModal
