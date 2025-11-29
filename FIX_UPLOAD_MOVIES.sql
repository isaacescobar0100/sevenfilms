-- =============================================
-- FIX URGENTE: Permitir subir películas
-- Ejecutar ESTE archivo en Supabase SQL Editor
-- =============================================

-- Paso 1: Habilitar RLS si no está habilitado
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;

-- Paso 2: Eliminar TODAS las políticas existentes de movies
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

-- Paso 3: Crear política de INSERT (CRÍTICO para subir películas)
CREATE POLICY "Enable insert for authenticated users" ON movies
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Paso 4: Crear política de SELECT
CREATE POLICY "Enable read access" ON movies
FOR SELECT
TO public
USING (
  status = 'approved'
  OR user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'superadmin')
  )
);

-- Paso 5: Crear política de UPDATE
CREATE POLICY "Enable update for owners and admins" ON movies
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'superadmin')
  )
)
WITH CHECK (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'superadmin')
  )
);

-- Paso 6: Crear política de DELETE
CREATE POLICY "Enable delete for owners and admins" ON movies
FOR DELETE
TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'superadmin')
  )
);

-- Verificar que las políticas se crearon
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'movies';
