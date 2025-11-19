import { useState } from 'react'

export function useSubtitles() {
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState(0)

  // Generar subtítulos usando Web Speech API
  const generateSubtitles = async (videoFile) => {
    return new Promise((resolve, reject) => {
      setGenerating(true)
      setProgress(0)

      const video = document.createElement('video')
      video.src = URL.createObjectURL(videoFile)

      // Verificar si el navegador soporta Web Speech API
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

      if (!SpeechRecognition) {
        setGenerating(false)
        reject(new Error('Tu navegador no soporta reconocimiento de voz'))
        return
      }

      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = false
      recognition.lang = 'es-ES'

      const subtitles = []
      let startTime = 0

      recognition.onresult = (event) => {
        const result = event.results[event.results.length - 1]
        const transcript = result[0].transcript

        subtitles.push({
          start: startTime,
          end: video.currentTime,
          text: transcript.trim()
        })

        startTime = video.currentTime
        setProgress(Math.min((video.currentTime / video.duration) * 100, 100))
      }

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        setGenerating(false)
        reject(new Error('Error al generar subtítulos: ' + event.error))
      }

      recognition.onend = () => {
        setGenerating(false)
        setProgress(100)

        // Convertir a formato SRT
        const srtContent = convertToSRT(subtitles)
        const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' })
        const file = new File([blob], 'subtitles.srt', { type: 'text/plain' })

        URL.revokeObjectURL(video.src)
        resolve(file)
      }

      video.onloadedmetadata = () => {
        recognition.start()
        video.play()
      }

      video.ontimeupdate = () => {
        setProgress(Math.min((video.currentTime / video.duration) * 100, 100))
      }

      video.onended = () => {
        recognition.stop()
      }

      video.onerror = () => {
        setGenerating(false)
        reject(new Error('Error al cargar el video'))
      }
    })
  }

  // Convertir subtítulos a formato SRT
  const convertToSRT = (subtitles) => {
    return subtitles.map((subtitle, index) => {
      const startTime = formatSRTTime(subtitle.start)
      const endTime = formatSRTTime(subtitle.end)

      return `${index + 1}\n${startTime} --> ${endTime}\n${subtitle.text}\n`
    }).join('\n')
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
    generating,
    progress,
    generateSubtitles,
  }
}
