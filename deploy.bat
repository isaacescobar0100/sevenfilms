@echo off
REM Script de deployment para CineAmateur en Hostinger (Windows)
REM Uso: deploy.bat

echo 🎬 CineAmateur - Deployment Script
echo ==================================

REM 1. Verificar que existan las variables de entorno
if not exist .env (
    echo ❌ Error: No se encontró el archivo .env
    echo Por favor crea un archivo .env con tus credenciales de Supabase
    exit /b 1
)

echo ✅ Variables de entorno encontradas

REM 2. Instalar dependencias
echo.
echo 📦 Instalando dependencias...
call npm install

if %errorlevel% neq 0 (
    echo ❌ Error al instalar dependencias
    exit /b 1
)

echo ✅ Dependencias instaladas

REM 3. Ejecutar build
echo.
echo 🔨 Construyendo proyecto...
call npm run build

if %errorlevel% neq 0 (
    echo ❌ Error en el build
    exit /b 1
)

echo ✅ Build completado exitosamente

REM 4. Verificar que existe la carpeta dist
if not exist dist (
    echo ❌ Error: No se generó la carpeta dist
    exit /b 1
)

echo.
echo ✅ Archivos listos para deployment en la carpeta 'dist/'
echo.
echo 📋 Próximos pasos:
echo 1. Sube todo el contenido de la carpeta 'dist/' a '/public_html/cineastas/' en Hostinger
echo 2. Asegúrate de que el archivo .htaccess esté presente
echo 3. Visita tu sitio en: https://tu-dominio.com/cineastas/
echo.
echo 📄 Para más detalles, consulta DEPLOYMENT.md
echo.
echo 🎉 Deployment preparado exitosamente!

pause
