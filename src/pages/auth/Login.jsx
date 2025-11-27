import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../../store/authStore'
import { loginSchema } from '../../utils/validation'
import ErrorMessage from '../../components/common/ErrorMessage'
import SplashScreen from '../../components/common/SplashScreen'
import { supabase } from '../../lib/supabase'

function Login() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { signIn } = useAuthStore()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSplash, setShowSplash] = useState(false)

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
      await signIn(data.email, data.password)

      // Mostrar splash screen
      setShowSplash(true)

      // Prefetch del feed
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

      // Esperar un momento para mostrar la animación
      setTimeout(() => {
        navigate('/feed')
      }, 1800)
    } catch (err) {
      console.error('Login error:', err)
      setError(t('auth.errors.invalidCredentials'))
      setLoading(false)
    }
  }

  // Mostrar splash screen durante la carga
  if (showSplash) {
    return <SplashScreen />
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat relative"
      style={{
        backgroundImage: 'url(/images/bg-login.webp)',
        backgroundColor: '#1a1a2e'
      }}
    >
      {/* Overlay oscuro */}
      <div className="absolute inset-0 bg-black/60 lg:bg-transparent" />

      <div className="relative z-10 min-h-screen flex">
        {/* Lado izquierdo - Contenido sobre imagen (solo desktop) */}
        <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 items-start pt-20 justify-center">
          <div className="text-white text-center p-12">
            <img src="/images/logo-full.svg" alt="Seven Art" className="h-24 w-24 mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">Seven Art</h1>
            <p className="text-lg text-gray-200 max-w-md">
              Comparte tu pasión por el cine y conecta con otros amantes del séptimo arte
            </p>
          </div>
        </div>

        {/* Lado derecho - Formulario */}
        <div className="w-full lg:w-1/2 xl:w-2/5 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 lg:bg-gray-50 lg:dark:bg-gray-900">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            {/* Logo para móvil */}
            <div className="flex justify-center lg:hidden mb-4">
              <img src="/images/logo-full.svg" alt="Seven Art" className="h-20 w-20" />
            </div>
            <h2 className="text-center text-3xl font-bold text-white lg:text-gray-900 lg:dark:text-white">
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
        </div>
      </div>
    </div>
  )
}

export default Login
