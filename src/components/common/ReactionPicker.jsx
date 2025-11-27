import { useState, useRef, useEffect } from 'react'
import { REACTIONS } from '../../hooks/usePostReactions'

// Componente para mostrar reacciones con diseño refinado
const ReactionIcon = ({ type, size = 38, isActive = false }) => {
  const reaction = REACTIONS[type]

  if (!reaction) return null

  return (
    <span
      className={`inline-flex items-center justify-center transition-all duration-150 ${
        isActive ? 'drop-shadow-sm' : ''
      }`}
      style={{
        fontSize: `${size}px`,
        lineHeight: 1
      }}
    >
      {reaction.emoji}
    </span>
  )
}

/**
 * Selector de reacciones
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
  const containerRef = useRef(null)
  const pickerRef = useRef(null)
  const hideTimer = useRef(null)

  const currentReactionData = currentReaction ? REACTIONS[currentReaction] : null
  const reactionsList = Object.entries(REACTIONS)

  // Limpiar timers
  useEffect(() => {
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current)
    }
  }, [])

  // Cerrar picker al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowPicker(false)
        setHoveredReaction(null)
      }
    }

    if (showPicker) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
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

  const handleMouseEnter = () => {
    if (disabled) return
    if (hideTimer.current) clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => setShowPicker(true), 400)
  }

  const handleMouseLeave = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => {
      setShowPicker(false)
      setHoveredReaction(null)
    }, 300)
  }

  const handleClick = (e) => {
    e.stopPropagation()
    if (disabled) return

    if (currentReaction) {
      onReact(currentReaction)
    } else {
      onReact('star') // Primera reacción por defecto
    }
  }

  const handleSelectReaction = (reactionType) => {
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
        disabled={disabled}
        className={`flex items-center space-x-1.5 px-2 py-1 rounded transition-all duration-200 select-none group
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${animateButton ? 'scale-110' : ''}
        `}
      >
        {/* Icono actual */}
        <div className={`transition-transform duration-200 ${animateButton ? 'animate-bounce-small' : ''}`}>
          {currentReactionData ? (
            <div className="flex items-center">
              <ReactionIcon type={currentReaction} size={20} isActive={true} />
            </div>
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

          <div className="relative bg-white dark:bg-gray-800 rounded-full shadow-xl px-2 py-1.5 flex items-center gap-0 border border-gray-200 dark:border-gray-700">
            {reactionsList.map(([type, data]) => {
              const isHovered = hoveredReaction === type
              const isSelected = currentReaction === type

              return (
                <button
                  key={type}
                  onClick={() => handleSelectReaction(type)}
                  onMouseEnter={() => setHoveredReaction(type)}
                  onMouseLeave={() => setHoveredReaction(null)}
                  className="relative"
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
                        isHovered ? 'opacity-20' : 'opacity-0'
                      }`}
                      style={{ backgroundColor: data.color }}
                    />
                    <span
                      className="relative block transition-all duration-150"
                      style={{
                        fontSize: '24px',
                        lineHeight: 1,
                        filter: isHovered ? `drop-shadow(0 2px 4px ${data.color}50)` : 'none'
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
