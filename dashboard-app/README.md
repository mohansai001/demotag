# Dashboard Application

A modern, full-stack dashboard application built with React.js, Node.js, Express, and PostgreSQL. Features a clean Material-UI design, comprehensive authentication, real-time analytics, and robust backend architecture.

## 🚀 Features

### Frontend (React.js + Material-UI)
- **Modern UI/UX**: Clean, responsive design with Material-UI components
- **Authentication**: Secure login/register with JWT tokens
- **Dashboard Analytics**: Interactive charts and real-time metrics
- **Transaction Management**: CRUD operations for financial transactions
- **User Management**: Profile management and role-based access
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **State Management**: React Query for server state management
- **Type Safety**: Full TypeScript implementation

### Backend (Node.js + Express)
- **RESTful API**: Well-structured API endpoints with proper HTTP status codes
- **Authentication & Authorization**: JWT-based auth with role-based access control
- **Database Integration**: PostgreSQL with Knex.js query builder
- **Validation**: Request validation using Joi
- **Logging**: Comprehensive logging with Winston
- **Security**: Helmet, CORS, rate limiting, and input sanitization
- **Error Handling**: Centralized error handling with proper logging
- **Database Migrations**: Version-controlled database schema changes

### Database (PostgreSQL)
- **Normalized Schema**: Properly designed tables with relationships
- **Indexing**: Optimized queries with appropriate indexes
- **Migrations**: Version-controlled schema changes
- **Seed Data**: Sample data for development

## 🏗️ Architecture

```
dashboard-app/
├── backend/                 # Node.js/Express API
│   ├── src/
│   │   ├── config/         # Database, logging configuration
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/     # Auth, validation, logging middleware
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic services
│   │   ├── utils/          # Utility functions
│   │   ├── migrations/     # Database migrations
│   │   └── seeds/          # Database seed files
│   ├── logs/               # Application logs
│   └── tests/              # Unit and integration tests
├── frontend/               # React.js application
│   ├── src/
│   │   ├── components/     # Reusable React components
│   │   │   ├── common/     # Common UI components
│   │   │   ├── dashboard/  # Dashboard-specific components
│   │   │   ├── auth/       # Authentication components
│   │   │   └── layout/     # Layout components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API service functions
│   │   ├── contexts/       # React contexts
│   │   ├── utils/          # Utility functions
│   │   └── assets/         # Static assets
│   └── public/             # Public assets
└── docs/                   # Documentation
```

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern React with hooks and concurrent features
- **TypeScript** - Type safety and better development experience
- **Material-UI (MUI) 5** - Modern React component library
- **React Router 6** - Client-side routing
- **React Query** - Server state management and caching
- **Axios** - HTTP client for API requests
- **Formik + Yup** - Form handling and validation
- **Recharts** - Data visualization and charts
- **Vite** - Fast build tool and development server

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **TypeScript** - Type safety for backend code
- **PostgreSQL** - Relational database
- **Knex.js** - SQL query builder and migrations
- **JWT** - JSON Web Tokens for authentication
- **Joi** - Request validation
- **Winston** - Logging library
- **Helmet** - Security middleware
- **bcryptjs** - Password hashing

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 12+
- Git

### 1. Clone the Repository
```bash
git clone <repository-url>
cd dashboard-app
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env file with your database credentials
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=dashboard_db
# DB_USER=postgres
# DB_PASSWORD=your_password
# JWT_SECRET=your-super-secret-jwt-key

# Create PostgreSQL database
createdb dashboard_db

# Run migrations
npm run migrate

# Seed database (optional)
npm run seed

# Start development server
npm run dev
```

### 3. Frontend Setup

```bash
# Open new terminal and navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create environment file (optional)
echo "VITE_API_BASE_URL=http://localhost:5000/api/v1" > .env.local

# Start development server
npm run dev
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Documentation**: http://localhost:5000/api/v1/health

## 🔧 Development

### Backend Development
```bash
cd backend

# Start with auto-reload
npm run dev

# Run tests
npm test

# Run linting
npm run lint

# Check types
npm run type-check
```

### Frontend Development
```bash
cd frontend

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint

# Type checking
npm run type-check
```

### Database Operations
```bash
cd backend

# Create new migration
npx knex migrate:make migration_name

# Run migrations
npm run migrate

# Rollback last migration
npm run migrate:rollback

# Create seed file
npx knex seed:make seed_name

# Run seeds
npm run seed
```

## 🚀 Production Deployment

### Environment Variables

#### Backend (.env)
```env
NODE_ENV=production
PORT=5000
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=dashboard_db
DB_USER=your-db-user
DB_PASSWORD=your-db-password
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h
CORS_ORIGIN=https://your-frontend-domain.com
LOG_LEVEL=info
```

#### Frontend (.env.production)
```env
VITE_API_BASE_URL=https://your-api-domain.com/api/v1
```

### Build Commands
```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend
npm run build
# Serve the dist/ folder with your preferred web server
```

## 📝 API Documentation

### Authentication Endpoints
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/auth/profile` - Get user profile
- `PUT /api/v1/auth/profile` - Update user profile
- `POST /api/v1/auth/change-password` - Change password
- `POST /api/v1/auth/logout` - Logout user
- `GET /api/v1/auth/verify` - Verify JWT token

### Dashboard Endpoints
- `GET /api/v1/dashboard/overview` - Dashboard overview data
- `GET /api/v1/dashboard/widgets` - Dashboard widgets data
- `GET /api/v1/dashboard/revenue` - Revenue analytics
- `GET /api/v1/dashboard/transactions` - Transaction analytics
- `GET /api/v1/dashboard/metrics` - Custom metrics
- `GET /api/v1/dashboard/activity` - Recent activity

### Transaction Endpoints
- `GET /api/v1/transactions` - List transactions
- `POST /api/v1/transactions` - Create transaction
- `GET /api/v1/transactions/:id` - Get transaction by ID
- `PUT /api/v1/transactions/:id` - Update transaction
- `DELETE /api/v1/transactions/:id` - Delete transaction

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
npm run test:watch
npm run test:coverage
```

### Frontend Tests
```bash
cd frontend
npm test
npm run test:watch
npm run test:coverage
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](../../issues) page
2. Create a new issue with detailed information
3. Provide steps to reproduce the problem
4. Include relevant error messages and logs

## 🔮 Future Enhancements

- [ ] Real-time notifications with WebSocket
- [ ] Advanced data visualization with D3.js
- [ ] Export functionality (PDF, Excel)
- [ ] Advanced filtering and search
- [ ] Mobile app with React Native
- [ ] Docker containerization
- [ ] CI/CD pipeline setup
- [ ] Performance monitoring
- [ ] Automated testing suite
- [ ] API rate limiting per user
- [ ] Advanced user roles and permissions
- [ ] Multi-tenant support
- [ ] Internationalization (i18n)
- [ ] Dark mode theme
- [ ] Advanced analytics and reporting