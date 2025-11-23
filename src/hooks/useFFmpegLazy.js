import { useState, useCallback, useRef } from 'react'

/**
 * Hook de FFmpeg con carga perezosa (lazy loading).
 * Solo carga FFmpeg cuando realmente se necesita, ahorrando ~40MB de descarga inicial.
 *
 * @example
 * const { load, loaded, loading, generateThumbnail } = useFFmpegLazy()
 *
 * // Cargar FFmpeg solo cuando el usuario quiere procesar video
 * const handleVideoSelect = async (file) => {
 *   if (!loaded) {
 *     await load() // Carga FFmpeg bajo demanda
 *   }
 *   const thumbnail = await generateThumbnail(file)
 * }
 */
export function useFFmpegLazy() {
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [loadProgress, setLoadProgress] = useState(0)

  const ffmpegRef = useRef(null)
  const ffmpegModulesRef = useRef(null)

  /**
   * Carga FFmpeg bajo demanda
   * @returns {Promise<boolean>} true si se cargó exitosamente
   */
  const load = useCallback(async () => {
    // Si ya está cargado, no hacer nada
    if (loaded && ffmpegRef.current) {
      return true
    }

    // Si está cargando, esperar
    if (loading) {
      return new Promise((resolve) => {
        const checkLoaded = setInterval(() => {
          if (loaded) {
            clearInterval(checkLoaded)
            resolve(true)
          }
        }, 100)
      })
    }

    try {
      setLoading(true)
      setError(null)
      setLoadProgress(10)


      // Importar módulos dinámicamente
      setLoadProgress(20)
      const [{ FFmpeg }, { toBlobURL }] = await Promise.all([
        import('@ffmpeg/ffmpeg'),
        import('@ffmpeg/util'),
      ])

      ffmpegModulesRef.current = { toBlobURL }
      setLoadProgress(40)

      // Crear instancia de FFmpeg
      const ffmpeg = new FFmpeg()
      ffmpegRef.current = ffmpeg

      // Configurar logging (solo en desarrollo)
      if (import.meta.env.DEV) {
        ffmpeg.on('log', () => {})
      }

      ffmpeg.on('progress', ({ progress }) => {
        // progress es un valor entre 0 y 1
        setLoadProgress(40 + Math.round(progress * 50))
      })

      // Cargar core y WASM
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'
      setLoadProgress(50)

      const [coreURL, wasmURL] = await Promise.all([
        toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      ])

      setLoadProgress(80)

      await ffmpeg.load({ coreURL, wasmURL })

      setLoadProgress(100)
      setLoaded(true)
      setLoading(false)

      return true
    } catch (err) {
      console.error('[FFmpeg Lazy] Error:', err)
      setError(err.message)
      setLoading(false)
      setLoadProgress(0)
      return false
    }
  }, [loaded, loading])

  /**
   * Verifica si FFmpeg está listo y lo carga si no lo está
   */
  const ensureLoaded = useCallback(async () => {
    if (!loaded) {
      const success = await load()
      if (!success) {
        throw new Error('No se pudo cargar FFmpeg')
      }
    }
  }, [loaded, load])

  /**
   * Obtener módulos de FFmpeg (fetchFile, etc.)
   */
  const getUtils = useCallback(async () => {
    const { fetchFile } = await import('@ffmpeg/util')
    return { fetchFile }
  }, [])

  // ============ FUNCIONES DE PROCESAMIENTO ============

  const generateThumbnail = useCallback(
    async (videoFile, timeInSeconds = 1, resolution = '1280') => {
      await ensureLoaded()
      const { fetchFile } = await getUtils()
      const ffmpeg = ffmpegRef.current

      try {
        await ffmpeg.writeFile('input.mp4', await fetchFile(videoFile))

        await ffmpeg.exec([
          '-i',
          'input.mp4',
          '-ss',
          timeInSeconds.toString(),
          '-vframes',
          '1',
          '-vf',
          `scale=${resolution}:-1`,
          'thumbnail.jpg',
        ])

        const data = await ffmpeg.readFile('thumbnail.jpg')
        const blob = new Blob([data.buffer], { type: 'image/jpeg' })

        await ffmpeg.deleteFile('input.mp4')
        await ffmpeg.deleteFile('thumbnail.jpg')

        return new File([blob], 'thumbnail.jpg', { type: 'image/jpeg' })
      } catch (err) {
        console.error('[FFmpeg Lazy] Error generating thumbnail:', err)
        throw err
      }
    },
    [ensureLoaded, getUtils]
  )

  const getVideoDuration = useCallback(
    async (videoFile) => {
      await ensureLoaded()
      const { fetchFile } = await getUtils()
      const ffmpeg = ffmpegRef.current

      try {
        let duration = 0

        const logHandler = ({ message }) => {
          const match = message.match(/Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})/)
          if (match) {
            const hours = parseInt(match[1])
            const minutes = parseInt(match[2])
            const seconds = parseFloat(match[3])
            duration = hours * 3600 + minutes * 60 + seconds
          }
        }

        ffmpeg.on('log', logHandler)
        await ffmpeg.writeFile('input.mp4', await fetchFile(videoFile))

        try {
          await ffmpeg.exec(['-i', 'input.mp4'])
        } catch {
          // Expected to fail - no output specified
        }

        await ffmpeg.deleteFile('input.mp4')
        ffmpeg.off('log', logHandler)

        return Math.round(duration)
      } catch (err) {
        console.error('[FFmpeg Lazy] Error getting duration:', err)
        throw err
      }
    },
    [ensureLoaded, getUtils]
  )

  const getVideoResolution = useCallback(
    async (videoFile) => {
      await ensureLoaded()
      const { fetchFile } = await getUtils()
      const ffmpeg = ffmpegRef.current

      try {
        let width = 0
        let height = 0

        const logHandler = ({ message }) => {
          const match = message.match(/Stream.*Video.* (\d{2,5})x(\d{2,5})/)
          if (match) {
            width = parseInt(match[1])
            height = parseInt(match[2])
          }
        }

        ffmpeg.on('log', logHandler)
        await ffmpeg.writeFile('input.mp4', await fetchFile(videoFile))

        try {
          await ffmpeg.exec(['-i', 'input.mp4'])
        } catch {
          // Expected
        }

        await ffmpeg.deleteFile('input.mp4')
        ffmpeg.off('log', logHandler)

        return { width, height }
      } catch (err) {
        console.error('[FFmpeg Lazy] Error getting resolution:', err)
        throw err
      }
    },
    [ensureLoaded, getUtils]
  )

  const extractAudio = useCallback(
    async (videoFile) => {
      await ensureLoaded()
      const { fetchFile } = await getUtils()
      const ffmpeg = ffmpegRef.current

      try {
        await ffmpeg.writeFile('input.mp4', await fetchFile(videoFile))

        await ffmpeg.exec([
          '-i',
          'input.mp4',
          '-vn',
          '-acodec',
          'pcm_s16le',
          '-ar',
          '16000',
          '-ac',
          '1',
          'audio.wav',
        ])

        const data = await ffmpeg.readFile('audio.wav')
        const blob = new Blob([data.buffer], { type: 'audio/wav' })

        await ffmpeg.deleteFile('input.mp4')
        await ffmpeg.deleteFile('audio.wav')

        return new File([blob], 'audio.wav', { type: 'audio/wav' })
      } catch (err) {
        console.error('[FFmpeg Lazy] Error extracting audio:', err)
        throw err
      }
    },
    [ensureLoaded, getUtils]
  )

  const generateMultipleQualities = useCallback(
    async (videoFile, onProgress) => {
      await ensureLoaded()
      const { fetchFile } = await getUtils()
      const ffmpeg = ffmpegRef.current

      try {
        const qualities = {}
        const { height } = await getVideoResolution(videoFile)

        const qualitySettings = []
        if (height >= 1080) qualitySettings.push({ name: '1080p', height: 1080, bitrate: '5000k' })
        if (height >= 720) qualitySettings.push({ name: '720p', height: 720, bitrate: '2500k' })
        if (height >= 480) qualitySettings.push({ name: '480p', height: 480, bitrate: '1000k' })
        qualitySettings.push({ name: '360p', height: 360, bitrate: '600k' })

        await ffmpeg.writeFile('input.mp4', await fetchFile(videoFile))

        for (let i = 0; i < qualitySettings.length; i++) {
          const { name, height: targetHeight, bitrate } = qualitySettings[i]

          if (onProgress) {
            onProgress({ current: i + 1, total: qualitySettings.length, quality: name })
          }

          const outputName = `output_${name}.mp4`

          await ffmpeg.exec([
            '-i',
            'input.mp4',
            '-vf',
            `scale=-2:${targetHeight}`,
            '-c:v',
            'libx265',
            '-b:v',
            bitrate,
            '-preset',
            'ultrafast',
            '-c:a',
            'copy',
            '-movflags',
            '+faststart',
            outputName,
          ])

          const data = await ffmpeg.readFile(outputName)
          const blob = new Blob([data.buffer], { type: 'video/mp4' })
          qualities[name] = new File([blob], `video_${name}.mp4`, { type: 'video/mp4' })

          await ffmpeg.deleteFile(outputName)
        }

        await ffmpeg.deleteFile('input.mp4')
        return qualities
      } catch (err) {
        console.error('[FFmpeg Lazy] Error generating qualities:', err)
        throw err
      }
    },
    [ensureLoaded, getUtils, getVideoResolution]
  )

  /**
   * Liberar recursos de FFmpeg
   */
  const unload = useCallback(() => {
    if (ffmpegRef.current) {
      ffmpegRef.current = null
      ffmpegModulesRef.current = null
      setLoaded(false)
      setLoadProgress(0)
    }
  }, [])

  return {
    // Estado
    loaded,
    loading,
    error,
    loadProgress,

    // Control
    load,
    unload,

    // Funciones de procesamiento
    generateThumbnail,
    getVideoDuration,
    getVideoResolution,
    extractAudio,
    generateMultipleQualities,
  }
}

export default useFFmpegLazy
