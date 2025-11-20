# CineAmateur

Plataforma web completa para cineastas aficionados que combina una red social con gestión y reproducción de películas. Construida con React, Vite, Tailwind CSS y Supabase.

## 🎬 Descripción

CineAmateur es una red social especializada para creadores de contenido audiovisual que permite:
- Subir y compartir películas con soporte para múltiples calidades (360p-1080p)
- Crear y compartir publicaciones con imágenes y videos
- Interactuar con otros cineastas mediante likes, comentarios y mensajes
- Descubrir contenido mediante búsqueda avanzada y trending topics
- Gestionar perfiles personalizados y seguir a otros usuarios
- Sistema de notificaciones en tiempo real

## Stack Tecnológico

### Frontend
- **React 18+** - Librería UI con hooks
- **Vite** - Build tool y dev server ultrarrápido
- **React Router v6** - Navegación SPA
- **Tailwind CSS** - Framework CSS utility-first

### Estado y Data Fetching
- **Zustand** - Estado global ligero (autenticación)
- **TanStack Query (React Query v5)** - Server state, cache, mutations e infinite queries

### Backend/Database
- **Supabase** - Backend as a Service completo:
  - PostgreSQL con Row Level Security (RLS)
  - Autenticación y autorización
  - Storage para archivos multimedia
  - Realtime subscriptions
  - Edge Functions

### Procesamiento de Video/Audio
- **FFmpeg.wasm** - Procesamiento de video en el navegador:
  - Generación de thumbnails
  - Múltiples calidades de video (360p, 480p, 720p, 1080p)
  - Extracción de metadata
- **Whisper.cpp (Web)** - Generación automática de subtítulos con IA

### Formularios y Validación
- **React Hook Form** - Manejo eficiente de formularios
- **Zod** - Validación de schemas TypeScript-first

### UI/Utilidades
- **Lucide React** - Iconos SVG modernos
- **date-fns** - Formateo y manipulación de fechas
- **react-i18next** - Internacionalización (español/inglés)

### Seguridad y Performance
- **Rate Limiting** - Protección contra abuso (frontend)
- **CORS** - Configuración segura de Storage
- **Lazy Loading** - Carga diferida de componentes
- **Image Optimization** - Optimización de imágenes

## Estructura del Proyecto

```
src/
├── components/
│   ├── auth/           # Componentes de autenticación (Login, Register)
│   ├── common/         # Componentes reutilizables (LoadingSpinner, ErrorMessage, etc.)
│   ├── layout/         # Layout components (Navbar, Footer)
│   ├── messages/       # Sistema de mensajería (ChatWindow, MessageList)
│   ├── movies/         # Componentes de películas (MovieCard, UploadMovieModal, MoviePlayer)
│   ├── notifications/  # Sistema de notificaciones (NotificationsList)
│   ├── profile/        # Componentes de perfil (ProfileHeader, EditProfile)
│   └── social/         # Red social (Post, CreatePost, UserCard, Comment)
├── hooks/              # Custom React hooks
│   ├── useAuth.js      # Autenticación
│   ├── useComments.js  # Comentarios
│   ├── useFFmpeg.js    # Procesamiento de video
│   ├── useFollows.js   # Sistema de seguir/dejar de seguir
│   ├── useLikes.js     # Sistema de likes
│   ├── useMessages.js  # Mensajes directos
│   ├── useMovies.js    # CRUD de películas
│   ├── useNotifications.js  # Notificaciones en tiempo real
│   ├── usePosts.js     # Publicaciones sociales
│   ├── useProfiles.js  # Perfiles de usuario
│   ├── useRateLimit.js # Rate limiting
│   ├── useRecentSearches.js  # Historial de búsquedas
│   └── useSubtitles.js # Generación de subtítulos
├── i18n/               # Configuración de internacionalización
│   └── locales/        # Archivos de traducción (es.json, en.json)
├── lib/                # Configuraciones de librerías
│   └── supabase.js     # Cliente de Supabase
├── pages/              # Páginas de la aplicación
│   ├── auth/           # Login, Register
│   ├── Feed.jsx        # Feed principal
│   ├── Messages.jsx    # Mensajes
│   ├── Movies.jsx      # Galería de películas
│   ├── Notifications.jsx  # Centro de notificaciones
│   ├── Profile.jsx     # Perfil de usuario
│   └── Search.jsx      # Búsqueda avanzada
├── store/              # Zustand stores
│   └── authStore.js    # Estado global de autenticación
├── utils/              # Utilidades
│   ├── formatters.js   # Formateadores de fecha, números, etc.
│   ├── genreMapper.js  # Mapeo de géneros cinematográficos
│   └── validators.js   # Validaciones personalizadas
├── App.jsx             # Componente principal con rutas
└── main.jsx            # Entry point
```

## Database

```
database/
├── supabase_social_network.sql          # Schema principal
├── add-movie-ratings-and-comments.sql   # Sistema de ratings
├── improve-movie-views-tracking.sql     # Tracking de vistas
└── validate-owner-ratings-comments.sql  # Validación de propietarios
```

## Documentación

```
docs/
├── SUPABASE_CORS_SETUP.md  # Guía de configuración CORS
└── SENTRY_SETUP.md         # Guía de configuración Sentry (monitoreo de errores)
```

## Configuración

### 1. Instalar Dependencias

```bash
npm install
```

### 2. Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
VITE_SUPABASE_URL=tu_supabase_url
VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key
```

### 3. Configurar Base de Datos Supabase

#### A. Ejecutar Migraciones SQL

En el SQL Editor de Supabase, ejecuta los scripts en este orden:

1. **Schema principal** (`database/supabase_social_network.sql`):
   - Crea tablas: profiles, posts, comments, likes, follows, movies, notifications, messages, conversations
   - Configura Row Level Security (RLS)
   - Crea funciones y triggers

2. **Sistema de ratings** (`database/add-movie-ratings-and-comments.sql`):
   - Agrega ratings y comentarios para películas
   - Políticas de seguridad

3. **Tracking de vistas** (`database/improve-movie-views-tracking.sql`):
   - Mejora el sistema de vistas de películas

4. **Validación de propietarios** (`database/validate-owner-ratings-comments.sql`):
   - Previene que los propietarios califiquen sus propias películas

#### B. Configurar Storage Buckets

Crea los siguientes buckets en Storage:

```
movies       - Archivos de video (público)
avatars      - Fotos de perfil (público)
posts-media  - Imágenes/videos de posts (público)
```

Consulta [docs/SUPABASE_CORS_SETUP.md](docs/SUPABASE_CORS_SETUP.md) para configurar CORS correctamente.

#### C. Configurar Autenticación

En Authentication > Providers:
- Habilitar Email/Password
- (Opcional) Configurar OAuth providers (Google, GitHub, etc.)

## Desarrollo

### Iniciar servidor de desarrollo

```bash
npm run dev
```

El servidor estará disponible en `http://localhost:5173/cineastas/`

### Build para producción

```bash
npm run build
```

Los archivos se generarán en la carpeta `dist/`

## Deploy en Hostinger

### 1. Build del proyecto

```bash
npm run build
```

### 2. Subir archivos

Sube el contenido de la carpeta `dist/` a `/public_html/cineastas/` en tu servidor Hostinger.

### 3. Configurar .htaccess

Crea un archivo `.htaccess` en `/public_html/cineastas/`:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /cineastas/
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /cineastas/index.html [L]
</IfModule>
```

## ✨ Características Implementadas

### 🎥 Gestión de Películas
- ✅ Subida de películas (hasta 500MB)
- ✅ Generación automática de thumbnails con FFmpeg
- ✅ Soporte para múltiples calidades (360p, 480p, 720p, 1080p)
- ✅ Reproductor de video personalizado con controles avanzados
- ✅ Generación automática de subtítulos con IA (Whisper)
- ✅ Sistema de ratings (1-5 estrellas)
- ✅ Comentarios en películas
- ✅ Tracking de vistas
- ✅ Validación: propietarios no pueden calificar sus propias películas

### 📱 Red Social
- ✅ Feed principal con posts de usuarios seguidos
- ✅ Explorar: descubre contenido de toda la plataforma
- ✅ Creación de posts con texto, imágenes o videos
- ✅ Sistema de likes y comentarios en posts
- ✅ Edición y eliminación de posts propios
- ✅ Hashtags funcionales
- ✅ Trending topics
- ✅ Usuarios sugeridos para seguir

### 👥 Perfiles y Seguimiento
- ✅ Perfiles personalizables (avatar, bio, ubicación, website)
- ✅ Sistema de seguir/dejar de seguir
- ✅ Contador de seguidores y seguidos
- ✅ Vista de películas del usuario
- ✅ Vista de posts del usuario
- ✅ Estadísticas de perfil

### 💬 Mensajería
- ✅ Mensajes directos entre usuarios
- ✅ Lista de conversaciones
- ✅ Indicador de mensajes no leídos
- ✅ Tiempo real con Supabase Realtime
- ✅ Marcado de mensajes como leídos

### 🔔 Notificaciones
- ✅ Notificaciones en tiempo real
- ✅ Tipos: likes, comentarios, nuevos seguidores, mensajes
- ✅ Contador de notificaciones no leídas
- ✅ Marcar como leídas individual o masivamente
- ✅ Limpieza automática de notificaciones antiguas (>30 días)
- ✅ Solo muestra notificaciones de los últimos 7 días

### 🔍 Búsqueda Avanzada
- ✅ Búsqueda de usuarios, posts y películas
- ✅ Tab "Todos" con vista combinada
- ✅ Búsqueda por hashtags
- ✅ Historial de búsquedas recientes
- ✅ Filtros por tipo de contenido

### 🌐 Internacionalización
- ✅ Soporte para Español e Inglés
- ✅ Cambio de idioma en tiempo real
- ✅ Traducción completa de la interfaz

### 🔒 Seguridad
- ✅ Autenticación con Supabase Auth
- ✅ Row Level Security (RLS) en todas las tablas
- ✅ Rutas protegidas
- ✅ Validación de formularios con Zod
- ✅ Rate limiting en el frontend:
  - 10 películas/día
  - 50 posts/día
  - 100 mensajes/día
  - 100 búsquedas/hora
  - 30 likes/minuto
  - 20 comentarios/minuto
  - 20 follows/minuto

### 🎨 UI/UX
- ✅ Diseño responsive (móvil, tablet, desktop)
- ✅ Navegación intuitiva con tabs
- ✅ Infinite scroll en feeds
- ✅ Loading states y skeletons
- ✅ Manejo de errores robusto
- ✅ Confirmaciones para acciones destructivas

## 🚧 Próximas Características

### Alta Prioridad
- [ ] Tests unitarios y de integración
- [ ] Modo oscuro
- [ ] PWA (Progressive Web App)
- [ ] Optimización de SEO

### Media Prioridad
- [ ] Compartir posts/películas en redes sociales
- [ ] Reportar contenido inapropiado
- [ ] Sistema de moderación
- [ ] Analytics y dashboard de administrador

### Baja Prioridad
- [ ] Stories temporales (24h)
- [ ] Live streaming
- [ ] Salas de chat grupales
- [ ] Sistema de badges/logros

## 🏗️ Arquitectura

### Patrón de Diseño

El proyecto sigue una arquitectura basada en:

1. **Separación de Concerns**:
   - `components/`: UI pura, presentacional
   - `hooks/`: Lógica de negocio y data fetching
   - `pages/`: Composición de componentes
   - `utils/`: Funciones auxiliares

2. **Estado Global**:
   - Zustand para estado de autenticación (ligero, simple)
   - React Query para server state (cache automático, sincronización)
   - Local state con useState para UI efímero

3. **Data Fetching**:
   - Custom hooks con React Query
   - Optimistic updates para mejor UX
   - Infinite queries para feeds paginados
   - Realtime subscriptions con Supabase

4. **Seguridad**:
   - Row Level Security en PostgreSQL
   - Validación en frontend (Zod) y backend (PostgreSQL constraints)
   - Rate limiting para prevenir abuso

### Flujo de Datos

```
Usuario → Componente → Hook → Supabase → PostgreSQL
                ↓
          React Query Cache
                ↓
          Re-render automático
```

### Performance

- **Code Splitting**: Lazy loading de componentes pesados
- **Image Optimization**: Compresión y lazy loading de imágenes
- **Infinite Scroll**: Carga bajo demanda
- **Memoization**: React.memo en componentes costosos
- **Debouncing**: En búsquedas y acciones frecuentes

## 🤝 Contribuir

### Guía de Contribución

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Estilo de Código

- **JavaScript**: Seguir Airbnb Style Guide
- **Componentes**: Funcionales con hooks
- **Nombres**: camelCase para variables, PascalCase para componentes
- **Imports**: Agrupar por categoría (React, external, internal)

### Commits

Seguir Conventional Commits:
- `feat:` Nueva característica
- `fix:` Corrección de bug
- `docs:` Documentación
- `style:` Formato, punto y coma faltante, etc.
- `refactor:` Refactorización de código
- `test:` Agregar tests
- `chore:` Mantenimiento

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👨‍💻 Autor

Desarrollado con ❤️ para la comunidad de cineastas aficionados.

## 🙏 Agradecimientos

- [Supabase](https://supabase.com/) - Backend as a Service
- [FFmpeg.wasm](https://ffmpegwasm.netlify.app/) - Procesamiento de video
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS
- [React Query](https://tanstack.com/query) - Data fetching
- [Lucide Icons](https://lucide.dev/) - Iconos

---

**Estado del Proyecto**: 🟢 Producción (100% completo, desplegado en Vercel)
