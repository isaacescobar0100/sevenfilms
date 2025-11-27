import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../../store/authStore'
import { loginSchema } from '../../utils/validation'
import ErrorMessage from '../../components/common/ErrorMessage'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { supabase } from '../../lib/supabase'

function Login() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { signIn } = useAuthStore()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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

      // Prefetch del feed para mejorar la experiencia
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

      navigate('/feed')
    } catch (err) {
      console.error('Login error:', err)
      setError(t('auth.errors.invalidCredentials'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Lado izquierdo - Imagen de fondo (solo desktop) */}
      <div
        className="hidden lg:flex lg:w-1/2 xl:w-3/5 bg-cover bg-center bg-no-repeat relative"
        style={{
          backgroundImage: 'url(/images/bg-login.webp)',
          backgroundColor: '#1a1a2e'
        }}
      >
        {/* Overlay oscuro */}
        <div className="absolute inset-0 bg-black/40" />

        {/* Contenido sobre la imagen */}
        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12 text-white">
          <img src="/images/logo-full.svg" alt="Seven Art" className="h-32 w-32 mb-6" />
          <h1 className="text-4xl font-bold mb-4 text-center">Seven Art</h1>
          <p className="text-xl text-center text-gray-200 max-w-md">
            Comparte tu pasión por el cine y conecta con otros amantes del séptimo arte
          </p>
        </div>
      </div>

      {/* Lado derecho - Formulario */}
      <div className="w-full lg:w-1/2 xl:w-2/5 bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          {/* Logo para móvil */}
          <div className="flex justify-center lg:hidden">
            <img src="/images/logo-full.svg" alt="Seven Art" className="h-16 w-16" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900 dark:text-white">
            {t('auth.login.title')}
          </h2>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
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
                {loading ? <LoadingSpinner size="sm" /> : t('auth.login.submit')}
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
  )
}

export default Login
