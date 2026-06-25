# ROADMAP — Portal UMAE

## Visión general

Portal institucional de red local. Frontend Astro compilado y servido
por el mismo backend Express. Todo en un único servidor Linux
(Dell PowerEdge T130) accesible exclusivamente desde la red del hospital.

---

## Fase 0 — Planificación y scaffolding (Semana 1)

**Objetivo:** Dejar la estructura de carpetas lista y los entornos de desarrollo funcionando.

### Hitos
- [ ] Documentos de planificación aprobados (ROADMAP, GITFLOW, MERMAID, TECH_STACK, DECISIONS)
- [ ] Repositorio Git inicializado con estructura `frontend/` y `backend/`
- [ ] `.gitignore` configurado (uploads, node_modules, .env)
- [ ] `docker-compose.yml` funcional para levantar el backend localmente
- [ ] Variables de entorno documentadas en `.env.example`
- [ ] README.md raíz con instrucciones de arranque

**Estimación:** 1–2 días

---

## Fase 1 — Backend: API + almacenamiento (Semana 1–2)

**Objetivo:** Backend Express funcional con persistencia en JSON, endpoints REST y servidor de archivos estáticos.

### Hitos
- [ ] Servidor Express arrancando en puerto configurable (default 3001)
- [ ] Carpeta `uploads/` creada y servida como estática
- [ ] `documentos.json` como almacén de metadatos (creado automáticamente si no existe)
- [ ] `GET /api/documentos` — lista todos, agrupados por departamento
- [ ] `GET /api/documentos/:departamento` — filtra por departamento
- [ ] `POST /api/documentos` — sube archivo (multer) + guarda metadatos
- [ ] `DELETE /api/documentos/:id` — elimina archivo y metadato
- [ ] Middleware de autenticación por contraseña (variable de entorno `ADMIN_PASSWORD`)
- [ ] CORS configurado para dominio del frontend
- [ ] Health check: `GET /health`

**Estimación:** 3–4 días

---

## Fase 2 — Panel de administración (Semana 2)

**Objetivo:** Interfaz web sencilla, servida por el propio backend, para gestionar documentos.

### Hitos
- [ ] Ruta `/admin` con formulario de login (contraseña simple, sesión por cookie)
- [ ] Vista principal del panel: lista de documentos agrupados por departamento
- [ ] Formulario de subida: campo nombre, selector de departamento, input de archivo
- [ ] Botón de eliminar por documento con confirmación
- [ ] Interfaz responsive con identidad visual IMSS (verde #006847)
- [ ] Logout y expiración de sesión

**Estimación:** 2–3 días

---

## Fase 3 — Frontend: portal público (Semana 2–3)

**Objetivo:** Portal Astro con todas las secciones, consumiendo el backend para documentos.

### Hitos
- [ ] Layout base con header (logo IMSS + nombre unidad) y footer
- [ ] Página de inicio con imagen representativa y bienvenida institucional
- [ ] Página "Quiénes somos"
- [ ] Página "Misión, Visión y Lema"
- [ ] Página "Sistemas institucionales" — grid de accesos directos
- [ ] Página "Documentos públicos" — fetch al backend, agrupados por departamento
- [ ] Página "Contacto" con mapa embebido y datos de ubicación
- [ ] Navegación responsive (hamburger en móvil)
- [ ] Paleta IMSS aplicada vía Tailwind (colores, tipografía)
- [ ] Meta tags y favicon

**Estimación:** 4–5 días

---

## Fase 4 — Integración y despliegue en red local (Semana 3–4)

**Objetivo:** Portal completo funcionando en servidor Linux local
accesible desde la red del hospital. Sin dependencias de servicios
externos.

### Hitos
- [ ] Build de Astro integrado en Dockerfile multi-stage
- [ ] Express sirve el frontend compilado en producción
- [ ] Nginx configurado como proxy reverso en puerto 80
- [ ] Docker Compose orquesta backend + nginx en un solo comando
- [ ] Prueba de validación en red WiFi externa con ngrok
- [ ] Ubuntu Server 24.04 instalado en Dell PowerEdge T130
- [ ] Docker instalado y configurado en el servidor
- [ ] Portal desplegado y accesible desde la red local del hospital
- [ ] Arranque automático con el servidor (restart: unless-stopped)
- [ ] Prueba end-to-end: subir documento → verlo en portal público
- [ ] Prueba en móvil y tablet desde la red del hospital

**Estimación:** 3–4 días

---

## Fase 5 — Contenido real y ajustes (Semana 4)

**Objetivo:** Cargar el contenido institucional definitivo y afinar detalles visuales.

### Hitos
- [ ] Textos institucionales reales (misión, visión, historia)
- [ ] Logos y recursos gráficos oficiales integrados
- [ ] URLs reales de sistemas institucionales en el grid de accesos
- [ ] Documentos iniciales subidos vía panel admin
- [ ] Revisión de accesibilidad (contraste, alt texts, semántica HTML)
- [ ] Revisión de rendimiento (Lighthouse ≥ 90)

**Estimación:** 2–3 días

---

## Resumen de plazos

| Fase | Descripción                        | Duración estimada |
|------|------------------------------------|-------------------|
| 0    | Planificación y scaffolding        | 1–2 días          |
| 1    | Backend: API + almacenamiento      | 3–4 días          |
| 2    | Panel de administración            | 2–3 días          |
| 3    | Frontend: portal público           | 4–5 días          |
| 4    | Integración y despliegue           | 2–3 días          |
| 5    | Contenido real y ajustes           | 2–3 días          |
| **Total** | —                             | **~3–4 semanas**  |

---

## Dependencias críticas

- El frontend de la Fase 3 depende de que la API de Fase 1 esté lista (al menos el endpoint GET).
- El despliegue de Fase 4 requiere acceso al servidor hospitalario y al panel de Cloudflare.
- Los contenidos institucionales reales (textos, logos, URLs) deben ser provistos por el área de comunicación o dirección del hospital.
