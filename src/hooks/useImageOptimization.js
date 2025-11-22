import { useCallback, useState } from 'react'

/**
 * Configuración por defecto para optimización de imágenes
 */
const DEFAULT_CONFIG = {
  avatar: {
    maxWidth: 400,
    maxHeight: 400,
    quality: 0.85,
    format: 'image/webp',
  },
  cover: {
    maxWidth: 1920,
    maxHeight: 600,
    quality: 0.85,
    format: 'image/webp',
  },
  thumbnail: {
    maxWidth: 1280,
    maxHeight: 720,
    quality: 0.85,
    format: 'image/webp',
  },
  post: {
    maxWidth: 1920,
    maxHeight: 1920,
    quality: 0.85,
    format: 'image/webp',
  },
}

/**
 * Comprime y redimensiona una imagen usando Canvas API
 *
 * @param {File} file - Archivo de imagen original
 * @param {Object} options - Opciones de compresión
 * @returns {Promise<{file: File, originalSize: number, compressedSize: number, savings: number}>}
 */
export async function compressImage(file, options = {}) {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.85,
    format = 'image/webp',
  } = options

  return new Promise((resolve, reject) => {
    // Validar que sea una imagen
    if (!file.type.startsWith('image/')) {
      reject(new Error('El archivo no es una imagen válida'))
      return
    }

    const originalSize = file.size
    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    img.onload = () => {
      // Calcular nuevas dimensiones manteniendo aspect ratio
      let { width, height } = img

      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }

      if (height > maxHeight) {
        width = (width * maxHeight) / height
        height = maxHeight
      }

      // Configurar canvas
      canvas.width = width
      canvas.height = height

      // Dibujar imagen redimensionada
      ctx.drawImage(img, 0, 0, width, height)

      // Convertir a blob con compresión
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Error al comprimir la imagen'))
            return
          }

          // Determinar extensión según formato
          const extension = format === 'image/webp' ? 'webp' :
                           format === 'image/jpeg' ? 'jpg' : 'png'

          // Crear nuevo archivo con el blob comprimido
          const compressedFile = new File(
            [blob],
            file.name.replace(/\.[^/.]+$/, `.${extension}`),
            { type: format }
          )

          const compressedSize = compressedFile.size
          const savings = ((originalSize - compressedSize) / originalSize) * 100

          console.log(`[ImageOptimization] Compresión completada:
            - Original: ${(originalSize / 1024).toFixed(2)} KB
            - Comprimido: ${(compressedSize / 1024).toFixed(2)} KB
            - Ahorro: ${savings.toFixed(1)}%
            - Dimensiones: ${width}x${height}`)

          resolve({
            file: compressedFile,
            originalSize,
            compressedSize,
            savings,
            dimensions: { width, height },
          })
        },
        format,
        quality
      )
    }

    img.onerror = () => {
      reject(new Error('Error al cargar la imagen'))
    }

    // Cargar imagen desde archivo
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Hook para optimización de imágenes
 *
 * @param {string} type - Tipo de imagen: 'avatar' | 'cover' | 'thumbnail' | 'post'
 * @returns {Object} Estado y funciones de optimización
 *
 * @example
 * const { optimizeImage, isOptimizing, lastResult } = useImageOptimization('avatar')
 *
 * const handleUpload = async (file) => {
 *   const { file: optimizedFile, savings } = await optimizeImage(file)
 *   console.log(`Ahorraste ${savings}%`)
 *   await uploadToServer(optimizedFile)
 * }
 */
export function useImageOptimization(type = 'post') {
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [lastResult, setLastResult] = useState(null)
  const [error, setError] = useState(null)

  const config = DEFAULT_CONFIG[type] || DEFAULT_CONFIG.post

  const optimizeImage = useCallback(async (file, customOptions = {}) => {
    setIsOptimizing(true)
    setError(null)

    try {
      const options = { ...config, ...customOptions }
      const result = await compressImage(file, options)
      setLastResult(result)
      return result
    } catch (err) {
      setError(err.message)
      console.error('[ImageOptimization] Error:', err)
      // En caso de error, devolver el archivo original
      return {
        file,
        originalSize: file.size,
        compressedSize: file.size,
        savings: 0,
      }
    } finally {
      setIsOptimizing(false)
    }
  }, [config])

  /**
   * Optimizar múltiples imágenes en paralelo
   */
  const optimizeImages = useCallback(async (files, customOptions = {}) => {
    setIsOptimizing(true)
    setError(null)

    try {
      const options = { ...config, ...customOptions }
      const results = await Promise.all(
        files.map((file) => compressImage(file, options))
      )
      return results
    } catch (err) {
      setError(err.message)
      console.error('[ImageOptimization] Error en batch:', err)
      return files.map((file) => ({
        file,
        originalSize: file.size,
        compressedSize: file.size,
        savings: 0,
      }))
    } finally {
      setIsOptimizing(false)
    }
  }, [config])

  /**
   * Verificar si el navegador soporta WebP
   */
  const supportsWebP = useCallback(async () => {
    const canvas = document.createElement('canvas')
    canvas.width = 1
    canvas.height = 1
    return canvas.toDataURL('image/webp').startsWith('data:image/webp')
  }, [])

  return {
    optimizeImage,
    optimizeImages,
    isOptimizing,
    lastResult,
    error,
    config,
    supportsWebP,
  }
}

/**
 * Función standalone para optimizar avatar (para usar en useProfiles)
 */
export async function optimizeAvatar(file) {
  return compressImage(file, DEFAULT_CONFIG.avatar)
}

/**
 * Función standalone para optimizar cover (para usar en useProfiles)
 */
export async function optimizeCover(file) {
  return compressImage(file, DEFAULT_CONFIG.cover)
}

/**
 * Función standalone para optimizar thumbnail (para usar en useMovies)
 */
export async function optimizeThumbnail(file) {
  return compressImage(file, DEFAULT_CONFIG.thumbnail)
}

/**
 * Función standalone para optimizar imagen de post (para usar en usePosts)
 */
export async function optimizePostImage(file) {
  return compressImage(file, DEFAULT_CONFIG.post)
}

export default useImageOptimization
