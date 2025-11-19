import { Link } from 'react-router-dom'
import { Home } from 'lucide-react'

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-primary-600">404</h1>
        <h2 className="text-3xl font-semibold text-gray-900 mt-4">Página no encontrada</h2>
        <p className="text-gray-600 mt-2 mb-8">
          Lo sentimos, la página que buscas no existe.
        </p>
        <Link to="/" className="btn btn-primary inline-flex items-center space-x-2">
          <Home className="h-5 w-5" />
          <span>Volver al inicio</span>
        </Link>
      </div>
    </div>
  )
}

export default NotFound
