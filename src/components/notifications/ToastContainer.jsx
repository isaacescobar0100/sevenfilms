import { useEffect, useState, useRef } from 'react'
import { useNotifications } from '../../hooks/useNotifications'
import Toast from './Toast'

const SHOWN_NOTIFICATIONS_KEY = 'shown_notification_toasts'

function ToastContainer() {
  const { data: notifications } = useNotifications()
  const [toasts, setToasts] = useState([])
  const shownNotificationsRef = useRef(new Set())
  const prevNotificationsRef = useRef([])

  // Cargar notificaciones mostradas desde localStorage al montar
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SHOWN_NOTIFICATIONS_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        shownNotificationsRef.current = new Set(parsed)
      }
    } catch (error) {
      console.error('Error loading shown notifications:', error)
    }
  }, [])

  // Limpiar notificaciones antiguas de localStorage (más de 24 horas)
  useEffect(() => {
    const cleanup = () => {
      if (!notifications || notifications.length === 0) return

      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
      const recentNotificationIds = notifications
        .filter((n) => new Date(n.created_at) > oneDayAgo)
        .map((n) => n.id)

      // Filtrar solo IDs recientes
      const filtered = [...shownNotificationsRef.current].filter((id) =>
        recentNotificationIds.includes(id)
      )

      shownNotificationsRef.current = new Set(filtered)
      localStorage.setItem(SHOWN_NOTIFICATIONS_KEY, JSON.stringify(filtered))
    }

    cleanup()
  }, [notifications])

  useEffect(() => {
    if (!notifications || notifications.length === 0) return

    // Comparar con notificaciones anteriores para detectar nuevas
    const prevIds = new Set(prevNotificationsRef.current.map((n) => n.id))
    const newNotifications = notifications.filter(
      (n) => !prevIds.has(n.id) && !shownNotificationsRef.current.has(n.id)
    )

    // Mostrar solo notificaciones realmente nuevas
    if (newNotifications.length > 0) {
      newNotifications.forEach((notification) => {
        // Agregar al toast
        setToasts((prev) => [...prev, notification])

        // Marcar como mostrada
        shownNotificationsRef.current.add(notification.id)
      })

      // Guardar en localStorage
      try {
        localStorage.setItem(
          SHOWN_NOTIFICATIONS_KEY,
          JSON.stringify([...shownNotificationsRef.current])
        )
      } catch (error) {
        console.error('Error saving shown notifications:', error)
      }
    }

    // Actualizar referencia
    prevNotificationsRef.current = notifications
  }, [notifications])

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col space-y-3 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast notification={toast} onClose={() => removeToast(toast.id)} />
        </div>
      ))}
    </div>
  )
}

export default ToastContainer
