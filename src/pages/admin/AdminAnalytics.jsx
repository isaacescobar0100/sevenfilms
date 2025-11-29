import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import {
  TrendingUp,
  Users,
  FileText,
  MessageSquare,
  Heart,
  Eye,
  Calendar,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react'
import { supabase } from '../../lib/supabase'

// Componente para mostrar una métrica con tendencia
function MetricCard({ title, value, previousValue, icon: Icon, color, suffix = '' }) {
  const change = previousValue > 0 ? ((value - previousValue) / previousValue) * 100 : 0
  const isPositive = change > 0
  const isNeutral = change === 0

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        {!isNeutral && (
          <div className={`flex items-center text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
            {isPositive ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
            <span>{Math.abs(change).toFixed(1)}%</span>
          </div>
        )}
        {isNeutral && previousValue > 0 && (
          <div className="flex items-center text-sm text-gray-400">
            <Minus className="h-4 w-4" />
            <span>0%</span>
          </div>
        )}
      </div>
      <p className="text-3xl font-bold text-gray-900 dark:text-white">
        {value?.toLocaleString() || 0}{suffix}
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{title}</p>
    </div>
  )
}

// Componente para gráfico de barras simple
function SimpleBarChart({ data, title }) {
  const maxValue = Math.max(...data.map(d => d.value), 1)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={index}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600 dark:text-gray-400">{item.label}</span>
              <span className="font-medium text-gray-900 dark:text-white">{item.value}</span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-600 rounded-full transition-all duration-500"
                style={{ width: `${(item.value / maxValue) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Componente para lista de top items
function TopList({ title, items, icon: Icon, emptyMessage }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
      {items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-400 w-6">#{index + 1}</span>
                {item.avatar ? (
                  <img src={item.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <Icon className="h-4 w-4 text-gray-400" />
                  </div>
                )}
                <span className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[150px]">
                  {item.name}
                </span>
              </div>
              <span className="text-sm font-semibold text-primary-600">{item.value}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 dark:text-gray-400 text-center py-4">{emptyMessage}</p>
      )}
    </div>
  )
}

function AdminAnalytics() {
  const [period, setPeriod] = useState('week') // week, month, year

  // Obtener estadísticas actuales
  const { data: currentStats, isLoading: loadingCurrent } = useQuery({
    queryKey: ['admin-analytics-current'],
    queryFn: async () => {
      const now = new Date()
      const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000)
      const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000)

      // Estadísticas generales
      const [users, posts, comments, likes, movies] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('posts').select('*', { count: 'exact', head: true }),
        supabase.from('comments').select('*', { count: 'exact', head: true }),
        supabase.from('likes').select('*', { count: 'exact', head: true }),
        supabase.from('movies').select('views'),
      ])

      // Nuevos usuarios última semana
      const { count: newUsersWeek } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', weekAgo.toISOString())

      // Nuevos posts última semana
      const { count: newPostsWeek } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', weekAgo.toISOString())

      // Usuarios mes anterior (para comparar)
      const { count: usersLastMonth } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .lt('created_at', weekAgo.toISOString())
        .gte('created_at', monthAgo.toISOString())

      const totalViews = movies.data?.reduce((acc, m) => acc + (m.views || 0), 0) || 0

      return {
        totalUsers: users.count || 0,
        totalPosts: posts.count || 0,
        totalComments: comments.count || 0,
        totalLikes: likes.count || 0,
        totalViews,
        newUsersWeek: newUsersWeek || 0,
        newPostsWeek: newPostsWeek || 0,
        usersLastMonth: usersLastMonth || 0,
      }
    },
    staleTime: 5 * 60 * 1000,
  })

  // Obtener actividad por día de la semana
  const { data: activityByDay } = useQuery({
    queryKey: ['admin-analytics-activity'],
    queryFn: async () => {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

      const { data: posts } = await supabase
        .from('posts')
        .select('created_at')
        .gte('created_at', weekAgo.toISOString())

      const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
      const counts = new Array(7).fill(0)

      posts?.forEach(post => {
        const day = new Date(post.created_at).getDay()
        counts[day]++
      })

      return days.map((label, i) => ({ label, value: counts[i] }))
    },
    staleTime: 5 * 60 * 1000,
  })

  // Top usuarios por posts
  const { data: topUsersByPosts } = useQuery({
    queryKey: ['admin-analytics-top-users'],
    queryFn: async () => {
      const { data: posts } = await supabase
        .from('posts')
        .select('user_id')

      const userCounts = {}
      posts?.forEach(p => {
        userCounts[p.user_id] = (userCounts[p.user_id] || 0) + 1
      })

      const topUserIds = Object.entries(userCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([id]) => id)

      if (topUserIds.length === 0) return []

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .in('id', topUserIds)

      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || [])

      return Object.entries(userCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([id, count]) => {
          const profile = profilesMap.get(id)
          return {
            name: profile?.full_name || profile?.username || 'Usuario',
            avatar: profile?.avatar_url,
            value: count,
          }
        })
    },
    staleTime: 5 * 60 * 1000,
  })

  // Top películas por vistas
  const { data: topMovies } = useQuery({
    queryKey: ['admin-analytics-top-movies'],
    queryFn: async () => {
      const { data } = await supabase
        .from('movies')
        .select('id, title, thumbnail_url, views')
        .order('views', { ascending: false })
        .limit(5)

      return data?.map(m => ({
        name: m.title,
        avatar: m.thumbnail_url,
        value: m.views || 0,
      })) || []
    },
    staleTime: 5 * 60 * 1000,
  })

  // Distribución de contenido
  const contentDistribution = currentStats ? [
    { label: 'Posts', value: currentStats.totalPosts },
    { label: 'Comentarios', value: currentStats.totalComments },
    { label: 'Likes', value: currentStats.totalLikes },
  ] : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
          <p className="text-gray-500 dark:text-gray-400">Estadísticas detalladas de la plataforma</p>
        </div>

        {/* Period selector */}
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {[
            { value: 'week', label: 'Semana' },
            { value: 'month', label: 'Mes' },
            { value: 'year', label: 'Año' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setPeriod(option.value)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                period === option.value
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Usuarios"
          value={currentStats?.totalUsers || 0}
          previousValue={currentStats?.usersLastMonth || 0}
          icon={Users}
          color="bg-blue-500"
        />
        <MetricCard
          title="Total Posts"
          value={currentStats?.totalPosts || 0}
          previousValue={0}
          icon={FileText}
          color="bg-green-500"
        />
        <MetricCard
          title="Total Comentarios"
          value={currentStats?.totalComments || 0}
          previousValue={0}
          icon={MessageSquare}
          color="bg-orange-500"
        />
        <MetricCard
          title="Total Likes"
          value={currentStats?.totalLikes || 0}
          previousValue={0}
          icon={Heart}
          color="bg-red-500"
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-full bg-purple-500">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {currentStats?.newUsersWeek || 0}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Nuevos esta semana</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-full bg-indigo-500">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {currentStats?.newPostsWeek || 0}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Posts esta semana</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-full bg-pink-500">
              <Eye className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {currentStats?.totalViews?.toLocaleString() || 0}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Vistas películas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {activityByDay && (
          <SimpleBarChart
            data={activityByDay}
            title="Actividad por Día (Última Semana)"
          />
        )}
        {contentDistribution.length > 0 && (
          <SimpleBarChart
            data={contentDistribution}
            title="Distribución de Contenido"
          />
        )}
      </div>

      {/* Top Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopList
          title="Top Usuarios (por posts)"
          items={topUsersByPosts || []}
          icon={Users}
          emptyMessage="No hay datos disponibles"
        />
        <TopList
          title="Top Películas (por vistas)"
          items={topMovies || []}
          icon={Eye}
          emptyMessage="No hay películas con vistas"
        />
      </div>

      {/* Engagement Stats */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Métricas de Engagement
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-2xl font-bold text-primary-600">
              {currentStats?.totalPosts > 0
                ? (currentStats.totalComments / currentStats.totalPosts).toFixed(1)
                : 0}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Comentarios/Post</p>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-2xl font-bold text-primary-600">
              {currentStats?.totalPosts > 0
                ? (currentStats.totalLikes / currentStats.totalPosts).toFixed(1)
                : 0}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Likes/Post</p>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-2xl font-bold text-primary-600">
              {currentStats?.totalUsers > 0
                ? (currentStats.totalPosts / currentStats.totalUsers).toFixed(1)
                : 0}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Posts/Usuario</p>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-2xl font-bold text-primary-600">
              {currentStats?.totalUsers > 0
                ? ((currentStats.newUsersWeek / currentStats.totalUsers) * 100).toFixed(1)
                : 0}%
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Crecimiento Semanal</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminAnalytics
