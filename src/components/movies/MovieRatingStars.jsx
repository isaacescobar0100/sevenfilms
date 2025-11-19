import { useState } from 'react'
import { Star } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function MovieRatingStars({
  rating = 0,
  maxRating = 5,
  size = 'md',
  interactive = false,
  showCount = false,
  count = 0,
  onRate = null,
}) {
  const { t } = useTranslation()
  const [hoveredRating, setHoveredRating] = useState(0)

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
  }

  const handleClick = (value) => {
    if (interactive && onRate) {
      onRate(value)
    }
  }

  const handleMouseEnter = (value) => {
    if (interactive) {
      setHoveredRating(value)
    }
  }

  const handleMouseLeave = () => {
    if (interactive) {
      setHoveredRating(0)
    }
  }

  const displayRating = hoveredRating || rating

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {[...Array(maxRating)].map((_, index) => {
          const starValue = index + 1
          const isFilled = starValue <= displayRating
          const isHovered = interactive && starValue <= hoveredRating

          return (
            <button
              key={index}
              type="button"
              onClick={() => handleClick(starValue)}
              onMouseEnter={() => handleMouseEnter(starValue)}
              onMouseLeave={handleMouseLeave}
              disabled={!interactive}
              className={`
                ${sizeClasses[size]}
                transition-all
                ${
                  interactive
                    ? 'cursor-pointer hover:scale-110'
                    : 'cursor-default'
                }
                ${!interactive && 'pointer-events-none'}
              `}
              aria-label={`${starValue} ${t('movies.rating.ratings')}`}
            >
              <Star
                className={`
                  w-full h-full
                  transition-colors
                  ${
                    isFilled
                      ? isHovered
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'fill-yellow-500 text-yellow-500'
                      : isHovered
                      ? 'fill-yellow-200 text-yellow-200'
                      : 'fill-none text-gray-300'
                  }
                `}
              />
            </button>
          )
        })}
      </div>

      {showCount && count > 0 && (
        <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">
          ({count})
        </span>
      )}
    </div>
  )
}
