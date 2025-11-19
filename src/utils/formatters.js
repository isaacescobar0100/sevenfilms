import { format, formatDistanceToNow } from 'date-fns'
import { es, enUS } from 'date-fns/locale'
import i18n from '../i18n'

function getDateFnsLocale() {
  const currentLang = i18n.language
  return currentLang === 'es' ? es : enUS
}

export function formatDate(date) {
  if (!date) return ''
  return format(new Date(date), 'dd/MM/yyyy', { locale: getDateFnsLocale() })
}

export function formatDateTime(date) {
  if (!date) return ''
  return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: getDateFnsLocale() })
}

export function formatRelativeTime(date) {
  if (!date) return ''
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: getDateFnsLocale() })
}

export function truncateText(text, maxLength = 100) {
  if (!text || text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}
