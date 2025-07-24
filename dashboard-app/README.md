# Dashboard Application

A modern full-stack dashboard application built with React.js, Node.js, Express, PostgreSQL, and Material-UI.

## Features

- 🔐 **Authentication & Authorization**: JWT-based authentication with role-based access control
- 📊 **Interactive Dashboard**: Real-time statistics, charts, and activity tracking
- 🎨 **Modern UI**: Beautiful and responsive design using Material-UI
- 📱 **Mobile Responsive**: Works seamlessly on desktop and mobile devices
- 🔄 **Real-time Updates**: Auto-refreshing dashboard data
- 📈 **Data Visualization**: Charts and graphs using Recharts
- 🛡️ **Security**: Helmet.js, bcrypt, and secure authentication practices
- 📝 **Logging**: Comprehensive logging with Winston
- 🚀 **Performance**: Optimized with React Query for data fetching

## Tech Stack

### Frontend
- React.js with TypeScript
- Material-UI (MUI) for UI components
- React Router for navigation
- React Query for data fetching
- React Hook Form for form handling
- Recharts for data visualization
- Axios for API calls

### Backend
- Node.js with Express.js
- PostgreSQL database
- JWT for authentication
- bcrypt for password hashing
- Winston for logging
- Helmet.js for security

## Project Structure

```
dashboard-app/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable React components
│   │   ├── contexts/        # React contexts (Auth)
│   │   ├── hooks/          # Custom React hooks
│   │   ├── pages/          # Page components
│   │   ├── services/       # API service functions
│   │   ├── theme/          # Material-UI theme configuration
│   │   ├── types/          # TypeScript type definitions
│   │   └── utils/          # Utility functions
│   └── public/             # Static files
│
├── backend/                 # Node.js backend application
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Express middleware
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── utils/          # Utility functions
│   │   └── validators/     # Input validators
│   └── logs/               # Application logs
│
└── README.md               # Project documentation
```

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd dashboard-app
```

### 2. Setup Backend

```bash
cd backend
npm install
```

Create a `.env` file:
```bash
cp .env.example .env
```

Update the `.env` file with your database credentials and other configurations.

Create the PostgreSQL database:
```sql
CREATE DATABASE dashboard_db;
```

### 3. Setup Frontend

```bash
cd ../frontend
npm install
```

Create a `.env` file:
```bash
cp .env.example .env
```

## Running the Application

### Development Mode

1. Start the backend server:
```bash
cd backend
npm run dev
```

2. In a new terminal, start the frontend:
```bash
cd frontend
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

### Production Mode

1. Build the frontend:
```bash
cd frontend
npm run build
```

2. Start the backend in production mode:
```bash
cd backend
npm start
```

## API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/password` - Change password

### Dashboard Endpoints
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/widgets` - Get user widgets
- `POST /api/dashboard/widgets` - Create new widget
- `PUT /api/dashboard/widgets/:id` - Update widget
- `DELETE /api/dashboard/widgets/:id` - Delete widget
- `PUT /api/dashboard/widgets/reorder` - Reorder widgets

## Default Credentials

For testing purposes, you can register a new account or use these credentials after setting up the database:
- Create a new account via the registration page

## Features in Detail

### Dashboard
- Real-time statistics display
- Activity tracking and visualization
- Customizable widgets
- Admin panel (for admin users)

### User Management
- User registration and login
- Profile management
- Password change functionality
- Role-based access control

### Security Features
- JWT token authentication
- Password hashing with bcrypt
- Secure HTTP headers with Helmet.js
- Input validation
- SQL injection prevention

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.

## Support

For support, please open an issue in the GitHub repository or contact the maintainers.