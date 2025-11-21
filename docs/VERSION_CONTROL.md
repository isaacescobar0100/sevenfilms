# 🔄 Guía Completa: Control de Versiones con Git

Esta guía te enseña cómo viajar en el tiempo con tu código: ver versiones anteriores, revertir cambios y recuperar código antiguo.

---

## 📖 ¿Qué es el Control de Versiones?

**Control de versiones = Máquina del tiempo para tu código**

Puedes:
- ✅ Ver cómo estaba tu código hace días, semanas o meses
- ✅ Volver a una versión anterior si algo se rompió
- ✅ Comparar qué cambió entre versiones
- ✅ Recuperar código que borraste por accidente
- ✅ Experimentar sin miedo a romper nada

**Es como tener un "Ctrl+Z" infinito para todo tu proyecto** ✨

---

## 🎯 Conceptos Clave

### **Commit**
- Punto de guardado en el tiempo
- Como una "fotografía" de tu código en un momento específico
- Tiene un ID único (hash): `a1b2c3d`

### **Branch (Rama)**
- Línea de desarrollo
- `main` = rama principal (producción)

### **HEAD**
- Indica dónde estás ahora
- Normalmente apunta al último commit de `main`

### **Hash**
- ID único de cada commit
- Ejemplo: `a1b2c3d`, `d39f611`
- Se usa para identificar commits

---

## 📊 Ver el Historial

### **Ver historial simple:**
```bash
git log --oneline
```

**Resultado:**
```
a1b2c3d Cambiar color a azul
d3e4f5g Arreglar bug de login
h6i7j8k Agregar modo oscuro
k9l0m1n Fix rating system
```

El de arriba es el más reciente ⬆️

---

### **Ver historial con gráfico:**
```bash
git log --oneline --graph --all
```

**Resultado:**
```
* a1b2c3d (HEAD -> main, origin/main) Cambiar color a azul
* d3e4f5g Arreglar bug de login
* h6i7j8k Agregar modo oscuro
* k9l0m1n Fix rating system
```

---

### **Ver últimos N commits:**
```bash
git log --oneline -5    # Últimos 5 commits
git log --oneline -10   # Últimos 10 commits
```

---

### **Ver commits de una fecha específica:**
```bash
# Commits de hoy
git log --since="1 day ago" --oneline

# Commits de esta semana
git log --since="1 week ago" --oneline

# Commits de un rango de fechas
git log --since="2025-01-01" --until="2025-01-15" --oneline
```

---

## 🔍 Ver Detalles de un Commit

### **Ver qué cambió en un commit:**
```bash
git show a1b2c3d
```

**Resultado:**
- Mensaje del commit
- Autor y fecha
- Archivos modificados
- Líneas agregadas (verde +)
- Líneas eliminadas (rojo -)

---

### **Ver solo los archivos que cambiaron:**
```bash
git show a1b2c3d --name-only
```

---

### **Ver estadísticas (cuántas líneas):**
```bash
git show a1b2c3d --stat
```

---

## 📝 Comparar Versiones

### **Comparar dos commits:**
```bash
git diff h6i7j8k a1b2c3d
```

Muestra qué cambió entre esos dos commits.

---

### **Comparar un commit con el actual:**
```bash
git diff h6i7j8k HEAD
```

---

### **Comparar solo un archivo:**
```bash
git diff h6i7j8k a1b2c3d -- tailwind.config.js
```

---

### **Ver diferencias del último commit:**
```bash
git diff HEAD~1 HEAD
```

`HEAD~1` = commit anterior
`HEAD~2` = 2 commits atrás
`HEAD~3` = 3 commits atrás

---

## 👁️ Ver Versiones Anteriores (Turismo)

**"Turismo" = Ver código antiguo SIN cambiar nada permanente**

### **Ir a un commit antiguo:**
```bash
git checkout h6i7j8k
```

**Qué pasa:**
- Todos tus archivos cambian a como estaban en ese commit
- Puedes ver el código
- Puedes ejecutar `npm run dev` para ver cómo funcionaba
- **NO se pierde nada**

**Verás esto:**
```
HEAD detached at h6i7j8k
```

Significa: "Estás turisteando en el pasado"

---

### **Volver al presente:**
```bash
git checkout main
```

**Importante:** SIEMPRE vuelve a `main` cuando termines de turistear.

---

### **Ver un archivo específico de un commit:**
```bash
git show h6i7j8k:tailwind.config.js
```

Muestra cómo era ese archivo en ese commit.

---

## ⏮️ Revertir Cambios

Hay 3 formas de volver atrás:

---

### **OPCIÓN 1: Revert (Recomendada - La Más Segura)**

**Qué hace:**
- Deshace un commit específico
- Crea un NUEVO commit que dice "Revert: mensaje del commit original"
- Mantiene el historial completo
- Es reversible

**Cuándo usar:**
- Cuando necesitas deshacer algo que ya está en producción
- Cuando trabajas en equipo
- Cuando quieres mantener el historial

**Cómo:**
```bash
# 1. Ver historial
git log --oneline -5

# 2. Identificar el commit a revertir
# Ejemplo: a1b2c3d "Cambiar color a azul"

# 3. Revertir
git revert a1b2c3d
```

**Resultado:**
```
# ANTES
a1b2c3d Cambiar color a azul       ← Queremos deshacer esto
d3e4f5g Arreglar bug de login
h6i7j8k Agregar modo oscuro

# DESPUÉS
n2o3p4q Revert "Cambiar color a azul"  ← NUEVO commit
a1b2c3d Cambiar color a azul
d3e4f5g Arreglar bug de login
h6i7j8k Agregar modo oscuro
```

**Si hay conflictos:**
1. Git te muestra en qué archivos hay conflictos
2. Abre esos archivos
3. Busca las líneas con `<<<<<<<`, `=======`, `>>>>>>>`
4. Borra esas líneas y deja el código que quieres
5. Guarda el archivo
6. `git add archivo.js`
7. `git revert --continue`

**Subir a producción:**
```bash
git push origin main
```

---

### **OPCIÓN 2: Reset --hard (Peligroso)**

**Qué hace:**
- BORRA commits del historial
- Vuelve el código a un commit antiguo
- **NO es reversible fácilmente**
- Pierdes todo lo que vino después

**Cuándo usar:**
- Solo en emergencias
- Solo si NO has hecho push
- Solo si estás 100% seguro

**⚠️ ADVERTENCIA:** Esto es permanente. Solo usa si sabes lo que haces.

**Cómo:**
```bash
# 1. Ver historial
git log --oneline -5

# 2. Decidir a qué commit volver
# Ejemplo: h6i7j8k

# 3. Reset (BORRA todo después)
git reset --hard h6i7j8k

# 4. Si ya hiciste push antes, necesitas force push
git push origin main --force
```

**Resultado:**
```
# ANTES
a1b2c3d Cambiar color a azul
d3e4f5g Arreglar bug de login
h6i7j8k Agregar modo oscuro       ← Volvemos aquí

# DESPUÉS
h6i7j8k Agregar modo oscuro       ← Solo esto queda
(los commits posteriores DESAPARECEN)
```

**⚠️ PELIGROS:**
- Si otros tienen el código, causarás problemas
- No puedes recuperar lo borrado fácilmente
- Puedes perder trabajo importante

---

### **OPCIÓN 3: Checkout + Commit Manual (Híbrido)**

**Qué hace:**
- Recuperas archivos de un commit antiguo
- Haces un nuevo commit con esos archivos
- Mantiene el historial

**Cuándo usar:**
- Cuando quieres solo ALGUNOS archivos de un commit antiguo
- Cuando quieres tener más control

**Cómo:**
```bash
# 1. Ver historial
git log --oneline -5

# 2. Recuperar archivos específicos de un commit
git checkout h6i7j8k -- tailwind.config.js

# 3. Verificar
git status
# Verás: modified: tailwind.config.js

# 4. Commit
git add tailwind.config.js
git commit -m "Recuperar configuración de colores anterior"

# 5. Subir
git push origin main
```

---

## 🎯 Ejemplos Prácticos

### **Ejemplo 1: Volver de AZUL a PÚRPURA**

**Situación:** Cambiaste colores a azul pero prefieres el púrpura anterior.

```bash
# 1. Ver historial
git log --oneline -5
```

**Resultado:**
```
a1b2c3d Cambiar a azul          ← Quieres deshacer esto
d3e4f5g Ajustar púrpura
h6i7j8k Cambiar a púrpura
```

**Solución con Revert:**
```bash
# 2. Revertir el commit de azul
git revert a1b2c3d

# 3. Si hay conflicto, resolver:
#    - Abre tailwind.config.js
#    - Borra <<<<<<<, =======, >>>>>>>
#    - Deja solo el código púrpura
#    - Guarda

# 4. Continuar
git add tailwind.config.js
git revert --continue

# 5. Subir
git push origin main
```

---

### **Ejemplo 2: Recuperar Archivo Borrado**

**Situación:** Borraste `Header.jsx` por accidente hace 3 commits.

```bash
# 1. Ver historial
git log --oneline -10

# 2. Encontrar el commit donde existía
# Ejemplo: h6i7j8k

# 3. Recuperar el archivo
git checkout h6i7j8k -- src/components/Header.jsx

# 4. Commit
git add src/components/Header.jsx
git commit -m "Recuperar Header.jsx borrado por accidente"

# 5. Subir
git push origin main
```

---

### **Ejemplo 3: Ver Cómo Funcionaba Antes**

**Situación:** Tu app funciona raro. Quieres ver cómo funcionaba hace 1 semana.

```bash
# 1. Ver commits de hace 1 semana
git log --since="1 week ago" --oneline

# 2. Elegir un commit
# Ejemplo: k9l0m1n

# 3. Ir a ese commit (turismo)
git checkout k9l0m1n

# 4. Probar la app
npm run dev
# Abre http://localhost:5173

# 5. IMPORTANTE: Volver al presente
git checkout main
```

---

### **Ejemplo 4: Comparar Dos Versiones de Colores**

**Situación:** Quieres ver exactamente qué cambió entre púrpura y azul.

```bash
# 1. Ver historial
git log --oneline -5
```

**Resultado:**
```
a1b2c3d Cambiar a azul
d3e4f5g Ajustar púrpura
```

```bash
# 2. Comparar
git diff d3e4f5g a1b2c3d

# 3. Ver solo el archivo de colores
git diff d3e4f5g a1b2c3d -- tailwind.config.js
```

---

## 🆘 Solución de Problemas

### **Problema 1: "HEAD detached"**

**Qué significa:** Estás turisteando en un commit antiguo.

**Solución:**
```bash
git checkout main
```

---

### **Problema 2: Conflictos de Merge**

**Qué verás en el archivo:**
```javascript
<<<<<<< HEAD
código versión A
=======
código versión B
>>>>>>> commit mensaje
```

**Solución:**
1. Decide qué versión quieres (A o B)
2. Borra las líneas `<<<<<<<`, `=======`, `>>>>>>>`
3. Deja solo el código que quieres
4. Guarda
5. `git add archivo.js`
6. `git revert --continue` (o `git merge --continue`)

---

### **Problema 3: Quiero Cancelar un Revert**

```bash
git revert --abort
```

---

### **Problema 4: Hice Reset por Error**

Si acabas de hacer reset y NO hiciste push:

```bash
# Ver historial completo (incluye commits "borrados")
git reflog

# Busca el commit que querías mantener
# Ejemplo: a1b2c3d

# Vuelve a ese commit
git reset --hard a1b2c3d
```

⚠️ Solo funciona si NO hiciste push después del reset.

---

## 📊 Comparativa de Métodos

| Método | Seguridad | Reversible | Mantiene Historial | Cuándo Usar |
|--------|-----------|------------|-------------------|-------------|
| **Revert** | ✅ Muy seguro | ✅ Sí | ✅ Sí | Deshacer en producción |
| **Reset** | ⚠️ Peligroso | ❌ Difícil | ❌ No | Solo emergencias |
| **Checkout** | ✅ Seguro | ✅ Sí | ✅ Sí | Solo ver o recuperar archivos |

**Recomendación:** Usa **REVERT** siempre que sea posible.

---

## 💡 Buenas Prácticas

### **1. Commits Frecuentes**

Haz commits pequeños y frecuentes. Así es más fácil revertir cambios específicos.

✅ **Bien:**
```
- Commit cada feature/fix pequeño
- Historial detallado
- Fácil de revertir
```

❌ **Mal:**
```
- Commit gigante con 100 cambios
- Difícil saber qué pasó
- Si algo falla, pierdes todo
```

---

### **2. Mensajes Descriptivos**

Mensajes claros te ayudan a encontrar qué commit revertir.

✅ **Bien:**
```bash
git commit -m "Arreglar bug donde videos mayores a 100MB no se podían subir"
```

❌ **Mal:**
```bash
git commit -m "fix"
```

---

### **3. Probar Antes de Revertir**

Antes de revertir en producción:

1. Haz `git checkout` al commit antiguo (turismo)
2. Prueba que funciona: `npm run dev`
3. Si funciona, entonces haz `git revert`

---

### **4. No Usar Reset en Producción**

**NUNCA uses `git reset --hard` si ya hiciste push a GitHub.**

Causarás problemas a:
- Vercel (deployments desincronizados)
- Otros desarrolladores (si trabajan en el proyecto)
- Tu propio historial

**Usa `git revert` en su lugar.**

---

## 🎓 Comandos de Referencia Rápida

### **Ver Historial:**
```bash
git log --oneline              # Simple
git log --oneline --graph      # Con gráfico
git log --oneline -5           # Últimos 5
git log --since="1 week ago"   # Última semana
```

### **Ver Detalles:**
```bash
git show a1b2c3d               # Ver commit completo
git show a1b2c3d --name-only   # Solo archivos
git diff a1b2c3d h6i7j8k       # Comparar commits
```

### **Turismo (Ver antiguo):**
```bash
git checkout a1b2c3d           # Ir a commit
git checkout main              # Volver al presente
```

### **Revertir (Deshacer):**
```bash
git revert a1b2c3d             # Revertir commit
git revert --continue          # Continuar después de resolver conflictos
git revert --abort             # Cancelar revert
```

### **Recuperar Archivos:**
```bash
git checkout a1b2c3d -- archivo.js    # Recuperar archivo específico
```

---

## 📚 Recursos Adicionales

- **Documentación oficial de Git:** https://git-scm.com/doc
- **Git Cheat Sheet:** https://education.github.com/git-cheat-sheet-education.pdf
- **Guía de deploy:** `docs/DEPLOY_PRODUCTION.md`
- **Features del proyecto:** `docs/FEATURES_STATUS.md`

---

## ✅ Resumen

**Para ver historial:**
```bash
git log --oneline
```

**Para turistear (solo ver):**
```bash
git checkout a1b2c3d    # Ir
git checkout main       # Volver
```

**Para revertir (deshacer):**
```bash
git revert a1b2c3d
git push origin main
```

**Regla de oro:** Usa `revert`, NO `reset --hard`.

---

## 🚨 Casos de Emergencia

### **"Rompí todo y no sé qué pasó"**

```bash
# 1. Ver últimos commits
git log --oneline -10

# 2. Ir al último que funcionaba
git checkout h6i7j8k

# 3. Probar
npm run dev

# 4. Si funciona, hacer revert de los commits malos
git checkout main
git revert a1b2c3d --no-edit
git push origin main
```

---

### **"Borré código importante"**

```bash
# 1. Buscar cuándo existía
git log --all --full-history --oneline -- archivo.js

# 2. Recuperar
git checkout commit-hash -- archivo.js

# 3. Commit
git add archivo.js
git commit -m "Recuperar archivo.js"
git push origin main
```

---

**Última actualización:** 2025-01-19
**Versión:** 1.0.0
**Proyecto:** Seven - CineAmateur
