import { useState, useRef, useEffect } from 'react'
import { COMMENT_REACTIONS } from '../../hooks/useCommentReactions'

// Iconos SVG estilo Facebook (versión compacta)
const ReactionIcon = ({ type, size = 28, isActive = false, isHovered = false }) => {
  const scale = isActive ? 1.1 : 1

  const getAnimationStyles = () => {
    if (!isHovered) return {}

    switch (type) {
      case 'like':
        return { animation: 'thumbs-up 0.6s ease-in-out' }
      case 'love':
        return { animation: 'heart-beat 0.6s ease-in-out' }
      case 'haha':
        return { animation: 'shake 0.6s ease-in-out' }
      case 'wow':
        return { animation: 'zoom-shake 0.6s ease-in-out' }
      case 'sad':
        return { animation: 'sad-bounce 0.6s ease-in-out' }
      case 'angry':
        return { animation: 'angry-shake 0.6s ease-in-out' }
      default:
        return {}
    }
  }

  const animationStyles = getAnimationStyles()

  switch (type) {
    case 'like':
      return (
        <svg width={size} height={size} viewBox="0 0 38 38" style={{ ...animationStyles, transform: `scale(${scale})`, transition: 'transform 0.2s' }}>
          <circle cx="19" cy="19" r="19" fill="#3b82f6"/>
          <path d="M24.5 15.5c0-1.103-.897-2-2-2h-3.5l.5-3c.034-.167.05-.334.05-.5 0-.413-.167-.789-.438-1.061l-1.061-1.06-5.78 5.78c-.289.288-.469.686-.469 1.122v9.219c0 1.103.897 2 2 2h7.5c.828 0 1.547-.5 1.859-1.219l2.344-5.625c.063-.156.097-.328.097-.5v-2c0-1.103-.897-2-2-2h-1.5l2.398-3.136z" fill="white"/>
        </svg>
      )
    case 'love':
      return (
        <svg width={size} height={size} viewBox="0 0 38 38" style={{ ...animationStyles, transform: `scale(${scale})`, transition: 'transform 0.2s' }}>
          <defs>
            <radialGradient id="love-gradient-comment" cx="30%" cy="30%">
              <stop offset="0%" stopColor="#ff6b9d"/>
              <stop offset="100%" stopColor="#c94b6e"/>
            </radialGradient>
          </defs>
          <circle cx="19" cy="19" r="19" fill="url(#love-gradient-comment)"/>
          <path d="M19 28.5l-1.45-1.32C12.4 22.36 9 19.28 9 15.5c0-3.08 2.42-5.5 5.5-5.5 1.74 0 3.41.81 4.5 2.09C20.09 10.81 21.76 10 23.5 10c3.08 0 5.5 2.42 5.5 5.5 0 3.78-3.4 6.86-8.55 11.68L19 28.5z" fill="white"/>
        </svg>
      )
    case 'haha':
      return (
        <svg width={size} height={size} viewBox="0 0 38 38" style={{ ...animationStyles, transform: `scale(${scale})`, transition: 'transform 0.2s' }}>
          <defs>
            <radialGradient id="haha-gradient-comment" cx="30%" cy="30%">
              <stop offset="0%" stopColor="#ffda6a"/>
              <stop offset="100%" stopColor="#f7b125"/>
            </radialGradient>
          </defs>
          <circle cx="19" cy="19" r="19" fill="url(#haha-gradient-comment)"/>
          <path d="M12.5 13.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm17 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" fill="#8b5a00"/>
          <path d="M19 27c-4.5 0-8-2.5-8-6h16c0 3.5-3.5 6-8 6z" fill="#8b5a00"/>
          <path d="M19 24c-3 0-5.5-1.5-5.5-4h11c0 2.5-2.5 4-5.5 4z" fill="white"/>
        </svg>
      )
    case 'wow':
      return (
        <svg width={size} height={size} viewBox="0 0 38 38" style={{ ...animationStyles, transform: `scale(${scale})`, transition: 'transform 0.2s' }}>
          <defs>
            <radialGradient id="wow-gradient-comment" cx="30%" cy="30%">
              <stop offset="0%" stopColor="#ffda6a"/>
              <stop offset="100%" stopColor="#f7b125"/>
            </radialGradient>
          </defs>
          <circle cx="19" cy="19" r="19" fill="url(#wow-gradient-comment)"/>
          <ellipse cx="12" cy="14" rx="2.5" ry="3.5" fill="#8b5a00"/>
          <ellipse cx="26" cy="14" rx="2.5" ry="3.5" fill="#8b5a00"/>
          <ellipse cx="19" cy="25" rx="4" ry="5" fill="#8b5a00"/>
          <ellipse cx="19" cy="25" rx="2.5" ry="3.5" fill="white" opacity="0.7"/>
        </svg>
      )
    case 'sad':
      return (
        <svg width={size} height={size} viewBox="0 0 38 38" style={{ ...animationStyles, transform: `scale(${scale})`, transition: 'transform 0.2s' }}>
          <defs>
            <radialGradient id="sad-gradient-comment" cx="30%" cy="30%">
              <stop offset="0%" stopColor="#ffda6a"/>
              <stop offset="100%" stopColor="#f7b125"/>
            </radialGradient>
          </defs>
          <circle cx="19" cy="19" r="19" fill="url(#sad-gradient-comment)"/>
          <ellipse cx="12" cy="13" rx="2" ry="2.5" fill="#8b5a00"/>
          <ellipse cx="26" cy="13" rx="2" ry="2.5" fill="#8b5a00"/>
          <path d="M12 26c0-3 3-5 7-5s7 2 7 5" stroke="#8b5a00" strokeWidth="2" fill="none" strokeLinecap="round" transform="scale(1,-1) translate(0,-50)"/>
          <path d="M14 11l-3-2m16 2l3-2" stroke="#8b5a00" strokeWidth="1.5" strokeLinecap="round"/>
          <ellipse cx="16" cy="17" rx="1" ry="3" fill="#4a90e2" opacity="0.8"/>
        </svg>
      )
    case 'angry':
      return (
        <svg width={size} height={size} viewBox="0 0 38 38" style={{ ...animationStyles, transform: `scale(${scale})`, transition: 'transform 0.2s' }}>
          <defs>
            <radialGradient id="angry-gradient-comment" cx="30%" cy="30%">
              <stop offset="0%" stopColor="#ff8c5a"/>
              <stop offset="100%" stopColor="#f4693b"/>
            </radialGradient>
          </defs>
          <circle cx="19" cy="19" r="19" fill="url(#angry-gradient-comment)"/>
          <ellipse cx="12" cy="16" rx="2" ry="2.5" fill="#8b2500"/>
          <ellipse cx="26" cy="16" rx="2" ry="2.5" fill="#8b2500"/>
          <path d="M10 12l4 2m10-2l-4 2" stroke="#8b2500" strokeWidth="2" strokeLinecap="round"/>
          <path d="M12 26c0-3 3-5 7-5s7 2 7 5" stroke="#8b2500" strokeWidth="2" fill="none" strokeLinecap="round" transform="scale(1,-1) translate(0,-50)"/>
        </svg>
      )
    default:
      return (
        <svg width={size} height={size} viewBox="0 0 38 38">
          <circle cx="19" cy="19" r="19" fill="#3b82f6"/>
        </svg>
      )
  }
}

/**
 * Selector de reacciones para comentarios - versión compacta estilo Facebook
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
      onReact('like')
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

      {/* Picker compacto estilo Facebook */}
      {showPicker && (
        <div
          ref={pickerRef}
          className="absolute bottom-full left-0 mb-1.5 z-50 animate-scale-in"
          onMouseEnter={() => { if (hideTimer.current) clearTimeout(hideTimer.current) }}
          onMouseLeave={handleMouseLeave}
        >
          {/* Contenedor con sombra estilo Facebook */}
          <div className="relative bg-white dark:bg-gray-800 rounded-full shadow-2xl px-1.5 py-1.5 flex items-center gap-0.5"
            style={{
              boxShadow: '0 0 0 1px rgba(0,0,0,.05), 0 1px 2px rgba(0,0,0,.15), 0 2px 8px rgba(0,0,0,.15)'
            }}>

            {reactionsList.map(([type]) => {
              const isHovered = hoveredReaction === type

              return (
                <button
                  key={type}
                  onClick={() => handleSelectReaction(type)}
                  onMouseEnter={() => setHoveredReaction(type)}
                  onMouseLeave={() => setHoveredReaction(null)}
                  className={`relative transition-all duration-150 ease-out
                    ${isHovered ? 'animate-reaction-bounce' : ''}
                  `}
                  style={{
                    transform: isHovered ? 'scale(1.4) translateY(-6px)' : 'scale(1)',
                    transformOrigin: 'bottom',
                    zIndex: isHovered ? 10 : 1
                  }}
                >
                  <ReactionIcon type={type} size={28} isActive={isHovered} isHovered={isHovered} />
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

        @keyframes thumbs-up {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-6px) rotate(-15deg); }
          50% { transform: translateY(-8px) rotate(0deg); }
          75% { transform: translateY(-6px) rotate(15deg); }
        }

        @keyframes heart-beat {
          0%, 100% { transform: scale(1); }
          10% { transform: scale(1.2); }
          20% { transform: scale(1.1); }
          30% { transform: scale(1.3); }
          40% { transform: scale(1.1); }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-3px) rotate(-5deg); }
          20%, 40%, 60%, 80% { transform: translateX(3px) rotate(5deg); }
        }

        @keyframes zoom-shake {
          0%, 100% { transform: scale(1) rotate(0deg); }
          25% { transform: scale(1.2) rotate(-8deg); }
          50% { transform: scale(1.3) rotate(8deg); }
          75% { transform: scale(1.2) rotate(-8deg); }
        }

        @keyframes sad-bounce {
          0%, 100% { transform: translateY(0); }
          25% { transform: translateY(4px); }
          50% { transform: translateY(2px); }
          75% { transform: translateY(6px); }
        }

        @keyframes angry-shake {
          0%, 100% { transform: translateX(0) rotate(0deg) scale(1); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px) rotate(-10deg) scale(1.05); }
          20%, 40%, 60%, 80% { transform: translateX(4px) rotate(10deg) scale(1.05); }
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
