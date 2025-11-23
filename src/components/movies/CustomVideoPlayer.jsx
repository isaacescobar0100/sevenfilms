import { useState, useRef, useEffect } from 'react'
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Subtitles, Settings, RotateCcw, SkipBack, SkipForward } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'

/**
 * Reproductor de video personalizado para películas
 * Diseño moderno con controles estilizados estilo Netflix/YouTube
 */
function CustomVideoPlayer({ movie }) {
  const videoRef = useRef(null)
  const containerRef = useRef(null)
  const { user } = useAuthStore()
  const [playing, setPlaying] = useState(true)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [muted, setMuted] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [showSubtitles, setShowSubtitles] = useState(true)
  const [buffered, setBuffered] = useState(0)
  const [showSettings, setShowSettings] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [quality, setQuality] = useState('auto')
  const [isHovering, setIsHovering] = useState(false)
  const [hasEnded, setHasEnded] = useState(false)
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)
  const controlsTimeoutRef = useRef(null)
  const viewTrackedRef = useRef(false)
  const maxWatchedRef = useRef(0)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)

      // Trackear porcentaje visto
      if (video.duration > 0 && user) {
        const percentageWatched = Math.floor((video.currentTime / video.duration) * 100)

        if (percentageWatched > maxWatchedRef.current) {
          maxWatchedRef.current = percentageWatched
        }

        if (percentageWatched >= 70 && !viewTrackedRef.current) {
          viewTrackedRef.current = true
          trackMovieView(percentageWatched)
        }
      }
    }

    const handleDurationChange = () => setDuration(video.duration)
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

      if (user && !viewTrackedRef.current && maxWatchedRef.current > 0) {
        trackMovieView(maxWatchedRef.current)
      }
    }
  }, [user, movie.id])

  // Auto-hide controls
  useEffect(() => {
    if (playing && !isHovering && !showSettings) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false)
      }, 3000)
    } else {
      setShowControls(true)
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
    }
  }, [playing, isHovering, showSettings])

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const trackMovieView = async (percentageWatched) => {
    if (!user || !movie.id) return

    try {
      await supabase.rpc('track_movie_view_improved', {
        p_movie_id: movie.id,
        p_user_id: user.id,
        p_percentage_watched: percentageWatched,
      })
    } catch (err) {
      console.error('Error tracking movie view:', err)
    }
  }

  const togglePlay = (e) => {
    e?.stopPropagation()
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

  const handleVolumeChange = (e) => {
    e.stopPropagation()
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    videoRef.current.volume = newVolume
    if (newVolume === 0) {
      setMuted(true)
    } else {
      setMuted(false)
    }
  }

  const toggleMute = (e) => {
    e?.stopPropagation()
    if (muted) {
      videoRef.current.volume = volume
      setMuted(false)
    } else {
      videoRef.current.volume = 0
      setMuted(true)
    }
  }

  const toggleFullscreen = (e) => {
    e?.stopPropagation()
    if (!fullscreen) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen()
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }
  }

  const handleReplay = (e) => {
    e?.stopPropagation()
    videoRef.current.currentTime = 0
    videoRef.current.play()
    setHasEnded(false)
  }

  const skipTime = (seconds) => {
    videoRef.current.currentTime = Math.min(
      Math.max(0, videoRef.current.currentTime + seconds),
      duration
    )
  }

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00'
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const toggleSubtitles = (e) => {
    e?.stopPropagation()
    const track = videoRef.current.textTracks[0]
    if (track) {
      track.mode = showSubtitles ? 'hidden' : 'showing'
      setShowSubtitles(!showSubtitles)
    }
  }

  const changePlaybackRate = (rate) => {
    videoRef.current.playbackRate = rate
    setPlaybackRate(rate)
  }

  const changeQuality = (newQuality) => {
    const video = videoRef.current
    if (!video) return

    const currentTimeBackup = video.currentTime
    const wasPlaying = !video.paused

    let videoUrl = movie.video_url

    if (newQuality === '1080p' && movie.video_1080p_url) {
      videoUrl = movie.video_1080p_url
    } else if (newQuality === '720p' && movie.video_720p_url) {
      videoUrl = movie.video_720p_url
    } else if (newQuality === '480p' && movie.video_480p_url) {
      videoUrl = movie.video_480p_url
    } else if (newQuality === '360p' && movie.video_360p_url) {
      videoUrl = movie.video_360p_url
    } else if (newQuality === 'auto') {
      videoUrl = movie.video_1080p_url || movie.video_720p_url || movie.video_480p_url || movie.video_360p_url || movie.video_url
    }

    video.src = videoUrl
    video.currentTime = currentTimeBackup

    if (wasPlaying) {
      video.play().catch(err => console.error('Error al reproducir:', err))
    }

    setQuality(newQuality)
    setShowSettings(false)
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div
      ref={containerRef}
      className="relative bg-black rounded-lg overflow-hidden group"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => {
        setIsHovering(false)
        setShowVolumeSlider(false)
        setShowSettings(false)
      }}
      onMouseMove={() => setShowControls(true)}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={movie.video_url}
        autoPlay
        crossOrigin="anonymous"
        className="w-full max-h-[50vh] md:max-h-[70vh] object-contain bg-black cursor-pointer"
        onClick={togglePlay}
      >
        {movie.subtitle_url && (
          <track
            kind="subtitles"
            src={movie.subtitle_url}
            srcLang="es"
            label="Español"
            default
          />
        )}
      </video>

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
            w-20 h-20 rounded-full bg-black/60 backdrop-blur-sm
            flex items-center justify-center
            transition-all duration-300 hover:bg-black/80 hover:scale-110
            ${playing ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}
        >
          {playing ? (
            <Pause className="w-10 h-10 text-white" fill="white" />
          ) : (
            <Play className="w-10 h-10 text-white ml-1" fill="white" />
          )}
        </button>
      )}

      {/* Botón de Replay cuando termina */}
      {hasEnded && (
        <button
          onClick={handleReplay}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10
            w-20 h-20 rounded-full bg-black/60 backdrop-blur-sm
            flex items-center justify-center
            transition-all duration-300 hover:bg-black/80 hover:scale-110"
        >
          <RotateCcw className="w-10 h-10 text-white" />
        </button>
      )}

      {/* Skip buttons (laterales) */}
      {showControls && !hasEnded && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); skipTime(-10) }}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10
              w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm
              flex items-center justify-center opacity-0 group-hover:opacity-100
              transition-all duration-300 hover:bg-black/60"
          >
            <SkipBack className="w-6 h-6 text-white" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); skipTime(10) }}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10
              w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm
              flex items-center justify-center opacity-0 group-hover:opacity-100
              transition-all duration-300 hover:bg-black/60"
          >
            <SkipForward className="w-6 h-6 text-white" />
          </button>
        </>
      )}

      {/* Controles inferiores */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-10 transition-all duration-300 ${
          showControls || !playing ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
        }`}
      >
        {/* Gradiente de fondo */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none" />

        {/* Título de la película (solo en fullscreen) */}
        {fullscreen && (
          <div className="relative px-4 pt-2 pb-1">
            <h3 className="text-white font-semibold text-lg truncate">{movie.title}</h3>
          </div>
        )}

        {/* Barra de progreso */}
        <div className="relative px-4 pt-4">
          <div
            className="relative h-1.5 bg-white/30 rounded-full cursor-pointer group/progress hover:h-2 transition-all"
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
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-primary-500 rounded-full shadow-lg
                opacity-0 group-hover/progress:opacity-100 transition-opacity"
              style={{ left: `calc(${progress}% - 8px)` }}
            />
          </div>
        </div>

        {/* Controles */}
        <div className="relative flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="p-2 text-white hover:text-primary-400 transition-colors"
            >
              {playing ? (
                <Pause className="w-6 h-6" fill="currentColor" />
              ) : (
                <Play className="w-6 h-6" fill="currentColor" />
              )}
            </button>

            {/* Skip back */}
            <button
              onClick={(e) => { e.stopPropagation(); skipTime(-10) }}
              className="p-1.5 text-white hover:text-primary-400 transition-colors hidden sm:block"
              title="Retroceder 10s"
            >
              <SkipBack className="w-5 h-5" />
            </button>

            {/* Skip forward */}
            <button
              onClick={(e) => { e.stopPropagation(); skipTime(10) }}
              className="p-1.5 text-white hover:text-primary-400 transition-colors hidden sm:block"
              title="Adelantar 10s"
            >
              <SkipForward className="w-5 h-5" />
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
                className={`absolute left-full ml-1 flex items-center bg-black/80 rounded-full px-3 py-1.5
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
                  className="w-20 h-1 appearance-none bg-white/30 rounded-full cursor-pointer
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
            <span className="text-white text-sm font-medium ml-2">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Velocidad de reproducción */}
            {playbackRate !== 1 && (
              <span className="text-primary-400 text-xs font-semibold px-2 py-0.5 bg-primary-500/20 rounded">
                {playbackRate}x
              </span>
            )}

            {/* Subtítulos */}
            {movie.subtitle_url && (
              <button
                onClick={toggleSubtitles}
                className={`p-2 rounded transition-colors ${
                  showSubtitles
                    ? 'bg-primary-600 text-white'
                    : 'text-white hover:text-primary-400'
                }`}
                title={showSubtitles ? 'Ocultar subtítulos' : 'Mostrar subtítulos'}
              >
                <Subtitles className="w-5 h-5" />
              </button>
            )}

            {/* Settings */}
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings) }}
                className={`p-2 rounded transition-colors ${
                  showSettings
                    ? 'bg-primary-600 text-white'
                    : 'text-white hover:text-primary-400'
                }`}
                title="Configuración"
              >
                <Settings className="w-5 h-5" />
              </button>

              {/* Settings Panel */}
              {showSettings && (
                <div
                  className="absolute bottom-full right-0 mb-2 bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-xl shadow-2xl p-4 min-w-[280px]"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Playback Speed */}
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-white mb-3">Velocidad</h4>
                    <div className="flex flex-wrap gap-2">
                      {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                        <button
                          key={rate}
                          onClick={() => changePlaybackRate(rate)}
                          className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
                            playbackRate === rate
                              ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30'
                              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                          }`}
                        >
                          {rate === 1 ? 'Normal' : `${rate}x`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Video Quality */}
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-3">Calidad</h4>
                    <div className="space-y-1">
                      <button
                        onClick={() => changeQuality('auto')}
                        className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-all flex items-center justify-between ${
                          quality === 'auto'
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        <span>Automático</span>
                        {quality === 'auto' && <span className="text-xs opacity-70">Recomendado</span>}
                      </button>

                      {movie.video_1080p_url && (
                        <button
                          onClick={() => changeQuality('1080p')}
                          className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-all ${
                            quality === '1080p'
                              ? 'bg-primary-600 text-white'
                              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                          }`}
                        >
                          1080p <span className="text-xs opacity-70">Full HD</span>
                        </button>
                      )}

                      {movie.video_720p_url && (
                        <button
                          onClick={() => changeQuality('720p')}
                          className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-all ${
                            quality === '720p'
                              ? 'bg-primary-600 text-white'
                              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                          }`}
                        >
                          720p <span className="text-xs opacity-70">HD</span>
                        </button>
                      )}

                      {movie.video_480p_url && (
                        <button
                          onClick={() => changeQuality('480p')}
                          className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-all ${
                            quality === '480p'
                              ? 'bg-primary-600 text-white'
                              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                          }`}
                        >
                          480p <span className="text-xs opacity-70">SD</span>
                        </button>
                      )}

                      {movie.video_360p_url && (
                        <button
                          onClick={() => changeQuality('360p')}
                          className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-all ${
                            quality === '360p'
                              ? 'bg-primary-600 text-white'
                              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                          }`}
                        >
                          360p
                        </button>
                      )}

                      {!movie.video_1080p_url && !movie.video_720p_url && !movie.video_480p_url && !movie.video_360p_url && (
                        <p className="text-xs text-gray-400 px-3 py-2">
                          Solo calidad original disponible
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-2 text-white hover:text-primary-400 transition-colors"
              title={fullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
            >
              {fullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Indicador de mute en la esquina */}
      {muted && playing && !showControls && (
        <button
          onClick={toggleMute}
          className="absolute top-4 right-4 z-10 p-2 bg-black/60 rounded-full text-white hover:bg-black/80 transition-colors"
        >
          <VolumeX className="w-5 h-5" />
        </button>
      )}
    </div>
  )
}

export default CustomVideoPlayer
