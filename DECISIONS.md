# DECISIONS — Portal UMAE

Registro de decisiones técnicas arquitectónicas (ADR simplificados).

---

## ADR-001 — Astro como framework del frontend (actualizado a 7.x)

**Decisión:** Usar Astro 7.x en lugar de un framework SPA.

**Por qué 7.x y no 4.x (planificación original):** Al hacer el scaffolding, `npm audit` en Astro 4.x reportó 8 vulnerabilidades (2 high, 6 moderate) incluyendo XSS reflejado y bypass de middleware — todos en `astro <= 6.4.5`. La única corrección disponible sin cambios breaking era saltar a 7.x. Se decidió hacer el upgrade en la Fase 0, antes de escribir cualquier componente, para no acumular deuda de seguridad.

**Alternativas descartadas:**
- **Next.js / Nuxt.js** — Requieren un servidor Node.js para SSR o un adaptador para exportación estática. Añaden complejidad innecesaria para un portal mayoritariamente informativo.
- **React / Vue puro (Vite SPA)** — Generan HTML vacío que requiere JS para renderizar, lo cual perjudica el SEO y el tiempo de carga en conexiones lentas del hospital.
- **HTML + CSS plano** — Sin sistema de componentes ni build, la mantenibilidad decae rápidamente al crecer el contenido.

**Justificación:** El portal es principalmente estático (5–6 páginas informativas). Astro genera HTML puro en build time, con JS opcional solo donde se necesite (lista de documentos). Resultado: tiempos de carga óptimos, SEO correcto, despliegue trivial en Cloudflare Pages.

---

## ADR-002 — Sin base de datos: persistencia en JSON

**Decisión:** Los metadatos de documentos se almacenan en `documentos.json` gestionado por el backend con `fs.promises`.

**Alternativas descartadas:**
- **SQLite** — Añade una capa de dependencia (mejor-sqlite3, drizzle/prisma). Para el volumen esperado (decenas o pocos cientos de documentos) es sobredimensionado.
- **MongoDB / PostgreSQL** — Requieren infraestructura adicional, configuración, backups. Contradice el requisito de simplicidad y el contexto del servidor hospitalario.
- **Supabase / PlanetScale (cloud DB)** — Dependencia externa, latencia, costo potencial, y datos del hospital fuera de las instalaciones.

**Justificación:** El caso de uso es CRUD simple sobre un número acotado de documentos. JSON + fs es cero dependencias externas, portable, fácil de inspeccionar y respaldar manualmente. La concurrencia no es un problema (uso interno, carga baja).

**Riesgo aceptado:** Sin transacciones atómicas. Si el servidor falla durante una escritura, el JSON puede corromperse. Mitigación: escribir siempre a un archivo temporal y luego renombrar atómicamente (`fs.rename`).

---

## ADR-003 — Autenticación por contraseña simple sin JWT

**Decisión:** Un único `ADMIN_PASSWORD` en variable de entorno, validado en login, con sesión mantenida por cookie usando `express-session`.

**Alternativas descartadas:**
- **JWT (JSON Web Tokens)** — Innecesario cuando hay un solo administrador y las sesiones son server-side. Añade complejidad de gestión de refresh tokens y revocación.
- **OAuth2 / SSO IMSS** — No existe información de que el IMSS exponga un SSO integrable, y la configuración sería compleja y frágil.
- **Auth0 / Clerk (SaaS auth)** — Dependencia externa, costo potencial, datos de sesión fuera del hospital.
- **HTTP Basic Auth** — Las credenciales viajan en cada request, no hay concepto de logout.

**Justificación:** Solo hay un usuario administrador. La sesión por cookie es segura si el backend corre en HTTPS (garantizado por Cloudflare Tunnel). Simple de implementar y de mantener.

**Nota de seguridad:** El `SESSION_SECRET` debe ser una cadena aleatoria larga (≥32 caracteres). La cookie debe ser `httpOnly: true`, `sameSite: 'strict'`.

---

## ADR-004 — Almacenamiento de archivos en disco local

**Decisión:** Los documentos se guardan en `backend/uploads/` como archivos en el sistema de archivos del servidor.

**Alternativas descartadas:**
- **Cloudflare R2 / AWS S3** — Costo, dependencia externa, datos del hospital en nube pública. Requiere credenciales adicionales y lógica de firma de URLs.
- **Cloudflare D1 como storage** — D1 es base de datos relacional, no almacenamiento de blobs.
- **Base64 en JSON** — Inaceptable para archivos de varios MB.

**Justificación:** El servidor ya existe en el hospital. Usar el disco local elimina dependencias externas, mantiene los documentos dentro de la infraestructura del IMSS y simplifica los backups (copiar la carpeta `uploads/`).

**Riesgo aceptado:** Si el servidor tiene un fallo de disco, los documentos se pierden. Mitigación recomendada: backup periódico de `uploads/` y `documentos.json` a una unidad de red del hospital.

---

## ADR-005 — Cloudflare Tunnel para exponer el backend

**Decisión:** Usar `cloudflared` para crear un túnel desde el servidor hospitalario a Cloudflare, evitando abrir puertos en el firewall.

**Alternativas descartadas:**
- **Abrir puerto en firewall del hospital** — Requiere aprobación del área de TI del IMSS, puede no ser posible por políticas institucionales.
- **Reverse proxy con dominio propio** — Requiere IP pública estática y gestión de SSL.
- **ngrok** — Plan gratuito con limitaciones de ancho de banda y URLs aleatorias que cambian.

**Justificación:** El hospital ya tiene `cloudflared` en uso (según el brief). Cloudflare Tunnel es seguro (el tráfico siempre sale del servidor hacia Cloudflare, nunca entra desde fuera), gratuito en el plan actual y no requiere cambios en el firewall.

---

## ADR-006 — Docker Compose solo para el backend

**Decisión:** El backend corre en un contenedor Docker Compose. El frontend no se dockeriza.

**Alternativas descartadas:**
- **Dockerizar también el frontend** — El frontend es estático y se despliega en Cloudflare Pages. Dockerizarlo solo añade un paso innecesario.
- **Sin Docker (Node directo)** — Corre en el mismo proceso del sistema operativo del servidor. Conflictos de versión de Node con otras aplicaciones, sin aislamiento de puertos ni entorno.
- **Kubernetes** — Completamente sobredimensionado para una sola aplicación en un servidor.

**Justificación:** Docker Compose permite definir el puerto, las variables de entorno y los volúmenes en un archivo versionado. Facilita reinicios, actualizaciones y el aislamiento de Node.js respecto al resto del servidor (donde corre SIGEB).

---

## ADR-007 — npm como gestor de paquetes

**Decisión:** Usar `npm` en lugar de pnpm, yarn o bun.

**Alternativas descartadas:**
- **pnpm** — No está instalado en el servidor hospitalario y añadir software al servidor requiere gestión con TI del IMSS. Descartado por restricción operativa.
- **yarn 1.x** — Legacy, sin ventajas sobre npm para este uso. Misma restricción de instalación.
- **yarn berry (PnP)** — El modo Plug'n'Play puede causar incompatibilidades con algunas herramientas de Astro.
- **bun** — Excelente rendimiento, pero aún en maduración y puede tener incompatibilidades con algunas dependencias de Express.

**Justificación:** npm viene incluido con Node.js y no requiere instalación adicional en el servidor. Garantiza compatibilidad inmediata en cualquier entorno donde corra Node.js 20 LTS sin intervención extra de TI.

---

## ADR-008 — Tipografía: Inter (Fontsource local) sobre Nunito Sans del IMSS

**Decisión:** Usar Inter servida localmente. Si se obtienen los assets oficiales del IMSS, migrar a la tipografía institucional.

**Contexto:** El manual de identidad del IMSS especifica Nunito Sans. Sin embargo, no es siempre de libre distribución en las versiones exactas requeridas.

**Justificación:** Inter es visualmente similar a Nunito Sans (sans-serif geométrica, legible en pantalla), está disponible vía Fontsource (licencia OFL), y sirve desde el propio dominio sin dependencias de Google Fonts — importante en redes hospitalarias que pueden bloquear CDNs externos. La migración a Nunito Sans oficial es un cambio de una línea en la configuración de Tailwind.

---

## ADR-010 — Tailwind 4.x con @tailwindcss/vite en lugar de @astrojs/tailwind

**Decisión:** Usar Tailwind CSS 4.x con el plugin `@tailwindcss/vite` en vez de `@astrojs/tailwind` 5.x.

**Contexto:** El upgrade a Astro 7.x hizo incompatible `@astrojs/tailwind` (solo soporta Astro ≤5 y Tailwind ≤3). Se evaluaron dos caminos: (a) mantener Tailwind 3 con PostCSS, o (b) migrar a Tailwind 4.

**Alternativas descartadas:**
- **Tailwind 3.x + PostCSS manual** — Requiere `postcss.config.mjs`, `autoprefixer`, configuración adicional. Tailwind 3 tiene fecha de EOL próxima.
- **@astrojs/tailwind en modo legacy** — Peer deps incompatibles con Astro 7 y Tailwind 4. Produce warnings y posible comportamiento inesperado.

**Justificación:** Tailwind 4 es la versión actual, se integra limpiamente con Vite mediante `@tailwindcss/vite` (un plugin, sin configuración extra), y usa CSS-first config con `@theme` — más idiomático y sin necesidad de `tailwind.config.mjs`. La paleta IMSS se define como custom properties CSS (`--color-imss-green: #006847`) que Tailwind expone automáticamente como utilities (`text-imss-green`, `bg-imss-green`, etc.).

## ADR-009 — Sin framework de componentes UI (sin shadcn, sin DaisyUI)

**Decisión:** Tailwind CSS puro, sin librería de componentes de terceros.

**Alternativas descartadas:**
- **DaisyUI** — Añade clases semánticas útiles pero introduce estilos base que pueden chocar con la identidad IMSS.
- **shadcn/ui** — Orientado a React; no se integra nativamente con Astro sin islas de React.
- **Flowbite** — Similar a DaisyUI, genera CSS que puede requerir purga adicional.

**Justificación:** El portal tiene pocas páginas y componentes repetibles. Tailwind puro da control total sobre cada pixel para respetar la identidad visual IMSS. Evita el peso de librerías de componentes no necesarias.
