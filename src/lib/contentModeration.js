/**
 * Servicio de moderación de contenido usando Supabase Edge Function
 * Las credenciales de Sightengine están seguras en el servidor
 * Detecta: nudity, weapons, drugs, violence, gore, offensive gestures
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * Modera una imagen por URL usando Edge Function
 * @param {string} imageUrl - URL de la imagen a moderar
 * @returns {Promise<{safe: boolean, reasons: string[], details: object}>}
 */
export async function moderateImageByUrl(imageUrl) {
  try {
    console.log('[Moderation] Moderando URL:', imageUrl)

    const response = await fetch(`${SUPABASE_URL}/functions/v1/moderate-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ imageUrl }),
    })

    console.log('[Moderation] Response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Moderation] Edge Function error:', response.status, errorText)
      // CAMBIADO: Fail-closed para mayor seguridad
      return { safe: false, reasons: ['Error en verificación de contenido'], details: { error: 'Edge function error', status: response.status } }
    }

    const result = await response.json()
    console.log('[Moderation] Resultado:', JSON.stringify(result, null, 2))

    return result
  } catch (error) {
    console.error('[Moderation] Error de red:', error)
    // CAMBIADO: Fail-closed - bloquear si hay error
    return { safe: false, reasons: ['Error de conexión al verificar contenido'], details: { error: error.message } }
  }
}

/**
 * Modera una imagen por archivo (File o Blob) usando Edge Function
 * @param {File|Blob} file - Archivo de imagen
 * @returns {Promise<{safe: boolean, reasons: string[], details: object}>}
 */
export async function moderateImageByFile(file) {
  try {
    console.log('[Moderation] Iniciando moderación de archivo:', file.name, file.type, file.size)

    const formData = new FormData()
    formData.append('media', file)

    console.log('[Moderation] Llamando Edge Function:', `${SUPABASE_URL}/functions/v1/moderate-image`)

    const response = await fetch(`${SUPABASE_URL}/functions/v1/moderate-image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: formData,
    })

    console.log('[Moderation] Response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Moderation] Edge Function error:', response.status, errorText)
      // CAMBIADO: Fail-closed en lugar de fail-open para seguridad
      return { safe: false, reasons: ['Error en verificación de contenido'], details: { error: 'Edge function error', status: response.status } }
    }

    const result = await response.json()
    console.log('[Moderation] Resultado:', JSON.stringify(result, null, 2))

    return result
  } catch (error) {
    console.error('[Moderation] Error de red:', error)
    // CAMBIADO: Fail-closed - bloquear si hay error para mayor seguridad
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
