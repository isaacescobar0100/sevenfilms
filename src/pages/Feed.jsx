import { useState, useEffect, useRef } from 'react'
import { Users, Compass, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useFeed } from '../hooks/usePosts'
import { useSuggestedUsers } from '../hooks/useProfiles'
import CreatePost from '../components/social/CreatePost'
import Post from '../components/social/Post'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorMessage from '../components/common/ErrorMessage'
import UserCard from '../components/social/UserCard'

function Feed() {
  const { t } = useTranslation()
  const [filter, setFilter] = useState('all') // 'all' or 'following'
  const [showSuggestedUsers, setShowSuggestedUsers] = useState(true)
  const { data, fetchNextPage, hasNextPage, isLoading, isFetchingNextPage, error } = useFeed(filter)
  const { data: suggestedUsers } = useSuggestedUsers()
  const loadMoreRef = useRef(null)

  const posts = data?.pages.flatMap(page => page.data) || []

  // Infinite scroll con Intersection Observer (como Facebook)
  useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage || isFetchingNextPage) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    )

    observer.observe(loadMoreRef.current)

    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  // Determinar si hay contenido en el sidebar
  const hasSidebar = suggestedUsers && suggestedUsers.length > 0

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className={`grid grid-cols-1 ${hasSidebar ? 'lg:grid-cols-3' : ''} gap-6`}>
        {/* Main Feed */}
        <div className={`${hasSidebar ? 'lg:col-span-2' : 'max-w-2xl mx-auto w-full'} space-y-6`}>
          {/* Create Post */}
          <CreatePost onSuccess={() => {
            // Opcional: scroll to top o mostrar notificación
          }} />

          {/* Filter Tabs */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setFilter('all')}
                className={`flex-1 px-4 py-3 text-center font-medium ${
                  filter === 'all'
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Compass className="h-5 w-5" />
                  <span>{t('feed.explore')}</span>
                </div>
              </button>
              <button
                onClick={() => setFilter('following')}
                className={`flex-1 px-4 py-3 text-center font-medium ${
                  filter === 'following'
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>{t('feed.following')}</span>
                </div>
              </button>
            </div>
          </div>

          {/* Cineastas sugeridos - Carrusel horizontal solo en móvil */}
          {suggestedUsers && suggestedUsers.length > 0 && showSuggestedUsers && (
            <div className="lg:hidden bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-sm text-gray-700 dark:text-gray-300">{t('feed.suggestedFilmmakers')}</h2>
                <button
                  onClick={() => setShowSuggestedUsers(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                  aria-label={t('common.close')}
                >
                  <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {suggestedUsers.slice(0, 6).map((user) => (
                  <UserCard key={user.id} user={user} showFollowButton compact />
                ))}
              </div>
            </div>
          )}

          {/* Posts */}
          {isLoading && <LoadingSpinner />}
          {error && <ErrorMessage message="Error al cargar el feed" />}

          {!isLoading && !error && (
            <div className="space-y-6">
              {posts.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
                  <p className="text-gray-600 dark:text-gray-400">
                    {filter === 'following'
                      ? t('feed.noPostsFollowing')
                      : t('feed.noPostsExplore')}
                  </p>
                </div>
              ) : (
                <>
                  {posts.map((post) => (
                    <Post key={post.id} post={post} />
                  ))}

                  {/* Load more trigger */}
                  <div ref={loadMoreRef} className="py-4 flex justify-center">
                    {isFetchingNextPage && <LoadingSpinner size="sm" />}
                    {!hasNextPage && posts.length > 0 && (
                      <p className="text-gray-500 dark:text-gray-400 text-sm">{t('feed.noMorePosts')}</p>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Sidebar - Solo visible en desktop */}
        {hasSidebar && (
          <div className="hidden lg:block space-y-6">
          {/* Suggested Users */}
          {suggestedUsers && suggestedUsers.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
              <h2 className="font-bold text-lg text-gray-900 dark:text-white mb-4">{t('feed.suggestedFilmmakers')}</h2>
              <div className="space-y-3">
                {suggestedUsers.map((user) => (
                  <UserCard key={user.id} user={user} showFollowButton />
                ))}
              </div>
            </div>
          )}

          </div>
        )}
      </div>
    </div>
  )
}

export default Feed
