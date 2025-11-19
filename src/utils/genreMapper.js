// Mapeo de géneros de español a claves de traducción
const genreToKeyMap = {
  'Todos': 'all',
  'Drama': 'drama',
  'Comedia': 'comedy',
  'Acción': 'action',
  'Documental': 'documentary',
  'Thriller': 'thriller',
  'Terror': 'horror',
  'Ciencia Ficción': 'sciFi',
  'Romance': 'romance',
  'Animación': 'animation',
  'Experimental': 'experimental',
}

// Función para obtener la clave de traducción desde el género en español
export const getGenreTranslationKey = (genreInSpanish) => {
  const key = genreToKeyMap[genreInSpanish]
  return key ? `movies.genres.${key}` : genreInSpanish
}

// Función para obtener el género traducido
export const getTranslatedGenre = (genreInSpanish, t) => {
  const key = genreToKeyMap[genreInSpanish]
  if (!key) return genreInSpanish
  return t(`movies.genres.${key}`)
}
