/**
 * Configuración de caché agresiva para React Query
 * Reduce llamadas a Supabase manteniendo datos frescos en memoria
 */

// Tiempos de caché por tipo de datos (en milisegundos)
export const CACHE_TIMES = {
  // Datos que cambian muy poco - caché muy largo
  STATIC: {
    staleTime: 30 * 60 * 1000,  // 30 minutos
    gcTime: 60 * 60 * 1000,     // 1 hora
  },

  // Perfiles de usuario - cambian poco frecuentemente
  PROFILE: {
    staleTime: 15 * 60 * 1000,  // 15 minutos
    gcTime: 30 * 60 * 1000,     // 30 minutos
  },

  // Películas - contenido relativamente estable
  MOVIES: {
    staleTime: 10 * 60 * 1000,  // 10 minutos
    gcTime: 30 * 60 * 1000,     // 30 minutos
  },

  // Feed de posts - actualizaciones moderadas
  FEED: {
    staleTime: 5 * 60 * 1000,   // 5 minutos
    gcTime: 15 * 60 * 1000,     // 15 minutos
  },

  // Estadísticas, likes, comentarios - actualizaciones frecuentes
  SOCIAL: {
    staleTime: 2 * 60 * 1000,   // 2 minutos
    gcTime: 10 * 60 * 1000,     // 10 minutos
  },

  // Trending/Sugerencias - datos calculados
  COMPUTED: {
    staleTime: 5 * 60 * 1000,   // 5 minutos
    gcTime: 15 * 60 * 1000,     // 15 minutos
  },

  // Búsquedas - caché corto pero útil para repeticiones
  SEARCH: {
    staleTime: 3 * 60 * 1000,   // 3 minutos
    gcTime: 10 * 60 * 1000,     // 10 minutos
  },

  // Notificaciones/Mensajes - necesitan actualización frecuente
  REALTIME: {
    staleTime: 30 * 1000,       // 30 segundos
    gcTime: 5 * 60 * 1000,      // 5 minutos
  },
}

// Configuración por defecto global (más agresiva)
export const DEFAULT_QUERY_CONFIG = {
  staleTime: 5 * 60 * 1000,    // 5 minutos por defecto
  gcTime: 30 * 60 * 1000,      // 30 minutos de garbage collection
  retry: 1,
  refetchOnWindowFocus: false,
  refetchOnMount: false,        // No refetch si datos están frescos
  refetchOnReconnect: false,    // No refetch al reconectar si hay datos
}

// Helper para crear opciones de query con caché específico
export function createQueryOptions(cacheType, extraOptions = {}) {
  const cacheConfig = CACHE_TIMES[cacheType] || CACHE_TIMES.FEED
  return {
    ...cacheConfig,
    ...extraOptions,
  }
}

// Configuración específica para infinite queries
export const INFINITE_QUERY_CONFIG = {
  staleTime: 5 * 60 * 1000,
  gcTime: 30 * 60 * 1000,
  refetchOnWindowFocus: false,
  refetchOnMount: false,
}
