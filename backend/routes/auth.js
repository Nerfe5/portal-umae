const express = require('express');
const router = express.Router();

// POST /api/auth/login
router.post('/login', (req, res) => {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return res.status(503).json({ error: 'ADMIN_PASSWORD no configurada en el servidor' });
  }
  const { password } = req.body;
  if (password && password === adminPassword) {
    req.session.authenticated = true;
    return res.json({ mensaje: 'Autenticado correctamente' });
  }
  res.status(401).json({ error: 'Contraseña incorrecta' });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ mensaje: 'Sesión cerrada' });
  });
});

module.exports = router;
