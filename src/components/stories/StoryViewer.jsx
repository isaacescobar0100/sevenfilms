import { useState, useEffect, useRef } from 'react'
import { X, ChevronLeft, ChevronRight, Trash2, Eye, Pause, Play, Send, Heart } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { es, enUS } from 'date-fns/locale'
import { useViewStory, useDeleteStory, useStoryViews, useStoryReaction, useStoryReactions, useStoryReply } from '../../hooks/useStories'
import { useAuthStore } from '../../store/authStore'
import ConfirmDialog from '../common/ConfirmDialog'
import { ReactionIcon, ReactionPicker, REACTIONS } from '../common/ReactionButton'

function StoryViewer({ storiesData, initialUserIndex, onClose }) {
  const { t, i18n } = useTranslation()
  const { user } = useAuthStore()
  const [currentUserIndex, setCurrentUserIndex] = useState(initialUserIndex)
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [showViewers, setShowViewers] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showReactions, setShowReactions] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [showReplyInput, setShowReplyInput] = useState(false)
  const [replySent, setReplySent] = useState(false)
  const progressInterval = useRef(null)
  const videoRef = useRef(null)
  const replyInputRef = useRef(null)

  const viewStory = useViewStory()
  const deleteStory = useDeleteStory()
  const storyReaction = useStoryReaction()
  const storyReply = useStoryReply()

  const locale = i18n.language === 'es' ? es : enUS
  const currentUser = storiesData[currentUserIndex]
  const currentStory = currentUser?.stories?.[currentStoryIndex]
  // Verificar si es propia comparando directamente con el user_id del usuario actual
  const isOwn = currentUser?.user_id === user?.id

  // Query para ver quién vio (solo si es propia)
  const { data: viewers = [] } = useStoryViews(isOwn ? currentStory?.id : null)

  // Query para reacciones
  const { data: reactionsData } = useStoryReactions(currentStory?.id)

  // Marcar como vista
  useEffect(() => {
    if (currentStory && !currentStory.isViewed && !isOwn) {
      viewStory.mutate(currentStory.id)
    }
  }, [currentStory?.id])

  // Bloquear scroll del body cuando el visor está abierto
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  // Progreso automático
  useEffect(() => {
    if (isPaused || !currentStory) return

    const duration = currentStory.media_type === 'video' ? 15000 : 5000 // 15s para video, 5s para imagen
    const intervalTime = 50
    const increment = (intervalTime / duration) * 100

    setProgress(0)
    progressInterval.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval.current)
          goToNext()
          return 0
        }
        return prev + increment
      })
    }, intervalTime)

    return () => clearInterval(progressInterval.current)
  }, [currentStoryIndex, currentUserIndex, isPaused])

  const goToNext = () => {
    if (currentStoryIndex < currentUser.stories.length - 1) {
      setCurrentStoryIndex(prev => prev + 1)
    } else if (currentUserIndex < storiesData.length - 1) {
      setCurrentUserIndex(prev => prev + 1)
      setCurrentStoryIndex(0)
    } else {
      onClose()
    }
  }

  const goToPrev = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1)
    } else if (currentUserIndex > 0) {
      setCurrentUserIndex(prev => prev - 1)
      const prevUser = storiesData[currentUserIndex - 1]
      setCurrentStoryIndex(prevUser.stories.length - 1)
    }
  }

  const handleDelete = async () => {
    try {
      await deleteStory.mutateAsync(currentStory.id)
      setShowDeleteConfirm(false)
      if (currentUser.stories.length === 1) {
        onClose()
      } else {
        goToNext()
      }
    } catch (error) {
      console.error('Error deleting story:', error)
    }
  }

  // Manejar reacción
  const handleReaction = async (reaction) => {
    try {
      setIsPaused(true)
      await storyReaction.mutateAsync({ storyId: currentStory.id, reaction })
      setShowReactions(false)
      // Mostrar animación de reacción
      setTimeout(() => setIsPaused(false), 500)
    } catch (error) {
      console.error('Error reacting to story:', error)
    }
  }

  // Manejar respuesta
  const handleReply = async () => {
    if (!replyText.trim()) return

    try {
      await storyReply.mutateAsync({
        storyId: currentStory.id,
        storyOwnerId: currentUser.user_id,
        message: replyText,
      })
      setReplyText('')
      setShowReplyInput(false)
      setReplySent(true)
      setTimeout(() => setReplySent(false), 2000)
      setIsPaused(false)
    } catch (error) {
      console.error('Error replying to story:', error)
    }
  }

  // Abrir input de respuesta
  const openReplyInput = () => {
    setShowReplyInput(true)
    setIsPaused(true)
    setTimeout(() => replyInputRef.current?.focus(), 100)
  }

  const handleTap = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const width = rect.width

    if (x < width / 3) {
      goToPrev()
    } else if (x > (width * 2) / 3) {
      goToNext()
    } else {
      setIsPaused(prev => !prev)
    }
  }

  if (!currentStory) return null

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center overflow-hidden">
      {/* Contenedor principal */}
      <div
        className="relative w-full h-full max-w-lg mx-auto overflow-hidden"
        onClick={handleTap}
      >
        {/* Barras de progreso */}
        <div className="absolute top-2 left-2 right-2 z-20 flex gap-1">
          {currentUser.stories.map((_, index) => (
            <div
              key={index}
              className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
            >
              <div
                className="h-full bg-white transition-all duration-100"
                style={{
                  width: index < currentStoryIndex
                    ? '100%'
                    : index === currentStoryIndex
                      ? `${progress}%`
                      : '0%'
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-6 left-2 right-2 z-20 flex items-center justify-between">
          <Link
            to={`/profile/${currentUser.username}`}
            className="flex items-center gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            {currentUser.avatar_url ? (
              <img
                src={currentUser.avatar_url}
                alt={currentUser.username}
                className="w-10 h-10 rounded-full object-cover border-2 border-white"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold border-2 border-white">
                {currentUser.username?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
            <div>
              <p className="text-white font-medium text-sm">
                {currentUser.full_name || currentUser.username}
              </p>
              <p className="text-white/70 text-xs">
                {formatDistanceToNow(new Date(currentStory.created_at), { addSuffix: true, locale })}
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            {/* Botón pausar/reproducir */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsPaused(prev => !prev)
              }}
              className="p-2 text-white/80 hover:text-white"
            >
              {isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
            </button>

            {/* Botón eliminar (solo para propias) */}
            {isOwn && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowDeleteConfirm(true)
                }}
                className="p-2 text-white/80 hover:text-red-500"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            )}

            {/* Botón cerrar */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                onClose()
              }}
              className="p-2 text-white/80 hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Contenido de la historia */}
        <div className="w-full h-full flex items-center justify-center">
          {currentStory.media_type === 'video' ? (
            <video
              ref={videoRef}
              src={currentStory.media_url}
              className="max-w-full max-h-full object-contain"
              autoPlay
              muted={false}
              playsInline
              onPause={() => setIsPaused(true)}
              onPlay={() => setIsPaused(false)}
            />
          ) : currentStory.media_url ? (
            <img
              src={currentStory.media_url}
              alt="Historia"
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            // Historia de solo texto
            <div
              className="w-full h-full flex items-center justify-center p-8"
              style={{
                background: currentStory.background_color?.includes('gradient')
                  ? currentStory.background_color
                  : currentStory.background_color || '#1a1a1a'
              }}
            >
              <p className="text-white text-2xl font-bold text-center">
                {currentStory.text_content}
              </p>
            </div>
          )}

          {/* Texto superpuesto (si hay imagen/video con texto) */}
          {currentStory.text_content && currentStory.media_url && (
            <div className="absolute bottom-20 left-4 right-4 z-10">
              <p className="text-white text-lg font-medium text-center drop-shadow-lg">
                {currentStory.text_content}
              </p>
            </div>
          )}
        </div>

        {/* Navegación lateral */}
        {currentUserIndex > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              goToPrev()
            }}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-2 text-white/50 hover:text-white hidden md:block"
          >
            <ChevronLeft className="h-8 w-8" />
          </button>
        )}
        {currentUserIndex < storiesData.length - 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              goToNext()
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-2 text-white/50 hover:text-white hidden md:block"
          >
            <ChevronRight className="h-8 w-8" />
          </button>
        )}

        {/* Barra inferior - Reacciones y Respuestas (para historias de otros) */}
        {!isOwn && (
          <div className="absolute bottom-0 left-0 right-0 z-20 p-4">
            {/* Input de respuesta */}
            {showReplyInput ? (
              <div className="flex items-center gap-2 bg-black/70 rounded-full px-4 py-2">
                <input
                  ref={replyInputRef}
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    e.stopPropagation()
                    if (e.key === 'Enter') handleReply()
                    if (e.key === 'Escape') {
                      setShowReplyInput(false)
                      setIsPaused(false)
                    }
                  }}
                  placeholder={t('stories.replyPlaceholder', 'Enviar mensaje...')}
                  className="flex-1 bg-transparent text-white placeholder-white/50 outline-none text-sm"
                  onClick={(e) => e.stopPropagation()}
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleReply()
                  }}
                  disabled={!replyText.trim() || storyReply.isPending}
                  className="p-2 text-white disabled:opacity-50"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                {/* Input placeholder */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    openReplyInput()
                  }}
                  className="flex-1 flex items-center gap-2 bg-black/50 rounded-full px-4 py-2 text-white/70 text-sm mr-2"
                >
                  <span>{t('stories.replyPlaceholder', 'Enviar mensaje...')}</span>
                </button>

                {/* Botón de reacciones */}
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowReactions(!showReactions)
                      setIsPaused(true)
                    }}
                    className="p-2 bg-black/50 rounded-full text-white flex items-center justify-center"
                  >
                    {reactionsData?.myReaction ? (
                      <div className="w-8 h-8 animate-pulse-reaction">
                        <ReactionIcon name={reactionsData.myReaction} size={32} />
                      </div>
                    ) : (
                      <Heart className="h-7 w-7" />
                    )}
                  </button>

                  {/* Panel de reacciones estilo Facebook */}
                  {showReactions && (
                    <div
                      className="absolute bottom-full right-0 mb-3 animate-bounce-in"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ReactionPicker
                        onSelect={handleReaction}
                        currentReaction={reactionsData?.myReaction}
                        disabled={storyReaction.isPending}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Mensaje de respuesta enviada */}
            {replySent && (
              <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-full text-sm animate-fade-in">
                {t('stories.replySent', 'Respuesta enviada')}
              </div>
            )}
          </div>
        )}

        {/* Vistas y reacciones (solo para propias) */}
        {isOwn && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowViewers(true)
              }}
              className="flex items-center gap-2 px-4 py-2 bg-black/50 rounded-full text-white text-sm"
            >
              <Eye className="h-4 w-4" />
              <span>{viewers.length} {t('stories.views', 'vistas')}</span>
            </button>

            {/* Mostrar reacciones recibidas */}
            {reactionsData?.total > 0 && (
              <div className="flex items-center gap-1 px-3 py-2 bg-black/50 rounded-full text-white text-sm">
                {Object.entries(reactionsData.counts || {}).slice(0, 4).map(([reaction, count]) => (
                  <span key={reaction} className="flex items-center">
                    <ReactionIcon name={reaction} size={24} />
                    {count > 1 && <span className="text-xs ml-0.5">{count}</span>}
                  </span>
                ))}
                {Object.keys(reactionsData.counts || {}).length > 4 && (
                  <span className="text-xs text-white/70">+{reactionsData.total - 4}</span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de vistas y reacciones */}
      {showViewers && (
        <div
          className="fixed inset-0 z-[110] flex items-end justify-center"
          onClick={() => setShowViewers(false)}
        >
          <div
            className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-t-2xl max-h-[60vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white text-center">
                {t('stories.viewedBy', 'Visto por')} ({viewers.length})
              </h3>
            </div>
            <div className="p-4 overflow-y-auto max-h-[50vh]">
              {viewers.length === 0 && (!reactionsData?.reactions || reactionsData.reactions.length === 0) ? (
                <p className="text-center text-gray-500 py-4">
                  {t('stories.noViews', 'Nadie ha visto esta historia todavía')}
                </p>
              ) : (
                <div className="space-y-3">
                  {/* Combinar vistas con reacciones */}
                  {(() => {
                    // Crear un mapa de reacciones por user_id
                    const reactionsMap = new Map()
                    reactionsData?.reactions?.forEach(r => {
                      reactionsMap.set(r.user_id, r)
                    })

                    // Combinar viewers con sus reacciones
                    const viewersWithReactions = viewers.map(view => ({
                      ...view,
                      reaction: reactionsMap.get(view.user_id)?.reaction,
                    }))

                    // Agregar usuarios que reaccionaron pero no están en viewers
                    const viewerIds = new Set(viewers.map(v => v.user_id))
                    const reactionsOnly = reactionsData?.reactions?.filter(
                      r => !viewerIds.has(r.user_id)
                    ) || []

                    const allUsers = [
                      ...viewersWithReactions,
                      ...reactionsOnly.map(r => ({
                        user_id: r.user_id,
                        profile: r.profile,
                        reaction: r.reaction,
                      })),
                    ]

                    return allUsers.map((item) => (
                      <Link
                        key={item.user_id}
                        to={`/profile/${item.profile?.username}`}
                        className="flex items-center gap-3"
                        onClick={() => {
                          setShowViewers(false)
                          onClose()
                        }}
                      >
                        {item.profile?.avatar_url ? (
                          <img
                            src={item.profile.avatar_url}
                            alt={item.profile.username}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white">
                            {item.profile?.username?.[0]?.toUpperCase() || 'U'}
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {item.profile?.full_name || item.profile?.username}
                          </p>
                          <p className="text-sm text-gray-500">@{item.profile?.username}</p>
                        </div>
                        {/* Mostrar reacción si existe */}
                        {item.reaction && (
                          <div className="w-8 h-8">
                            <ReactionIcon name={item.reaction} size={32} />
                          </div>
                        )}
                      </Link>
                    ))
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmación de eliminar */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title={t('stories.deleteTitle', 'Eliminar historia')}
        message={t('stories.deleteMessage', '¿Estás seguro de que quieres eliminar esta historia?')}
        confirmText={t('common.delete', 'Eliminar')}
        type="danger"
      />
    </div>
  )
}

export default StoryViewer
