import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, MessageCircle, UserPlus, Film } from 'lucide-react'

function Toast({ notification, onClose }) {
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 2000)

    return () => clearTimeout(timer)
  }, [onClose])

  const handleClick = () => {
    // Navegar a la ubicación correspondiente
    const link = getNotificationLink(notification)
    navigate(link)
    onClose()
  }

  const getNotificationLink = (notification) => {
    switch (notification.entity_type) {
      case 'post':
        return `/feed` // Navegar al feed donde está el post
      case 'user':
        return `/profile/${notification.actor?.username}`
      case 'movie':
        return `/movies`
      default:
        return '/feed'
    }
  }

  const getIcon = (type) => {
    switch (type) {
      case 'like':
        return <Heart className="h-5 w-5 text-red-500" fill="currentColor" />
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

  const getMessage = (notification) => {
    const actorName = notification.actor?.full_name || notification.actor?.username || 'Alguien'

    switch (notification.type) {
      case 'like':
        return `${actorName} le gustó tu publicación`
      case 'comment':
        return `${actorName} comentó en tu publicación`
      case 'follow':
        return `${actorName} comenzó a seguirte`
      case 'movie':
        return `${actorName} subió una nueva película`
      default:
        return ''
    }
  }

  return (
    <div
      onClick={handleClick}
      className="bg-white rounded-lg shadow-xl border border-gray-200 p-3 min-w-[300px] max-w-sm animate-slide-in-right cursor-pointer hover:bg-gray-50 transition-colors"
    >
      <div className="flex items-center space-x-3">
        {/* Avatar */}
        {notification.actor?.avatar_url ? (
          <img
            src={notification.actor.avatar_url}
            alt={notification.actor.full_name}
            className="h-10 w-10 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div className="h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
            {notification.actor?.full_name?.[0] || notification.actor?.username?.[0] || 'A'}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-900">
            {getMessage(notification)}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">hace menos de un minuto</p>
        </div>

        {/* Icon indicator */}
        <div className="flex-shrink-0">
          {getIcon(notification.type)}
        </div>
      </div>
    </div>
  )
}

export default Toast
