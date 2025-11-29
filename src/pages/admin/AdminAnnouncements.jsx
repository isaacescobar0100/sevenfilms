import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Megaphone,
  Plus,
  Edit,
  Trash2,
  X,
  Send,
  Eye,
  EyeOff,
  AlertCircle,
  Info,
  CheckCircle,
  Bell
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import ConfirmDialog from '../../components/common/ConfirmDialog'

const announcementTypes = [
  { value: 'info', label: 'Información', icon: Info, color: 'bg-blue-500', textColor: 'text-blue-500' },
  { value: 'success', label: 'Éxito', icon: CheckCircle, color: 'bg-green-500', textColor: 'text-green-500' },
  { value: 'warning', label: 'Advertencia', icon: AlertCircle, color: 'bg-yellow-500', textColor: 'text-yellow-500' },
  { value: 'alert', label: 'Alerta', icon: Bell, color: 'bg-red-500', textColor: 'text-red-500' },
]

function AdminAnnouncements() {
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'info',
    is_active: true,
    expires_at: '',
  })

  // Obtener anuncios
  const { data: announcements, isLoading } = useQuery({
    queryKey: ['admin-announcements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    },
  })

  // Crear anuncio
  const createMutation = useMutation({
    mutationFn: async (data) => {
      const { error } = await supabase.from('announcements').insert([{
        ...data,
        expires_at: data.expires_at || null,
      }])
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] })
      queryClient.invalidateQueries({ queryKey: ['announcements'] })
      handleCloseModal()
    },
  })

  // Actualizar anuncio
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const { error } = await supabase
        .from('announcements')
        .update({
          ...data,
          expires_at: data.expires_at || null,
        })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] })
      queryClient.invalidateQueries({ queryKey: ['announcements'] })
      handleCloseModal()
    },
  })

  // Eliminar anuncio
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('announcements').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] })
      queryClient.invalidateQueries({ queryKey: ['announcements'] })
      setDeleteConfirm(null)
    },
  })

  // Toggle activo/inactivo
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }) => {
      const { error } = await supabase
        .from('announcements')
        .update({ is_active })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] })
      queryClient.invalidateQueries({ queryKey: ['announcements'] })
    },
  })

  const handleOpenModal = (announcement = null) => {
    if (announcement) {
      setEditingAnnouncement(announcement)
      setFormData({
        title: announcement.title,
        content: announcement.content,
        type: announcement.type,
        is_active: announcement.is_active,
        expires_at: announcement.expires_at ? announcement.expires_at.split('T')[0] : '',
      })
    } else {
      setEditingAnnouncement(null)
      setFormData({
        title: '',
        content: '',
        type: 'info',
        is_active: true,
        expires_at: '',
      })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingAnnouncement(null)
    setFormData({
      title: '',
      content: '',
      type: 'info',
      is_active: true,
      expires_at: '',
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (editingAnnouncement) {
      updateMutation.mutate({ id: editingAnnouncement.id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const getTypeInfo = (type) => {
    return announcementTypes.find(t => t.value === type) || announcementTypes[0]
  }

  const isExpired = (expiresAt) => {
    if (!expiresAt) return false
    return new Date(expiresAt) < new Date()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Anuncios</h1>
          <p className="text-gray-500 dark:text-gray-400">Gestiona los anuncios globales para todos los usuarios</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Nuevo Anuncio</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-full bg-blue-500">
              <Megaphone className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {announcements?.length || 0}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total anuncios</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-full bg-green-500">
              <Eye className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {announcements?.filter(a => a.is_active && !isExpired(a.expires_at)).length || 0}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Activos</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-full bg-gray-500">
              <EyeOff className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {announcements?.filter(a => !a.is_active || isExpired(a.expires_at)).length || 0}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Inactivos/Expirados</p>
            </div>
          </div>
        </div>
      </div>

      {/* Announcements List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto" />
          </div>
        ) : announcements?.length === 0 ? (
          <div className="p-8 text-center">
            <Megaphone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No hay anuncios creados</p>
            <button
              onClick={() => handleOpenModal()}
              className="mt-4 text-primary-600 hover:text-primary-700 font-medium"
            >
              Crear el primer anuncio
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {announcements?.map((announcement) => {
              const typeInfo = getTypeInfo(announcement.type)
              const expired = isExpired(announcement.expires_at)
              const TypeIcon = typeInfo.icon

              return (
                <div
                  key={announcement.id}
                  className={`p-4 sm:p-6 ${!announcement.is_active || expired ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className={`p-2 rounded-lg ${typeInfo.color}`}>
                        <TypeIcon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {announcement.title}
                          </h3>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${typeInfo.color} text-white`}>
                            {typeInfo.label}
                          </span>
                          {!announcement.is_active && (
                            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-500 text-white">
                              Inactivo
                            </span>
                          )}
                          {expired && (
                            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-500 text-white">
                              Expirado
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                          {announcement.content}
                        </p>
                        <div className="mt-2 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                          <span>
                            Creado: {new Date(announcement.created_at).toLocaleDateString()}
                          </span>
                          {announcement.expires_at && (
                            <span>
                              Expira: {new Date(announcement.expires_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleActiveMutation.mutate({
                          id: announcement.id,
                          is_active: !announcement.is_active
                        })}
                        className={`p-2 rounded-lg transition-colors ${
                          announcement.is_active
                            ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                            : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                        title={announcement.is_active ? 'Desactivar' : 'Activar'}
                      >
                        {announcement.is_active ? (
                          <Eye className="h-5 w-5" />
                        ) : (
                          <EyeOff className="h-5 w-5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleOpenModal(announcement)}
                        className="p-2 text-gray-400 hover:text-primary-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(announcement)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingAnnouncement ? 'Editar Anuncio' : 'Nuevo Anuncio'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Título
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Título del anuncio"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Contenido
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  placeholder="Contenido del anuncio..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tipo
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {announcementTypes.map((type) => {
                    const TypeIcon = type.icon
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, type: type.value })}
                        className={`flex items-center justify-center space-x-2 p-3 rounded-lg border-2 transition-colors ${
                          formData.type === type.value
                            ? `border-current ${type.textColor} bg-gray-50 dark:bg-gray-700`
                            : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                        }`}
                      >
                        <TypeIcon className="h-5 w-5" />
                        <span className="text-sm font-medium">{type.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fecha de expiración (opcional)
                </label>
                <input
                  type="date"
                  value={formData.expires_at}
                  onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Anuncio activo (visible para todos los usuarios)
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                >
                  <Send className="h-4 w-4" />
                  <span>{editingAnnouncement ? 'Actualizar' : 'Publicar'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteMutation.mutate(deleteConfirm?.id)}
        title="Eliminar anuncio"
        message={`¿Estás seguro de que deseas eliminar el anuncio "${deleteConfirm?.title}"?`}
        confirmText="Eliminar"
        type="danger"
      />
    </div>
  )
}

export default AdminAnnouncements
