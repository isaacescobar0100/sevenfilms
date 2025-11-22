import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

/**
 * Error Boundary reutilizable para componentes individuales.
 * Muestra un fallback local sin afectar al resto de la aplicación.
 *
 * @example
 * <ComponentErrorBoundary name="UserProfile">
 *   <UserProfile userId={id} />
 * </ComponentErrorBoundary>
 */
class ComponentErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
    }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    // Log del error en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.error(`[${this.props.name || 'Component'}] Error:`, error)
      console.error('Component Stack:', errorInfo.componentStack)
    }

    // Callback opcional para reportar el error
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      // Fallback personalizado si se proporciona
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Fallback compacto por defecto
      const { size = 'md' } = this.props

      if (size === 'sm') {
        return (
          <div className="flex items-center gap-2 p-2 text-sm text-red-600 bg-red-50 rounded">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span>Error al cargar</span>
            <button
              onClick={this.handleRetry}
              className="ml-auto text-red-700 hover:text-red-800 underline text-xs"
            >
              Reintentar
            </button>
          </div>
        )
      }

      return (
        <div className="flex flex-col items-center justify-center p-6 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mb-3">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>

          <h3 className="text-lg font-medium text-gray-900 mb-1">
            Error en {this.props.name || 'componente'}
          </h3>

          <p className="text-sm text-gray-600 mb-4 text-center">
            No se pudo cargar este contenido. Por favor, intenta de nuevo.
          </p>

          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mb-4 w-full">
              <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700">
                Ver detalles técnicos
              </summary>
              <pre className="mt-2 p-2 bg-gray-100 rounded text-xs text-red-600 overflow-auto max-h-32">
                {this.state.error.toString()}
              </pre>
            </details>
          )}

          <button
            onClick={this.handleRetry}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Intentar de nuevo
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ComponentErrorBoundary

/**
 * HOC para envolver componentes con Error Boundary
 *
 * @example
 * const SafeUserProfile = withErrorBoundary(UserProfile, 'UserProfile')
 */
export function withErrorBoundary(WrappedComponent, name) {
  return function WithErrorBoundaryWrapper(props) {
    return (
      <ComponentErrorBoundary name={name}>
        <WrappedComponent {...props} />
      </ComponentErrorBoundary>
    )
  }
}
