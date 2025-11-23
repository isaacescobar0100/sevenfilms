import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Camera, MapPin, Link as LinkIcon, Calendar, Settings, Film, Play, Eye, Trash2, MoreVertical, Edit, MessageCircle } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { useUserStats, useUpdateProfile, uploadAvatar, uploadCover } from '../hooks/useProfiles'
import { useUserPosts } from '../hooks/usePosts'
import { useSharedPostsByUser, useSharedPostsToUser } from '../hooks/useSharedPosts'
import { useIsFollowing, useToggleFollow } from '../hooks/useFollows'
import { useDeleteMovie } from '../hooks/useMovies'
import { getTranslatedGenre } from '../utils/genreMapper'
import Post from '../components/social/Post'
import SharedPost from '../components/social/SharedPost'
import LoadingSpinner from '../components/common/LoadingSpinner'
import EditProfileModal from '../components/social/EditProfileModal'
import MoviePlayerModal from '../components/movies/MoviePlayerModal'
import EditMovieModal from '../components/movies/EditMovieModal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import FollowersModal from '../components/social/FollowersModal'
import SEO from '../components/common/SEO'

function Profile() {
  const { t } = useTranslation()
  const { username } = useParams()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('posts')
  const [showEditModal, setShowEditModal] = useState(false)
  const [showFollowersModal, setShowFollowersModal] = useState(null) // 'followers' | 'following' | null
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)

  // Determinar si es el perfil del usuario actual o de otro usuario
  // Se determina después de cargar el perfil comparando IDs
  const isOwnProfileByUrl = !username

  // Si es el perfil propio, usar el ID del usuario; si no, usar el username de la URL
  const { data: profile, isLoading: profileLoading, error: profileError } = useQuery({
    queryKey: ['profile', username || user?.id],
    queryFn: async () => {
      if (isOwnProfileByUrl) {
        // Buscar por ID para el perfil propio
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (error) throw error
        return data
      } else {
        // Buscar por username para otros perfiles
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', username)
          .single()

        if (error) throw error
        return data
      }
    },
    enabled: !!user,
  })
  // Determinar si es el perfil propio comparando IDs (funciona tanto con /profile como /profile/username)
  const isOwnProfile = profile?.id === user?.id

  const { data: stats } = useUserStats(profile?.id)
  const { data: posts, isLoading: postsLoading } = useUserPosts(profile?.id)
  const { data: sharedByUser = [], isLoading: sharedByLoading } = useSharedPostsByUser(profile?.id)
  const { data: sharedToUser = [], isLoading: sharedToLoading } = useSharedPostsToUser(profile?.id)
  // Solo verificar follow si NO es el perfil propio
  const { data: isFollowing } = useIsFollowing(isOwnProfile ? null : profile?.id)
  const toggleFollow = useToggleFollow()
  const updateProfile = useUpdateProfile()

  const handleFollowToggle = async () => {
    if (!profile?.id) return
    try {
      await toggleFollow.mutateAsync({ userId: profile.id, isFollowing })
    } catch (error) {
      console.error('Error toggling follow:', error)
    }
  }

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingAvatar(true)
    try {
      const avatarUrl = await uploadAvatar(file)
      await updateProfile.mutateAsync({ avatar_url: avatarUrl })
    } catch (error) {
      console.error('Error uploading avatar:', error)
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingCover(true)
    try {
      const coverUrl = await uploadCover(file)
      await updateProfile.mutateAsync({ cover_url: coverUrl })
    } catch (error) {
      console.error('Error uploading cover:', error)
    } finally {
      setUploadingCover(false)
    }
  }

  const handleOpenChat = () => {
    if (!profile?.id) return
    // Navegar a la página de mensajes con el ID del usuario
    navigate('/messages', { state: { selectedUserId: profile.id } })
  }

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('profile.notFound')}</h2>
          <p className="text-gray-600 dark:text-gray-400">{t('profile.notFoundDesc')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      <SEO
        title={profile.full_name || profile.username}
        description={profile.bio || `Perfil de ${profile.full_name || profile.username} en Seven - Red social para cineastas`}
        image={profile.avatar_url}
        type="profile"
      />

      {/* Header con Cover y Avatar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        {/* Cover Image */}
        <div className="h-48 bg-gradient-to-r from-primary-500 to-primary-700 relative group">
          {profile.cover_url && (
            <img
              src={profile.cover_url}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          )}
          {isOwnProfile && (
            <label
              htmlFor="cover-upload"
              className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all cursor-pointer"
            >
              {uploadingCover ? (
                <LoadingSpinner size="sm" />
              ) : (
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center text-white">
                  <Camera className="h-10 w-10 mb-2" />
                  <span className="text-sm font-medium">{t('profile.changeCover')}</span>
                </div>
              )}
              <input
                id="cover-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCoverUpload}
                disabled={uploadingCover}
              />
            </label>
          )}
        </div>

        {/* Avatar y Info Principal */}
        <div className="px-4 sm:px-6 lg:px-8">
          {/* Avatar - sobresale de la portada */}
          <div className="relative -mt-16 sm:-mt-20">
            <div className="relative group inline-block">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name}
                  className="h-24 w-24 sm:h-32 sm:w-32 rounded-full border-4 border-white dark:border-gray-800 bg-white dark:bg-gray-800 object-cover"
                />
              ) : (
                <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-full border-4 border-white dark:border-gray-800 bg-primary-600 flex items-center justify-center text-white text-3xl sm:text-4xl font-bold">
                  {profile.full_name?.[0] || profile.username?.[0] || 'U'}
                </div>
              )}
              {isOwnProfile && (
                <label
                  htmlFor="avatar-upload"
                  className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  {uploadingAvatar ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <Camera className="h-8 w-8 text-white" />
                  )}
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    disabled={uploadingAvatar}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Nombre, Username y Botones - debajo de la portada */}
          <div className="flex items-start justify-between mt-3 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{profile.full_name}</h1>
              <p className="text-gray-600 dark:text-gray-400">@{profile.username}</p>
            </div>

            {/* Botones */}
            <div className="flex space-x-2">
              {isOwnProfile ? (
                <button
                  onClick={() => setShowEditModal(true)}
                  className="btn btn-secondary flex items-center space-x-2"
                >
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('profile.editProfile')}</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={handleOpenChat}
                    className="btn btn-secondary flex items-center space-x-2"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span className="hidden sm:inline">{t('profile.message')}</span>
                  </button>
                  <button
                    onClick={handleFollowToggle}
                    disabled={toggleFollow.isPending}
                    className={`btn ${
                      isFollowing ? 'btn-secondary' : 'btn-primary'
                    } min-w-[100px]`}
                  >
                    {toggleFollow.isPending ? (
                      <LoadingSpinner size="sm" />
                    ) : isFollowing ? (
                      t('profile.following')
                    ) : (
                      t('profile.follow')
                    )}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Bio y Metadata */}
          <div className="pb-5 space-y-3">
            {profile.bio && <p className="text-gray-900 dark:text-white">{profile.bio}</p>}

            <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
              {profile.location && (
                <div className="flex items-center space-x-1">
                  <MapPin className="h-4 w-4" />
                  <span>{profile.location}</span>
                </div>
              )}
              {profile.website && (
                <div className="flex items-center space-x-1">
                  <LinkIcon className="h-4 w-4" />
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    {profile.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
              {profile.created_at && (
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {t('profile.joinedIn')} {new Date(profile.created_at).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                  </span>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="flex space-x-6 text-sm">
              <div>
                <span className="font-bold text-gray-900 dark:text-white">{stats?.posts_count || 0}</span>{' '}
                <span className="text-gray-600 dark:text-gray-400">{t('profile.stats.posts')}</span>
              </div>
              <div>
                <span className="font-bold text-gray-900 dark:text-white">{stats?.movies_count || 0}</span>{' '}
                <span className="text-gray-600 dark:text-gray-400">{t('profile.stats.movies')}</span>
              </div>
              <button
                onClick={() => setShowFollowersModal('followers')}
                className="hover:underline focus:outline-none"
              >
                <span className="font-bold text-gray-900 dark:text-white">{stats?.followers_count || 0}</span>{' '}
                <span className="text-gray-600 dark:text-gray-400">{t('profile.stats.followers')}</span>
              </button>
              <button
                onClick={() => setShowFollowersModal('following')}
                className="hover:underline focus:outline-none"
              >
                <span className="font-bold text-gray-900 dark:text-white">{stats?.following_count || 0}</span>{' '}
                <span className="text-gray-600 dark:text-gray-400">{t('profile.stats.following')}</span>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-t border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('posts')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'posts'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-300'
                }`}
              >
                {t('profile.tabs.posts')}
              </button>
              <button
                onClick={() => setActiveTab('movies')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'movies'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-300'
                }`}
              >
                {t('profile.tabs.movies')}
              </button>
              <button
                onClick={() => setActiveTab('about')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'about'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-300'
                }`}
              >
                {t('profile.tabs.about')}
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'posts' && (
          <div className="space-y-6">
            {(postsLoading || sharedByLoading || sharedToLoading) ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : (() => {
              // Combinar posts propios con posts compartidos (por el usuario y hacia el usuario)
              const ownPosts = (posts || []).map(p => ({ ...p, type: 'post', sortDate: new Date(p.created_at) }))
              const sharedBy = (sharedByUser || []).map(s => ({ ...s, type: 'shared', sortDate: new Date(s.created_at) }))
              const sharedTo = (sharedToUser || []).map(s => ({ ...s, type: 'shared', sortDate: new Date(s.created_at) }))

              // Combinar y ordenar por fecha
              const allContent = [...ownPosts, ...sharedBy, ...sharedTo]
                .sort((a, b) => b.sortDate - a.sortDate)

              if (allContent.length === 0) {
                return (
                  <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-gray-600 dark:text-gray-400">
                      {isOwnProfile
                        ? t('profile.noPosts')
                        : t('profile.noPostsOther')}
                    </p>
                  </div>
                )
              }

              return allContent.map((item) => {
                if (item.type === 'shared') {
                  return <SharedPost key={`shared-${item.id}`} sharedPost={item} />
                }
                return <Post key={`post-${item.id}`} post={item} />
              })
            })()}
          </div>
        )}

        {activeTab === 'movies' && (
          <UserMovies userId={profile.id} isOwnProfile={isOwnProfile} />
        )}

        {activeTab === 'about' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t('profile.about.title')}</h2>
            <div className="space-y-3">
              {profile.bio && (
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{t('profile.about.bio')}</h3>
                  <p className="text-gray-700 dark:text-gray-300">{profile.bio}</p>
                </div>
              )}
              {profile.location && (
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{t('profile.about.location')}</h3>
                  <p className="text-gray-700 dark:text-gray-300">{profile.location}</p>
                </div>
              )}
              {profile.website && (
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{t('profile.about.website')}</h3>
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    {profile.website}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <EditProfileModal
          profile={profile}
          onClose={() => setShowEditModal(false)}
        />
      )}

      {/* Followers/Following Modal */}
      {showFollowersModal && (
        <FollowersModal
          userId={profile?.id}
          initialTab={showFollowersModal}
          onClose={() => setShowFollowersModal(null)}
        />
      )}
    </div>
  )
}

// Componente para mostrar las películas del usuario
function UserMovies({ userId, isOwnProfile }) {
  const { t } = useTranslation()
  const [selectedMovie, setSelectedMovie] = useState(null)
  const [showMenuMovieId, setShowMenuMovieId] = useState(null)
  const [editingMovie, setEditingMovie] = useState(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [movieToDelete, setMovieToDelete] = useState(null)
  const deleteMovie = useDeleteMovie()

  const { data: movies, isLoading } = useQuery({
    queryKey: ['user-movies', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('movies')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
    enabled: !!userId,
  })

  const handleDeleteMovie = async () => {
    if (!movieToDelete) return

    try {
      await deleteMovie.mutateAsync(movieToDelete)
      setShowMenuMovieId(null)
      setMovieToDelete(null)
    } catch (error) {
      console.error('Error deleting movie:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    )
  }

  if (!movies || movies.length === 0) {
    return (
      <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <Film className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">
          {isOwnProfile
            ? t('profile.noMovies')
            : t('profile.noMoviesOther')}
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {movies.map((movie) => (
          <div
            key={movie.id}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group relative"
          >
            {/* Menu de opciones (solo para propietario) */}
            {isOwnProfile && (
              <div className="absolute top-2 right-2 z-10">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowMenuMovieId(showMenuMovieId === movie.id ? null : movie.id)
                  }}
                  className="bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full p-2 text-white transition-all"
                >
                  <MoreVertical className="h-5 w-5" />
                </button>
                {showMenuMovieId === movie.id && (
                  <>
                    <div
                      className="fixed inset-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowMenuMovieId(null)
                      }}
                    ></div>
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl py-1 border border-gray-200 dark:border-gray-700 z-20">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingMovie(movie)
                          setShowMenuMovieId(null)
                        }}
                        className="w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                      >
                        <Edit className="h-4 w-4" />
                        <span>{t('common.edit')}</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setMovieToDelete(movie.id)
                          setShowDeleteDialog(true)
                          setShowMenuMovieId(null)
                        }}
                        className="w-full px-4 py-2 text-left text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>{t('common.delete')}</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            <div onClick={() => setSelectedMovie(movie)}>
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
          </div>
        ))}
      </div>

      {/* Movie Player Modal */}
      {selectedMovie && (
        <MoviePlayerModal
          movie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
        />
      )}

      {/* Edit Movie Modal */}
      {editingMovie && (
        <EditMovieModal
          movie={editingMovie}
          onClose={() => setEditingMovie(null)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false)
          setMovieToDelete(null)
        }}
        onConfirm={handleDeleteMovie}
        title={t('common.delete')}
        message={t('movies.deleteConfirm')}
        confirmText={t('common.delete')}
        type="danger"
      />
    </>
  )
}

export default Profile
