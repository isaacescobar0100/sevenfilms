import { useState, useRef, useEffect } from 'react'
import { Film, Plus, Play, Eye, Calendar, Star, ArrowUpDown, ChevronDown, Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useMovies } from '../hooks/useMovies'
import { useFeaturedMovies } from '../hooks/useMovieRatings'
import { getTranslatedGenre } from '../utils/genreMapper'
import LoadingSpinner from '../components/common/LoadingSpinner'
import UploadMovieModal from '../components/movies/UploadMovieModal'
import MoviePlayerModal from '../components/movies/MoviePlayerModal'
import MovieRatingStars from '../components/movies/MovieRatingStars'

function Movies() {
  const { t } = useTranslation()

  const GENRES = [
    { key: 'all', label: t('movies.genres.all') },
    { key: 'drama', label: t('movies.genres.drama') },
    { key: 'comedy', label: t('movies.genres.comedy') },
    { key: 'action', label: t('movies.genres.action') },
    { key: 'documentary', label: t('movies.genres.documentary') },
    { key: 'thriller', label: t('movies.genres.thriller') },
    { key: 'horror', label: t('movies.genres.horror') },
    { key: 'sciFi', label: t('movies.genres.sciFi') },
    { key: 'romance', label: t('movies.genres.romance') },
    { key: 'animation', label: t('movies.genres.animation') },
    { key: 'experimental', label: t('movies.genres.experimental') },
  ]

  const SORT_OPTIONS = [
    { key: 'popular', label: t('movies.sort.popular') },
    { key: 'rating', label: t('movies.sort.rating') },
    { key: 'views', label: t('movies.sort.views') },
    { key: 'recent', label: t('movies.sort.recent') },
    { key: 'comments', label: t('movies.sort.comments') },
  ]

  const [selectedGenreKey, setSelectedGenreKey] = useState('all')
  const [sortBy, setSortBy] = useState('popular')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedMovie, setSelectedMovie] = useState(null)
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  const dropdownRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowSortDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedGenre = GENRES.find(g => g.key === selectedGenreKey)
  const filters = {
    ...(selectedGenreKey !== 'all' ? { genre: selectedGenre?.label } : {}),
    sortBy
  }
  const { data: movies, isLoading } = useMovies(filters)
  const { data: featuredMovies, isLoading: isFeaturedLoading } = useFeaturedMovies()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('movies.title')}</h1>
          <p className="text-gray-600 mt-1">{t('movies.subtitle')}</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span className="hidden sm:inline">{t('movies.upload')}</span>
        </button>
      </div>

      {/* Featured Movies Section */}
      {!isFeaturedLoading && featuredMovies && featuredMovies.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
            <h2 className="text-2xl font-bold text-gray-900">{t('movies.featured')}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {featuredMovies.slice(0, 5).map((movie) => (
              <FeaturedMovieCard
                key={movie.id}
                movie={movie}
                onClick={() => setSelectedMovie(movie)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Genre Filter */}
      <div className="mb-6 overflow-x-auto">
        <div className="flex space-x-2 pb-2">
          {GENRES.map((genre) => (
            <button
              key={genre.key}
              onClick={() => setSelectedGenreKey(genre.key)}
              className={`px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-colors ${
                selectedGenreKey === genre.key
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {genre.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sort Filter */}
      <div className="mb-6 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-primary-100 p-2 rounded-lg">
            <ArrowUpDown className="h-5 w-5 text-primary-600" />
          </div>
          <span className="text-sm font-semibold text-gray-700">{t('movies.sort.label')}</span>

          {/* Custom Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className="bg-white border-2 border-gray-200 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:border-primary-400 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 cursor-pointer shadow-sm flex items-center gap-2 min-w-[180px]"
            >
              <span className="flex-1 text-left">
                {SORT_OPTIONS.find(opt => opt.key === sortBy)?.label}
              </span>
              <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${showSortDropdown ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {showSortDropdown && (
              <div className="absolute top-full left-0 mt-2 w-full bg-white border-2 border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.key}
                    onClick={() => {
                      setSortBy(option.key)
                      setShowSortDropdown(false)
                    }}
                    className={`w-full px-4 py-3 text-sm font-medium text-left transition-all duration-150 flex items-center justify-between group ${
                      sortBy === option.key
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className={sortBy === option.key ? 'font-semibold' : ''}>
                      {option.label}
                    </span>
                    {sortBy === option.key && (
                      <Check className="h-4 w-4 text-primary-600" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        {movies && movies.length > 0 && (
          <span className="text-xs text-gray-500 font-medium">
            {movies.length} {movies.length === 1 ? t('feed.post') : t('feed.posts')}
          </span>
        )}
      </div>

      {/* Movies Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : movies && movies.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} onClick={() => setSelectedMovie(movie)} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Film className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {t('movies.noMovies')}
          </h3>
          <p className="text-gray-600 mb-4">
            {selectedGenreKey !== 'all'
              ? `${t('movies.noMoviesGenre')} ${selectedGenre?.label}`
              : t('movies.uploadFirst')}
          </p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="btn btn-primary"
          >
            {t('movies.upload')}
          </button>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadMovieModal onClose={() => setShowUploadModal(false)} />
      )}

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

function MovieCard({ movie, onClick }) {
  const { t } = useTranslation()

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer"
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
        {/* Play Button Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-white rounded-full p-4">
              <Play className="h-8 w-8 text-primary-600" />
            </div>
          </div>
        </div>
        {/* Duration Badge */}
        {movie.duration && (
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
            {Math.floor(movie.duration / 60)}:{(movie.duration % 60).toString().padStart(2, '0')}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-bold text-gray-900 mb-1 line-clamp-2">{movie.title}</h3>

        {/* Creator */}
        <div className="flex items-center space-x-2 mb-2">
          {movie.profiles?.avatar_url ? (
            <img
              src={movie.profiles.avatar_url}
              alt={movie.profiles.full_name}
              className="h-6 w-6 rounded-full object-cover"
            />
          ) : (
            <div className="h-6 w-6 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-semibold">
              {movie.profiles?.full_name?.[0] || 'U'}
            </div>
          )}
          <p className="text-sm text-gray-600">{movie.profiles?.full_name}</p>
        </div>

        {/* Description */}
        {movie.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{movie.description}</p>
        )}

        {/* Rating */}
        {movie.ratings_count > 0 && (
          <div className="mb-2">
            <MovieRatingStars
              rating={movie.average_rating || 0}
              size="sm"
              showCount={true}
              count={movie.ratings_count}
            />
          </div>
        )}

        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-3">
            {movie.genre && (
              <span className="bg-gray-100 px-2 py-1 rounded">{getTranslatedGenre(movie.genre, t)}</span>
            )}
            {movie.year && (
              <div className="flex items-center space-x-1">
                <Calendar className="h-3 w-3" />
                <span>{movie.year}</span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-1">
            <Eye className="h-3 w-3" />
            <span>{movie.views || 0}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function FeaturedMovieCard({ movie, onClick }) {
  const { t } = useTranslation()

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg border-2 border-yellow-400 overflow-hidden hover:shadow-lg transition-all group cursor-pointer"
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
            <Film className="h-12 w-12 text-gray-600" />
          </div>
        )}
        {/* Play Button Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-white rounded-full p-3">
              <Play className="h-6 w-6 text-primary-600" />
            </div>
          </div>
        </div>
        {/* Featured Badge */}
        <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
          <Star className="h-3 w-3 fill-white" />
          <span>{t('movies.featured')}</span>
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="font-bold text-gray-900 mb-1 line-clamp-1 text-sm">{movie.title}</h3>

        {/* Rating */}
        {movie.ratings_count > 0 && (
          <div className="mb-2">
            <div className="flex items-center gap-1">
              <MovieRatingStars rating={movie.average_rating || 0} size="sm" />
              <span className="text-xs text-gray-600">
                {movie.average_rating?.toFixed(1) || '0.0'}
              </span>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            <span>{movie.views || 0}</span>
          </div>
          {movie.comments_count > 0 && (
            <span>{movie.comments_count} {t('movies.details.comments')}</span>
          )}
        </div>
      </div>
    </div>
  )
}

export default Movies
