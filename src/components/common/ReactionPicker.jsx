import { useState, useRef, useEffect } from 'react'
import { Clapperboard } from 'lucide-react'
import { REACTIONS } from '../../hooks/usePostReactions'

// Iconos SVG personalizados para cada reacción (exportados para usar en otros componentes)
export const ReactionIcons = {
  // Trofeo Oscar - Obra Maestra
  masterpiece: ({ className, isActive, isHovered }) => (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <defs>
        <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFD700" />
          <stop offset="50%" stopColor="#FFA500" />
          <stop offset="100%" stopColor="#FFD700" />
        </linearGradient>
      </defs>
      <path
        d="M12 2L14.5 7.5L20.5 8L16 12.5L17.5 18.5L12 15.5L6.5 18.5L8 12.5L3.5 8L9.5 7.5L12 2Z"
        fill={isActive || isHovered ? "url(#goldGradient)" : "currentColor"}
        className={`transition-all duration-300 ${isActive ? 'drop-shadow-[0_0_8px_rgba(255,215,0,0.8)]' : ''}`}
      />
      <circle cx="12" cy="21" r="2" fill={isActive || isHovered ? "#FFD700" : "currentColor"} />
      <rect x="11" y="17" width="2" height="4" fill={isActive || isHovered ? "#FFD700" : "currentColor"} />
    </svg>
  ),

  // Estrella brillante - Excelente
  excellent: ({ className, isActive, isHovered }) => (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <defs>
        <linearGradient id="starGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFA500" />
          <stop offset="100%" stopColor="#FF6B00" />
        </linearGradient>
      </defs>
      <path
        d="M12 2L14.09 8.26L21 9.27L16 14.14L17.18 21.02L12 17.77L6.82 21.02L8 14.14L3 9.27L9.91 8.26L12 2Z"
        fill={isActive || isHovered ? "url(#starGradient)" : "currentColor"}
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

  // Palomitas - Entretenido
  popcorn: ({ className, isActive, isHovered }) => (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <defs>
        <linearGradient id="popcornGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF6B6B" />
          <stop offset="100%" stopColor="#EE5A5A" />
        </linearGradient>
        <linearGradient id="cornGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF8DC" />
          <stop offset="100%" stopColor="#F5DEB3" />
        </linearGradient>
      </defs>
      {/* Caja de palomitas */}
      <path
        d="M6 10L4 22H20L18 10H6Z"
        fill={isActive || isHovered ? "url(#popcornGradient)" : "currentColor"}
        className="transition-all duration-300"
      />
      {/* Rayas de la caja */}
      <path d="M8 10L7 22M12 10V22M16 10L17 22" stroke={isActive || isHovered ? "#fff" : "currentColor"} strokeWidth="0.5" opacity="0.5" />
      {/* Palomitas */}
      <circle cx="9" cy="6" r="2.5" fill={isActive || isHovered ? "url(#cornGradient)" : "currentColor"} />
      <circle cx="15" cy="6" r="2.5" fill={isActive || isHovered ? "url(#cornGradient)" : "currentColor"} />
      <circle cx="12" cy="4" r="2.5" fill={isActive || isHovered ? "url(#cornGradient)" : "currentColor"} />
      <circle cx="12" cy="8" r="2" fill={isActive || isHovered ? "url(#cornGradient)" : "currentColor"} />
    </svg>
  ),

  // Pulgar abajo estilizado - Meh
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

  // Zzz - Aburrido
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

// Icono de claqueta por defecto usando Lucide
const ClapperboardIcon = ({ className }) => (
  <Clapperboard className={className} />
)

/**
 * Selector de reacciones cinematográficas con iconos SVG personalizados
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
  const [isLongPressing, setIsLongPressing] = useState(false)
  const [animateButton, setAnimateButton] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef(null)
  const pickerRef = useRef(null)
  const longPressTimer = useRef(null)
  const hideTimer = useRef(null)
  const touchStartPos = useRef({ x: 0, y: 0 })

  const currentReactionData = currentReaction ? REACTIONS[currentReaction] : null
  const reactionsList = Object.entries(REACTIONS)

  // Limpiar timers al desmontar
  useEffect(() => {
    return () => {
      if (longPressTimer.current) clearTimeout(longPressTimer.current)
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
      const timer = setTimeout(() => setAnimateButton(false), 500)
      return () => clearTimeout(timer)
    }
  }, [currentReaction])

  const handleMouseEnter = () => {
    if (disabled) return
    if (hideTimer.current) clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => setShowPicker(true), 300)
  }

  const handleMouseLeave = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => {
      setShowPicker(false)
      setHoveredReaction(null)
    }, 300)
  }

  // Touch handlers para móvil estilo Facebook
  const handleTouchStart = (e) => {
    if (disabled) return
    const touch = e.touches[0]
    touchStartPos.current = { x: touch.clientX, y: touch.clientY }
    setIsLongPressing(false)
    setIsDragging(false)

    longPressTimer.current = setTimeout(() => {
      setIsLongPressing(true)
      setShowPicker(true)
      // Vibración haptica si está disponible
      if (navigator.vibrate) navigator.vibrate(50)
    }, 400)
  }

  const handleTouchMove = (e) => {
    if (!showPicker || !isLongPressing) {
      // Si no está el picker abierto, cancelar long press si se mueve mucho
      const touch = e.touches[0]
      const deltaX = Math.abs(touch.clientX - touchStartPos.current.x)
      const deltaY = Math.abs(touch.clientY - touchStartPos.current.y)
      if (deltaX > 10 || deltaY > 10) {
        if (longPressTimer.current) clearTimeout(longPressTimer.current)
      }
      return
    }

    setIsDragging(true)
    const touch = e.touches[0]

    // Encontrar qué reacción está bajo el dedo
    if (pickerRef.current) {
      const buttons = pickerRef.current.querySelectorAll('[data-reaction]')
      buttons.forEach(button => {
        const rect = button.getBoundingClientRect()
        if (
          touch.clientX >= rect.left &&
          touch.clientX <= rect.right &&
          touch.clientY >= rect.top &&
          touch.clientY <= rect.bottom
        ) {
          const reactionType = button.getAttribute('data-reaction')
          setHoveredReaction(reactionType)
        }
      })
    }
  }

  const handleTouchEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current)

    if (isLongPressing && showPicker) {
      // Si estaba arrastrando y hay una reacción seleccionada
      if (hoveredReaction) {
        onReact(hoveredReaction)
        if (navigator.vibrate) navigator.vibrate(30)
      }
      setShowPicker(false)
      setHoveredReaction(null)
      setIsLongPressing(false)
      setIsDragging(false)
      return
    }

    setIsLongPressing(false)
    setIsDragging(false)

    // Tap simple
    if (!showPicker) {
      if (currentReaction) {
        onReact(currentReaction)
      } else {
        onReact('popcorn')
      }
    }
  }

  const handleClick = () => {
    if (disabled) return
    if (!showPicker && window.innerWidth >= 768) {
      if (currentReaction) {
        onReact(currentReaction)
      } else {
        onReact('popcorn')
      }
    }
  }

  const handleSelectReaction = (reactionType) => {
    onReact(reactionType)
    setShowPicker(false)
    setHoveredReaction(null)
  }

  // Renderizar el icono actual
  const renderCurrentIcon = () => {
    if (currentReaction && ReactionIcons[currentReaction]) {
      const IconComponent = ReactionIcons[currentReaction]
      return <IconComponent className="w-6 h-6" isActive={true} isHovered={false} />
    }
    return <ClapperboardIcon className="w-6 h-6" />
  }

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Botón principal */}
      <button
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
        disabled={disabled}
        className={`flex items-center space-x-2 transition-all duration-300 select-none group touch-none
          ${currentReactionData ? 'text-primary-600' : 'text-gray-500 dark:text-gray-400'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}
          ${animateButton ? 'scale-125' : ''}
          ${isLongPressing ? 'scale-110' : ''}
        `}
      >
        {/* Icono con efecto de brillo */}
        <div className={`relative transition-transform duration-300 ${animateButton ? 'animate-bounce' : ''}`}>
          {renderCurrentIcon()}

          {/* Efecto de partículas al reaccionar */}
          {animateButton && currentReaction && (
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(6)].map((_, i) => (
                <span
                  key={i}
                  className="absolute w-1 h-1 rounded-full bg-primary-500 animate-ping"
                  style={{
                    left: `${50 + Math.cos(i * 60 * Math.PI / 180) * 20}%`,
                    top: `${50 + Math.sin(i * 60 * Math.PI / 180) * 20}%`,
                    animationDelay: `${i * 50}ms`,
                    animationDuration: '0.5s'
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Contador */}
        <span className={`text-sm font-semibold transition-colors duration-200
          ${currentReaction ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}
        `}>
          {totalReactions > 0 ? totalReactions : ''}
        </span>
      </button>

      {/* Picker de reacciones */}
      {showPicker && (
        <div
          ref={pickerRef}
          className="absolute bottom-full left-0 mb-3 z-50"
          onMouseEnter={() => { if (hideTimer.current) clearTimeout(hideTimer.current) }}
          onMouseLeave={handleMouseLeave}
        >
          {/* Contenedor con efecto glassmorphism */}
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg rounded-2xl shadow-2xl
            border border-gray-200/50 dark:border-gray-700/50 px-2 sm:px-3 py-2 flex items-center gap-0.5 sm:gap-1
            animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-200">

            {reactionsList.map(([type, data], index) => {
              const IconComponent = ReactionIcons[type]
              const isHovered = hoveredReaction === type
              const isActive = currentReaction === type

              return (
                <button
                  key={type}
                  data-reaction={type}
                  onClick={() => handleSelectReaction(type)}
                  onMouseEnter={() => setHoveredReaction(type)}
                  onMouseLeave={() => setHoveredReaction(null)}
                  className={`relative p-1.5 sm:p-2 rounded-xl transition-all duration-200 ease-out touch-none
                    ${isHovered ? 'scale-150 -translate-y-6 z-10' : 'scale-100'}
                    ${isActive ? 'bg-primary-100 dark:bg-primary-900/40' : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'}
                  `}
                  style={{
                    animation: `popIn 0.3s ease-out ${index * 50}ms both`
                  }}
                >
                  {/* Tooltip - siempre visible en móvil cuando está seleccionado */}
                  {isHovered && (
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5
                      bg-gray-900 dark:bg-gray-700 text-white text-xs font-medium rounded-lg
                      whitespace-nowrap shadow-lg animate-in fade-in zoom-in-95 duration-150 pointer-events-none">
                      {data.label}
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2
                        bg-gray-900 dark:bg-gray-700 rotate-45" />
                    </div>
                  )}

                  {/* Icono SVG */}
                  <div className={`w-7 h-7 sm:w-8 sm:h-8 transition-transform duration-200 ${isHovered ? 'animate-wiggle' : ''}`}>
                    <IconComponent
                      className="w-full h-full"
                      isActive={isActive}
                      isHovered={isHovered}
                    />
                  </div>

                  {/* Indicador de seleccionado */}
                  {isActive && !isHovered && (
                    <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5
                      bg-primary-500 rounded-full" />
                  )}
                </button>
              )
            })}
          </div>

          {/* Flecha apuntando al botón */}
          <div className="absolute -bottom-2 left-4 w-4 h-4
            bg-white/95 dark:bg-gray-800/95 rotate-45 border-r border-b
            border-gray-200/50 dark:border-gray-700/50" />
        </div>
      )}

      {/* Mini badges de reacciones populares - ocultos en móvil para evitar overflow */}
      {totalReactions > 0 && !showPicker && (
        <div className="hidden sm:flex absolute -top-1 left-full ml-1 -space-x-1.5">
          {Object.entries(reactionCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([type], index) => {
              const IconComponent = ReactionIcons[type]
              return (
                <div
                  key={type}
                  className="w-4 h-4 bg-white dark:bg-gray-700 rounded-full p-0.5
                    shadow-sm border border-gray-200 dark:border-gray-600"
                  style={{ zIndex: 3 - index }}
                >
                  <IconComponent className="w-full h-full" isActive={true} isHovered={false} />
                </div>
              )
            })
          }
        </div>
      )}

      {/* CSS para animaciones personalizadas */}
      <style>{`
        @keyframes popIn {
          0% { transform: scale(0) translateY(10px); opacity: 0; }
          70% { transform: scale(1.1) translateY(-2px); }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes wiggle {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-10deg); }
          75% { transform: rotate(10deg); }
        }
        .animate-wiggle {
          animation: wiggle 0.3s ease-in-out;
        }
      `}</style>
    </div>
  )
}

export default ReactionPicker
