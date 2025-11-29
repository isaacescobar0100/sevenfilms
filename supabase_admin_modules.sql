-- =============================================
-- TABLAS PARA NUEVOS MÓDULOS DE ADMIN
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- 1. TABLA DE ANUNCIOS
-- =============================================
-- Eliminar tabla si existe para recrearla limpia
DROP TABLE IF EXISTS announcements CASCADE;

CREATE TABLE announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'alert')),
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para optimizar consultas
CREATE INDEX idx_announcements_active ON announcements(is_active);
CREATE INDEX idx_announcements_expires ON announcements(expires_at);
CREATE INDEX idx_announcements_created ON announcements(created_at DESC);

-- Habilitar RLS
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para announcements
-- Todos pueden leer anuncios activos
CREATE POLICY "Announcements are viewable by everyone"
  ON announcements FOR SELECT
  USING (is_active = true AND (expires_at IS NULL OR expires_at > NOW()));

-- Solo admins pueden gestionar anuncios
CREATE POLICY "Only admins can insert announcements"
  ON announcements FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Only admins can update announcements"
  ON announcements FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Only admins can delete announcements"
  ON announcements FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Política para que admins lean todos los anuncios (incluyendo inactivos)
CREATE POLICY "Admins can view all announcements"
  ON announcements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );


-- 2. TABLA DE CONFIGURACIÓN DEL SITIO
-- =============================================
-- Eliminar tabla si existe para recrearla limpia
DROP TABLE IF EXISTS site_settings CASCADE;

CREATE TABLE site_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  settings JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id)
);

-- Insertar registro inicial
INSERT INTO site_settings (id, settings)
VALUES (1, '{
  "siteName": "Seven Art",
  "siteDescription": "Red social para amantes del cine",
  "maintenanceMode": false,
  "autoModerateContent": true,
  "requireEmailVerification": false,
  "maxPostLength": 5000,
  "maxCommentLength": 1000,
  "allowGifs": true,
  "allowLinks": true,
  "enablePushNotifications": true,
  "enableEmailNotifications": false,
  "digestFrequency": "daily",
  "defaultFeedSort": "recent",
  "postsPerPage": 10,
  "enableStories": true,
  "storyDuration": 24,
  "defaultProfilePrivacy": "public",
  "allowSearchEngineIndexing": true
}'::jsonb);

-- Habilitar RLS
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Todos pueden leer la configuración
CREATE POLICY "Site settings are viewable by everyone"
  ON site_settings FOR SELECT
  USING (true);

-- Solo admins pueden modificar
CREATE POLICY "Only admins can update site settings"
  ON site_settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Only admins can insert site settings"
  ON site_settings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );


-- 3. TRIGGER PARA ACTUALIZAR updated_at
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para announcements
CREATE TRIGGER update_announcements_updated_at
  BEFORE UPDATE ON announcements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para site_settings
CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON site_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- =============================================
-- VERIFICACIÓN
-- =============================================
SELECT 'Tablas creadas correctamente' as status;
SELECT * FROM announcements;
SELECT * FROM site_settings;
