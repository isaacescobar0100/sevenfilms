import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Terms() {
  const navigate = useNavigate()

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

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">
            Términos de Servicio
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
            Última actualización: {new Date().toLocaleDateString('es-ES')}
          </p>

          <div className="prose dark:prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                1. Aceptación de los términos
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                Al acceder y usar Seven, aceptas estar sujeto a estos Términos de Servicio y a nuestra
                Política de Privacidad. Si no estás de acuerdo, no uses la plataforma.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                2. Descripción del servicio
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Seven es una red social para cinéfilos que permite:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                <li>Compartir opiniones sobre películas</li>
                <li>Crear y gestionar listas de películas</li>
                <li>Seguir a otros usuarios y ver su actividad</li>
                <li>Enviar mensajes directos</li>
                <li>Reaccionar y comentar contenido</li>
                <li>Descubrir nuevas películas y recomendaciones</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                3. Requisitos de cuenta
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Para usar Seven:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                <li>Debes tener al menos 13 años de edad</li>
                <li>Debes proporcionar información precisa y actualizada</li>
                <li>Eres responsable de mantener la seguridad de tu cuenta</li>
                <li>No puedes crear múltiples cuentas para evadir restricciones</li>
                <li>No puedes transferir tu cuenta a otra persona</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                4. Contenido del usuario
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Al publicar contenido en Seven:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                <li>Conservas los derechos de tu contenido</li>
                <li>Nos otorgas una licencia mundial, no exclusiva y libre de regalías para usar, mostrar y distribuir tu contenido</li>
                <li>Eres responsable del contenido que publicas</li>
                <li>Garantizas que tienes los derechos necesarios para publicar el contenido</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                5. Conducta prohibida
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                No está permitido:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                <li>Acosar, amenazar o intimidar a otros usuarios</li>
                <li>Publicar contenido ilegal, ofensivo o inapropiado</li>
                <li>Violar derechos de propiedad intelectual</li>
                <li>Hacer spam o publicar contenido promocional excesivo</li>
                <li>Usar bots o automatización sin autorización</li>
                <li>Intentar acceder a cuentas de otros usuarios</li>
                <li>Distribuir malware o contenido dañino</li>
                <li>Manipular o abusar de las funciones de la plataforma</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                6. Moderación de contenido
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                Nos reservamos el derecho de revisar, eliminar o moderar cualquier contenido que viole
                estos términos. Podemos suspender o terminar cuentas que infrinjan repetidamente las reglas.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                7. Propiedad intelectual
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                Seven y su contenido original (diseño, código, logos) están protegidos por derechos de autor
                y otras leyes de propiedad intelectual. No puedes copiar, modificar o distribuir nuestro
                contenido sin permiso.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                8. Publicidad
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                Seven puede mostrar publicidad (Google AdSense) para financiar el servicio. Al usar la
                plataforma, aceptas ver estos anuncios.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                9. Limitación de responsabilidad
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Seven se proporciona "tal cual" sin garantías de ningún tipo. No nos hacemos responsables de:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                <li>Pérdida de datos o contenido</li>
                <li>Interrupciones del servicio</li>
                <li>Contenido de terceros o usuarios</li>
                <li>Daños directos, indirectos o consecuentes</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                10. Modificaciones del servicio
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                Nos reservamos el derecho de modificar, suspender o discontinuar cualquier parte del servicio
                en cualquier momento, con o sin previo aviso.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                11. Terminación
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                Puedes eliminar tu cuenta en cualquier momento desde la configuración. Podemos suspender o
                terminar tu cuenta si violas estos términos.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                12. Cambios a los términos
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                Podemos actualizar estos términos ocasionalmente. El uso continuado del servicio después de
                cambios constituye aceptación de los nuevos términos.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                13. Contacto
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                Si tienes preguntas sobre estos términos, contáctanos a través de la{' '}
                <a
                  href="/contact"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  página de contacto
                </a>
                .
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
