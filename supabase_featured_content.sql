-- =============================================
-- TABLA DE CONTENIDO DESTACADO
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- Eliminar tabla si existe para recrearla limpia
DROP TABLE IF EXISTS featured_content CASCADE;

CREATE TABLE featured_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_type TEXT NOT NULL CHECK (content_type IN ('post', 'movie')),
  content_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  position INTEGER DEFAULT 1,
  added_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Evitar duplicados
  UNIQUE(content_type, content_id)
);

-- Índices para optimizar consultas
CREATE INDEX idx_featured_content_type ON featured_content(content_type);
CREATE INDEX idx_featured_content_position ON featured_content(position);
CREATE INDEX idx_featured_content_created ON featured_content(created_at DESC);

-- Habilitar RLS
ALTER TABLE featured_content ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para featured_content
-- Todos pueden ver contenido destacado
CREATE POLICY "Featured content is viewable by everyone"
  ON featured_content FOR SELECT
  USING (true);

-- Solo admins pueden gestionar contenido destacado
CREATE POLICY "Only admins can insert featured content"
  ON featured_content FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Only admins can update featured content"
  ON featured_content FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Only admins can delete featured content"
  ON featured_content FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Trigger para actualizar updated_at
CREATE TRIGGER update_featured_content_updated_at
  BEFORE UPDATE ON featured_content
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- VERIFICACIÓN
-- =============================================
SELECT 'Tabla featured_content creada correctamente' as status;
SELECT * FROM featured_content;
