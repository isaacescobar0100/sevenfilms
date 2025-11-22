import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Heart, MessageCircle, UserPlus, Film, X, Trash2 } from 'lucide-react'
import { useNotifications, useMarkNotificationAsRead, useMarkAllNotificationsAsRead, useDeleteNotification, useDeleteAllNotifications } from '../../hooks/useNotifications'
import { formatRelativeTime } from '../../utils/formatters'
import LoadingSpinner from '../common/LoadingSpinner'

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

  const getNotificationIcon = (type) => {
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
        return null
    }
  }

  const getNotificationMessage = (notification) => {
    const actorName = notification.actor?.full_name || notification.actor?.username || 'Alguien'

    switch (notification.type) {
      case 'like':
        return t('notifications.liked', { name: actorName })
      case 'comment':
        return t('notifications.commented', { name: actorName })
      case 'follow':
        return t('notifications.followed', { name: actorName })
      case 'movie':
        return t('notifications.uploadedMovie', { name: actorName })
      default:
        return ''
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
                    {/* Icon */}
                    <div className="flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start space-x-2">
                        {/* Avatar */}
                        {notification.actor?.avatar_url ? (
                          <img
                            src={notification.actor.avatar_url}
                            alt={notification.actor.full_name}
                            className="h-8 w-8 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                            {notification.actor?.full_name?.[0] || notification.actor?.username?.[0] || 'U'}
                          </div>
                        )}

                        {/* Message */}
                        <div className="flex-1 min-w-0 pr-8">
                          <p className="text-sm text-gray-900 dark:text-gray-100">
                            {getNotificationMessage(notification)}
                          </p>
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
