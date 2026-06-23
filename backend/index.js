require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

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

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rutas — se conectan en Fase 1 y Fase 2
// const documentosRouter = require('./routes/documentos');
// const adminRouter = require('./routes/admin');
// app.use('/api/documentos', documentosRouter);
// app.use('/admin', adminRouter);

app.listen(PORT, () => {
  console.log(`Portal UMAE backend escuchando en puerto ${PORT}`);
});
