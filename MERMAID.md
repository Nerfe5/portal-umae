# MERMAID — Diagramas Portal UMAE

---

## 1. Arquitectura general del sistema

```mermaid
graph TB
    subgraph "Usuario final (público / personal IMSS)"
        Browser["Navegador web"]
    end

    subgraph "Cloudflare (edge)"
        CF_Pages["Cloudflare Pages\nfrontend estático\n(Astro build)"]
        CF_Tunnel["Cloudflare Tunnel\nexpose backend"]
    end

    subgraph "Servidor hospitalario"
        Backend["Backend Express\n:3001\n/api/documentos\n/uploads\n/admin"]
        JSON_Store[("documentos.json\nmetadatos")]
        FS["Sistema de archivos\n/uploads/\nPDF, Word, Excel"]
        SIGEB["SIGEB\n(otro puerto)"]
    end

    Browser -->|"HTTPS"| CF_Pages
    CF_Pages -->|"fetch() HTTPS\npúblico"| CF_Tunnel
    CF_Tunnel -->|"HTTP local"| Backend
    Backend <-->|"leer/escribir"| JSON_Store
    Backend <-->|"leer/escribir"| FS
    Backend -.->|"mismo servidor\npuerto diferente"| SIGEB

    style CF_Pages fill:#f4f4f4,stroke:#006847
    style Backend fill:#e8f5e9,stroke:#006847
    style CF_Tunnel fill:#fff3e0,stroke:#e65100
```

---

## 2. Flujo de subida de documentos (administrador)

```mermaid
sequenceDiagram
    actor Admin
    participant Browser as Navegador Admin
    participant Backend as Backend Express
    participant FS as /uploads/ (disco)
    participant JSON as documentos.json

    Admin->>Browser: Navega a /admin
    Browser->>Backend: GET /admin
    Backend-->>Browser: Formulario de login

    Admin->>Browser: Ingresa contraseña
    Browser->>Backend: POST /admin/login\n{ password }
    Backend->>Backend: Compara con ADMIN_PASSWORD\nde .env
    alt Contraseña correcta
        Backend-->>Browser: Set-Cookie: session=...\nRedirige a /admin/panel
    else Contraseña incorrecta
        Backend-->>Browser: 401 — Mensaje de error
    end

    Admin->>Browser: Selecciona archivo +\ndepartamento + nombre
    Browser->>Backend: POST /api/documentos\n(multipart/form-data)\nCookie de sesión
    Backend->>Backend: Valida sesión
    Backend->>Backend: Valida extensión\n(pdf, docx, xlsx)
    Backend->>FS: Guarda archivo con\nnombre único (uuid)
    Backend->>JSON: Agrega entrada\n{ id, nombre, departamento,\nfecha, filename }
    Backend-->>Browser: 201 { documento creado }
    Browser->>Admin: Panel actualizado con\nnuevo documento
```

---

## 3. Flujo de consulta de documentos (usuario público)

```mermaid
sequenceDiagram
    actor User as Usuario público
    participant Frontend as Frontend Astro\n(Cloudflare Pages)
    participant Backend as Backend Express\n(vía CF Tunnel)
    participant FS as /uploads/ (disco)

    User->>Frontend: Navega a /documentos
    Frontend->>Frontend: Componente Astro carga
    Frontend->>Backend: fetch()\nGET /api/documentos
    Backend->>Backend: Lee documentos.json
    Backend-->>Frontend: 200 JSON\n{ departamentos: [...] }
    Frontend->>Frontend: Renderiza lista\nagrupada por departamento

    User->>Frontend: Clic en "Descargar"
    Frontend->>Backend: GET /uploads/archivo.pdf
    Backend->>FS: Sirve archivo estático
    FS-->>Backend: Bytes del archivo
    Backend-->>Frontend: Archivo (stream)
    Frontend->>User: Descarga en navegador
```

---

## 4. Navegación del portal público

```mermaid
flowchart TD
    Home["/ — Inicio\nBienvenida institucional\n+ imagen del hospital"]
    Quienes["/quienes-somos\nHistoria y presentación"]
    MVL["/mision-vision\nMisión, Visión y Lema"]
    Sistemas["/sistemas\nGrid de accesos directos\na sistemas institucionales"]
    Docs["/documentos\nDocumentos por departamento\n(fetch al backend)"]
    Contacto["/contacto\nUbicación, teléfonos, mapa"]

    Nav["Header de navegación\n(presente en todas las páginas)"]

    Nav --> Home
    Nav --> Quienes
    Nav --> MVL
    Nav --> Sistemas
    Nav --> Docs
    Nav --> Contacto

    Docs -->|"Clic en archivo"| Download["Descarga directa\ndesde /uploads/"]
    Sistemas -->|"Clic en sistema"| ExtSys["Sistema externo\n(nueva pestaña)"]

    style Home fill:#e8f5e9,stroke:#006847
    style Nav fill:#006847,color:#fff,stroke:#004d33
```

---

## 5. Estructura de datos — documentos.json

```mermaid
erDiagram
    DOCUMENTO {
        string id PK "UUID v4"
        string nombre "Nombre visible al usuario"
        string departamento "Ej: Dirección, Enfermería"
        string filename "Nombre en disco (uuid.ext)"
        string extension "pdf | docx | xlsx"
        string fechaSubida "ISO 8601"
        number tamanioBytes "Tamaño del archivo"
    }
```

---

## 6. Modelo de despliegue

```mermaid
graph LR
    subgraph "Desarrollo local"
        Dev_FE["frontend/\nnpm run dev\n:4321"]
        Dev_BE["backend/\nnode index.js\n:3001"]
    end

    subgraph "CI — no existe aún"
        CI["—"]
    end

    subgraph "Producción"
        Prod_FE["Cloudflare Pages\nbuild Astro estático"]
        Prod_BE["Docker Compose\nen servidor hospitalario\n:3001"]
    end

    Dev_FE -->|"astro build + push"| Prod_FE
    Dev_BE -->|"docker compose up"| Prod_BE

    style Prod_FE fill:#f4f4f4,stroke:#006847
    style Prod_BE fill:#e8f5e9,stroke:#006847
```
