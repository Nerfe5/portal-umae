# GITFLOW — Portal UMAE

## Estrategia de ramas

Este proyecto usa una variante simplificada de Gitflow adaptada a un equipo pequeño (1–2 personas) y a un ciclo de entregas corto.

```
main          ← producción estable, siempre desplegable
develop       ← integración continua, base para features
feature/*     ← desarrollo de funcionalidades
fix/*         ← correcciones de bugs
chore/*       ← tareas de mantenimiento, dependencias, docs
```

### Reglas

| Rama         | Se crea desde | Se fusiona en       | Protegida | CI/CD             |
|--------------|---------------|---------------------|-----------|-------------------|
| `main`       | —             | —                   | Sí        | Deploy producción |
| `develop`    | `main`        | `main`              | Sí        | —                 |
| `feature/*`  | `develop`     | `develop`           | No        | —                 |
| `fix/*`      | `develop`     | `develop`           | No        | —                 |
| `chore/*`    | `develop`     | `develop`           | No        | —                 |

- **Nunca** hacer push directo a `main`.
- **Nunca** hacer push directo a `develop` (usar PR o merge desde feature).
- `main` solo recibe merges desde `develop` cuando la fase está completa y probada.

---

## Convención de nombres de ramas

```
feature/backend-api-documentos
feature/frontend-seccion-inicio
feature/admin-panel-login
fix/cors-cloudflare-origin
fix/upload-validacion-extension
chore/docker-compose-setup
chore/dependencias-astro
```

Formato: `<tipo>/<descripcion-corta-en-kebab-case>`

---

## Convención de commits (Conventional Commits)

```
<tipo>(<alcance>): <descripción corta en imperativo>
```

### Tipos permitidos

| Tipo       | Cuándo usarlo                                                  |
|------------|----------------------------------------------------------------|
| `feat`     | Nueva funcionalidad                                            |
| `fix`      | Corrección de bug                                              |
| `docs`     | Solo cambios en documentación                                  |
| `style`    | Formato, espacios, punto y coma — sin cambio de lógica         |
| `refactor` | Refactorización sin nueva funcionalidad ni bug fix             |
| `chore`    | Tareas de build, CI, dependencias, configuración               |
| `test`     | Añadir o corregir tests                                        |
| `perf`     | Mejora de rendimiento                                          |

### Alcances sugeridos

`backend`, `frontend`, `admin`, `api`, `auth`, `docs`, `config`, `deploy`

### Ejemplos

```
feat(backend): agregar endpoint GET /api/documentos con agrupación por departamento
feat(frontend): implementar sección de sistemas institucionales con grid responsivo
fix(backend): corregir validación de extensión de archivo en subida
feat(admin): agregar formulario de login con sesión por cookie
chore(config): añadir docker-compose para levantar backend en desarrollo
docs: actualizar ROADMAP con estimaciones de Fase 4
refactor(backend): extraer lógica de lectura de documentos.json a función utilitaria
style(frontend): ajustar espaciado en header para móvil
```

---

## Flujo de trabajo típico

### Iniciar una nueva funcionalidad

```bash
git checkout develop
git pull origin develop
git checkout -b feature/nombre-de-la-feature
# ... trabajar ...
git add <archivos>
git commit -m "feat(alcance): descripción"
git push origin feature/nombre-de-la-feature
# Abrir PR hacia develop
```

### Cerrar una fase y pasar a producción

```bash
git checkout develop
git pull origin develop
# Verificar que todo está probado
git checkout main
git merge --no-ff develop -m "chore: merge fase 2 - panel de administración"
git tag v0.2.0
git push origin main --tags
```

---

## Versionado

Seguimos [Semantic Versioning](https://semver.org/) simplificado:

```
v<fase>.<iteración>.<parche>
```

| Versión | Significado                        |
|---------|------------------------------------|
| v0.0.1  | Fase 0 completa (scaffolding)      |
| v0.1.0  | Fase 1 completa (backend base)     |
| v0.2.0  | Fase 2 completa (panel admin)      |
| v0.3.0  | Fase 3 completa (portal público)   |
| v1.0.0  | Fase 4 completa (producción lista) |
| v1.1.0  | Fase 5 completa (contenido real)   |

---

## .gitignore principal

Los siguientes paths deben estar en `.gitignore`:

```
# Dependencias
node_modules/

# Entorno
.env
.env.local
.env.production

# Archivos subidos (nunca versionar documentos del hospital)
backend/uploads/

# Build del frontend
frontend/dist/
frontend/.astro/

# Sistema operativo
.DS_Store
Thumbs.db

# Editor
.vscode/settings.json
.idea/
```

---

## Notas de seguridad

- El archivo `.env` con `ADMIN_PASSWORD` **jamás** debe llegar al repositorio.
- El directorio `backend/uploads/` contiene documentos potencialmente sensibles — siempre gitignoreado.
- El archivo `backend/documentos.json` puede contener nombres de documentos internos — evaluar si gitignorearlo en producción.
