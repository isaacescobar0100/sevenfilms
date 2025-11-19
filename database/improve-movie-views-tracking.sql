-- =====================================================
-- MEJORA DEL SISTEMA DE TRACKING DE VISTAS DE PELÍCULAS
-- =====================================================
-- Autor: Claude Code
-- Descripción: Implementa un sistema robusto de tracking de vistas
--              que previene conteos duplicados y vistas del creador

-- 1. Crear tabla para tracking de vistas únicas
CREATE TABLE IF NOT EXISTS movie_views (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  movie_id UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  percentage_watched INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  first_viewed_at TIMESTAMPTZ DEFAULT NOW(),
  last_viewed_at TIMESTAMPTZ DEFAULT NOW(),
  view_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraint: una fila por usuario por película
  UNIQUE(movie_id, user_id)
);

-- 2. Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_movie_views_movie_id ON movie_views(movie_id);
CREATE INDEX IF NOT EXISTS idx_movie_views_user_id ON movie_views(user_id);
CREATE INDEX IF NOT EXISTS idx_movie_views_completed ON movie_views(completed);

-- 3. Habilitar RLS (Row Level Security)
ALTER TABLE movie_views ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de seguridad
-- Los usuarios pueden ver sus propias vistas
CREATE POLICY "Users can view own movie views"
  ON movie_views FOR SELECT
  USING (auth.uid() = user_id);

-- Los usuarios pueden insertar sus propias vistas
CREATE POLICY "Users can insert own movie views"
  ON movie_views FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Los usuarios pueden actualizar sus propias vistas
CREATE POLICY "Users can update own movie views"
  ON movie_views FOR UPDATE
  USING (auth.uid() = user_id);

-- 5. Función mejorada para tracking de vistas
CREATE OR REPLACE FUNCTION track_movie_view_improved(
  p_movie_id UUID,
  p_user_id UUID,
  p_percentage_watched INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_movie_owner_id UUID;
  v_existing_view movie_views;
  v_is_new_view BOOLEAN := FALSE;
  v_is_new_completed_view BOOLEAN := FALSE;
  v_result JSON;
BEGIN
  -- Verificar que el porcentaje sea válido
  IF p_percentage_watched < 0 OR p_percentage_watched > 100 THEN
    RAISE EXCEPTION 'Invalid percentage_watched: %', p_percentage_watched;
  END IF;

  -- Obtener el ID del dueño de la película
  SELECT user_id INTO v_movie_owner_id
  FROM movies
  WHERE id = p_movie_id;

  -- NO CONTAR si el usuario es el creador de la película
  IF p_user_id = v_movie_owner_id THEN
    RETURN json_build_object(
      'success', true,
      'message', 'Owner view not counted',
      'is_owner', true,
      'is_new_view', false,
      'is_new_completed_view', false
    );
  END IF;

  -- Verificar si ya existe un registro de vista para este usuario/película
  SELECT * INTO v_existing_view
  FROM movie_views
  WHERE movie_id = p_movie_id AND user_id = p_user_id;

  IF v_existing_view IS NULL THEN
    -- Es una vista nueva
    v_is_new_view := TRUE;

    -- Insertar nuevo registro
    INSERT INTO movie_views (
      movie_id,
      user_id,
      percentage_watched,
      completed,
      view_count
    ) VALUES (
      p_movie_id,
      p_user_id,
      p_percentage_watched,
      p_percentage_watched >= 70,
      1
    );

    -- Si es completada (>=70%), marcar como nueva vista completa
    IF p_percentage_watched >= 70 THEN
      v_is_new_completed_view := TRUE;
    END IF;

  ELSE
    -- Ya existe un registro, actualizar si es necesario

    -- Actualizar el porcentaje si es mayor al anterior
    IF p_percentage_watched > v_existing_view.percentage_watched THEN
      UPDATE movie_views
      SET
        percentage_watched = p_percentage_watched,
        completed = (p_percentage_watched >= 70),
        last_viewed_at = NOW(),
        view_count = view_count + 1,
        updated_at = NOW()
      WHERE movie_id = p_movie_id AND user_id = p_user_id;

      -- Si antes no estaba completa y ahora sí, es una nueva vista completa
      IF NOT v_existing_view.completed AND p_percentage_watched >= 70 THEN
        v_is_new_completed_view := TRUE;
      END IF;
    ELSE
      -- Solo actualizar contador y fecha
      UPDATE movie_views
      SET
        last_viewed_at = NOW(),
        view_count = view_count + 1,
        updated_at = NOW()
      WHERE movie_id = p_movie_id AND user_id = p_user_id;
    END IF;
  END IF;

  -- Actualizar contadores en la tabla movies solo si hay cambios
  IF v_is_new_view OR v_is_new_completed_view THEN
    UPDATE movies
    SET
      views = views + CASE WHEN v_is_new_view THEN 1 ELSE 0 END,
      completed_views = completed_views + CASE WHEN v_is_new_completed_view THEN 1 ELSE 0 END,
      updated_at = NOW()
    WHERE id = p_movie_id;

    -- Recalcular engagement score
    PERFORM calculate_movie_engagement_score(p_movie_id);
  END IF;

  -- Retornar resultado
  RETURN json_build_object(
    'success', true,
    'message', 'View tracked successfully',
    'is_owner', false,
    'is_new_view', v_is_new_view,
    'is_new_completed_view', v_is_new_completed_view,
    'percentage_watched', p_percentage_watched
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'message', SQLERRM
  );
END;
$$;

-- 6. Función para obtener estadísticas de vistas de una película
CREATE OR REPLACE FUNCTION get_movie_view_stats(p_movie_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'total_unique_viewers', COUNT(*),
    'total_completed_viewers', COUNT(*) FILTER (WHERE completed = true),
    'average_percentage_watched', COALESCE(AVG(percentage_watched), 0),
    'total_view_sessions', COALESCE(SUM(view_count), 0)
  ) INTO v_result
  FROM movie_views
  WHERE movie_id = p_movie_id;

  RETURN v_result;
END;
$$;

-- 7. Función para recalcular vistas únicas desde la tabla movie_views
CREATE OR REPLACE FUNCTION recalculate_movie_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE movies m
  SET
    views = (
      SELECT COUNT(*)
      FROM movie_views mv
      WHERE mv.movie_id = m.id
    ),
    completed_views = (
      SELECT COUNT(*)
      FROM movie_views mv
      WHERE mv.movie_id = m.id AND mv.completed = true
    ),
    updated_at = NOW();

  -- Recalcular engagement score para todas las películas
  PERFORM calculate_movie_engagement_score(id) FROM movies;
END;
$$;

-- 8. Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_movie_views_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER movie_views_updated_at_trigger
  BEFORE UPDATE ON movie_views
  FOR EACH ROW
  EXECUTE FUNCTION update_movie_views_updated_at();

-- 9. Comentarios para documentación
COMMENT ON TABLE movie_views IS 'Tabla para tracking de vistas únicas de películas por usuario';
COMMENT ON COLUMN movie_views.percentage_watched IS 'Porcentaje máximo alcanzado (0-100)';
COMMENT ON COLUMN movie_views.completed IS 'True si el usuario vio >= 70% de la película';
COMMENT ON COLUMN movie_views.view_count IS 'Número de veces que el usuario ha reproducido esta película';
COMMENT ON FUNCTION track_movie_view_improved IS 'Registra vistas de películas, evitando duplicados y vistas del creador';
COMMENT ON FUNCTION get_movie_view_stats IS 'Obtiene estadísticas detalladas de vistas de una película';

-- =====================================================
-- NOTAS DE IMPLEMENTACIÓN:
-- =====================================================
-- 1. Las vistas del creador de la película NO se cuentan
-- 2. Cada usuario solo cuenta como 1 vista única, sin importar cuántas veces vea la película
-- 3. Las vistas completadas (>=70%) solo se cuentan la primera vez que se alcanza el 70%
-- 4. Se mantiene un historial del porcentaje máximo visto y número de reproducciones
-- 5. Los contadores en la tabla movies se actualizan solo cuando hay cambios significativos
