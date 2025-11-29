import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Trash2, Film, Eye, Star, MoreVertical } from 'lucide-react'
import { supabase } from '../../lib/supabase'

function AdminMovies() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showMenu, setShowMenu] = useState(null)
  const queryClient = useQueryClient()

  // Fetch movies with user info
  const { data: movies, isLoading, error } = useQuery({
    queryKey: ['admin-movies', searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('movies')
        .select('*')
        .order('created_at', { ascending: false })

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

  // Delete movie mutation
  const deleteMovieMutation = useMutation({
    mutationFn: async (movieId) => {
      // Get movie info first
      const { data: movie } = await supabase
        .from('movies')
        .select('*')
        .eq('id', movieId)
        .single()

      // Delete movie record
      const { error } = await supabase
        .from('movies')
        .delete()
        .eq('id', movieId)

      if (error) throw error

      // Try to delete storage files
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
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
      setShowMenu(null)
    },
  })

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Películas</h1>
          <p className="text-gray-500 dark:text-gray-400">Gestiona las películas de la plataforma</p>
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

      {/* Movies Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
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
            <p className="text-gray-500 dark:text-gray-400">No se encontraron películas</p>
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
                    Género
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Duración
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
                        <div className="h-12 w-20 rounded bg-gray-200 dark:bg-gray-700 overflow-hidden flex-shrink-0">
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
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {movie.title}
                          </p>
                          {movie.year && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {movie.year}
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
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                        {movie.genre || 'Sin género'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDuration(movie.duration)}
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
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
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
                              <a
                                href={movie.video_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Ver Video
                              </a>
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
