import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Search,
  Trash2,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MoreVertical,
  FileText,
  Film,
  MessageSquare
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import ConfirmDialog from '../../components/common/ConfirmDialog'

const REPORT_REASONS = {
  spam: 'Spam',
  harassment: 'Acoso',
  hate_speech: 'Discurso de odio',
  violence: 'Violencia',
  nudity: 'Contenido sexual',
  misinformation: 'Desinformación',
  copyright: 'Derechos de autor',
  other: 'Otro',
}

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  reviewed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  resolved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  dismissed: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
}

function AdminReports() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [showMenu, setShowMenu] = useState(null)
  const [previewContent, setPreviewContent] = useState(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [reportToDelete, setReportToDelete] = useState(null)
  const queryClient = useQueryClient()

  // Fetch reports desde content_reports
  const { data: reports, isLoading, error } = useQuery({
    queryKey: ['admin-reports', searchQuery, filterStatus, filterType],
    queryFn: async () => {
      let query = supabase
        .from('content_reports')
        .select('*')
        .order('created_at', { ascending: false })

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus)
      }
      if (filterType !== 'all') {
        query = query.eq('content_type', filterType)
      }

      const { data: reportsData, error } = await query.limit(100)
      if (error) throw error
      if (!reportsData || reportsData.length === 0) return []

      // Get reporter profiles
      const reporterIds = [...new Set(reportsData.map(r => r.reporter_id))]
      const { data: reporters } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', reporterIds)

      const reportersMap = new Map(reporters?.map(p => [p.id, p]) || [])

      // Get reported content details
      const postIds = reportsData.filter(r => r.content_type === 'post').map(r => r.content_id)
      const movieIds = reportsData.filter(r => r.content_type === 'movie').map(r => r.content_id)
      const commentIds = reportsData.filter(r => r.content_type === 'comment').map(r => r.content_id)
      const messageIds = reportsData.filter(r => r.content_type === 'message').map(r => r.content_id)

      const [postsResult, moviesResult, commentsResult, messagesResult] = await Promise.all([
        postIds.length > 0 ? supabase.from('posts').select('id, content, media_url, media_type, user_id').in('id', postIds) : { data: [] },
        movieIds.length > 0 ? supabase.from('movies').select('id, title, thumbnail_url, user_id').in('id', movieIds) : { data: [] },
        commentIds.length > 0 ? supabase.from('comments').select('id, content, user_id, post_id').in('id', commentIds) : { data: [] },
        messageIds.length > 0 ? supabase.from('messages').select('id, content, sender_id, receiver_id').in('id', messageIds) : { data: [] },
      ])

      const postsMap = new Map(postsResult.data?.map(p => [p.id, p]) || [])
      const moviesMap = new Map(moviesResult.data?.map(m => [m.id, m]) || [])
      const commentsMap = new Map(commentsResult.data?.map(c => [c.id, c]) || [])
      const messagesMap = new Map(messagesResult.data?.map(m => [m.id, m]) || [])

      return reportsData.map(report => ({
        ...report,
        reporter: reportersMap.get(report.reporter_id),
        content:
          report.content_type === 'post' ? postsMap.get(report.content_id) :
          report.content_type === 'movie' ? moviesMap.get(report.content_id) :
          report.content_type === 'comment' ? commentsMap.get(report.content_id) :
          report.content_type === 'message' ? messagesMap.get(report.content_id) : null,
      }))
    },
    staleTime: 30 * 1000,
  })

  // Update report status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ reportId, status, actionTaken = null }) => {
      const updateData = {
        status,
        reviewed_at: new Date().toISOString()
      }
      if (actionTaken) {
        updateData.action_taken = actionTaken
      }

      const { error } = await supabase
        .from('content_reports')
        .update(updateData)
        .eq('id', reportId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] })
      setShowMenu(null)
    },
  })

  // Delete reported content
  const deleteContentMutation = useMutation({
    mutationFn: async ({ report }) => {
      const { content_type, content_id } = report
      console.log('Deleting content:', { content_type, content_id })

      let deleteResult

      if (content_type === 'post') {
        // Delete related data first
        await supabase.from('comments').delete().eq('post_id', content_id)
        await supabase.from('likes').delete().eq('post_id', content_id)
        await supabase.from('post_reactions').delete().eq('post_id', content_id)
        await supabase.from('saved_posts').delete().eq('post_id', content_id)
        // Delete the post
        deleteResult = await supabase.from('posts').delete().eq('id', content_id)
      } else if (content_type === 'movie') {
        deleteResult = await supabase.from('movies').delete().eq('id', content_id)
      } else if (content_type === 'comment') {
        deleteResult = await supabase.from('comments').delete().eq('id', content_id)
      } else if (content_type === 'message') {
        deleteResult = await supabase.from('messages').delete().eq('id', content_id)
      }

      if (deleteResult?.error) {
        console.error('Error deleting content:', deleteResult.error)
        throw deleteResult.error
      }

      console.log('Content deleted, updating report status...')

      // Mark report as resolved with action taken
      const { error: updateError } = await supabase
        .from('content_reports')
        .update({
          status: 'resolved',
          reviewed_at: new Date().toISOString(),
          action_taken: 'content_deleted'
        })
        .eq('id', report.id)

      if (updateError) {
        console.error('Error updating report:', updateError)
        throw updateError
      }

      console.log('Report updated successfully')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] })
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] })
      queryClient.invalidateQueries({ queryKey: ['admin-movies'] })
      queryClient.invalidateQueries({ queryKey: ['messages'] })
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      setShowMenu(null)
      setPreviewContent(null)
      setDeleteDialogOpen(false)
      setReportToDelete(null)
    },
    onError: (error) => {
      console.error('Delete content mutation error:', error)
      alert('Error al eliminar el contenido: ' + error.message)
    }
  })

  const handleDeleteContent = (report) => {
    setReportToDelete(report)
    setDeleteDialogOpen(true)
    setShowMenu(null)
  }

  const confirmDeleteContent = () => {
    if (reportToDelete) {
      deleteContentMutation.mutate({ report: reportToDelete })
    }
  }

  const getDeleteDialogMessage = () => {
    if (!reportToDelete) return ''
    const typeLabel = reportToDelete.content_type === 'post' ? 'este post' :
                      reportToDelete.content_type === 'movie' ? 'esta película' :
                      reportToDelete.content_type === 'comment' ? 'este comentario' :
                      reportToDelete.content_type === 'message' ? 'este mensaje' : 'este contenido'
    return `¿Estás seguro de eliminar ${typeLabel}? Esta acción no se puede deshacer y el contenido será removido permanentemente.`
  }

  const getContentIcon = (type) => {
    switch (type) {
      case 'post': return <FileText className="h-4 w-4" />
      case 'movie': return <Film className="h-4 w-4" />
      case 'comment': return <MessageSquare className="h-4 w-4" />
      case 'message': return <MessageSquare className="h-4 w-4" />
      default: return <AlertTriangle className="h-4 w-4" />
    }
  }

  const getContentPreview = (report) => {
    if (!report.content) return '(Contenido eliminado)'

    switch (report.content_type) {
      case 'post':
        return report.content.content?.substring(0, 100) || '(Sin texto)'
      case 'movie':
        return report.content.title
      case 'comment':
        return report.content.content?.substring(0, 100)
      case 'message':
        return report.content.content?.substring(0, 100) || '(Mensaje sin texto)'
      default:
        return 'N/A'
    }
  }

  const filteredReports = reports?.filter(report => {
    if (!searchQuery) return true
    const preview = getContentPreview(report).toLowerCase()
    const reason = REPORT_REASONS[report.reason]?.toLowerCase() || ''
    return preview.includes(searchQuery.toLowerCase()) || reason.includes(searchQuery.toLowerCase())
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reportes</h1>
          <p className="text-gray-500 dark:text-gray-400">Gestiona el contenido reportado por usuarios</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Filter by status */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
          >
            <option value="all">Todos los estados</option>
            <option value="pending">Pendientes</option>
            <option value="reviewed">Revisados</option>
            <option value="resolved">Resueltos</option>
            <option value="dismissed">Descartados</option>
          </select>

          {/* Filter by type */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
          >
            <option value="all">Todos los tipos</option>
            <option value="post">Posts</option>
            <option value="movie">Películas</option>
            <option value="comment">Comentarios</option>
            <option value="message">Mensajes</option>
          </select>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 w-48 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
          <div className="text-yellow-600 dark:text-yellow-400 text-2xl font-bold">
            {reports?.filter(r => r.status === 'pending').length || 0}
          </div>
          <div className="text-yellow-700 dark:text-yellow-300 text-sm">Pendientes</div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <div className="text-blue-600 dark:text-blue-400 text-2xl font-bold">
            {reports?.filter(r => r.status === 'reviewed').length || 0}
          </div>
          <div className="text-blue-700 dark:text-blue-300 text-sm">En revisión</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <div className="text-green-600 dark:text-green-400 text-2xl font-bold">
            {reports?.filter(r => r.status === 'resolved').length || 0}
          </div>
          <div className="text-green-700 dark:text-green-300 text-sm">Resueltos</div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="text-gray-600 dark:text-gray-400 text-2xl font-bold">
            {reports?.filter(r => r.status === 'dismissed').length || 0}
          </div>
          <div className="text-gray-700 dark:text-gray-300 text-sm">Descartados</div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-gray-500 dark:text-gray-400">Cargando reportes...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">
            Error al cargar reportes: {error.message}
          </div>
        ) : filteredReports?.length === 0 ? (
          <div className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500 dark:text-gray-400">No hay reportes</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Contenido
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Razón
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Reportado por
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Estado
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
                {filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        {getContentIcon(report.content_type)}
                        <span className="capitalize text-sm">{report.content_type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs">
                        <p className="text-sm text-gray-900 dark:text-white line-clamp-2">
                          {getContentPreview(report)}
                        </p>
                        {report.content && (
                          <button
                            onClick={() => setPreviewContent(report)}
                            className="text-xs text-primary-600 hover:underline mt-1 flex items-center gap-1"
                          >
                            <Eye className="h-3 w-3" />
                            Ver contenido
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {REPORT_REASONS[report.reason] || report.reason}
                      </span>
                      {report.description && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-32 truncate">
                          {report.description}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                          {report.reporter?.avatar_url ? (
                            <img src={report.reporter.avatar_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-gray-500 text-xs">?</div>
                          )}
                        </div>
                        <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                          @{report.reporter?.username || 'usuario'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[report.status]}`}>
                        {report.status === 'pending' && 'Pendiente'}
                        {report.status === 'reviewed' && 'En revisión'}
                        {report.status === 'resolved' && 'Resuelto'}
                        {report.status === 'dismissed' && 'Descartado'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(report.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="relative">
                        <button
                          onClick={() => setShowMenu(showMenu === report.id ? null : report.id)}
                          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        >
                          <MoreVertical className="h-5 w-5" />
                        </button>

                        {showMenu === report.id && (
                          <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-10">
                            <div className="py-1">
                              {report.status === 'pending' && (
                                <button
                                  onClick={() => updateStatusMutation.mutate({ reportId: report.id, status: 'reviewed' })}
                                  className="flex items-center w-full px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  Marcar en revisión
                                </button>
                              )}
                              <button
                                onClick={() => updateStatusMutation.mutate({ reportId: report.id, status: 'dismissed' })}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Descartar reporte
                              </button>
                              {report.content && (
                                <button
                                  onClick={() => handleDeleteContent(report)}
                                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Eliminar contenido
                                </button>
                              )}
                              <button
                                onClick={() => updateStatusMutation.mutate({ reportId: report.id, status: 'resolved' })}
                                className="flex items-center w-full px-4 py-2 text-sm text-green-600 dark:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Marcar como resuelto
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

      {/* Content Preview Modal */}
      {previewContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Vista previa del contenido reportado
                </h3>
                <button
                  onClick={() => setPreviewContent(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  {getContentIcon(previewContent.content_type)}
                  <span className="capitalize">{previewContent.content_type}</span>
                  <span className="mx-2">•</span>
                  <span>Razón: {REPORT_REASONS[previewContent.reason]}</span>
                </div>

                {previewContent.content_type === 'post' && previewContent.content && (
                  <div className="space-y-3">
                    <p className="text-gray-900 dark:text-white">
                      {previewContent.content.content}
                    </p>
                    {previewContent.content.media_url && (
                      <div className="rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                        {previewContent.content.media_type === 'video' ? (
                          <video src={previewContent.content.media_url} controls className="max-h-64 mx-auto" />
                        ) : (
                          <img src={previewContent.content.media_url} alt="" className="max-h-64 mx-auto object-contain" />
                        )}
                      </div>
                    )}
                  </div>
                )}

                {previewContent.content_type === 'movie' && previewContent.content && (
                  <div className="space-y-3">
                    <h4 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {previewContent.content.title}
                    </h4>
                    {previewContent.content.thumbnail_url && (
                      <img
                        src={previewContent.content.thumbnail_url}
                        alt={previewContent.content.title}
                        className="rounded-lg max-h-64 object-contain"
                      />
                    )}
                  </div>
                )}

                {previewContent.content_type === 'comment' && previewContent.content && (
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                    <p className="text-gray-900 dark:text-white">
                      {previewContent.content.content}
                    </p>
                  </div>
                )}

                {previewContent.content_type === 'message' && previewContent.content && (
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Mensaje privado</p>
                    <p className="text-gray-900 dark:text-white">
                      {previewContent.content.content}
                    </p>
                  </div>
                )}

                {previewContent.description && (
                  <div className="border-t dark:border-gray-700 pt-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      <strong>Comentario del reportante:</strong> {previewContent.description}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t dark:border-gray-700">
                <button
                  onClick={() => {
                    updateStatusMutation.mutate({ reportId: previewContent.id, status: 'dismissed' })
                    setPreviewContent(null)
                  }}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  Descartar
                </button>
                {previewContent.content && (
                  <button
                    onClick={() => handleDeleteContent(previewContent)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Eliminar contenido
                  </button>
                )}
              </div>
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

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false)
          setReportToDelete(null)
        }}
        onConfirm={confirmDeleteContent}
        title="Eliminar contenido"
        message={getDeleteDialogMessage()}
        confirmText={deleteContentMutation.isPending ? 'Eliminando...' : 'Eliminar'}
        cancelText="Cancelar"
        type="danger"
      />
    </div>
  )
}

export default AdminReports
