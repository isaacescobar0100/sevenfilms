import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

function PrivacyPolicy() {
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
            Politica de Privacidad
          </h1>
          <p className="text-gray-500 mb-8">
            Ultima actualizacion: 21 de noviembre de 2025
          </p>

          <div className="prose prose-gray max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                1. Introduccion
              </h2>
              <p className="text-gray-600 mb-4">
                Seven Cineamateur ("nosotros", "nuestro" o "la plataforma") se compromete a proteger
                la privacidad de nuestros usuarios. Esta Politica de Privacidad explica como
                recopilamos, usamos, divulgamos y protegemos tu informacion cuando utilizas
                nuestra plataforma web y aplicacion movil.
              </p>
              <p className="text-gray-600">
                Al usar Seven Cineamateur, aceptas las practicas descritas en esta politica.
                Si no estas de acuerdo con esta politica, por favor no uses nuestros servicios.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                2. Informacion que Recopilamos
              </h2>

              <h3 className="text-lg font-medium text-gray-800 mb-2">
                2.1 Informacion que nos proporcionas
              </h3>
              <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
                <li>Informacion de registro: nombre, correo electronico, nombre de usuario y contrasena</li>
                <li>Informacion de perfil: foto de perfil, biografia, ubicacion y enlaces a redes sociales</li>
                <li>Contenido: peliculas, videos, imagenes, comentarios y mensajes que publicas</li>
                <li>Comunicaciones: mensajes que nos envias y correspondencia con soporte</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-800 mb-2">
                2.2 Informacion recopilada automaticamente
              </h3>
              <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
                <li>Datos de uso: paginas visitadas, tiempo de uso, interacciones con el contenido</li>
                <li>Informacion del dispositivo: tipo de dispositivo, sistema operativo, navegador</li>
                <li>Direccion IP y ubicacion aproximada</li>
                <li>Cookies y tecnologias similares</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                3. Como Usamos tu Informacion
              </h2>
              <p className="text-gray-600 mb-4">Utilizamos la informacion recopilada para:</p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Proporcionar, mantener y mejorar nuestros servicios</li>
                <li>Crear y gestionar tu cuenta de usuario</li>
                <li>Procesar y almacenar tu contenido (peliculas, imagenes, etc.)</li>
                <li>Personalizar tu experiencia y mostrar contenido relevante</li>
                <li>Comunicarnos contigo sobre actualizaciones, seguridad y soporte</li>
                <li>Detectar, prevenir y abordar problemas tecnicos y de seguridad</li>
                <li>Cumplir con obligaciones legales</li>
                <li>Mostrar publicidad relevante (ver seccion de Publicidad)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                4. Publicidad y Cookies de Terceros
              </h2>

              <h3 className="text-lg font-medium text-gray-800 mb-2">
                4.1 Google AdSense
              </h3>
              <p className="text-gray-600 mb-4">
                Seven Cineamateur utiliza Google AdSense para mostrar anuncios publicitarios.
                Google AdSense utiliza cookies (como la cookie DoubleClick) para mostrar anuncios
                basados en tus visitas previas a este sitio web y otros sitios en Internet.
              </p>
              <p className="text-gray-600 mb-4">
                Los proveedores externos, incluido Google, utilizan cookies para mostrar anuncios
                en funcion de las visitas anteriores de un usuario a este sitio web u otros sitios web.
                Google utiliza cookies publicitarias para habilitar a Google y a sus socios mostrar
                anuncios basados en tu visita a este sitio y/o a otros sitios de Internet.
              </p>

              <h3 className="text-lg font-medium text-gray-800 mb-2 mt-4">
                4.2 Que informacion recopila Google AdSense
              </h3>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Direccion IP y ubicacion geografica aproximada</li>
                <li>Informacion del navegador y dispositivo</li>
                <li>Paginas visitadas en nuestro sitio</li>
                <li>Tiempo de permanencia en las paginas</li>
                <li>Interacciones con anuncios</li>
                <li>Cookies de seguimiento publicitario</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-800 mb-2 mt-4">
                4.3 Como desactivar la publicidad personalizada
              </h3>
              <p className="text-gray-600 mb-4">
                Puedes inhabilitar el uso de cookies de publicidad personalizada visitando:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>
                  <strong>Configuracion de anuncios de Google:</strong>{' '}
                  <a
                    href="https://www.google.com/settings/ads"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:underline"
                  >
                    google.com/settings/ads
                  </a>
                </li>
                <li>
                  <strong>Inhabilitar cookies de DoubleClick:</strong>{' '}
                  <a
                    href="https://adssettings.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:underline"
                  >
                    adssettings.google.com
                  </a>
                </li>
                <li>
                  <strong>Network Advertising Initiative:</strong>{' '}
                  <a
                    href="https://www.networkadvertising.org/choices/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:underline"
                  >
                    networkadvertising.org/choices
                  </a>
                </li>
              </ul>
              <p className="text-gray-600 mt-4">
                Ten en cuenta que desactivar las cookies publicitarias no significa que dejaras
                de ver anuncios, sino que los anuncios que veas no estaran personalizados segun
                tus intereses.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                5. Compartir Informacion
              </h2>
              <p className="text-gray-600 mb-4">
                No vendemos tu informacion personal. Podemos compartir tu informacion en las
                siguientes circunstancias:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li><strong>Contenido publico:</strong> Las peliculas y perfiles publicos son visibles para otros usuarios</li>
                <li><strong>Proveedores de servicios:</strong> Compartimos datos con terceros que nos ayudan a operar (almacenamiento, analitica, etc.)</li>
                <li><strong>Requisitos legales:</strong> Cuando sea requerido por ley o para proteger derechos</li>
                <li><strong>Transferencias comerciales:</strong> En caso de fusion, adquisicion o venta de activos</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                6. Almacenamiento y Seguridad
              </h2>
              <p className="text-gray-600 mb-4">
                Tus datos se almacenan en servidores seguros proporcionados por Supabase y
                otros proveedores de servicios en la nube. Implementamos medidas de seguridad
                tecnicas y organizativas para proteger tu informacion, incluyendo:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Encriptacion de datos en transito (HTTPS/TLS)</li>
                <li>Encriptacion de contrasenas</li>
                <li>Acceso restringido a datos personales</li>
                <li>Monitoreo de seguridad continuo</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                7. Tus Derechos
              </h2>
              <p className="text-gray-600 mb-4">Tienes derecho a:</p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li><strong>Acceder:</strong> Solicitar una copia de tus datos personales</li>
                <li><strong>Rectificar:</strong> Corregir datos inexactos o incompletos</li>
                <li><strong>Eliminar:</strong> Solicitar la eliminacion de tu cuenta y datos</li>
                <li><strong>Portabilidad:</strong> Recibir tus datos en formato estructurado</li>
                <li><strong>Oposicion:</strong> Oponerte al procesamiento de tus datos</li>
                <li><strong>Retirar consentimiento:</strong> Retirar tu consentimiento en cualquier momento</li>
              </ul>
              <p className="text-gray-600 mt-4">
                Para ejercer estos derechos, contactanos en:{' '}
                <a href="mailto:privacidad@sevenfilms.app" className="text-primary-600 hover:underline">
                  privacidad@sevenfilms.app
                </a>
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                8. Cookies
              </h2>
              <p className="text-gray-600 mb-4">
                Utilizamos cookies y tecnologias similares para:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Mantener tu sesion iniciada</li>
                <li>Recordar tus preferencias</li>
                <li>Analizar el uso de la plataforma</li>
                <li>Mostrar publicidad relevante</li>
              </ul>
              <p className="text-gray-600 mt-4">
                Puedes configurar tu navegador para rechazar cookies, aunque esto puede
                afectar la funcionalidad de la plataforma.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                9. Menores de Edad
              </h2>
              <p className="text-gray-600">
                Seven Cineamateur no esta dirigido a menores de 13 anos. No recopilamos
                intencionalmente informacion de ninos menores de 13 anos. Si descubrimos
                que hemos recopilado datos de un menor sin el consentimiento parental
                verificable, eliminaremos esa informacion.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                10. Cambios a esta Politica
              </h2>
              <p className="text-gray-600">
                Podemos actualizar esta Politica de Privacidad periodicamente. Te notificaremos
                sobre cambios significativos publicando la nueva politica en esta pagina y,
                si es apropiado, enviandote una notificacion por correo electronico.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                11. Contacto
              </h2>
              <p className="text-gray-600">
                Si tienes preguntas sobre esta Politica de Privacidad, contactanos en:
              </p>
              <ul className="list-none mt-4 text-gray-600 space-y-1">
                <li><strong>Email:</strong> privacidad@sevenfilms.app</li>
                <li><strong>Plataforma:</strong> Seven Cineamateur</li>
                <li><strong>Sitio web:</strong> sevenfilms.vercel.app</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PrivacyPolicy
