import { useState, useRef, useEffect } from 'react'
import { COMMENT_REACTIONS } from '../../hooks/useCommentReactions'

// Componente para mostrar reacciones con diseño refinado
const ReactionIcon = ({ type, size = 28, isActive = false }) => {
  const reaction = COMMENT_REACTIONS[type]

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
 * Selector de reacciones para comentarios - versión compacta
 */
function CommentReactionPicker({
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

  const currentReactionData = currentReaction ? COMMENT_REACTIONS[currentReaction] : null
  const reactionsList = Object.entries(COMMENT_REACTIONS)

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
      {/* Botón principal compacto */}
      <button
        onClick={handleClick}
        disabled={disabled}
        className={`flex items-center space-x-1 px-1.5 py-0.5 rounded transition-all duration-200 select-none group
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${animateButton ? 'scale-110' : ''}
        `}
      >
        {/* Icono actual */}
        <div className={`transition-transform duration-200 ${animateButton ? 'animate-bounce-small' : ''}`}>
          {currentReactionData ? (
            <div className="flex items-center">
              <ReactionIcon type={currentReaction} size={16} isActive={true} />
            </div>
          ) : (
            <svg width="16" height="16" viewBox="0 0 20 20" className="text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-300">
              <path fill="currentColor" d="M10 3c-3.866 0-7 3.134-7 7s3.134 7 7 7 7-3.134 7-7-3.134-7-7-7zm0 12.5c-3.038 0-5.5-2.462-5.5-5.5S6.962 4.5 10 4.5s5.5 2.462 5.5 5.5-2.462 5.5-5.5 5.5z"/>
              <path fill="currentColor" d="M13.5 8.5c0-.828-.672-1.5-1.5-1.5s-1.5.672-1.5 1.5.672 1.5 1.5 1.5 1.5-.672 1.5-1.5zm-5 0c0-.828-.672-1.5-1.5-1.5S5.5 7.672 5.5 8.5 6.172 10 7 10s1.5-.672 1.5-1.5zm1.5 4.5c-1.381 0-2.5-.896-2.5-2h-1c0 1.654 1.346 3 3 3s3-1.346 3-3h-1c0 1.104-1.119 2-2.5 2z"/>
            </svg>
          )}
        </div>

        {/* Contador mini */}
        {totalReactions > 0 && (
          <span
            className="text-xs font-semibold transition-all duration-200"
            style={{
              color: currentReactionData ? currentReactionData.color : '#6B7280'
            }}
          >
            {totalReactions}
          </span>
        )}
      </button>

      {/* Picker compacto */}
      {showPicker && (
        <div
          ref={pickerRef}
          className="absolute bottom-full left-0 mb-1.5 z-50 animate-scale-in"
          onMouseEnter={() => { if (hideTimer.current) clearTimeout(hideTimer.current) }}
          onMouseLeave={handleMouseLeave}
        >
          <div className="relative bg-white dark:bg-gray-800 rounded-full shadow-xl px-2 py-1.5 flex items-center gap-0.5 border border-gray-100 dark:border-gray-700">
            {reactionsList.map(([type, data]) => {
              const isHovered = hoveredReaction === type
              const isSelected = currentReaction === type

              return (
                <button
                  key={type}
                  onClick={() => handleSelectReaction(type)}
                  onMouseEnter={() => setHoveredReaction(type)}
                  onMouseLeave={() => setHoveredReaction(null)}
                  className="relative group"
                >
                  {/* Tooltip con nombre */}
                  <div
                    className={`absolute -top-7 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded text-[10px] font-medium whitespace-nowrap transition-all duration-200 pointer-events-none
                      ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'}
                    `}
                    style={{
                      backgroundColor: data.color,
                      color: 'white',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                    }}
                  >
                    {data.label}
                    <div
                      className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[3px] border-r-[3px] border-t-[3px] border-transparent"
                      style={{ borderTopColor: data.color }}
                    />
                  </div>

                  {/* Emoji con animación */}
                  <div
                    className={`transition-all duration-200 ease-out p-0.5
                      ${isSelected ? 'bg-gray-100 dark:bg-gray-700 rounded-full' : ''}
                    `}
                    style={{
                      transform: isHovered ? 'scale(1.35) translateY(-6px)' : 'scale(1)',
                      transformOrigin: 'bottom center'
                    }}
                  >
                    <ReactionIcon type={type} size={22} isActive={isSelected} />
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
            transform: scale(0) translateY(8px);
            opacity: 0;
          }
          to {
            transform: scale(1) translateY(0);
            opacity: 1;
          }
        }

        @keyframes reaction-bounce {
          0%, 100% { transform: scale(1.4) translateY(-6px); }
          50% { transform: scale(1.5) translateY(-8px); }
        }

        @keyframes bounce-small {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }

        .animate-scale-in {
          animation: scale-in 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .animate-reaction-bounce {
          animation: reaction-bounce 0.4s ease-in-out;
        }

        .animate-bounce-small {
          animation: bounce-small 0.3s ease-in-out;
        }
      `}</style>
    </div>
  )
}

export default CommentReactionPicker
