import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Compass, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useFeed, useTrending } from '../hooks/usePosts'
import { useSuggestedUsers } from '../hooks/useProfiles'
import CreatePost from '../components/social/CreatePost'
import Post from '../components/social/Post'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorMessage from '../components/common/ErrorMessage'
import UserCard from '../components/social/UserCard'
import LeftSidebar from '../components/layout/LeftSidebar'
import StoriesBar from '../components/stories/StoriesBar'
import SEO from '../components/common/SEO'
import AdSense from '../components/ads/AdSense'
import { useFlattenedItems } from '../components/common/VirtualizedList'

function Feed() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [filter, setFilter] = useState('all') // 'all' or 'following'
  const [showSuggestedUsers, setShowSuggestedUsers] = useState(true)
  const feedQuery = useFeed(filter)
  const { data: suggestedUsers } = useSuggestedUsers()
  const { data: trendingTopics } = useTrending()

  // Usar helper para aplanar posts de infinite query
  const { items: posts, hasNextPage, isFetchingNextPage, fetchNextPage } = useFlattenedItems(feedQuery)
  const { isLoading, error } = feedQuery

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <SEO
        title="Feed"
        description="Explora las publicaciones de la comunidad de cineastas. Descubre cortometrajes, comparte tu trabajo y conecta con creadores."
      />

      {/* Layout de 3 columnas en desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Sidebar - Solo desktop */}
        <div className="hidden lg:block lg:col-span-3">
          <LeftSidebar />
        </div>

        {/* Main Feed - Centro */}
        <div className="lg:col-span-6 space-y-6">
          {/* Stories Bar */}
          <StoriesBar />

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
            <div className="lg:hidden bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-sm text-gray-700 dark:text-gray-300">{t('feed.suggestedFilmmakers')}</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate('/search?tab=suggested')}
                    className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
                  >
                    {t('common.viewAll')}
                  </button>
                  <button
                    onClick={() => setShowSuggestedUsers(false)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                    aria-label={t('common.close')}
                  >
                    <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  </button>
                </div>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}>
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
            <>
              {posts.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
                  <p className="text-gray-600 dark:text-gray-400">
                    {filter === 'following'
                      ? t('feed.noPostsFollowing')
                      : t('feed.noPostsExplore')}
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {posts.map((post, index) => (
                    <div key={post.id}>
                      <Post post={post} />
                      {/* Mostrar anuncio cada 5 posts */}
                      {(index + 1) % 5 === 0 && index < posts.length - 1 && (
                        <div className="mt-6">
                          <AdSense
                            slot="9983534909"
                            format="auto"
                            responsive={true}
                            style={{ minHeight: '250px' }}
                            className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden"
                          />
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Infinite scroll trigger */}
                  {hasNextPage && (
                    <div className="flex justify-center py-8">
                      {isFetchingNextPage ? (
                        <LoadingSpinner />
                      ) : (
                        <button
                          onClick={() => fetchNextPage()}
                          className="text-primary-600 hover:text-primary-700 font-medium"
                        >
                          {t('common.loadMore') || 'Cargar más'}
                        </button>
                      )}
                    </div>
                  )}

                  {!hasNextPage && posts.length > 0 && (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                      {t('feed.noMorePosts') || 'No hay más publicaciones'}
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Right Sidebar - Sugerencias */}
        <div className="hidden lg:block lg:col-span-3">
          <div className="sticky top-20 space-y-6">
            {/* Suggested Users */}
            {suggestedUsers && suggestedUsers.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-lg text-gray-900 dark:text-white">{t('feed.suggestedFilmmakers')}</h2>
                  <button
                    onClick={() => navigate('/search?tab=suggested')}
                    className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
                  >
                    {t('common.viewAll') || 'Ver todas'}
                  </button>
                </div>
                <div className="space-y-3">
                  {suggestedUsers.slice(0, 5).map((user) => (
                    <UserCard key={user.id} user={user} showFollowButton />
                  ))}
                </div>
              </div>
            )}

            {/* Trending Topics */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg text-gray-900 dark:text-white">
                  {t('feed.trending') || 'Tendencias'}
                </h2>
                <button
                  onClick={() => navigate('/search?tab=trending')}
                  className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
                >
                  {t('common.viewAll') || 'Ver todas'}
                </button>
              </div>
              <div className="space-y-3">
                {trendingTopics && trendingTopics.length > 0 ? (
                  trendingTopics.slice(0, 3).map((topic, index) => (
                    <button
                      key={topic.hashtag}
                      onClick={() => navigate(`/search?q=${encodeURIComponent(topic.hashtag)}`)}
                      className="block w-full text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 p-2 -mx-2 rounded-lg transition-colors"
                    >
                      <p className="text-gray-500 dark:text-gray-400 text-xs">
                        Tendencia #{index + 1}
                      </p>
                      <p className="font-medium text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400">
                        {topic.hashtag}
                      </p>
                      <p className="text-gray-400 dark:text-gray-500 text-xs">
                        {topic.count} {topic.count === 1 ? 'publicación' : 'publicaciones'}
                      </p>
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('feed.noTrending') || 'No hay tendencias aún'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Feed
