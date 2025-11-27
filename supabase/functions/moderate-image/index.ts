// Edge Function para moderación de contenido con Sightengine
// Las credenciales están seguras en el servidor

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// Credenciales de Sightengine (seguras en el servidor)
const SIGHTENGINE_API_USER = Deno.env.get('SIGHTENGINE_API_USER') || '1847212547'
const SIGHTENGINE_API_SECRET = Deno.env.get('SIGHTENGINE_API_SECRET') || 'ykaF6xkDnNuTTH42K8KEAi8QDLtCSK48'

// Umbrales de detección más estrictos (0-1, menor = más estricto)
const THRESHOLDS = {
  nudity_raw: 0.4,        // Desnudez explícita - más estricto
  nudity_partial: 0.6,    // Desnudez parcial
  weapon: 0.6,            // Armas
  alcohol: 0.7,           // Alcohol
  drugs: 0.3,             // Drogas - MUY estricto para bloquear consumo
  gore: 0.4,              // Gore/violencia gráfica
  offensive: 0.6,         // Gestos ofensivos
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ModerationResult {
  safe: boolean
  reasons: string[]
  details: Record<string, unknown>
}

function analyzeResults(data: Record<string, unknown>): ModerationResult {
  const reasons: string[] = []
  const details = {
    nudity: data.nudity,
    weapon: data.weapon,
    alcohol: data.alcohol,
    drugs: data.drugs,
    gore: data.gore,
    offensive: data.offensive,
  }

  // Verificar desnudez
  const nudity = data.nudity as Record<string, number> | undefined
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
  const weapon = data.weapon as { classes?: Record<string, number> } | undefined
  if (weapon?.classes) {
    const hasWeapon = Object.values(weapon.classes).some(
      (score: number) => score >= THRESHOLDS.weapon
    )
    if (hasWeapon) {
      reasons.push('Armas detectadas')
    }
  }

  // Verificar alcohol
  const alcohol = data.alcohol as number | undefined
  if (alcohol !== undefined && alcohol >= THRESHOLDS.alcohol) {
    reasons.push('Contenido relacionado con alcohol')
  }

  // Verificar drogas - más estricto
  const drugs = data.drugs as number | undefined
  if (drugs !== undefined && drugs >= THRESHOLDS.drugs) {
    reasons.push('Contenido relacionado con drogas')
  }

  // Verificar gore
  const gore = data.gore as { prob?: number } | undefined
  if (gore?.prob !== undefined && gore.prob >= THRESHOLDS.gore) {
    reasons.push('Contenido violento o gore detectado')
  }

  // Verificar gestos ofensivos
  const offensive = data.offensive as { prob?: number } | undefined
  if (offensive?.prob !== undefined && offensive.prob >= THRESHOLDS.offensive) {
    reasons.push('Gestos ofensivos detectados')
  }

  return {
    safe: reasons.length === 0,
    reasons,
    details,
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const contentType = req.headers.get('content-type') || ''

    let moderationResponse: Response

    if (contentType.includes('multipart/form-data')) {
      // Moderación por archivo
      const formData = await req.formData()
      const file = formData.get('media')

      if (!file || !(file instanceof File)) {
        return new Response(
          JSON.stringify({ error: 'No se proporcionó archivo de imagen' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const sightengineFormData = new FormData()
      sightengineFormData.append('media', file)
      sightengineFormData.append('models', 'nudity-2.1,weapon,alcohol,drugs,gore-2.0,offensive')
      sightengineFormData.append('api_user', SIGHTENGINE_API_USER)
      sightengineFormData.append('api_secret', SIGHTENGINE_API_SECRET)

      moderationResponse = await fetch('https://api.sightengine.com/1.0/check.json', {
        method: 'POST',
        body: sightengineFormData,
      })
    } else {
      // Moderación por URL
      const body = await req.json()
      const { imageUrl } = body

      if (!imageUrl) {
        return new Response(
          JSON.stringify({ error: 'No se proporcionó URL de imagen' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const params = new URLSearchParams({
        url: imageUrl,
        models: 'nudity-2.1,weapon,alcohol,drugs,gore-2.0,offensive',
        api_user: SIGHTENGINE_API_USER,
        api_secret: SIGHTENGINE_API_SECRET,
      })

      moderationResponse = await fetch(`https://api.sightengine.com/1.0/check.json?${params}`)
    }

    const data = await moderationResponse.json()

    if (data.status !== 'success') {
      console.error('Sightengine error:', data)
      // Fail-open: permitir si hay error de la API
      return new Response(
        JSON.stringify({ safe: true, reasons: [], details: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const result = analyzeResults(data)

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Moderation error:', error)
    // Fail-open: permitir si hay error
    return new Response(
      JSON.stringify({ safe: true, reasons: [], details: { error: String(error) } }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
