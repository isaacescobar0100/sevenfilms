-- =============================================
-- POLÍTICA RLS Y CONSTRAINT PARA NOTIFICACIONES
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- =============================================
-- PASO 1: ACTUALIZAR CONSTRAINT DE TIPO
-- =============================================
-- El constraint actual solo permite: like, comment, follow, movie_upload, reaction
-- Necesitamos agregar: movie_approved, movie_rejected

-- Primero eliminar el constraint existente
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Crear nuevo constraint con todos los tipos necesarios
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

-- =============================================
-- PASO 2: POLÍTICAS RLS
-- =============================================

-- Eliminar política de INSERT existente si hay problemas
DROP POLICY IF EXISTS "Users can create notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can create notifications" ON notifications;
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON notifications;

-- Crear política que permite a cualquier usuario autenticado crear notificaciones
-- (esto es necesario porque las notificaciones se crean en nombre de otros usuarios)
CREATE POLICY "Authenticated users can insert notifications" ON notifications
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
);

-- Asegurar que los usuarios solo pueden ver sus propias notificaciones
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications" ON notifications
FOR SELECT USING (
  auth.uid() = user_id
);

-- Los usuarios pueden actualizar sus propias notificaciones (marcar como leídas)
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications" ON notifications
FOR UPDATE USING (
  auth.uid() = user_id
);

-- Los usuarios pueden eliminar sus propias notificaciones
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
CREATE POLICY "Users can delete own notifications" ON notifications
FOR DELETE USING (
  auth.uid() = user_id
);

-- Verificar las políticas aplicadas
SELECT
  policyname,
  cmd,
  qual::text as using_expression,
  with_check::text as with_check_expression
FROM pg_policies
WHERE tablename = 'notifications';
