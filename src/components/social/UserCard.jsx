import { memo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useIsFollowing, useToggleFollow } from '../../hooks/useFollows'
import { useAuthStore } from '../../store/authStore'
import { useRateLimit } from '../../hooks/useRateLimit'
import { useTranslation } from 'react-i18next'

const UserCard = memo(function UserCard({ user, showFollowButton = false, compact = false, onProfileClick }) {
  const { t } = useTranslation()
  const { user: currentUser } = useAuthStore()
  const { data: isFollowing } = useIsFollowing(user.id)
  const toggleFollow = useToggleFollow()
  const { canPerformAction, performAction, limit } = useRateLimit('followActions')

  const isOwnProfile = currentUser?.id === user.id

  const handleFollow = useCallback(() => {
    // Verificar rate limit para follow/unfollow
    if (!canPerformAction) {
      alert(`Has alcanzado el límite de ${limit} acciones de seguir/dejar de seguir por minuto. Espera un momento.`)
      return
    }

    toggleFollow.mutate({ userId: user.id, isFollowing })
    performAction()
  }, [canPerformAction, limit, toggleFollow, user.id, isFollowing, performAction])

  const handleClick = useCallback(() => {
    if (onProfileClick) {
      onProfileClick(user)
    }
  }, [onProfileClick, user])

  // Versión compacta para carrusel horizontal (móvil)
  if (compact) {
    return (
      <div className="flex-shrink-0 w-28">
        <Link to={`/profile/${user.username}`} className="block text-center" onClick={handleClick}>
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.username}
              className="h-16 w-16 rounded-full mx-auto mb-2 object-cover"
              loading="lazy"
              fetchPriority="high"
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold text-xl mx-auto mb-2">
              {user.full_name?.[0] || user.username?.[0] || 'U'}
            </div>
          )}
          <p className="font-medium text-xs truncate px-1 text-gray-900 dark:text-white leading-tight">{user.full_name || user.username}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate px-1">@{user.username}</p>
        </Link>
        {showFollowButton && !isOwnProfile && (
          <button
            onClick={handleFollow}
            disabled={toggleFollow.isPending}
            className={`mt-2 w-full text-xs py-1.5 px-2 rounded-full font-medium transition-colors ${
              isFollowing
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                : 'bg-primary-600 text-white hover:bg-primary-700'
            }`}
          >
            {isFollowing ? t('profile.following') : t('profile.follow')}
          </button>
        )}
      </div>
    )
  }

  // Versión normal (lista vertical)
  return (
    <div className="flex items-center justify-between">
      <Link to={`/profile/${user.username}`} className="flex items-center space-x-3 flex-1" onClick={handleClick}>
        {user.avatar_url ? (
          <img
            src={user.avatar_url}
            alt={user.username}
            className="h-10 w-10 rounded-full"
          />
        ) : (
          <div className="h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold">
            {user.full_name?.[0] || user.username?.[0] || 'U'}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate text-gray-900 dark:text-white">{user.full_name || user.username}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">@{user.username}</p>
        </div>
      </Link>

      {showFollowButton && !isOwnProfile && (
        <button
          onClick={handleFollow}
          disabled={toggleFollow.isPending}
          className={`btn btn-sm ${
            isFollowing
              ? 'btn-secondary'
              : 'btn-primary'
          }`}
        >
          {isFollowing ? t('profile.following') : t('profile.follow')}
        </button>
      )}
    </div>
  )
})

export default UserCard
