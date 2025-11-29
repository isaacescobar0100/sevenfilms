import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Trash2, Eye, FileText, Image, Film, MoreVertical } from 'lucide-react'
import { supabase } from '../../lib/supabase'

function AdminPosts() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showMenu, setShowMenu] = useState(null)
  const queryClient = useQueryClient()

  // Fetch posts with user info
  const { data: posts, isLoading, error } = useQuery({
    queryKey: ['admin-posts', searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })

      if (searchQuery) {
        query = query.ilike('content', `%${searchQuery}%`)
      }

      const { data: postsData, error } = await query.limit(50)
      if (error) throw error

      // Get profiles and counts
      const userIds = [...new Set(postsData.map(p => p.user_id))]
      const postIds = postsData.map(p => p.id)

      const [profilesResult, likesResult, commentsResult] = await Promise.all([
        supabase.from('profiles').select('id, username, avatar_url').in('id', userIds),
        supabase.from('likes').select('post_id').in('post_id', postIds),
        supabase.from('comments').select('post_id').in('post_id', postIds),
      ])

      const profilesMap = new Map(profilesResult.data?.map(p => [p.id, p]) || [])

      // Count likes and comments per post
      const likesCount = {}
      const commentsCount = {}
      likesResult.data?.forEach(l => {
        likesCount[l.post_id] = (likesCount[l.post_id] || 0) + 1
      })
      commentsResult.data?.forEach(c => {
        commentsCount[c.post_id] = (commentsCount[c.post_id] || 0) + 1
      })

      return postsData.map(post => ({
        ...post,
        profile: profilesMap.get(post.user_id),
        likes_count: likesCount[post.id] || 0,
        comments_count: commentsCount[post.id] || 0,
      }))
    },
    staleTime: 30 * 1000,
  })

  // Delete post mutation
  const deletePostMutation = useMutation({
    mutationFn: async (postId) => {
      // Delete related data
      await supabase.from('comments').delete().eq('post_id', postId)
      await supabase.from('likes').delete().eq('post_id', postId)

      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
      setShowMenu(null)
    },
  })

  const handleDeletePost = (post) => {
    if (window.confirm('¿Estás seguro de eliminar este post?')) {
      deletePostMutation.mutate(post.id)
    }
  }

  const getMediaIcon = (mediaType) => {
    switch (mediaType) {
      case 'image':
        return <Image className="h-4 w-4 text-blue-500" />
      case 'video':
        return <Film className="h-4 w-4 text-purple-500" />
      default:
        return <FileText className="h-4 w-4 text-gray-400" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Posts</h1>
          <p className="text-gray-500 dark:text-gray-400">Gestiona los posts de la plataforma</p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-full sm:w-64 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Posts Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-gray-500 dark:text-gray-400">Cargando posts...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">
            Error al cargar posts: {error.message}
          </div>
        ) : posts?.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500 dark:text-gray-400">No se encontraron posts</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Contenido
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Likes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Comentarios
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
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4">
                      <div className="max-w-xs">
                        <p className="text-sm text-gray-900 dark:text-white line-clamp-2">
                          {post.content || '(Sin contenido)'}
                        </p>
                        {post.media_url && (
                          <a
                            href={post.media_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary-600 hover:underline mt-1 inline-block"
                          >
                            Ver media
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                          {post.profile?.avatar_url ? (
                            <img src={post.profile.avatar_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-gray-500 text-xs">
                              ?
                            </div>
                          )}
                        </div>
                        <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                          @{post.profile?.username || 'usuario'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getMediaIcon(post.media_type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {post.likes_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {post.comments_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(post.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="relative">
                        <button
                          onClick={() => setShowMenu(showMenu === post.id ? null : post.id)}
                          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        >
                          <MoreVertical className="h-5 w-5" />
                        </button>

                        {showMenu === post.id && (
                          <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-10">
                            <div className="py-1">
                              <button
                                onClick={() => handleDeletePost(post)}
                                className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar Post
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

export default AdminPosts
