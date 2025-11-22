import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'dark' | 'system'

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

// Función para aplicar el tema al DOM
const applyTheme = (theme: Theme) => {
  const root = window.document.documentElement

  if (theme === 'system') {
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    root.classList.remove('light', 'dark')
    root.classList.add(systemTheme)
  } else {
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
  }
}

// Escuchar cambios en preferencia del sistema
if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    const state = useThemeStore.getState()
    if (state.theme === 'system') {
      applyTheme('system')
    }
  })
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'system',

      setTheme: (theme: Theme) => {
        set({ theme })
        applyTheme(theme)
      },

      toggleTheme: () => {
        const currentTheme = get().theme
        const root = window.document.documentElement
        const isDark = root.classList.contains('dark')

        // Si está en system, detectar estado actual y cambiar al opuesto
        const newTheme = isDark ? 'light' : 'dark'
        set({ theme: newTheme })
        applyTheme(newTheme)
      },
    }),
    {
      name: 'theme-storage',
      onRehydrateStorage: () => (state) => {
        // Aplicar tema guardado al cargar
        if (state) {
          applyTheme(state.theme)
        }
      },
    }
  )
)

// Inicializar tema al cargar
if (typeof window !== 'undefined') {
  const savedTheme = localStorage.getItem('theme-storage')
  if (savedTheme) {
    try {
      const { state } = JSON.parse(savedTheme)
      applyTheme(state.theme || 'system')
    } catch {
      applyTheme('system')
    }
  } else {
    applyTheme('system')
  }
}
