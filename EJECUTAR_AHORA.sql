-- =============================================
-- EJECUTAR ESTO EN SUPABASE SQL EDITOR
-- Copia todo y pégalo en el SQL Editor
-- =============================================

-- =============================================
-- PARTE 1: FIX NOTIFICACIONES
-- =============================================

-- PASO 1: Eliminar constraint viejo
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- PASO 2: Crear constraint nuevo con movie_approved y movie_rejected
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
CHECK (type::text = ANY (ARRAY[
  'like'::text,
  'comment'::text,
  'follow'::text,
  'movie_upload'::text,
  'reaction'::text,
  'movie_approved'::text,
  'movie_rejected'::text
]));

-- PASO 3: Eliminar notificaciones viejas con tipo incorrecto
DELETE FROM notifications
WHERE type IS NULL
   OR type NOT IN ('like', 'comment', 'follow', 'movie_upload', 'reaction', 'movie_approved', 'movie_rejected');

-- =============================================
-- PARTE 2: FIX CONTEO DE PELÍCULAS EN PERFIL
-- Solo contar películas aprobadas
-- =============================================

-- Recrear la vista user_stats para contar solo películas aprobadas
DROP VIEW IF EXISTS user_stats;

CREATE VIEW user_stats AS
SELECT
  p.id,
  COALESCE(posts.count, 0) as posts_count,
  COALESCE(movies.count, 0) as movies_count,
  COALESCE(followers.count, 0) as followers_count,
  COALESCE(following.count, 0) as following_count
FROM profiles p
LEFT JOIN (
  SELECT user_id, COUNT(*) as count
  FROM posts
  GROUP BY user_id
) posts ON posts.user_id = p.id
LEFT JOIN (
  SELECT user_id, COUNT(*) as count
  FROM movies
  WHERE status = 'approved'  -- Solo contar películas aprobadas
  GROUP BY user_id
) movies ON movies.user_id = p.id
LEFT JOIN (
  SELECT following_id, COUNT(*) as count
  FROM follows
  GROUP BY following_id
) followers ON followers.following_id = p.id
LEFT JOIN (
  SELECT follower_id, COUNT(*) as count
  FROM follows
  GROUP BY follower_id
) following ON following.follower_id = p.id;

-- =============================================
-- VERIFICACIÓN
-- =============================================
SELECT 'Constraint notifications:' as info;
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conname = 'notifications_type_check';

SELECT 'Vista user_stats recreada correctamente' as info;
