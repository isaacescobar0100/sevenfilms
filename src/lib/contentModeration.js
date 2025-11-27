/**
 * Servicio de moderación de contenido usando Supabase Edge Function
 * La Edge Function llama a Sightengine API de forma segura (credenciales en servidor)
 * Detecta: nudity, weapons, drugs, violence, gore, offensive gestures
 */

// URL de la Edge Function de Supabase
const MODERATION_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/moderate-image`

/**
 * Modera una imagen por URL
 * @param {string} imageUrl - URL de la imagen a moderar
 * @returns {Promise<{safe: boolean, reasons: string[], details: object}>}
 */
export async function moderateImageByUrl(imageUrl) {
  try {
    console.log('[Moderation] Moderando URL via Edge Function:', imageUrl)

    const response = await fetch(MODERATION_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ imageUrl }),
    })

    const result = await response.json()
    console.log('[Moderation] Edge Function response:', result)

    return result
  } catch (error) {
    console.error('[Moderation] Error calling Edge Function:', error)
    // FAIL-CLOSED: bloquear si hay error
    return { safe: false, reasons: ['Error de conexión al verificar contenido'], details: { error: error.message } }
  }
}

/**
 * Modera una imagen por archivo (File o Blob)
 * @param {File|Blob} file - Archivo de imagen
 * @returns {Promise<{safe: boolean, reasons: string[], details: object}>}
 */
export async function moderateImageByFile(file) {
  try {
    console.log('[Moderation] Moderando archivo via Edge Function:', file.name, file.type, file.size)

    const formData = new FormData()
    formData.append('media', file)

    const response = await fetch(MODERATION_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: formData,
    })

    const result = await response.json()
    console.log('[Moderation] Edge Function response:', result)

    return result
  } catch (error) {
    console.error('[Moderation] Error calling Edge Function:', error)
    // FAIL-CLOSED: bloquear si hay error
    return { safe: false, reasons: ['Error de conexión al verificar contenido'], details: { error: error.message } }
  }
}

/**
 * Mensaje de error amigable para el usuario
 */
export function getModerationErrorMessage(reasons) {
  if (reasons.length === 0) return null

  const messages = {
    'Contenido sexual explícito detectado': 'La imagen contiene contenido sexual que no está permitido.',
    'Contenido sugestivo detectado': 'La imagen contiene contenido sugestivo que no está permitido.',
    'Armas detectadas': 'La imagen contiene armas que no están permitidas.',
    'Contenido relacionado con alcohol': 'La imagen promueve el consumo de alcohol.',
    'Contenido relacionado con drogas': 'La imagen contiene referencias a drogas.',
    'Contenido violento o gore detectado': 'La imagen contiene contenido violento.',
    'Gestos ofensivos detectados': 'La imagen contiene gestos ofensivos.',
  }

  return reasons.map(r => messages[r] || r).join(' ')
}
