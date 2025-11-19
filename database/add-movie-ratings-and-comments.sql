-- Agregar sistema de calificaciones y comentarios para películas
-- Este script debe ejecutarse en el SQL Editor de Supabase

-- 1. Crear tabla de ratings de películas
CREATE TABLE IF NOT EXISTS movie_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  movie_id UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(movie_id, user_id) -- Un usuario solo puede calificar una película una vez
);

-- 2. Crear tabla de comentarios de películas
CREATE TABLE IF NOT EXISTS movie_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  movie_id UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Agregar columnas a la tabla movies para tracking avanzado
ALTER TABLE movies
ADD COLUMN IF NOT EXISTS watch_percentage_sum BIGINT DEFAULT 0, -- Suma de % vistos por todos
ADD COLUMN IF NOT EXISTS completed_views INTEGER DEFAULT 0, -- Vistas completas (>70%)
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0, -- Rating promedio
ADD COLUMN IF NOT EXISTS ratings_count INTEGER DEFAULT 0, -- Cantidad de ratings
ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0, -- Cantidad de comentarios
ADD COLUMN IF NOT EXISTS engagement_score DECIMAL(10,2) DEFAULT 0; -- Score para destacadas

-- 4. Crear índices para performance
CREATE INDEX IF NOT EXISTS idx_movie_ratings_movie_id ON movie_ratings(movie_id);
CREATE INDEX IF NOT EXISTS idx_movie_ratings_user_id ON movie_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_movie_comments_movie_id ON movie_comments(movie_id);
CREATE INDEX IF NOT EXISTS idx_movie_comments_user_id ON movie_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_movies_engagement_score ON movies(engagement_score DESC);
CREATE INDEX IF NOT EXISTS idx_movies_average_rating ON movies(average_rating DESC);

-- 5. Trigger para actualizar updated_at en movie_ratings
CREATE OR REPLACE FUNCTION update_movie_rating_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_movie_rating_updated_at ON movie_ratings;
CREATE TRIGGER trigger_update_movie_rating_updated_at
  BEFORE UPDATE ON movie_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_movie_rating_updated_at();

-- 6. Trigger para actualizar updated_at en movie_comments
CREATE OR REPLACE FUNCTION update_movie_comment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_movie_comment_updated_at ON movie_comments;
CREATE TRIGGER trigger_update_movie_comment_updated_at
  BEFORE UPDATE ON movie_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_movie_comment_updated_at();

-- 7. Función para actualizar stats de película cuando se agrega/actualiza rating
CREATE OR REPLACE FUNCTION update_movie_rating_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalcular average_rating y ratings_count
  UPDATE movies
  SET
    average_rating = (SELECT AVG(rating)::DECIMAL(3,2) FROM movie_ratings WHERE movie_id = COALESCE(NEW.movie_id, OLD.movie_id)),
    ratings_count = (SELECT COUNT(*) FROM movie_ratings WHERE movie_id = COALESCE(NEW.movie_id, OLD.movie_id)),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.movie_id, OLD.movie_id);

  -- Recalcular engagement_score
  PERFORM calculate_movie_engagement_score(COALESCE(NEW.movie_id, OLD.movie_id));

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_movie_rating_stats ON movie_ratings;
CREATE TRIGGER trigger_update_movie_rating_stats
  AFTER INSERT OR UPDATE OR DELETE ON movie_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_movie_rating_stats();

-- 8. Función para actualizar contador de comentarios
CREATE OR REPLACE FUNCTION update_movie_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE movies
  SET
    comments_count = (SELECT COUNT(*) FROM movie_comments WHERE movie_id = COALESCE(NEW.movie_id, OLD.movie_id)),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.movie_id, OLD.movie_id);

  -- Recalcular engagement_score
  PERFORM calculate_movie_engagement_score(COALESCE(NEW.movie_id, OLD.movie_id));

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_movie_comments_count ON movie_comments;
CREATE TRIGGER trigger_update_movie_comments_count
  AFTER INSERT OR DELETE ON movie_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_movie_comments_count();

-- 9. Función para calcular engagement score
-- Formula: (completed_views * 10) + (average_rating * ratings_count * 20) + (comments_count * 5)
CREATE OR REPLACE FUNCTION calculate_movie_engagement_score(p_movie_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE movies
  SET engagement_score = (
    (COALESCE(completed_views, 0) * 10) +
    (COALESCE(average_rating, 0) * COALESCE(ratings_count, 0) * 20) +
    (COALESCE(comments_count, 0) * 5)
  )
  WHERE id = p_movie_id;
END;
$$ LANGUAGE plpgsql;

-- 10. Función para registrar vista con porcentaje visto
CREATE OR REPLACE FUNCTION track_movie_view(
  p_movie_id UUID,
  p_user_id UUID,
  p_percentage_watched INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Solo incrementar vistas si es la primera vez que ve >70%
  IF p_percentage_watched >= 70 THEN
    -- Verificar si ya completó la vista anteriormente
    -- (esto requeriría una tabla de tracking, por ahora solo incrementamos)
    UPDATE movies
    SET
      views = views + 1,
      completed_views = completed_views + 1,
      watch_percentage_sum = watch_percentage_sum + p_percentage_watched,
      updated_at = NOW()
    WHERE id = p_movie_id;
  ELSE
    -- Actualizar solo watch_percentage_sum
    UPDATE movies
    SET
      watch_percentage_sum = watch_percentage_sum + p_percentage_watched,
      updated_at = NOW()
    WHERE id = p_movie_id;
  END IF;

  -- Recalcular engagement score
  PERFORM calculate_movie_engagement_score(p_movie_id);
END;
$$;

GRANT EXECUTE ON FUNCTION track_movie_view(UUID, UUID, INTEGER) TO authenticated;

-- 11. RLS Policies para movie_ratings
ALTER TABLE movie_ratings ENABLE ROW LEVEL SECURITY;

-- Ver ratings (todos pueden ver)
CREATE POLICY "Anyone can view ratings"
ON movie_ratings FOR SELECT
USING (true);

-- Crear rating (usuarios autenticados)
CREATE POLICY "Authenticated users can create ratings"
ON movie_ratings FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Actualizar propio rating
CREATE POLICY "Users can update their own ratings"
ON movie_ratings FOR UPDATE
USING (auth.uid() = user_id);

-- Eliminar propio rating
CREATE POLICY "Users can delete their own ratings"
ON movie_ratings FOR DELETE
USING (auth.uid() = user_id);

-- 12. RLS Policies para movie_comments
ALTER TABLE movie_comments ENABLE ROW LEVEL SECURITY;

-- Ver comentarios (todos pueden ver)
CREATE POLICY "Anyone can view movie comments"
ON movie_comments FOR SELECT
USING (true);

-- Crear comentario (usuarios autenticados)
CREATE POLICY "Authenticated users can create movie comments"
ON movie_comments FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Actualizar propio comentario
CREATE POLICY "Users can update their own movie comments"
ON movie_comments FOR UPDATE
USING (auth.uid() = user_id);

-- Eliminar propio comentario
CREATE POLICY "Users can delete their own movie comments"
ON movie_comments FOR DELETE
USING (auth.uid() = user_id);

-- 13. Crear vista para películas destacadas
CREATE OR REPLACE VIEW featured_movies AS
SELECT
  m.*,
  p.username,
  p.full_name,
  p.avatar_url
FROM movies m
JOIN profiles p ON m.user_id = p.id
WHERE m.engagement_score > 0
ORDER BY m.engagement_score DESC, m.created_at DESC
LIMIT 10;

-- 14. Verificar que todo se creó correctamente
SELECT
  'movie_ratings' as table_name,
  COUNT(*) as columns_count
FROM information_schema.columns
WHERE table_name = 'movie_ratings'
UNION ALL
SELECT
  'movie_comments' as table_name,
  COUNT(*) as columns_count
FROM information_schema.columns
WHERE table_name = 'movie_comments';

-- Verificar índices
SELECT
  tablename,
  indexname
FROM pg_indexes
WHERE tablename IN ('movie_ratings', 'movie_comments', 'movies')
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
