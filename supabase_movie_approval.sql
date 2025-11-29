-- =============================================
-- SISTEMA DE APROBACIÓN DE PELÍCULAS
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- 1. Agregar columna status a la tabla movies
ALTER TABLE movies
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending'
CHECK (status IN ('pending', 'approved', 'rejected'));

-- 2. Agregar columna para notas de rechazo (opcional)
ALTER TABLE movies
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- 3. Agregar columna para fecha de revisión
ALTER TABLE movies
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- 4. Agregar columna para el admin que revisó
ALTER TABLE movies
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES profiles(id);

-- 5. Actualizar películas existentes como aprobadas
UPDATE movies SET status = 'approved' WHERE status IS NULL OR status = 'pending';

-- 6. Crear índice para búsquedas por status
CREATE INDEX IF NOT EXISTS idx_movies_status ON movies(status);

-- 7. Actualizar las políticas RLS para que usuarios solo vean películas aprobadas
-- Primero eliminamos la política existente si existe
DROP POLICY IF EXISTS "Anyone can view movies" ON movies;
DROP POLICY IF EXISTS "Public can view approved movies" ON movies;
DROP POLICY IF EXISTS "Users can view approved movies" ON movies;

-- Política: Usuarios normales solo ven películas aprobadas
CREATE POLICY "Users can view approved movies" ON movies
FOR SELECT USING (
  status = 'approved'
  OR auth.uid() = user_id  -- El creador puede ver sus propias películas
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )  -- Los admins pueden ver todas
);

-- 8. Política para que admins puedan actualizar el status
DROP POLICY IF EXISTS "Admins can update movie status" ON movies;
CREATE POLICY "Admins can update movie status" ON movies
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- 9. Los usuarios pueden crear películas (con status pending por defecto)
DROP POLICY IF EXISTS "Users can create movies" ON movies;
CREATE POLICY "Users can create movies" ON movies
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 10. Los usuarios pueden eliminar sus propias películas
DROP POLICY IF EXISTS "Users can delete own movies" ON movies;
CREATE POLICY "Users can delete own movies" ON movies
FOR DELETE USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Verificar que se aplicaron los cambios
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'movies'
AND column_name IN ('status', 'rejection_reason', 'reviewed_at', 'reviewed_by');
