# FinanzasPro 💰

> Aplicación profesional de finanzas personales — control financiero, análisis de deuda y recomendaciones inteligentes.

![Stack](https://img.shields.io/badge/React-18-blue) ![Stack](https://img.shields.io/badge/Node.js-20-green) ![Stack](https://img.shields.io/badge/PostgreSQL-15-blue) ![Stack](https://img.shields.io/badge/Prisma-5-purple)

## Características

- **Dashboard** con score financiero, KPIs, gráficos y transacciones recientes
- **Ingresos y gastos** con categorías, etiquetas, filtros y paginación
- **Gestión de deudas** con cálculo de intereses (simple/compuesto), tabla de amortización y estrategias Avalanche/Snowball
- **Metas financieras** con progreso visual y contribuciones
- **Presupuestos** mensuales por categoría con alertas de exceso
- **Sugerencias inteligentes** que analizan patrones y detectan riesgos
- **Reportes** mensuales y anuales con gráficos de tendencia
- **Modo oscuro** nativo
- **Autenticación JWT** con refresh token automático

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18, Vite, TailwindCSS, Recharts, Zustand |
| Backend | Node.js, Express, Prisma ORM |
| Base de datos | PostgreSQL 15 |
| Auth | JWT (access + refresh token) |
| Infraestructura | Docker + Docker Compose |

## Inicio Rápido

### Con Docker (recomendado)

```bash
cd finanzas-app

# Copiar variables de entorno
cp backend/.env.example backend/.env

# Levantar todos los servicios
docker compose up --build
```

La app estará disponible en:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **Health check**: http://localhost:5000/health

**Cuenta demo**: `demo@finanzas.app` / `Demo123!`

---

### Sin Docker (desarrollo local)

#### Requisitos previos
- Node.js 20+
- PostgreSQL 15+

#### Backend

```bash
cd backend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de PostgreSQL

# Generar cliente Prisma y migrar BD
npx prisma generate
npx prisma migrate dev --name init

# Cargar datos de prueba
node prisma/seed.js

# Iniciar servidor de desarrollo
npm run dev
```

#### Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Iniciar servidor de desarrollo
npm run dev
```

## Variables de Entorno

### Backend (`backend/.env`)

```env
DATABASE_URL="postgresql://usuario:password@localhost:5432/finanzas_db"
JWT_SECRET="tu-clave-secreta-jwt"
JWT_REFRESH_SECRET="tu-clave-refresh-secreta"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
PORT=5000
NODE_ENV="development"
FRONTEND_URL="http://localhost:3000"
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:5000/api
```

## API Endpoints

### Autenticación
```
POST   /api/auth/register       Registrar usuario
POST   /api/auth/login          Iniciar sesión
POST   /api/auth/refresh        Renovar token
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
GET    /api/auth/profile        Perfil del usuario autenticado
PUT    /api/auth/profile        Actualizar perfil
```

### Finanzas
```
GET/POST/PUT/DELETE  /api/incomes
GET/POST/PUT/DELETE  /api/expenses
GET/POST/PUT/DELETE  /api/debts
POST                 /api/debts/:id/payments
GET                  /api/debts/strategies
GET/POST/PUT/DELETE  /api/goals
POST                 /api/goals/:id/contributions
GET/POST/PUT/DELETE  /api/budgets
GET                  /api/dashboard
GET                  /api/recommendations
PATCH                /api/recommendations/:id/read
PATCH                /api/recommendations/:id/dismiss
GET                  /api/reports/monthly
GET                  /api/reports/annual
```

## Estructura del Proyecto

```
finanzas-app/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       Esquema de base de datos
│   │   └── seed.js             Datos de prueba
│   └── src/
│       ├── app.js              Servidor Express
│       ├── middleware/         Auth, errores, rate limiting
│       ├── controllers/        Lógica de controladores
│       ├── services/           Lógica de negocio
│       ├── routes/             Definición de rutas
│       └── utils/              Helpers y utilidades
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── layout/         Sidebar, Header, Layout
│       │   ├── ui/             Card, Button, Modal, Badge
│       │   └── charts/         Recharts components
│       ├── pages/              Dashboard, Ingresos, Gastos...
│       ├── services/           API client (Axios)
│       ├── store/              Zustand stores
│       └── utils/              Formatters
├── docker-compose.yml
└── README.md
```

## Comandos Útiles

```bash
# Abrir Prisma Studio (GUI de BD)
cd backend && npx prisma studio

# Generar nueva migración
cd backend && npx prisma migrate dev --name nombre_migracion

# Ver logs de todos los servicios (Docker)
docker compose logs -f

# Reconstruir solo el backend
docker compose up --build backend
```

## Seguridad Implementada

- Contraseñas hasheadas con bcrypt (12 rounds)
- JWT con expiración corta + refresh token
- Rate limiting en endpoints de auth (20 req/15min) y API (120 req/min)
- Headers de seguridad con Helmet
- CORS configurado para el origin del frontend
- Sanitización de inputs con express-validator
- Protección de rutas con middleware de autenticación
- Prisma previene SQL injection por diseño

## Próximas Funcionalidades

- [ ] Exportar reportes a PDF y Excel
- [ ] Notificaciones push (vencimiento de deudas, presupuestos)
- [ ] Predicción de gastos con IA
- [ ] Soporte multi-moneda con conversión en tiempo real
- [ ] PWA (Progressive Web App)
- [ ] Importar transacciones de bancos (CSV)

---

Desarrollado con React + Node.js + PostgreSQL + Prisma
