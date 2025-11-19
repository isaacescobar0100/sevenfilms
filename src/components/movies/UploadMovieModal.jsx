import { useState, useEffect } from 'react'
import { X, Upload, Film, Wand2, Subtitles } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useUploadMovie } from '../../hooks/useMovies'
import { useFFmpeg } from '../../hooks/useFFmpeg'
import { useSubtitles } from '../../hooks/useSubtitles'
import LoadingSpinner from '../common/LoadingSpinner'
import { useRateLimit } from '../../hooks/useRateLimit'
import RateLimitMessage from '../common/RateLimitMessage'

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
  const [processingVideo, setProcessingVideo] = useState(false)
  const [videoDuration, setVideoDuration] = useState(null)
  const [videoResolution, setVideoResolution] = useState(null)
  const [thumbnailResolution, setThumbnailResolution] = useState('1280')
  const [subtitleFile, setSubtitleFile] = useState(null)
  const [videoQualities, setVideoQualities] = useState(null)
  const [qualityProgress, setQualityProgress] = useState(null)

  const uploadMovie = useUploadMovie()
  const { loaded: ffmpegLoaded, loading: ffmpegLoading, generateThumbnail, getVideoDuration, getVideoResolution, generateMultipleQualities } = useFFmpeg()
  const { generating: generatingSubtitles, progress: subtitleProgress, generateSubtitles } = useSubtitles()
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

    // Extraer duración y resolución del video si FFmpeg está cargado
    if (ffmpegLoaded) {
      setProcessingVideo(true)
      try {
        // Obtener duración y resolución en paralelo
        const [duration, resolution] = await Promise.all([
          getVideoDuration(file),
          getVideoResolution(file)
        ])
        setVideoDuration(duration)
        setVideoResolution(resolution)
      } catch (err) {
        console.error('Error processing video:', err)
      }
      setProcessingVideo(false)
    }
  }

  const handleGenerateQualities = async () => {
    if (!videoFile || !ffmpegLoaded) return

    setProcessingVideo(true)
    setError('')
    setQualityProgress(null)

    try {
      const qualities = await generateMultipleQualities(videoFile, (progress) => {
        setQualityProgress(progress)
      })
      setVideoQualities(qualities)
    } catch (err) {
      console.error('Error generating qualities:', err)
      setError('Error al generar las calidades de video. El video original se subirá sin múltiples calidades.')
    }

    setProcessingVideo(false)
    setQualityProgress(null)
  }

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

  const handleAutoGenerateThumbnail = async () => {
    if (!videoFile || !ffmpegLoaded) return

    setProcessingVideo(true)
    setError('')

    try {
      const thumbnail = await generateThumbnail(videoFile, 1, thumbnailResolution)
      setThumbnailFile(thumbnail)
    } catch (err) {
      console.error('Error generating thumbnail:', err)
      setError('Error al generar la miniatura. Intenta subirla manualmente.')
    }

    setProcessingVideo(false)
  }

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

  const handleGenerateSubtitles = async () => {
    if (!videoFile) return

    setError('')

    try {
      const subtitles = await generateSubtitles(videoFile)
      setSubtitleFile(subtitles)
    } catch (err) {
      console.error('Error generating subtitles:', err)
      setError(err.message || 'Error al generar subtítulos. Intenta subirlos manualmente.')
    }
  }

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

      onClose()
    } catch (err) {
      console.error('Error uploading movie:', err)
      setError('Error al subir la película. Inténtalo de nuevo.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>

      {/* Modal */}
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Subir película</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
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
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  Puedes subir {remaining} de {limit} películas hoy
                </p>
              </div>
            )}

            {/* Video Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Video <span className="text-red-600">*</span>
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-500 transition-colors">
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
                      <Film className="h-12 w-12 text-primary-600 mb-2" />
                      <p className="font-medium text-gray-900">{videoFile.name}</p>
                      <p className="text-sm text-gray-500">
                        {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                      {videoResolution && (
                        <p className="text-sm text-primary-600 mt-1">
                          Resolución: {videoResolution.width}x{videoResolution.height}
                        </p>
                      )}
                      {videoDuration && (
                        <p className="text-sm text-gray-500">
                          Duración: {Math.floor(videoDuration / 60)}:{(videoDuration % 60).toString().padStart(2, '0')}
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <Upload className="h-12 w-12 text-gray-400 mb-2" />
                      <p className="font-medium text-gray-900">
                        Haz clic para subir un video
                      </p>
                      <p className="text-sm text-gray-500">MP4, MOV, AVI (max. 500MB)</p>
                    </>
                  )}
                </label>
              </div>

              {/* Generate Multiple Qualities Button */}
              {videoFile && ffmpegLoaded && !videoQualities && (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={handleGenerateQualities}
                    disabled={processingVideo || isSubmitting}
                    className="w-full btn btn-secondary flex items-center justify-center space-x-2"
                  >
                    <Film className="h-4 w-4" />
                    <span>Generar múltiples calidades (1080p, 720p, 480p, 360p)</span>
                  </button>
                  <p className="text-xs text-gray-500 mt-1 text-center">
                    Recomendado para mejor experiencia de usuario
                  </p>
                </div>
              )}

              {/* Quality Generation Progress */}
              {qualityProgress && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800 mb-2">
                    Generando calidad {qualityProgress.quality}... ({qualityProgress.current}/{qualityProgress.total})
                  </p>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${(qualityProgress.current / qualityProgress.total) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Qualities Generated Confirmation */}
              {videoQualities && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800 font-medium">
                    ✓ Calidades generadas: {Object.keys(videoQualities).join(', ')}
                  </p>
                </div>
              )}
            </div>

            {/* Thumbnail Upload */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Miniatura (opcional)
                </label>
                {videoFile && ffmpegLoaded && !thumbnailFile && (
                  <button
                    type="button"
                    onClick={handleAutoGenerateThumbnail}
                    disabled={processingVideo || isSubmitting}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center space-x-1"
                  >
                    <Wand2 className="h-4 w-4" />
                    <span>Generar automáticamente</span>
                  </button>
                )}
              </div>

              {/* Resolution selector for thumbnail */}
              {videoFile && ffmpegLoaded && !thumbnailFile && (
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Resolución del thumbnail
                  </label>
                  <select
                    value={thumbnailResolution}
                    onChange={(e) => setThumbnailResolution(e.target.value)}
                    className="input text-sm"
                    disabled={processingVideo || isSubmitting}
                  >
                    <option value="640">640px (baja calidad)</option>
                    <option value="854">854px (SD)</option>
                    <option value="1280">1280px (HD - recomendado)</option>
                    <option value="1920">1920px (Full HD)</option>
                    <option value="2560">2560px (2K)</option>
                    <option value="3840">3840px (4K)</option>
                  </select>
                </div>
              )}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary-500 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailChange}
                  className="hidden"
                  id="thumbnail-upload"
                  disabled={isSubmitting || processingVideo}
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
                      <p className="text-sm text-gray-600">{thumbnailFile.name}</p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          setThumbnailFile(null)
                        }}
                        className="text-xs text-red-600 hover:text-red-700 mt-1"
                      >
                        Eliminar
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-gray-400 mb-1" />
                      <p className="text-sm text-gray-600">Subir miniatura</p>
                      <p className="text-xs text-gray-500">JPG, PNG (max. 5MB)</p>
                    </>
                  )}
                </label>
              </div>
              {ffmpegLoading && (
                <p className="text-xs text-gray-500 mt-1">Cargando procesador de video...</p>
              )}
              {processingVideo && (
                <div className="flex items-center justify-center space-x-2 mt-2">
                  <LoadingSpinner size="sm" />
                  <p className="text-sm text-gray-600">Procesando video...</p>
                </div>
              )}
            </div>

            {/* Subtitles Upload */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Subtítulos (opcional)
                </label>
                {videoFile && !subtitleFile && (
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

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary-500 transition-colors">
                <input
                  type="file"
                  accept=".srt,.vtt"
                  onChange={handleSubtitleChange}
                  className="hidden"
                  id="subtitle-upload"
                  disabled={isSubmitting || generatingSubtitles}
                />
                <label
                  htmlFor="subtitle-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  {subtitleFile ? (
                    <div className="w-full">
                      <Subtitles className="h-8 w-8 text-primary-600 mx-auto mb-1" />
                      <p className="text-sm text-gray-600">{subtitleFile.name}</p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          setSubtitleFile(null)
                        }}
                        className="text-xs text-red-600 hover:text-red-700 mt-1"
                      >
                        Eliminar
                      </button>
                    </div>
                  ) : (
                    <>
                      <Subtitles className="h-8 w-8 text-gray-400 mb-1" />
                      <p className="text-sm text-gray-600">Subir subtítulos</p>
                      <p className="text-xs text-gray-500">SRT, VTT (max. 1MB)</p>
                    </>
                  )}
                </label>
              </div>

              {generatingSubtitles && (
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all"
                      style={{ width: `${subtitleProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-600 mt-1 text-center">
                    Generando subtítulos... {Math.round(subtitleProgress)}%
                  </p>
                </div>
              )}
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título <span className="text-red-600">*</span>
              </label>
              <input
                {...register('title')}
                type="text"
                className="input"
                placeholder="El nombre de tu película"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                {...register('description')}
                rows={4}
                className="input"
                placeholder="Describe de qué trata tu película..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            {/* Genre and Year */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Género <span className="text-red-600">*</span>
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
                  <p className="mt-1 text-sm text-red-600">{errors.genre.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Año
                </label>
                <input
                  {...register('year')}
                  type="number"
                  className="input"
                  placeholder={new Date().getFullYear().toString()}
                />
                {errors.year && (
                  <p className="mt-1 text-sm text-red-600">{errors.year.message}</p>
                )}
              </div>
            </div>

            {/* Upload Progress */}
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-1 text-center">
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
