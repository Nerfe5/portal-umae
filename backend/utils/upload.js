'use strict';
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
const ALLOWED_EXT = new Set(['pdf', 'doc', 'docx', 'xls', 'xlsx']);
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().slice(1);
    cb(null, `${uuidv4()}.${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().slice(1);
    if (ALLOWED_EXT.has(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Extensión no permitida. Se aceptan: ${[...ALLOWED_EXT].join(', ')}`));
    }
  },
});

module.exports = { upload, UPLOADS_DIR, ALLOWED_EXT };
