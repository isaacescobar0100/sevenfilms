import { useState, useRef } from 'react'
import { pipeline } from '@xenova/transformers'
import { captureError } from '../lib/sentry'

/**
 * Hook para generar subtítulos usando Whisper AI localmente
 * Usa @xenova/transformers para procesar el audio en el navegador
 *
 * IMPORTANTE:
 * - La primera vez descarga ~40MB (modelo tiny)
 * - El procesamiento puede tardar varios minutos
 * - Todo se procesa localmente (privacidad total)
 */
export function useWhisperAI() {
  const [loading, setLoading] = useState(false)
  const [loadingModel, setLoadingModel] = useState(false)
  const [progress, setProgress] = useState(0)
  const [modelLoaded, setModelLoaded] = useState(false)
  const [error, setError] = useState(null)
  const pipelineRef = useRef(null)

  // Cargar el modelo de Whisper
  const loadModel = async () => {
    if (pipelineRef.current) return pipelineRef.current

    try {
      setLoadingModel(true)
      setError(null)

      // Usar modelo tiny (más rápido, menos preciso)
      // Otras opciones: 'Xenova/whisper-base', 'Xenova/whisper-small'
      pipelineRef.current = await pipeline(
        'automatic-speech-recognition',
        'Xenova/whisper-tiny',
        {
          // Opciones de configuración
          quantized: true, // Usa versión optimizada
        }
      )

      setModelLoaded(true)
      setLoadingModel(false)

      return pipelineRef.current
    } catch (err) {
      console.error('Error loading Whisper model:', err)
      const errorMessage = 'Error al cargar el modelo de IA: ' + err.message
      setError(errorMessage)
      setLoadingModel(false)

      // Capturar en Sentry
      captureError(err, {
        action: 'load_whisper_model',
        errorType: 'model_loading_error',
      })

      throw err
    }
  }

  // Generar subtítulos desde un archivo de video
  const generateSubtitles = async (videoFile, options = {}) => {
    const {
      language = 'spanish', // Idioma del audio
      chunkLengthSeconds = 30, // Procesar en chunks de 30 segundos
      onChunkProgress = null, // Callback para reportar progreso por chunk
    } = options

    try {
      setLoading(true)
      setProgress(0)
      setError(null)

      // Cargar modelo si no está cargado
      const transcriber = await loadModel()

      // Extraer audio del video
      const audioBlob = await extractAudioFromVideo(videoFile)

      // Convertir blob a formato compatible
      const audioUrl = URL.createObjectURL(audioBlob)

      // Transcribir el audio
      const result = await transcriber(audioUrl, {
        language,
        chunk_length_s: chunkLengthSeconds,
        return_timestamps: true, // Necesario para subtítulos
        callback_function: (data) => {
          // Callback para reportar progreso
          if (data.status === 'progress') {
            const progressPercent = Math.round((data.progress || 0) * 100)
            setProgress(progressPercent)
          }

          if (onChunkProgress) {
            onChunkProgress(data)
          }
        },
      })

      // Limpiar URL temporal
      URL.revokeObjectURL(audioUrl)

      // Convertir resultado a formato SRT
      const srtContent = convertToSRT(result)
      const srtBlob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' })
      const srtFile = new File([srtBlob], 'subtitles.srt', { type: 'text/plain' })

      setLoading(false)
      setProgress(100)

      return srtFile
    } catch (err) {
      console.error('Error generating subtitles:', err)
      const errorMessage = 'Error al generar subtítulos: ' + (err.message || JSON.stringify(err))
      setError(errorMessage)
      setLoading(false)

      // Capturar en Sentry con contexto
      captureError(err, {
        action: 'generate_subtitles',
        errorType: 'subtitle_generation_error',
        videoFileName: videoFile.name,
        videoSize: videoFile.size,
        language,
      })

      throw new Error(errorMessage)
    }
  }

  // Extraer audio de un archivo de video
  // NOTA: Por ahora retornamos el video directamente
  // Transformers.js puede procesar el video directamente
  const extractAudioFromVideo = async (videoFile) => {
    // Transformers.js puede procesar video directamente
    // No necesitamos extraer el audio manualmente
    return videoFile
  }

  // Convertir resultado de Whisper a formato SRT
  const convertToSRT = (whisperResult) => {
    if (!whisperResult.chunks || whisperResult.chunks.length === 0) {
      // Si no hay chunks, usar el texto completo
      return `1\n00:00:00,000 --> 00:00:10,000\n${whisperResult.text || 'Sin transcripción'}\n`
    }

    return whisperResult.chunks
      .map((chunk, index) => {
        const startTime = formatSRTTime(chunk.timestamp[0] || 0)
        const endTime = formatSRTTime(chunk.timestamp[1] || chunk.timestamp[0] + 5)
        const text = chunk.text.trim()

        return `${index + 1}\n${startTime} --> ${endTime}\n${text}\n`
      })
      .join('\n')
  }

  // Formatear tiempo al formato SRT (HH:MM:SS,mmm)
  const formatSRTTime = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    const milliseconds = Math.floor((seconds % 1) * 1000)

    return `${pad(hours)}:${pad(minutes)}:${pad(secs)},${pad(milliseconds, 3)}`
  }

  const pad = (num, size = 2) => {
    let s = num.toString()
    while (s.length < size) s = '0' + s
    return s
  }

  return {
    loading,
    loadingModel,
    modelLoaded,
    progress,
    error,
    generateSubtitles,
    loadModel,
  }
}
