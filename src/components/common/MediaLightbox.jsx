import { useEffect, useCallback } from 'react'
import { X, ZoomIn, ZoomOut, Download } from 'lucide-react'
import { createPortal } from 'react-dom'

function MediaLightbox({ isOpen, onClose, mediaUrl, mediaType = 'image', alt = 'Media' }) {
  // Close on escape key
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }, [onClose])

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleKeyDown])

  if (!isOpen) return null

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleDownload = async () => {
    try {
      const response = await fetch(mediaUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `media_${Date.now()}.${mediaType === 'video' ? 'mp4' : 'jpg'}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading media:', error)
      // Fallback: open in new tab
      window.open(mediaUrl, '_blank')
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
        aria-label="Cerrar"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Download button */}
      <button
        onClick={handleDownload}
        className="absolute top-4 right-16 z-10 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
        aria-label="Descargar"
      >
        <Download className="w-6 h-6" />
      </button>

      {/* Media content */}
      <div className="max-w-[95vw] max-h-[95vh] flex items-center justify-center">
        {mediaType === 'video' ? (
          <video
            src={mediaUrl}
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            controls
            autoPlay
            playsInline
          />
        ) : (
          <img
            src={mediaUrl}
            alt={alt}
            className="max-w-full max-h-[90vh] object-contain rounded-lg select-none"
            draggable={false}
          />
        )}
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
        Presiona ESC o haz clic afuera para cerrar
      </div>
    </div>,
    document.body
  )
}

export default MediaLightbox
