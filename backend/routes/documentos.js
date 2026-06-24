const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');

const { requireAuth } = require('../middleware/auth');
const { readDocumentos, writeDocumentos, agruparPorDepartamento } = require('../utils/documentos');
const { upload, UPLOADS_DIR } = require('../utils/upload');

const router = express.Router();

// GET /api/documentos — lista todos agrupados por departamento
router.get('/', async (_req, res) => {
  try {
    const { documentos } = await readDocumentos();
    res.json({ departamentos: agruparPorDepartamento(documentos) });
  } catch {
    res.status(500).json({ error: 'Error al leer documentos' });
  }
});

// GET /api/documentos/:departamento — filtra por departamento
router.get('/:departamento', async (req, res) => {
  try {
    const { documentos } = await readDocumentos();
    const nombre = decodeURIComponent(req.params.departamento);
    const filtrados = documentos.filter(
      d => d.departamento.toLowerCase() === nombre.toLowerCase()
    );
    res.json({ departamento: nombre, documentos: filtrados });
  } catch {
    res.status(500).json({ error: 'Error al leer documentos' });
  }
});

// POST /api/documentos — sube un documento (protegido)
router.post(
  '/',
  requireAuth,
  (req, res, next) => {
    upload.single('archivo')(req, res, err => {
      if (err) return res.status(400).json({ error: err.message });
      next();
    });
  },
  [
    body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio'),
    body('departamento').trim().notEmpty().withMessage('El departamento es obligatorio'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      if (req.file) await fs.unlink(req.file.path).catch(() => {});
      return res.status(400).json({ errores: errors.array() });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Se requiere un archivo' });
    }

    const ext = path.extname(req.file.originalname).toLowerCase().slice(1);
    const nuevo = {
      id: uuidv4(),
      nombre: req.body.nombre,
      departamento: req.body.departamento,
      filename: req.file.filename,
      extension: ext,
      fechaSubida: new Date().toISOString(),
      tamanioBytes: req.file.size,
    };

    try {
      const data = await readDocumentos();
      data.documentos.push(nuevo);
      await writeDocumentos(data);
      res.status(201).json(nuevo);
    } catch {
      await fs.unlink(req.file.path).catch(() => {});
      res.status(500).json({ error: 'Error al guardar el documento' });
    }
  }
);

// DELETE /api/documentos/:id — elimina un documento (protegido)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const data = await readDocumentos();
    const idx = data.documentos.findIndex(d => d.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Documento no encontrado' });
    }
    const [doc] = data.documentos.splice(idx, 1);
    await writeDocumentos(data);
    await fs.unlink(path.join(UPLOADS_DIR, doc.filename)).catch(() => {});
    res.json({ mensaje: 'Documento eliminado', id: doc.id });
  } catch {
    res.status(500).json({ error: 'Error al eliminar el documento' });
  }
});

module.exports = router;
