#!/bin/bash

echo "Dashboard App Setup Script"
echo "========================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo -e "\n${YELLOW}Checking prerequisites...${NC}"

if ! command_exists node; then
    echo -e "${RED}Node.js is not installed. Please install Node.js v14 or higher.${NC}"
    exit 1
fi

if ! command_exists npm; then
    echo -e "${RED}npm is not installed. Please install npm.${NC}"
    exit 1
fi

if ! command_exists psql; then
    echo -e "${YELLOW}Warning: PostgreSQL client not found. Make sure PostgreSQL is installed and running.${NC}"
fi

echo -e "${GREEN}Prerequisites check complete!${NC}"

# Backend setup
echo -e "\n${YELLOW}Setting up backend...${NC}"
cd backend

if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${GREEN}Created backend .env file. Please update it with your database credentials.${NC}"
else
    echo -e "${YELLOW}Backend .env file already exists.${NC}"
fi

echo "Installing backend dependencies..."
npm install

# Frontend setup
echo -e "\n${YELLOW}Setting up frontend...${NC}"
cd ../frontend

if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${GREEN}Created frontend .env file.${NC}"
else
    echo -e "${YELLOW}Frontend .env file already exists.${NC}"
fi

echo "Installing frontend dependencies..."
npm install

# Final instructions
echo -e "\n${GREEN}Setup complete!${NC}"
echo -e "\n${YELLOW}Next steps:${NC}"
echo "1. Create a PostgreSQL database named 'dashboard_db'"
echo "2. Update backend/.env with your database credentials"
echo "3. Run 'npm run dev' in the backend directory"
echo "4. Run 'npm start' in the frontend directory"
echo -e "\n${GREEN}Happy coding!${NC}"