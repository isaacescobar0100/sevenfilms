import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Star,
  Film,
  FileText,
  Search,
  Plus,
  Trash2,
  GripVertical,
  Eye,
  Calendar,
  User,
  Image as ImageIcon,
  Loader2,
  CheckCircle,
  X
} from 'lucide-react'
import { supabase } from '../../lib/supabase'

function AdminFeatured() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('posts')
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)

  // Obtener contenido destacado
  const { data: featuredContent, isLoading, error: featuredError } = useQuery({
    queryKey: ['featured-content'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('featured_content')
        .select(`
          *,
          profiles:added_by (username)
        `)
        .order('position', { ascending: true })

      // PGRST116 = no rows, 42P01 = table doesn't exist
      if (error && error.code !== 'PGRST116' && error.code !== '42P01') {
        console.error('Featured content error:', error)
      }
      return data || []
    },
    retry: false
  })

  // Agregar a destacados
  const addFeaturedMutation = useMutation({
    mutationFn: async ({ contentType, contentId, contentData }) => {
      // Obtener posición máxima actual
      const { data: existing } = await supabase
        .from('featured_content')
        .select('position')
        .eq('content_type', contentType)
        .order('position', { ascending: false })
        .limit(1)

      const nextPosition = existing?.[0]?.position ? existing[0].position + 1 : 1

      const { data: { user } } = await supabase.auth.getUser()

      const { error } = await supabase
        .from('featured_content')
        .insert({
          content_type: contentType,
          content_id: contentId,
          title: contentData.title,
          description: contentData.description,
          image_url: contentData.image_url,
          position: nextPosition,
          added_by: user?.id
        })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['featured-content'] })
      setShowAddModal(false)
      setSearchResults([])
      setSearchQuery('')
    }
  })

  // Eliminar de destacados
  const removeFeaturedMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('featured_content')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['featured-content'] })
    }
  })

  // Buscar contenido para agregar
  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setSearching(true)
    try {
      let results = []

      if (activeTab === 'posts') {
        const { data } = await supabase
          .from('posts')
          .select(`
            id,
            content,
            image_url,
            created_at,
            profiles:user_id (username, full_name, avatar_url)
          `)
          .ilike('content', `%${searchQuery}%`)
          .limit(10)

        results = (data || []).map(post => ({
          id: post.id,
          title: post.profiles?.full_name || post.profiles?.username,
          description: post.content?.substring(0, 100) + '...',
          image_url: post.image_url || post.profiles?.avatar_url,
          type: 'post'
        }))
      } else {
        const { data } = await supabase
          .from('movies')
          .select('id, title, overview, poster_path, release_date, vote_average')
          .or(`title.ilike.%${searchQuery}%,original_title.ilike.%${searchQuery}%`)
          .limit(10)

        results = (data || []).map(movie => ({
          id: movie.id,
          title: movie.title,
          description: movie.overview?.substring(0, 100) + '...',
          image_url: movie.poster_path ? `https://image.tmdb.org/t/p/w200${movie.poster_path}` : null,
          extra: `${movie.release_date?.split('-')[0] || 'N/A'} • ${movie.vote_average?.toFixed(1) || 'N/A'}`,
          type: 'movie'
        }))
      }

      setSearchResults(results)
    } catch (error) {
      console.error('Error searching:', error)
    } finally {
      setSearching(false)
    }
  }

  const handleAddFeatured = (item) => {
    // Verificar si ya está en destacados
    const alreadyFeatured = featuredContent?.some(
      f => f.content_type === item.type && f.content_id === item.id
    )

    if (alreadyFeatured) {
      alert('Este contenido ya está en destacados')
      return
    }

    addFeaturedMutation.mutate({
      contentType: item.type,
      contentId: item.id,
      contentData: {
        title: item.title,
        description: item.description,
        image_url: item.image_url
      }
    })
  }

  const featuredPosts = featuredContent?.filter(f => f.content_type === 'post') || []
  const featuredMovies = featuredContent?.filter(f => f.content_type === 'movie') || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Contenido Destacado</h1>
          <p className="text-gray-500 dark:text-gray-400">Gestiona el contenido que aparece en secciones destacadas</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Agregar Destacado</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/20">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{featuredPosts.length}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Posts Destacados</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/20">
              <Film className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{featuredMovies.length}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Películas Destacadas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'posts'
                ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50 dark:bg-primary-900/10'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <FileText className="h-4 w-4 inline mr-2" />
            Posts Destacados ({featuredPosts.length})
          </button>
          <button
            onClick={() => setActiveTab('movies')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'movies'
                ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50 dark:bg-primary-900/10'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Film className="h-4 w-4 inline mr-2" />
            Películas Destacadas ({featuredMovies.length})
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
          ) : (
            <div className="space-y-3">
              {(activeTab === 'posts' ? featuredPosts : featuredMovies).length === 0 ? (
                <div className="text-center py-12">
                  <Star className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No hay {activeTab === 'posts' ? 'posts' : 'películas'} destacados
                  </p>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="mt-4 text-primary-600 hover:underline"
                  >
                    Agregar el primero
                  </button>
                </div>
              ) : (
                (activeTab === 'posts' ? featuredPosts : featuredMovies).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg group"
                  >
                    <GripVertical className="h-5 w-5 text-gray-400 cursor-move" />

                    {/* Image */}
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                        <ImageIcon className="h-6 w-6 text-gray-400" />
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 dark:text-white truncate">
                        {item.title}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                        {item.description}
                      </p>
                      <div className="flex items-center space-x-3 mt-1 text-xs text-gray-400">
                        <span className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(item.created_at).toLocaleDateString('es-ES')}
                        </span>
                        {item.profiles?.username && (
                          <span className="flex items-center">
                            <User className="h-3 w-3 mr-1" />
                            {item.profiles.username}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <button
                      onClick={() => removeFeaturedMutation.mutate(item.id)}
                      disabled={removeFeaturedMutation.isPending}
                      className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Agregar a Destacados
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setSearchResults([])
                  setSearchQuery('')
                }}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 space-y-4">
              {/* Type selector */}
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setActiveTab('posts')
                    setSearchResults([])
                  }}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'posts'
                      ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  <FileText className="h-4 w-4 inline mr-1" />
                  Posts
                </button>
                <button
                  onClick={() => {
                    setActiveTab('movies')
                    setSearchResults([])
                  }}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'movies'
                      ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  <Film className="h-4 w-4 inline mr-1" />
                  Películas
                </button>
              </div>

              {/* Search */}
              <div className="flex space-x-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder={`Buscar ${activeTab === 'posts' ? 'posts' : 'películas'}...`}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  disabled={searching || !searchQuery.trim()}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {searching ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Buscar'}
                </button>
              </div>

              {/* Results */}
              <div className="max-h-64 overflow-y-auto space-y-2">
                {searchResults.length === 0 ? (
                  <p className="text-center py-8 text-gray-500 dark:text-gray-400">
                    {searching ? 'Buscando...' : 'Busca contenido para agregar a destacados'}
                  </p>
                ) : (
                  searchResults.map((item) => {
                    const alreadyFeatured = featuredContent?.some(
                      f => f.content_type === item.type && f.content_id === item.id
                    )

                    return (
                      <div
                        key={`${item.type}-${item.id}`}
                        className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                      >
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.title}
                            className="w-12 h-12 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                            <ImageIcon className="h-5 w-5 text-gray-400" />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                            {item.title}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                            {item.description}
                          </p>
                          {item.extra && (
                            <p className="text-xs text-gray-400 mt-0.5">{item.extra}</p>
                          )}
                        </div>

                        <button
                          onClick={() => handleAddFeatured(item)}
                          disabled={alreadyFeatured || addFeaturedMutation.isPending}
                          className={`p-2 rounded-lg transition-colors ${
                            alreadyFeatured
                              ? 'bg-green-100 text-green-600 cursor-not-allowed'
                              : 'bg-primary-100 text-primary-600 hover:bg-primary-200 dark:bg-primary-900/30'
                          }`}
                        >
                          {alreadyFeatured ? (
                            <CheckCircle className="h-5 w-5" />
                          ) : (
                            <Plus className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminFeatured
