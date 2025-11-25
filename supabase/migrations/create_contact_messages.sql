-- Tabla para mensajes de contacto
-- Ejecuta este script en el SQL Editor de Supabase

CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  read BOOLEAN DEFAULT false,
  replied BOOLEAN DEFAULT false,
  replied_at TIMESTAMP WITH TIME ZONE,
  notes TEXT
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS contact_messages_created_at_idx ON contact_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS contact_messages_user_id_idx ON contact_messages(user_id);
CREATE INDEX IF NOT EXISTS contact_messages_read_idx ON contact_messages(read);

-- RLS (Row Level Security)
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Política: Usuarios autenticados pueden insertar sus propios mensajes
CREATE POLICY "Users can insert their own contact messages"
  ON contact_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Política: Usuarios anónimos pueden insertar mensajes (sin user_id)
CREATE POLICY "Anonymous users can insert contact messages"
  ON contact_messages
  FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);

-- Política: Solo admins pueden ver todos los mensajes
-- (Necesitarás crear una tabla de admins o usar un rol específico)
-- Por ahora, comentada hasta que implementes el panel de admin
-- CREATE POLICY "Admins can view all contact messages"
--   ON contact_messages
--   FOR SELECT
--   TO authenticated
--   USING (
--     EXISTS (
--       SELECT 1 FROM profiles
--       WHERE profiles.id = auth.uid()
--       AND profiles.role = 'admin'
--     )
--   );

-- Comentarios en las columnas
COMMENT ON TABLE contact_messages IS 'Mensajes de contacto enviados por usuarios';
COMMENT ON COLUMN contact_messages.user_id IS 'ID del usuario autenticado (null si es anónimo)';
COMMENT ON COLUMN contact_messages.subject IS 'Tipo de consulta: soporte, sugerencia, bug, cuenta, contenido, otro';
COMMENT ON COLUMN contact_messages.read IS 'Indica si el mensaje ha sido leído por un admin';
COMMENT ON COLUMN contact_messages.replied IS 'Indica si el mensaje ha sido respondido';
COMMENT ON COLUMN contact_messages.notes IS 'Notas internas del admin sobre el mensaje';
