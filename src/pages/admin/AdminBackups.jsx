import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Database,
  Download,
  Upload,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  FileJson,
  Settings,
  Megaphone,
  Star,
  Loader2,
  Calendar,
  HardDrive
} from 'lucide-react'
import { supabase } from '../../lib/supabase'

function AdminBackups() {
  const queryClient = useQueryClient()
  const [importing, setImporting] = useState(false)
  const [exportStatus, setExportStatus] = useState(null)
  const [importStatus, setImportStatus] = useState(null)

  // Obtener información del último backup
  const { data: backupInfo, isLoading } = useQuery({
    queryKey: ['backup-info'],
    queryFn: async () => {
      // Obtener conteos de tablas configurables
      const [settings, announcements, featured] = await Promise.all([
        supabase.from('site_settings').select('*').single(),
        supabase.from('announcements').select('*', { count: 'exact' }),
        supabase.from('featured_content').select('*', { count: 'exact' }),
      ])

      return {
        settings: settings.data,
        announcementsCount: announcements.count || 0,
        featuredCount: featured.count || 0,
        lastUpdated: settings.data?.updated_at || null
      }
    },
    retry: false
  })

  // Exportar configuración
  const handleExport = async () => {
    setExportStatus('exporting')

    try {
      // Obtener todos los datos configurables
      const [settings, announcements, featured] = await Promise.all([
        supabase.from('site_settings').select('*').single(),
        supabase.from('announcements').select('*'),
        supabase.from('featured_content').select('*'),
      ])

      const backupData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        data: {
          site_settings: settings.data?.settings || {},
          announcements: announcements.data || [],
          featured_content: featured.data || [],
        }
      }

      // Crear y descargar archivo JSON
      const jsonString = JSON.stringify(backupData, null, 2)
      const blob = new Blob([jsonString], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `sevenart_backup_${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      setExportStatus('success')
      setTimeout(() => setExportStatus(null), 3000)
    } catch (error) {
      console.error('Export error:', error)
      setExportStatus('error')
      setTimeout(() => setExportStatus(null), 3000)
    }
  }

  // Importar configuración
  const handleImport = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImporting(true)
    setImportStatus(null)

    try {
      const text = await file.text()
      const backupData = JSON.parse(text)

      // Validar estructura
      if (!backupData.version || !backupData.data) {
        throw new Error('Archivo de backup inválido')
      }

      // Confirmar importación
      const confirmed = window.confirm(
        `¿Estás seguro de importar este backup?\n\n` +
        `Fecha del backup: ${new Date(backupData.exportedAt).toLocaleString('es-ES')}\n` +
        `Esto sobrescribirá la configuración actual.`
      )

      if (!confirmed) {
        setImporting(false)
        return
      }

      // Importar site_settings
      if (backupData.data.site_settings) {
        await supabase
          .from('site_settings')
          .upsert({
            id: 1,
            settings: backupData.data.site_settings,
            updated_at: new Date().toISOString()
          })
      }

      // Importar announcements (merge)
      if (backupData.data.announcements?.length > 0) {
        // Eliminar anuncios existentes e insertar nuevos
        await supabase.from('announcements').delete().neq('id', '00000000-0000-0000-0000-000000000000')

        for (const announcement of backupData.data.announcements) {
          await supabase.from('announcements').insert({
            title: announcement.title,
            content: announcement.content,
            type: announcement.type,
            is_active: announcement.is_active,
            expires_at: announcement.expires_at
          })
        }
      }

      // Importar featured_content (merge)
      if (backupData.data.featured_content?.length > 0) {
        await supabase.from('featured_content').delete().neq('id', '00000000-0000-0000-0000-000000000000')

        for (const featured of backupData.data.featured_content) {
          await supabase.from('featured_content').insert({
            content_type: featured.content_type,
            content_id: featured.content_id,
            title: featured.title,
            description: featured.description,
            image_url: featured.image_url,
            position: featured.position
          })
        }
      }

      setImportStatus('success')
      queryClient.invalidateQueries({ queryKey: ['backup-info'] })
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] })
      queryClient.invalidateQueries({ queryKey: ['announcements'] })
      queryClient.invalidateQueries({ queryKey: ['featured-content'] })

      setTimeout(() => setImportStatus(null), 3000)
    } catch (error) {
      console.error('Import error:', error)
      setImportStatus('error')
      setTimeout(() => setImportStatus(null), 3000)
    } finally {
      setImporting(false)
      // Reset input
      event.target.value = ''
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Backups</h1>
        <p className="text-gray-500 dark:text-gray-400">Exporta e importa la configuración del sistema</p>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/20">
              <Settings className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Configuración</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {backupInfo?.settings ? 'Configurado' : 'Sin datos'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900/20">
              <Megaphone className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Anuncios</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {backupInfo?.announcementsCount || 0} activos
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/20">
              <Star className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Destacados</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {backupInfo?.featuredCount || 0} items
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Export Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                <Download className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Exportar Backup</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Descarga la configuración actual</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-2">
              <h4 className="font-medium text-gray-900 dark:text-white text-sm">Incluye:</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Configuración del sitio
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Anuncios globales
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Contenido destacado
                </li>
              </ul>
            </div>

            <button
              onClick={handleExport}
              disabled={exportStatus === 'exporting'}
              className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                exportStatus === 'success'
                  ? 'bg-green-600 text-white'
                  : exportStatus === 'error'
                  ? 'bg-red-600 text-white'
                  : 'bg-primary-600 text-white hover:bg-primary-700'
              } disabled:opacity-50`}
            >
              {exportStatus === 'exporting' ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Exportando...</span>
                </>
              ) : exportStatus === 'success' ? (
                <>
                  <CheckCircle className="h-5 w-5" />
                  <span>Descargado!</span>
                </>
              ) : exportStatus === 'error' ? (
                <>
                  <AlertCircle className="h-5 w-5" />
                  <span>Error al exportar</span>
                </>
              ) : (
                <>
                  <FileJson className="h-5 w-5" />
                  <span>Descargar Backup (JSON)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Import Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                <Upload className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Importar Backup</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Restaura desde un archivo</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800 dark:text-yellow-300">Advertencia</p>
                  <p className="text-yellow-700 dark:text-yellow-400">
                    Importar un backup sobrescribirá la configuración actual.
                    Se recomienda exportar primero.
                  </p>
                </div>
              </div>
            </div>

            <label className={`w-full flex flex-col items-center justify-center px-4 py-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
              importing
                ? 'border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-700/50'
                : importStatus === 'success'
                ? 'border-green-300 bg-green-50 dark:border-green-600 dark:bg-green-900/20'
                : importStatus === 'error'
                ? 'border-red-300 bg-red-50 dark:border-red-600 dark:bg-red-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
            }`}>
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                disabled={importing}
                className="hidden"
              />

              {importing ? (
                <>
                  <Loader2 className="h-8 w-8 text-gray-400 animate-spin mb-2" />
                  <span className="text-sm text-gray-500">Importando...</span>
                </>
              ) : importStatus === 'success' ? (
                <>
                  <CheckCircle className="h-8 w-8 text-green-500 mb-2" />
                  <span className="text-sm text-green-600 dark:text-green-400">Importado correctamente!</span>
                </>
              ) : importStatus === 'error' ? (
                <>
                  <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
                  <span className="text-sm text-red-600 dark:text-red-400">Error al importar</span>
                </>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    Arrastra un archivo o haz clic para seleccionar
                  </span>
                  <span className="text-xs text-gray-400 mt-1">
                    Solo archivos .json
                  </span>
                </>
              )}
            </label>
          </div>
        </div>
      </div>

      {/* Last Backup Info */}
      {backupInfo?.lastUpdated && (
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Clock className="h-5 w-5 text-gray-400" />
            <h3 className="font-medium text-gray-900 dark:text-white">Última actualización</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500 dark:text-gray-400">Configuración</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {new Date(backupInfo.lastUpdated).toLocaleString('es-ES')}
              </p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">Formato</p>
              <p className="font-medium text-gray-900 dark:text-white">JSON</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">Versión</p>
              <p className="font-medium text-gray-900 dark:text-white">1.0</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">Almacenamiento</p>
              <p className="font-medium text-gray-900 dark:text-white">Supabase</p>
            </div>
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6">
        <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">
          <HardDrive className="h-5 w-5 inline mr-2" />
          Información sobre backups
        </h3>
        <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
          <li>• Los backups incluyen solo configuración, no datos de usuarios o contenido</li>
          <li>• Los archivos son portables entre diferentes instancias de Seven Art</li>
          <li>• Se recomienda hacer backups antes de cambios importantes</li>
          <li>• Los backups de datos completos deben hacerse desde Supabase Dashboard</li>
        </ul>
      </div>
    </div>
  )
}

export default AdminBackups
