# 🚀 INSTRUCCIONES DE DEPLOYMENT

## 📋 DESPUÉS DE CADA `vercel --prod`:

### 1. 🔧 ACTUALIZAR CONFIGURACIÓN CENTRALIZADA:
**Editar `config/deployment.js` con la nueva URL de Vercel**

### 2. 🚀 EJECUTAR SCRIPT DE ACTUALIZACIÓN:
```bash
node scripts/update-deployment.js
```

**Este script automáticamente:**
- ✅ Actualiza todos los archivos de configuración
- ✅ Actualiza variables de entorno en Vercel
- ✅ Muestra instrucciones para Strava

### 3. 🌐 ACTUALIZAR STRAVA:
**Usar los valores mostrados por el script:**
- **Website**: URL completa con https
- **Authorization Callback Domain**: Solo el dominio sin https

### 4. 💾 COMMIT Y PUSH:
```bash
git add .
git commit -m "Update deployment URLs"
git push
```

---

## 📁 ARCHIVOS DEL SISTEMA CENTRALIZADO:

- **`config/deployment.js`** - Configuración principal
- **`scripts/update-deployment.js`** - Script de actualización
- **`src/config/urls.ts`** - URLs del frontend
- **`api/config/urls.js`** - URLs del backend

---

## 🎯 VENTAJAS:

- **Un solo archivo para cambiar** después de cada deploy
- **Actualización automática** de todos los archivos
- **Consistencia garantizada** entre configuraciones
- **Fácil mantenimiento** y documentación
