# Portal UMAE

Portal institucional del UMAE Hospital de Especialidades IMSS Puebla.

## Estructura

```
portal-umae/
├── frontend/          # Astro + Tailwind — portal público → Cloudflare Pages
├── backend/           # Express — API REST + panel admin → servidor hospitalario
└── docker-compose.yml # Solo para el backend
```

## Requisitos

- Node.js 20 LTS
- npm 10.x
- Docker + Docker Compose (producción del backend)

## Desarrollo local

### Backend

```bash
cd backend
cp .env.example .env   # editar con valores reales
npm install
npm run dev            # http://localhost:3001
```

Verificar que el servidor responde:

```bash
curl http://localhost:3001/health
```

### Frontend

```bash
cd frontend
cp .env.example .env   # editar PUBLIC_BACKEND_URL
npm install
npm run dev            # http://localhost:4321
```

## Producción

### Backend — servidor hospitalario

```bash
# 1. Copiar y editar variables de entorno
cp backend/.env.example backend/.env

# 2. Levantar con Docker Compose
docker compose up -d

# 3. Ver logs
docker compose logs -f backend
```

### Frontend — Cloudflare Pages

Conectar el repositorio con la siguiente configuración:

| Campo              | Valor                                            |
|--------------------|--------------------------------------------------|
| Build command      | `cd frontend && npm install && npm run build`    |
| Build output       | `frontend/dist`                                  |
| Var. de entorno    | `PUBLIC_BACKEND_URL=https://<url-cf-tunnel>`     |

## Variables de entorno

| Archivo                   | Variables                                      |
|---------------------------|------------------------------------------------|
| `backend/.env.example`    | PORT, ADMIN_PASSWORD, SESSION_SECRET, FRONTEND_ORIGIN |
| `frontend/.env.example`   | PUBLIC_BACKEND_URL                             |

## Documentación

- [ROADMAP.md](ROADMAP.md) — Fases y estimaciones
- [GITFLOW.md](GITFLOW.md) — Estrategia de ramas y commits
- [MERMAID.md](MERMAID.md) — Diagramas de arquitectura
- [TECH_STACK.md](TECH_STACK.md) — Stack y versiones
- [DECISIONS.md](DECISIONS.md) — Decisiones técnicas
