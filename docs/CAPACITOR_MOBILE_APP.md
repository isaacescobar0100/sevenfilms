# 📱 Guía Completa: Convertir Seven a App Móvil con Capacitor

## 🎯 Resumen

Seven Cineamateur ahora está configurado como una aplicación móvil usando Capacitor. Puedes:
- Generar APK para Android
- Instalar directamente en tu celular
- Publicar en Google Play Store
- (Futuro) Publicar en Apple App Store

---

## 📦 Plugins Nativos Instalados

Tu app tiene acceso a las siguientes funciones nativas:

### 1. **Camera** (@capacitor/camera)
- Tomar fotos con la cámara
- Seleccionar imágenes de la galería
- Ideal para subir películas y thumbnails

### 2. **Push Notifications** (@capacitor/push-notifications)
- Notificaciones push nativas
- Avisos cuando alguien comenta, da like, etc.

### 3. **Share** (@capacitor/share)
- Compartir películas a WhatsApp, Instagram, etc.
- Compartir perfiles de usuario

### 4. **Splash Screen** (@capacitor/splash-screen)
- Pantalla de carga al abrir la app
- Configurada con los colores de tu marca

### 5. **App** (@capacitor/app)
- Control del estado de la app
- Deep links

### 6. **Haptics** (@capacitor/haptics)
- Vibraciones táctiles
- Feedback al hacer click

### 7. **Keyboard** (@capacitor/keyboard)
- Control del teclado virtual

### 8. **Status Bar** (@capacitor/status-bar)
- Personalizar la barra de estado

---

## 🚀 Comandos Disponibles

### Desarrollo

```bash
# Desarrollo web normal
npm run dev

# Build + Sync + Abrir Android Studio
npm run android

# Solo sincronizar cambios a Android
npm run android:sync

# Solo abrir Android Studio
npm run android:open

# Correr en dispositivo/emulador conectado
npm run android:run
```

---

## 📲 Cómo Generar un APK

### Opción 1: APK de Desarrollo (Rápido)

1. **Build de la web:**
   ```bash
   npm run build
   ```

2. **Sincronizar con Android:**
   ```bash
   npx cap sync android
   ```

3. **Abrir Android Studio:**
   ```bash
   npx cap open android
   ```

4. **En Android Studio:**
   - Click en **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
   - Espera a que compile
   - Click en **locate** cuando termine
   - El APK estará en: `android/app/build/outputs/apk/debug/app-debug.apk`

5. **Instalar en tu celular:**
   - Conecta tu celular por USB (activa Depuración USB en Opciones de Desarrollador)
   - O envía el APK por WhatsApp/Email y ábrelo en el celular
   - Permite instalación de fuentes desconocidas si te lo pide

### Opción 2: APK Firmado para Play Store

#### Paso 1: Generar Keystore (Solo una vez)

```bash
# En la carpeta android/app
cd android/app
keytool -genkey -v -keystore seven-release-key.keystore -alias seven -keyalg RSA -keysize 2048 -validity 10000
```

Te preguntará:
- **Password**: Elige una contraseña segura (¡GUÁRDALA!)
- **Nombre y apellido**: Tu nombre o nombre de la empresa
- **Organización**: Cineamateur
- **Ciudad, Estado, País**: Tus datos

**⚠️ IMPORTANTE:** Guarda el archivo `seven-release-key.keystore` y la contraseña en un lugar seguro. Si los pierdes, no podrás actualizar la app en Play Store nunca más.

#### Paso 2: Configurar Gradle

Crea el archivo `android/key.properties`:

```properties
storePassword=TU_CONTRASEÑA_DEL_KEYSTORE
keyPassword=TU_CONTRASEÑA_DEL_KEYSTORE
keyAlias=seven
storeFile=seven-release-key.keystore
```

#### Paso 3: Modificar build.gradle

Edita `android/app/build.gradle`, busca la sección `android` y agrega antes de `buildTypes`:

```gradle
// Cargar keystore
def keystorePropertiesFile = rootProject.file("key.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    ...

    signingConfigs {
        release {
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
            storeFile file(keystoreProperties['storeFile'])
            storePassword keystoreProperties['storePassword']
        }
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

#### Paso 4: Generar APK de Release

```bash
cd android
./gradlew assembleRelease
```

El APK firmado estará en:
`android/app/build/outputs/apk/release/app-release.apk`

---

## 🏪 Publicar en Google Play Store

### Requisitos Previos

1. **Cuenta de Google Play Console** ($25 USD pago único)
   - Visita: https://play.google.com/console
   - Crea tu cuenta de desarrollador

2. **Preparar Assets:**
   - **Icono de App**: 512x512px PNG (sin transparencia)
   - **Feature Graphic**: 1024x500px PNG
   - **Screenshots**: Mínimo 2 (celular), tamaños:
     - 16:9 aspect ratio
     - 1080x1920px o similar
   - **Descripción corta**: Máx. 80 caracteres
   - **Descripción larga**: Máx. 4000 caracteres
   - **Política de privacidad**: URL pública

### Paso 1: Generar AAB (Android App Bundle)

Google Play Store requiere AAB, no APK:

```bash
cd android
./gradlew bundleRelease
```

El AAB estará en:
`android/app/build/outputs/bundle/release/app-release.aab`

### Paso 2: Crear App en Play Console

1. Ir a Google Play Console
2. Click en **Crear app**
3. Llenar datos:
   - Nombre: **Seven Cineamateur**
   - Idioma: **Español**
   - Tipo: **App**
   - Gratis/Pago: **Gratis**
4. Aceptar políticas

### Paso 3: Completar Información

Deberás llenar varias secciones:

#### Detalles de la App
- Descripción corta y larga
- Categoría: **Entretenimiento** o **Social**
- Email de contacto
- Política de privacidad (URL)

#### Gráficos
- Icono de la app
- Feature graphic
- Screenshots de celular

#### Clasificación de Contenido
- Completar cuestionario (tu app es para mayores de 13+)

#### Países
- Seleccionar países donde estará disponible

### Paso 4: Subir AAB

1. En Play Console, ir a **Producción** → **Crear versión**
2. Subir el archivo `app-release.aab`
3. Completar notas de la versión (qué hay de nuevo)
4. Guardar y revisar

### Paso 5: Enviar para Revisión

1. Revisar toda la información
2. Click en **Enviar para revisión**
3. Google revisará tu app (puede tardar 1-7 días)
4. Recibirás email cuando esté aprobada

---

## 📝 Cambiar Icono de la App

### Opción Fácil: Usar herramienta online

1. Crea un icono cuadrado 1024x1024px
2. Usa: https://icon.kitchen/
3. Sube tu icono
4. Descarga el paquete
5. Reemplaza los iconos en `android/app/src/main/res/mipmap-*`

### Opción Manual:

Necesitas estos tamaños en cada carpeta `mipmap`:

```
mipmap-mdpi/    → 48x48px
mipmap-hdpi/    → 72x72px
mipmap-xhdpi/   → 96x96px
mipmap-xxhdpi/  → 144x144px
mipmap-xxxhdpi/ → 192x192px
```

---

## 🎨 Personalizar Splash Screen

Edita `android/app/src/main/res/values/styles.xml`:

```xml
<style name="AppTheme.NoActionBarLaunch" parent="AppTheme.NoActionBar">
    <item name="android:background">@drawable/splash</item>
</style>
```

Crea tu splash en `android/app/src/main/res/drawable/splash.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
    <item android:drawable="@color/splash_background"/>
    <item>
        <bitmap
            android:gravity="center"
            android:src="@mipmap/ic_launcher"/>
    </item>
</layer-list>
```

---

## 🔧 Solución de Problemas Comunes

### Error: "Unable to locate adb"

Instala Android Studio y configura ANDROID_HOME:

```bash
# Windows
setx ANDROID_HOME "C:\Users\TU_USUARIO\AppData\Local\Android\Sdk"
setx PATH "%PATH%;%ANDROID_HOME%\platform-tools"
```

### Error: "Cleartext traffic not permitted"

Ya está configurado en `capacitor.config.ts`:
```typescript
android: {
  allowMixedContent: true
}
```

### La app no carga contenido de internet

Verifica permisos en `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

### Videos no se reproducen

Agrega en `AndroidManifest.xml`:
```xml
<application
    android:usesCleartextTraffic="true"
    android:networkSecurityConfig="@xml/network_security_config">
```

---

## 📚 Usar Plugins Nativos en tu Código

### Ejemplo: Usar la Cámara

```javascript
import { Camera, CameraResultType } from '@capacitor/camera'

const takePicture = async () => {
  const image = await Camera.getPhoto({
    quality: 90,
    allowEditing: true,
    resultType: CameraResultType.Uri
  })

  // image.webPath contendrá la URL de la foto
  const imageUrl = image.webPath
  // Usar para subir a Supabase
}
```

### Ejemplo: Compartir Contenido

```javascript
import { Share } from '@capacitor/share'

const shareMovie = async (movieTitle, movieUrl) => {
  await Share.share({
    title: movieTitle,
    text: `Mira esta película en Seven: ${movieTitle}`,
    url: movieUrl,
    dialogTitle: 'Compartir película'
  })
}
```

### Ejemplo: Push Notifications

```javascript
import { PushNotifications } from '@capacitor/push-notifications'

const initPushNotifications = async () => {
  // Pedir permisos
  const permission = await PushNotifications.requestPermissions()

  if (permission.receive === 'granted') {
    // Registrar para notificaciones
    await PushNotifications.register()
  }

  // Escuchar cuando llegan notificaciones
  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.log('Push recibido:', notification)
  })

  // Escuchar cuando se hace tap en la notificación
  PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
    console.log('Push action performed:', notification)
  })
}
```

---

## 🔄 Workflow de Desarrollo

### Desarrollo Normal (Web)

```bash
npm run dev
# Trabaja en http://localhost:5173 como siempre
```

### Probar en Android

```bash
# 1. Build
npm run build

# 2. Sync
npx cap sync android

# 3. Run en emulador/dispositivo
npx cap run android
```

### Actualizar App en Producción

```bash
# 1. Build
npm run build

# 2. Sync
npx cap sync android

# 3. Abrir Android Studio
npx cap open android

# 4. En Android Studio:
# Build → Generate Signed Bundle / APK → Android App Bundle
# Subir el nuevo AAB a Play Console
```

---

## 📱 Testing en Dispositivos

### Opción 1: Emulador de Android Studio

1. Abrir Android Studio
2. Tools → Device Manager
3. Create Virtual Device
4. Seleccionar dispositivo (ej: Pixel 6)
5. Descargar imagen del sistema (Android 13+)
6. Finish
7. Play para iniciar emulador

### Opción 2: Tu Celular Real

1. **Habilitar Modo Desarrollador:**
   - Configuración → Acerca del teléfono
   - Tap 7 veces en "Número de compilación"

2. **Habilitar Depuración USB:**
   - Configuración → Sistema → Opciones de desarrollador
   - Activar "Depuración USB"

3. **Conectar y Correr:**
   ```bash
   npx cap run android
   ```

---

## 🎯 Próximos Pasos Recomendados

### Corto Plazo (Esta semana)

1. ✅ Capacitor configurado
2. ⏳ Generar icono personalizado
3. ⏳ Crear splash screen
4. ⏳ Probar en emulador/celular
5. ⏳ Generar APK de prueba

### Mediano Plazo (Este mes)

1. ⏳ Integrar plugins nativos (Camera, Share)
2. ⏳ Configurar notificaciones push
3. ⏳ Testing exhaustivo
4. ⏳ Crear cuenta de Google Play Console
5. ⏳ Preparar assets (screenshots, descripciones)

### Largo Plazo (Próximos meses)

1. ⏳ Publicar en Play Store
2. ⏳ Recopilar feedback de usuarios
3. ⏳ Agregar funciones específicas de móvil
4. ⏳ Optimizar rendimiento
5. ⏳ Versión iOS (App Store)

---

## 💡 Tips y Mejores Prácticas

### Performance

- El build de producción comprime y optimiza automáticamente
- Capacitor cachea assets para carga más rápida
- Videos se cargan bajo demanda (no afectan tiempo de inicio)

### Seguridad

- Nunca subas `key.properties` o `.keystore` a GitHub
- Agrega al `.gitignore`:
  ```
  android/key.properties
  android/app/*.keystore
  ```

### Versionado

Actualiza versión en `android/app/build.gradle`:

```gradle
android {
    defaultConfig {
        versionCode 2      // Incrementar con cada release
        versionName "1.1"  // Versión visible para usuarios
    }
}
```

### Deep Links

Para abrir la app desde links (ej: `seven://movie/123`):

Edita `android/app/src/main/AndroidManifest.xml`:

```xml
<intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="seven" />
</intent-filter>
```

---

## 📞 Soporte

### Documentación Oficial
- Capacitor: https://capacitorjs.com/docs
- Android Studio: https://developer.android.com/studio
- Google Play Console: https://support.google.com/googleplay/android-developer

### Problemas Comunes
- Stack Overflow: Buscar "Capacitor [tu problema]"
- GitHub Issues: https://github.com/ionic-team/capacitor/issues

---

## ✅ Checklist Final antes de Publicar

- [ ] App corre sin errores en emulador
- [ ] App corre sin errores en dispositivo real
- [ ] Todos los videos se reproducen correctamente
- [ ] Subida de películas funciona
- [ ] Login/Registro funciona
- [ ] Notificaciones funcionan (si las implementaste)
- [ ] Icono personalizado configurado
- [ ] Splash screen personalizado
- [ ] Versión incrementada en build.gradle
- [ ] AAB generado y firmado
- [ ] Screenshots tomados
- [ ] Descripción de la app escrita
- [ ] Política de privacidad publicada
- [ ] Cuenta de Play Console creada
- [ ] Cuestionario de contenido completado

---

¡Tu app móvil está lista! 🎉
