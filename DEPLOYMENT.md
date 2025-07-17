# Deployment Guide - TAG AI Recruitment Portal

## Overview
This guide covers the deployment of the React-based TAG AI Recruitment Portal, including both development and production environments.

## Prerequisites

### System Requirements
- Node.js 16.x or higher
- npm 8.x or higher
- PostgreSQL 12.x or higher
- Git

### External Services
- Microsoft Azure AD tenant
- Vercel account (for production deployment)
- PostgreSQL database (cloud or on-premise)
- SMTP server for email notifications

## Environment Setup

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd tag-ai

# Install dependencies
npm install

# Install additional dependencies if needed
npm install @azure/msal-browser @azure/msal-react
```

### 2. Environment Variables

Create a `.env` file in the root directory:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@host:port/database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tag_ai_db
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# Azure AD Configuration
AZURE_CLIENT_ID=ed0b1bf7-b012-4e13-a526-b696932c0673
AZURE_TENANT_ID=13085c86-4bcb-460a-a6f0-b373421c6323
AZURE_AUTHORITY=https://login.microsoftonline.com/13085c86-4bcb-460a-a6f0-b373421c6323

# API Configuration
IMOCHA_API_KEY=JHuaeAvDQsGfJxlHYpeJwFOxySVrdm
IMOCHA_BASE_URL=https://apiv3.imocha.io/v3
GITHUB_TOKEN=your_github_token

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@company.com
SMTP_PASSWORD=your_app_password
SMTP_FROM=noreply@company.com

# Application Configuration
NODE_ENV=development
PORT=3000
REACT_APP_API_URL=http://localhost:3000/api
```

### 3. Database Setup

```sql
-- Create database
CREATE DATABASE tag_ai_db;

-- Create user (if needed)
CREATE USER tag_ai_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE tag_ai_db TO tag_ai_user;

-- Run your schema migrations
-- (SQL files should be provided separately)
```

## Development Deployment

### 1. Start Development Server

```bash
# Start backend API server
npm start

# In another terminal, start React development server
npm run dev
```

### 2. Verify Installation

- Frontend: http://localhost:3000
- Backend API: http://localhost:3000/api
- Health check: http://localhost:3000/api/health

## Production Deployment

### Option 1: Vercel Deployment (Recommended)

#### 1. Prepare for Vercel

```bash
# Build the React app
npm run build

# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login
```

#### 2. Configure Vercel

Create `vercel.json` in root directory:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/nodecode.js",
      "use": "@vercel/node"
    },
    {
      "src": "build/**/*",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/nodecode.js"
    },
    {
      "src": "/(.*)",
      "dest": "/build/$1"
    }
  ],
  "env": {
    "DATABASE_URL": "@database_url",
    "AZURE_CLIENT_ID": "@azure_client_id",
    "AZURE_TENANT_ID": "@azure_tenant_id",
    "IMOCHA_API_KEY": "@imocha_api_key",
    "SMTP_HOST": "@smtp_host",
    "SMTP_USER": "@smtp_user",
    "SMTP_PASSWORD": "@smtp_password"
  }
}
```

#### 3. Deploy to Vercel

```bash
# Deploy to Vercel
vercel --prod

# Set environment variables
vercel env add DATABASE_URL
vercel env add AZURE_CLIENT_ID
vercel env add AZURE_TENANT_ID
# ... add all other environment variables
```

### Option 2: Traditional Server Deployment

#### 1. Prepare Production Build

```bash
# Build React app
npm run build

# Copy files to server
scp -r . user@server:/path/to/app/

# On server, install dependencies
npm install --production
```

#### 2. Process Manager (PM2)

```bash
# Install PM2
npm install -g pm2

# Create ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'tag-ai',
    script: 'api/nodecode.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
EOF

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### 3. Nginx Configuration

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # Serve React static files
    location / {
        root /path/to/app/build;
        try_files $uri $uri/ /index.html;
    }
    
    # API proxy
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Database Migration

### Production Database Setup

```bash
# Connect to production database
psql -h your-db-host -U your-db-user -d your-db-name

# Run migrations
\i schema.sql
\i data.sql
```

### Backup Strategy

```bash
# Create backup script
cat > backup.sh << EOF
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -h $DB_HOST -U $DB_USER $DB_NAME > backup_$DATE.sql
aws s3 cp backup_$DATE.sql s3://your-backup-bucket/
EOF

# Schedule with cron
crontab -e
# Add: 0 2 * * * /path/to/backup.sh
```

## SSL/HTTPS Configuration

### Let's Encrypt (for traditional deployment)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## Monitoring and Logging

### Application Monitoring

```bash
# Install monitoring tools
npm install --save express-winston winston

# Add to nodecode.js
const winston = require('winston');
const expressWinston = require('express-winston');

app.use(expressWinston.logger({
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'app.log' })
  ]
}));
```

### Health Checks

Add to `api/nodecode.js`:

```javascript
// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});
```

## Security Considerations

### 1. Environment Variables
- Never commit `.env` files
- Use secure environment variable management
- Rotate secrets regularly

### 2. Database Security
- Use SSL connections
- Implement proper access controls
- Regular security updates

### 3. Application Security
- Keep dependencies updated
- Implement rate limiting
- Use HTTPS in production
- Validate all inputs

## Troubleshooting

### Common Issues

#### 1. MSAL Authentication Errors
```bash
# Check Azure AD configuration
# Verify redirect URIs match deployment URL
# Ensure proper permissions are set
```

#### 2. Database Connection Issues
```bash
# Test database connection
node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT NOW()', (err, res) => {
  console.log(err ? err : res.rows[0]);
  pool.end();
});
"
```

#### 3. Build Errors
```bash
# Clear cache and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Logs and Debugging

```bash
# View application logs
pm2 logs tag-ai

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Database logs
sudo tail -f /var/log/postgresql/postgresql-*.log
```

## Performance Optimization

### 1. Frontend Optimization
```bash
# Analyze bundle size
npm run build
npx webpack-bundle-analyzer build/static/js/*.js
```

### 2. Backend Optimization
```javascript
// Add compression
const compression = require('compression');
app.use(compression());

// Add caching
const redis = require('redis');
const client = redis.createClient();
```

### 3. Database Optimization
```sql
-- Add indexes for frequently queried columns
CREATE INDEX idx_candidates_email ON candidates(email);
CREATE INDEX idx_candidates_status ON candidates(status);
CREATE INDEX idx_interviews_date ON interviews(interview_date);
```

## Maintenance

### Regular Tasks
- [ ] Update dependencies monthly
- [ ] Review and rotate secrets quarterly
- [ ] Database maintenance and optimization
- [ ] Log rotation and cleanup
- [ ] Security updates
- [ ] Performance monitoring

### Backup Verification
```bash
# Test backup restoration
pg_restore -h localhost -U test_user -d test_db backup_file.sql
```

## Support and Documentation

### Getting Help
- Check logs first
- Review environment variables
- Verify external service connectivity
- Contact development team

### Documentation Updates
- Update this guide when deployment process changes
- Document any custom configurations
- Maintain troubleshooting knowledge base

---

**Note**: This deployment guide covers the React version of the TAG AI Recruitment Portal. Ensure all environment variables and external services are properly configured before deployment.