import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

function ProtectedAdminRoute() {
  const { user, role, loading, roleLoading } = useAuthStore()

  // Mostrar loading mientras se cargan user y role
  if (loading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Verificando permisos...</p>
        </div>
      </div>
    )
  }

  // Si no hay usuario, redirigir a login
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Si no es admin, redirigir a feed
  if (role !== 'admin') {
    return <Navigate to="/feed" replace />
  }

  // Es admin, renderizar contenido
  return <Outlet />
}

export default ProtectedAdminRoute
