import { useState } from 'react'
import { Bookmark, Film, FileText, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useSavedPosts, useSavedMovies, useToggleSaveMovie } from '../hooks/useSavedPosts'
import { getTranslatedGenre } from '../utils/genreMapper'
import Post from '../components/social/Post'
import LoadingSpinner from '../components/common/LoadingSpinner'
import LeftSidebar from '../components/layout/LeftSidebar'
import { Link } from 'react-router-dom'

function Saved() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState('posts')
  const { data: savedPosts, isLoading: loadingPosts, error: errorPosts } = useSavedPosts()
  const { data: savedMovies, isLoading: loadingMovies, error: errorMovies } = useSavedMovies()
  const toggleSaveMovie = useToggleSaveMovie()

  const tabs = [
    { id: 'posts', label: 'Posts', icon: FileText },
    { id: 'movies', label: t('nav.movies') || 'Películas', icon: Film },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar */}
        <div className="lg:col-span-3">
          <LeftSidebar />
        </div>

        {/* Main Content */}
        <div className="lg:col-span-6 space-y-6">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center space-x-3">
              <Bookmark className="h-8 w-8 text-primary-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {t('saved.title') || 'Guardados'}
                </h1>
                <p className="text-gray-500 dark:text-gray-400">
                  {t('saved.subtitle') || 'Contenido que has guardado para ver después'}
                </p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center space-x-2 py-4 font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{tab.label}</span>
                    <span className={`ml-1 px-2 py-0.5 text-xs rounded-full ${
                      activeTab === tab.id
                        ? 'bg-primary-100 dark:bg-primary-800 text-primary-600 dark:text-primary-300'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}>
                      {tab.id === 'posts' ? (savedPosts?.length || 0) : (savedMovies?.length || 0)}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Posts Tab Content */}
          {activeTab === 'posts' && (
            <>
              {loadingPosts ? (
                <div className="flex justify-center py-12">
                  <LoadingSpinner />
                </div>
              ) : errorPosts ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
                  <p className="text-red-500">{t('common.error')}</p>
                </div>
              ) : savedPosts && savedPosts.length > 0 ? (
                <div className="space-y-6">
                  {savedPosts.map((post) => (
                    <Post key={post.id} post={post} />
                  ))}
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
                  <Bookmark className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {t('saved.empty') || 'No tienes posts guardados'}
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400">
                    {t('saved.emptyDescription') || 'Guarda posts para verlos más tarde haciendo clic en el icono de marcador'}
                  </p>
                </div>
              )}
            </>
          )}

          {/* Movies Tab Content */}
          {activeTab === 'movies' && (
            <>
              {loadingMovies ? (
                <div className="flex justify-center py-12">
                  <LoadingSpinner />
                </div>
              ) : errorMovies ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
                  <p className="text-red-500">{t('common.error')}</p>
                </div>
              ) : savedMovies && savedMovies.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {savedMovies.map((movie) => (
                    <div
                      key={movie.id}
                      className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      {/* Thumbnail */}
                      <div className="relative aspect-video bg-gray-200 dark:bg-gray-700">
                        {movie.thumbnail_url ? (
                          <img
                            src={movie.thumbnail_url}
                            alt={movie.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Film className="h-12 w-12 text-gray-400" />
                          </div>
                        )}
                        {movie.duration && (
                          <span className="absolute bottom-2 right-2 bg-black/75 text-white text-xs px-2 py-1 rounded">
                            {Math.floor(movie.duration / 60)}:{String(movie.duration % 60).padStart(2, '0')}
                          </span>
                        )}
                        {/* Botón para quitar de guardados */}
                        <button
                          onClick={() => toggleSaveMovie.mutate({ movieId: movie.id, isSaved: true })}
                          disabled={toggleSaveMovie.isPending}
                          className="absolute top-2 right-2 bg-black/70 hover:bg-red-600 text-white p-2 rounded-full transition-colors"
                          title={t('saved.remove') || 'Quitar de guardados'}
                        >
                          <Bookmark className="h-4 w-4 fill-current" />
                        </button>
                      </div>

                      {/* Info */}
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1">
                          {movie.title}
                        </h3>
                        {movie.profiles && (
                          <Link
                            to={`/profile/${movie.profiles.username}`}
                            className="text-sm text-gray-500 dark:text-gray-400 hover:underline"
                          >
                            @{movie.profiles.username}
                          </Link>
                        )}
                        <div className="flex items-center justify-between mt-2 text-sm text-gray-500 dark:text-gray-400">
                          <span>{movie.views || 0} {t('common.views')}</span>
                          {movie.genre && (
                            <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                              {getTranslatedGenre(movie.genre, t)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
                  <Film className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    No tienes películas guardadas
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400">
                    Guarda películas para verlas más tarde haciendo clic en el icono de marcador
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-3">
          <div className="hidden lg:block sticky top-20">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                {t('saved.tip') || 'Consejo'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('saved.tipDescription') || 'Puedes guardar posts y películas haciendo clic en el icono de marcador.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Saved
