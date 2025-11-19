import { useState, useRef, useEffect } from 'react'
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Subtitles, Settings } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'

function CustomVideoPlayer({ movie }) {
  const videoRef = useRef(null)
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
  const controlsTimeoutRef = useRef(null)
  const viewTrackedRef = useRef(false) // Para trackear si ya se registró la vista
  const maxWatchedRef = useRef(0) // Guardar el % máximo visto

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)

      // Trackear porcentaje visto
      if (video.duration > 0 && user) {
        const percentageWatched = Math.floor((video.currentTime / video.duration) * 100)

        // Actualizar el máximo % visto
        if (percentageWatched > maxWatchedRef.current) {
          maxWatchedRef.current = percentageWatched
        }

        // Si alcanzó el 70% y no se ha trackeado, registrar vista completa
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

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('durationchange', handleDurationChange)
    video.addEventListener('progress', handleProgress)

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('durationchange', handleDurationChange)
      video.removeEventListener('progress', handleProgress)

      // Al desmontar, enviar el máximo % visto si no se había trackeado
      if (user && !viewTrackedRef.current && maxWatchedRef.current > 0) {
        trackMovieView(maxWatchedRef.current)
      }
    }
  }, [user, movie.id])

  // Función para trackear vista con sistema mejorado
  const trackMovieView = async (percentageWatched) => {
    if (!user || !movie.id) return

    try {
      const { data, error } = await supabase.rpc('track_movie_view_improved', {
        p_movie_id: movie.id,
        p_user_id: user.id,
        p_percentage_watched: percentageWatched,
      })

      if (error) {
        console.error('Error tracking movie view:', error)
        return
      }

      // Log del resultado (opcional, para debugging)
      if (data && !data.is_owner) {
        console.log('View tracked:', {
          isNewView: data.is_new_view,
          isNewCompletedView: data.is_new_completed_view,
          percentage: data.percentage_watched
        })
      }
    } catch (err) {
      console.error('Error tracking movie view:', err)
    }
  }

  const togglePlay = () => {
    if (videoRef.current.paused) {
      videoRef.current.play()
      setPlaying(true)
    } else {
      videoRef.current.pause()
      setPlaying(false)
    }
  }

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const pos = (e.clientX - rect.left) / rect.width
    videoRef.current.currentTime = pos * duration
  }

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    videoRef.current.volume = newVolume
    if (newVolume === 0) {
      setMuted(true)
    } else {
      setMuted(false)
    }
  }

  const toggleMute = () => {
    if (muted) {
      videoRef.current.volume = volume
      setMuted(false)
    } else {
      videoRef.current.volume = 0
      setMuted(true)
    }
  }

  const toggleFullscreen = () => {
    if (!fullscreen) {
      if (videoRef.current.parentElement.requestFullscreen) {
        videoRef.current.parentElement.requestFullscreen()
      }
      setFullscreen(true)
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
      setFullscreen(false)
    }
  }

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleMouseMove = () => {
    setShowControls(true)
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (playing) {
        setShowControls(false)
      }
    }, 3000)
  }

  const toggleSubtitles = () => {
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

    // Guardar el tiempo actual y estado de reproducción
    const currentTimeBackup = video.currentTime
    const wasPlaying = !video.paused

    // Determinar la URL del video según la calidad seleccionada
    let videoUrl = movie.video_url // Original (mayor calidad disponible)

    if (newQuality === '1080p' && movie.video_1080p_url) {
      videoUrl = movie.video_1080p_url
    } else if (newQuality === '720p' && movie.video_720p_url) {
      videoUrl = movie.video_720p_url
    } else if (newQuality === '480p' && movie.video_480p_url) {
      videoUrl = movie.video_480p_url
    } else if (newQuality === '360p' && movie.video_360p_url) {
      videoUrl = movie.video_360p_url
    } else if (newQuality === 'auto') {
      // Auto: seleccionar la mejor calidad disponible
      videoUrl = movie.video_1080p_url || movie.video_720p_url || movie.video_480p_url || movie.video_360p_url || movie.video_url
    }

    // Cambiar la fuente del video
    video.src = videoUrl
    video.currentTime = currentTimeBackup

    // Continuar reproducción si estaba reproduciéndose
    if (wasPlaying) {
      video.play().catch(err => console.error('Error al reproducir:', err))
    }

    setQuality(newQuality)
  }

  return (
    <div
      className="relative bg-black rounded-lg overflow-hidden group"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => playing && setShowControls(false)}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={movie.video_url}
        autoPlay
        crossOrigin="anonymous"
        className="w-full max-h-[50vh] md:max-h-[60vh] object-contain bg-black"
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

      {/* Play/Pause Overlay */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ opacity: !playing || showControls ? 1 : 0, transition: 'opacity 0.3s' }}
      >
        {!playing && (
          <div className="bg-black bg-opacity-50 rounded-full p-6">
            <Play className="h-16 w-16 text-white" />
          </div>
        )}
      </div>

      {/* Controls */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-4 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Progress Bar */}
        <div className="mb-4">
          <div
            className="w-full h-1.5 bg-gray-600 rounded-full cursor-pointer relative group/progress"
            onClick={handleSeek}
          >
            {/* Buffered */}
            <div
              className="absolute h-full bg-gray-500 rounded-full"
              style={{ width: `${buffered}%` }}
            />
            {/* Progress */}
            <div
              className="absolute h-full bg-primary-600 rounded-full"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
            {/* Hover Effect */}
            <div className="absolute inset-0 flex items-center opacity-0 group-hover/progress:opacity-100">
              <div
                className="h-3 w-3 bg-primary-600 rounded-full shadow-lg"
                style={{ marginLeft: `${(currentTime / duration) * 100}%` }}
              />
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-300 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="text-white hover:text-primary-600 transition-colors"
            >
              {playing ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
            </button>

            {/* Volume */}
            <div className="flex items-center space-x-2 group/volume">
              <button
                onClick={toggleMute}
                className="text-white hover:text-primary-600 transition-colors"
              >
                {muted || volume === 0 ? (
                  <VolumeX className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={muted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-0 group-hover/volume:w-20 transition-all duration-300 accent-primary-600"
              />
            </div>

            {/* Time */}
            <span className="text-sm text-white">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center space-x-4">
            {/* Subtitles */}
            {movie.subtitle_url && (
              <button
                onClick={toggleSubtitles}
                className={`transition-colors p-2 rounded ${
                  showSubtitles
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-800 text-white hover:bg-primary-600'
                }`}
                title={showSubtitles ? 'Ocultar subtítulos' : 'Mostrar subtítulos'}
              >
                <Subtitles className="h-5 w-5" />
              </button>
            )}

            {/* Settings */}
            <div className="relative">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`transition-colors p-2 rounded ${
                  showSettings
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-800 text-white hover:bg-primary-600'
                }`}
                title="Configuración"
              >
                <Settings className="h-5 w-5" />
              </button>

              {/* Settings Panel */}
              {showSettings && (
                <div className="absolute bottom-full right-0 mb-2 bg-gray-900 border border-gray-700 rounded-lg shadow-xl p-4 min-w-[250px]">
                  {/* Playback Speed */}
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-white mb-2">Velocidad de reproducción</h4>
                    <div className="grid grid-cols-4 gap-2">
                      {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                        <button
                          key={rate}
                          onClick={() => changePlaybackRate(rate)}
                          className={`px-2 py-1 text-xs rounded transition-colors ${
                            playbackRate === rate
                              ? 'bg-primary-600 text-white'
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
                    <h4 className="text-sm font-semibold text-white mb-2">Calidad de video</h4>
                    <div className="space-y-1">
                      {/* Siempre mostrar Auto */}
                      <button
                        onClick={() => changeQuality('auto')}
                        className={`w-full text-left px-3 py-2 text-sm rounded transition-colors ${
                          quality === 'auto'
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        Automático
                      </button>

                      {/* Mostrar solo las calidades disponibles */}
                      {movie.video_1080p_url && (
                        <button
                          onClick={() => changeQuality('1080p')}
                          className={`w-full text-left px-3 py-2 text-sm rounded transition-colors ${
                            quality === '1080p'
                              ? 'bg-primary-600 text-white'
                              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                          }`}
                        >
                          1080p (Full HD)
                        </button>
                      )}

                      {movie.video_720p_url && (
                        <button
                          onClick={() => changeQuality('720p')}
                          className={`w-full text-left px-3 py-2 text-sm rounded transition-colors ${
                            quality === '720p'
                              ? 'bg-primary-600 text-white'
                              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                          }`}
                        >
                          720p (HD)
                        </button>
                      )}

                      {movie.video_480p_url && (
                        <button
                          onClick={() => changeQuality('480p')}
                          className={`w-full text-left px-3 py-2 text-sm rounded transition-colors ${
                            quality === '480p'
                              ? 'bg-primary-600 text-white'
                              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                          }`}
                        >
                          480p (SD)
                        </button>
                      )}

                      {movie.video_360p_url && (
                        <button
                          onClick={() => changeQuality('360p')}
                          className={`w-full text-left px-3 py-2 text-sm rounded transition-colors ${
                            quality === '360p'
                              ? 'bg-primary-600 text-white'
                              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                          }`}
                        >
                          360p
                        </button>
                      )}

                      {/* Si no hay calidades múltiples, mostrar mensaje */}
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
              className="text-white hover:text-primary-600 transition-colors p-2 rounded hover:bg-gray-800"
              title={fullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
            >
              {fullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CustomVideoPlayer
