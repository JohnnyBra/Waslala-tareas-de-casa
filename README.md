# SuperTareas Familiares

Una aplicación gamificada para la gestión de tareas del hogar, diseñada para familias.

## Requisitos Previos

- Ubuntu Server (o Desktop)
- Node.js (v18+)
- NPM
- Cuenta de Cloudflare (para el túnel)

## Instalación Desde Cero

### 1. Preparar el Entorno

Accede a tu servidor Ubuntu y actualiza los paquetes:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install nodejs npm -y
```

Verifica la instalación:
```bash
node -v
npm -v
```

### 2. Instalar el código

Crea un directorio para la app y copia los archivos generados:

```bash
mkdir super-tareas
cd super-tareas
# (Aquí debes colocar todos los archivos .tsx, .ts, .html, package.json etc.)
```

Inicializa el proyecto e instala dependencias:

```bash
npm init -y
npm install react react-dom lucide-react canvas-confetti express
npm install -D typescript @types/react @types/react-dom @types/node vite @vitejs/plugin-react autoprefixer postcss tailwindcss
```

### 3. Configurar Tailwind y Vite

Asegúrate de tener un archivo `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
```

### 4. Construir la Aplicación

Compila el código React para producción:

```bash
npx vite build
```

Esto creará una carpeta `dist/` con los archivos estáticos.

### 5. Ejecución Persistente con PM2

PM2 permite mantener la aplicación corriendo en segundo plano y reiniciar si hay fallos o reinicios del servidor.

Instala PM2 globalmente:
```bash
sudo npm install -g pm2
```

Ejecuta el servidor (asegúrate de que `server.js` esté en la raíz):

```bash
pm2 start server.js --name "super-tareas"
```

Guarda la configuración para que arranque al inicio del sistema:

```bash
pm2 save
pm2 startup
```

La app ahora está corriendo en `http://localhost:3010`.

### 6. Tunelado con Cloudflare (Cloudflared)

Para acceder desde fuera de casa de forma segura sin abrir puertos en el router.

1. Instala `cloudflared` en Ubuntu:
   ```bash
   curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
   sudo dpkg -i cloudflared.deb
   ```

2. Autentícate:
   ```bash
   cloudflared tunnel login
   ```

3. Crea un túnel:
   ```bash
   cloudflared tunnel create supertareas-tunnel
   ```

4. Configura el túnel para apuntar a tu puerto 3010. Crea/edita `~/.cloudflared/config.yml` (o configura vía Dashboard Zero Trust de Cloudflare):
   ```yaml
   ingress:
     - hostname: tareas.tudominio.com
       service: http://localhost:3010
     - service: http_status:404
   ```

5. Ejecuta el túnel:
   ```bash
   cloudflared tunnel run supertareas-tunnel
   ```

¡Listo! Ahora puedes acceder a la app desde cualquier móvil o tablet usando tu dominio.

## Usuarios por Defecto

**PIN Padres:** 1234
**PIN Niños:** 0000

- **Admin:** Papá, Mamá
- **Niños:** Miguel, Carmen, Pedro, Diego, Alegría
