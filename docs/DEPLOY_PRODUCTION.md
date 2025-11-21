# 🚀 Guía Completa: Cómo Subir Cambios a Producción

Esta guía te enseña el flujo completo para subir cualquier cambio de código a producción (Vercel).

---

## 📋 Flujo General

```
1. Modificas código localmente
2. Pruebas en local (http://localhost:5173)
3. Usas Git para guardar cambios
4. Subes a GitHub
5. Vercel despliega automáticamente
6. Verificas en producción
```

---

## 🎯 Paso a Paso Detallado

### **PASO 1: Modificar el Código**

Edita los archivos que necesites en tu proyecto. Ejemplos:
- Cambiar colores en `tailwind.config.js`
- Agregar features en componentes
- Arreglar bugs
- Actualizar estilos

**Herramientas:** VS Code, Claude Code, o cualquier editor

---

### **PASO 2: Probar en Local**

Antes de subir, SIEMPRE prueba que funciona:

```bash
# Si no está corriendo, inicia el servidor de desarrollo
npm run dev
```

**Abre el navegador:** http://localhost:5173

**Verifica:**
- ✅ El cambio se ve correctamente
- ✅ No hay errores en la consola del navegador (F12)
- ✅ Todo funciona como esperabas

---

### **PASO 3: Ver Qué Archivos Cambiaron**

```bash
git status
```

**Ejemplo de resultado:**
```
Changes not staged for commit:
  modified:   tailwind.config.js
  modified:   src/components/Header.jsx
  modified:   .claude/settings.local.json
```

**Analiza la lista:**
- ✅ Archivos importantes (tu código) → Los vamos a subir
- ❌ Archivos basura (.claude/, nul, etc.) → NO los subimos

---

### **PASO 4: Seleccionar Archivos para Subir**

**Opción A: Agregar archivos específicos (Recomendado)**
```bash
git add tailwind.config.js
git add src/components/Header.jsx
```

**Opción B: Agregar todos los archivos modificados**
```bash
git add .
```

⚠️ **Advertencia con Opción B:**
- Revisa bien con `git status` antes
- NO subas archivos con contraseñas o secrets
- NO subas archivos temporales (.env, .DS_Store, node_modules/, etc.)

---

### **PASO 5: Verificar Staging Area**

```bash
git status
```

**Deberías ver:**
```
Changes to be committed:
  modified:   tailwind.config.js
  modified:   src/components/Header.jsx
```

✅ Solo los archivos que QUIERES subir deben estar aquí.

---

### **PASO 6: Crear el Commit**

```bash
git commit -m "Tu mensaje descriptivo aquí"
```

**Reglas para un buen mensaje:**

✅ **Buenos mensajes:**
```bash
git commit -m "Cambiar paleta de colores de rojo a púrpura"
git commit -m "Arreglar bug en sistema de calificaciones"
git commit -m "Agregar funcionalidad de modo oscuro"
git commit -m "Optimizar carga de imágenes en galería"
```

❌ **Malos mensajes:**
```bash
git commit -m "cambios"           # ¿Qué cambios?
git commit -m "fix"               # ¿Qué arreglaste?
git commit -m "asdf"              # Sin sentido
git commit -m "wip"               # "Work in progress" - muy vago
```

**Estructura recomendada:**
```
[Verbo] + [Qué hiciste] + [Dónde/Por qué opcional]

Ejemplos:
- Agregar botón de compartir en perfil
- Arreglar error de login con usuarios nuevos
- Actualizar diseño de tarjetas de película
- Mejorar performance en carga de videos
```

---

### **PASO 7: Verificar que el Commit se Creó**

```bash
git log --oneline -3
```

**Verás:**
```
a1b2c3d Tu mensaje descriptivo aquí          ← Tu nuevo commit
d3e4f5g Commit anterior
h6i7j8k Otro commit anterior
```

El primero de la lista es tu commit más reciente ✅

---

### **PASO 8: Subir a GitHub**

```bash
git push origin main
```

**Qué pasa:**
- Git envía el commit a GitHub
- GitHub actualiza el repositorio
- Vercel detecta el cambio automáticamente

**Resultado esperado:**
```
To https://github.com/tuusuario/tu-repo.git
   d3e4f5g..a1b2c3d  main -> main
```

✅ Esto significa que se subió exitosamente.

---

### **PASO 9: Verificar Estado Después del Push**

```bash
git status
```

**Deberías ver:**
```
On branch main
Your branch is up to date with 'origin/main'.
nothing to commit, working tree clean
```

✅ Todo sincronizado perfectamente.

---

### **PASO 10: Vercel Despliega Automáticamente**

**¿Qué pasa ahora?**

1. **Vercel detecta el cambio** (5-30 segundos)
2. **Inicia el build** (construye tu app)
3. **Ejecuta tests** (si los tienes)
4. **Despliega a producción** (publica la nueva versión)

**Timeline:**
```
0:00 - Push a GitHub              ✅
0:30 - Vercel detecta cambio      🔍
0:31 - Empieza build              🏗️
2:00 - Build completo             ✅
2:05 - Desplegado en producción   🚀
```

**Total: 1-3 minutos aprox**

---

### **PASO 11: Verificar en el Dashboard de Vercel**

1. **Abre tu dashboard:**
   ```
   https://vercel.com/tuusuario/tu-proyecto
   ```

2. **Verás un nuevo deployment:**
   - **Estado:** "Building..." → "Ready"
   - **Mensaje:** Tu mensaje de commit
   - **Tiempo:** Cuánto tardó el build

3. **Espera que diga "Ready"** ✅

---

### **PASO 12: Probar en Producción**

**Abre tu app en producción:**
```
https://tu-app.vercel.app
```

**Verifica:**
- ✅ El cambio está visible
- ✅ Todo funciona correctamente
- ✅ No hay errores en la consola (F12)

**Si algo no funciona:**
- Revisa la consola del navegador (F12)
- Revisa los logs en Vercel Dashboard → Deployments → [tu deploy] → Build Logs
- Revisa Sentry si hay errores capturados

---

## 🔄 Flujo Rápido (Resumen)

Para cuando ya lo tengas dominado:

```bash
# 1. Ver cambios
git status

# 2. Agregar archivos
git add .

# 3. Commit
git commit -m "Descripción clara del cambio"

# 4. Subir
git push origin main

# 5. Esperar 2 minutos

# 6. Verificar en producción
```

---

## ⚠️ Errores Comunes y Soluciones

### **Error 1: "Changes not staged for commit"**

**Problema:** Olvidaste hacer `git add`

**Solución:**
```bash
git add .
git commit -m "mensaje"
git push origin main
```

---

### **Error 2: "Your branch is behind 'origin/main'"**

**Problema:** GitHub tiene cambios que no tienes en tu PC

**Solución:**
```bash
git pull origin main    # Descarga cambios primero
git push origin main    # Luego sube los tuyos
```

---

### **Error 3: "Please tell me who you are"**

**Problema:** Git no sabe tu nombre/email

**Solución:**
```bash
git config --global user.email "tuemail@example.com"
git config --global user.name "Tu Nombre"
```

---

### **Error 4: Build falla en Vercel**

**Problema:** Tu código tiene errores de compilación

**Solución:**
1. Ve a Vercel Dashboard → Build Logs
2. Lee el error
3. Arréglalo localmente
4. Prueba que funcione: `npm run build`
5. Sube el fix con git

---

### **Error 5: Conflictos de merge**

**Problema:** Mismo archivo modificado en dos lugares

**Verás en el archivo:**
```
<<<<<<< HEAD
código versión A
=======
código versión B
>>>>>>> commit
```

**Solución:**
1. Abre el archivo
2. Borra las líneas `<<<<<<<`, `=======`, `>>>>>>>`
3. Deja solo el código que quieres
4. Guarda
5. `git add archivo.js`
6. `git commit -m "Resolver conflicto"`
7. `git push origin main`

---

## 📊 Checklist Pre-Deploy

Antes de hacer `git push`, verifica:

- [ ] ✅ Los cambios funcionan en local (`npm run dev`)
- [ ] ✅ No hay errores en la consola del navegador
- [ ] ✅ El build funciona (`npm run build`)
- [ ] ✅ El mensaje del commit es claro y descriptivo
- [ ] ✅ No subes archivos con contraseñas o secrets
- [ ] ✅ No subes archivos temporales (.env, node_modules/, etc.)
- [ ] ✅ Hiciste `git status` para verificar qué subes

---

## 💡 Buenas Prácticas

### **1. Commits Pequeños y Frecuentes**

✅ **Bien:**
```
- Commit 1: "Agregar botón de compartir"
- Commit 2: "Arreglar estilo del botón"
- Commit 3: "Agregar funcionalidad al botón"
```

❌ **Mal:**
```
- Commit único: "Agregar botón, arreglar 10 bugs, cambiar colores, refactorizar todo"
```

**Ventaja:** Si algo sale mal, es más fácil revertir un cambio pequeño.

---

### **2. Mensajes Descriptivos**

✅ **Bien:**
```bash
git commit -m "Arreglar bug donde usuarios no podían subir videos mayores a 100MB"
```

❌ **Mal:**
```bash
git commit -m "fix bug"
```

**Ventaja:** Después de 6 meses, sabrás exactamente qué hizo cada commit.

---

### **3. Probar Antes de Subir**

**Siempre:**
1. Prueba en local
2. Revisa la consola (F12)
3. Haz build (`npm run build`)
4. Prueba el build (`npm run preview`)

**Ventaja:** Evitas deployments rotos en producción.

---

### **4. Revisar lo que Subes**

```bash
# Antes de commit, revisa los cambios
git diff

# Antes de push, revisa los commits
git log --oneline -5
```

**Ventaja:** Evitas subir archivos basura o código temporal.

---

## 🚨 ¿Qué NO Subir?

**NUNCA subas:**
- ❌ Contraseñas o API keys
- ❌ Archivos `.env` (a menos que sean ejemplos como `.env.example`)
- ❌ `node_modules/` (se instala automáticamente)
- ❌ Archivos temporales (`.DS_Store`, `Thumbs.db`, `nul`)
- ❌ Archivos de configuración del editor (`.vscode/`, `.idea/`)

**Estos ya están ignorados en `.gitignore`** ✅

---

## 📚 Comandos Útiles

### **Ver historial de commits:**
```bash
git log --oneline --graph --all
```

### **Ver diferencias antes de commit:**
```bash
git diff
```

### **Ver diferencias de un archivo específico:**
```bash
git diff tailwind.config.js
```

### **Deshacer cambios NO commitados:**
```bash
git restore archivo.js
```

### **Deshacer staging (git add):**
```bash
git restore --staged archivo.js
```

### **Ver cambios de un commit específico:**
```bash
git show a1b2c3d
```

---

## 🎯 Ejemplo Completo Paso a Paso

**Escenario:** Cambiar el color del botón principal de rojo a azul

### **1. Modificar código:**
```javascript
// src/components/Button.jsx
// Cambias: bg-red-500 → bg-blue-500
```

### **2. Probar en local:**
```bash
npm run dev
# Abres http://localhost:5173
# Verificas que el botón es azul ✅
```

### **3. Ver cambios:**
```bash
git status
# Salida: modified: src/components/Button.jsx
```

### **4. Agregar archivo:**
```bash
git add src/components/Button.jsx
```

### **5. Commit:**
```bash
git commit -m "Cambiar color del botón principal de rojo a azul"
```

### **6. Subir:**
```bash
git push origin main
```

### **7. Esperar deploy:**
- Ve a Vercel Dashboard
- Espera que diga "Ready" (1-2 min)

### **8. Verificar:**
- Abre https://tu-app.vercel.app
- Verifica que el botón es azul ✅

---

## ✅ Resumen

**3 comandos esenciales:**
```bash
git add .
git commit -m "mensaje"
git push origin main
```

**Tiempo total:** 2-3 minutos (tu parte) + 1-2 minutos (Vercel)

**Resultado:** Tu código en producción, accesible para el mundo 🌍

---

## 📞 Soporte

**Si algo no funciona:**
1. Revisa la consola del navegador (F12)
2. Revisa Vercel Build Logs
3. Revisa Sentry para errores
4. Lee este documento de nuevo
5. Lee `docs/VERSION_CONTROL.md` para revertir cambios

---

**Última actualización:** 2025-01-19
**Versión:** 1.0.0
**Proyecto:** Seven - CineAmateur
