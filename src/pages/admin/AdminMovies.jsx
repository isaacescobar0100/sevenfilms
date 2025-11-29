import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Search,
  Trash2,
  Film,
  Eye,
  Star,
  MoreVertical,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Play,
  X
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { usePendingMovies, useUpdateMovieStatus } from '../../hooks/useMovies'

function AdminMovies() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showMenu, setShowMenu] = useState(null)
  const [activeTab, setActiveTab] = useState('pending') // 'pending', 'approved', 'rejected', 'all'
  const [previewMovie, setPreviewMovie] = useState(null)
  const [rejectModal, setRejectModal] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const queryClient = useQueryClient()

  // Fetch pending movies
  const { data: pendingMovies, isLoading: pendingLoading } = usePendingMovies()

  // Fetch movies based on tab
  const { data: movies, isLoading, error } = useQuery({
    queryKey: ['admin-movies', searchQuery, activeTab],
    queryFn: async () => {
      let query = supabase
        .from('movies')
        .select('*')
        .order('created_at', { ascending: false })

      // Filter by status
      if (activeTab !== 'all') {
        query = query.eq('status', activeTab)
      }

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
      }

      const { data: moviesData, error } = await query.limit(50)
      if (error) throw error

      // Get profiles in batch
      const userIds = [...new Set(moviesData.map(m => m.user_id))]
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', userIds)

      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || [])

      return moviesData.map(movie => ({
        ...movie,
        profile: profilesMap.get(movie.user_id),
      }))
    },
    staleTime: 30 * 1000,
  })

  // Update movie status mutation
  const updateStatusMutation = useUpdateMovieStatus()

  // Delete movie mutation
  const deleteMovieMutation = useMutation({
    mutationFn: async (movieId) => {
      const { data: movie } = await supabase
        .from('movies')
        .select('*')
        .eq('id', movieId)
        .single()

      const { error } = await supabase
        .from('movies')
        .delete()
        .eq('id', movieId)

      if (error) throw error

      if (movie) {
        try {
          const filesToDelete = []
          if (movie.video_url) {
            const path = movie.video_url.split('/movies/')[1]
            if (path) filesToDelete.push(path)
          }
          if (movie.thumbnail_url) {
            const path = movie.thumbnail_url.split('/movies/')[1]
            if (path) filesToDelete.push(path)
          }
          if (filesToDelete.length > 0) {
            await supabase.storage.from('movies').remove(filesToDelete)
          }
        } catch (e) {
          console.warn('Error deleting storage files:', e)
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-movies'] })
      queryClient.invalidateQueries({ queryKey: ['pending-movies'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
      setShowMenu(null)
    },
  })

  const handleApprove = (movieId) => {
    updateStatusMutation.mutate({ movieId, status: 'approved' })
  }

  const handleReject = (movie) => {
    setRejectModal(movie)
    setRejectReason('')
  }

  const confirmReject = () => {
    if (rejectModal) {
      updateStatusMutation.mutate({
        movieId: rejectModal.id,
        status: 'rejected',
        rejectionReason: rejectReason || null
      })
      setRejectModal(null)
      setRejectReason('')
    }
  }

  const handleDeleteMovie = (movie) => {
    if (window.confirm(`¿Estás seguro de eliminar "${movie.title}"?`)) {
      deleteMovieMutation.mutate(movie.id)
    }
  }

  const formatDuration = (seconds) => {
    if (!seconds) return '-'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
            <CheckCircle className="h-3 w-3" />
            Aprobada
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
            <XCircle className="h-3 w-3" />
            Rechazada
          </span>
        )
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">
            <Clock className="h-3 w-3" />
            Pendiente
          </span>
        )
    }
  }

  const pendingCount = pendingMovies?.length || 0

  const tabs = [
    { id: 'pending', label: 'Pendientes', count: pendingCount, icon: Clock },
    { id: 'approved', label: 'Aprobadas', icon: CheckCircle },
    { id: 'rejected', label: 'Rechazadas', icon: XCircle },
    { id: 'all', label: 'Todas', icon: Film },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Películas</h1>
          <p className="text-gray-500 dark:text-gray-400">Gestiona y modera las películas de la plataforma</p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar películas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-full sm:w-64 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Pending alert banner */}
      {pendingCount > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            <div>
              <p className="font-medium text-yellow-800 dark:text-yellow-200">
                {pendingCount} película{pendingCount !== 1 ? 's' : ''} pendiente{pendingCount !== 1 ? 's' : ''} de revisión
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Las películas pendientes no son visibles para los usuarios hasta que las apruebes.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  isActive
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    isActive
                      ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Movies Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        {isLoading || (activeTab === 'pending' && pendingLoading) ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-gray-500 dark:text-gray-400">Cargando películas...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">
            Error al cargar películas: {error.message}
          </div>
        ) : movies?.length === 0 ? (
          <div className="p-8 text-center">
            <Film className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500 dark:text-gray-400">
              {activeTab === 'pending'
                ? 'No hay películas pendientes de revisión'
                : 'No se encontraron películas'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Película
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Género
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      Vistas
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4" />
                      Rating
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {movies.map((movie) => (
                  <tr key={movie.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-12 w-20 rounded bg-gray-200 dark:bg-gray-700 overflow-hidden flex-shrink-0 cursor-pointer relative group"
                          onClick={() => setPreviewMovie(movie)}
                        >
                          {movie.thumbnail_url ? (
                            <img
                              src={movie.thumbnail_url}
                              alt={movie.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <Film className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Play className="h-6 w-6 text-white" />
                          </div>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {movie.title}
                          </p>
                          {movie.year && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {movie.year} - {formatDuration(movie.duration)}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                          {movie.profile?.avatar_url ? (
                            <img src={movie.profile.avatar_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-gray-500 text-xs">
                              ?
                            </div>
                          )}
                        </div>
                        <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                          @{movie.profile?.username || 'usuario'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(movie.status || 'pending')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                        {movie.genre || 'Sin género'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {movie.views?.toLocaleString() || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                        <span className="text-sm text-gray-900 dark:text-white">
                          {movie.average_rating?.toFixed(1) || '-'}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          ({movie.ratings_count || 0})
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(movie.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Quick actions for pending movies */}
                        {movie.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(movie.id)}
                              disabled={updateStatusMutation.isPending}
                              className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                              title="Aprobar"
                            >
                              <CheckCircle className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleReject(movie)}
                              disabled={updateStatusMutation.isPending}
                              className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                              title="Rechazar"
                            >
                              <XCircle className="h-5 w-5" />
                            </button>
                          </>
                        )}

                        {/* More options menu */}
                        <div className="relative">
                          <button
                            onClick={() => setShowMenu(showMenu === movie.id ? null : movie.id)}
                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                          >
                            <MoreVertical className="h-5 w-5" />
                          </button>

                          {showMenu === movie.id && (
                            <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-10">
                              <div className="py-1">
                                <button
                                  onClick={() => {
                                    setPreviewMovie(movie)
                                    setShowMenu(null)
                                  }}
                                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                  <Play className="h-4 w-4 mr-2" />
                                  Ver Video
                                </button>
                                {movie.status !== 'approved' && (
                                  <button
                                    onClick={() => {
                                      handleApprove(movie.id)
                                      setShowMenu(null)
                                    }}
                                    className="flex items-center w-full px-4 py-2 text-sm text-green-600 dark:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Aprobar
                                  </button>
                                )}
                                {movie.status !== 'rejected' && (
                                  <button
                                    onClick={() => {
                                      handleReject(movie)
                                      setShowMenu(null)
                                    }}
                                    className="flex items-center w-full px-4 py-2 text-sm text-yellow-600 dark:text-yellow-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Rechazar
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteMovie(movie)}
                                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Eliminar Película
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewMovie && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {previewMovie.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Por @{previewMovie.profile?.username || 'usuario'} - {previewMovie.year}
                </p>
              </div>
              <button
                onClick={() => setPreviewMovie(null)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Video player */}
            <div className="aspect-video bg-black">
              <video
                src={previewMovie.video_url}
                controls
                className="w-full h-full"
                poster={previewMovie.thumbnail_url}
              />
            </div>

            {/* Movie info */}
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-4">
                {getStatusBadge(previewMovie.status || 'pending')}
                {previewMovie.genre && (
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {previewMovie.genre}
                  </span>
                )}
                {previewMovie.duration && (
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {formatDuration(previewMovie.duration)}
                  </span>
                )}
              </div>

              {previewMovie.description && (
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {previewMovie.description}
                </p>
              )}

              {previewMovie.rejection_reason && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">
                    Motivo de rechazo:
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {previewMovie.rejection_reason}
                  </p>
                </div>
              )}

              {/* Actions */}
              {previewMovie.status === 'pending' && (
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      handleApprove(previewMovie.id)
                      setPreviewMovie(null)
                    }}
                    disabled={updateStatusMutation.isPending}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    <CheckCircle className="h-5 w-5" />
                    Aprobar
                  </button>
                  <button
                    onClick={() => {
                      setPreviewMovie(null)
                      handleReject(previewMovie)
                    }}
                    disabled={updateStatusMutation.isPending}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    <XCircle className="h-5 w-5" />
                    Rechazar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Rechazar película
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              ¿Estás seguro de rechazar "{rejectModal.title}"? El usuario será notificado.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Motivo del rechazo (opcional)..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 resize-none"
              rows={3}
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setRejectModal(null)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmReject}
                disabled={updateStatusMutation.isPending}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                Rechazar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close menu on outside click */}
      {showMenu && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowMenu(null)}
        />
      )}
    </div>
  )
}

export default AdminMovies
