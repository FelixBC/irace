#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Importar la configuración centralizada
const DEPLOYMENT_CONFIG = require('../config/deployment.js');

console.log('🚀 Actualizando configuración de deployment...\n');

// Función para actualizar archivos de configuración
function updateConfigFiles() {
  console.log('📝 Actualizando archivos de configuración...');
  
  // 1. Actualizar src/config/urls.ts
  const frontendConfigPath = path.join(__dirname, '../src/config/urls.ts');
  let frontendContent = fs.readFileSync(frontendConfigPath, 'utf8');
  
  frontendContent = frontendContent.replace(
    /MAIN_APP: 'https:\/\/project-[^']+\.vercel\.app'/g,
    `MAIN_APP: '${DEPLOYMENT_CONFIG.PRODUCTION_URLS.MAIN_APP}'`
  );
  
  frontendContent = frontendContent.replace(
    /STRAVA_CALLBACK: 'https:\/\/project-[^']+\.vercel\.app\/api\/auth\/strava\/callback'/g,
    `STRAVA_CALLBACK: '${DEPLOYMENT_CONFIG.PRODUCTION_URLS.STRAVA_CALLBACK}'`
  );
  
  frontendContent = frontendContent.replace(
    /API_BASE: 'https:\/\/project-[^']+\.vercel\.app\/api'/g,
    `API_BASE: '${DEPLOYMENT_CONFIG.PRODUCTION_URLS.API_BASE}'`
  );
  
  frontendContent = frontendContent.replace(
    /FRONTEND: 'https:\/\/project-[^']+\.vercel\.app'/g,
    `FRONTEND: '${DEPLOYMENT_CONFIG.PRODUCTION_URLS.FRONTEND}'`
  );
  
  fs.writeFileSync(frontendConfigPath, frontendContent);
  console.log('✅ src/config/urls.ts actualizado');
  
  // 2. Actualizar api/config/urls.js
  const backendConfigPath = path.join(__dirname, '../api/config/urls.js');
  let backendContent = fs.readFileSync(backendConfigPath, 'utf8');
  
  backendContent = backendContent.replace(
    /MAIN_APP: 'https:\/\/project-[^']+\.vercel\.app'/g,
    `MAIN_APP: '${DEPLOYMENT_CONFIG.PRODUCTION_URLS.MAIN_APP}'`
  );
  
  backendContent = backendContent.replace(
    /STRAVA_CALLBACK: 'https:\/\/project-[^']+\.vercel\.app\/api\/auth\/strava\/callback'/g,
    `STRAVA_CALLBACK: '${DEPLOYMENT_CONFIG.PRODUCTION_URLS.STRAVA_CALLBACK}'`
  );
  
  backendContent = backendContent.replace(
    /API_BASE: 'https:\/\/project-[^']+\.vercel\.app\/api'/g,
    `API_BASE: '${DEPLOYMENT_CONFIG.PRODUCTION_URLS.API_BASE}'`
  );
  
  backendContent = backendContent.replace(
    /FRONTEND: 'https:\/\/project-[^']+\.vercel\.app'/g,
    `FRONTEND: '${DEPLOYMENT_CONFIG.PRODUCTION_URLS.FRONTEND}'`
  );
  
  fs.writeFileSync(backendConfigPath, backendContent);
  console.log('✅ api/config/urls.js actualizado');
}

// Función para actualizar variables de entorno en Vercel
function updateVercelEnvVars() {
  console.log('\n🔧 Actualizando variables de entorno en Vercel...');
  
  try {
    // Actualizar NEXTAUTH_URL
    execSync(`vercel env add NEXTAUTH_URL production ${DEPLOYMENT_CONFIG.ENVIRONMENT_VARIABLES.NEXTAUTH_URL}`, { stdio: 'inherit' });
    console.log('✅ NEXTAUTH_URL actualizado');
  } catch (error) {
    console.log('⚠️  NEXTAUTH_URL ya existe, saltando...');
  }
}

// Función para mostrar instrucciones de Strava
function showStravaInstructions() {
  console.log('\n🌐 INSTRUCCIONES PARA STRAVA:');
  console.log('Actualiza en tu aplicación de Strava:');
  console.log(`📱 Website: ${DEPLOYMENT_CONFIG.STRAVA_CONFIG.WEBSITE}`);
  console.log(`🔗 Authorization Callback Domain: ${DEPLOYMENT_CONFIG.STRAVA_CONFIG.AUTHORIZATION_CALLBACK_DOMAIN}`);
}

// Función principal
function main() {
  try {
    updateConfigFiles();
    updateVercelEnvVars();
    showStravaInstructions();
    
    console.log('\n🎉 ¡Configuración actualizada exitosamente!');
    console.log('💡 Recuerda hacer commit y push de los cambios');
    
  } catch (error) {
    console.error('❌ Error durante la actualización:', error.message);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main();
}

module.exports = { updateConfigFiles, updateVercelEnvVars, showStravaInstructions };
