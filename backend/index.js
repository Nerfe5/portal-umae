require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const path = require('path');

const documentosRouter = require('./routes/documentos');
const authRouter = require('./routes/auth');
const adminRouter = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3001;

// Cloudflare Tunnel termina TLS — Express debe confiar en el proxy para cookies seguras
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || 'http://localhost:4321',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
  },
}));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Sirve el build estático de Astro
app.use(express.static(path.join(__dirname, '..', 'frontend', 'dist')));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/documentos', documentosRouter);
app.use('/api/auth', authRouter);

app.use('/admin', adminRouter);

// Catch-all: cualquier ruta no reconocida devuelve el index.html de Astro
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Portal UMAE backend escuchando en puerto ${PORT}`);
});
