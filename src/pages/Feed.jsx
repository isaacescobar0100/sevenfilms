import { useState, useCallback } from 'react'
import { Users, Compass } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useFeed } from '../hooks/usePosts'
import { useSuggestedUsers } from '../hooks/useProfiles'
import CreatePost from '../components/social/CreatePost'
import Post from '../components/social/Post'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorMessage from '../components/common/ErrorMessage'
import UserCard from '../components/social/UserCard'
import { VirtualizedList } from '../components/common/VirtualizedList'

function Feed() {
  const { t } = useTranslation()
  const [filter, setFilter] = useState('all') // 'all' or 'following'
  const { data, fetchNextPage, hasNextPage, isLoading, isFetchingNextPage, error } = useFeed(filter)
  const { data: suggestedUsers } = useSuggestedUsers()

  const posts = data?.pages.flatMap(page => page.data) || []

  // Renderizar cada post (memoizado para virtualización)
  const renderPost = useCallback((post) => (
    <Post key={post.id} post={post} />
  ), [])

  // Obtener key única para cada post
  const getPostKey = useCallback((post) => post.id, [])

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
          <div className="bg-white rounded-lg shadow-md">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setFilter('all')}
                className={`flex-1 px-4 py-3 text-center font-medium ${
                  filter === 'all'
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-gray-600 hover:text-gray-900'
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
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>{t('feed.following')}</span>
                </div>
              </button>
            </div>
          </div>

          {/* Posts */}
          {isLoading && <LoadingSpinner />}
          {error && <ErrorMessage message="Error al cargar el feed" />}

          {!isLoading && !error && (
            <div className="space-y-6">
              {posts.length === 0 ? (
                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                  <p className="text-gray-600">
                    {filter === 'following'
                      ? t('feed.noPostsFollowing')
                      : t('feed.noPostsExplore')}
                  </p>
                </div>
              ) : (
                <VirtualizedList
                  items={posts}
                  renderItem={renderPost}
                  getItemKey={getPostKey}
                  estimatedItemSize={350}
                  hasNextPage={hasNextPage}
                  isFetchingNextPage={isFetchingNextPage}
                  fetchNextPage={fetchNextPage}
                  className="h-[calc(100vh-300px)] min-h-[500px]"
                  overscan={3}
                  loadingText={t('feed.loadMore')}
                />
              )}
            </div>
          )}
        </div>

        {/* Sidebar - Solo visible en desktop */}
        {hasSidebar && (
          <div className="hidden lg:block space-y-6">
          {/* Suggested Users */}
          {suggestedUsers && suggestedUsers.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="font-bold text-lg mb-4">{t('feed.suggestedFilmmakers')}</h2>
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
