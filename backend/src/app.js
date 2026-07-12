require('dotenv').config();

// Verificar variables de entorno críticas antes de arrancar
const REQUIRED_ENV = ['JWT_SECRET', 'DATABASE_URL'];
const PLACEHOLDER   = 'your-super-secret';
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`FATAL: Falta la variable de entorno ${key}`);
    process.exit(1);
  }
}
if (process.env.JWT_SECRET.includes(PLACEHOLDER)) {
  console.error('FATAL: JWT_SECRET tiene el valor por defecto inseguro. Cámbialo antes de desplegar.');
  process.exit(1);
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const routes = require('./routes');
const { seedDefaultCategories } = require('./services/seederService');

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), env: process.env.NODE_ENV });
});

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 CORS origin: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  // Crear categorías por defecto si no existen
  await seedDefaultCategories();
});

module.exports = app;
