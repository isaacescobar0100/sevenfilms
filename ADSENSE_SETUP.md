# 🎯 Guía de Configuración Google AdSense para Seven

## ⚠️ IMPORTANTE: Espera la aprobación de Google AdSense

**NO IMPLEMENTES ESTO HASTA QUE GOOGLE TE APRUEBE**

Los anuncios no se mostrarán sin aprobación y podría afectar tu solicitud.

---

## 📋 Checklist de Requisitos ANTES de Aplicar

- ✅ Política de Privacidad (ya implementada)
- ✅ Términos de Servicio (ya implementados)
- ✅ Página "Acerca de" (ya implementada)
- ✅ Página de Contacto (ya implementada)
- ✅ Contenido original (posts de usuarios)
- ✅ Navegación clara (Navbar, Footer)
- ✅ HTTPS (Vercel provee SSL)
- ⚠️ Ejecutar script SQL para tabla `contact_messages` (ver paso 1)

---

## 🚀 Pasos DESPUÉS de la Aprobación

### 1. Ejecutar Script SQL en Supabase

1. Ve a tu proyecto Supabase → SQL Editor
2. Abre el archivo `supabase/migrations/create_contact_messages.sql`
3. Copia y pega el contenido completo
4. Ejecuta el script (Run)
5. Verifica que la tabla `contact_messages` se creó correctamente

### 2. Agregar Script de AdSense en index.html

Una vez aprobado, Google te dará un código como este:

```html
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXX"
     crossorigin="anonymous"></script>
```

**Pasos:**

1. Abre `index.html` en la raíz del proyecto
2. Agrega el script dentro de `<head>`, ANTES del cierre `</head>`:

```html
<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Seven - Red Social para Cinéfilos</title>

    <!-- Google AdSense - AGREGA ESTO AQUÍ -->
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXX"
         crossorigin="anonymous"></script>
  </head>
  <body>
    <!-- ... resto del código ... -->
  </body>
</html>
```

### 3. Configurar Variable de Entorno en Vercel

1. Ve a tu proyecto en Vercel → Settings → Environment Variables
2. Agrega una nueva variable:
   - **Name:** `VITE_ADSENSE_CLIENT_ID`
   - **Value:** `ca-pub-XXXXXXXXXX` (tu ID de cliente AdSense)
   - **Environments:** Production, Preview, Development

3. Re-deploy el proyecto para que tome la variable

### 4. Crear Unidades de Anuncios en Google AdSense

1. Ve a Google AdSense → Anuncios → Por unidad de anuncio
2. Crea las siguientes unidades:

#### Anuncio 1: Banner Feed (In-feed)
- **Nombre:** Seven - Feed Banner
- **Tipo:** In-feed
- **Tamaño:** Responsive
- Copia el **Slot ID** (ej: `1234567890`)

#### Anuncio 2: Banner Horizontal (Display)
- **Nombre:** Seven - Horizontal Banner
- **Tipo:** Display
- **Tamaño:** Horizontal (728x90 o responsive)
- Copia el **Slot ID**

#### Anuncio 3: Sidebar Vertical
- **Nombre:** Seven - Sidebar
- **Tipo:** Display
- **Tamaño:** Vertical (160x600 o 300x600)
- Copia el **Slot ID**

### 5. Implementar Anuncios en Seven

Una vez tengas los Slot IDs, agrega anuncios en estas páginas:

#### Feed (src/pages/Feed.jsx)

Agrega un anuncio cada 5 posts:

```jsx
import AdSense from '../components/ads/AdSense'

// Dentro del componente Feed, en el map de posts:
{posts.map((post, index) => (
  <div key={post.id}>
    <Post post={post} />

    {/* Anuncio cada 5 posts */}
    {(index + 1) % 5 === 0 && (
      <AdSense
        slot="TU_SLOT_ID_AQUI"
        format="fluid"
        style={{ minHeight: '250px' }}
        className="my-4"
      />
    )}
  </div>
))}
```

#### Perfil de Usuario (src/pages/Profile.jsx)

Banner horizontal arriba del feed:

```jsx
import AdSense from '../components/ads/AdSense'

// Después del header del perfil, antes de los posts:
<AdSense
  slot="TU_SLOT_ID_AQUI"
  format="horizontal"
  style={{ minHeight: '90px' }}
  className="my-4"
/>
```

#### Mensajes (src/pages/Messages.jsx)

Banner horizontal en la parte superior:

```jsx
import AdSense from '../components/ads/AdSense'

// Al inicio del contenido:
<AdSense
  slot="TU_SLOT_ID_AQUI"
  format="horizontal"
  style={{ minHeight: '90px' }}
  className="mb-4"
/>
```

### 6. Ejemplo Completo de Implementación

```jsx
import AdSense from '../components/ads/AdSense'

function Feed() {
  return (
    <div>
      {/* Contenido del feed */}

      {/* Anuncio in-feed */}
      <AdSense
        slot="1234567890"  // Reemplaza con tu Slot ID real
        format="fluid"
        responsive={true}
        style={{ minHeight: '250px' }}
        className="my-4"
      />

      {/* Más contenido */}
    </div>
  )
}
```

---

## 📊 Estrategia de Monetización Recomendada

### Dónde SÍ poner anuncios:
- ✅ **Feed** - In-feed cada 5 posts (mejor rendimiento)
- ✅ **Perfil de usuario** - Banner horizontal
- ✅ **Búsqueda** - Banner horizontal en resultados
- ✅ **Mensajes** - Banner horizontal arriba
- ✅ **Películas** - Sidebar vertical

### Dónde NO poner anuncios:
- ❌ **Login/Registro** - Mala experiencia de usuario
- ❌ **Configuración** - Puede molestar
- ❌ **Primera visita** - Espera que exploren primero
- ❌ **Modales/Popups** - Contra políticas de AdSense

### Límites Recomendados:
- **Máximo 3 anuncios por página**
- **Separación mínima de 500px entre anuncios**
- **No más de 1 anuncio in-feed por cada 5 posts**

---

## 🧪 Testing en Desarrollo

Durante el desarrollo, el componente `AdSense` no mostrará anuncios si no hay `VITE_ADSENSE_CLIENT_ID` configurado.

Para testear visualmente:

```jsx
<div className="bg-gray-200 dark:bg-gray-700 rounded-lg p-8 text-center">
  <p className="text-gray-500">Espacio para anuncio AdSense</p>
  <p className="text-xs text-gray-400 mt-2">250x250</p>
</div>
```

---

## 📈 Métricas a Monitorear

Una vez implementado:

1. **CTR (Click-Through Rate)** - Objetivo: 1-3%
2. **RPM (Revenue per Mille)** - Varía por país
3. **CPC (Cost per Click)** - Promedio $0.20-$2.00
4. **Viewability** - Objetivo: >50%

---

## 🚨 Políticas de AdSense a Cumplir

- ✅ No clicks en tus propios anuncios
- ✅ No pedir clicks a los usuarios
- ✅ No colocar anuncios cerca de botones/enlaces
- ✅ Contenido original y de calidad
- ✅ No contenido para adultos o violento
- ✅ Políticas de Privacidad visibles

---

## ❓ Preguntas Frecuentes

### ¿Cuánto voy a ganar?

Depende de:
- Tráfico mensual
- Ubicación geográfica de usuarios
- Nicho (cine tiene buen CPC)
- CTR de los anuncios

**Estimación conservadora para Seven:**
- 1,000 usuarios activos/mes
- 10,000 pageviews/mes
- CTR 1.5%
- CPC $0.50

**Ganancia estimada:** $75-150/mes

Con 10,000 usuarios: $750-1,500/mes

### ¿Cuánto tarda la aprobación?

Típicamente 1-2 semanas. Google revisa:
- Contenido original
- Políticas cumplidas
- Tráfico mínimo (no hay mínimo oficial)
- Experiencia de usuario

### ¿Qué hago si me rechazan?

Razones comunes:
1. Contenido insuficiente
2. Falta de políticas legales
3. Problemas de navegación
4. Tráfico muy bajo

**Solución:**
- Espera 1-2 meses
- Agrega más contenido de calidad
- Aumenta tráfico orgánico
- Vuelve a aplicar

---

## 📞 Soporte

Si tienes problemas con la implementación:

1. Revisa la consola del navegador para errores
2. Verifica que `VITE_ADSENSE_CLIENT_ID` esté configurado
3. Confirma que el script en `index.html` esté cargando
4. Revisa las políticas de AdSense

---

**¡Éxito con tu aplicación a AdSense!** 🎉
