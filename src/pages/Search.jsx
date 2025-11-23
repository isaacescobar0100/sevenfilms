import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search as SearchIcon, Film, Users, Play, Eye, FileText, X, Clock, Grid3x3, TrendingUp, Hash } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { useSearchUsers, useSuggestedUsers } from '../hooks/useProfiles'
import { useSearchPosts, useTrending } from '../hooks/usePosts'
import { useRecentSearches } from '../hooks/useRecentSearches'
import { getTranslatedGenre } from '../utils/genreMapper'
import UserCard from '../components/social/UserCard'
import Post from '../components/social/Post'
import LoadingSpinner from '../components/common/LoadingSpinner'
import MoviePlayerModal from '../components/movies/MoviePlayerModal'
import { useRateLimit } from '../hooks/useRateLimit'
import SEO from '../components/common/SEO'

function Search() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [selectedMovie, setSelectedMovie] = useState(null)
  const [showRecentDropdown, setShowRecentDropdown] = useState(false)
  const [searchBlocked, setSearchBlocked] = useState(false)

  const { canPerformAction, performAction, limit, resetTime } = useRateLimit('searchRequests')

  // Leer query y tab parameters de la URL
  useEffect(() => {
    const urlQuery = searchParams.get('q')
    const urlTab = searchParams.get('tab')
    if (urlQuery) {
      // Remover el símbolo # si existe
      const cleanQuery = urlQuery.startsWith('#') ? urlQuery.substring(1) : urlQuery
      setQuery(cleanQuery)
    }
    if (urlTab && ['all', 'users', 'posts', 'movies', 'trending', 'suggested'].includes(urlTab)) {
      setActiveTab(urlTab)
    }
  }, [searchParams])

  const { recentSearches, addSearch, removeSearch, clearSearches } = useRecentSearches()
  const { data: trending } = useTrending()
  const { data: suggestedUsers } = useSuggestedUsers()

  // Verificar rate limit antes de hacer la búsqueda
  const shouldEnableSearch = Boolean(query && query.trim().length >= 2 && !searchBlocked)

  const { data: users, isLoading: usersLoading } = useSearchUsers(shouldEnableSearch ? query : '')
  const { data: posts, isLoading: postsLoading } = useSearchPosts(shouldEnableSearch ? query : '')

  // Búsqueda de películas
  const { data: movies, isLoading: moviesLoading } = useQuery({
    queryKey: ['search-movies', query],
    queryFn: async () => {
      if (!query || query.trim().length < 2) return []

      // Verificar rate limit
      if (!canPerformAction) {
        setSearchBlocked(true)
        throw new Error(`Has alcanzado el límite de ${limit} búsquedas por hora.`)
      }

      performAction()

      const { data: moviesData, error: moviesError } = await supabase
        .from('movies')
        .select('*')
        .or(`title.ilike.%${query}%,description.ilike.%${query}%,genre.ilike.%${query}%`)
        .order('created_at', { ascending: false })
        .limit(20)

      if (moviesError) {
        console.error('Error searching movies:', moviesError)
        throw moviesError
      }

      // Obtener los perfiles de los usuarios que subieron las películas
      if (moviesData && moviesData.length > 0) {
        const userIds = [...new Set(moviesData.map(m => m.user_id))]
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .in('id', userIds)

        // Combinar los datos
        const moviesWithProfiles = moviesData.map(movie => ({
          ...movie,
          profiles: profilesData?.find(p => p.id === movie.user_id) || null
        }))

        return moviesWithProfiles
      }

      return moviesData || []
    },
    enabled: shouldEnableSearch,
  })

  // Resetear bloqueo cuando el rate limit se restablece
  useEffect(() => {
    if (canPerformAction && searchBlocked) {
      setSearchBlocked(false)
    }
  }, [canPerformAction, searchBlocked])

  // Guardar búsqueda cuando el usuario escribe algo válido
  useEffect(() => {
    if (query && query.trim().length >= 2) {
      // Guardar búsqueda con un pequeño delay para evitar guardar cada keystroke
      const timeoutId = setTimeout(() => {
        // Determinar el tipo de búsqueda basado en la pestaña actual
        const searchType = ['users', 'posts', 'movies'].includes(activeTab) ? activeTab : 'general'
        addSearch(query, searchType)
      }, 1000)

      return () => clearTimeout(timeoutId)
    }
  }, [query, activeTab, addSearch])

  // Manejar clic en búsqueda reciente
  const handleRecentSearchClick = (recentQuery, type) => {
    setQuery(recentQuery)
    if (type && type !== 'general') {
      setActiveTab(type)
    }
    setShowRecentDropdown(false)
  }

  // Guardar cuando el usuario hace clic en un perfil desde los resultados
  const handleProfileClick = (user) => {
    // Guardar el nombre/username del perfil visitado
    const searchTerm = user.full_name || user.username
    addSearch(searchTerm, 'users')
  }

  // Cerrar dropdown cuando se hace click fuera
  useEffect(() => {
    const handleClickOutside = () => setShowRecentDropdown(false)
    if (showRecentDropdown) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showRecentDropdown])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <SEO
        title="Buscar"
        description="Busca cineastas, cortometrajes y publicaciones en Seven. Encuentra talento audiovisual y conecta con creadores."
        noIndex
      />

      {/* Search Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{t('search.title')}</h1>

        {/* Search Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={(e) => {
              e.stopPropagation()
              if ((recentSearches.length > 0 || (trending && trending.length > 0)) && !query) {
                setShowRecentDropdown(true)
              }
            }}
            onClick={(e) => {
              e.stopPropagation()
              if ((recentSearches.length > 0 || (trending && trending.length > 0)) && !query) {
                setShowRecentDropdown(true)
              }
            }}
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder-gray-500 dark:placeholder-gray-400"
            placeholder={t('search.placeholder')}
          />

          {/* Dropdown de búsquedas recientes y tendencias */}
          {showRecentDropdown && !query && (recentSearches.length > 0 || (trending && trending.length > 0)) && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-y-auto">
              {/* Tendencias */}
              {trending && trending.length > 0 && (
                <>
                  <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-primary-500" />
                      <span>{t('feed.trending')}</span>
                    </h3>
                  </div>
                  <div className="p-2 flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700">
                    {trending.slice(0, 8).map((item) => (
                      <button
                        key={item.hashtag}
                        onClick={(e) => {
                          e.stopPropagation()
                          // Remover el # para la búsqueda
                          const searchTerm = item.hashtag.startsWith('#') ? item.hashtag.substring(1) : item.hashtag
                          setQuery(searchTerm)
                          setShowRecentDropdown(false)
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-primary-100 dark:hover:bg-primary-900/30 hover:text-primary-700 dark:hover:text-primary-400 rounded-full text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors"
                      >
                        <Hash className="h-3.5 w-3.5" />
                        <span>{item.hashtag.replace('#', '')}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">({item.count})</span>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Búsquedas recientes */}
              {recentSearches.length > 0 && (
                <>
                  <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <span>{t('search.recentSearches')}</span>
                    </h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        clearSearches()
                        if (!trending || trending.length === 0) {
                          setShowRecentDropdown(false)
                        }
                      }}
                      className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
                    >
                      {t('common.delete')}
                    </button>
                  </div>
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {recentSearches.map((search, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRecentSearchClick(search.query, search.type)
                        }}
                      >
                        <div className="flex items-center space-x-3 flex-1">
                          <div className="flex-shrink-0">
                            {search.type === 'users' && (
                              <Users className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                            )}
                            {search.type === 'posts' && (
                              <FileText className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                            )}
                            {search.type === 'movies' && (
                              <Film className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                            )}
                            {(!search.type || search.type === 'general') && (
                              <SearchIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {search.query}
                            </p>
                            {search.type && search.type !== 'general' && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {t(`search.tabs.${search.type}`)}
                              </p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            removeSearch(search.query)
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full"
                        >
                          <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="mt-6 border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            <button
              onClick={() => setActiveTab('all')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center space-x-2 whitespace-nowrap ${
                activeTab === 'all'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-300'
              }`}
            >
              <Grid3x3 className="h-4 w-4" />
              <span>Todos</span>
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center space-x-2 whitespace-nowrap ${
                activeTab === 'users'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-300'
              }`}
            >
              <Users className="h-4 w-4" />
              <span>{t('search.tabs.users')}</span>
            </button>
            <button
              onClick={() => setActiveTab('posts')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center space-x-2 whitespace-nowrap ${
                activeTab === 'posts'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-300'
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>{t('search.tabs.posts')}</span>
            </button>
            <button
              onClick={() => setActiveTab('movies')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center space-x-2 whitespace-nowrap ${
                activeTab === 'movies'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-300'
              }`}
            >
              <Film className="h-4 w-4" />
              <span>{t('search.tabs.movies')}</span>
            </button>
            <button
              onClick={() => setActiveTab('trending')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center space-x-2 whitespace-nowrap ${
                activeTab === 'trending'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-300'
              }`}
            >
              <TrendingUp className="h-4 w-4" />
              <span>{t('feed.trending')}</span>
            </button>
            <button
              onClick={() => setActiveTab('suggested')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center space-x-2 whitespace-nowrap ${
                activeTab === 'suggested'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-300'
              }`}
            >
              <Users className="h-4 w-4" />
              <span>{t('feed.suggestedFilmmakers')}</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Results */}
      <div>
        {activeTab === 'all' && (
          <div className="space-y-8">
            {!query || query.trim().length < 2 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <SearchIcon className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400">{t('search.minChars')}</p>
              </div>
            ) : (
              <>
                {/* Usuarios */}
                {users && users.length > 0 && (
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      {t('search.tabs.users')}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {users.slice(0, 4).map((user) => (
                        <UserCard key={user.id} user={user} onProfileClick={handleProfileClick} />
                      ))}
                    </div>
                    {users.length > 4 && (
                      <button
                        onClick={() => setActiveTab('users')}
                        className="mt-4 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium text-sm"
                      >
                        Ver todos los usuarios ({users.length})
                      </button>
                    )}
                  </div>
                )}

                {/* Posts */}
                {posts && posts.length > 0 && (
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      {t('search.tabs.posts')}
                    </h2>
                    <div className="space-y-4">
                      {posts.slice(0, 3).map((post) => (
                        <Post key={post.id} post={post} />
                      ))}
                    </div>
                    {posts.length > 3 && (
                      <button
                        onClick={() => setActiveTab('posts')}
                        className="mt-4 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium text-sm"
                      >
                        Ver todas las publicaciones ({posts.length})
                      </button>
                    )}
                  </div>
                )}

                {/* Movies */}
                {movies && movies.length > 0 && (
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <Film className="h-5 w-5" />
                      {t('search.tabs.movies')}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {movies.slice(0, 3).map((movie) => (
                        <div
                          key={movie.id}
                          onClick={() => setSelectedMovie(movie)}
                          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                        >
                          {/* Thumbnail */}
                          <div className="relative aspect-video bg-gray-900">
                            {movie.thumbnail_url ? (
                              <img
                                src={movie.thumbnail_url}
                                alt={movie.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Film className="h-16 w-16 text-gray-600" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-primary-600 rounded-full p-4">
                                <Play className="h-8 w-8 text-white" fill="white" />
                              </div>
                            </div>
                            {movie.duration && (
                              <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                                {Math.floor(movie.duration / 60)}:{(movie.duration % 60).toString().padStart(2, '0')}
                              </div>
                            )}
                          </div>
                          <div className="p-4">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-1">
                              {movie.title}
                            </h3>
                            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                              {movie.genre && (
                                <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">
                                  {getTranslatedGenre(movie.genre, t)}
                                </span>
                              )}
                              <div className="flex items-center space-x-1">
                                <Eye className="h-4 w-4" />
                                <span>{movie.views || 0}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {movies.length > 3 && (
                      <button
                        onClick={() => setActiveTab('movies')}
                        className="mt-4 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium text-sm"
                      >
                        Ver todas las películas ({movies.length})
                      </button>
                    )}
                  </div>
                )}

                {/* No results */}
                {(!users || users.length === 0) &&
                 (!posts || posts.length === 0) &&
                 (!movies || movies.length === 0) &&
                 !usersLoading && !postsLoading && !moviesLoading && (
                  <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <SearchIcon className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                    <p className="text-gray-600 dark:text-gray-400">No se encontraron resultados</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                      {t('search.tryAgain')}
                    </p>
                  </div>
                )}

                {/* Loading */}
                {(usersLoading || postsLoading || moviesLoading) && (
                  <div className="flex justify-center py-12">
                    <LoadingSpinner />
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div>
            {!query || query.trim().length < 2 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <SearchIcon className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400">{t('search.minChars')}</p>
              </div>
            ) : usersLoading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : users && users.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {users.map((user) => (
                  <UserCard key={user.id} user={user} onProfileClick={handleProfileClick} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <Users className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400">{t('search.noUsers')}</p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                  {t('search.tryAgain')}
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'posts' && (
          <div>
            {!query || query.trim().length < 2 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <SearchIcon className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400">{t('search.minChars')}</p>
              </div>
            ) : postsLoading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : posts && posts.length > 0 ? (
              <div className="space-y-4">
                {posts.map((post) => (
                  <Post key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <FileText className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400">{t('search.noPosts')}</p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                  {t('search.tryAgain')}
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'movies' && (
          <div>
            {!query || query.trim().length < 2 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <SearchIcon className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400">{t('search.minCharsMovies')}</p>
              </div>
            ) : moviesLoading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : movies && movies.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {movies.map((movie) => (
                  <div
                    key={movie.id}
                    onClick={() => setSelectedMovie(movie)}
                    className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-video bg-gray-900">
                      {movie.thumbnail_url ? (
                        <img
                          src={movie.thumbnail_url}
                          alt={movie.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Film className="h-16 w-16 text-gray-600" />
                        </div>
                      )}
                      {/* Play overlay */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-primary-600 rounded-full p-4">
                          <Play className="h-8 w-8 text-white" fill="white" />
                        </div>
                      </div>
                      {/* Duration badge */}
                      {movie.duration && (
                        <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                          {Math.floor(movie.duration / 60)}:{(movie.duration % 60).toString().padStart(2, '0')}
                        </div>
                      )}
                    </div>

                    {/* Movie Info */}
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-1">
                        {movie.title}
                      </h3>
                      {movie.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                          {movie.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-2">
                        {movie.genre && (
                          <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">
                            {getTranslatedGenre(movie.genre, t)}
                          </span>
                        )}
                        <div className="flex items-center space-x-1">
                          <Eye className="h-4 w-4" />
                          <span>{movie.views || 0}</span>
                        </div>
                      </div>
                      {/* Author */}
                      {movie.profiles && (
                        <div className="flex items-center space-x-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                          {movie.profiles.avatar_url ? (
                            <img
                              src={movie.profiles.avatar_url}
                              alt={movie.profiles.full_name}
                              className="h-6 w-6 rounded-full"
                            />
                          ) : (
                            <div className="h-6 w-6 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold">
                              {movie.profiles.full_name?.[0] || 'U'}
                            </div>
                          )}
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            {movie.profiles.full_name}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <Film className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400">{t('search.noMovies')}</p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                  {t('search.tryAgain')}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Trending Tab */}
        {activeTab === 'trending' && (
          <div>
            {trending && trending.length > 0 ? (
              <div className="space-y-3">
                {trending.map((topic, index) => (
                  <button
                    key={topic.hashtag}
                    onClick={() => {
                      const searchTerm = topic.hashtag.startsWith('#') ? topic.hashtag.substring(1) : topic.hashtag
                      setQuery(searchTerm)
                      setActiveTab('posts')
                    }}
                    className="block w-full text-left bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {t('feed.trending')} #{index + 1}
                        </p>
                        <p className="font-bold text-lg text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400">
                          {topic.hashtag}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {topic.count} {topic.count === 1 ? 'publicación' : 'publicaciones'}
                        </p>
                      </div>
                      <TrendingUp className="h-6 w-6 text-primary-500" />
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <TrendingUp className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400">{t('feed.noTrending') || 'No hay tendencias aún'}</p>
              </div>
            )}
          </div>
        )}

        {/* Suggested Filmmakers Tab */}
        {activeTab === 'suggested' && (
          <div>
            {suggestedUsers && suggestedUsers.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {suggestedUsers.map((user) => (
                  <UserCard key={user.id} user={user} showFollowButton onProfileClick={handleProfileClick} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <Users className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400">{t('search.noUsers')}</p>
              </div>
            )}
          </div>
        )}
      </div>


      {/* Movie Player Modal */}
      {selectedMovie && (
        <MoviePlayerModal
          movie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
        />
      )}
    </div>
  )
}

export default Search
