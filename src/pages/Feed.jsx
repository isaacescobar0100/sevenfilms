import { useState, Fragment } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, TrendingUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useFeed, useTrending } from '../hooks/usePosts'
import { useSuggestedUsers } from '../hooks/useProfiles'
import CreatePost from '../components/social/CreatePost'
import Post from '../components/social/Post'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorMessage from '../components/common/ErrorMessage'
import UserCard from '../components/social/UserCard'

function Feed() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [filter, setFilter] = useState('all') // 'all' or 'following'
  const { data, fetchNextPage, hasNextPage, isLoading, isFetchingNextPage, error } = useFeed(filter)
  const { data: suggestedUsers } = useSuggestedUsers()
  const { data: trending } = useTrending()

  const posts = data?.pages.flatMap(page => page.data) || []

  // Determinar si hay contenido en el sidebar
  const hasSidebar = (suggestedUsers && suggestedUsers.length > 0) || (trending && trending.length > 0)

  // Navegar a búsqueda con hashtag
  const handleTrendingClick = (hashtag) => {
    navigate(`/search?q=${encodeURIComponent(hashtag)}`)
  }

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
                  <TrendingUp className="h-5 w-5" />
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

          {/* Trending Topics - Solo visible en móvil */}
          {trending && trending.length > 0 && (
            <div className="lg:hidden bg-white rounded-lg shadow-md p-4">
              <h2 className="font-bold text-lg mb-4">{t('feed.trending')}</h2>
              <div className="grid grid-cols-2 gap-3">
                {trending.slice(0, 4).map((item) => (
                  <div
                    key={item.hashtag}
                    onClick={() => handleTrendingClick(item.hashtag)}
                    className="hover:bg-gray-50 hover:border-primary-300 active:bg-gray-100 p-3 rounded cursor-pointer border border-gray-200 transition-all"
                  >
                    <p className="text-sm text-gray-900 font-semibold truncate">{item.hashtag}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {item.count} {item.count === 1 ? t('feed.post') : t('feed.posts')}
                    </p>
                  </div>
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
                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                  <p className="text-gray-600">
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

                  {/* Load More Button */}
                  {hasNextPage && (
                    <div className="flex justify-center py-4">
                      <button
                        onClick={() => fetchNextPage()}
                        disabled={isFetchingNextPage}
                        className="btn btn-secondary"
                      >
                        {isFetchingNextPage ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          t('feed.loadMore')
                        )}
                      </button>
                    </div>
                  )}
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
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="font-bold text-lg mb-4">{t('feed.suggestedFilmmakers')}</h2>
              <div className="space-y-3">
                {suggestedUsers.map((user) => (
                  <UserCard key={user.id} user={user} showFollowButton />
                ))}
              </div>
            </div>
          )}

          {/* Trending Topics - Solo visible en desktop */}
          {trending && trending.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="font-bold text-lg mb-4">{t('feed.trending')}</h2>
              <div className="space-y-3">
                {trending.map((item) => (
                  <div
                    key={item.hashtag}
                    onClick={() => handleTrendingClick(item.hashtag)}
                    className="hover:bg-gray-50 active:bg-gray-100 p-2 rounded cursor-pointer transition-colors"
                  >
                    <p className="text-sm text-gray-500 font-medium">{item.hashtag}</p>
                    <p className="text-xs text-gray-400">
                      {item.count} {item.count === 1 ? t('feed.post') : t('feed.posts')}
                    </p>
                  </div>
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
