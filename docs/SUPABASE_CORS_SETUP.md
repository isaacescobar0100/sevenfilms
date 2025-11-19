# Configuración CORS para Supabase Storage

Este documento explica cómo configurar CORS (Cross-Origin Resource Sharing) para los buckets de almacenamiento de Supabase en producción.

## ¿Por qué es necesario CORS?

CORS es necesario para permitir que tu aplicación web acceda a los recursos almacenados en Supabase Storage desde diferentes dominios. Sin la configuración correcta de CORS, los navegadores bloquearán las solicitudes a tus buckets de almacenamiento.

## Buckets del Proyecto

El proyecto CineAmateur utiliza los siguientes buckets:

1. **movies** - Archivos de películas (videos MP4)
2. **avatars** - Fotos de perfil de usuarios
3. **posts-media** - Imágenes y videos de publicaciones sociales

## Configuración CORS en Supabase Dashboard

### Paso 1: Acceder a la Configuración de Storage

1. Inicia sesión en [Supabase Dashboard](https://app.supabase.com)
2. Selecciona tu proyecto
3. En el menú lateral, ve a **Storage**
4. Verás la lista de todos tus buckets

### Paso 2: Configurar CORS para cada Bucket

Para cada bucket (movies, avatars, posts-media), sigue estos pasos:

1. Haz clic en el bucket que deseas configurar
2. Ve a la pestaña **Configuration** o **Settings**
3. Busca la sección **CORS Configuration**
4. Añade la siguiente configuración:

```json
{
  "allowedOrigins": [
    "http://localhost:5173",
    "https://tu-dominio.com",
    "https://www.tu-dominio.com"
  ],
  "allowedMethods": [
    "GET",
    "POST",
    "PUT",
    "DELETE",
    "HEAD"
  ],
  "allowedHeaders": [
    "*"
  ],
  "exposedHeaders": [],
  "maxAge": 3600
}
```

### Paso 3: Configuración Específica por Bucket

#### Bucket: movies

```json
{
  "allowedOrigins": [
    "http://localhost:5173",
    "https://tu-dominio.com",
    "https://www.tu-dominio.com"
  ],
  "allowedMethods": [
    "GET",
    "POST",
    "PUT",
    "DELETE",
    "HEAD"
  ],
  "allowedHeaders": [
    "authorization",
    "x-client-info",
    "apikey",
    "content-type",
    "range"
  ],
  "exposedHeaders": [
    "content-length",
    "content-range",
    "accept-ranges"
  ],
  "maxAge": 3600
}
```

**Nota**: Para videos, es importante incluir los headers `range`, `content-range` y `accept-ranges` para soportar reproducción parcial (streaming).

#### Bucket: avatars

```json
{
  "allowedOrigins": [
    "http://localhost:5173",
    "https://tu-dominio.com",
    "https://www.tu-dominio.com"
  ],
  "allowedMethods": [
    "GET",
    "POST",
    "PUT",
    "DELETE"
  ],
  "allowedHeaders": [
    "authorization",
    "x-client-info",
    "apikey",
    "content-type"
  ],
  "exposedHeaders": [],
  "maxAge": 3600
}
```

#### Bucket: posts-media

```json
{
  "allowedOrigins": [
    "http://localhost:5173",
    "https://tu-dominio.com",
    "https://www.tu-dominio.com"
  ],
  "allowedMethods": [
    "GET",
    "POST",
    "PUT",
    "DELETE"
  ],
  "allowedHeaders": [
    "authorization",
    "x-client-info",
    "apikey",
    "content-type"
  ],
  "exposedHeaders": [],
  "maxAge": 3600
}
```

## Configuración de Políticas de Acceso (RLS)

Además de CORS, asegúrate de que las políticas de Row Level Security (RLS) estén configuradas correctamente:

### Movies Bucket

```sql
-- Permitir lectura pública de películas
CREATE POLICY "Public can view movies"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'movies');

-- Solo el propietario puede subir películas
CREATE POLICY "Users can upload their own movies"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'movies' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Solo el propietario puede eliminar sus películas
CREATE POLICY "Users can delete their own movies"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'movies' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

### Avatars Bucket

```sql
-- Permitir lectura pública de avatares
CREATE POLICY "Public can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Usuarios autenticados pueden subir su avatar
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Usuarios pueden actualizar su avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Usuarios pueden eliminar su avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

### Posts-Media Bucket

```sql
-- Permitir lectura pública de media de posts
CREATE POLICY "Public can view posts media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'posts-media');

-- Usuarios autenticados pueden subir media
CREATE POLICY "Users can upload posts media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'posts-media' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Solo el propietario puede eliminar su media
CREATE POLICY "Users can delete their own posts media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'posts-media' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

## Verificación de la Configuración

### Probar CORS desde el navegador

Abre la consola del navegador y ejecuta:

```javascript
fetch('https://tu-proyecto.supabase.co/storage/v1/object/public/movies/test.mp4', {
  method: 'GET',
  mode: 'cors'
})
  .then(response => console.log('CORS OK:', response.status))
  .catch(error => console.error('CORS Error:', error))
```

### Verificar headers CORS

Usa curl para verificar los headers:

```bash
curl -I -X OPTIONS \
  -H "Origin: https://tu-dominio.com" \
  -H "Access-Control-Request-Method: GET" \
  https://tu-proyecto.supabase.co/storage/v1/object/public/movies/test.mp4
```

Deberías ver en la respuesta:

```
Access-Control-Allow-Origin: https://tu-dominio.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, HEAD
Access-Control-Max-Age: 3600
```

## Problemas Comunes

### 1. Error: "No 'Access-Control-Allow-Origin' header"

**Solución**: Verifica que tu dominio esté en la lista `allowedOrigins` de la configuración CORS.

### 2. Videos no se reproducen parcialmente

**Solución**: Asegúrate de incluir los headers `range`, `content-range` y `accept-ranges` en `allowedHeaders` y `exposedHeaders` para el bucket de movies.

### 3. Error 403 al subir archivos

**Solución**: Verifica que las políticas RLS estén configuradas correctamente y que el usuario esté autenticado.

### 4. Imágenes no cargan en producción

**Solución**:
- Verifica que el dominio de producción esté en `allowedOrigins`
- Asegúrate de usar URLs públicas correctas
- Revisa que el bucket tenga la política "Public can view"

## Configuración para Desarrollo y Producción

### Desarrollo Local

```json
{
  "allowedOrigins": [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173"
  ]
}
```

### Producción

```json
{
  "allowedOrigins": [
    "https://tu-dominio.com",
    "https://www.tu-dominio.com"
  ]
}
```

### Ambos Entornos (Desarrollo + Producción)

```json
{
  "allowedOrigins": [
    "http://localhost:5173",
    "https://tu-dominio.com",
    "https://www.tu-dominio.com"
  ]
}
```

## Seguridad

⚠️ **IMPORTANTE**:

- **NO** uses `"*"` en `allowedOrigins` en producción
- Lista solo los dominios que realmente necesitan acceso
- Mantén actualizada la lista de dominios autorizados
- Revisa regularmente las políticas RLS
- Implementa límites de tamaño de archivo en el frontend y backend
- Considera usar signed URLs para recursos sensibles

## Recursos Adicionales

- [Documentación oficial de Supabase Storage](https://supabase.com/docs/guides/storage)
- [Guía de CORS en Supabase](https://supabase.com/docs/guides/storage/cors)
- [Row Level Security en Supabase](https://supabase.com/docs/guides/auth/row-level-security)

## Checklist de Configuración

- [ ] Crear los 3 buckets (movies, avatars, posts-media)
- [ ] Configurar CORS para cada bucket
- [ ] Añadir dominios de desarrollo y producción a allowedOrigins
- [ ] Configurar políticas RLS para cada bucket
- [ ] Verificar que las políticas permitan lectura pública
- [ ] Verificar que solo los propietarios puedan subir/eliminar
- [ ] Probar subida de archivos en desarrollo
- [ ] Probar subida de archivos en producción
- [ ] Verificar que los videos se reproduzcan correctamente
- [ ] Verificar que las imágenes carguen en todos los navegadores
