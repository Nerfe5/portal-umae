# TECH_STACK — Portal UMAE

---

## Frontend — `portal-umae-frontend`

| Capa              | Tecnología              | Versión recomendada | Justificación                                                                                                      |
|-------------------|-------------------------|---------------------|--------------------------------------------------------------------------------------------------------------------|
| Framework         | **Astro**               | 7.x (latest)        | Genera HTML estático por defecto — ideal para un portal informativo. Cero JS en el cliente salvo donde se necesite. |
| Estilos           | **Tailwind CSS**        | 4.x                 | Configuración CSS-first con `@theme` — paleta IMSS definida como custom properties. Integración vía `@tailwindcss/vite`. |
| Plugin Tailwind   | **@tailwindcss/vite**   | 4.x                 | Reemplaza `@astrojs/tailwind`. Integración directa como plugin de Vite, compatible con Astro 7.                     |
| Fuentes           | **Fontsource** (local)  | según paquete        | Fuentes servidas localmente para no depender de Google Fonts en redes hospitalarias con restricciones.              |
| Iconos            | **Astro Icon** + Heroicons | astro-icon 1.x   | SVG inline generados en build time, sin dependencia de CDN.                                                        |
| HTTP (fetch docs) | **Fetch API nativa**    | —                   | El único dato dinámico es la lista de documentos. No se necesita librería adicional.                               |
| Build             | Astro CLI (`astro build`)| —                  | Produce `dist/` con HTML/CSS/JS optimizados listos para Cloudflare Pages.                                          |
| Despliegue        | **Express static** (producción) | —           | Frontend compilado servido por el backend |
| Node (dev)        | **Node.js**             | 20 LTS              | Requerido por Astro para el build.                                                                                 |

### Variables de entorno (frontend)

```
PUBLIC_BACKEND_URL=http://localhost:3001  # Solo en desarrollo
```

---

## Backend — `portal-umae-backend`

| Capa               | Tecnología              | Versión recomendada | Justificación                                                                                                         |
|--------------------|-------------------------|---------------------|-----------------------------------------------------------------------------------------------------------------------|
| Runtime            | **Node.js**             | 20 LTS              | Estable, soporte hasta 2026. Compatible con el servidor hospitalario.                                                 |
| Framework HTTP     | **Express**             | 4.x                 | Minimalista, bien documentado, sin overhead. Suficiente para una API CRUD sencilla.                                   |
| Subida de archivos | **Multer**              | 1.x                 | Middleware estándar de Express para multipart/form-data. Soporte de filtros por extensión y límite de tamaño.         |
| Sesión admin       | **express-session**     | 1.x                 | Cookie de sesión server-side para el panel admin. Sin JWT, sin base de datos.                                         |
| CORS               | **cors**                | 2.x                 | Configuración declarativa de orígenes permitidos. Whitelist del dominio de Cloudflare Pages.                          |
| UUID               | **uuid**                | 9.x                 | Generación de IDs únicos para nombres de archivo en disco.                                                            |
| Validación         | **express-validator**   | 7.x                 | Validación de inputs en endpoints de API (tipo de archivo, nombre, departamento).                                     |
| Persistencia       | **JSON file** (nativo)  | —                   | `documentos.json` gestionado con `fs.promises`. Sin base de datos — requisito del brief.                              |
| Contenedor         | **Docker + Compose**    | Docker 24.x         | Aísla el backend del resto del servidor. Facilita arranque, parada y actualización sin tocar el sistema host.         |
| Despliegue         | **Docker Compose + Nginx** | Docker 24.x      | Nginx en puerto 80, Express en 3001 |
| Variables de entorno | **dotenv**            | 16.x                | Carga `.env` en desarrollo. En producción, se inyectan directamente en Docker Compose.                                |

### Variables de entorno (backend)

```
PORT=3001                          # Puerto del servidor Express
ADMIN_PASSWORD=contraseña_segura   # Contraseña única del panel admin
SESSION_SECRET=cadena_aleatoria    # Secreto para firmar cookies de sesión
FRONTEND_ORIGIN=http://localhost  # IP del servidor en producción
UPLOADS_DIR=./uploads              # Ruta de almacenamiento de archivos
```

---

## Herramientas de desarrollo

| Herramienta     | Versión  | Uso                                               |
|-----------------|----------|---------------------------------------------------|
| **npm**         | 10.x     | Gestor de paquetes incluido con Node.js (sin instalación extra) |
| **ESLint**      | 9.x      | Linting para JS/TS en backend y frontend          |
| **Prettier**    | 3.x      | Formateo consistente de código                    |
| **Git**         | 2.x      | Control de versiones                              |
| **Docker**      | 24.x     | Contenedorización del backend                     |
| **VS Code**     | latest   | Editor recomendado                                |

---

## Compatibilidad de navegadores objetivo

El portal debe funcionar en:

- Chrome / Edge 90+
- Firefox 90+
- Safari 14+
- Chrome para Android (versión actual)

No se requiere soporte para IE11 ni navegadores legacy.

---

## Resumen de dependencias por paquete

### `frontend/package.json`

```json
{
  "dependencies": {
    "astro": "^7.0.0",
    "@tailwindcss/vite": "^4.0.0",
    "tailwindcss": "^4.0.0",
    "astro-icon": "^1.0.0",
    "@iconify-json/heroicons": "^1.1.0",
    "@fontsource/inter": "^5.0.0"
  }
}
```

### `backend/package.json`

```json
{
  "dependencies": {
    "express": "^4.18.0",
    "multer": "^1.4.5",
    "cors": "^2.8.5",
    "express-session": "^1.17.3",
    "express-validator": "^7.0.0",
    "uuid": "^9.0.0",
    "dotenv": "^16.0.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.0"
  }
}
```
