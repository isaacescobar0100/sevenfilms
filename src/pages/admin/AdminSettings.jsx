import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Settings,
  Save,
  Globe,
  Shield,
  Bell,
  Palette,
  Database,
  Mail,
  Image,
  AlertCircle,
  CheckCircle,
  RefreshCw
} from 'lucide-react'
import { supabase } from '../../lib/supabase'

function SettingSection({ title, description, icon: Icon, children }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/20">
            <Icon className="h-5 w-5 text-primary-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
          </div>
        </div>
      </div>
      <div className="p-6 space-y-4">
        {children}
      </div>
    </div>
  )
}

function ToggleSetting({ label, description, checked, onChange, disabled }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
        {description && (
          <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        disabled={disabled}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  )
}

function InputSetting({ label, description, value, onChange, type = 'text', placeholder, disabled }) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-900 dark:text-white">
        {label}
      </label>
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50"
      />
    </div>
  )
}

function SelectSetting({ label, description, value, onChange, options, disabled }) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-900 dark:text-white">
        {label}
      </label>
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}

function AdminSettings() {
  const queryClient = useQueryClient()
  const [saveStatus, setSaveStatus] = useState(null) // 'saving', 'saved', 'error'

  // Estado local para settings
  const [settings, setSettings] = useState({
    // General
    siteName: 'Seven Art',
    siteDescription: 'Red social para amantes del cine',
    maintenanceMode: false,

    // Moderación
    autoModerateContent: true,
    requireEmailVerification: false,
    maxPostLength: 5000,
    maxCommentLength: 1000,
    allowGifs: true,
    allowLinks: true,

    // Notificaciones
    enablePushNotifications: true,
    enableEmailNotifications: false,
    digestFrequency: 'daily',

    // Contenido
    defaultFeedSort: 'recent',
    postsPerPage: 10,
    enableStories: true,
    storyDuration: 24,

    // Privacidad
    defaultProfilePrivacy: 'public',
    allowSearchEngineIndexing: true,
  })

  // Cargar settings desde base de datos (si existe tabla settings)
  const { isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      // Intentar cargar settings guardados
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .single()

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned
        console.error('Error loading settings:', error)
      }

      if (data) {
        setSettings(prev => ({ ...prev, ...data.settings }))
      }

      return data
    },
    retry: false,
  })

  // Guardar settings
  const saveMutation = useMutation({
    mutationFn: async () => {
      // Upsert en tabla site_settings
      const { error } = await supabase
        .from('site_settings')
        .upsert({
          id: 1, // Solo un registro de settings
          settings,
          updated_at: new Date().toISOString(),
        })

      if (error) throw error
    },
    onMutate: () => {
      setSaveStatus('saving')
    },
    onSuccess: () => {
      setSaveStatus('saved')
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] })
      setTimeout(() => setSaveStatus(null), 3000)
    },
    onError: () => {
      setSaveStatus('error')
      setTimeout(() => setSaveStatus(null), 3000)
    },
  })

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  // Estadísticas del sistema
  const { data: systemStats } = useQuery({
    queryKey: ['admin-system-stats'],
    queryFn: async () => {
      const [profiles, posts, movies, messages] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('posts').select('*', { count: 'exact', head: true }),
        supabase.from('movies').select('*', { count: 'exact', head: true }),
        supabase.from('messages').select('*', { count: 'exact', head: true }),
      ])

      return {
        users: profiles.count || 0,
        posts: posts.count || 0,
        movies: movies.count || 0,
        messages: messages.count || 0,
      }
    },
    staleTime: 60 * 1000,
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configuración</h1>
          <p className="text-gray-500 dark:text-gray-400">Configura los ajustes generales del sitio</p>
        </div>
        <button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="flex items-center justify-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
        >
          {saveStatus === 'saving' ? (
            <RefreshCw className="h-5 w-5 animate-spin" />
          ) : saveStatus === 'saved' ? (
            <CheckCircle className="h-5 w-5" />
          ) : saveStatus === 'error' ? (
            <AlertCircle className="h-5 w-5" />
          ) : (
            <Save className="h-5 w-5" />
          )}
          <span>
            {saveStatus === 'saving' ? 'Guardando...' :
             saveStatus === 'saved' ? 'Guardado!' :
             saveStatus === 'error' ? 'Error' : 'Guardar Cambios'}
          </span>
        </button>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-primary-600">{systemStats?.users || 0}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Usuarios</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-primary-600">{systemStats?.posts || 0}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Posts</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-primary-600">{systemStats?.movies || 0}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Películas</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-primary-600">{systemStats?.messages || 0}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Mensajes</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <SettingSection
          title="General"
          description="Configuración básica del sitio"
          icon={Globe}
        >
          <InputSetting
            label="Nombre del sitio"
            value={settings.siteName}
            onChange={(v) => updateSetting('siteName', v)}
            placeholder="Seven Art"
          />
          <InputSetting
            label="Descripción"
            value={settings.siteDescription}
            onChange={(v) => updateSetting('siteDescription', v)}
            placeholder="Red social para amantes del cine"
          />
          <ToggleSetting
            label="Modo mantenimiento"
            description="Bloquea el acceso a usuarios no administradores"
            checked={settings.maintenanceMode}
            onChange={(v) => updateSetting('maintenanceMode', v)}
          />
        </SettingSection>

        {/* Moderation Settings */}
        <SettingSection
          title="Moderación"
          description="Configura las reglas de moderación"
          icon={Shield}
        >
          <ToggleSetting
            label="Auto-moderación de contenido"
            description="Filtrar automáticamente contenido inapropiado"
            checked={settings.autoModerateContent}
            onChange={(v) => updateSetting('autoModerateContent', v)}
          />
          <ToggleSetting
            label="Verificación de email requerida"
            description="Los usuarios deben verificar su email"
            checked={settings.requireEmailVerification}
            onChange={(v) => updateSetting('requireEmailVerification', v)}
          />
          <InputSetting
            label="Longitud máxima de post"
            type="number"
            value={settings.maxPostLength}
            onChange={(v) => updateSetting('maxPostLength', parseInt(v))}
            placeholder="5000"
          />
          <ToggleSetting
            label="Permitir GIFs"
            checked={settings.allowGifs}
            onChange={(v) => updateSetting('allowGifs', v)}
          />
          <ToggleSetting
            label="Permitir enlaces"
            checked={settings.allowLinks}
            onChange={(v) => updateSetting('allowLinks', v)}
          />
        </SettingSection>

        {/* Notification Settings */}
        <SettingSection
          title="Notificaciones"
          description="Configura las notificaciones del sistema"
          icon={Bell}
        >
          <ToggleSetting
            label="Notificaciones push"
            description="Habilitar notificaciones push en navegador"
            checked={settings.enablePushNotifications}
            onChange={(v) => updateSetting('enablePushNotifications', v)}
          />
          <ToggleSetting
            label="Notificaciones por email"
            description="Enviar notificaciones importantes por email"
            checked={settings.enableEmailNotifications}
            onChange={(v) => updateSetting('enableEmailNotifications', v)}
          />
          <SelectSetting
            label="Frecuencia de resumen"
            description="Con qué frecuencia enviar resúmenes de actividad"
            value={settings.digestFrequency}
            onChange={(v) => updateSetting('digestFrequency', v)}
            options={[
              { value: 'never', label: 'Nunca' },
              { value: 'daily', label: 'Diario' },
              { value: 'weekly', label: 'Semanal' },
            ]}
          />
        </SettingSection>

        {/* Content Settings */}
        <SettingSection
          title="Contenido"
          description="Configura cómo se muestra el contenido"
          icon={Image}
        >
          <SelectSetting
            label="Orden del feed por defecto"
            value={settings.defaultFeedSort}
            onChange={(v) => updateSetting('defaultFeedSort', v)}
            options={[
              { value: 'recent', label: 'Más recientes' },
              { value: 'popular', label: 'Más populares' },
              { value: 'following', label: 'Solo seguidos' },
            ]}
          />
          <InputSetting
            label="Posts por página"
            type="number"
            value={settings.postsPerPage}
            onChange={(v) => updateSetting('postsPerPage', parseInt(v))}
            placeholder="10"
          />
          <ToggleSetting
            label="Habilitar Stories"
            description="Permitir a usuarios crear historias"
            checked={settings.enableStories}
            onChange={(v) => updateSetting('enableStories', v)}
          />
          <InputSetting
            label="Duración de stories (horas)"
            type="number"
            value={settings.storyDuration}
            onChange={(v) => updateSetting('storyDuration', parseInt(v))}
            placeholder="24"
          />
        </SettingSection>
      </div>

      {/* Privacy Section - Full Width */}
      <SettingSection
        title="Privacidad"
        description="Configura las opciones de privacidad"
        icon={Shield}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SelectSetting
            label="Privacidad de perfil por defecto"
            value={settings.defaultProfilePrivacy}
            onChange={(v) => updateSetting('defaultProfilePrivacy', v)}
            options={[
              { value: 'public', label: 'Público' },
              { value: 'private', label: 'Privado' },
            ]}
          />
          <div className="flex items-end">
            <ToggleSetting
              label="Indexación en buscadores"
              description="Permitir que los buscadores indexen perfiles públicos"
              checked={settings.allowSearchEngineIndexing}
              onChange={(v) => updateSetting('allowSearchEngineIndexing', v)}
            />
          </div>
        </div>
      </SettingSection>

      {/* Database Info */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Database className="h-5 w-5 text-gray-400" />
          <h3 className="font-medium text-gray-900 dark:text-white">Información del Sistema</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-500 dark:text-gray-400">Versión</p>
            <p className="font-medium text-gray-900 dark:text-white">1.0.0</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Base de datos</p>
            <p className="font-medium text-gray-900 dark:text-white">Supabase</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Storage</p>
            <p className="font-medium text-gray-900 dark:text-white">Supabase Storage</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Hosting</p>
            <p className="font-medium text-gray-900 dark:text-white">Vercel</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminSettings
