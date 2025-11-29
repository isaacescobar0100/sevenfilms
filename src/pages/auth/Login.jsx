import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { Ban } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { loginSchema } from '../../utils/validation'
import ErrorMessage from '../../components/common/ErrorMessage'
import SplashScreen from '../../components/common/SplashScreen'
import { supabase } from '../../lib/supabase'

function Login() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { signIn, suspended, suspendedMessage, clearSuspendedMessage } = useAuthStore()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSplash, setShowSplash] = useState(false)
  const [showSuspendedAlert, setShowSuspendedAlert] = useState(false)

  // Mostrar alerta si el usuario fue suspendido
  useEffect(() => {
    if (suspended && suspendedMessage) {
      setShowSuspendedAlert(true)
    }
  }, [suspended, suspendedMessage])

  const handleCloseSuspendedAlert = () => {
    setShowSuspendedAlert(false)
    clearSuspendedMessage()
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data) => {
    setLoading(true)
    setError('')

    try {
      const result = await signIn(data.email, data.password)

      // Mostrar splash screen
      setShowSplash(true)

      // Determinar ruta según el rol
      const redirectTo = result.role === 'admin' ? '/admin' : '/feed'

      // Prefetch del feed solo si no es admin
      if (result.role !== 'admin') {
        queryClient.prefetchQuery({
          queryKey: ['posts', 'feed'],
          queryFn: async () => {
            const { data: posts } = await supabase
              .from('posts')
              .select('*')
              .order('created_at', { ascending: false })
              .limit(10)
            return posts
          },
        })
      }

      // Esperar un momento para mostrar la animación
      setTimeout(() => {
        navigate(redirectTo)
      }, 1800)
    } catch (err) {
      console.error('Login error:', err)
      if (err.message === 'ACCOUNT_SUSPENDED') {
        setShowSuspendedAlert(true)
      } else {
        setError(t('auth.errors.invalidCredentials'))
      }
      setLoading(false)
    }
  }

  // Mostrar splash screen durante la carga
  if (showSplash) {
    return <SplashScreen />
  }

  return (
    <>
      {/* Modal de cuenta suspendida */}
      {showSuspendedAlert && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-4">
                <Ban className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Cuenta Suspendida
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {suspendedMessage || 'Tu cuenta ha sido suspendida. Contacta al administrador para más información.'}
              </p>
              <button
                onClick={handleCloseSuspendedAlert}
                className="w-full px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat relative"
      style={{
        backgroundImage: 'url(/images/bg-login.webp)',
        backgroundColor: '#1a1a2e'
      }}
    >
      {/* Overlay oscuro */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/60 lg:bg-transparent" />

      <div className="relative z-10 min-h-screen flex">
        {/* Lado izquierdo - Contenido sobre imagen (solo desktop) */}
        <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 flex-col justify-end relative">
          {/* Gradiente inferior para legibilidad */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Contenido en la parte inferior */}
          <div className="relative z-10 p-12 pb-16">
            <div className="flex items-center gap-4 mb-4">
              <img src="/images/logo-full.svg" alt="Seven Art" className="h-16 w-16" />
              <h1 className="text-4xl font-bold text-white">Seven Art</h1>
            </div>
            <p className="text-xl text-gray-200 max-w-lg leading-relaxed">
              Comparte tu pasión por el cine y conecta con otros amantes del séptimo arte
            </p>

            {/* Indicadores decorativos */}
            <div className="flex items-center gap-6 mt-8">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-primary-600/20 flex items-center justify-center">
                  <span className="text-lg">🎬</span>
                </div>
                <span className="text-gray-300 text-sm">Comparte películas</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-primary-600/20 flex items-center justify-center">
                  <span className="text-lg">💬</span>
                </div>
                <span className="text-gray-300 text-sm">Conecta con fans</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-primary-600/20 flex items-center justify-center">
                  <span className="text-lg">⭐</span>
                </div>
                <span className="text-gray-300 text-sm">Reacciona</span>
              </div>
            </div>
          </div>
        </div>

        {/* Lado derecho - Formulario */}
        <div className="w-full lg:w-1/2 xl:w-2/5 flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8 lg:bg-gray-50 lg:dark:bg-gray-900 lg:justify-center">
          {/* Header móvil */}
          <div className="sm:mx-auto sm:w-full sm:max-w-md lg:mb-0">
            <div className="flex justify-center lg:hidden mb-2">
              <img src="/images/logo-full.svg" alt="Seven Art" className="h-16 w-16" />
            </div>
            <h2 className="text-center text-2xl lg:text-3xl font-bold text-white lg:text-gray-900 lg:dark:text-white">
              {t('auth.login.title')}
            </h2>
          </div>

          <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
            <div className="bg-white/90 dark:bg-gray-800/90 lg:bg-white lg:dark:bg-gray-800 py-8 px-6 shadow-2xl rounded-2xl sm:rounded-xl sm:px-10 backdrop-blur-md lg:backdrop-blur-none border border-white/20 lg:border-gray-200 lg:dark:border-gray-700">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {error && <ErrorMessage message={error} />}

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('auth.login.email')}
                  </label>
                  <input
                    {...register('email')}
                    type="email"
                    id="email"
                    autoComplete="email"
                    className="mt-1 input"
                    disabled={loading}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('auth.login.password')}
                  </label>
                  <input
                    {...register('password')}
                    type="password"
                    id="password"
                    autoComplete="current-password"
                    className="mt-1 input"
                    disabled={loading}
                  />
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn btn-primary flex justify-center items-center"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Entrando...</span>
                    </div>
                  ) : (
                    t('auth.login.submit')
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('auth.login.noAccount')}{' '}
                  <Link to="/register" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium">
                    {t('auth.login.registerLink')}
                  </Link>
                </p>
              </div>
            </div>
          </div>

          {/* Footer móvil con info */}
          <div className="lg:hidden mt-6 text-center">
            <p className="text-white/80 text-sm mb-3">
              Comparte tu pasión por el cine
            </p>
            <div className="flex justify-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="text-base">🎬</span>
                <span className="text-white/60 text-xs">Películas</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-base">💬</span>
                <span className="text-white/60 text-xs">Conecta</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-base">⭐</span>
                <span className="text-white/60 text-xs">Reacciona</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}

export default Login
