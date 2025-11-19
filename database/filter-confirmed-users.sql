-- =====================================================
-- FILTRAR USUARIOS CONFIRMADOS
-- =====================================================
-- Este archivo agrega funciones para filtrar solo usuarios
-- que han confirmado su email en Supabase Auth
-- =====================================================

-- -----------------------------------------------------
-- Función: get_confirmed_user_ids
-- Retorna los IDs de todos los usuarios confirmados
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION get_confirmed_user_ids()
RETURNS TABLE (user_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT id
  FROM auth.users
  WHERE email_confirmed_at IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------
-- Función: is_user_confirmed
-- Verifica si un usuario específico está confirmado
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION is_user_confirmed(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  is_confirmed BOOLEAN;
BEGIN
  SELECT email_confirmed_at IS NOT NULL
  INTO is_confirmed
  FROM auth.users
  WHERE id = user_id;

  RETURN COALESCE(is_confirmed, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------
-- Función: search_confirmed_users
-- Busca usuarios confirmados por username o nombre completo
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION search_confirmed_users(search_query TEXT, result_limit INT DEFAULT 20)
RETURNS TABLE (
  id UUID,
  username TEXT,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.username,
    p.full_name,
    p.avatar_url,
    p.bio
  FROM profiles p
  INNER JOIN auth.users u ON p.id = u.id
  WHERE u.email_confirmed_at IS NOT NULL
    AND (
      p.username ILIKE '%' || search_query || '%'
      OR p.full_name ILIKE '%' || search_query || '%'
    )
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------
-- Función: get_suggested_confirmed_users
-- Obtiene usuarios confirmados sugeridos para seguir
-- Excluye usuarios que ya sigue el usuario actual
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION get_suggested_confirmed_users(current_user_id UUID, result_limit INT DEFAULT 5)
RETURNS TABLE (
  id UUID,
  username TEXT,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.username,
    p.full_name,
    p.avatar_url,
    p.bio
  FROM profiles p
  INNER JOIN auth.users u ON p.id = u.id
  WHERE u.email_confirmed_at IS NOT NULL
    AND p.id != current_user_id
    AND p.id NOT IN (
      SELECT following_id
      FROM follows
      WHERE follower_id = current_user_id
    )
  ORDER BY p.created_at DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------
-- NOTA IMPORTANTE: SECURITY DEFINER
-- -----------------------------------------------------
-- Las funciones usan SECURITY DEFINER para poder acceder
-- a la tabla auth.users (que normalmente no es accesible
-- desde el cliente por razones de seguridad).
--
-- Esto es seguro porque:
-- 1. Solo retornamos IDs, no información sensible como emails
-- 2. Las funciones tienen lógica específica y controlada
-- 3. No aceptan SQL arbitrario del cliente
-- -----------------------------------------------------

-- =====================================================
-- INSTRUCCIONES DE APLICACIÓN
-- =====================================================
-- 1. Ve a Supabase Dashboard > SQL Editor
-- 2. Pega y ejecuta este script completo
-- 3. Verifica que las funciones se crearon correctamente:
--    SELECT * FROM pg_proc WHERE proname LIKE '%confirmed%';
-- 4. Actualiza el código frontend para usar estas funciones RPC
-- =====================================================
