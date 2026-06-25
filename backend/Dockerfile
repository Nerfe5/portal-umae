# ── Stage 1: Build del frontend Astro ──────────────────────
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# ── Stage 2: Imagen final con Express ──────────────────────
FROM node:20-alpine AS production
WORKDIR /app

# Dependencias del backend
COPY backend/package*.json ./
RUN npm install --omit=dev

# Código del backend
COPY backend/ ./

# Frontend compilado (desde stage 1)
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Directorio de uploads
RUN mkdir -p uploads

EXPOSE 3001
CMD ["node", "index.js"]
