import { useEffect } from 'react'

/**
 * Componente AdSense reutilizable
 *
 * INSTRUCCIONES:
 * 1. Cuando AdSense te apruebe, crea una variable de entorno en Vercel:
 *    VITE_ADSENSE_CLIENT_ID = "ca-pub-XXXXXXXXXX"
 *
 * 2. Agrega el script de AdSense en index.html (dentro de <head>):
 *    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXX"
 *            crossorigin="anonymous"></script>
 *
 * 3. Usa este componente en cualquier p�gina:
 *    <AdSense slot="1234567890" format="auto" />
 *
 * Props:
 * - slot: ID del slot de anuncio (lo obtienes de AdSense)
 * - format: 'auto', 'rectangle', 'vertical', 'horizontal'
 * - responsive: true/false (default: true)
 * - style: estilos personalizados
 */

export default function AdSense({
  slot,
  format = 'auto',
  responsive = true,
  style = {},
  className = '',
}) {
  const clientId = import.meta.env.VITE_ADSENSE_CLIENT_ID || 'ca-pub-2847173521235624'

  useEffect(() => {
    try {
      // Cargar el anuncio
      if (window.adsbygoogle && slot) {
        (window.adsbygoogle = window.adsbygoogle || []).push({})
      }
    } catch (error) {
      console.error('Error al cargar AdSense:', error)
    }
  }, [slot])

  // No mostrar nada si no hay slot
  if (!slot) {
    return null
  }

  return (
    <div className={`adsense-container ${className}`} style={style}>
      <ins
        className="adsbygoogle"
        style={{
          display: 'block',
          ...style,
        }}
        data-ad-client={clientId}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? 'true' : 'false'}
      />
    </div>
  )
}

/**
 * EJEMPLOS DE USO:
 *
 * 1. Banner horizontal en el feed:
 * <AdSense
 *   slot="1234567890"
 *   format="horizontal"
 *   style={{ minHeight: '90px' }}
 *   className="my-4"
 * />
 *
 * 2. Sidebar vertical:
 * <AdSense
 *   slot="0987654321"
 *   format="vertical"
 *   style={{ minWidth: '160px', minHeight: '600px' }}
 * />
 *
 * 3. In-feed (dentro del feed de posts):
 * <AdSense
 *   slot="1111111111"
 *   format="fluid"
 *   style={{ minHeight: '250px' }}
 * />
 *
 * 4. Rect�ngulo responsive:
 * <AdSense
 *   slot="2222222222"
 *   format="rectangle"
 *   responsive={true}
 * />
 *
 * ESTRATEGIA RECOMENDADA PARA SEVEN:
 *
 * 1. Feed (src/pages/Feed.jsx):
 *    - Cada 5 posts, insertar un anuncio in-feed
 *    - <AdSense slot="..." format="fluid" />
 *
 * 2. Perfil de usuario (src/pages/Profile.jsx):
 *    - Banner horizontal arriba del feed de posts
 *    - <AdSense slot="..." format="horizontal" />
 *
 * 3. Detalle de pel�cula (src/pages/MovieDetail.jsx):
 *    - Sidebar derecho con anuncio vertical
 *    - <AdSense slot="..." format="vertical" />
 *
 * 4. Mensajes (src/pages/Messages.jsx):
 *    - Banner horizontal en la parte superior
 *    - <AdSense slot="..." format="horizontal" />
 *
 * NO PONER ANUNCIOS EN:
 * - Login/Registro (mala experiencia de usuario)
 * - Configuraci�n (puede molestar)
 * - Primera visita (espera que el usuario explore primero)
 */
