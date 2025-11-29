-- =============================================
-- EJECUTAR ESTO AHORA - FIX COMPLETO
-- =============================================

-- PARTE 1: FIX NOTIFICACIONES
-- ============================

-- Eliminar constraint que bloquea movie_approved y movie_rejected
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Crear constraint con TODOS los tipos necesarios
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

-- PARTE 2: FIX PELÍCULAS
-- ======================

-- Habilitar RLS
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can insert own movies" ON movies;
DROP POLICY IF EXISTS "Authenticated users can insert movies" ON movies;
DROP POLICY IF EXISTS "Anyone can view approved movies" ON movies;
DROP POLICY IF EXISTS "Users can view own movies" ON movies;
DROP POLICY IF EXISTS "Users can update own movies" ON movies;
DROP POLICY IF EXISTS "Users can delete own movies" ON movies;
DROP POLICY IF EXISTS "Enable read access for all users" ON movies;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON movies;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON movies;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON movies;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON movies;
DROP POLICY IF EXISTS "Enable read access" ON movies;
DROP POLICY IF EXISTS "Enable update for owners and admins" ON movies;
DROP POLICY IF EXISTS "Enable delete for owners and admins" ON movies;

-- Crear política INSERT
CREATE POLICY "Enable insert for authenticated users" ON movies
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Crear política SELECT
CREATE POLICY "Enable read access" ON movies
FOR SELECT TO public
USING (
  status = 'approved'
  OR user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'superadmin'))
);

-- Crear política UPDATE
CREATE POLICY "Enable update for owners and admins" ON movies
FOR UPDATE TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'superadmin'))
);

-- Crear política DELETE
CREATE POLICY "Enable delete for owners and admins" ON movies
FOR DELETE TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'superadmin'))
);

-- VERIFICAR
SELECT 'Constraint notifications:' as info;
SELECT conname FROM pg_constraint WHERE conname = 'notifications_type_check';

SELECT 'Políticas movies:' as info;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'movies';
