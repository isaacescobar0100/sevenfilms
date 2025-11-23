import { useState } from 'react'
import { useTranslation } from 'react-i18next'

// Iconos SVG de reacciones cinematográficas (los mismos que en posts)
export const MovieReactionIcons = {
  // Trofeo Oscar - Obra Maestra (5)
  masterpiece: ({ className, isActive, isHovered }) => (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <defs>
        <linearGradient id="goldGradientMovie" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFD700" />
          <stop offset="50%" stopColor="#FFA500" />
          <stop offset="100%" stopColor="#FFD700" />
        </linearGradient>
      </defs>
      <path
        d="M12 2L14.5 7.5L20.5 8L16 12.5L17.5 18.5L12 15.5L6.5 18.5L8 12.5L3.5 8L9.5 7.5L12 2Z"
        fill={isActive || isHovered ? "url(#goldGradientMovie)" : "currentColor"}
        className={`transition-all duration-300 ${isActive ? 'drop-shadow-[0_0_8px_rgba(255,215,0,0.8)]' : ''}`}
      />
      <circle cx="12" cy="21" r="2" fill={isActive || isHovered ? "#FFD700" : "currentColor"} />
      <rect x="11" y="17" width="2" height="4" fill={isActive || isHovered ? "#FFD700" : "currentColor"} />
    </svg>
  ),

  // Estrella brillante - Excelente (4)
  excellent: ({ className, isActive, isHovered }) => (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <defs>
        <linearGradient id="starGradientMovie" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFA500" />
          <stop offset="100%" stopColor="#FF6B00" />
        </linearGradient>
      </defs>
      <path
        d="M12 2L14.09 8.26L21 9.27L16 14.14L17.18 21.02L12 17.77L6.82 21.02L8 14.14L3 9.27L9.91 8.26L12 2Z"
        fill={isActive || isHovered ? "url(#starGradientMovie)" : "currentColor"}
        className={`transition-all duration-300 ${isActive ? 'drop-shadow-[0_0_8px_rgba(255,165,0,0.8)]' : ''}`}
      />
      {(isActive || isHovered) && (
        <>
          <circle cx="6" cy="4" r="1" fill="#FFA500" className="animate-ping" />
          <circle cx="18" cy="6" r="1" fill="#FFA500" className="animate-ping" style={{ animationDelay: '0.2s' }} />
        </>
      )}
    </svg>
  ),

  // Palomitas - Entretenido (3)
  popcorn: ({ className, isActive, isHovered }) => (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <defs>
        <linearGradient id="popcornGradientMovie" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF6B6B" />
          <stop offset="100%" stopColor="#EE5A5A" />
        </linearGradient>
        <linearGradient id="cornGradientMovie" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF8DC" />
          <stop offset="100%" stopColor="#F5DEB3" />
        </linearGradient>
      </defs>
      <path
        d="M6 10L4 22H20L18 10H6Z"
        fill={isActive || isHovered ? "url(#popcornGradientMovie)" : "currentColor"}
        className="transition-all duration-300"
      />
      <path d="M8 10L7 22M12 10V22M16 10L17 22" stroke={isActive || isHovered ? "#fff" : "currentColor"} strokeWidth="0.5" opacity="0.5" />
      <circle cx="9" cy="6" r="2.5" fill={isActive || isHovered ? "url(#cornGradientMovie)" : "currentColor"} />
      <circle cx="15" cy="6" r="2.5" fill={isActive || isHovered ? "url(#cornGradientMovie)" : "currentColor"} />
      <circle cx="12" cy="4" r="2.5" fill={isActive || isHovered ? "url(#cornGradientMovie)" : "currentColor"} />
      <circle cx="12" cy="8" r="2" fill={isActive || isHovered ? "url(#cornGradientMovie)" : "currentColor"} />
    </svg>
  ),

  // Pulgar abajo estilizado - Meh (2)
  meh: ({ className, isActive, isHovered }) => (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <path
        d="M10 15V8C10 6.89543 10.8954 6 12 6C13.1046 6 14 6.89543 14 8V15"
        stroke={isActive || isHovered ? "#9CA3AF" : "currentColor"}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M6 15H18C19.1046 15 20 15.8954 20 17V18C20 19.1046 19.1046 20 18 20H12C9.79086 20 8 18.2091 8 16V15H6C4.89543 15 4 14.1046 4 13V12C4 10.8954 4.89543 10 6 10H8"
        fill={isActive || isHovered ? "#9CA3AF" : "currentColor"}
        className="transition-all duration-300"
      />
    </svg>
  ),

  // Zzz - Aburrido (1)
  boring: ({ className, isActive, isHovered }) => (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <text
        x="4"
        y="20"
        fontSize="10"
        fontWeight="bold"
        fill={isActive || isHovered ? "#6B7280" : "currentColor"}
        className={`transition-all duration-300 ${isActive || isHovered ? 'animate-pulse' : ''}`}
      >
        Z
      </text>
      <text
        x="10"
        y="14"
        fontSize="8"
        fontWeight="bold"
        fill={isActive || isHovered ? "#9CA3AF" : "currentColor"}
        className={`transition-all duration-300 ${isActive || isHovered ? 'animate-pulse' : ''}`}
        style={{ animationDelay: '0.1s' }}
      >
        z
      </text>
      <text
        x="15"
        y="9"
        fontSize="6"
        fontWeight="bold"
        fill={isActive || isHovered ? "#D1D5DB" : "currentColor"}
        className={`transition-all duration-300 ${isActive || isHovered ? 'animate-pulse' : ''}`}
        style={{ animationDelay: '0.2s' }}
      >
        z
      </text>
    </svg>
  ),
}

// Mapeo de reacciones a valores numéricos (para BD)
export const MOVIE_REACTIONS = {
  masterpiece: { value: 5, label: 'Obra Maestra', color: '#FFD700' },
  excellent: { value: 4, label: 'Excelente', color: '#FFA500' },
  popcorn: { value: 3, label: 'Entretenida', color: '#FF6B6B' },
  meh: { value: 2, label: 'Meh', color: '#9CA3AF' },
  boring: { value: 1, label: 'Aburrida', color: '#6B7280' },
}

// Mapeo inverso: valor numérico a tipo de reacción
export const VALUE_TO_REACTION = {
  5: 'masterpiece',
  4: 'excellent',
  3: 'popcorn',
  2: 'meh',
  1: 'boring',
}

/**
 * Componente para seleccionar reacción de película
 * Reemplaza las estrellas con iconos cinematográficos
 */
export default function MovieReactionPicker({
  currentReaction = null,
  onReact,
  size = 'md',
  interactive = true,
  showLabel = true,
  disabled = false,
}) {
  const { t } = useTranslation()
  const [hoveredReaction, setHoveredReaction] = useState(null)

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-12 h-12',
  }

  const handleClick = (reactionType) => {
    if (interactive && onReact && !disabled) {
      onReact(reactionType)
    }
  }

  const reactionsList = Object.entries(MOVIE_REACTIONS)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-center gap-2">
        {reactionsList.map(([type, data]) => {
          const IconComponent = MovieReactionIcons[type]
          const isActive = currentReaction === type
          const isHovered = hoveredReaction === type

          return (
            <button
              key={type}
              type="button"
              onClick={() => handleClick(type)}
              onMouseEnter={() => interactive && setHoveredReaction(type)}
              onMouseLeave={() => setHoveredReaction(null)}
              disabled={!interactive || disabled}
              className={`
                relative p-2 rounded-xl transition-all duration-200 ease-out
                ${interactive && !disabled ? 'cursor-pointer hover:scale-125 hover:-translate-y-1' : 'cursor-default'}
                ${isActive ? 'scale-110 bg-gray-700/50 ring-2 ring-primary-500' : ''}
                ${isHovered && !isActive ? 'bg-gray-700/30' : ''}
                ${disabled ? 'opacity-50' : ''}
              `}
              title={data.label}
            >
              <div className={sizeClasses[size]}>
                <IconComponent
                  className="w-full h-full"
                  isActive={isActive}
                  isHovered={isHovered}
                />
              </div>

              {/* Tooltip en hover */}
              {isHovered && interactive && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1
                  bg-gray-900 text-white text-xs font-medium rounded
                  whitespace-nowrap z-10">
                  {data.label}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Label de la reacción seleccionada */}
      {showLabel && currentReaction && MOVIE_REACTIONS[currentReaction] && (
        <p
          className="text-center text-sm font-medium"
          style={{ color: MOVIE_REACTIONS[currentReaction].color }}
        >
          {MOVIE_REACTIONS[currentReaction].label}
        </p>
      )}
    </div>
  )
}

/**
 * Componente para mostrar el promedio de reacciones (display only)
 */
export function MovieReactionDisplay({
  averageRating,
  count = 0,
  size = 'md',
}) {
  // Convertir promedio numérico a reacción más cercana
  const roundedRating = Math.round(averageRating || 0)
  const reactionType = VALUE_TO_REACTION[roundedRating] || 'popcorn'
  const reactionData = MOVIE_REACTIONS[reactionType]
  const IconComponent = MovieReactionIcons[reactionType]

  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  }

  if (!averageRating || averageRating === 0) {
    return null
  }

  return (
    <div className="flex items-center gap-2">
      <div className={sizeClasses[size]}>
        <IconComponent className="w-full h-full" isActive={true} isHovered={false} />
      </div>
      <span className="text-sm font-medium" style={{ color: reactionData?.color }}>
        {reactionData?.label}
      </span>
      {count > 0 && (
        <span className="text-sm text-gray-400">
          ({count} {count === 1 ? 'voto' : 'votos'})
        </span>
      )}
    </div>
  )
}
