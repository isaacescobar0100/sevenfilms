-- =====================================================
-- Agregar tablas para vistas y reacciones de historias
-- =====================================================

-- Tabla para registrar quién vio cada historia
CREATE TABLE IF NOT EXISTS story_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(story_id, viewer_id)
);

-- Índices para story_views
CREATE INDEX IF NOT EXISTS idx_story_views_story_id ON story_views(story_id);
CREATE INDEX IF NOT EXISTS idx_story_views_viewer_id ON story_views(viewer_id);

-- Tabla para reacciones a historias
CREATE TABLE IF NOT EXISTS story_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(story_id, user_id)
);

-- Índices para story_reactions
CREATE INDEX IF NOT EXISTS idx_story_reactions_story_id ON story_reactions(story_id);
CREATE INDEX IF NOT EXISTS idx_story_reactions_user_id ON story_reactions(user_id);

-- =====================================================
-- Políticas RLS para story_views
-- =====================================================

ALTER TABLE story_views ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver las vistas de sus propias historias
CREATE POLICY "Users can view their own story views"
  ON story_views FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id = story_views.story_id
      AND stories.user_id = auth.uid()
    )
  );

-- Política: Los usuarios pueden insertar sus propias vistas
CREATE POLICY "Users can insert their own views"
  ON story_views FOR INSERT
  WITH CHECK (viewer_id = auth.uid());

-- =====================================================
-- Políticas RLS para story_reactions
-- =====================================================

ALTER TABLE story_reactions ENABLE ROW LEVEL SECURITY;

-- Política: Cualquiera puede ver reacciones
CREATE POLICY "Anyone can view reactions"
  ON story_reactions FOR SELECT
  USING (true);

-- Política: Los usuarios autenticados pueden insertar sus propias reacciones
CREATE POLICY "Users can insert their own reactions"
  ON story_reactions FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Política: Los usuarios pueden actualizar sus propias reacciones
CREATE POLICY "Users can update their own reactions"
  ON story_reactions FOR UPDATE
  USING (user_id = auth.uid());

-- Política: Los usuarios pueden eliminar sus propias reacciones
CREATE POLICY "Users can delete their own reactions"
  ON story_reactions FOR DELETE
  USING (user_id = auth.uid());

-- =====================================================
-- Verificar que la tabla stories existe
-- =====================================================
-- Si no existe, créala (esto es solo referencia, debería existir)
/*
CREATE TABLE IF NOT EXISTS stories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  media_url TEXT,
  media_type VARCHAR(20) DEFAULT 'image', -- 'image', 'video', 'text'
  text_content TEXT,
  background_color VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours')
);
*/
