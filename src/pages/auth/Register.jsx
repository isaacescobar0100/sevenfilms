import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../store/authStore'
import { registerSchema } from '../../utils/validation'
import ErrorMessage from '../../components/common/ErrorMessage'
import LoadingSpinner from '../../components/common/LoadingSpinner'

function Register() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { signUp } = useAuthStore()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [registrationSuccess, setRegistrationSuccess] = useState(false)
  const [userEmail, setUserEmail] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data) => {
    setLoading(true)
    setError('')

    try {
      await signUp(data.email, data.password, { name: data.name })
      setUserEmail(data.email)
      setRegistrationSuccess(true)
    } catch (err) {
      console.error('Register error:', err)
      if (err.message?.includes('already registered')) {
        setError(t('auth.errors.emailInUse'))
      } else {
        setError(err.message || 'Error al crear la cuenta')
      }
    } finally {
      setLoading(false)
    }
  }

  // Show success message after registration
  if (registrationSuccess) {
    return (
      <div
        className="min-h-screen bg-cover bg-center bg-no-repeat relative"
        style={{
          backgroundImage: 'url(/images/bg-login-old.webp)',
          backgroundColor: '#1a1a2e'
        }}
      >
        <div className="absolute inset-0 bg-black/60 lg:bg-transparent" />

        <div className="relative z-10 min-h-screen flex">
          <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 flex-col justify-end relative">
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="relative z-10 p-12 pb-16">
              <div className="flex items-center gap-4 mb-4">
                <img src="/images/logo-full.svg" alt="Seven Art" className="h-16 w-16" />
                <h1 className="text-4xl font-bold text-white">Seven Art</h1>
              </div>
              <p className="text-xl text-gray-200 max-w-lg leading-relaxed">
                Únete a la comunidad de amantes del cine
              </p>
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
              </div>
            </div>
          </div>

          <div className="w-full lg:w-1/2 xl:w-2/5 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 lg:bg-gray-50 lg:dark:bg-gray-900">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
              <div className="flex justify-center lg:hidden mb-4">
                <img src="/images/logo-full.svg" alt="Seven Art" className="h-20 w-20" />
              </div>
              <h2 className="text-center text-3xl font-bold text-white lg:text-gray-900 lg:dark:text-white">
                ¡Registro Exitoso!
              </h2>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
              <div className="bg-white/90 dark:bg-gray-800/90 lg:bg-white lg:dark:bg-gray-800 py-8 px-6 shadow-2xl rounded-2xl sm:rounded-xl sm:px-10 backdrop-blur-md lg:backdrop-blur-none border border-white/20 lg:border-gray-200 lg:dark:border-gray-700">
                <div className="text-center">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                    <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>

                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Revisa tu bandeja de entrada
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Hemos enviado un correo de confirmación a:
                  </p>
                  <p className="text-sm font-medium text-primary-600 dark:text-primary-400 mb-6">
                    {userEmail}
                  </p>

                  <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                      <strong>Importante:</strong> Debes confirmar tu correo electrónico antes de poder iniciar sesión.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      ¿No recibiste el correo? Revisa tu carpeta de spam o correo no deseado.
                    </p>

                    <Link
                      to="/login"
                      className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      Ir al Login
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat relative"
      style={{
        backgroundImage: 'url(/images/bg-login-old.webp)',
        backgroundColor: '#1a1a2e'
      }}
    >
      <div className="absolute inset-0 bg-black/60 lg:bg-transparent" />

      <div className="relative z-10 min-h-screen flex">
        <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 flex-col justify-end relative">
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="relative z-10 p-12 pb-16">
            <div className="flex items-center gap-4 mb-4">
              <img src="/images/logo-full.svg" alt="Seven Art" className="h-16 w-16" />
              <h1 className="text-4xl font-bold text-white">Seven Art</h1>
            </div>
            <p className="text-xl text-gray-200 max-w-lg leading-relaxed">
              Únete a la comunidad de amantes del cine
            </p>
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
            </div>
          </div>
        </div>

        <div className="w-full lg:w-1/2 xl:w-2/5 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 lg:bg-gray-50 lg:dark:bg-gray-900">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="flex justify-center lg:hidden mb-4">
              <img src="/images/logo-full.svg" alt="Seven Art" className="h-20 w-20" />
            </div>
            <h2 className="text-center text-3xl font-bold text-white lg:text-gray-900 lg:dark:text-white">
              {t('auth.register.title')}
            </h2>
          </div>

          <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
            <div className="bg-white/90 dark:bg-gray-800/90 lg:bg-white lg:dark:bg-gray-800 py-8 px-6 shadow-2xl rounded-2xl sm:rounded-xl sm:px-10 backdrop-blur-md lg:backdrop-blur-none border border-white/20 lg:border-gray-200 lg:dark:border-gray-700">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {error && <ErrorMessage message={error} />}

                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('auth.register.name')}
                  </label>
                  <input
                    {...register('name')}
                    type="text"
                    id="name"
                    autoComplete="name"
                    className="mt-1 input"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('auth.register.email')}
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
                    {t('auth.register.password')}
                  </label>
                  <input
                    {...register('password')}
                    type="password"
                    id="password"
                    autoComplete="new-password"
                    className="mt-1 input"
                  />
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('auth.register.confirmPassword')}
                  </label>
                  <input
                    {...register('confirmPassword')}
                    type="password"
                    id="confirmPassword"
                    autoComplete="new-password"
                    className="mt-1 input"
                  />
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.confirmPassword.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn btn-primary flex justify-center items-center"
                >
                  {loading ? <LoadingSpinner size="sm" /> : t('auth.register.submit')}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('auth.register.hasAccount')}{' '}
                  <Link to="/login" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium">
                    {t('auth.register.loginLink')}
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

export default Register
