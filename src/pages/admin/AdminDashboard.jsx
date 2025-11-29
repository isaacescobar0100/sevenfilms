import { useQuery } from '@tanstack/react-query'
import { Users, FileText, Film, TrendingUp, Eye, MessageSquare } from 'lucide-react'
import { supabase } from '../../lib/supabase'

function StatCard({ title, value, icon: Icon, color, loading }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          {loading ? (
            <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-1" />
          ) : (
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {value?.toLocaleString() || 0}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  )
}

function AdminDashboard() {
  // Fetch stats
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [usersResult, postsResult, moviesResult, commentsResult] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('posts').select('*', { count: 'exact', head: true }),
        supabase.from('movies').select('*', { count: 'exact', head: true }),
        supabase.from('comments').select('*', { count: 'exact', head: true }),
      ])

      // Get total views from movies
      const { data: moviesViews } = await supabase
        .from('movies')
        .select('views')

      const totalViews = moviesViews?.reduce((acc, m) => acc + (m.views || 0), 0) || 0

      return {
        users: usersResult.count || 0,
        posts: postsResult.count || 0,
        movies: moviesResult.count || 0,
        comments: commentsResult.count || 0,
        totalViews,
      }
    },
    staleTime: 60 * 1000, // 1 minuto
  })

  // Recent activity
  const { data: recentUsers, isLoading: loadingUsers } = useQuery({
    queryKey: ['admin-recent-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, created_at')
        .order('created_at', { ascending: false })
        .limit(5)

      if (error) throw error
      return data
    },
    staleTime: 60 * 1000,
  })

  const { data: recentPosts, isLoading: loadingPosts } = useQuery({
    queryKey: ['admin-recent-posts'],
    queryFn: async () => {
      const { data: posts, error } = await supabase
        .from('posts')
        .select('id, content, created_at, user_id')
        .order('created_at', { ascending: false })
        .limit(5)

      if (error) throw error

      // Get profiles for posts
      const userIds = [...new Set(posts.map(p => p.user_id))]
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', userIds)

      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || [])

      return posts.map(post => ({
        ...post,
        username: profilesMap.get(post.user_id)?.username || 'Usuario'
      }))
    },
    staleTime: 60 * 1000,
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400">Resumen general de la plataforma</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Usuarios"
          value={stats?.users}
          icon={Users}
          color="bg-blue-500"
          loading={isLoading}
        />
        <StatCard
          title="Posts"
          value={stats?.posts}
          icon={FileText}
          color="bg-green-500"
          loading={isLoading}
        />
        <StatCard
          title="Películas"
          value={stats?.movies}
          icon={Film}
          color="bg-purple-500"
          loading={isLoading}
        />
        <StatCard
          title="Comentarios"
          value={stats?.comments}
          icon={MessageSquare}
          color="bg-orange-500"
          loading={isLoading}
        />
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          title="Total de Vistas (Películas)"
          value={stats?.totalViews}
          icon={Eye}
          color="bg-pink-500"
          loading={isLoading}
        />
        <StatCard
          title="Engagement"
          value={stats ? Math.round((stats.comments / (stats.posts || 1)) * 100) / 100 : 0}
          icon={TrendingUp}
          color="bg-indigo-500"
          loading={isLoading}
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Usuarios Recientes
          </h2>
          {loadingUsers ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
                  <div className="flex-1">
                    <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-1" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentUsers?.length > 0 ? (
            <div className="space-y-3">
              {recentUsers.map((user) => (
                <div key={user.id} className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-gray-500">
                        <Users className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {user.full_name || user.username}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      @{user.username}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(user.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              No hay usuarios recientes
            </p>
          )}
        </div>

        {/* Recent Posts */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Posts Recientes
          </h2>
          {loadingPosts ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-3 w-1/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : recentPosts?.length > 0 ? (
            <div className="space-y-3">
              {recentPosts.map((post) => (
                <div key={post.id} className="border-b border-gray-100 dark:border-gray-700 pb-3 last:border-0">
                  <p className="text-sm text-gray-900 dark:text-white line-clamp-2">
                    {post.content}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      @{post.username}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(post.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              No hay posts recientes
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
