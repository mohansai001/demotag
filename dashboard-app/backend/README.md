# Dashboard Backend API

A robust Node.js backend API built with Express.js and PostgreSQL for the dashboard application.

## Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **Database**: PostgreSQL with connection pooling
- **Security**: Helmet.js for security headers, bcrypt for password hashing
- **Logging**: Winston logger with file and console transports
- **Validation**: Input validation using express-validator
- **Error Handling**: Centralized error handling middleware
- **API Documentation**: RESTful API design

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Update the `.env` file with your configuration:
```env
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=dashboard_db
DB_USER=your_db_user
DB_PASSWORD=your_db_password
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:3000
LOG_LEVEL=info
```

4. Create the PostgreSQL database:
```sql
CREATE DATABASE dashboard_db;
```

## Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (Protected)
- `PUT /api/auth/profile` - Update user profile (Protected)
- `PUT /api/auth/password` - Change password (Protected)

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics (Protected)
- `GET /api/dashboard/widgets` - Get user widgets (Protected)
- `POST /api/dashboard/widgets` - Create new widget (Protected)
- `PUT /api/dashboard/widgets/:id` - Update widget (Protected)
- `DELETE /api/dashboard/widgets/:id` - Delete widget (Protected)
- `PUT /api/dashboard/widgets/reorder` - Reorder widgets (Protected)

### Health Check
- `GET /api/health` - API health check

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js     # Database configuration and initialization
│   │   └── logger.js       # Winston logger configuration
│   ├── controllers/
│   │   ├── authController.js      # Authentication logic
│   │   └── dashboardController.js # Dashboard logic
│   ├── middleware/
│   │   ├── auth.js         # JWT authentication middleware
│   │   └── errorHandler.js # Error handling middleware
│   ├── routes/
│   │   ├── authRoutes.js      # Authentication routes
│   │   └── dashboardRoutes.js # Dashboard routes
│   ├── validators/
│   │   └── authValidators.js  # Input validation rules
│   ├── app.js              # Express app configuration
│   └── server.js           # Server entry point
├── logs/                   # Log files directory
├── .env.example           # Environment variables example
├── .gitignore            # Git ignore file
├── package.json          # Project dependencies
└── README.md            # Project documentation
```

## Database Schema

### Users Table
- `id` - Primary key
- `username` - Unique username
- `email` - Unique email
- `password` - Hashed password
- `first_name` - User's first name
- `last_name` - User's last name
- `role` - User role (default: 'user')
- `is_active` - Account status
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

### Dashboard Widgets Table
- `id` - Primary key
- `user_id` - Foreign key to users
- `widget_type` - Type of widget
- `position` - Widget position
- `settings` - Widget settings (JSONB)
- `is_visible` - Widget visibility
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

### Activities Table
- `id` - Primary key
- `user_id` - Foreign key to users
- `action` - Activity action
- `description` - Activity description
- `metadata` - Additional data (JSONB)
- `created_at` - Creation timestamp

### Notifications Table
- `id` - Primary key
- `user_id` - Foreign key to users
- `title` - Notification title
- `message` - Notification message
- `type` - Notification type
- `is_read` - Read status
- `created_at` - Creation timestamp
- `read_at` - Read timestamp

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Helmet.js for security headers
- CORS configuration
- Input validation
- SQL injection prevention
- Rate limiting (can be added)

## Logging

The application uses Winston for logging with the following levels:
- `error`: Error messages
- `warn`: Warning messages
- `info`: Informational messages
- `debug`: Debug messages

Logs are written to:
- `logs/error.log` - Error logs only
- `logs/combined.log` - All logs
- Console output in development mode

## Error Handling

Centralized error handling with:
- Custom error messages
- Proper HTTP status codes
- Stack traces in development mode
- Error logging

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.