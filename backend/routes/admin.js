'use strict';
const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

const { requireAuthWeb } = require('../middleware/auth');
const { upload, UPLOADS_DIR } = require('../utils/upload');
const { readDocumentos, writeDocumentos, agruparPorDepartamento } = require('../utils/documentos');

const router = express.Router();
const VIEWS = path.join(__dirname, '..', 'views');

// ─── Flash messages ───────────────────────────────────────────────────────────
const FLASH = {
  'ok-uploaded':  { ok: true,  msg: 'Documento subido correctamente.' },
  'ok-deleted':   { ok: true,  msg: 'Documento eliminado correctamente.' },
  'err-size':     { ok: false, msg: 'El archivo supera el límite de 10 MB.' },
  'err-type':     { ok: false, msg: 'Extensión no permitida. Se aceptan: PDF, Word, Excel.' },
  'err-save':     { ok: false, msg: 'Error al guardar el documento. Inténtalo de nuevo.' },
  'err-notfound': { ok: false, msg: 'Documento no encontrado.' },
  'err-delete':   { ok: false, msg: 'Error al eliminar el documento.' },
  'err-fields':   { ok: false, msg: 'El nombre y el departamento son obligatorios.' },
  'err-file':     { ok: false, msg: 'Se requiere un archivo.' },
};

// ─── HTML helpers ─────────────────────────────────────────────────────────────
function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('es-MX', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

const EXT_STYLE = {
  pdf:  'background:#fef2f2;color:#b91c1c',
  doc:  'background:#eff6ff;color:#1d4ed8',
  docx: 'background:#eff6ff;color:#1d4ed8',
  xls:  'background:#f0fdf4;color:#15803d',
  xlsx: 'background:#f0fdf4;color:#15803d',
};

function extBadge(ext) {
  const style = EXT_STYLE[ext] ?? 'background:#f3f4f6;color:#374151';
  return `<span style="${style}" class="inline-block px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide">${escapeHtml(ext)}</span>`;
}

// ─── Template pieces ──────────────────────────────────────────────────────────

function renderFlash(flash) {
  if (!flash) return '';
  const [bg, border, color] = flash.ok
    ? ['#f0fdf4', '#bbf7d0', '#15803d']
    : ['#fef2f2', '#fecaca', '#b91c1c'];
  const iconPath = flash.ok
    ? '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>'
    : '<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>';
  return `
  <div class="max-w-7xl mx-auto px-4 pt-4">
    <div class="rounded-lg px-4 py-3 text-sm flex items-center gap-2"
      style="background:${bg};border:1px solid ${border};color:${color}">
      <svg class="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">${iconPath}</svg>
      ${escapeHtml(flash.msg)}
    </div>
  </div>`;
}

function renderEmpty() {
  return `
  <div class="px-5 py-14 text-center">
    <svg class="w-10 h-10 mx-auto mb-3 opacity-30" fill="none" stroke="#6b7280" viewBox="0 0 24 24" stroke-width="1.5">
      <path stroke-linecap="round" stroke-linejoin="round"
        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/>
    </svg>
    <p class="text-sm text-gray-400">No hay documentos. Sube el primero usando el formulario.</p>
  </div>`;
}

function renderDocRow(doc) {
  const safeName = escapeHtml(doc.nombre).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  return `
  <div class="px-5 py-3 flex items-center gap-3 hover:bg-gray-50 border-b border-gray-100 last:border-0">
    <div class="flex-shrink-0">${extBadge(doc.extension)}</div>
    <div class="flex-1 min-w-0">
      <p class="text-sm font-medium text-gray-800 truncate" title="${escapeHtml(doc.nombre)}">${escapeHtml(doc.nombre)}</p>
      <p class="text-xs text-gray-400">${formatDate(doc.fechaSubida)} · ${formatSize(doc.tamanioBytes)}</p>
    </div>
    <div class="flex-shrink-0 flex items-center gap-1">
      <a href="/uploads/${escapeHtml(doc.filename)}" target="_blank" rel="noopener"
        class="text-xs font-medium px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        style="color:#006847">Ver</a>
      <form id="del-${escapeHtml(doc.id)}" method="POST" action="/admin/panel/delete/${escapeHtml(doc.id)}">
        <button type="button"
          onclick="confirmDelete('${escapeHtml(doc.id)}','${safeName}')"
          class="text-xs font-medium px-2 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
          style="color:#dc2626">Eliminar</button>
      </form>
    </div>
  </div>`;
}

function renderDeptSection(dept) {
  return `
  <div class="border-b border-gray-100 last:border-0">
    <div class="px-5 py-3 flex items-center justify-between bg-gray-50">
      <span class="text-sm font-semibold text-gray-700">${escapeHtml(dept.nombre)}</span>
      <span class="text-xs px-2 py-0.5 rounded-full"
        style="background:white;border:1px solid #e5e7eb;color:#6b7280">
        ${dept.documentos.length} doc${dept.documentos.length !== 1 ? 's' : ''}
      </span>
    </div>
    ${dept.documentos.map(renderDocRow).join('')}
  </div>`;
}

function renderPanel(departamentos, flashKey) {
  const flash = FLASH[flashKey] ?? null;
  const totalDocs = departamentos.reduce((n, d) => n + d.documentos.length, 0);

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Panel — UMAE Admin</title>
  <script src="https://cdn.tailwindcss.com"><\/script>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; }
    .btn-green { background: #006847; color: #fff; }
    .btn-green:hover { background: #004d34; }
    input[type=text]:focus { outline: 2px solid #006847; outline-offset: 1px; }
  </style>
</head>
<body class="min-h-screen bg-gray-50">

  <header style="background:#006847">
    <div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="white" viewBox="0 0 24 24" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"/>
        </svg>
        <div>
          <span class="text-white font-semibold text-sm">Panel de Administración</span>
          <span class="hidden sm:inline text-sm ml-1.5" style="color:rgba(255,255,255,0.65)">· Portal UMAE</span>
        </div>
      </div>
      <form method="POST" action="/admin/logout">
        <button type="submit"
          class="text-sm px-3 py-1.5 rounded-lg transition-colors"
          style="color:rgba(255,255,255,0.85);border:1px solid rgba(255,255,255,0.35)"
          onmouseover="this.style.background='rgba(255,255,255,0.12)'"
          onmouseout="this.style.background='transparent'">
          Cerrar sesión
        </button>
      </form>
    </div>
  </header>

  ${renderFlash(flash)}

  <main class="max-w-7xl mx-auto px-4 py-6">
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">

      <!-- Formulario de subida -->
      <div class="lg:col-span-1">
        <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h2 class="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" style="color:#006847">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/>
            </svg>
            Subir documento
          </h2>
          <form method="POST" action="/admin/panel/upload" enctype="multipart/form-data">
            <div class="mb-3">
              <label class="block text-xs font-medium text-gray-600 mb-1.5">Nombre del documento</label>
              <input type="text" name="nombre" required placeholder="Ej. Reglamento interno"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"/>
            </div>
            <div class="mb-3">
              <label class="block text-xs font-medium text-gray-600 mb-1.5">Departamento</label>
              <input type="text" name="departamento" required placeholder="Ej. Dirección"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"/>
            </div>
            <div class="mb-5">
              <label class="block text-xs font-medium text-gray-600 mb-1.5">Archivo</label>
              <input type="file" name="archivo" required accept=".pdf,.doc,.docx,.xls,.xlsx"
                class="w-full text-sm text-gray-500
                  file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0
                  file:text-xs file:font-semibold file:bg-gray-100 file:text-gray-700 file:cursor-pointer"/>
              <p class="text-xs text-gray-400 mt-1.5">PDF, Word, Excel · Máx. 10 MB</p>
            </div>
            <button type="submit" class="btn-green w-full font-medium py-2 rounded-lg text-sm transition-colors">
              Subir documento
            </button>
          </form>
        </div>
      </div>

      <!-- Lista de documentos -->
      <div class="lg:col-span-2">
        <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div class="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 class="font-semibold text-gray-800">Documentos</h2>
            <span class="text-xs text-gray-400">${totalDocs} documento${totalDocs !== 1 ? 's' : ''}</span>
          </div>
          ${totalDocs === 0 ? renderEmpty() : departamentos.map(renderDeptSection).join('')}
        </div>
      </div>

    </div>
  </main>

  <script>
    function confirmDelete(id, name) {
      if (confirm('\\u00bfEliminar "' + name + '"?\\nEsta acci\\u00f3n no se puede deshacer.')) {
        document.getElementById('del-' + id).submit();
      }
    }
  </script>
</body>
</html>`;
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// GET /admin/login
router.get('/login', (_req, res) => {
  res.sendFile('login.html', { root: VIEWS });
});

// POST /admin/login
router.post('/login', (req, res) => {
  const { password } = req.body;
  if (password && password === process.env.ADMIN_PASSWORD) {
    req.session.authenticated = true;
    return res.redirect('/admin');
  }
  res.redirect('/admin/login?error=1');
});

// GET /admin — panel principal
router.get('/', requireAuthWeb, async (req, res) => {
  try {
    const { documentos } = await readDocumentos();
    const departamentos = agruparPorDepartamento(documentos);
    res.send(renderPanel(departamentos, req.query.flash || null));
  } catch {
    res.status(500).send('<p style="font-family:sans-serif;padding:2rem">Error interno. Recarga la página.</p>');
  }
});

// POST /admin/panel/upload — subir documento
router.post('/panel/upload', requireAuthWeb, (req, res, next) => {
  upload.single('archivo')(req, res, err => {
    if (err) {
      const code = err.code === 'LIMIT_FILE_SIZE' ? 'err-size' : 'err-type';
      return res.redirect(`/admin?flash=${code}`);
    }
    next();
  });
}, async (req, res) => {
  const nombre = req.body.nombre?.trim();
  const departamento = req.body.departamento?.trim();
  if (!nombre || !departamento) {
    if (req.file) await fs.unlink(req.file.path).catch(() => {});
    return res.redirect('/admin?flash=err-fields');
  }
  if (!req.file) return res.redirect('/admin?flash=err-file');

  const ext = path.extname(req.file.originalname).toLowerCase().slice(1);
  const nuevo = {
    id: uuidv4(),
    nombre,
    departamento,
    filename: req.file.filename,
    extension: ext,
    fechaSubida: new Date().toISOString(),
    tamanioBytes: req.file.size,
  };
  try {
    const data = await readDocumentos();
    data.documentos.push(nuevo);
    await writeDocumentos(data);
    res.redirect('/admin?flash=ok-uploaded');
  } catch {
    await fs.unlink(req.file.path).catch(() => {});
    res.redirect('/admin?flash=err-save');
  }
});

// POST /admin/panel/delete/:id — eliminar documento
router.post('/panel/delete/:id', requireAuthWeb, async (req, res) => {
  try {
    const data = await readDocumentos();
    const idx = data.documentos.findIndex(d => d.id === req.params.id);
    if (idx === -1) return res.redirect('/admin?flash=err-notfound');
    const [doc] = data.documentos.splice(idx, 1);
    await writeDocumentos(data);
    await fs.unlink(path.join(UPLOADS_DIR, doc.filename)).catch(() => {});
    res.redirect('/admin?flash=ok-deleted');
  } catch {
    res.redirect('/admin?flash=err-delete');
  }
});

// POST /admin/logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/admin/login'));
});

module.exports = router;
