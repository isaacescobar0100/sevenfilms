import { useState, useEffect } from 'react'
import { X, Upload, Film, Subtitles, CheckCircle, Clock } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useUploadMovie } from '../../hooks/useMovies'
// import { useFFmpeg } from '../../hooks/useFFmpeg' // DESHABILITADO: Se moverá a backend
// import { useWhisperAI } from '../../hooks/useWhisperAI' // DESHABILITADO: Problema con transformers.js
import LoadingSpinner from '../common/LoadingSpinner'
import { useRateLimit } from '../../hooks/useRateLimit'
import RateLimitMessage from '../common/RateLimitMessage'
import { captureError } from '../../lib/sentry'

const GENRES = [
  'Drama',
  'Comedia',
  'Acción',
  'Documental',
  'Thriller',
  'Terror',
  'Ciencia Ficción',
  'Romance',
  'Animación',
  'Experimental',
]

const uploadMovieSchema = z.object({
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres'),
  description: z.string().optional(),
  genre: z.string().min(1, 'Selecciona un género'),
  year: z.coerce.number().min(1900).max(new Date().getFullYear() + 1).optional(),
})

function UploadMovieModal({ onClose }) {
  const [videoFile, setVideoFile] = useState(null)
  const [thumbnailFile, setThumbnailFile] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState('')
  const [videoDuration, setVideoDuration] = useState(null)
  const [subtitleFile, setSubtitleFile] = useState(null)
  const [videoQualities, setVideoQualities] = useState(null)
  const [uploadSuccess, setUploadSuccess] = useState(false)

  const uploadMovie = useUploadMovie()
  // FFmpeg deshabilitado temporalmente - se moverá a backend
  // const { loaded: ffmpegLoaded, loading: ffmpegLoading, generateThumbnail, getVideoDuration, getVideoResolution, generateMultipleQualities } = useFFmpeg()
  // const { loading: generatingSubtitles, loadingModel, progress: subtitleProgress, error: subtitleError, generateSubtitles } = useWhisperAI() // DESHABILITADO
  const { canPerformAction, performAction, remaining, limit, resetTime, isLimited } = useRateLimit('movieUpload')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(uploadMovieSchema),
    defaultValues: {
      title: '',
      description: '',
      genre: '',
      year: new Date().getFullYear(),
    },
  })

  const handleVideoChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tamaño (max 500MB)
    if (file.size > 500 * 1024 * 1024) {
      setError('El video no puede superar los 500MB')
      return
    }

    // Validar tipo
    if (!file.type.startsWith('video/')) {
      setError('Solo se permiten archivos de video')
      return
    }

    setVideoFile(file)
    setVideoQualities(null)
    setError('')

    // TODO: Extraer duración del video usando backend
    // Por ahora subimos el video original sin procesamiento
  }

  // DESHABILITADO: Generación de calidades se moverá al backend
  // const handleGenerateQualities = async () => {
  //   // Esta funcionalidad se implementará en el backend usando FFmpeg
  //   // cuando tengamos un servidor Node.js o Cloud Function
  // }

  const handleThumbnailChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tamaño (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('La miniatura no puede superar los 5MB')
      return
    }

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      setError('Solo se permiten imágenes para la miniatura')
      return
    }

    setThumbnailFile(file)
    setError('')
  }

  // DESHABILITADO: Generación de thumbnail se moverá al backend
  // const handleAutoGenerateThumbnail = async () => {
  //   // Esta funcionalidad se implementará en el backend
  // }

  const handleSubtitleChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tamaño (max 1MB)
    if (file.size > 1 * 1024 * 1024) {
      setError('El archivo de subtítulos no puede superar 1MB')
      return
    }

    // Validar extensión
    const extension = file.name.split('.').pop()?.toLowerCase()
    if (extension !== 'srt' && extension !== 'vtt') {
      setError('Solo se permiten archivos SRT o VTT')
      return
    }

    setSubtitleFile(file)
    setError('')
  }

  // DESHABILITADO: Función para generar subtítulos automáticos con IA
  // const handleGenerateSubtitles = async () => {
  //   if (!videoFile) return
  //   setError('')
  //   try {
  //     const subtitles = await generateSubtitles(videoFile, {
  //       language: 'spanish',
  //       chunkLengthSeconds: 30,
  //       onChunkProgress: (data) => {
  //         console.log('Whisper progress:', data)
  //       }
  //     })
  //     setSubtitleFile(subtitles)
  //   } catch (err) {
  //     console.error('Error generating subtitles:', err)
  //     setError(subtitleError || err.message || 'Error al generar subtítulos. Intenta subirlos manualmente.')
  //   }
  // }

  const onSubmit = async (data) => {
    if (!videoFile) {
      setError('Debes seleccionar un video')
      return
    }

    // Verificar rate limit
    if (!canPerformAction) {
      setError(`Has alcanzado el límite de ${limit} películas por día. Intenta mañana.`)
      return
    }

    setError('')
    try {
      await uploadMovie.mutateAsync({
        ...data,
        videoFile,
        videoQualities,
        thumbnailFile,
        subtitleFile,
        duration: videoDuration,
      })

      // Registrar acción en rate limit
      performAction()

      // Mostrar mensaje de éxito con información de moderación
      setUploadSuccess(true)
    } catch (err) {
      console.error('Error uploading movie:', err)
      setError('Error al subir la película. Inténtalo de nuevo.')
    }
  }

  // Pantalla de éxito después de subir
  if (uploadSuccess) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Película subida correctamente
            </h2>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                <span className="font-medium text-yellow-800 dark:text-yellow-200">
                  Pendiente de revisión
                </span>
              </div>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Tu película será revisada por nuestro equipo antes de ser publicada.
                Te notificaremos cuando esté disponible.
              </p>
            </div>
            <button
              onClick={onClose}
              className="btn btn-primary w-full"
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>

      {/* Modal */}
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Subir película</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
              </div>
            )}

            {/* Rate Limit Message */}
            <RateLimitMessage
              actionType="movieUpload"
              resetTime={resetTime}
              remaining={remaining}
              limit={limit}
            />

            {/* Remaining uploads counter */}
            {!isLimited && remaining <= limit && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  Puedes subir {remaining} de {limit} películas hoy
                </p>
              </div>
            )}

            {/* Video Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Video <span className="text-red-600 dark:text-red-400">*</span>
              </label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-primary-500 dark:hover:border-primary-400 transition-colors">
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoChange}
                  className="hidden"
                  id="video-upload"
                  disabled={isSubmitting}
                />
                <label
                  htmlFor="video-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  {videoFile ? (
                    <>
                      <Film className="h-12 w-12 text-primary-600 dark:text-primary-400 mb-2" />
                      <p className="font-medium text-gray-900 dark:text-white">{videoFile.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                      {videoDuration && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Duración: {Math.floor(videoDuration / 60)}:{(videoDuration % 60).toString().padStart(2, '0')}
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <Upload className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-2" />
                      <p className="font-medium text-gray-900 dark:text-white">
                        Haz clic para subir un video
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">MP4, MOV, AVI (max. 500MB)</p>
                    </>
                  )}
                </label>
              </div>

              {/* Informative message about upcoming features */}
              {videoFile && (
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">
                    📹 Múltiples calidades de video - Próximamente
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    Pronto podrás generar automáticamente versiones en 1080p, 720p, 480p y 360p.
                    Tu video se sube actualmente en calidad original.
                  </p>
                </div>
              )}
            </div>

            {/* Thumbnail Upload */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Miniatura (opcional)
                </label>
              </div>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center hover:border-primary-500 dark:hover:border-primary-400 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailChange}
                  className="hidden"
                  id="thumbnail-upload"
                  disabled={isSubmitting}
                />
                <label
                  htmlFor="thumbnail-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  {thumbnailFile ? (
                    <div className="w-full">
                      <img
                        src={URL.createObjectURL(thumbnailFile)}
                        alt="Miniatura"
                        className="max-h-32 mx-auto rounded mb-2"
                      />
                      <p className="text-sm text-gray-600 dark:text-gray-400">{thumbnailFile.name}</p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          setThumbnailFile(null)
                        }}
                        className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 mt-1"
                      >
                        Eliminar
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-gray-400 dark:text-gray-500 mb-1" />
                      <p className="text-sm text-gray-600 dark:text-gray-400">Subir miniatura</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">JPG, PNG (max. 5MB)</p>
                    </>
                  )}
                </label>
              </div>
            </div>

            {/* Subtitles Upload */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Subtítulos (opcional)
                </label>
                {/* TEMPORALMENTE DESHABILITADO - Problema con @xenova/transformers */}
                {false && videoFile && !subtitleFile && (
                  <button
                    type="button"
                    onClick={handleGenerateSubtitles}
                    disabled={generatingSubtitles || isSubmitting}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center space-x-1"
                  >
                    <Subtitles className="h-4 w-4" />
                    <span>Generar automáticamente</span>
                  </button>
                )}
              </div>

              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center hover:border-primary-500 dark:hover:border-primary-400 transition-colors">
                <input
                  type="file"
                  accept=".srt,.vtt"
                  onChange={handleSubtitleChange}
                  className="hidden"
                  id="subtitle-upload"
                  disabled={isSubmitting}
                />
                <label
                  htmlFor="subtitle-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  {subtitleFile ? (
                    <div className="w-full">
                      <Subtitles className="h-8 w-8 text-primary-600 dark:text-primary-400 mx-auto mb-1" />
                      <p className="text-sm text-gray-600 dark:text-gray-400">{subtitleFile.name}</p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          setSubtitleFile(null)
                        }}
                        className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 mt-1"
                      >
                        Eliminar
                      </button>
                    </div>
                  ) : (
                    <>
                      <Subtitles className="h-8 w-8 text-gray-400 dark:text-gray-500 mb-1" />
                      <p className="text-sm text-gray-600 dark:text-gray-400">Subir subtítulos</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">SRT, VTT (max. 1MB)</p>
                    </>
                  )}
                </label>
              </div>

              {/* DESHABILITADO: Progress de generación de subtítulos */}
              {/* {loadingModel && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-center space-x-2">
                    <LoadingSpinner size="sm" />
                    <p className="text-sm text-blue-800">
                      Descargando modelo de IA (~40MB, solo la primera vez)...
                    </p>
                  </div>
                </div>
              )}

              {generatingSubtitles && !loadingModel && (
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all"
                      style={{ width: `${subtitleProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-600 mt-1 text-center">
                    Generando subtítulos con IA... {Math.round(subtitleProgress)}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1 text-center">
                    Esto puede tardar varios minutos dependiendo de la duración del video
                  </p>
                </div>
              )}

              {subtitleError && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{subtitleError}</p>
                </div>
              )} */}
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Título <span className="text-red-600 dark:text-red-400">*</span>
              </label>
              <input
                {...register('title')}
                type="text"
                className="input"
                placeholder="El nombre de tu película"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.title.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Descripción
              </label>
              <textarea
                {...register('description')}
                rows={4}
                className="input"
                placeholder="Describe de qué trata tu película..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description.message}</p>
              )}
            </div>

            {/* Genre and Year */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Género <span className="text-red-600 dark:text-red-400">*</span>
                </label>
                <select {...register('genre')} className="input">
                  <option value="">Selecciona un género</option>
                  {GENRES.map((genre) => (
                    <option key={genre} value={genre}>
                      {genre}
                    </option>
                  ))}
                </select>
                {errors.genre && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.genre.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Año
                </label>
                <input
                  {...register('year')}
                  type="number"
                  className="input"
                  placeholder={new Date().getFullYear().toString()}
                />
                {errors.year && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.year.message}</p>
                )}
              </div>
            </div>

            {/* Upload Progress */}
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 text-center">
                  Subiendo... {uploadProgress}%
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary min-w-[120px]"
                disabled={isSubmitting || !videoFile}
              >
                {isSubmitting ? <LoadingSpinner size="sm" /> : 'Subir película'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default UploadMovieModal
