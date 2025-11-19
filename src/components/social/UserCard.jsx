import { Link } from 'react-router-dom'
import { useIsFollowing, useToggleFollow } from '../../hooks/useFollows'
import { useAuthStore } from '../../store/authStore'
import { useRateLimit } from '../../hooks/useRateLimit'

function UserCard({ user, showFollowButton = false }) {
  const { user: currentUser } = useAuthStore()
  const { data: isFollowing } = useIsFollowing(user.id)
  const toggleFollow = useToggleFollow()
  const { canPerformAction, performAction, limit } = useRateLimit('followActions')

  const isOwnProfile = currentUser?.id === user.id

  const handleFollow = () => {
    // Verificar rate limit para follow/unfollow
    if (!canPerformAction) {
      alert(`Has alcanzado el límite de ${limit} acciones de seguir/dejar de seguir por minuto. Espera un momento.`)
      return
    }

    toggleFollow.mutate({ userId: user.id, isFollowing })
    performAction()
  }

  return (
    <div className="flex items-center justify-between">
      <Link to={`/profile/${user.username}`} className="flex items-center space-x-3 flex-1">
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
          <p className="font-semibold truncate">{user.full_name || user.username}</p>
          <p className="text-sm text-gray-500 truncate">@{user.username}</p>
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
          {isFollowing ? 'Siguiendo' : 'Seguir'}
        </button>
      )}
    </div>
  )
}

export default UserCard
