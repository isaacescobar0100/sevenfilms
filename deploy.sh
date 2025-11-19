#!/bin/bash

# Script de deployment para CineAmateur en Hostinger
# Uso: ./deploy.sh

echo "🎬 CineAmateur - Deployment Script"
echo "=================================="

# 1. Verificar que existan las variables de entorno
if [ ! -f .env ]; then
    echo "❌ Error: No se encontró el archivo .env"
    echo "Por favor crea un archivo .env con tus credenciales de Supabase"
    exit 1
fi

echo "✅ Variables de entorno encontradas"

# 2. Instalar dependencias
echo ""
echo "📦 Instalando dependencias..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Error al instalar dependencias"
    exit 1
fi

echo "✅ Dependencias instaladas"

# 3. Ejecutar build
echo ""
echo "🔨 Construyendo proyecto..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Error en el build"
    exit 1
fi

echo "✅ Build completado exitosamente"

# 4. Verificar que existe la carpeta dist
if [ ! -d "dist" ]; then
    echo "❌ Error: No se generó la carpeta dist"
    exit 1
fi

echo ""
echo "✅ Archivos listos para deployment en la carpeta 'dist/'"
echo ""
echo "📋 Próximos pasos:"
echo "1. Sube todo el contenido de la carpeta 'dist/' a '/public_html/cineastas/' en Hostinger"
echo "2. Asegúrate de que el archivo .htaccess esté presente"
echo "3. Visita tu sitio en: https://tu-dominio.com/cineastas/"
echo ""
echo "📄 Para más detalles, consulta DEPLOYMENT.md"
echo ""
echo "🎉 Deployment preparado exitosamente!"
