#!/bin/bash

# Dashboard Application Setup Script
echo "🚀 Setting up Dashboard Application..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    print_error "PostgreSQL is not installed. Please install PostgreSQL 12+ and try again."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18+ is required. Current version: $(node --version)"
    exit 1
fi

print_status "Node.js version: $(node --version) ✓"
print_status "PostgreSQL version: $(psql --version) ✓"

# Setup Backend
print_status "Setting up backend..."
cd backend

# Install backend dependencies
print_status "Installing backend dependencies..."
npm install

if [ $? -ne 0 ]; then
    print_error "Failed to install backend dependencies"
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    print_status "Creating .env file..."
    cp .env.example .env
    print_warning "Please edit backend/.env file with your database credentials before running the application"
else
    print_status ".env file already exists"
fi

# Create logs directory
mkdir -p logs

print_status "Backend setup complete ✓"

# Setup Frontend
print_status "Setting up frontend..."
cd ../frontend

# Install frontend dependencies
print_status "Installing frontend dependencies..."
npm install

if [ $? -ne 0 ]; then
    print_error "Failed to install frontend dependencies"
    exit 1
fi

# Create .env.local file if it doesn't exist
if [ ! -f .env.local ]; then
    print_status "Creating frontend .env.local file..."
    echo "VITE_API_BASE_URL=http://localhost:5000/api/v1" > .env.local
else
    print_status ".env.local file already exists"
fi

print_status "Frontend setup complete ✓"

# Go back to root directory
cd ..

print_status "Setup completed successfully! 🎉"
echo ""
echo "📋 Next steps:"
echo "1. Edit backend/.env file with your PostgreSQL credentials"
echo "2. Create PostgreSQL database: createdb dashboard_db"
echo "3. Run database migrations: cd backend && npm run migrate"
echo "4. Start backend server: cd backend && npm run dev"
echo "5. Start frontend server: cd frontend && npm run dev"
echo ""
echo "🌐 Access the application:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:5000"
echo ""
echo "📚 For detailed instructions, see README.md"