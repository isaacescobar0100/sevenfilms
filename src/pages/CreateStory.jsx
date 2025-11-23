import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { X, Image, Type, Send, Palette } from 'lucide-react'
import { useCreateStory, uploadStoryMedia } from '../hooks/useStories'
import LoadingSpinner from '../components/common/LoadingSpinner'

const BACKGROUND_COLORS = [
  '#1a1a1a', // Negro
  '#ef4444', // Rojo
  '#f97316', // Naranja
  '#eab308', // Amarillo
  '#22c55e', // Verde
  '#06b6d4', // Cyan
  '#3b82f6', // Azul
  '#8b5cf6', // Violeta
  '#ec4899', // Rosa
  '#6366f1', // Índigo
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', // Gradient 1
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', // Gradient 2
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', // Gradient 3
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', // Gradient 4
]

function CreateStory() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [mode, setMode] = useState(null) // 'media' o 'text'
  const [mediaFile, setMediaFile] = useState(null)
  const [mediaPreview, setMediaPreview] = useState(null)
  const [mediaType, setMediaType] = useState('image')
  const [text, setText] = useState('')
  const [backgroundColor, setBackgroundColor] = useState(BACKGROUND_COLORS[0])
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef(null)

  const createStory = useCreateStory()

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const isVideo = file.type.startsWith('video/')
    setMediaType(isVideo ? 'video' : 'image')
    setMediaFile(file)
    setMediaPreview(URL.createObjectURL(file))
    setMode('media')
  }

  const handleSubmit = async () => {
    if (isUploading) return

    try {
      setIsUploading(true)

      let mediaUrl = null

      if (mediaFile) {
        const uploaded = await uploadStoryMedia(mediaFile)
        mediaUrl = uploaded.url
      }

      await createStory.mutateAsync({
        mediaUrl,
        mediaType: mediaFile ? mediaType : null,
        text: text.trim() || null,
        backgroundColor: mode === 'text' ? backgroundColor : null,
      })

      navigate('/feed')
    } catch (error) {
      console.error('Error creating story:', error)
    } finally {
      setIsUploading(false)
    }
  }

  const canSubmit = mode === 'text' ? text.trim().length > 0 : mediaFile !== null

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 flex-shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="p-2 text-white hover:bg-white/10 rounded-full"
        >
          <X className="h-6 w-6" />
        </button>
        <h1 className="text-white font-semibold">
          {t('stories.create', 'Crear historia')}
        </h1>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || isUploading}
          className="px-4 py-2 bg-primary-600 text-white rounded-full font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isUploading ? (
            <LoadingSpinner size="sm" />
          ) : (
            <>
              <Send className="h-4 w-4" />
              {t('common.publish', 'Publicar')}
            </>
          )}
        </button>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden min-h-0">
        {!mode ? (
          // Selector de modo
          <div className="flex gap-6">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center gap-3 p-8 bg-white/10 rounded-2xl hover:bg-white/20 transition-colors"
            >
              <div className="p-4 bg-primary-600 rounded-full">
                <Image className="h-8 w-8 text-white" />
              </div>
              <span className="text-white font-medium">
                {t('stories.addMedia', 'Foto/Video')}
              </span>
            </button>
            <button
              onClick={() => setMode('text')}
              className="flex flex-col items-center gap-3 p-8 bg-white/10 rounded-2xl hover:bg-white/20 transition-colors"
            >
              <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full">
                <Type className="h-8 w-8 text-white" />
              </div>
              <span className="text-white font-medium">
                {t('stories.textOnly', 'Solo texto')}
              </span>
            </button>
          </div>
        ) : mode === 'text' ? (
          // Modo texto
          <div
            className="w-full max-w-md h-full max-h-[80vh] rounded-2xl flex flex-col items-center justify-center p-6 relative"
            style={{
              background: backgroundColor.includes('gradient')
                ? backgroundColor
                : backgroundColor,
              aspectRatio: '9/16',
            }}
          >
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t('stories.writeText', 'Escribe algo...')}
              className="w-full h-40 bg-transparent text-white text-2xl font-bold text-center resize-none outline-none placeholder-white/50"
              autoFocus
            />

            {/* Selector de color */}
            <div className="absolute bottom-4 left-4 right-4">
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                <Palette className="h-5 w-5 text-white/70 flex-shrink-0" />
                {BACKGROUND_COLORS.map((color, index) => (
                  <button
                    key={index}
                    onClick={() => setBackgroundColor(color)}
                    className={`w-8 h-8 rounded-full flex-shrink-0 border-2 ${
                      backgroundColor === color
                        ? 'border-white scale-110'
                        : 'border-transparent'
                    }`}
                    style={{
                      background: color.includes('gradient') ? color : color,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          // Modo media
          <div
            className="w-full max-w-md h-full max-h-[80vh] rounded-2xl overflow-hidden bg-gray-900 relative flex items-center justify-center"
            style={{ aspectRatio: '9/16' }}
          >
            {mediaPreview && (
              mediaType === 'video' ? (
                <video
                  src={mediaPreview}
                  className="w-full h-full object-contain"
                  controls
                />
              ) : (
                <img
                  src={mediaPreview}
                  alt="Preview"
                  className="w-full h-full object-contain"
                />
              )
            )}

            {/* Campo de texto opcional */}
            <div className="absolute bottom-4 left-4 right-4">
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={t('stories.addCaption', 'Añade un texto...')}
                className="w-full px-4 py-2 bg-black/50 text-white rounded-full placeholder-white/50 outline-none border border-white/20 focus:border-white/50"
              />
            </div>

            {/* Botón cambiar media */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute top-4 right-4 p-2 bg-black/50 rounded-full text-white hover:bg-black/70"
            >
              <Image className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      {/* Input de archivo oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Botón volver al selector */}
      {mode && (
        <div className="p-4 flex justify-center flex-shrink-0">
          <button
            onClick={() => {
              setMode(null)
              setMediaFile(null)
              setMediaPreview(null)
              setText('')
            }}
            className="text-white/70 hover:text-white text-sm"
          >
            {t('stories.changeType', 'Cambiar tipo de historia')}
          </button>
        </div>
      )}
    </div>
  )
}

export default CreateStory
