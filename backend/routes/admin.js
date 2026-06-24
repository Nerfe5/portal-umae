const express = require('express');
const path = require('path');

const { requireAuthWeb } = require('../middleware/auth');
const { readDocumentos, agruparPorDepartamento } = require('../utils/documentos'); // usados en la siguiente tarea

const router = express.Router();

const VIEWS = path.join(__dirname, '..', 'views');

// GET /admin/login
router.get('/login', (req, res) => {
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

// GET /admin — panel principal (dinámico en siguiente tarea)
router.get('/', requireAuthWeb, (_req, res) => {
  res.sendFile('admin.html', { root: VIEWS });
});

// POST /admin/logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/admin/login'));
});

module.exports = router;
