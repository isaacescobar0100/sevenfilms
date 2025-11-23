import { useState, useRef, useEffect } from 'react'
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, RotateCcw } from 'lucide-react'

/**
 * Reproductor de video personalizado para posts
 * Diseño moderno con controles estilizados
 */
function PostVideoPlayer({ src, className = '' }) {
  const videoRef = useRef(null)
  const containerRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [muted, setMuted] = useState(true) // Muted por defecto como Instagram/TikTok
  const [showControls, setShowControls] = useState(true)
  const [buffered, setBuffered] = useState(0)
  const [isHovering, setIsHovering] = useState(false)
  const [hasEnded, setHasEnded] = useState(false)
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const controlsTimeoutRef = useRef(null)

  // Intersection Observer para autoplay cuando el video entra en el viewport
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsInView(entry.isIntersecting)
        })
      },
      {
        threshold: 0.5, // 50% del video debe ser visible
        rootMargin: '0px',
      }
    )

    observer.observe(container)

    return () => {
      observer.disconnect()
    }
  }, [])

  // Autoplay/pause basado en visibilidad
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (isInView && !hasEnded) {
      // Video entra en viewport - reproducir
      video.play().catch(() => {
        // Silenciar error si el navegador bloquea autoplay
      })
    } else {
      // Video sale del viewport - pausar
      video.pause()
    }
  }, [isInView, hasEnded])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
    }

    const handleDurationChange = () => {
      setDuration(video.duration)
    }

    const handleProgress = () => {
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1)
        setBuffered((bufferedEnd / video.duration) * 100)
      }
    }

    const handleEnded = () => {
      setPlaying(false)
      setHasEnded(true)
    }

    const handlePlay = () => {
      setPlaying(true)
      setHasEnded(false)
    }

    const handlePause = () => {
      setPlaying(false)
    }

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('durationchange', handleDurationChange)
    video.addEventListener('progress', handleProgress)
    video.addEventListener('ended', handleEnded)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('durationchange', handleDurationChange)
      video.removeEventListener('progress', handleProgress)
      video.removeEventListener('ended', handleEnded)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
    }
  }, [])

  // Auto-hide controls
  useEffect(() => {
    if (playing && !isHovering) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false)
      }, 2500)
    } else {
      setShowControls(true)
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
    }
  }, [playing, isHovering])

  const togglePlay = (e) => {
    e.stopPropagation()
    if (videoRef.current.paused) {
      videoRef.current.play()
    } else {
      videoRef.current.pause()
    }
  }

  const handleSeek = (e) => {
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    const pos = (e.clientX - rect.left) / rect.width
    videoRef.current.currentTime = pos * duration
  }

  const toggleMute = (e) => {
    e.stopPropagation()
    if (muted) {
      videoRef.current.muted = false
      videoRef.current.volume = volume
      setMuted(false)
    } else {
      videoRef.current.muted = true
      setMuted(true)
    }
  }

  const handleVolumeChange = (e) => {
    e.stopPropagation()
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    videoRef.current.volume = newVolume
    if (newVolume === 0) {
      setMuted(true)
      videoRef.current.muted = true
    } else {
      setMuted(false)
      videoRef.current.muted = false
    }
  }

  const handleReplay = (e) => {
    e.stopPropagation()
    videoRef.current.currentTime = 0
    videoRef.current.play()
    setHasEnded(false)
  }

  const handleFullscreen = async (e) => {
    e.stopPropagation()
    const container = containerRef.current
    if (!container) return

    try {
      if (!document.fullscreenElement) {
        await container.requestFullscreen()
        setIsFullscreen(true)
      } else {
        await document.exitFullscreen()
        setIsFullscreen(false)
      }
    } catch (err) {
      console.error('Error toggling fullscreen:', err)
    }
  }

  // Listener para detectar cambios de fullscreen (ej: presionar ESC)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div
      ref={containerRef}
      className={`relative bg-black group ${className}`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => {
        setIsHovering(false)
        setShowVolumeSlider(false)
      }}
      onMouseMove={() => setShowControls(true)}
    >
      {/* Video */}
      <video
        ref={videoRef}
        src={src}
        className="w-full max-h-[500px] object-contain cursor-pointer"
        playsInline
        muted={muted}
        preload="metadata"
        onClick={togglePlay}
      />

      {/* Overlay oscuro cuando no está reproduciendo */}
      <div
        className={`absolute inset-0 bg-black/20 transition-opacity duration-300 pointer-events-none ${
          playing && !showControls ? 'opacity-0' : 'opacity-100'
        }`}
      />

      {/* Botón de Play/Pause central */}
      {(!playing || showControls) && !hasEnded && (
        <button
          onClick={togglePlay}
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10
            w-16 h-16 rounded-full bg-black/60 backdrop-blur-sm
            flex items-center justify-center
            transition-all duration-300 hover:bg-black/80 hover:scale-110
            ${playing ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}
        >
          {playing ? (
            <Pause className="w-8 h-8 text-white" fill="white" />
          ) : (
            <Play className="w-8 h-8 text-white ml-1" fill="white" />
          )}
        </button>
      )}

      {/* Botón de Replay cuando termina */}
      {hasEnded && (
        <button
          onClick={handleReplay}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10
            w-16 h-16 rounded-full bg-black/60 backdrop-blur-sm
            flex items-center justify-center
            transition-all duration-300 hover:bg-black/80 hover:scale-110"
        >
          <RotateCcw className="w-8 h-8 text-white" />
        </button>
      )}

      {/* Controles inferiores */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-10 transition-all duration-300 ${
          showControls || !playing ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
        }`}
      >
        {/* Gradiente de fondo */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />

        {/* Barra de progreso */}
        <div className="relative px-3 pt-4">
          <div
            className="relative h-1 bg-white/30 rounded-full cursor-pointer group/progress"
            onClick={handleSeek}
          >
            {/* Buffer */}
            <div
              className="absolute h-full bg-white/40 rounded-full"
              style={{ width: `${buffered}%` }}
            />
            {/* Progreso */}
            <div
              className="absolute h-full bg-primary-500 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
            {/* Thumb */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg
                opacity-0 group-hover/progress:opacity-100 transition-opacity"
              style={{ left: `calc(${progress}% - 6px)` }}
            />
          </div>
        </div>

        {/* Controles */}
        <div className="relative flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2">
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="p-1.5 text-white hover:text-primary-400 transition-colors"
            >
              {playing ? (
                <Pause className="w-5 h-5" fill="currentColor" />
              ) : (
                <Play className="w-5 h-5" fill="currentColor" />
              )}
            </button>

            {/* Volumen */}
            <div
              className="relative flex items-center"
              onMouseEnter={() => setShowVolumeSlider(true)}
              onMouseLeave={() => setShowVolumeSlider(false)}
            >
              <button
                onClick={toggleMute}
                className="p-1.5 text-white hover:text-primary-400 transition-colors"
              >
                {muted || volume === 0 ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>

              {/* Slider de volumen */}
              <div
                className={`absolute left-full ml-1 flex items-center bg-black/80 rounded-full px-2 py-1
                  transition-all duration-200 ${
                    showVolumeSlider ? 'opacity-100 visible' : 'opacity-0 invisible'
                  }`}
              >
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={muted ? 0 : volume}
                  onChange={handleVolumeChange}
                  onClick={(e) => e.stopPropagation()}
                  className="w-16 h-1 appearance-none bg-white/30 rounded-full cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-3
                    [&::-webkit-slider-thumb]:h-3
                    [&::-webkit-slider-thumb]:bg-white
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:cursor-pointer"
                />
              </div>
            </div>

            {/* Tiempo */}
            <span className="text-white text-xs font-medium ml-1">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {/* Pantalla completa */}
            <button
              onClick={handleFullscreen}
              className="p-1.5 text-white hover:text-primary-400 transition-colors"
              title={isFullscreen ? "Salir de pantalla completa" : "Ver en pantalla completa"}
            >
              {isFullscreen ? (
                <Minimize className="w-5 h-5" />
              ) : (
                <Maximize className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Indicador de mute en la esquina */}
      {muted && playing && !showControls && (
        <button
          onClick={toggleMute}
          className="absolute top-3 right-3 z-10 p-2 bg-black/60 rounded-full text-white hover:bg-black/80 transition-colors"
        >
          <VolumeX className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}

export default PostVideoPlayer
