import { useState, useRef, useEffect, useCallback } from 'react'
import { REACTIONS } from '../../hooks/usePostReactions'

/**
 * Selector de reacciones con soporte para deslizar (drag) tipo Facebook
 */
function ReactionPicker({
  currentReaction,
  onReact,
  reactionCounts = {},
  totalReactions = 0,
  disabled = false
}) {
  const [showPicker, setShowPicker] = useState(false)
  const [hoveredReaction, setHoveredReaction] = useState(null)
  const [animateButton, setAnimateButton] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef(null)
  const pickerRef = useRef(null)
  const hideTimer = useRef(null)
  const longPressTimer = useRef(null)
  const reactionButtonsRef = useRef([])

  const currentReactionData = currentReaction ? REACTIONS[currentReaction] : null
  const reactionsList = Object.entries(REACTIONS)

  // Limpiar timers
  useEffect(() => {
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current)
      if (longPressTimer.current) clearTimeout(longPressTimer.current)
    }
  }, [])

  // Cerrar picker al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowPicker(false)
        setHoveredReaction(null)
        setIsDragging(false)
      }
    }

    if (showPicker) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [showPicker])

  // Animación al cambiar reacción
  useEffect(() => {
    if (currentReaction) {
      setAnimateButton(true)
      const timer = setTimeout(() => setAnimateButton(false), 300)
      return () => clearTimeout(timer)
    }
  }, [currentReaction])

  // Detectar qué reacción está bajo el cursor/dedo
  const getReactionFromPosition = useCallback((clientX, clientY) => {
    for (let i = 0; i < reactionButtonsRef.current.length; i++) {
      const button = reactionButtonsRef.current[i]
      if (button) {
        const rect = button.getBoundingClientRect()
        // Expandir el área de detección verticalmente para mejor UX
        const expandedRect = {
          left: rect.left - 5,
          right: rect.right + 5,
          top: rect.top - 30,
          bottom: rect.bottom + 10
        }
        if (
          clientX >= expandedRect.left &&
          clientX <= expandedRect.right &&
          clientY >= expandedRect.top &&
          clientY <= expandedRect.bottom
        ) {
          return reactionsList[i][0]
        }
      }
    }
    return null
  }, [reactionsList])

  // Manejar movimiento durante drag
  const handleDragMove = useCallback((clientX, clientY) => {
    if (!isDragging || !showPicker) return
    const reaction = getReactionFromPosition(clientX, clientY)
    setHoveredReaction(reaction)
  }, [isDragging, showPicker, getReactionFromPosition])

  // Manejar fin de drag
  const handleDragEnd = useCallback(() => {
    if (isDragging && hoveredReaction) {
      onReact(hoveredReaction)
      setShowPicker(false)
    }
    setIsDragging(false)
    setHoveredReaction(null)
  }, [isDragging, hoveredReaction, onReact])

  // Event listeners para mouse
  useEffect(() => {
    const handleMouseMove = (e) => handleDragMove(e.clientX, e.clientY)
    const handleMouseUp = () => handleDragEnd()

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, handleDragMove, handleDragEnd])

  // Event listeners para touch
  useEffect(() => {
    const handleTouchMove = (e) => {
      if (e.touches.length > 0) {
        handleDragMove(e.touches[0].clientX, e.touches[0].clientY)
      }
    }
    const handleTouchEnd = () => handleDragEnd()

    if (isDragging) {
      document.addEventListener('touchmove', handleTouchMove, { passive: true })
      document.addEventListener('touchend', handleTouchEnd)
      document.addEventListener('touchcancel', handleTouchEnd)
    }

    return () => {
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
      document.removeEventListener('touchcancel', handleTouchEnd)
    }
  }, [isDragging, handleDragMove, handleDragEnd])

  const handleMouseEnter = () => {
    if (disabled) return
    if (hideTimer.current) clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => setShowPicker(true), 400)
  }

  const handleMouseLeave = () => {
    if (isDragging) return // No cerrar mientras se arrastra
    if (hideTimer.current) clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => {
      setShowPicker(false)
      setHoveredReaction(null)
    }, 300)
  }

  // Long press para móvil - inicia drag mode
  const handleTouchStart = (e) => {
    if (disabled) return
    longPressTimer.current = setTimeout(() => {
      setShowPicker(true)
      setIsDragging(true)
      // Vibración haptic feedback si está disponible
      if (navigator.vibrate) {
        navigator.vibrate(50)
      }
    }, 300)
  }

  const handleTouchEndButton = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
    }
  }

  // Mouse down para PC - inicia drag mode
  const handleMouseDown = (e) => {
    if (disabled) return
    longPressTimer.current = setTimeout(() => {
      setShowPicker(true)
      setIsDragging(true)
    }, 300)
  }

  const handleMouseUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
    }
  }

  const handleClick = (e) => {
    e.stopPropagation()
    if (disabled || isDragging) return

    if (currentReaction) {
      onReact(currentReaction)
    } else {
      onReact('star')
    }
  }

  const handleSelectReaction = (reactionType) => {
    if (isDragging) return // En modo drag, solo se selecciona al soltar
    onReact(reactionType)
    setShowPicker(false)
    setHoveredReaction(null)
  }

  return (
    <div
      ref={containerRef}
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Botón principal */}
      <button
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEndButton}
        disabled={disabled}
        className={`flex items-center space-x-1.5 px-2 py-1 rounded transition-all duration-200 select-none group
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${animateButton ? 'scale-110' : ''}
          ${isDragging ? 'scale-105' : ''}
        `}
      >
        {/* Icono actual */}
        <div className={`transition-transform duration-200 ${animateButton ? 'animate-bounce-small' : ''}`}>
          {currentReactionData ? (
            <span style={{ fontSize: '20px', lineHeight: 1 }}>
              {currentReactionData.emoji}
            </span>
          ) : (
            <svg width="20" height="20" viewBox="0 0 20 20" className="text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-300">
              <path fill="currentColor" d="M10 3c-3.866 0-7 3.134-7 7s3.134 7 7 7 7-3.134 7-7-3.134-7-7-7zm0 12.5c-3.038 0-5.5-2.462-5.5-5.5S6.962 4.5 10 4.5s5.5 2.462 5.5 5.5-2.462 5.5-5.5 5.5z"/>
              <path fill="currentColor" d="M13.5 8.5c0-.828-.672-1.5-1.5-1.5s-1.5.672-1.5 1.5.672 1.5 1.5 1.5 1.5-.672 1.5-1.5zm-5 0c0-.828-.672-1.5-1.5-1.5S5.5 7.672 5.5 8.5 6.172 10 7 10s1.5-.672 1.5-1.5zm1.5 4.5c-1.381 0-2.5-.896-2.5-2h-1c0 1.654 1.346 3 3 3s3-1.346 3-3h-1c0 1.104-1.119 2-2.5 2z"/>
            </svg>
          )}
        </div>

        {/* Contador */}
        {totalReactions > 0 && (
          <span
            className="text-sm font-semibold transition-all duration-200"
            style={{
              color: currentReactionData ? currentReactionData.color : '#6B7280'
            }}
          >
            {totalReactions}
          </span>
        )}
      </button>

      {/* Picker de reacciones */}
      {showPicker && (
        <div
          ref={pickerRef}
          className="absolute bottom-full left-0 mb-2 z-50 animate-scale-in"
          onMouseEnter={() => { if (hideTimer.current) clearTimeout(hideTimer.current) }}
          onMouseLeave={handleMouseLeave}
        >
          {/* Tooltip flotante - fuera del contenedor para que no se esconda */}
          {hoveredReaction && (
            <div
              className="absolute -top-10 left-0 right-0 flex justify-center pointer-events-none z-20"
            >
              <div
                className="px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap animate-fade-in"
                style={{
                  backgroundColor: REACTIONS[hoveredReaction].color,
                  color: 'white',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.25)'
                }}
              >
                {REACTIONS[hoveredReaction].label}
              </div>
            </div>
          )}

          <div className={`relative bg-white dark:bg-gray-800 rounded-full shadow-xl px-2 py-1.5 flex items-center gap-0 border border-gray-200 dark:border-gray-700 ${isDragging ? 'ring-2 ring-primary-500/50' : ''}`}>
            {reactionsList.map(([type, data], index) => {
              const isHovered = hoveredReaction === type
              const isSelected = currentReaction === type

              return (
                <button
                  key={type}
                  ref={el => reactionButtonsRef.current[index] = el}
                  onClick={() => handleSelectReaction(type)}
                  onMouseEnter={() => !isDragging && setHoveredReaction(type)}
                  onMouseLeave={() => !isDragging && setHoveredReaction(null)}
                  className="relative touch-none"
                >
                  {/* Contenedor del emoji con efecto de elevación */}
                  <div
                    className={`relative transition-all duration-200 ease-out rounded-full
                      ${isSelected ? 'bg-gray-100 dark:bg-gray-700' : ''}
                      ${isHovered ? 'z-10' : 'z-0'}
                    `}
                    style={{
                      transform: isHovered ? 'scale(1.5) translateY(-12px)' : 'scale(1)',
                      transformOrigin: 'bottom center',
                      padding: '6px'
                    }}
                  >
                    {/* Círculo de fondo con color de la reacción al hover */}
                    <div
                      className={`absolute inset-0 rounded-full transition-all duration-200 ${
                        isHovered ? 'opacity-25' : 'opacity-0'
                      }`}
                      style={{ backgroundColor: data.color }}
                    />
                    <span
                      className="relative block transition-all duration-150"
                      style={{
                        fontSize: '24px',
                        lineHeight: 1,
                        filter: isHovered ? `drop-shadow(0 3px 6px ${data.color}80)` : 'none'
                      }}
                    >
                      {data.emoji}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Animaciones CSS */}
      <style jsx>{`
        @keyframes scale-in {
          from {
            transform: scale(0) translateY(10px);
            opacity: 0;
          }
          to {
            transform: scale(1) translateY(0);
            opacity: 1;
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes bounce-small {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }

        .animate-scale-in {
          animation: scale-in 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .animate-fade-in {
          animation: fade-in 0.15s ease-out;
        }

        .animate-bounce-small {
          animation: bounce-small 0.3s ease-in-out;
        }
      `}</style>
    </div>
  )
}

export default ReactionPicker
