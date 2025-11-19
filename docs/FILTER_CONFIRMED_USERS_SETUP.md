# Configuración: Filtrar Usuarios No Confirmados

## 📋 Problema

Los usuarios que se registran pero **no confirman su email** aparecen en:
- ✗ Búsqueda de usuarios
- ✗ Sugerencias de usuarios para seguir

Esto es un problema de **seguridad y UX** porque:
1. **Spam/Bots**: Cuentas fake pueden aparecer sin verificación
2. **Confusión UX**: Usuarios no confirmados no pueden hacer login, pero aparecen públicamente
3. **Privacidad**: Alguien puede registrarse con cualquier email sin verificar

## ✅ Solución

Filtrar **solo usuarios confirmados** en búsquedas y sugerencias usando **funciones RPC de Supabase**.

---

## 🚀 Pasos de Implementación

### 1. Aplicar las Funciones RPC en Supabase

#### Opción A: Desde Supabase Dashboard (Recomendado)

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Click en **SQL Editor** en el menú lateral
3. Click en **New Query**
4. Abre el archivo: `database/filter-confirmed-users.sql`
5. Copia **todo el contenido** del archivo
6. Pégalo en el editor SQL
7. Click en **Run** (o presiona `Ctrl+Enter`)
8. Verifica que aparezca: ✅ **Success. No rows returned**

#### Opción B: Desde CLI de Supabase

```bash
# Si tienes Supabase CLI instalado
npx supabase db push database/filter-confirmed-users.sql
```

### 2. Verificar que las Funciones se Crearon

Ejecuta esta query en SQL Editor para verificar:

```sql
SELECT
  proname as function_name,
  pg_get_function_arguments(oid) as arguments
FROM pg_proc
WHERE proname LIKE '%confirmed%';
```

Deberías ver 4 funciones:
- ✅ `get_confirmed_user_ids()`
- ✅ `is_user_confirmed(user_id UUID)`
- ✅ `search_confirmed_users(search_query TEXT, result_limit INT)`
- ✅ `get_suggested_confirmed_users(current_user_id UUID, result_limit INT)`

### 3. Actualizar el Código Frontend

**Ya está hecho** ✅

Los archivos ya fueron actualizados:
- `src/hooks/useProfiles.js` - Funciones `useSearchUsers` y `useSuggestedUsers`

El código ahora usa las funciones RPC en lugar de queries directas.

### 4. Probar la Implementación

#### Prueba 1: Usuarios Sugeridos
1. Inicia sesión con un usuario confirmado
2. Ve al Feed
3. Verifica que en "Cineastas sugeridos" **NO aparezca** el usuario `qqq` (no confirmado)
4. Solo deben aparecer usuarios que confirmaron su email

#### Prueba 2: Búsqueda de Usuarios
1. Ve a la página de Búsqueda
2. Busca "qqq" (el usuario no confirmado)
3. **NO debe aparecer** en los resultados
4. Solo deben aparecer usuarios confirmados

---

## 🔍 Cómo Funcionan las Funciones RPC

### `search_confirmed_users(search_query, result_limit)`

```sql
-- Busca usuarios que:
-- 1. Tienen email_confirmed_at != NULL en auth.users
-- 2. Su username o full_name contiene el texto buscado
-- 3. Limita a N resultados

SELECT p.*
FROM profiles p
INNER JOIN auth.users u ON p.id = u.id
WHERE u.email_confirmed_at IS NOT NULL
  AND (p.username ILIKE '%query%' OR p.full_name ILIKE '%query%')
LIMIT result_limit;
```

**Uso en código:**
```javascript
const { data } = await supabase.rpc('search_confirmed_users', {
  search_query: 'john',
  result_limit: 20
})
```

### `get_suggested_confirmed_users(current_user_id, result_limit)`

```sql
-- Obtiene usuarios que:
-- 1. Tienen email confirmado
-- 2. NO son el usuario actual
-- 3. NO están siendo seguidos por el usuario actual
-- 4. Ordenados por fecha de creación (más nuevos primero)

SELECT p.*
FROM profiles p
INNER JOIN auth.users u ON p.id = u.id
WHERE u.email_confirmed_at IS NOT NULL
  AND p.id != current_user_id
  AND p.id NOT IN (
    SELECT following_id FROM follows WHERE follower_id = current_user_id
  )
ORDER BY p.created_at DESC
LIMIT result_limit;
```

**Uso en código:**
```javascript
const { data } = await supabase.rpc('get_suggested_confirmed_users', {
  current_user_id: user.id,
  result_limit: 5
})
```

---

## 🔒 Seguridad: SECURITY DEFINER

Las funciones usan `SECURITY DEFINER` para poder acceder a `auth.users` (que no es accesible desde el cliente).

**¿Es seguro?** ✅ Sí, porque:
1. **No retornan información sensible**: Solo IDs y datos públicos del perfil
2. **Lógica controlada**: No ejecutan SQL arbitrario del cliente
3. **Parámetros validados**: Supabase valida los tipos de datos
4. **Acceso read-only**: Solo hacen SELECT, no modifican datos

**Alternativa insegura (NO HACER):**
```javascript
// ❌ ESTO NO FUNCIONA - auth.users no es accesible desde cliente
const { data } = await supabase
  .from('auth.users')  // Error: permission denied
  .select('id')
```

---

## 🧪 Testing

### Test Manual: Crear Usuario No Confirmado

1. **Registrar nuevo usuario**:
   - Ve a `/register`
   - Registra con email: `test@example.com`
   - **NO confirmes el email** (ignora el correo de confirmación)

2. **Verificar que NO aparece**:
   - Inicia sesión con otro usuario confirmado
   - Busca "test" en la búsqueda
   - El usuario `test@example.com` **NO debe aparecer**
   - Tampoco debe aparecer en "Cineastas sugeridos"

3. **Confirmar el usuario**:
   - Ve al correo de confirmación
   - Click en el enlace de confirmación
   - **Ahora SÍ debe aparecer** en búsqueda y sugerencias

### Test con SQL Directo

```sql
-- 1. Ver usuarios confirmados vs no confirmados
SELECT
  p.username,
  u.email,
  u.email_confirmed_at,
  CASE
    WHEN u.email_confirmed_at IS NOT NULL THEN 'Confirmado ✅'
    ELSE 'No confirmado ❌'
  END as status
FROM profiles p
INNER JOIN auth.users u ON p.id = u.id;

-- 2. Probar función de búsqueda
SELECT * FROM search_confirmed_users('test', 10);

-- 3. Probar función de sugerencias
SELECT * FROM get_suggested_confirmed_users('tu-user-id-aqui', 5);
```

---

## 🐛 Troubleshooting

### Error: "function does not exist"

**Causa**: Las funciones RPC no se aplicaron correctamente.

**Solución**:
1. Ve a Supabase Dashboard > SQL Editor
2. Ejecuta nuevamente el script `database/filter-confirmed-users.sql`
3. Verifica con: `SELECT proname FROM pg_proc WHERE proname LIKE '%confirmed%';`

### Error: "permission denied for table auth.users"

**Causa**: Las funciones no tienen `SECURITY DEFINER`.

**Solución**:
1. Verifica que las funciones en SQL tengan: `... LANGUAGE plpgsql SECURITY DEFINER;`
2. Re-ejecuta el script completo

### Los usuarios no confirmados siguen apareciendo

**Causa**: El código no está usando las funciones RPC.

**Solución**:
1. Verifica que `src/hooks/useProfiles.js` use `.rpc()` en lugar de `.from('profiles')`
2. Limpia la caché de React Query: `queryClient.clear()`
3. Recarga la página con `Ctrl+Shift+R` (hard refresh)

### "No rows returned" en las funciones

**Causa**: No hay usuarios confirmados en la base de datos.

**Solución**:
1. Registra un usuario
2. Ve al correo y confirma el email
3. Verifica en SQL: `SELECT * FROM auth.users WHERE email_confirmed_at IS NOT NULL;`

---

## 📊 Impacto en Performance

Las funciones RPC son **más eficientes** que múltiples queries:

### Antes (2 queries)
```javascript
// Query 1: Obtener usuarios confirmados
const confirmed = await supabase.from('auth.users')...

// Query 2: Filtrar profiles
const profiles = await supabase.from('profiles').in('id', confirmed)...
```

### Después (1 query)
```javascript
// 1 sola query con JOIN interno
const data = await supabase.rpc('search_confirmed_users', { query })
```

**Ventajas**:
- ✅ Menos latencia (1 round-trip vs 2)
- ✅ Procesamiento en servidor (PostgreSQL es más rápido)
- ✅ Menos código en frontend

---

## 🔄 Rollback (Si hay problemas)

Si necesitas revertir los cambios:

```sql
-- Eliminar las funciones RPC
DROP FUNCTION IF EXISTS get_confirmed_user_ids();
DROP FUNCTION IF EXISTS is_user_confirmed(UUID);
DROP FUNCTION IF EXISTS search_confirmed_users(TEXT, INT);
DROP FUNCTION IF EXISTS get_suggested_confirmed_users(UUID, INT);
```

Y revertir el código en `src/hooks/useProfiles.js` a la versión anterior.

---

## ✅ Checklist de Implementación

- [ ] Ejecutar `database/filter-confirmed-users.sql` en Supabase
- [ ] Verificar que las 4 funciones se crearon correctamente
- [ ] Código de `useProfiles.js` ya actualizado ✅
- [ ] Probar búsqueda de usuarios (no debe mostrar no confirmados)
- [ ] Probar sugerencias de usuarios (no debe mostrar no confirmados)
- [ ] Crear usuario de prueba sin confirmar y verificar que no aparece
- [ ] Confirmar el usuario y verificar que ahora sí aparece

---

## 📚 Referencias

- [Supabase RPC Functions](https://supabase.com/docs/guides/database/functions)
- [PostgreSQL Security Definer](https://www.postgresql.org/docs/current/sql-createfunction.html)
- [Supabase Auth Schema](https://supabase.com/docs/guides/auth/managing-user-data)

---

**Última actualización**: 2025-01-19
**Versión**: 1.0.0
**Estado**: Listo para aplicar
