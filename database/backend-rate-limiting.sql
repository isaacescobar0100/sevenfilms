-- ============================================
-- RATE LIMITING EN BACKEND (Supabase PostgreSQL)
-- ============================================
-- Este script implementa rate limiting a nivel de base de datos
-- para prevenir abuso incluso si el frontend es bypasseado.
--
-- INSTRUCCIONES:
-- 1. Ejecutar este script en el SQL Editor de Supabase
-- 2. Los límites se aplicarán automáticamente via triggers y RPC
-- ============================================

-- ============================================
-- 1. TABLA DE RATE LIMITS
-- ============================================
-- Almacena el historial de acciones por usuario

CREATE TABLE IF NOT EXISTS rate_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_action
    ON rate_limits(user_id, action_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_rate_limits_cleanup
    ON rate_limits(created_at);

-- RLS: Solo el usuario puede ver sus propios registros
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rate limits"
    ON rate_limits FOR SELECT
    USING (auth.uid() = user_id);

-- Solo el sistema puede insertar (via funciones)
CREATE POLICY "System can insert rate limits"
    ON rate_limits FOR INSERT
    WITH CHECK (auth.uid() = user_id);


-- ============================================
-- 2. CONFIGURACIÓN DE LÍMITES
-- ============================================
-- Tabla de configuración (solo lectura para usuarios)

CREATE TABLE IF NOT EXISTS rate_limit_config (
    action_type TEXT PRIMARY KEY,
    max_requests INTEGER NOT NULL,
    window_seconds INTEGER NOT NULL,
    description TEXT
);

-- Insertar configuración de límites
INSERT INTO rate_limit_config (action_type, max_requests, window_seconds, description) VALUES
    ('movie_upload', 10, 86400, '10 películas por día'),
    ('post_creation', 50, 86400, '50 posts por día'),
    ('message_send', 100, 86400, '100 mensajes por día'),
    ('search_request', 100, 3600, '100 búsquedas por hora'),
    ('profile_update', 5, 3600, '5 actualizaciones de perfil por hora'),
    ('like_action', 60, 60, '60 likes por minuto'),
    ('comment_action', 30, 60, '30 comentarios por minuto'),
    ('follow_action', 30, 60, '30 follows por minuto'),
    ('rating_action', 20, 60, '20 calificaciones por minuto')
ON CONFLICT (action_type) DO UPDATE SET
    max_requests = EXCLUDED.max_requests,
    window_seconds = EXCLUDED.window_seconds,
    description = EXCLUDED.description;

-- RLS: Todos pueden leer la configuración
ALTER TABLE rate_limit_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read rate limit config"
    ON rate_limit_config FOR SELECT
    USING (true);


-- ============================================
-- 3. FUNCIÓN: VERIFICAR RATE LIMIT
-- ============================================
-- Retorna TRUE si la acción está permitida, FALSE si excede el límite

CREATE OR REPLACE FUNCTION check_rate_limit(
    p_user_id UUID,
    p_action_type TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_config rate_limit_config%ROWTYPE;
    v_count INTEGER;
    v_window_start TIMESTAMPTZ;
BEGIN
    -- Obtener configuración del límite
    SELECT * INTO v_config
    FROM rate_limit_config
    WHERE action_type = p_action_type;

    -- Si no hay configuración, permitir la acción
    IF NOT FOUND THEN
        RETURN TRUE;
    END IF;

    -- Calcular inicio de la ventana de tiempo
    v_window_start := NOW() - (v_config.window_seconds || ' seconds')::INTERVAL;

    -- Contar acciones en la ventana
    SELECT COUNT(*) INTO v_count
    FROM rate_limits
    WHERE user_id = p_user_id
        AND action_type = p_action_type
        AND created_at > v_window_start;

    -- Verificar si excede el límite
    RETURN v_count < v_config.max_requests;
END;
$$;


-- ============================================
-- 4. FUNCIÓN: REGISTRAR ACCIÓN CON RATE LIMIT
-- ============================================
-- Verifica el límite y registra la acción si está permitida
-- Retorna JSON con el estado

CREATE OR REPLACE FUNCTION perform_rate_limited_action(
    p_action_type TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_config rate_limit_config%ROWTYPE;
    v_count INTEGER;
    v_window_start TIMESTAMPTZ;
    v_remaining INTEGER;
    v_reset_at TIMESTAMPTZ;
BEGIN
    -- Obtener usuario actual
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'allowed', FALSE,
            'error', 'Usuario no autenticado'
        );
    END IF;

    -- Obtener configuración
    SELECT * INTO v_config
    FROM rate_limit_config
    WHERE action_type = p_action_type;

    IF NOT FOUND THEN
        -- Sin configuración = sin límite
        RETURN jsonb_build_object(
            'allowed', TRUE,
            'remaining', -1,
            'message', 'Sin límite configurado'
        );
    END IF;

    -- Calcular ventana de tiempo
    v_window_start := NOW() - (v_config.window_seconds || ' seconds')::INTERVAL;

    -- Contar acciones actuales
    SELECT COUNT(*) INTO v_count
    FROM rate_limits
    WHERE user_id = v_user_id
        AND action_type = p_action_type
        AND created_at > v_window_start;

    -- Verificar límite
    IF v_count >= v_config.max_requests THEN
        -- Calcular tiempo hasta reset
        SELECT created_at + (v_config.window_seconds || ' seconds')::INTERVAL
        INTO v_reset_at
        FROM rate_limits
        WHERE user_id = v_user_id
            AND action_type = p_action_type
            AND created_at > v_window_start
        ORDER BY created_at ASC
        LIMIT 1;

        RETURN jsonb_build_object(
            'allowed', FALSE,
            'error', 'Límite de tasa excedido',
            'limit', v_config.max_requests,
            'remaining', 0,
            'reset_at', v_reset_at,
            'window_seconds', v_config.window_seconds
        );
    END IF;

    -- Registrar la acción
    INSERT INTO rate_limits (user_id, action_type)
    VALUES (v_user_id, p_action_type);

    -- Calcular restantes
    v_remaining := v_config.max_requests - v_count - 1;

    RETURN jsonb_build_object(
        'allowed', TRUE,
        'limit', v_config.max_requests,
        'remaining', v_remaining,
        'window_seconds', v_config.window_seconds
    );
END;
$$;


-- ============================================
-- 5. FUNCIÓN: OBTENER ESTADO DE RATE LIMIT
-- ============================================
-- Permite al frontend mostrar el estado actual sin consumir un intento

CREATE OR REPLACE FUNCTION get_rate_limit_status(
    p_action_type TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_config rate_limit_config%ROWTYPE;
    v_count INTEGER;
    v_window_start TIMESTAMPTZ;
    v_remaining INTEGER;
    v_reset_at TIMESTAMPTZ;
BEGIN
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('error', 'Usuario no autenticado');
    END IF;

    SELECT * INTO v_config
    FROM rate_limit_config
    WHERE action_type = p_action_type;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'limited', FALSE,
            'remaining', -1,
            'message', 'Sin límite configurado'
        );
    END IF;

    v_window_start := NOW() - (v_config.window_seconds || ' seconds')::INTERVAL;

    SELECT COUNT(*) INTO v_count
    FROM rate_limits
    WHERE user_id = v_user_id
        AND action_type = p_action_type
        AND created_at > v_window_start;

    v_remaining := GREATEST(0, v_config.max_requests - v_count);

    -- Obtener tiempo de reset si está limitado
    IF v_count >= v_config.max_requests THEN
        SELECT created_at + (v_config.window_seconds || ' seconds')::INTERVAL
        INTO v_reset_at
        FROM rate_limits
        WHERE user_id = v_user_id
            AND action_type = p_action_type
            AND created_at > v_window_start
        ORDER BY created_at ASC
        LIMIT 1;
    END IF;

    RETURN jsonb_build_object(
        'limited', v_count >= v_config.max_requests,
        'limit', v_config.max_requests,
        'remaining', v_remaining,
        'used', v_count,
        'window_seconds', v_config.window_seconds,
        'reset_at', v_reset_at
    );
END;
$$;


-- ============================================
-- 6. TRIGGERS PARA RATE LIMITING AUTOMÁTICO
-- ============================================

-- Trigger function para posts
CREATE OR REPLACE FUNCTION check_post_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_allowed BOOLEAN;
BEGIN
    SELECT check_rate_limit(NEW.user_id, 'post_creation') INTO v_allowed;

    IF NOT v_allowed THEN
        RAISE EXCEPTION 'Rate limit exceeded for post creation. Please wait before posting again.';
    END IF;

    -- Registrar la acción
    INSERT INTO rate_limits (user_id, action_type)
    VALUES (NEW.user_id, 'post_creation');

    RETURN NEW;
END;
$$;

-- Aplicar trigger a posts
DROP TRIGGER IF EXISTS trigger_post_rate_limit ON posts;
CREATE TRIGGER trigger_post_rate_limit
    BEFORE INSERT ON posts
    FOR EACH ROW
    EXECUTE FUNCTION check_post_rate_limit();


-- Trigger function para movies
CREATE OR REPLACE FUNCTION check_movie_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_allowed BOOLEAN;
BEGIN
    SELECT check_rate_limit(NEW.user_id, 'movie_upload') INTO v_allowed;

    IF NOT v_allowed THEN
        RAISE EXCEPTION 'Rate limit exceeded for movie upload. Maximum 10 movies per day.';
    END IF;

    INSERT INTO rate_limits (user_id, action_type)
    VALUES (NEW.user_id, 'movie_upload');

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_movie_rate_limit ON movies;
CREATE TRIGGER trigger_movie_rate_limit
    BEFORE INSERT ON movies
    FOR EACH ROW
    EXECUTE FUNCTION check_movie_rate_limit();


-- Trigger function para messages
CREATE OR REPLACE FUNCTION check_message_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_allowed BOOLEAN;
BEGIN
    SELECT check_rate_limit(NEW.sender_id, 'message_send') INTO v_allowed;

    IF NOT v_allowed THEN
        RAISE EXCEPTION 'Rate limit exceeded for messages. Maximum 100 messages per day.';
    END IF;

    INSERT INTO rate_limits (user_id, action_type)
    VALUES (NEW.sender_id, 'message_send');

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_message_rate_limit ON messages;
CREATE TRIGGER trigger_message_rate_limit
    BEFORE INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION check_message_rate_limit();


-- Trigger function para likes
CREATE OR REPLACE FUNCTION check_like_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_allowed BOOLEAN;
BEGIN
    SELECT check_rate_limit(NEW.user_id, 'like_action') INTO v_allowed;

    IF NOT v_allowed THEN
        RAISE EXCEPTION 'Rate limit exceeded for likes. Please slow down.';
    END IF;

    INSERT INTO rate_limits (user_id, action_type)
    VALUES (NEW.user_id, 'like_action');

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_like_rate_limit ON likes;
CREATE TRIGGER trigger_like_rate_limit
    BEFORE INSERT ON likes
    FOR EACH ROW
    EXECUTE FUNCTION check_like_rate_limit();


-- Trigger function para comments
CREATE OR REPLACE FUNCTION check_comment_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_allowed BOOLEAN;
BEGIN
    SELECT check_rate_limit(NEW.user_id, 'comment_action') INTO v_allowed;

    IF NOT v_allowed THEN
        RAISE EXCEPTION 'Rate limit exceeded for comments. Please slow down.';
    END IF;

    INSERT INTO rate_limits (user_id, action_type)
    VALUES (NEW.user_id, 'comment_action');

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_comment_rate_limit ON comments;
CREATE TRIGGER trigger_comment_rate_limit
    BEFORE INSERT ON comments
    FOR EACH ROW
    EXECUTE FUNCTION check_comment_rate_limit();


-- Trigger function para follows
CREATE OR REPLACE FUNCTION check_follow_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_allowed BOOLEAN;
BEGIN
    SELECT check_rate_limit(NEW.follower_id, 'follow_action') INTO v_allowed;

    IF NOT v_allowed THEN
        RAISE EXCEPTION 'Rate limit exceeded for follows. Please slow down.';
    END IF;

    INSERT INTO rate_limits (user_id, action_type)
    VALUES (NEW.follower_id, 'follow_action');

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_follow_rate_limit ON follows;
CREATE TRIGGER trigger_follow_rate_limit
    BEFORE INSERT ON follows
    FOR EACH ROW
    EXECUTE FUNCTION check_follow_rate_limit();


-- ============================================
-- 7. LIMPIEZA AUTOMÁTICA DE REGISTROS ANTIGUOS
-- ============================================
-- Función para limpiar registros de más de 7 días

CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_deleted INTEGER;
BEGIN
    DELETE FROM rate_limits
    WHERE created_at < NOW() - INTERVAL '7 days';

    GET DIAGNOSTICS v_deleted = ROW_COUNT;

    RETURN v_deleted;
END;
$$;

-- Crear extensión pg_cron si no existe (para limpieza automática)
-- NOTA: Esto requiere habilitar pg_cron en Supabase Dashboard > Database > Extensions
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Programar limpieza diaria a las 3 AM UTC
-- SELECT cron.schedule('cleanup-rate-limits', '0 3 * * *', 'SELECT cleanup_old_rate_limits()');


-- ============================================
-- 8. GRANTS (PERMISOS)
-- ============================================

-- Permitir a usuarios autenticados usar las funciones
GRANT EXECUTE ON FUNCTION check_rate_limit(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION perform_rate_limited_action(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_rate_limit_status(TEXT) TO authenticated;


-- ============================================
-- VERIFICACIÓN
-- ============================================
-- Ejecutar estas queries para verificar la instalación:

-- SELECT * FROM rate_limit_config;
-- SELECT get_rate_limit_status('post_creation');
-- SELECT perform_rate_limited_action('like_action');
