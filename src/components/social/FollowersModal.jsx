import { useState } from 'react'
import { Link } from 'react-router-dom'
import { X, UserMinus, UserPlus, Loader } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useFollowers, useFollowing, useIsFollowing, useToggleFollow } from '../../hooks/useFollows'
import { useAuthStore } from '../../store/authStore'

function FollowersModal({ userId, initialTab = 'followers', onClose }) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState(initialTab)
  const { user } = useAuthStore()

  const { data: followers = [], isLoading: followersLoading } = useFollowers(userId)
  const { data: following = [], isLoading: followingLoading } = useFollowing(userId)

  const isLoading = activeTab === 'followers' ? followersLoading : followingLoading
  const users = activeTab === 'followers'
    ? followers.map(f => f.follower)
    : following.map(f => f.following)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md max-h-[80vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="w-8" /> {/* Spacer */}
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {activeTab === 'followers' ? t('profile.stats.followers') : t('profile.stats.following')}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="h-6 w-6 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('followers')}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              activeTab === 'followers'
                ? 'text-gray-900 dark:text-white border-b-2 border-gray-900 dark:border-white'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {t('profile.stats.followers')} ({followers.length})
          </button>
          <button
            onClick={() => setActiveTab('following')}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              activeTab === 'following'
                ? 'text-gray-900 dark:text-white border-b-2 border-gray-900 dark:border-white'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {t('profile.stats.following')} ({following.length})
          </button>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="h-8 w-8 animate-spin text-primary-600" />
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                {activeTab === 'followers'
                  ? t('profile.noFollowers', 'No hay seguidores aún')
                  : t('profile.noFollowing', 'No sigue a nadie aún')}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {users.map((userItem) => (
                <UserRow
                  key={userItem.id}
                  userItem={userItem}
                  currentUserId={user?.id}
                  isFollowingTab={activeTab === 'following'}
                  profileOwnerId={userId}
                  onClose={onClose}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function UserRow({ userItem, currentUserId, isFollowingTab, profileOwnerId, onClose }) {
  const { t } = useTranslation()
  const { data: isFollowing, isLoading: checkingFollow } = useIsFollowing(userItem.id)
  const toggleFollow = useToggleFollow()

  const isCurrentUser = currentUserId === userItem.id
  const isOwnProfile = currentUserId === profileOwnerId

  const handleToggleFollow = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      await toggleFollow.mutateAsync({ userId: userItem.id, isFollowing })
    } catch (error) {
      console.error('Error toggling follow:', error)
    }
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
      <Link
        to={`/profile/${userItem.username}`}
        onClick={onClose}
        className="flex items-center space-x-3 flex-1 min-w-0"
      >
        {userItem.avatar_url ? (
          <img
            src={userItem.avatar_url}
            alt={userItem.full_name}
            className="h-12 w-12 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div className="h-12 w-12 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
            {userItem.full_name?.[0]?.toUpperCase() || userItem.username?.[0]?.toUpperCase() || 'U'}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-gray-900 dark:text-white truncate">
            {userItem.full_name || userItem.username}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
            @{userItem.username}
          </p>
        </div>
      </Link>

      {/* Follow/Unfollow Button - Solo mostrar en pestaña "Siguiendo" cuando es tu propio perfil */}
      {!isCurrentUser && isFollowingTab && isOwnProfile && (
        <button
          onClick={handleToggleFollow}
          disabled={toggleFollow.isPending || checkingFollow}
          className="ml-3 px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors flex items-center space-x-1 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400"
        >
          {toggleFollow.isPending ? (
            <Loader className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <UserMinus className="h-4 w-4" />
              <span className="hidden sm:inline">{t('profile.unfollow', 'Dejar de seguir')}</span>
            </>
          )}
        </button>
      )}

      {isCurrentUser && (
        <span className="ml-3 px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
          {t('profile.you', 'Tú')}
        </span>
      )}
    </div>
  )
}

export default FollowersModal
