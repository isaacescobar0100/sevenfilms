import { useRef, useCallback, useState, useEffect } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import LoadingSpinner from './LoadingSpinner'

/**
 * Hook para detectar el número de columnas basado en el ancho de pantalla
 */
function useResponsiveColumns(defaultColumns = 4) {
  const [columns, setColumns] = useState(defaultColumns)

  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth
      if (width < 640) {
        setColumns(1) // Mobile: 1 columna
      } else if (width < 768) {
        setColumns(2) // Small tablet: 2 columnas
      } else if (width < 1024) {
        setColumns(3) // Tablet/small desktop: 3 columnas
      } else {
        setColumns(defaultColumns) // Desktop: columnas por defecto
      }
    }

    updateColumns()
    window.addEventListener('resize', updateColumns)
    return () => window.removeEventListener('resize', updateColumns)
  }, [defaultColumns])

  return columns
}

/**
 * Componente de lista virtualizada para rendimiento optimizado
 * Solo renderiza los elementos visibles en el viewport
 *
 * @param {Object} props
 * @param {Array} props.items - Array de elementos a renderizar
 * @param {Function} props.renderItem - Función que renderiza cada elemento
 * @param {number} props.estimatedItemSize - Altura estimada de cada elemento en px
 * @param {Function} props.getItemKey - Función para obtener key única de cada item
 * @param {boolean} props.hasNextPage - Si hay más páginas para cargar
 * @param {boolean} props.isFetchingNextPage - Si está cargando la siguiente página
 * @param {Function} props.fetchNextPage - Función para cargar más elementos
 * @param {string} props.className - Clases CSS adicionales para el contenedor
 * @param {number} props.overscan - Número de elementos extra a renderizar fuera del viewport
 * @param {React.ReactNode} props.headerComponent - Componente opcional para mostrar antes de la lista (se desplaza con el contenido)
 * @param {number} props.headerHeight - Altura estimada del header para el virtualizador
 */
export function VirtualizedList({
  items = [],
  renderItem,
  estimatedItemSize = 200,
  getItemKey,
  hasNextPage = false,
  isFetchingNextPage = false,
  fetchNextPage,
  className = '',
  overscan = 5,
  loadingText = 'Cargando más...',
  headerComponent = null,
  headerHeight = 150,
}) {
  const parentRef = useRef(null)

  // Calcular el número total de elementos (header + items + loader)
  const hasHeader = !!headerComponent
  const totalCount = (hasHeader ? 1 : 0) + items.length + (hasNextPage ? 1 : 0)

  // Configurar virtualizador
  const virtualizer = useVirtualizer({
    count: totalCount,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => {
      if (hasHeader && index === 0) return headerHeight
      return estimatedItemSize
    },
    overscan,
    getItemKey: (index) => {
      if (hasHeader && index === 0) return 'header'
      const itemIndex = hasHeader ? index - 1 : index
      if (itemIndex >= items.length) return 'loader'
      return getItemKey ? getItemKey(items[itemIndex], itemIndex) : itemIndex
    },
  })

  const virtualItems = virtualizer.getVirtualItems()

  // Detectar cuando llegamos al final para infinite scroll
  const handleScroll = useCallback(() => {
    if (!parentRef.current || !hasNextPage || isFetchingNextPage) return

    const { scrollTop, scrollHeight, clientHeight } = parentRef.current
    const scrollPercentage = (scrollTop + clientHeight) / scrollHeight

    // Cargar más cuando estamos al 80% del scroll
    if (scrollPercentage > 0.8 && fetchNextPage) {
      fetchNextPage()
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  return (
    <div
      ref={parentRef}
      className={`overflow-auto ${className}`}
      onScroll={handleScroll}
      style={{ contain: 'strict' }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualItems.map((virtualItem) => {
          const isHeaderRow = hasHeader && virtualItem.index === 0
          const itemIndex = hasHeader ? virtualItem.index - 1 : virtualItem.index
          const isLoaderRow = itemIndex >= items.length

          return (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              {isHeaderRow ? (
                <div className="pb-6">{headerComponent}</div>
              ) : isLoaderRow ? (
                <div className="flex justify-center py-4">
                  {isFetchingNextPage ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <span className="text-gray-500 text-sm">{loadingText}</span>
                  )}
                </div>
              ) : (
                renderItem(items[itemIndex], itemIndex)
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Componente de grid virtualizado para películas/tarjetas
 * Optimizado para layouts de múltiples columnas
 */
export function VirtualizedGrid({
  items = [],
  renderItem,
  columns: defaultColumns = 3,
  estimatedRowHeight = 300,
  getItemKey,
  hasNextPage = false,
  isFetchingNextPage = false,
  fetchNextPage,
  className = '',
  gap = 16,
  overscan = 2,
}) {
  const parentRef = useRef(null)

  // Usar columnas responsive
  const columns = useResponsiveColumns(defaultColumns)

  // Calcular filas
  const rowCount = Math.ceil(items.length / columns) + (hasNextPage ? 1 : 0)

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimatedRowHeight,
    overscan,
  })

  const virtualRows = virtualizer.getVirtualItems()

  // Detectar scroll para infinite loading
  const handleScroll = useCallback(() => {
    if (!parentRef.current || !hasNextPage || isFetchingNextPage) return

    const { scrollTop, scrollHeight, clientHeight } = parentRef.current
    const scrollPercentage = (scrollTop + clientHeight) / scrollHeight

    if (scrollPercentage > 0.8 && fetchNextPage) {
      fetchNextPage()
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  return (
    <div
      ref={parentRef}
      className={`overflow-auto ${className}`}
      onScroll={handleScroll}
      style={{ contain: 'strict' }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualRows.map((virtualRow) => {
          const isLoaderRow = virtualRow.index >= Math.ceil(items.length / columns)
          const startIndex = virtualRow.index * columns
          const rowItems = items.slice(startIndex, startIndex + columns)

          return (
            <div
              key={virtualRow.key}
              ref={virtualizer.measureElement}
              data-index={virtualRow.index}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {isLoaderRow ? (
                <div className="flex justify-center py-4">
                  {isFetchingNextPage ? (
                    <LoadingSpinner size="sm" />
                  ) : hasNextPage ? (
                    <span className="text-gray-500 text-sm">Cargar más...</span>
                  ) : null}
                </div>
              ) : (
                <div
                  className="grid"
                  style={{
                    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                    gap: `${gap}px`,
                  }}
                >
                  {rowItems.map((item, colIndex) => (
                    <div key={getItemKey ? getItemKey(item, startIndex + colIndex) : startIndex + colIndex}>
                      {renderItem(item, startIndex + colIndex)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Hook para usar virtualización con infinite query
 * Aplana las páginas de React Query para usar con VirtualizedList
 */
export function useFlattenedItems(infiniteQueryResult) {
  const { data, hasNextPage, isFetchingNextPage, fetchNextPage } = infiniteQueryResult

  // Aplanar las páginas en un solo array
  const items = data?.pages?.flatMap((page) => page.data || page) || []

  return {
    items,
    hasNextPage: !!hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  }
}

export default VirtualizedList
