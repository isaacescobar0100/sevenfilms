-- Script para migrar a las nuevas reacciones
-- Ejecutar en Supabase SQL Editor

-- ============================================
-- PASO 1: Actualizar las constraints de la base de datos
-- ============================================

-- Eliminar constraints antiguos
ALTER TABLE post_reactions DROP CONSTRAINT IF EXISTS post_reactions_reaction_type_check;
ALTER TABLE comment_reactions DROP CONSTRAINT IF EXISTS comment_reactions_reaction_type_check;

-- Agregar nuevos constraints con las nuevas reacciones
ALTER TABLE post_reactions
ADD CONSTRAINT post_reactions_reaction_type_check
CHECK (reaction_type IN ('star', 'eyes', 'sleep', 'trash'));

ALTER TABLE comment_reactions
ADD CONSTRAINT comment_reactions_reaction_type_check
CHECK (reaction_type IN ('star', 'eyes', 'sleep', 'trash'));

-- ============================================
-- PASO 2: Migrar reacciones existentes a las nuevas
-- ============================================

-- Mapeo de reacciones antiguas a nuevas:
-- like, love, wow -> star (Excelente)
-- haha -> eyes (Interesante)
-- sad -> sleep (Meh)
-- angry -> trash (Desagradable)

-- Migrar post_reactions
UPDATE post_reactions
SET reaction_type = CASE
  WHEN reaction_type IN ('like', 'love', 'wow') THEN 'star'
  WHEN reaction_type = 'haha' THEN 'eyes'
  WHEN reaction_type = 'sad' THEN 'sleep'
  WHEN reaction_type = 'angry' THEN 'trash'
  ELSE reaction_type
END
WHERE reaction_type IN ('like', 'love', 'haha', 'wow', 'sad', 'angry');

-- Migrar comment_reactions
UPDATE comment_reactions
SET reaction_type = CASE
  WHEN reaction_type IN ('like', 'love', 'wow') THEN 'star'
  WHEN reaction_type = 'haha' THEN 'eyes'
  WHEN reaction_type = 'sad' THEN 'sleep'
  WHEN reaction_type = 'angry' THEN 'trash'
  ELSE reaction_type
END
WHERE reaction_type IN ('like', 'love', 'haha', 'wow', 'sad', 'angry');

-- ============================================
-- PASO 3: Actualizar notificaciones existentes
-- ============================================

-- Actualizar metadata de notificaciones de posts
UPDATE notifications n
SET metadata = jsonb_build_object('reaction', pr.reaction_type)
FROM post_reactions pr
WHERE n.type = 'reaction'
  AND n.entity_type = 'post'
  AND n.entity_id = pr.post_id
  AND n.actor_id = pr.user_id;

-- Actualizar metadata de notificaciones de comentarios
UPDATE notifications n
SET metadata = jsonb_build_object('reaction', cr.reaction_type)
FROM comment_reactions cr
WHERE n.type = 'reaction'
  AND n.entity_type = 'comment'
  AND n.entity_id = cr.comment_id
  AND n.actor_id = cr.user_id;

-- ============================================
-- PASO 4: Verificar la migración
-- ============================================

-- Ver cuántas reacciones hay de cada tipo en posts
SELECT reaction_type, COUNT(*) as total
FROM post_reactions
GROUP BY reaction_type
ORDER BY total DESC;

-- Ver cuántas reacciones hay de cada tipo en comentarios
SELECT reaction_type, COUNT(*) as total
FROM comment_reactions
GROUP BY reaction_type
ORDER BY total DESC;

-- Ver cuántas notificaciones tienen metadata correcto
SELECT COUNT(*) as notificaciones_con_metadata
FROM notifications
WHERE type = 'reaction' AND metadata IS NOT NULL AND metadata ? 'reaction';

-- ============================================
-- ¡LISTO!
-- ============================================
-- Este script ha:
-- 1. Actualizado los constraints de la base de datos
-- 2. Migrado todas las reacciones existentes al nuevo sistema
-- 3. Actualizado las notificaciones con el metadata correcto
-- 4. Mostrado estadísticas de la migración
