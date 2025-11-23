import { useState, useRef, useEffect } from 'react'
import { COMMENT_REACTIONS } from '../../hooks/useCommentReactions'

// Iconos SVG personalizados para reacciones de comentarios (estilo minimalista)
export const CommentReactionIcons = {
  // Pulgar arriba - Me gusta
  like: ({ className, isActive }) => (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <path
        d="M7 22V11M2 13V20C2 21.1046 2.89543 22 4 22H17.4262C18.907 22 20.1662 20.9197 20.3914 19.4562L21.4683 12.4562C21.7479 10.6389 20.3418 9 18.5032 9H15C14.4477 9 14 8.55228 14 8V4.46584C14 3.10399 12.896 2 11.5342 2C11.2093 2 10.915 2.1913 10.7831 2.48812L7.26394 10.4061C7.10344 10.7673 6.74532 11 6.35013 11H4C2.89543 11 2 11.8954 2 13Z"
        stroke={isActive ? "#3B82F6" : "currentColor"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={isActive ? "#3B82F6" : "none"}
        className="transition-all duration-200"
      />
    </svg>
  ),

  // Corazón - Me encanta
  love: ({ className, isActive }) => (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <path
        d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z"
        fill={isActive ? "#EF4444" : "none"}
        stroke={isActive ? "#EF4444" : "currentColor"}
        strokeWidth="2"
        className="transition-all duration-200"
      />
    </svg>
  ),

  // Cara riendo - Jaja
  laugh: ({ className, isActive }) => (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke={isActive ? "#F59E0B" : "currentColor"}
        strokeWidth="2"
        fill={isActive ? "#FEF3C7" : "none"}
        className="transition-all duration-200"
      />
      <path
        d="M8 14C8 14 9.5 16 12 16C14.5 16 16 14 16 14"
        stroke={isActive ? "#F59E0B" : "currentColor"}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M9 9L8 10M15 9L16 10" stroke={isActive ? "#F59E0B" : "currentColor"} strokeWidth="2" strokeLinecap="round" />
      <path d="M9 10.5C9 10.5 9.5 11 10 10.5M15 10.5C15 10.5 14.5 11 14 10.5" stroke={isActive ? "#F59E0B" : "currentColor"} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),

  // Cara sorprendida - Wow
  wow: ({ className, isActive }) => (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke={isActive ? "#8B5CF6" : "currentColor"}
        strokeWidth="2"
        fill={isActive ? "#EDE9FE" : "none"}
        className="transition-all duration-200"
      />
      <circle cx="9" cy="9" r="1.5" fill={isActive ? "#8B5CF6" : "currentColor"} />
      <circle cx="15" cy="9" r="1.5" fill={isActive ? "#8B5CF6" : "currentColor"} />
      <ellipse
        cx="12"
        cy="15"
        rx="2"
        ry="3"
        stroke={isActive ? "#8B5CF6" : "currentColor"}
        strokeWidth="2"
        fill="none"
      />
    </svg>
  ),

  // Cara triste - Triste
  sad: ({ className, isActive }) => (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke={isActive ? "#6B7280" : "currentColor"}
        strokeWidth="2"
        fill={isActive ? "#F3F4F6" : "none"}
        className="transition-all duration-200"
      />
      <circle cx="9" cy="9" r="1.5" fill={isActive ? "#6B7280" : "currentColor"} />
      <circle cx="15" cy="9" r="1.5" fill={isActive ? "#6B7280" : "currentColor"} />
      <path
        d="M8 16C8 16 9.5 14 12 14C14.5 14 16 16 16 16"
        stroke={isActive ? "#6B7280" : "currentColor"}
        strokeWidth="2"
        strokeLinecap="round"
      />
      {isActive && (
        <path d="M9 11L9 12.5" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" className="animate-pulse" />
      )}
    </svg>
  ),
}

/**
 * Selector de reacciones para comentarios - versión mini inline
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
  const containerRef = useRef(null)
  const timeoutRef = useRef(null)

  // Cerrar picker al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowPicker(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => setShowPicker(true), 300)
  }

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => setShowPicker(false), 300)
  }

  const handleReaction = (type) => {
    if (!disabled) {
      onReact(type)
      setShowPicker(false)
    }
  }

  // Obtener la reacción más popular para mostrar
  const getTopReaction = () => {
    if (!reactionCounts || Object.keys(reactionCounts).length === 0) return null
    return Object.entries(reactionCounts).sort((a, b) => b[1] - a[1])[0][0]
  }

  const topReaction = getTopReaction()
  const currentInfo = currentReaction ? COMMENT_REACTIONS[currentReaction] : null

  return (
    <div ref={containerRef} className="relative inline-flex items-center">
      {/* Botón de reacción */}
      <button
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={() => handleReaction(currentReaction || 'like')}
        disabled={disabled}
        className={`
          flex items-center space-x-1 text-xs transition-all duration-200
          ${currentReaction
            ? `font-semibold`
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }
          disabled:opacity-50
        `}
        style={{ color: currentInfo?.color }}
      >
        {currentReaction && CommentReactionIcons[currentReaction] ? (
          <span className="w-4 h-4">
            {CommentReactionIcons[currentReaction]({ className: "w-4 h-4", isActive: true })}
          </span>
        ) : (
          <span className="w-4 h-4">
            {CommentReactionIcons.like({ className: "w-4 h-4", isActive: false })}
          </span>
        )}
        <span>{currentInfo?.label || 'Me gusta'}</span>
      </button>

      {/* Contador de reacciones - solo número */}
      {totalReactions > 0 && (
        <span className="ml-3 text-xs font-semibold text-gray-500 dark:text-gray-400">
          {totalReactions} {totalReactions === 1 ? 'reacción' : 'reacciones'}
        </span>
      )}

      {/* Picker flotante */}
      {showPicker && (
        <div
          className="absolute bottom-full left-0 mb-2 z-50"
          onMouseEnter={() => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current)
          }}
          onMouseLeave={handleMouseLeave}
        >
          <div className="flex items-center space-x-1 p-1.5 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700">
            {Object.entries(COMMENT_REACTIONS).map(([type, info], index) => {
              const IconComponent = CommentReactionIcons[type]
              const isActive = currentReaction === type
              const isHovered = hoveredReaction === type

              return (
                <button
                  key={type}
                  onClick={() => handleReaction(type)}
                  onMouseEnter={() => setHoveredReaction(type)}
                  onMouseLeave={() => setHoveredReaction(null)}
                  className={`
                    relative p-1.5 rounded-full transition-all duration-200
                    hover:scale-125 hover:bg-gray-100 dark:hover:bg-gray-700
                    ${isActive ? 'scale-110' : ''}
                  `}
                  style={{
                    animationDelay: `${index * 50}ms`,
                  }}
                  title={info.label}
                >
                  <span className="w-6 h-6 block">
                    {IconComponent({ className: "w-6 h-6", isActive: isActive || isHovered })}
                  </span>

                  {/* Tooltip */}
                  {isHovered && (
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 text-xs bg-gray-900 text-white rounded whitespace-nowrap">
                      {info.label}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default CommentReactionPicker
