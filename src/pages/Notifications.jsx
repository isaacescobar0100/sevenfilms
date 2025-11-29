import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { Heart, MessageCircle, UserPlus, Film, ArrowLeft, Trash2, Check, Bell, CheckCircle, XCircle } from 'lucide-react'
import { useNotifications, useMarkNotificationAsRead, useMarkAllNotificationsAsRead, useDeleteNotification, useDeleteAllNotifications } from '../hooks/useNotifications'
import { formatRelativeTime } from '../utils/formatters'
import LoadingSpinner from '../components/common/LoadingSpinner'
import SEO from '../components/common/SEO'
import { REACTIONS, MOVIE_REACTIONS } from '../hooks/usePostReactions'

function Notifications() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data: notifications, isLoading } = useNotifications()
  const markAsRead = useMarkNotificationAsRead()
  const markAllAsRead = useMarkAllNotificationsAsRead()
  const deleteNotification = useDeleteNotification()
  const deleteAllNotifications = useDeleteAllNotifications()

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      markAsRead.mutate(notification.id)
    }
    // Navegar al destino
    navigate(getNotificationLink(notification))
  }

  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate()
  }

  const handleDeleteNotification = (e, notificationId) => {
    e.preventDefault()
    e.stopPropagation()
    deleteNotification.mutate(notificationId)
  }

  const handleDeleteAll = () => {
    if (window.confirm(t('notifications.confirmDeleteAll') || '¿Estás seguro de que quieres eliminar todas las notificaciones?')) {
      deleteAllNotifications.mutate()
    }
  }

  const getNotificationIcon = (notification) => {
    const { type, metadata } = notification

    // Si es una reacción, mostrar el emoji correspondiente
    if (type === 'reaction') {
      if (metadata?.reaction) {
        // Intentar primero con reacciones de posts
        const postReaction = REACTIONS[metadata.reaction]
        if (postReaction) {
          return <span className="text-lg">{postReaction.emoji}</span>
        }
        // Si no, intentar con reacciones de películas
        const movieReaction = MOVIE_REACTIONS[metadata.reaction]
        if (movieReaction) {
          return <span className="text-lg">{movieReaction.emoji}</span>
        }
      }
      // Reacción sin metadata, mostrar emoji por defecto
      return <span className="text-lg">👍</span>
    }

    switch (type) {
      case 'like':
        return <Heart className="h-4 w-4 text-red-500" />
      case 'comment':
        return <MessageCircle className="h-4 w-4 text-blue-500" />
      case 'follow':
        return <UserPlus className="h-4 w-4 text-green-500" />
      case 'movie':
        return <Film className="h-4 w-4 text-purple-500" />
      case 'movie_approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'movie_rejected':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  const getNotificationMessage = (notification) => {
    const actorName = notification.actor?.full_name || notification.actor?.username || 'Alguien'
    const { type, metadata } = notification

    // Si es una reacción
    if (type === 'reaction') {
      if (metadata?.reaction) {
        // Intentar primero con reacciones de posts
        let reactionData = REACTIONS[metadata.reaction]
        // Si no, intentar con reacciones de películas
        if (!reactionData) {
          reactionData = MOVIE_REACTIONS[metadata.reaction]
        }
        const reactionLabel = reactionData?.label || metadata.reaction
        return `${actorName} reaccionó con ${reactionLabel} a tu publicación`
      }
      // Reacción sin metadata
      return `${actorName} reaccionó a tu publicación`
    }

    switch (notification.type) {
      case 'like':
        return t('notifications.liked', { name: actorName })
      case 'comment':
        return t('notifications.commented', { name: actorName })
      case 'follow':
        return t('notifications.followed', { name: actorName })
      case 'movie':
        return t('notifications.uploadedMovie', { name: actorName })
      case 'movie_approved':
        return `¡Tu película "${metadata?.movie_title || 'sin título'}" ha sido aprobada! Ya está visible para todos.`
      case 'movie_rejected':
        const reason = metadata?.rejection_reason ? `: ${metadata.rejection_reason}` : ''
        return `Tu película "${metadata?.movie_title || 'sin título'}" fue rechazada${reason}`
      default:
        return ''
    }
  }

  const getNotificationLink = (notification) => {
    switch (notification.entity_type) {
      case 'post':
        return `/feed`
      case 'user':
        return `/profile/${notification.actor?.username}`
      case 'movie':
        return `/movies`
      default:
        return '/feed'
    }
  }

  const unreadCount = notifications?.filter(n => !n.is_read).length || 0

  return (
    <>
      <SEO title={t('notifications.title')} />

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header fijo */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate(-1)}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ArrowLeft className="h-6 w-6 text-gray-700 dark:text-gray-300" />
              </button>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {t('notifications.title')}
              </h1>
              {unreadCount > 0 && (
                <span className="bg-primary-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
          </div>

          {/* Acciones */}
          {notifications && notifications.length > 0 && (
            <div className="flex items-center justify-between px-4 py-2 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={handleMarkAllAsRead}
                disabled={unreadCount === 0}
                className="flex items-center space-x-1 text-sm text-primary-600 hover:text-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check className="h-4 w-4" />
                <span>{t('notifications.markAllRead')}</span>
              </button>
              <button
                onClick={handleDeleteAll}
                className="flex items-center space-x-1 text-sm text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
                <span>{t('notifications.deleteAll') || 'Eliminar todas'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Lista de notificaciones */}
        <div className="pb-20">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : notifications && notifications.length > 0 ? (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`relative flex items-start space-x-3 px-4 py-4 cursor-pointer transition-colors ${
                    !notification.is_read
                      ? 'bg-primary-50 dark:bg-primary-900/20'
                      : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  {/* Avatar con icono */}
                  <div className="relative flex-shrink-0">
                    {notification.actor?.avatar_url ? (
                      <img
                        src={notification.actor.avatar_url}
                        alt={notification.actor.full_name}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold">
                        {notification.actor?.full_name?.[0] || notification.actor?.username?.[0] || 'U'}
                      </div>
                    )}
                    {/* Icono de tipo */}
                    <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-800 rounded-full p-1 shadow-sm">
                      {getNotificationIcon(notification)}
                    </div>
                  </div>

                  {/* Contenido */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      {getNotificationMessage(notification)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {formatRelativeTime(notification.created_at)}
                    </p>
                  </div>

                  {/* Indicador no leído */}
                  {!notification.is_read && (
                    <div className="flex-shrink-0 mt-2">
                      <div className="h-3 w-3 rounded-full bg-primary-600"></div>
                    </div>
                  )}

                  {/* Botón eliminar */}
                  <button
                    onClick={(e) => handleDeleteNotification(e, notification.id)}
                    className="flex-shrink-0 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
                <Bell className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-center">
                {t('notifications.noNotifications')}
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1 text-center">
                {t('notifications.noNotificationsDesc') || 'Cuando tengas notificaciones, aparecerán aquí'}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default Notifications
