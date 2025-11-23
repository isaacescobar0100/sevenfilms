import { Link } from 'react-router-dom'

/**
 * Componente que renderiza el contenido de un comentario
 * convirtiendo las menciones (@username) en enlaces clickeables
 */
function CommentContent({ content, onLinkClick, className = '' }) {
  if (!content) return null

  // Regex para encontrar menciones (@username)
  const mentionRegex = /@(\w+)/g
  const parts = []
  let lastIndex = 0
  let match

  while ((match = mentionRegex.exec(content)) !== null) {
    // Agregar texto antes de la mención
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: content.slice(lastIndex, match.index),
        key: `text-${lastIndex}`,
      })
    }

    // Agregar la mención como enlace
    parts.push({
      type: 'mention',
      content: match[0],
      username: match[1],
      key: `mention-${match.index}`,
    })

    lastIndex = match.index + match[0].length
  }

  // Agregar texto restante después de la última mención
  if (lastIndex < content.length) {
    parts.push({
      type: 'text',
      content: content.slice(lastIndex),
      key: `text-${lastIndex}`,
    })
  }

  // Si no hay menciones, retornar el texto normal
  if (parts.length === 0) {
    return <span className={className}>{content}</span>
  }

  return (
    <span className={className}>
      {parts.map((part) => {
        if (part.type === 'mention') {
          return (
            <Link
              key={part.key}
              to={`/profile/${part.username}`}
              onClick={onLinkClick}
              className="text-primary-600 dark:text-primary-400 hover:underline font-medium"
            >
              {part.content}
            </Link>
          )
        }
        return <span key={part.key}>{part.content}</span>
      })}
    </span>
  )
}

export default CommentContent
