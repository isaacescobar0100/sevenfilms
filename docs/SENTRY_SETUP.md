# Configuración de Sentry para CineAmateur

Esta guía te ayudará a configurar Sentry para monitorear errores en producción.

## ¿Qué es Sentry?

Sentry es un servicio de monitoreo de errores que te permite:
- Capturar errores automáticamente cuando ocurren en producción
- Ver el stack trace completo y contexto del error
- Saber qué usuario tuvo el error
- Recibir alertas cuando hay errores nuevos
- Grabar sesiones de usuarios con errores

## 📋 Paso 1: Crear Cuenta en Sentry

1. Ve a https://sentry.io
2. Crea una cuenta gratuita (incluye 10,000 errores/mes)
3. Verifica tu email

## 🎯 Paso 2: Crear Proyecto

1. En el dashboard, haz clic en **"Create Project"**
2. Selecciona **"React"** como plataforma
3. Dale un nombre a tu proyecto (ej: "cineamateur")
4. Selecciona tu equipo (o usa el personal)
5. Haz clic en **"Create Project"**

## 🔑 Paso 3: Obtener tu DSN

Después de crear el proyecto, verás una página con instrucciones. Lo importante es el **DSN** (Data Source Name):

```
https://examplePublicKey@o0.ingest.sentry.io/0
```

Copia este DSN, lo necesitarás en el siguiente paso.

## ⚙️ Paso 4: Configurar Variables de Entorno

1. Abre tu archivo `.env` (créalo si no existe)
2. Agrega la siguiente línea con tu DSN:

```env
VITE_SENTRY_DSN=https://examplePublicKey@o0.ingest.sentry.io/0
```

**⚠️ IMPORTANTE:** Asegúrate de que tu archivo `.env` esté en el `.gitignore` para no subir tu DSN al repositorio.

## 📦 Paso 5: Instalar Dependencias

La integración de Sentry ya está configurada en el código, solo necesitas instalar el paquete:

```bash
npm install @sentry/react
```

## ✅ Paso 6: Verificar que Funciona

### En Desarrollo

Por defecto, Sentry **NO** envía errores en desarrollo. Si quieres probar:

1. Edita `src/lib/sentry.js`
2. Cambia `enabled: import.meta.env.PROD` por `enabled: true`
3. Guarda y reinicia el servidor
4. Provoca un error (por ejemplo, accede a una propiedad undefined)
5. Ve a tu dashboard de Sentry y verás el error

### En Producción

1. Haz build del proyecto: `npm run build`
2. Despliega a tu servidor
3. Los errores se enviarán automáticamente a Sentry

## 🎬 Características Implementadas

La integración actual incluye:

### 1. **ErrorBoundary con Sentry**
- Todos los errores de React se capturan automáticamente
- Se envían con el stack trace completo
- Incluyen el contexto de componentes

### 2. **Información del Usuario**
- Si el usuario está autenticado, se envía su ID y email
- Esto te permite saber qué usuarios están siendo afectados

### 3. **Session Replay** (Opcional)
- Graba el 10% de las sesiones normales
- Graba el 100% de las sesiones con errores
- Te permite ver exactamente qué hizo el usuario antes del error

### 4. **Filtrado de Errores**
Se ignoran automáticamente:
- Errores de extensiones del navegador
- Errores de red comunes (Failed to fetch)
- Errores conocidos que no son críticos

### 5. **Funciones Auxiliares**

Puedes usar estas funciones en cualquier parte de tu código:

```javascript
import { captureError, captureMessage, setUser } from '../lib/sentry'

// Capturar un error manualmente
try {
  // código que puede fallar
} catch (error) {
  captureError(error, { context: 'uploading movie' })
}

// Enviar un mensaje informativo
captureMessage('Usuario completó el onboarding', 'info')

// Establecer el usuario actual (se hace automáticamente en login)
setUser(user)
```

## 🔍 Cómo Ver los Errores

1. Ve a https://sentry.io
2. Selecciona tu proyecto "cineamateur"
3. En el menú lateral, haz clic en **"Issues"**
4. Verás una lista de todos los errores capturados

Para cada error, puedes ver:
- **Mensaje de error** y stack trace
- **Usuarios afectados** (cuántos y quiénes)
- **Frecuencia** (cuántas veces ha ocurrido)
- **Contexto**: navegador, OS, versión de la app
- **Breadcrumbs**: acciones del usuario antes del error
- **Session Replay**: video de la sesión (si está habilitado)

## 🔔 Configurar Alertas

1. En tu proyecto de Sentry, ve a **Settings → Alerts**
2. Haz clic en **"Create Alert Rule"**
3. Elige cuándo quieres recibir alertas:
   - Errores nuevos
   - Errores que afectan a muchos usuarios
   - Tendencias inusuales

Puedes recibir alertas por:
- **Email**
- **Slack** (recomendado)
- **Discord**
- **Webhook**

## 📊 Source Maps (Opcional pero Recomendado)

Los source maps te permiten ver el código original en lugar del código minificado en los errores de producción.

### Configurar Source Maps con Vite

1. Instala el plugin de Sentry:
```bash
npm install @sentry/vite-plugin --save-dev
```

2. Actualiza `vite.config.js`:
```javascript
import { sentryVitePlugin } from "@sentry/vite-plugin"

export default defineConfig({
  build: {
    sourcemap: true, // Generar source maps
  },
  plugins: [
    react(),
    sentryVitePlugin({
      org: "tu-organizacion",
      project: "cineamateur",
      authToken: process.env.SENTRY_AUTH_TOKEN,
    }),
  ],
})
```

3. Genera un auth token en Sentry:
   - Ve a Settings → Developer Settings → Auth Tokens
   - Crea un nuevo token con permisos de "Release"
   - Agrégalo a tu `.env`:
   ```
   SENTRY_AUTH_TOKEN=tu_token_aqui
   ```

## 🎯 Mejores Prácticas

### 1. **No Envíes Información Sensible**
El código ya filtra automáticamente:
- Contraseñas
- Tokens de autenticación
- Extensiones del navegador

### 2. **Usa Contexto Personalizado**
Cuando captures errores manualmente, agrega contexto:

```javascript
captureError(error, {
  movieId: movie.id,
  action: 'uploading',
  fileSize: file.size,
})
```

### 3. **Marca Errores como Resueltos**
En Sentry, cuando arreglas un error, márcalo como "Resolved". Si vuelve a ocurrir, Sentry te alertará.

### 4. **Revisa el Dashboard Regularmente**
Dedica 10 minutos a la semana para revisar:
- Errores nuevos
- Errores frecuentes
- Tendencias

## 💰 Plan Gratuito vs Pagado

### Plan Gratuito (Suficiente para empezar)
- ✅ 10,000 errores/mes
- ✅ 1 proyecto
- ✅ 30 días de retención
- ✅ Email alerts
- ✅ Session Replay (50 replays/mes)

### Plan Team ($26/mes)
- ✅ 50,000 errores/mes
- ✅ Proyectos ilimitados
- ✅ 90 días de retención
- ✅ Slack/Discord integration
- ✅ Session Replay ilimitado
- ✅ Source maps

## 🆘 Troubleshooting

### Error: "Sentry DSN no configurado"
- Verifica que tu `.env` tenga `VITE_SENTRY_DSN=...`
- Reinicia el servidor de desarrollo

### Los errores no aparecen en Sentry
1. Verifica que `enabled: import.meta.env.PROD` esté en `true` (solo en producción)
2. Revisa la consola del navegador, debería haber un log de Sentry
3. Verifica que el DSN sea correcto

### Muchos errores de "Failed to fetch"
Esto es normal, son errores de red. Ya están filtrados con `ignoreErrors` en la configuración.

## 📚 Recursos Adicionales

- [Documentación oficial de Sentry](https://docs.sentry.io/)
- [Sentry para React](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Session Replay](https://docs.sentry.io/platforms/javascript/session-replay/)
- [Source Maps](https://docs.sentry.io/platforms/javascript/sourcemaps/)

## ✅ Checklist de Configuración

- [ ] Crear cuenta en Sentry
- [ ] Crear proyecto "cineamateur"
- [ ] Copiar DSN
- [ ] Agregar `VITE_SENTRY_DSN` a `.env`
- [ ] Instalar `@sentry/react`
- [ ] Probar en desarrollo (opcional)
- [ ] Hacer build para producción
- [ ] Verificar que los errores se capturan en producción
- [ ] Configurar alertas por email/Slack
- [ ] (Opcional) Configurar source maps

---

¿Necesitas ayuda? Abre un issue en el repositorio o consulta la documentación oficial de Sentry.
