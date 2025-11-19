import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import es from './locales/es.json'
import en from './locales/en.json'

// Obtener idioma guardado en localStorage o usar español por defecto
const savedLanguage = localStorage.getItem('language') || 'es'

i18n
  .use(initReactI18next)
  .init({
    resources: {
      es: { translation: es },
      en: { translation: en },
    },
    lng: savedLanguage, // Usar idioma guardado
    fallbackLng: 'es',
    interpolation: {
      escapeValue: false,
    },
  })

// Guardar en localStorage cuando cambie el idioma
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('language', lng)
})

export default i18n
