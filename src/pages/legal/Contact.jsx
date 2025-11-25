import { useState } from 'react'
import { ArrowLeft, Mail, MessageCircle, Send } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'

export default function Contact() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [formData, setFormData] = useState({
    name: '',
    email: user?.email || '',
    subject: '',
    message: '',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      // Guardar mensaje en tabla de contacto
      const { error: insertError } = await supabase
        .from('contact_messages')
        .insert([
          {
            user_id: user?.id || null,
            name: formData.name,
            email: formData.email,
            subject: formData.subject,
            message: formData.message,
          },
        ])

      if (insertError) throw insertError

      setSuccess(true)
      setFormData({
        name: '',
        email: user?.email || '',
        subject: '',
        message: '',
      })
    } catch (err) {
      console.error('Error al enviar mensaje:', err)
      setError('Error al enviar el mensaje. Por favor intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
        >
          <ArrowLeft className="h-5 w-5" />
          Volver
        </button>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Info */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
            <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
              Contáctanos
            </h1>

            <div className="space-y-6">
              <div className="flex gap-4">
                <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Soporte y consultas
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    Si tienes alguna pregunta, problema técnico o sugerencia, completa el formulario
                    y te responderemos lo antes posible.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <MessageCircle className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Feedback de la comunidad
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    Tu opinión es importante. Comparte tus ideas para mejorar Seven y ayúdanos a
                    crear la mejor plataforma para cinéfilos.
                  </p>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                  Preguntas frecuentes
                </h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      ¿Cómo recupero mi contraseña?
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      Usa la opción "¿Olvidaste tu contraseña?" en la página de login.
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      ¿Cómo elimino mi cuenta?
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      Ve a Configuración → Cuenta → Eliminar cuenta.
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      ¿Cómo reporto contenido inapropiado?
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      Usa el menú de opciones en cualquier post y selecciona "Reportar".
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Formulario */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
              Envíanos un mensaje
            </h2>

            {success && (
              <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-green-800 dark:text-green-200">
                  ¡Mensaje enviado exitosamente! Te responderemos pronto.
                </p>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Nombre
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label
                  htmlFor="subject"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Asunto
                </label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Selecciona un asunto</option>
                  <option value="soporte">Soporte técnico</option>
                  <option value="sugerencia">Sugerencia de mejora</option>
                  <option value="bug">Reporte de bug</option>
                  <option value="cuenta">Problema con mi cuenta</option>
                  <option value="contenido">Reporte de contenido</option>
                  <option value="otro">Otro</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Mensaje
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                  placeholder="Describe tu consulta o problema..."
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  'Enviando...'
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    Enviar mensaje
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
