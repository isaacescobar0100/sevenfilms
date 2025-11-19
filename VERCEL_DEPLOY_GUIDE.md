# 🚀 Guía de Despliegue en Vercel - Seven CineAmateur

## Paso 1: Crear cuenta en GitHub

1. Ve a [github.com](https://github.com)
2. Crea una cuenta (si no tienes una)
3. Verifica tu email

## Paso 2: Subir el código a GitHub

### Opción A: Usando GitHub Desktop (Más Fácil)

1. Descarga [GitHub Desktop](https://desktop.github.com/)
2. Instálalo y abre sesión
3. Click en "File" → "Add Local Repository"
4. Selecciona la carpeta: `C:\Users\issac\OneDrive\Desktop\Seven`
5. Click en "Publish repository"
6. Nombre: `seven-cineamateur`
7. Descripción: `Seven - Plataforma Social para Cineastas Amateurs`
8. ✅ Desmarcar "Keep this code private" (hazlo público)
9. Click en "Publish repository"

### Opción B: Usando línea de comandos

```bash
# Crear repositorio en github.com primero, luego:
cd "C:\Users\issac\OneDrive\Desktop\Seven"
git remote add origin https://github.com/TU_USUARIO/seven-cineamateur.git
git branch -M main
git push -u origin main
```

## Paso 3: Crear cuenta en Vercel

1. Ve a [vercel.com](https://vercel.com)
2. Click en "Sign Up"
3. **IMPORTANTE:** Usa "Continue with GitHub" (enlaza con tu cuenta de GitHub)
4. Autoriza Vercel a acceder a tus repositorios

## Paso 4: Desplegar en Vercel

1. En Vercel, click en "Add New..." → "Project"
2. Busca el repositorio `seven-cineamateur`
3. Click en "Import"
4. Configuración del proyecto:
   - **Framework Preset:** Vite
   - **Root Directory:** ./
   - **Build Command:** `npm run build` (ya viene por defecto)
   - **Output Directory:** `dist` (ya viene por defecto)

5. **Variables de Entorno** (MUY IMPORTANTE):
   Click en "Environment Variables" y agrega:

   ```
   VITE_SUPABASE_URL = [tu_url_de_supabase]
   VITE_SUPABASE_ANON_KEY = [tu_clave_anonima_de_supabase]
   ```

   > Obtén estos valores de tu proyecto en Supabase:
   > Settings → API → Project URL y anon/public key

6. Click en "Deploy" y espera 2-3 minutos

## Paso 5: Obtener tu URL de Vercel

Cuando termine el deploy, verás:
```
✅ Deployment Complete
https://seven-cineamateur.vercel.app
```

Esta será tu URL temporal de Vercel.

## Paso 6: Configurar dominio personalizado seven.vxplay.online

### En Vercel:

1. Ve a tu proyecto en Vercel
2. Click en "Settings" → "Domains"
3. En "Add Domain", escribe: `seven.vxplay.online`
4. Click en "Add"
5. Vercel te dará un valor CNAME. Ejemplo:
   ```
   cname.vercel-dns.com
   ```
   **¡COPIA ESTE VALOR!**

### En Cloudflare (o donde tengas el DNS de vxplay.online):

1. Ve a tu cuenta de Cloudflare
2. Selecciona el dominio `vxplay.online`
3. Ve a "DNS" → "Records"
4. Click en "Add record"
5. Configura:
   - **Type:** CNAME
   - **Name:** seven
   - **Target:** `cname.vercel-dns.com` (el valor que te dio Vercel)
   - **Proxy status:** DNS only (nube gris, NO naranja)
   - **TTL:** Auto
6. Click en "Save"

### Espera 5-10 minutos

DNS tarda en propagarse. Luego:
```
https://seven.vxplay.online
```
¡Ya estará funcionando!

## Paso 7: Configurar CORS en Supabase

1. Ve a Supabase → Settings → API
2. En "API Settings" → "Additional Allowed Origins"
3. Agrega:
   ```
   https://seven.vxplay.online
   https://seven-cineamateur.vercel.app
   ```
4. Click en "Save"

## Paso 8: Aplicar funciones RPC en Supabase

1. Ve a Supabase → SQL Editor
2. Abre el archivo: `database/filter-confirmed-users.sql`
3. Copia TODO el contenido
4. Pégalo en el SQL Editor de Supabase
5. Click en "Run" (botón verde)
6. Verifica que aparezca: `Success. No rows returned`

## ✅ Checklist Final

- [ ] Código subido a GitHub
- [ ] Proyecto desplegado en Vercel
- [ ] Variables de entorno configuradas en Vercel
- [ ] Dominio seven.vxplay.online configurado en DNS
- [ ] CORS configurado en Supabase
- [ ] Funciones RPC aplicadas en Supabase
- [ ] Probar login/registro en seven.vxplay.online
- [ ] Probar subir película
- [ ] Probar crear post

## 🎬 ¡Listo para Producción!

Tu plataforma Seven estará disponible en:
- ✅ https://seven.vxplay.online (dominio personalizado)
- ✅ https://seven-cineamateur.vercel.app (dominio de Vercel)

## 🔄 Actualizaciones Futuras

Cada vez que hagas cambios:

1. Guarda tus cambios en el código
2. En GitHub Desktop: "Commit to main" y "Push origin"
3. Vercel detectará los cambios automáticamente
4. Deploy automático en ~2 minutos

## 🆘 Problemas Comunes

### "Build failed"
- Verifica que las variables de entorno estén configuradas
- Revisa los logs en Vercel

### "Domain not working"
- Espera 10-15 minutos (propagación DNS)
- Verifica que el CNAME esté correcto en Cloudflare
- Asegúrate que Proxy status sea "DNS only" (gris)

### "CORS error"
- Verifica que seven.vxplay.online esté en Allowed Origins de Supabase
- Espera 5 minutos después de guardar cambios en Supabase

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs en Vercel → Deployments → [tu deploy] → Logs
2. Revisa la consola del navegador (F12)
3. Verifica las variables de entorno en Vercel

---

**¡Éxito con el lanzamiento de Seven! 🎬🚀**
