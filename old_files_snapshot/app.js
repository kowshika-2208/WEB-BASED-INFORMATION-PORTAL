const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');

dotenv.config();

const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const facultyRoutes = require('./routes/facultyRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { attachUserFromToken } = require('./middleware/authMiddleware');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(attachUserFromToken);

app.get('/healthz', (req, res) => {
  return res.status(200).json({ ok: true });
});

app.use('/', authRoutes);
app.use('/student', studentRoutes);
app.use('/faculty', facultyRoutes);
app.use('/admin', adminRoutes);

app.use((req, res) => {
  return res.status(404).render('partials/error', {
    title: 'Not Found',
    message: 'The requested page was not found.',
    user: req.user || null
  });
});

app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  const dbErrors = new Set([
    'ECONNREFUSED',
    'ER_ACCESS_DENIED_ERROR',
    'ER_BAD_DB_ERROR',
    '3D000',
    '28P01',
    'ECONNRESET'
  ]);
  const isDbError = err && (dbErrors.has(err.code) || /postgres|database/i.test(String(err.message || '')));
  const message = isDbError
    ? 'Database connection failed. Check DB settings in .env, then run npm run db:init and npm run seed.'
    : 'Something went wrong. Please try again later.';
  return res.status(500).render('partials/error', {
    title: 'Server Error',
    message,
    user: req.user || null
  });
});

const basePort = Number(process.env.PORT || 3000);

const startServer = (port) => {
  const server = app.listen(port, () => {
    console.log(`CIP server running on http://localhost:${port}`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      const nextPort = port + 1;
      console.warn(`Port ${port} is in use. Retrying on ${nextPort}...`);
      setTimeout(() => startServer(nextPort), 200);
      return;
    }
    throw error;
  });
};

startServer(basePort);
