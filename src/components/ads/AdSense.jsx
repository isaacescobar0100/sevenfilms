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
  const isProduction = import.meta.env.PROD
  const isDevelopment = import.meta.env.DEV

  useEffect(() => {
    try {
      // Cargar el anuncio solo en producción
      if (isProduction && window.adsbygoogle && slot) {
        (window.adsbygoogle = window.adsbygoogle || []).push({})
      }
    } catch (error) {
      console.error('Error al cargar AdSense:', error)
    }
  }, [slot, isProduction])

  // No mostrar nada si no hay slot
  if (!slot) {
    return null
  }

  // En desarrollo, mostrar placeholder visual
  if (isDevelopment) {
    return (
      <div
        className={`adsense-placeholder ${className}`}
        style={{
          backgroundColor: '#f3f4f6',
          border: '2px dashed #d1d5db',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: style.minHeight || '250px',
          ...style,
        }}
      >
        <div style={{ textAlign: 'center', color: '#6b7280', padding: '20px' }}>
          <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
            AdSense Placeholder
          </div>
          <div style={{ fontSize: '12px' }}>
            Slot: {slot} • {format}
          </div>
          <div style={{ fontSize: '11px', marginTop: '8px', opacity: 0.7 }}>
            Los anuncios solo se muestran en producción
          </div>
        </div>
      </div>
    )
  }

  // En producción, mostrar anuncio real
  // NOTA: Los anuncios solo aparecerán cuando AdSense apruebe tu sitio
  return (
    <div className={`adsense-container ${className}`} style={style}>
      <ins
        className="adsbygoogle"
        style={{
          display: 'block',
          minHeight: '1px', // Evitar espacio vacío mientras no hay anuncios
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
