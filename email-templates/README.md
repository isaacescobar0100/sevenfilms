# Templates de Email para Supabase

Este directorio contiene los templates HTML profesionales para los emails de autenticación de CineAmateur.

## 📧 Templates incluidos

1. **confirm-signup.html** - Email de confirmación de registro
2. **invite.html** - Email de invitación a la plataforma
3. **reset-password.html** - Email de restablecimiento de contraseña

## 🎨 Características del diseño

- ✨ Diseño moderno y profesional
- 📱 Responsive (se adapta a móviles)
- 🎨 Gradiente morado/azul acorde a la marca
- 🔒 Mensajes de seguridad claros
- ♿ Accesible y compatible con lectores de pantalla
- 📊 Compatible con todos los clientes de email principales

## 🚀 Cómo configurar en Supabase

### Paso 1: Acceder a la configuración de Email Templates

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Click en **Authentication** en el menú lateral
3. Click en **Email Templates**

### Paso 2: Configurar cada template

Para cada tipo de email (Confirm signup, Invite user, Reset password):

1. Selecciona el template en la lista
2. Abre el archivo HTML correspondiente de este directorio
3. Copia todo el contenido del archivo
4. Pega el contenido en el editor de Supabase
5. Click en **Save**

### Paso 3: Configurar el remitente

En **Settings** > **Email**:

- **Sender Name**: CineAmateur
- **Sender Email**: noreply@tudominio.com (o el que tengas configurado)

## 🔧 Personalización

Si quieres personalizar los templates:

### Cambiar colores

Los colores principales están en los gradientes:

```html
<!-- Gradiente principal (morado/azul) -->
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

<!-- Para cambiar el color, modifica los códigos hex -->
background: linear-gradient(135deg, #TU_COLOR_1 0%, #TU_COLOR_2 100%);
```

### Cambiar el logo/emoji

Busca el emoji 🎬 y reemplázalo por:
- Tu logo en formato imagen: `<img src="URL_DE_TU_LOGO" alt="Logo" style="height: 40px;">`
- Otro emoji de tu preferencia

### Cambiar textos

Todos los textos están en español. Puedes modificarlos directamente en el HTML.

## 📋 Variables disponibles de Supabase

Estas variables se reemplazan automáticamente:

- `{{ .ConfirmationURL }}` - URL de confirmación/acción
- `{{ .SiteURL }}` - URL de tu sitio web
- `{{ .Email }}` - Email del usuario
- `{{ .Token }}` - Token de confirmación

## ⚠️ Importante

- **No elimines** las variables `{{ }}` - son necesarias para que funcionen
- **Prueba** los emails antes de ponerlos en producción
- **Mantén** un enlace de texto alternativo al botón para accesibilidad

## 🧪 Testing

Para probar los templates:

1. Crea una cuenta de prueba en tu aplicación
2. Verifica que el email llegue correctamente
3. Revisa que el diseño se vea bien en diferentes clientes de email
4. Prueba que los enlaces funcionen

## 💡 Tips

- Los emails HTML deben usar **tablas** para layout (no CSS Grid/Flexbox moderno)
- Usa **estilos inline** para máxima compatibilidad
- Mantén el ancho máximo en **600px** para óptima lectura
- Incluye siempre un enlace de texto como alternativa al botón

## 📱 Vista previa en dispositivos

Los templates están optimizados para:
- 📧 Gmail (web y móvil)
- 📧 Outlook (web y desktop)
- 📧 Apple Mail (iOS y macOS)
- 📧 Otros clientes modernos

## 🆘 Soporte

Si tienes problemas configurando los templates:
1. Revisa la [documentación de Supabase](https://supabase.com/docs/guides/auth/auth-email-templates)
2. Verifica que hayas copiado todo el HTML correctamente
3. Asegúrate de que las variables `{{ }}` estén presentes

---

Creado para **CineAmateur** - La plataforma para cineastas aficionados 🎬
