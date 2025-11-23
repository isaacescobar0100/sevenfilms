import { useState, useRef, useEffect, useCallback } from 'react'
import { useSearchMentions } from '../../hooks/useMentions'

/**
 * Input con soporte para menciones (@usuario)
 * Muestra un dropdown con sugerencias al escribir @
 */
function MentionInput({
  value,
  onChange,
  placeholder,
  className = '',
  onKeyDown,
  autoFocus = false,
  disabled = false,
  maxLength,
}) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [mentionSearch, setMentionSearch] = useState('')
  const [mentionStartIndex, setMentionStartIndex] = useState(-1)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef(null)
  const suggestionsRef = useRef(null)

  const { data: suggestions = [], isLoading } = useSearchMentions(mentionSearch)

  // Detectar cuando se escribe @
  const handleChange = useCallback((e) => {
    const newValue = e.target.value
    const cursorPos = e.target.selectionStart

    // Buscar @ antes del cursor
    const textBeforeCursor = newValue.slice(0, cursorPos)
    const lastAtIndex = textBeforeCursor.lastIndexOf('@')

    if (lastAtIndex !== -1) {
      // Verificar que @ no esté precedido por una letra (para evitar emails)
      const charBefore = lastAtIndex > 0 ? textBeforeCursor[lastAtIndex - 1] : ' '
      if (charBefore === ' ' || charBefore === '\n' || lastAtIndex === 0) {
        const searchText = textBeforeCursor.slice(lastAtIndex + 1)
        // Solo buscar si no hay espacios después del @
        if (!searchText.includes(' ')) {
          setMentionSearch(searchText)
          setMentionStartIndex(lastAtIndex)
          setShowSuggestions(true)
          setSelectedIndex(0)
        } else {
          setShowSuggestions(false)
          setMentionSearch('')
        }
      } else {
        setShowSuggestions(false)
        setMentionSearch('')
      }
    } else {
      setShowSuggestions(false)
      setMentionSearch('')
    }

    onChange(newValue)
  }, [onChange])

  // Seleccionar una sugerencia
  const selectSuggestion = useCallback((user) => {
    if (mentionStartIndex === -1) return

    const beforeMention = value.slice(0, mentionStartIndex)
    const afterCursor = value.slice(mentionStartIndex + mentionSearch.length + 1)
    const newValue = `${beforeMention}@${user.username} ${afterCursor}`

    onChange(newValue)
    setShowSuggestions(false)
    setMentionSearch('')
    setMentionStartIndex(-1)

    // Enfocar el input y posicionar cursor
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus()
        const newCursorPos = beforeMention.length + user.username.length + 2
        inputRef.current.setSelectionRange(newCursorPos, newCursorPos)
      }
    }, 0)
  }, [value, mentionStartIndex, mentionSearch, onChange])

  // Manejar teclas especiales
  const handleKeyDown = useCallback((e) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % suggestions.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length)
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        selectSuggestion(suggestions[selectedIndex])
        return
      } else if (e.key === 'Escape') {
        e.preventDefault()
        setShowSuggestions(false)
        return
      }
    }

    // Llamar al onKeyDown original si existe
    if (onKeyDown) {
      onKeyDown(e)
    }
  }, [showSuggestions, suggestions, selectedIndex, selectSuggestion, onKeyDown])

  // Cerrar sugerencias al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target) &&
        inputRef.current &&
        !inputRef.current.contains(e.target)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Scroll al elemento seleccionado
  useEffect(() => {
    if (showSuggestions && suggestionsRef.current) {
      const selected = suggestionsRef.current.children[selectedIndex]
      if (selected) {
        selected.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [selectedIndex, showSuggestions])

  return (
    <div className="relative w-full">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
        autoFocus={autoFocus}
        disabled={disabled}
        maxLength={maxLength}
      />

      {/* Dropdown de sugerencias */}
      {showSuggestions && (suggestions.length > 0 || isLoading) && (
        <div
          ref={suggestionsRef}
          className="absolute bottom-full left-0 right-0 mb-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-48 overflow-y-auto z-50"
        >
          {isLoading ? (
            <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
              Buscando...
            </div>
          ) : (
            suggestions.map((user, index) => (
              <button
                key={user.id}
                type="button"
                onClick={() => selectSuggestion(user)}
                className={`w-full px-3 py-2 flex items-center space-x-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left ${
                  index === selectedIndex ? 'bg-gray-100 dark:bg-gray-700' : ''
                }`}
              >
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.username}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 text-sm font-medium">
                    {user.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {user.full_name || user.username}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    @{user.username}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default MentionInput
