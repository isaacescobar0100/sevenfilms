-- =====================================================
-- VALIDACIÓN DE RATINGS Y COMENTARIOS DEL CREADOR
-- =====================================================
-- Autor: Claude Code
-- Descripción: Impide que los creadores de películas puedan
--              calificar o comentar sus propias películas

-- 1. Actualizar función de rating para validar ownership
CREATE OR REPLACE FUNCTION add_or_update_movie_rating(
  p_movie_id UUID,
  p_user_id UUID,
  p_rating INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_movie_owner_id UUID;
  v_existing_rating movie_ratings;
  v_result JSON;
BEGIN
  -- Verificar que el rating sea válido (1-5)
  IF p_rating < 1 OR p_rating > 5 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'invalid_rating',
      'message', 'Rating must be between 1 and 5'
    );
  END IF;

  -- Obtener el ID del dueño de la película
  SELECT user_id INTO v_movie_owner_id
  FROM movies
  WHERE id = p_movie_id;

  -- NO PERMITIR que el creador califique su propia película
  IF p_user_id = v_movie_owner_id THEN
    RETURN json_build_object(
      'success', false,
      'error', 'owner_rating_not_allowed',
      'message', 'You cannot rate your own movie',
      'is_owner', true
    );
  END IF;

  -- Verificar si ya existe un rating de este usuario
  SELECT * INTO v_existing_rating
  FROM movie_ratings
  WHERE movie_id = p_movie_id AND user_id = p_user_id;

  IF v_existing_rating IS NULL THEN
    -- Crear nuevo rating
    INSERT INTO movie_ratings (movie_id, user_id, rating)
    VALUES (p_movie_id, p_user_id, p_rating)
    RETURNING * INTO v_existing_rating;
  ELSE
    -- Actualizar rating existente
    UPDATE movie_ratings
    SET
      rating = p_rating,
      updated_at = NOW()
    WHERE movie_id = p_movie_id AND user_id = p_user_id
    RETURNING * INTO v_existing_rating;
  END IF;

  -- Recalcular estadísticas de rating de la película
  PERFORM update_movie_rating_stats(p_movie_id);

  -- Recalcular engagement score
  PERFORM calculate_movie_engagement_score(p_movie_id);

  RETURN json_build_object(
    'success', true,
    'message', 'Rating saved successfully',
    'rating', row_to_json(v_existing_rating)
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', 'database_error',
    'message', SQLERRM
  );
END;
$$;

-- 2. Actualizar función de comentarios para validar ownership
-- NOTA: El creador SÍ puede comentar (para responder), pero no suma al engagement
CREATE OR REPLACE FUNCTION add_movie_comment(
  p_movie_id UUID,
  p_user_id UUID,
  p_content TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_movie_owner_id UUID;
  v_new_comment movie_comments;
  v_is_owner BOOLEAN := FALSE;
  v_result JSON;
BEGIN
  -- Verificar que el comentario tenga contenido
  IF p_content IS NULL OR LENGTH(TRIM(p_content)) = 0 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'empty_comment',
      'message', 'Comment cannot be empty'
    );
  END IF;

  -- Obtener el ID del dueño de la película
  SELECT user_id INTO v_movie_owner_id
  FROM movies
  WHERE id = p_movie_id;

  -- Verificar si es el creador
  IF p_user_id = v_movie_owner_id THEN
    v_is_owner := TRUE;
  END IF;

  -- Crear el comentario (se permite incluso si es el creador)
  INSERT INTO movie_comments (movie_id, user_id, content)
  VALUES (p_movie_id, p_user_id, p_content)
  RETURNING * INTO v_new_comment;

  -- Solo incrementar contador si NO es el creador
  IF NOT v_is_owner THEN
    UPDATE movies
    SET
      comments_count = comments_count + 1,
      updated_at = NOW()
    WHERE id = p_movie_id;

    -- Recalcular engagement score solo si no es el creador
    PERFORM calculate_movie_engagement_score(p_movie_id);
  END IF;

  RETURN json_build_object(
    'success', true,
    'message', 'Comment added successfully',
    'comment', row_to_json(v_new_comment),
    'is_owner', v_is_owner
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', 'database_error',
    'message', SQLERRM
  );
END;
$$;

-- 3. Función para eliminar comentario (solo si es el autor del comentario)
CREATE OR REPLACE FUNCTION delete_movie_comment(
  p_comment_id UUID,
  p_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_comment movie_comments;
  v_movie_id UUID;
  v_movie_owner_id UUID;
  v_is_owner BOOLEAN := FALSE;
BEGIN
  -- Obtener el comentario
  SELECT * INTO v_comment
  FROM movie_comments
  WHERE id = p_comment_id;

  IF v_comment IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'comment_not_found',
      'message', 'Comment not found'
    );
  END IF;

  -- Verificar que el usuario sea el autor del comentario
  IF v_comment.user_id != p_user_id THEN
    RETURN json_build_object(
      'success', false,
      'error', 'unauthorized',
      'message', 'You can only delete your own comments'
    );
  END IF;

  v_movie_id := v_comment.movie_id;

  -- Verificar si el comentario era del creador de la película
  SELECT user_id INTO v_movie_owner_id
  FROM movies
  WHERE id = v_movie_id;

  IF v_comment.user_id = v_movie_owner_id THEN
    v_is_owner := TRUE;
  END IF;

  -- Eliminar el comentario
  DELETE FROM movie_comments
  WHERE id = p_comment_id;

  -- Solo decrementar contador si NO era del creador
  IF NOT v_is_owner THEN
    UPDATE movies
    SET
      comments_count = GREATEST(0, comments_count - 1),
      updated_at = NOW()
    WHERE id = v_movie_id;

    -- Recalcular engagement score solo si no era del creador
    PERFORM calculate_movie_engagement_score(v_movie_id);
  END IF;

  RETURN json_build_object(
    'success', true,
    'message', 'Comment deleted successfully'
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', 'database_error',
    'message', SQLERRM
  );
END;
$$;

-- 4. Función para actualizar comentario
CREATE OR REPLACE FUNCTION update_movie_comment(
  p_comment_id UUID,
  p_user_id UUID,
  p_content TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_comment movie_comments;
  v_updated_comment movie_comments;
BEGIN
  -- Verificar que el comentario tenga contenido
  IF p_content IS NULL OR LENGTH(TRIM(p_content)) = 0 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'empty_comment',
      'message', 'Comment cannot be empty'
    );
  END IF;

  -- Obtener el comentario
  SELECT * INTO v_comment
  FROM movie_comments
  WHERE id = p_comment_id;

  IF v_comment IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'comment_not_found',
      'message', 'Comment not found'
    );
  END IF;

  -- Verificar que el usuario sea el autor del comentario
  IF v_comment.user_id != p_user_id THEN
    RETURN json_build_object(
      'success', false,
      'error', 'unauthorized',
      'message', 'You can only edit your own comments'
    );
  END IF;

  -- Actualizar el comentario
  UPDATE movie_comments
  SET
    content = p_content,
    updated_at = NOW()
  WHERE id = p_comment_id
  RETURNING * INTO v_updated_comment;

  RETURN json_build_object(
    'success', true,
    'message', 'Comment updated successfully',
    'comment', row_to_json(v_updated_comment)
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', 'database_error',
    'message', SQLERRM
  );
END;
$$;

-- =====================================================
-- NOTAS DE IMPLEMENTACIÓN:
-- =====================================================
-- 1. Los creadores NO pueden calificar sus propias películas
-- 2. Los creadores SÍ pueden comentar sus propias películas (para responder preguntas)
--    PERO esos comentarios NO suman al contador de comments_count ni al engagement_score
-- 3. Solo el autor de un comentario puede editarlo o eliminarlo
-- 4. Los ratings y comentarios de NO-creadores recalculan automáticamente el engagement_score
-- 5. Todas las funciones retornan JSON con información sobre éxito/error
-- 6. Al eliminar un comentario del creador, no se decrementa el contador (ya que nunca se incrementó)
