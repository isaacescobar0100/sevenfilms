import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Heart, MessageCircle, UserPlus, Film, X, Trash2 } from 'lucide-react'
import { useNotifications, useMarkNotificationAsRead, useMarkAllNotificationsAsRead, useDeleteNotification, useDeleteAllNotifications } from '../../hooks/useNotifications'
import { formatRelativeTime } from '../../utils/formatters'
import LoadingSpinner from '../common/LoadingSpinner'
import { REACTIONS } from '../../hooks/usePostReactions'
import { ReactionIcons } from '../common/ReactionIcons'

function NotificationsPanel({ onClose }) {
  const { t } = useTranslation()
  const { data: notifications, isLoading } = useNotifications()
  const markAsRead = useMarkNotificationAsRead()
  const markAllAsRead = useMarkAllNotificationsAsRead()
  const deleteNotification = useDeleteNotification()
  const deleteAllNotifications = useDeleteAllNotifications()

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      markAsRead.mutate(notification.id)
    }
    onClose()
  }

  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate()
  }

  const handleDeleteNotification = (e, notificationId) => {
    e.preventDefault() // Evitar navegar al link
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

    // Si es una reacción, mostrar el icono SVG personalizado
    if (type === 'reaction') {
      if (metadata?.reaction && ReactionIcons[metadata.reaction]) {
        const IconComponent = ReactionIcons[metadata.reaction]
        return <IconComponent className="h-6 w-6" />
      }
      // Reacción sin metadata, mostrar icono de estrella
      return <ReactionIcons.excellent className="h-6 w-6" />
    }

    switch (type) {
      case 'like':
        return <Heart className="h-5 w-5 text-red-500" />
      case 'comment':
        return <MessageCircle className="h-5 w-5 text-blue-500" />
      case 'follow':
        return <UserPlus className="h-5 w-5 text-green-500" />
      case 'movie':
        return <Film className="h-5 w-5 text-purple-500" />
      default:
        return <Heart className="h-5 w-5 text-gray-400" />
    }
  }

  const getNotificationMessage = (notification) => {
    const actorName = notification.actor?.full_name || notification.actor?.username || 'Alguien'
    const { type, metadata } = notification

    // Si es una reacción
    if (type === 'reaction') {
      if (metadata?.reaction) {
        const reactionData = REACTIONS[metadata.reaction]
        const reactionLabel = reactionData?.label || metadata.reaction
        return (
          <span>
            <span className="font-semibold">{actorName}</span>
            {' reaccionó con '}
            <span className="font-medium">{reactionLabel}</span>
            {' a tu publicación'}
          </span>
        )
      }
      // Reacción sin metadata
      return (
        <span>
          <span className="font-semibold">{actorName}</span>
          {' reaccionó a tu publicación'}
        </span>
      )
    }

    switch (type) {
      case 'like':
        return (
          <span>
            <span className="font-semibold">{actorName}</span>
            {' le dio me gusta a tu publicación'}
          </span>
        )
      case 'comment':
        return (
          <span>
            <span className="font-semibold">{actorName}</span>
            {' comentó en tu publicación'}
          </span>
        )
      case 'follow':
        return (
          <span>
            <span className="font-semibold">{actorName}</span>
            {' comenzó a seguirte'}
          </span>
        )
      case 'movie':
        return (
          <span>
            <span className="font-semibold">{actorName}</span>
            {' subió una nueva película'}
          </span>
        )
      default:
        return (
          <span>
            <span className="font-semibold">{actorName}</span>
            {' interactuó con tu contenido'}
          </span>
        )
    }
  }

  const getNotificationLink = (notification) => {
    switch (notification.entity_type) {
      case 'post':
        return `/feed` // Puedes agregar scroll a post específico después
      case 'user':
        return `/profile/${notification.actor?.username}`
      case 'movie':
        return `/movies`
      default:
        return '/feed'
    }
  }

  return (
    <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-[32rem] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-lg text-gray-900 dark:text-white">{t('notifications.title')}</h3>
        </div>
        {notifications && notifications.length > 0 && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleMarkAllAsRead}
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              <span>{t('notifications.markAllRead')}</span>
            </button>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <button
              onClick={handleDeleteAll}
              className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>{t('notifications.deleteAll') || 'Eliminar todas'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Notifications List */}
      <div className="overflow-y-auto flex-1">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : notifications && notifications.length > 0 ? (
          <div>
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`relative group border-b border-gray-100 dark:border-gray-700 transition-colors ${
                  !notification.is_read ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                }`}
              >
                <Link
                  to={getNotificationLink(notification)}
                  onClick={() => handleNotificationClick(notification)}
                  className="block p-4 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <div className="flex space-x-3">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {notification.actor?.avatar_url ? (
                        <img
                          src={notification.actor.avatar_url}
                          alt={notification.actor.full_name}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-semibold">
                          {notification.actor?.full_name?.[0] || notification.actor?.username?.[0] || 'U'}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        {/* Message and icon */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="flex-shrink-0">
                              {getNotificationIcon(notification)}
                            </div>
                            <p className="text-sm text-gray-900 dark:text-gray-100">
                              {getNotificationMessage(notification)}
                            </p>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {formatRelativeTime(notification.created_at)}
                          </p>
                        </div>

                        {/* Unread indicator */}
                        {!notification.is_read && (
                          <div className="h-2 w-2 rounded-full bg-primary-600 flex-shrink-0 mt-2"></div>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>

                {/* Delete button */}
                <button
                  onClick={(e) => handleDeleteNotification(e, notification.id)}
                  className="absolute top-3 right-3 p-1.5 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/20 transition-opacity"
                  title={t('notifications.delete') || 'Eliminar'}
                >
                  <X className="h-4 w-4 text-gray-400 hover:text-red-600 dark:hover:text-red-400" />
                </button>
              </div>
            ))}

          </div>
        ) : (
          <div className="text-center py-12 px-4">
            <p className="text-gray-500 dark:text-gray-400">{t('notifications.noNotifications')}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default NotificationsPanel
