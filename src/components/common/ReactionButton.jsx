import { useState } from 'react'

/**
 * Reacciones estilo Facebook con animaciones CSS
 * Cada reacción tiene su propio diseño y animación
 */
const REACTIONS_DATA = {
  love: {
    icon: (
      <svg viewBox="0 0 48 48" className="w-full h-full">
        <defs>
          <linearGradient id="love-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FF6B6B" />
            <stop offset="100%" stopColor="#EE5A5A" />
          </linearGradient>
        </defs>
        <circle cx="24" cy="24" r="23" fill="url(#love-gradient)" />
        <path
          d="M24 38s-12-7.5-12-15c0-4.5 3.5-8 8-8 2.5 0 4 1.5 4 1.5s1.5-1.5 4-1.5c4.5 0 8 3.5 8 8 0 7.5-12 15-12 15z"
          fill="white"
        />
      </svg>
    ),
    label: 'Me encanta',
    color: '#EE5A5A',
  },
  laugh: {
    icon: (
      <svg viewBox="0 0 48 48" className="w-full h-full">
        <defs>
          <linearGradient id="laugh-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFD93D" />
            <stop offset="100%" stopColor="#F4C430" />
          </linearGradient>
        </defs>
        <circle cx="24" cy="24" r="23" fill="url(#laugh-gradient)" />
        {/* Ojos cerrados de risa */}
        <path d="M14 20 Q17 16, 20 20" stroke="#65350F" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M28 20 Q31 16, 34 20" stroke="#65350F" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        {/* Lágrimas de risa */}
        <ellipse cx="11" cy="22" rx="2" ry="3" fill="#65C3E8" opacity="0.8" />
        <ellipse cx="37" cy="22" rx="2" ry="3" fill="#65C3E8" opacity="0.8" />
        {/* Boca abierta riendo */}
        <path d="M14 28 Q24 40, 34 28" fill="#65350F" />
        <path d="M16 28 Q24 36, 32 28" fill="#F4A4A4" />
      </svg>
    ),
    label: 'Jaja',
    color: '#F4C430',
  },
  wow: {
    icon: (
      <svg viewBox="0 0 48 48" className="w-full h-full">
        <defs>
          <linearGradient id="wow-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFD93D" />
            <stop offset="100%" stopColor="#F4C430" />
          </linearGradient>
        </defs>
        <circle cx="24" cy="24" r="23" fill="url(#wow-gradient)" />
        {/* Cejas levantadas */}
        <ellipse cx="16" cy="15" rx="4" ry="1.5" fill="#65350F" />
        <ellipse cx="32" cy="15" rx="4" ry="1.5" fill="#65350F" />
        {/* Ojos grandes */}
        <ellipse cx="16" cy="21" rx="4" ry="5" fill="white" />
        <ellipse cx="32" cy="21" rx="4" ry="5" fill="white" />
        <circle cx="16" cy="22" r="2.5" fill="#65350F" />
        <circle cx="32" cy="22" r="2.5" fill="#65350F" />
        {/* Boca O */}
        <ellipse cx="24" cy="35" rx="5" ry="6" fill="#65350F" />
      </svg>
    ),
    label: 'Wow',
    color: '#F4C430',
  },
  sad: {
    icon: (
      <svg viewBox="0 0 48 48" className="w-full h-full">
        <defs>
          <linearGradient id="sad-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFD93D" />
            <stop offset="100%" stopColor="#F4C430" />
          </linearGradient>
        </defs>
        <circle cx="24" cy="24" r="23" fill="url(#sad-gradient)" />
        {/* Cejas tristes */}
        <path d="M12 18 Q16 15, 20 18" stroke="#65350F" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M28 18 Q32 15, 36 18" stroke="#65350F" strokeWidth="2" fill="none" strokeLinecap="round" />
        {/* Ojos con lágrima */}
        <ellipse cx="16" cy="22" rx="3" ry="4" fill="white" />
        <ellipse cx="32" cy="22" rx="3" ry="4" fill="white" />
        <circle cx="16" cy="23" r="2" fill="#65350F" />
        <circle cx="32" cy="23" r="2" fill="#65350F" />
        {/* Lágrima */}
        <path d="M18 26 Q20 32, 18 36" stroke="#65C3E8" strokeWidth="3" fill="none" strokeLinecap="round" />
        {/* Boca triste */}
        <path d="M18 36 Q24 32, 30 36" stroke="#65350F" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </svg>
    ),
    label: 'Triste',
    color: '#F4C430',
  },
  angry: {
    icon: (
      <svg viewBox="0 0 48 48" className="w-full h-full">
        <defs>
          <linearGradient id="angry-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#F4A460" />
            <stop offset="100%" stopColor="#E8713A" />
          </linearGradient>
        </defs>
        <circle cx="24" cy="24" r="23" fill="url(#angry-gradient)" />
        {/* Cejas enojadas */}
        <path d="M12 16 L20 20" stroke="#65350F" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M36 16 L28 20" stroke="#65350F" strokeWidth="3" fill="none" strokeLinecap="round" />
        {/* Ojos */}
        <ellipse cx="16" cy="24" rx="3" ry="3" fill="white" />
        <ellipse cx="32" cy="24" rx="3" ry="3" fill="white" />
        <circle cx="16" cy="24" r="2" fill="#65350F" />
        <circle cx="32" cy="24" r="2" fill="#65350F" />
        {/* Boca enojada */}
        <path d="M16 36 Q24 32, 32 36" stroke="#65350F" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </svg>
    ),
    label: 'Enojado',
    color: '#E8713A',
  },
  fire: {
    icon: (
      <svg viewBox="0 0 48 48" className="w-full h-full">
        <defs>
          <linearGradient id="fire-gradient" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#FF6B35" />
            <stop offset="50%" stopColor="#FF9F1C" />
            <stop offset="100%" stopColor="#FFE66D" />
          </linearGradient>
        </defs>
        <circle cx="24" cy="24" r="23" fill="#1E1E1E" />
        <path
          d="M24 8 C24 8, 14 18, 14 28 C14 34, 18 40, 24 40 C30 40, 34 34, 34 28 C34 18, 24 8, 24 8 Z"
          fill="url(#fire-gradient)"
        />
        <path
          d="M24 20 C24 20, 20 26, 20 30 C20 34, 22 36, 24 36 C26 36, 28 34, 28 30 C28 26, 24 20, 24 20 Z"
          fill="#FFE66D"
        />
      </svg>
    ),
    label: 'Fuego',
    color: '#FF6B35',
  },
  clap: {
    icon: (
      <svg viewBox="0 0 48 48" className="w-full h-full">
        <defs>
          <linearGradient id="clap-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFC876" />
            <stop offset="100%" stopColor="#E8A850" />
          </linearGradient>
        </defs>
        <circle cx="24" cy="24" r="23" fill="#4CAF50" />
        {/* Manos aplaudiendo */}
        <path
          d="M16 18 L20 14 L24 20 L20 24 Z"
          fill="url(#clap-gradient)"
          stroke="#D4A03A"
          strokeWidth="1"
        />
        <path
          d="M32 18 L28 14 L24 20 L28 24 Z"
          fill="url(#clap-gradient)"
          stroke="#D4A03A"
          strokeWidth="1"
        />
        <path
          d="M18 28 L22 24 L26 30 L22 34 Z"
          fill="url(#clap-gradient)"
          stroke="#D4A03A"
          strokeWidth="1"
        />
        <path
          d="M30 28 L26 24 L22 30 L26 34 Z"
          fill="url(#clap-gradient)"
          stroke="#D4A03A"
          strokeWidth="1"
        />
        {/* Líneas de impacto */}
        <path d="M12 12 L14 14" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <path d="M36 12 L34 14" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <path d="M24 8 L24 11" stroke="white" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    label: 'Aplauso',
    color: '#4CAF50',
  },
  film: {
    icon: (
      <svg viewBox="0 0 48 48" className="w-full h-full">
        <defs>
          <linearGradient id="film-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#9C27B0" />
            <stop offset="100%" stopColor="#7B1FA2" />
          </linearGradient>
        </defs>
        <circle cx="24" cy="24" r="23" fill="url(#film-gradient)" />
        {/* Claqueta de cine */}
        <rect x="12" y="16" width="24" height="18" rx="2" fill="white" />
        <rect x="12" y="16" width="24" height="6" fill="#1E1E1E" />
        {/* Rayas de la claqueta */}
        <path d="M14 16 L18 22" stroke="white" strokeWidth="2" />
        <path d="M20 16 L24 22" stroke="white" strokeWidth="2" />
        <path d="M26 16 L30 22" stroke="white" strokeWidth="2" />
        <path d="M32 16 L36 22" stroke="white" strokeWidth="2" />
        {/* Detalles */}
        <rect x="14" y="26" width="8" height="2" rx="1" fill="#E0E0E0" />
        <rect x="14" y="30" width="12" height="2" rx="1" fill="#E0E0E0" />
      </svg>
    ),
    label: 'Cine',
    color: '#9C27B0',
  },
}

/**
 * Componente de reacción individual con animación
 */
export function ReactionIcon({ name, size = 32, animate = false, className = '' }) {
  const reaction = REACTIONS_DATA[name]
  if (!reaction) return null

  return (
    <div
      className={`inline-block ${animate ? 'animate-bounce-in' : ''} ${className}`}
      style={{ width: size, height: size }}
      title={reaction.label}
    >
      {reaction.icon}
    </div>
  )
}

/**
 * Selector de reacciones estilo Facebook
 */
export function ReactionPicker({ onSelect, currentReaction, disabled = false }) {
  const [hoveredReaction, setHoveredReaction] = useState(null)

  const reactions = Object.keys(REACTIONS_DATA)

  return (
    <div className="flex items-center gap-1 bg-black/90 backdrop-blur-sm rounded-full px-3 py-2 shadow-xl">
      {reactions.map((name, index) => {
        const reaction = REACTIONS_DATA[name]
        const isSelected = currentReaction === name
        const isHovered = hoveredReaction === name

        return (
          <button
            key={name}
            onClick={() => !disabled && onSelect(name)}
            onMouseEnter={() => setHoveredReaction(name)}
            onMouseLeave={() => setHoveredReaction(null)}
            disabled={disabled}
            className={`
              relative transition-all duration-200 ease-out
              ${isHovered ? 'scale-150 -translate-y-3 z-10' : 'scale-100'}
              ${isSelected ? 'scale-125' : ''}
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
            style={{
              animationDelay: `${index * 50}ms`,
            }}
          >
            <div className={`w-10 h-10 ${isHovered ? 'w-12 h-12' : ''} transition-all duration-200`}>
              <ReactionIcon name={name} size={isHovered ? 48 : 40} animate={isHovered} />
            </div>

            {/* Tooltip con nombre */}
            {isHovered && (
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                {reaction.label}
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}

/**
 * Obtener datos de una reacción por nombre
 */
export function getReactionData(name) {
  return REACTIONS_DATA[name] || null
}

/**
 * Lista de todas las reacciones disponibles
 */
export const REACTIONS = Object.entries(REACTIONS_DATA).map(([name, data]) => ({
  name,
  ...data,
}))

export default ReactionPicker
