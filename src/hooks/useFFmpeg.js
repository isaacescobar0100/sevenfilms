import { useState, useEffect, useRef } from 'react'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'

export function useFFmpeg() {
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const ffmpegRef = useRef(new FFmpeg())

  useEffect(() => {
    loadFFmpeg()
  }, [])

  const loadFFmpeg = async () => {
    try {
      console.log('[FFmpeg] 🚀 Iniciando carga de FFmpeg...')
      setLoading(true)
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'
      const ffmpeg = ffmpegRef.current

      ffmpeg.on('log', ({ message }) => {
        console.log('[FFmpeg Log]:', message)
      })

      console.log('[FFmpeg] Descargando core desde:', baseURL)
      const coreURL = await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript')
      console.log('[FFmpeg] ✅ Core descargado')

      console.log('[FFmpeg] Descargando WASM...')
      const wasmURL = await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm')
      console.log('[FFmpeg] ✅ WASM descargado')

      console.log('[FFmpeg] Cargando FFmpeg...')
      await ffmpeg.load({
        coreURL,
        wasmURL,
      })

      console.log('[FFmpeg] 🎉 FFmpeg cargado exitosamente!')
      setLoaded(true)
      setLoading(false)
    } catch (err) {
      console.error('[FFmpeg] ❌ Error loading FFmpeg:', err)
      console.error('[FFmpeg] Error details:', err.message)
      console.error('[FFmpeg] Error stack:', err.stack)
      setError(err.message)
      setLoading(false)
    }
  }

  // Generar thumbnail del video
  const generateThumbnail = async (videoFile, timeInSeconds = 1, resolution = '1280') => {
    if (!loaded) {
      throw new Error('FFmpeg no está cargado')
    }

    try {
      const ffmpeg = ffmpegRef.current

      // Escribir el archivo de video en el sistema de archivos virtual
      await ffmpeg.writeFile('input.mp4', await fetchFile(videoFile))

      // Extraer un frame como thumbnail con la resolución especificada
      await ffmpeg.exec([
        '-i', 'input.mp4',
        '-ss', timeInSeconds.toString(),
        '-vframes', '1',
        '-vf', `scale=${resolution}:-1`,
        'thumbnail.jpg'
      ])

      // Leer el thumbnail generado
      const data = await ffmpeg.readFile('thumbnail.jpg')
      const blob = new Blob([data.buffer], { type: 'image/jpeg' })

      // Limpiar archivos temporales
      await ffmpeg.deleteFile('input.mp4')
      await ffmpeg.deleteFile('thumbnail.jpg')

      return new File([blob], 'thumbnail.jpg', { type: 'image/jpeg' })
    } catch (err) {
      console.error('Error generating thumbnail:', err)
      throw err
    }
  }

  // Obtener resolución del video
  const getVideoResolution = async (videoFile) => {
    if (!loaded) {
      throw new Error('FFmpeg no está cargado')
    }

    try {
      const ffmpeg = ffmpegRef.current
      let width = 0
      let height = 0

      // Escuchar logs para obtener la resolución
      const logHandler = ({ message }) => {
        const match = message.match(/Stream.*Video.* (\d{2,5})x(\d{2,5})/)
        if (match) {
          width = parseInt(match[1])
          height = parseInt(match[2])
        }
      }

      ffmpeg.on('log', logHandler)

      await ffmpeg.writeFile('input.mp4', await fetchFile(videoFile))

      // Ejecutar ffmpeg solo para obtener info
      try {
        await ffmpeg.exec(['-i', 'input.mp4'])
      } catch (err) {
        // Es esperado que falle porque no hay output especificado
      }

      await ffmpeg.deleteFile('input.mp4')
      ffmpeg.off('log', logHandler)

      return { width, height }
    } catch (err) {
      console.error('Error getting video resolution:', err)
      throw err
    }
  }

  // Obtener duración del video
  const getVideoDuration = async (videoFile) => {
    if (!loaded) {
      throw new Error('FFmpeg no está cargado')
    }

    try {
      const ffmpeg = ffmpegRef.current
      let duration = 0

      // Escuchar logs para obtener la duración
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

      // Ejecutar ffmpeg solo para obtener info (termina rápido con error pero obtiene la duración)
      try {
        await ffmpeg.exec(['-i', 'input.mp4'])
      } catch (err) {
        // Es esperado que falle porque no hay output especificado
      }

      await ffmpeg.deleteFile('input.mp4')
      ffmpeg.off('log', logHandler)

      return Math.round(duration)
    } catch (err) {
      console.error('Error getting video duration:', err)
      throw err
    }
  }

  // Extraer audio del video
  const extractAudio = async (videoFile) => {
    if (!loaded) {
      throw new Error('FFmpeg no está cargado')
    }

    try {
      const ffmpeg = ffmpegRef.current

      await ffmpeg.writeFile('input.mp4', await fetchFile(videoFile))

      // Extraer audio como WAV
      await ffmpeg.exec([
        '-i', 'input.mp4',
        '-vn',
        '-acodec', 'pcm_s16le',
        '-ar', '16000',
        '-ac', '1',
        'audio.wav'
      ])

      const data = await ffmpeg.readFile('audio.wav')
      const blob = new Blob([data.buffer], { type: 'audio/wav' })

      await ffmpeg.deleteFile('input.mp4')
      await ffmpeg.deleteFile('audio.wav')

      return new File([blob], 'audio.wav', { type: 'audio/wav' })
    } catch (err) {
      console.error('Error extracting audio:', err)
      throw err
    }
  }

  // Comprimir video (opcional)
  const compressVideo = async (videoFile, quality = 28) => {
    if (!loaded) {
      throw new Error('FFmpeg no está cargado')
    }

    try {
      const ffmpeg = ffmpegRef.current

      await ffmpeg.writeFile('input.mp4', await fetchFile(videoFile))

      // Comprimir con H.264 usando CRF (Constant Rate Factor)
      // CRF: 0 = sin pérdida, 51 = peor calidad. 23 es default, 28 es bueno para web
      await ffmpeg.exec([
        '-i', 'input.mp4',
        '-c:v', 'libx264',
        '-crf', quality.toString(),
        '-preset', 'medium',
        '-c:a', 'aac',
        '-b:a', '128k',
        'output.mp4'
      ])

      const data = await ffmpeg.readFile('output.mp4')
      const blob = new Blob([data.buffer], { type: 'video/mp4' })

      await ffmpeg.deleteFile('input.mp4')
      await ffmpeg.deleteFile('output.mp4')

      return new File([blob], videoFile.name, { type: 'video/mp4' })
    } catch (err) {
      console.error('Error compressing video:', err)
      throw err
    }
  }

  // Generar múltiples resoluciones del video
  const generateMultipleQualities = async (videoFile, onProgress) => {
    if (!loaded) {
      throw new Error('FFmpeg no está cargado')
    }

    try {
      console.log('[FFmpeg] 🎬 Iniciando generación de múltiples calidades...')
      console.log('[FFmpeg] Archivo:', videoFile.name, 'Tamaño:', (videoFile.size / 1024 / 1024).toFixed(2), 'MB')

      const ffmpeg = ffmpegRef.current
      const qualities = {}

      // Obtener resolución original del video
      console.log('[FFmpeg] Obteniendo resolución del video...')
      const { width, height } = await getVideoResolution(videoFile)
      console.log('[FFmpeg] Resolución original:', width, 'x', height)

      // Definir las calidades disponibles basadas en la resolución original
      const qualitySettings = []

      if (height >= 1080) {
        qualitySettings.push({ name: '1080p', height: 1080, bitrate: '5000k' })
      }
      if (height >= 720) {
        qualitySettings.push({ name: '720p', height: 720, bitrate: '2500k' })
      }
      if (height >= 480) {
        qualitySettings.push({ name: '480p', height: 480, bitrate: '1000k' })
      }
      qualitySettings.push({ name: '360p', height: 360, bitrate: '600k' })

      console.log('[FFmpeg] 📊 Calidades a generar:', qualitySettings.map(q => q.name).join(', '))

      // Escribir el archivo original
      console.log('[FFmpeg] Cargando video en sistema virtual...')
      await ffmpeg.writeFile('input.mp4', await fetchFile(videoFile))
      console.log('[FFmpeg] ✅ Video cargado en sistema virtual')

      // Generar cada calidad
      for (let i = 0; i < qualitySettings.length; i++) {
        const { name, height: targetHeight, bitrate } = qualitySettings[i]
        console.log(`[FFmpeg] 🔄 Procesando calidad ${name} (${i + 1}/${qualitySettings.length})...`)

        if (onProgress) {
          onProgress({ current: i + 1, total: qualitySettings.length, quality: name })
        }

        const outputName = `output_${name}.mp4`

        // IMPORTANTE: FFmpeg.wasm NO soporta libx264 ni aac
        // Usar libx265 (o mpeg4) y copiar audio original
        console.log(`[FFmpeg] Ejecutando FFmpeg con codec libx265 para ${name}...`)
        await ffmpeg.exec([
          '-i', 'input.mp4',
          '-vf', `scale=-2:${targetHeight}`,
          '-c:v', 'libx265',    // Usar libx265 (disponible en FFmpeg.wasm)
          '-b:v', bitrate,
          '-preset', 'ultrafast', // ultrafast para procesar más rápido
          '-c:a', 'copy',       // Copiar audio sin recodificar (más rápido)
          '-movflags', '+faststart', // Optimizar para streaming web
          outputName
        ])
        console.log(`[FFmpeg] ✅ Calidad ${name} procesada exitosamente`)

        const data = await ffmpeg.readFile(outputName)
        const blob = new Blob([data.buffer], { type: 'video/mp4' })
        qualities[name] = new File([blob], `video_${name}.mp4`, { type: 'video/mp4' })
        console.log(`[FFmpeg] ✅ Archivo ${name} creado:`, (blob.size / 1024 / 1024).toFixed(2), 'MB')

        // Limpiar archivo temporal
        await ffmpeg.deleteFile(outputName)
      }

      // Limpiar archivo de entrada
      await ffmpeg.deleteFile('input.mp4')

      console.log('[FFmpeg] 🎉 ¡Todas las calidades generadas exitosamente!', Object.keys(qualities))
      return qualities
    } catch (err) {
      console.error('[FFmpeg] ❌ Error generating multiple qualities:', err)
      console.error('[FFmpeg] Error details:', err.message)
      console.error('[FFmpeg] Error stack:', err.stack)
      throw err
    }
  }

  return {
    loaded,
    loading,
    error,
    generateThumbnail,
    getVideoDuration,
    getVideoResolution,
    extractAudio,
    compressVideo,
    generateMultipleQualities,
  }
}
