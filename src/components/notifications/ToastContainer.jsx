import { useEffect, useState, useRef } from 'react'
import { useNotifications } from '../../hooks/useNotifications'
import Toast from './Toast'

const SHOWN_NOTIFICATIONS_KEY = 'shown_notification_toasts'
const LAST_CHECK_KEY = 'last_notification_check'

function ToastContainer() {
  const { data: notifications } = useNotifications()
  const [toasts, setToasts] = useState([])
  const shownNotificationsRef = useRef(new Set())
  const initialLoadRef = useRef(true)
  const lastCheckTimeRef = useRef(null)

  // Cargar datos desde localStorage al montar
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SHOWN_NOTIFICATIONS_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        shownNotificationsRef.current = new Set(parsed)
      }

      // Cargar última vez que se verificaron notificaciones
      const lastCheck = localStorage.getItem(LAST_CHECK_KEY)
      if (lastCheck) {
        lastCheckTimeRef.current = new Date(lastCheck)
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

    // En la carga inicial, solo marcar todas como "vistas" sin mostrar toasts
    // Esto evita mostrar notificaciones viejas al refrescar/iniciar sesión
    if (initialLoadRef.current) {
      initialLoadRef.current = false

      // Marcar todas las notificaciones existentes como ya mostradas
      notifications.forEach((notification) => {
        shownNotificationsRef.current.add(notification.id)
      })

      // Guardar en localStorage
      try {
        localStorage.setItem(
          SHOWN_NOTIFICATIONS_KEY,
          JSON.stringify([...shownNotificationsRef.current])
        )
        // Actualizar tiempo de última verificación
        localStorage.setItem(LAST_CHECK_KEY, new Date().toISOString())
      } catch (error) {
        console.error('Error saving shown notifications:', error)
      }

      return
    }

    // Solo mostrar notificaciones que llegaron DESPUÉS de la carga inicial
    // y que no han sido mostradas aún
    const newNotifications = notifications.filter(
      (n) => !shownNotificationsRef.current.has(n.id)
    )

    // Mostrar solo notificaciones realmente nuevas (llegadas en tiempo real)
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
