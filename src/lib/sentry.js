import * as Sentry from "@sentry/react"

export function initSentry() {
  // Obtener DSN de variables de entorno
  const dsn = import.meta.env.VITE_SENTRY_DSN

  // Solo inicializar si hay un DSN válido
  if (!dsn || !dsn.startsWith('https://')) {
    console.warn('Sentry DSN no configurado. Los errores no se enviarán a Sentry.')
    return
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE, // 'development' o 'production'

    // Enviar errores en desarrollo Y producción para debugging
    enabled: true, // Cambiar a import.meta.env.PROD para solo producción

    // Tasa de errores a capturar (1.0 = 100%)
    tracesSampleRate: 1.0,

    // Tasa de sesiones a grabar (0.1 = 10% de las sesiones)
    replaysSessionSampleRate: 0.1,

    // Grabar el 100% de las sesiones con errores
    replaysOnErrorSampleRate: 1.0,

    // Integración con React (simplificada)
    integrations: [
      // BrowserTracing sin routingInstrumentation personalizado
      Sentry.browserTracingIntegration(),
      // Replay para grabar sesiones con errores
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],

    // Filtrar información sensible antes de enviar
    beforeSend(event, hint) {
      // No enviar errores de extensiones del navegador
      if (event.exception) {
        const values = event.exception.values || []
        for (const exception of values) {
          if (exception.value && exception.value.includes('chrome-extension://')) {
            return null
          }
        }
      }

      // Agregar información del usuario si está autenticado
      const userString = localStorage.getItem('auth-storage')
      if (userString) {
        try {
          const authData = JSON.parse(userString)
          if (authData.state && authData.state.user) {
            event.user = {
              id: authData.state.user.id,
              email: authData.state.user.email,
            }
          }
        } catch (e) {
          // Ignorar errores de parsing
        }
      }

      return event
    },

    // Ignorar errores conocidos que no son críticos
    ignoreErrors: [
      // Errores de red comunes
      'Network request failed',
      'Failed to fetch',
      'NetworkError',
      // Errores de extensiones del navegador
      'Extension context invalidated',
      // Errores de terceros
      'ResizeObserver loop limit exceeded',
    ],
  })
}

// Función auxiliar para capturar errores manualmente
export function captureError(error, context = {}) {
  Sentry.captureException(error, {
    contexts: {
      custom: context,
    },
  })
}

// Función auxiliar para capturar mensajes informativos
export function captureMessage(message, level = 'info') {
  Sentry.captureMessage(message, level)
}

// Función para establecer el usuario actual
export function setUser(user) {
  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.user_metadata?.username,
    })
  } else {
    Sentry.setUser(null)
  }
}