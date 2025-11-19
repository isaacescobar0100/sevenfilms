# Guía de Deployment en Hostinger

## Pre-requisitos

1. Cuenta de Hostinger activa
2. Acceso a cPanel o File Manager
3. Proyecto configurado con Supabase
4. Variables de entorno configuradas

## Paso 1: Preparar el Proyecto

### 1.1 Configurar variables de entorno

Asegúrate de tener tu archivo `.env` configurado:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-anonima
```

### 1.2 Build del proyecto

```bash
npm install
npm run build
```

Esto generará una carpeta `dist/` con todos los archivos optimizados.

## Paso 2: Subir Archivos a Hostinger

### Opción A: Usando File Manager (Recomendado para principiantes)

1. Inicia sesión en tu panel de Hostinger
2. Ve a **File Manager**
3. Navega a `public_html/`
4. Crea una carpeta llamada `cineastas` (si no existe)
5. Entra a la carpeta `cineastas/`
6. Sube todos los archivos de la carpeta `dist/`:
   - Selecciona "Upload"
   - Arrastra todos los archivos de `dist/` (NO la carpeta, solo el contenido)
   - Espera a que se complete la subida

### Opción B: Usando FTP

1. Descarga un cliente FTP (FileZilla recomendado)
2. Conecta usando las credenciales FTP de Hostinger:
   - Host: ftp.tu-dominio.com
   - Usuario: tu-usuario-ftp
   - Contraseña: tu-contraseña-ftp
   - Puerto: 21
3. Navega a `public_html/cineastas/`
4. Sube todos los archivos de la carpeta `dist/`

### Opción C: Usando cPanel

1. Accede a cPanel
2. Ve a **File Manager**
3. Sigue los mismos pasos que en Opción A

## Paso 3: Configurar .htaccess

### 3.1 Crear archivo .htaccess

En la carpeta `public_html/cineastas/`, crea un archivo `.htaccess` con el siguiente contenido:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /cineastas/
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /cineastas/index.html [L]
</IfModule>
```

**Nota:** Este archivo ya está incluido en `public/.htaccess` y se copiará automáticamente al hacer build.

### 3.2 Verificar permisos

Asegúrate de que los permisos sean correctos:
- Archivos: 644
- Carpetas: 755

## Paso 4: Configurar Variables de Entorno en Producción

### Opción A: Hardcodear en el build (No recomendado)

Las variables de entorno se incorporan durante el build, así que ya están en los archivos.

### Opción B: Usar archivo de configuración (Recomendado)

Si quieres cambiar las variables sin hacer rebuild:

1. Crea un archivo `config.js` en `public_html/cineastas/`:

```javascript
window.ENV = {
  VITE_SUPABASE_URL: 'https://tu-proyecto.supabase.co',
  VITE_SUPABASE_ANON_KEY: 'tu-clave-anonima'
}
```

2. Referencia este archivo en `index.html` ANTES del script principal:

```html
<script src="/cineastas/config.js"></script>
<script type="module" src="/cineastas/assets/index-[hash].js"></script>
```

## Paso 5: Verificar Deployment

1. Visita tu sitio: `https://tu-dominio.com/cineastas/`
2. Verifica que:
   - La página carga correctamente
   - Los estilos se aplican
   - La autenticación funciona
   - Puedes crear proyectos
   - Las rutas funcionan (prueba refrescar en `/cineastas/dashboard`)

## Paso 6: Configurar Dominio Personalizado (Opcional)

### Si quieres usar un subdominio (ej: cine.tu-dominio.com)

1. En cPanel, ve a **Subdomains**
2. Crea un subdominio `cine`
3. Apunta el Document Root a `public_html/cineastas`
4. Actualiza `vite.config.js`:

```javascript
export default defineConfig({
  base: '/', // Cambiar de '/cineastas/' a '/'
})
```

5. Actualiza `.htaccess`:

```apache
RewriteBase /
RewriteRule . /index.html [L]
```

6. Rebuilda y vuelve a subir

## Troubleshooting

### Error 404 en las rutas

**Problema:** Al refrescar la página en rutas como `/dashboard`, obtienes 404.

**Solución:** Verifica que el archivo `.htaccess` esté presente y correctamente configurado.

### Los estilos no cargan

**Problema:** La página se ve sin estilos.

**Solución:**
1. Verifica que `base: '/cineastas/'` esté en `vite.config.js`
2. Limpia caché del navegador
3. Verifica que todos los archivos CSS se hayan subido

### Error de Supabase

**Problema:** "Supabase client error" o problemas de autenticación.

**Solución:**
1. Verifica las variables de entorno
2. Asegúrate de que la URL de Supabase sea correcta
3. Verifica que la ANON KEY sea válida
4. Revisa los logs de Supabase

### Página en blanco

**Problema:** Solo se ve una página en blanco.

**Solución:**
1. Abre la consola del navegador (F12)
2. Revisa errores en la consola
3. Verifica que `index.html` y los archivos JS se hayan subido correctamente
4. Asegúrate de que `basename="/cineastas"` esté en `BrowserRouter`

## Actualizaciones Futuras

Para actualizar la aplicación:

1. Haz cambios en tu código local
2. Ejecuta `npm run build`
3. Sube solo los archivos modificados (o toda la carpeta `dist/` para estar seguro)
4. Limpia la caché del navegador

## Optimizaciones de Producción

### Habilitar Compresión

Añade a tu `.htaccess`:

```apache
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>
```

### Habilitar Caché

Añade a tu `.htaccess`:

```apache
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
  ExpiresByType text/javascript "access plus 1 month"
</IfModule>
```

### Headers de Seguridad

```apache
<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set X-Frame-Options "SAMEORIGIN"
  Header set X-XSS-Protection "1; mode=block"
</IfModule>
```

## Monitoreo

- Configura Google Analytics (opcional)
- Monitorea los logs de Supabase
- Revisa regularmente los logs del servidor en cPanel

## Soporte

Si encuentras problemas:
1. Revisa la consola del navegador
2. Revisa los logs de errores en cPanel
3. Consulta la documentación de Hostinger
4. Revisa los logs de Supabase
