import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al inicio
        </Link>

        <div className="bg-white rounded-xl shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Terminos y Condiciones de Servicio
          </h1>
          <p className="text-gray-500 mb-8">
            Ultima actualizacion: 21 de noviembre de 2025
          </p>

          <div className="prose prose-gray max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                1. Aceptacion de los Terminos
              </h2>
              <p className="text-gray-600 mb-4">
                Al acceder o utilizar Seven Cineamateur ("la Plataforma", "el Servicio"),
                aceptas estar sujeto a estos Terminos y Condiciones de Servicio ("Terminos").
                Si no estas de acuerdo con alguna parte de estos terminos, no podras acceder
                al servicio.
              </p>
              <p className="text-gray-600">
                Estos Terminos se aplican a todos los usuarios, visitantes y otras personas
                que accedan o utilicen el Servicio.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                2. Descripcion del Servicio
              </h2>
              <p className="text-gray-600 mb-4">
                Seven Cineamateur es una plataforma social para cineastas amateurs que permite:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Subir y compartir peliculas y contenido audiovisual</li>
                <li>Crear perfiles de cineasta</li>
                <li>Interactuar con otros usuarios mediante comentarios y mensajes</li>
                <li>Descubrir contenido de otros creadores</li>
                <li>Construir una comunidad de cineastas independientes</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                3. Registro y Cuenta
              </h2>

              <h3 className="text-lg font-medium text-gray-800 mb-2">
                3.1 Elegibilidad
              </h3>
              <p className="text-gray-600 mb-4">
                Debes tener al menos 13 anos para usar el Servicio. Al crear una cuenta,
                declaras que tienes al menos 13 anos y que toda la informacion proporcionada
                es veraz y precisa.
              </p>

              <h3 className="text-lg font-medium text-gray-800 mb-2">
                3.2 Seguridad de la Cuenta
              </h3>
              <p className="text-gray-600 mb-4">
                Eres responsable de mantener la confidencialidad de tu cuenta y contrasena.
                Aceptas notificarnos inmediatamente sobre cualquier uso no autorizado de tu cuenta.
              </p>

              <h3 className="text-lg font-medium text-gray-800 mb-2">
                3.3 Una Cuenta por Usuario
              </h3>
              <p className="text-gray-600">
                Cada usuario puede tener solo una cuenta. Las cuentas multiples pueden ser
                suspendidas o eliminadas.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                4. Contenido del Usuario
              </h2>

              <h3 className="text-lg font-medium text-gray-800 mb-2">
                4.1 Propiedad
              </h3>
              <p className="text-gray-600 mb-4">
                Conservas todos los derechos de propiedad sobre el contenido que publicas
                en Seven Cineamateur. Al publicar contenido, nos otorgas una licencia
                mundial, no exclusiva, libre de regalias para usar, reproducir, modificar,
                adaptar, publicar y mostrar dicho contenido en conexion con el Servicio.
              </p>

              <h3 className="text-lg font-medium text-gray-800 mb-2">
                4.2 Responsabilidad del Contenido
              </h3>
              <p className="text-gray-600 mb-4">
                Eres el unico responsable del contenido que publicas. Declaras y garantizas que:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Tienes todos los derechos necesarios para publicar el contenido</li>
                <li>El contenido no infringe derechos de terceros</li>
                <li>El contenido cumple con estos Terminos y la ley aplicable</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-800 mb-2 mt-4">
                4.3 Contenido Prohibido
              </h3>
              <p className="text-gray-600 mb-4">No esta permitido publicar contenido que:</p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Sea ilegal, danino, amenazante, abusivo o difamatorio</li>
                <li>Contenga pornografia o explotacion sexual</li>
                <li>Promueva violencia, odio o discriminacion</li>
                <li>Infrinja derechos de autor, marcas u otros derechos de propiedad intelectual</li>
                <li>Contenga virus, malware o codigo malicioso</li>
                <li>Sea spam, publicidad no solicitada o contenido enganoso</li>
                <li>Suplante la identidad de otra persona</li>
                <li>Viole la privacidad de terceros</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                5. Derechos de Autor
              </h2>
              <p className="text-gray-600 mb-4">
                Respetamos los derechos de propiedad intelectual de terceros. Si crees que
                tu trabajo protegido por derechos de autor ha sido copiado de manera que
                constituye una infraccion, contactanos en:{' '}
                <a href="mailto:copyright@sevenfilms.app" className="text-primary-600 hover:underline">
                  copyright@sevenfilms.app
                </a>
              </p>
              <p className="text-gray-600">
                Nos reservamos el derecho de eliminar contenido que infrinja derechos de
                autor y terminar las cuentas de infractores reincidentes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                6. Conducta del Usuario
              </h2>
              <p className="text-gray-600 mb-4">Al usar el Servicio, aceptas no:</p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Violar leyes o regulaciones aplicables</li>
                <li>Acosar, intimidar o amenazar a otros usuarios</li>
                <li>Interferir con el funcionamiento del Servicio</li>
                <li>Intentar acceder sin autorizacion a sistemas o datos</li>
                <li>Usar bots, scripts o metodos automatizados sin permiso</li>
                <li>Recopilar informacion de usuarios sin consentimiento</li>
                <li>Crear cuentas falsas o enganosas</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                7. Publicidad
              </h2>
              <p className="text-gray-600">
                El Servicio puede incluir anuncios publicitarios proporcionados por terceros,
                incluyendo Google AdSense. Al usar el Servicio, aceptas la visualizacion de
                dichos anuncios. No somos responsables del contenido de los anuncios de terceros.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                8. Terminacion
              </h2>
              <p className="text-gray-600 mb-4">
                Podemos suspender o terminar tu acceso al Servicio inmediatamente, sin previo
                aviso ni responsabilidad, por cualquier motivo, incluyendo, sin limitacion,
                si incumples estos Terminos.
              </p>
              <p className="text-gray-600">
                Puedes eliminar tu cuenta en cualquier momento desde la configuracion de tu
                perfil. Al eliminar tu cuenta, tu contenido puede ser eliminado permanentemente.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                9. Limitacion de Responsabilidad
              </h2>
              <p className="text-gray-600 mb-4">
                EL SERVICIO SE PROPORCIONA "TAL CUAL" Y "SEGUN DISPONIBILIDAD" SIN GARANTIAS
                DE NINGUN TIPO, YA SEAN EXPRESAS O IMPLICITAS.
              </p>
              <p className="text-gray-600 mb-4">
                En ningún caso Seven Cineamateur, sus directores, empleados o agentes seran
                responsables por danos indirectos, incidentales, especiales, consecuentes o
                punitivos resultantes de:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Tu uso o incapacidad de usar el Servicio</li>
                <li>Cualquier contenido obtenido del Servicio</li>
                <li>Acceso no autorizado a tus datos</li>
                <li>Declaraciones o conducta de terceros en el Servicio</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                10. Indemnizacion
              </h2>
              <p className="text-gray-600">
                Aceptas defender, indemnizar y mantener indemne a Seven Cineamateur y sus
                afiliados de cualquier reclamacion, dano, obligacion, perdida, responsabilidad,
                costo o deuda que surja de tu uso del Servicio o tu violacion de estos Terminos.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                11. Modificaciones
              </h2>
              <p className="text-gray-600">
                Nos reservamos el derecho de modificar o reemplazar estos Terminos en cualquier
                momento. Si una revision es material, proporcionaremos al menos 30 dias de
                aviso antes de que los nuevos terminos entren en vigor. Lo que constituye un
                cambio material sera determinado a nuestra sola discrecion.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                12. Ley Aplicable
              </h2>
              <p className="text-gray-600">
                Estos Terminos se regiran e interpretaran de acuerdo con las leyes aplicables,
                sin tener en cuenta sus disposiciones sobre conflictos de leyes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                13. Contacto
              </h2>
              <p className="text-gray-600">
                Si tienes preguntas sobre estos Terminos, contactanos en:
              </p>
              <ul className="list-none mt-4 text-gray-600 space-y-1">
                <li><strong>Email:</strong> legal@sevenfilms.app</li>
                <li><strong>Plataforma:</strong> Seven Cineamateur</li>
                <li><strong>Sitio web:</strong> sevenfilms.vercel.app</li>
              </ul>
            </section>

            <section className="mt-8 p-4 bg-gray-100 rounded-lg">
              <p className="text-gray-600 text-sm">
                Al usar Seven Cineamateur, reconoces que has leido, entendido y aceptas
                estar sujeto a estos Terminos y Condiciones de Servicio, asi como a nuestra{' '}
                <Link to="/privacy" className="text-primary-600 hover:underline">
                  Politica de Privacidad
                </Link>.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TermsOfService
