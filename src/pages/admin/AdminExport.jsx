import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Download,
  FileSpreadsheet,
  Users,
  FileText,
  AlertTriangle,
  Film,
  MessageSquare,
  Calendar,
  CheckCircle,
  Loader2
} from 'lucide-react'
import { supabase } from '../../lib/supabase'

const exportTypes = [
  {
    id: 'users',
    label: 'Usuarios',
    description: 'Exportar lista de usuarios registrados',
    icon: Users,
    color: 'blue'
  },
  {
    id: 'posts',
    label: 'Posts',
    description: 'Exportar publicaciones con métricas',
    icon: FileText,
    color: 'green'
  },
  {
    id: 'reports',
    label: 'Reportes',
    description: 'Exportar reportes de contenido',
    icon: AlertTriangle,
    color: 'red'
  },
  {
    id: 'movies',
    label: 'Películas',
    description: 'Exportar catálogo de películas',
    icon: Film,
    color: 'purple'
  },
  {
    id: 'comments',
    label: 'Comentarios',
    description: 'Exportar comentarios de posts',
    icon: MessageSquare,
    color: 'yellow'
  }
]

function AdminExport() {
  const [selectedType, setSelectedType] = useState('users')
  const [dateRange, setDateRange] = useState('all')
  const [exporting, setExporting] = useState(false)
  const [exportSuccess, setExportSuccess] = useState(false)

  // Obtener conteos para mostrar info
  const { data: counts } = useQuery({
    queryKey: ['export-counts'],
    queryFn: async () => {
      const [users, posts, reports, movies, comments] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('posts').select('*', { count: 'exact', head: true }),
        supabase.from('reports').select('*', { count: 'exact', head: true }),
        supabase.from('movies').select('*', { count: 'exact', head: true }),
        supabase.from('comments').select('*', { count: 'exact', head: true }),
      ])

      return {
        users: users.count || 0,
        posts: posts.count || 0,
        reports: reports.count || 0,
        movies: movies.count || 0,
        comments: comments.count || 0,
      }
    },
    staleTime: 60 * 1000,
  })

  const getDateFilter = () => {
    const now = new Date()
    switch (dateRange) {
      case 'week':
        return new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString()
      case 'month':
        return new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString()
      case 'year':
        return new Date(now - 365 * 24 * 60 * 60 * 1000).toISOString()
      default:
        return null
    }
  }

  const fetchData = async (type) => {
    const dateFilter = getDateFilter()
    let query

    switch (type) {
      case 'users':
        query = supabase
          .from('profiles')
          .select('id, username, full_name, role, verified, is_suspended, created_at, bio, website')
          .order('created_at', { ascending: false })
        if (dateFilter) query = query.gte('created_at', dateFilter)
        break

      case 'posts':
        query = supabase
          .from('posts')
          .select(`
            id,
            content,
            created_at,
            likes_count,
            comments_count,
            user_id,
            profiles!posts_user_id_fkey (username, full_name)
          `)
          .order('created_at', { ascending: false })
        if (dateFilter) query = query.gte('created_at', dateFilter)
        break

      case 'reports':
        query = supabase
          .from('reports')
          .select(`
            id,
            content_type,
            content_id,
            reason,
            description,
            status,
            created_at,
            reporter_id
          `)
          .order('created_at', { ascending: false })
        if (dateFilter) query = query.gte('created_at', dateFilter)
        break

      case 'movies':
        query = supabase
          .from('movies')
          .select('id, title, description, genre, year, views, average_rating, ratings_count, created_at, thumbnail_url')
          .order('views', { ascending: false })
        break

      case 'comments':
        query = supabase
          .from('comments')
          .select(`
            id,
            content,
            created_at,
            post_id,
            user_id,
            profiles!comments_user_id_fkey (username)
          `)
          .order('created_at', { ascending: false })
          .limit(5000) // Limitar para evitar timeouts
        if (dateFilter) query = query.gte('created_at', dateFilter)
        break

      default:
        return []
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  }

  const convertToCSV = (data, type) => {
    if (!data || data.length === 0) return ''

    let headers = []
    let rows = []

    switch (type) {
      case 'users':
        headers = ['ID', 'Username', 'Nombre', 'Rol', 'Verificado', 'Suspendido', 'Fecha Registro', 'Bio', 'Website']
        rows = data.map(u => [
          u.id,
          u.username,
          u.full_name || '',
          u.role,
          u.verified ? 'Sí' : 'No',
          u.is_suspended ? 'Sí' : 'No',
          new Date(u.created_at).toLocaleDateString('es-ES'),
          (u.bio || '').replace(/[\n\r,]/g, ' '),
          u.website || ''
        ])
        break

      case 'posts':
        headers = ['ID', 'Autor', 'Username', 'Contenido', 'Likes', 'Comentarios', 'Fecha']
        rows = data.map(p => [
          p.id,
          p.profiles?.full_name || '',
          p.profiles?.username || '',
          (p.content || '').replace(/[\n\r,]/g, ' ').substring(0, 200),
          p.likes_count || 0,
          p.comments_count || 0,
          new Date(p.created_at).toLocaleDateString('es-ES')
        ])
        break

      case 'reports':
        headers = ['ID', 'Tipo', 'Contenido ID', 'Razón', 'Descripción', 'Estado', 'Reporter ID', 'Fecha']
        rows = data.map(r => [
          r.id,
          r.content_type,
          r.content_id,
          r.reason,
          (r.description || '').replace(/[\n\r,]/g, ' '),
          r.status,
          r.reporter_id || '',
          new Date(r.created_at).toLocaleDateString('es-ES')
        ])
        break

      case 'movies':
        headers = ['ID', 'Título', 'Descripción', 'Género', 'Año', 'Vistas', 'Rating', 'Votos', 'Fecha Subida']
        rows = data.map(m => [
          m.id,
          m.title,
          (m.description || '').replace(/[\n\r,]/g, ' ').substring(0, 200),
          m.genre || '',
          m.year || '',
          m.views || 0,
          m.average_rating || 0,
          m.ratings_count || 0,
          new Date(m.created_at).toLocaleDateString('es-ES')
        ])
        break

      case 'comments':
        headers = ['ID', 'Post ID', 'Usuario', 'Contenido', 'Fecha']
        rows = data.map(c => [
          c.id,
          c.post_id,
          c.profiles?.username || '',
          (c.content || '').replace(/[\n\r,]/g, ' ').substring(0, 200),
          new Date(c.created_at).toLocaleDateString('es-ES')
        ])
        break
    }

    // Escapar campos y construir CSV
    const escapeField = (field) => {
      const str = String(field)
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    }

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(escapeField).join(','))
    ].join('\n')

    return csvContent
  }

  const downloadCSV = (csvContent, filename) => {
    const BOM = '\uFEFF' // Para que Excel reconozca UTF-8
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleExport = async () => {
    setExporting(true)
    setExportSuccess(false)

    try {
      const data = await fetchData(selectedType)
      const csv = convertToCSV(data, selectedType)

      const dateStr = new Date().toISOString().split('T')[0]
      const filename = `sevenart_${selectedType}_${dateStr}.csv`

      downloadCSV(csv, filename)
      setExportSuccess(true)

      setTimeout(() => setExportSuccess(false), 3000)
    } catch (error) {
      console.error('Error exporting:', error)
      alert('Error al exportar los datos')
    } finally {
      setExporting(false)
    }
  }

  const selectedTypeInfo = exportTypes.find(t => t.id === selectedType)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Exportar Datos</h1>
        <p className="text-gray-500 dark:text-gray-400">Exporta datos del sistema en formato CSV</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Selector de tipo */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Seleccionar datos a exportar</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {exportTypes.map((type) => {
              const Icon = type.icon
              const isSelected = selectedType === type.id
              const count = counts?.[type.id] || 0

              return (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    isSelected
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className={`p-2 rounded-lg ${
                      isSelected
                        ? 'bg-primary-100 dark:bg-primary-800'
                        : 'bg-gray-100 dark:bg-gray-700'
                    }`}>
                      <Icon className={`h-5 w-5 ${
                        isSelected ? 'text-primary-600' : 'text-gray-500'
                      }`} />
                    </div>
                    <span className={`text-sm font-medium ${
                      isSelected ? 'text-primary-600' : 'text-gray-500'
                    }`}>
                      {count.toLocaleString()} registros
                    </span>
                  </div>
                  <h3 className={`mt-3 font-semibold ${
                    isSelected ? 'text-primary-700 dark:text-primary-300' : 'text-gray-900 dark:text-white'
                  }`}>
                    {type.label}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {type.description}
                  </p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Panel de exportación */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 space-y-6 h-fit">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/20">
              <FileSpreadsheet className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Exportar CSV</h3>
              <p className="text-sm text-gray-500">{selectedTypeInfo?.label}</p>
            </div>
          </div>

          {/* Filtro de fecha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Calendar className="h-4 w-4 inline mr-1" />
              Rango de fechas
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">Todos los registros</option>
              <option value="week">Última semana</option>
              <option value="month">Último mes</option>
              <option value="year">Último año</option>
            </select>
          </div>

          {/* Info del archivo */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              <strong>Formato:</strong> CSV (compatible con Excel)
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              <strong>Registros estimados:</strong> {counts?.[selectedType]?.toLocaleString() || 0}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              El archivo se descargará automáticamente
            </p>
          </div>

          {/* Botón de exportar */}
          <button
            onClick={handleExport}
            disabled={exporting}
            className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-colors ${
              exportSuccess
                ? 'bg-green-600 text-white'
                : 'bg-primary-600 text-white hover:bg-primary-700'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {exporting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Exportando...</span>
              </>
            ) : exportSuccess ? (
              <>
                <CheckCircle className="h-5 w-5" />
                <span>¡Descargado!</span>
              </>
            ) : (
              <>
                <Download className="h-5 w-5" />
                <span>Descargar CSV</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Info adicional */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6">
        <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">
          Información sobre exportaciones
        </h3>
        <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
          <li>• Los archivos CSV son compatibles con Excel, Google Sheets y otros programas</li>
          <li>• Los datos sensibles como contraseñas nunca se exportan</li>
          <li>• Las exportaciones grandes pueden tomar unos segundos</li>
          <li>• El límite de comentarios es de 5,000 registros por exportación</li>
        </ul>
      </div>
    </div>
  )
}

export default AdminExport
