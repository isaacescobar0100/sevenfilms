import { Helmet } from 'react-helmet-async'

const DEFAULT_SEO = {
  siteName: 'Seven',
  defaultTitle: 'Seven - Red Social para Cineastas',
  defaultDescription: 'Conecta con cineastas independientes, comparte tus cortometrajes y descubre nuevo talento audiovisual.',
  defaultImage: '/og-image.png',
  twitterHandle: '@sevenfilms',
}

function SEO({
  title,
  description,
  image,
  url,
  type = 'website',
  noIndex = false,
}) {
  const seoTitle = title ? `${title} | ${DEFAULT_SEO.siteName}` : DEFAULT_SEO.defaultTitle
  const seoDescription = description || DEFAULT_SEO.defaultDescription
  const seoImage = image || DEFAULT_SEO.defaultImage
  const seoUrl = url || (typeof window !== 'undefined' ? window.location.href : '')

  return (
    <Helmet>
      {/* Titulo */}
      <title>{seoTitle}</title>

      {/* Meta tags basicos */}
      <meta name="description" content={seoDescription} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={seoUrl} />
      <meta property="og:title" content={seoTitle} />
      <meta property="og:description" content={seoDescription} />
      <meta property="og:image" content={seoImage} />
      <meta property="og:site_name" content={DEFAULT_SEO.siteName} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={seoUrl} />
      <meta name="twitter:title" content={seoTitle} />
      <meta name="twitter:description" content={seoDescription} />
      <meta name="twitter:image" content={seoImage} />
      <meta name="twitter:site" content={DEFAULT_SEO.twitterHandle} />
    </Helmet>
  )
}

export default SEO
