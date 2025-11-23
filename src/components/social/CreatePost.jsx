import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, Video, X, Loader } from 'lucide-react'
import { useCreatePost, uploadMedia } from '../../hooks/usePosts'
import { useAuthStore } from '../../store/authStore'
import { useProfile } from '../../hooks/useProfiles'
import ErrorMessage from '../common/ErrorMessage'
import { useRateLimit } from '../../hooks/useRateLimit'
import RateLimitMessage from '../common/RateLimitMessage'

function CreatePost({ onSuccess }) {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const { data: profile } = useProfile(user?.id)
  const [content, setContent] = useState('')
  const [mediaFile, setMediaFile] = useState(null)
  const [mediaPreview, setMediaPreview] = useState(null)
  const [mediaType, setMediaType] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const imageInputRef = useRef(null)
  const videoInputRef = useRef(null)

  const createPost = useCreatePost()
  const { canPerformAction, performAction, remaining, limit, resetTime, isLimited } = useRateLimit('postCreation')

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError(t('post.imageSizeError'))
        return
      }
      setMediaFile(file)
      setMediaType('image')
      setMediaPreview(URL.createObjectURL(file))
      setError('')
    }
  }

  const handleVideoSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        setError(t('post.videoSizeError'))
        return
      }
      setMediaFile(file)
      setMediaType('video')
      setMediaPreview(URL.createObjectURL(file))
      setError('')
    }
  }

  const removeMedia = () => {
    setMediaFile(null)
    setMediaType(null)
    setMediaPreview(null)
    if (imageInputRef.current) imageInputRef.current.value = ''
    if (videoInputRef.current) videoInputRef.current.value = ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!content.trim() && !mediaFile) {
      setError(t('post.contentRequired'))
      return
    }

    // Verificar rate limit
    if (!canPerformAction) {
      setError(`Has alcanzado el límite de ${limit} publicaciones por día. Intenta más tarde.`)
      return
    }

    setUploading(true)
    setError('')

    try {
      let mediaUrl = null

      // Subir archivo si existe
      if (mediaFile) {
        mediaUrl = await uploadMedia(mediaFile, mediaType)
      }

      // Crear post
      await createPost.mutateAsync({
        content: content.trim(),
        mediaType: mediaType || 'none',
        mediaUrl,
      })

      // Registrar acción en rate limit
      performAction()

      // Limpiar formulario
      setContent('')
      removeMedia()
      onSuccess?.()
    } catch (err) {
      console.error('Error creating post:', err)
      setError(t('post.publishError'))
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
      <form onSubmit={handleSubmit}>
        <div className="flex space-x-3">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Avatar"
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold">
                {profile?.username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
          </div>

          {/* Input area */}
          <div className="flex-1">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t('post.createPlaceholder')}
              className="w-full border-0 focus:ring-0 resize-none text-lg placeholder-gray-500 dark:placeholder-gray-400 bg-transparent text-gray-900 dark:text-white"
              rows={3}
              disabled={uploading}
            />

            {/* Media preview */}
            {mediaPreview && (
              <div className="relative mt-3 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={removeMedia}
                  className="absolute top-2 right-2 bg-gray-900 bg-opacity-75 text-white rounded-full p-1 hover:bg-opacity-90"
                  disabled={uploading}
                >
                  <X className="h-5 w-5" />
                </button>
                {mediaType === 'image' ? (
                  <img
                    src={mediaPreview}
                    alt="Preview"
                    className="w-full max-h-96 object-cover"
                  />
                ) : (
                  <video
                    src={mediaPreview}
                    className="w-full max-h-96"
                    controls
                  />
                )}
              </div>
            )}

            {error && <ErrorMessage message={error} className="mt-3" />}

            {/* Rate Limit Message */}
            <RateLimitMessage
              actionType="postCreation"
              resetTime={resetTime}
              remaining={remaining}
              limit={limit}
            />

            {/* Remaining posts counter */}
            {!isLimited && remaining < 10 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Publicaciones restantes hoy: {remaining}/{limit}
              </p>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex space-x-2">
                {/* Image upload */}
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                  disabled={uploading || !!mediaFile}
                />
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={uploading || !!mediaFile}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full disabled:opacity-50"
                  title={t('post.attachImage')}
                >
                  <Image className="h-5 w-5" />
                </button>

                {/* Video upload */}
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleVideoSelect}
                  className="hidden"
                  disabled={uploading || !!mediaFile}
                />
                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  disabled={uploading || !!mediaFile}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full disabled:opacity-50"
                  title={t('post.attachVideo')}
                >
                  <Video className="h-5 w-5" />
                </button>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={uploading || (!content.trim() && !mediaFile)}
                className="btn btn-primary flex items-center space-x-2 disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    <span>{t('post.publishing')}</span>
                  </>
                ) : (
                  <span>{t('post.publish')}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

export default CreatePost
