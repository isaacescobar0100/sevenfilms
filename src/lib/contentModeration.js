/**
 * Servicio de moderación de contenido usando Sightengine API directamente
 * Detecta: nudity, weapons, drugs, violence, gore, offensive gestures
 */

// Configuración de Sightengine
const SIGHTENGINE_API_USER = '1847212547'
const SIGHTENGINE_API_SECRET = 'ykaF6xkDnNuTTH42K8KEAi8QDLtCSK48'

// Umbrales de detección (0-1, menor = más estricto)
const THRESHOLDS = {
  nudity_raw: 0.4,
  nudity_partial: 0.6,
  weapon: 0.6,
  alcohol: 0.7,
  drugs: 0.3,  // Muy estricto para drogas
  gore: 0.4,
  offensive: 0.6,
}

/**
 * Analiza los resultados de Sightengine
 */
function analyzeResults(data) {
  const reasons = []
  const details = {
    nudity: data.nudity,
    weapon: data.weapon,
    alcohol: data.alcohol,
    drugs: data.drugs,
    gore: data.gore,
    offensive: data.offensive,
  }

  // Verificar desnudez
  const nudity = data.nudity
  if (nudity) {
    if ((nudity.sexual_activity ?? 0) >= THRESHOLDS.nudity_raw ||
        (nudity.sexual_display ?? 0) >= THRESHOLDS.nudity_raw ||
        (nudity.erotica ?? 0) >= THRESHOLDS.nudity_raw) {
      reasons.push('Contenido sexual explícito detectado')
    } else if ((nudity.very_suggestive ?? 0) >= THRESHOLDS.nudity_partial) {
      reasons.push('Contenido sugestivo detectado')
    }
  }

  // Verificar armas
  const weapon = data.weapon
  if (weapon?.classes) {
    const hasWeapon = Object.values(weapon.classes).some(
      (score) => score >= THRESHOLDS.weapon
    )
    if (hasWeapon) {
      reasons.push('Armas detectadas')
    }
  }

  // Verificar alcohol
  const alcohol = data.alcohol
  if (alcohol !== undefined && alcohol >= THRESHOLDS.alcohol) {
    reasons.push('Contenido relacionado con alcohol')
  }

  // Verificar drogas - más estricto
  const drugs = data.drugs
  if (drugs !== undefined && drugs >= THRESHOLDS.drugs) {
    reasons.push('Contenido relacionado con drogas')
  }

  // Verificar gore
  const gore = data.gore
  if (gore?.prob !== undefined && gore.prob >= THRESHOLDS.gore) {
    reasons.push('Contenido violento o gore detectado')
  }

  // Verificar gestos ofensivos
  const offensive = data.offensive
  if (offensive?.prob !== undefined && offensive.prob >= THRESHOLDS.offensive) {
    reasons.push('Gestos ofensivos detectados')
  }

  return {
    safe: reasons.length === 0,
    reasons,
    details,
  }
}

/**
 * Modera una imagen por URL
 * @param {string} imageUrl - URL de la imagen a moderar
 * @returns {Promise<{safe: boolean, reasons: string[], details: object}>}
 */
export async function moderateImageByUrl(imageUrl) {
  try {
    console.log('[Moderation] Moderando URL:', imageUrl)

    const params = new URLSearchParams({
      url: imageUrl,
      models: 'nudity-2.1,weapon,alcohol,drugs,gore-2.0,offensive',
      api_user: SIGHTENGINE_API_USER,
      api_secret: SIGHTENGINE_API_SECRET,
    })

    const response = await fetch(`https://api.sightengine.com/1.0/check.json?${params}`)
    const data = await response.json()

    console.log('[Moderation] Sightengine response:', data)

    if (data.status !== 'success') {
      console.error('[Moderation] Sightengine error:', data)
      return { safe: false, reasons: ['Error en verificación de contenido'], details: data }
    }

    const result = analyzeResults(data)
    console.log('[Moderation] Resultado:', result)

    return result
  } catch (error) {
    console.error('[Moderation] Error:', error)
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
    console.log('[Moderation] Moderando archivo:', file.name, file.type, file.size)

    const formData = new FormData()
    formData.append('media', file)
    formData.append('models', 'nudity-2.1,weapon,alcohol,drugs,gore-2.0,offensive')
    formData.append('api_user', SIGHTENGINE_API_USER)
    formData.append('api_secret', SIGHTENGINE_API_SECRET)

    const response = await fetch('https://api.sightengine.com/1.0/check.json', {
      method: 'POST',
      body: formData,
    })

    const data = await response.json()

    console.log('[Moderation] Sightengine response:', data)

    if (data.status !== 'success') {
      console.error('[Moderation] Sightengine error:', data)
      return { safe: false, reasons: ['Error en verificación de contenido'], details: data }
    }

    const result = analyzeResults(data)
    console.log('[Moderation] Resultado:', result)

    return result
  } catch (error) {
    console.error('[Moderation] Error:', error)
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
