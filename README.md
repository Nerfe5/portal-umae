# Portal UMAE

Portal institucional del UMAE Hospital de Especialidades IMSS Puebla.

## Arquitectura — Servidor Linux (Ubuntu 24.04 LTS)

```
│
├── Docker Compose
│   ├── nginx (puerto 80) — proxy reverso
│   └── backend Express (puerto 3001)
│       ├── /api/documentos — API REST
│       ├── /admin          — panel de administración
│       ├── /uploads        — archivos estáticos
│       └── /               — frontend Astro compilado
│
├── Volúmenes persistentes
│   ├── backend/uploads/        — documentos subidos
│   └── backend/documentos.json — metadatos
│
└── Red local del hospital (acceso por IP o hostname)
```

## Estructura del repositorio

```
portal-umae/
├── frontend/          # Astro 7 + Tailwind 4 — portal público
├── backend/           # Express — API REST + panel admin
├── nginx/             # Configuración del proxy reverso
│   └── nginx.conf
└── docker-compose.yml # Orquestación completa
```

## Desarrollo local

### Requisitos

- Node.js 20 LTS
- npm 10.x

### Backend

```bash
cd backend
cp .env.example .env   # editar ADMIN_PASSWORD y SESSION_SECRET
npm install
npm run dev            # http://localhost:3001
```

### Frontend

```bash
cd frontend
cp .env.example .env   # PUBLIC_BACKEND_URL=http://localhost:3001
npm install
npm run dev            # http://localhost:4321
```

## Producción — despliegue en servidor

### Prerrequisitos en el servidor

- Ubuntu 24.04 LTS
- Docker Engine 24.x
- Docker Compose v2

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/Nerfe5/portal-umae.git
cd portal-umae

# 2. Configurar variables de entorno
cp backend/.env.example backend/.env
nano backend/.env   # editar ADMIN_PASSWORD y SESSION_SECRET

# 3. Levantar con Docker Compose
docker compose up -d --build

# 4. Verificar que todo está en línea
curl http://localhost/health
```

### Comandos útiles

```bash
# Ver logs en tiempo real
docker compose logs -f

# Reiniciar tras cambios en .env
docker compose down && docker compose up -d

# Actualizar a nueva versión
git pull origin main
docker compose up -d --build

# Hacer backup de datos
cp backend/documentos.json documentos.json.bak
cp -r backend/uploads/ uploads.bak/
```

## Variables de entorno

### backend/.env

| Variable         | Descripción                          | Ejemplo                        |
|------------------|--------------------------------------|--------------------------------|
| PORT             | Puerto interno de Express            | 3001                           |
| ADMIN_PASSWORD   | Contraseña del panel admin           | contraseña_segura              |
| SESSION_SECRET   | Secreto para firmar cookies          | cadena_aleatoria_32_caracteres |
| FRONTEND_ORIGIN  | Origen permitido en CORS (dev)       | http://localhost               |
| NODE_ENV         | Entorno de ejecución                 | production                     |

### frontend/.env (solo desarrollo)

| Variable            | Descripción                     | Ejemplo                    |
|---------------------|---------------------------------|----------------------------|
| PUBLIC_BACKEND_URL  | URL del backend en desarrollo   | http://localhost:3001      |

## Documentación

- [ROADMAP.md](ROADMAP.md) — Fases y estimaciones
- [GITFLOW.md](GITFLOW.md) — Estrategia de ramas y commits
- [MERMAID.md](MERMAID.md) — Diagramas de arquitectura
- [TECH_STACK.md](TECH_STACK.md) — Stack y versiones
- [DECISIONS.md](DECISIONS.md) — Decisiones técnicas
