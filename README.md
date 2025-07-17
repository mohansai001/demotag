# TAG AI - Recruitment Portal (React Version)

A comprehensive recruitment management system built with React, featuring Microsoft Azure authentication, real-time analytics, and automated candidate processing.

## 🚀 Features

### Authentication & Authorization
- **Microsoft Azure AD Integration** - MSAL-based authentication
- **Role-based Access Control** - Team-specific permissions (TAG, Panel, EC Leads, Admin)
- **Session Management** - Secure user sessions with automatic refresh

### Dashboard & Analytics
- **Real-time Charts** - Interactive charts using Chart.js and react-chartjs-2
- **Multi-team Visualization** - Separate analytics for Cloud, App, and Data teams
- **Dynamic Data Updates** - Live candidate count updates
- **Export Capabilities** - PPT generation and screenshot functionality

### Recruitment Management
- **Multi-role Support** - Cloud Native App Engineers, Data Engineers, Cloud Platform Engineers
- **Automated Job Descriptions** - Dynamic JD fetching based on role and cloud provider
- **Resume Processing** - Multi-format support (PDF, DOC, DOCX) with conversion
- **Bulk Upload** - Multiple resume processing with progress tracking

### Candidate Management
- **Status Tracking** - Real-time candidate status updates
- **Interview Scheduling** - Integrated calendar and notification system
- **Technical Assessments** - L1/L2 technical evaluation workflows
- **Feedback Collection** - Structured feedback forms and final assessments

## 🛠️ Tech Stack

### Frontend
- **React 18.2.0** - Main framework
- **React Router 6.8.0** - Client-side routing
- **Chart.js 4.2.1** - Data visualization
- **React ChartJS 2** - React wrapper for Chart.js
- **MSAL Browser** - Microsoft authentication

### Backend
- **Node.js & Express** - API server
- **PostgreSQL** - Database
- **Multer** - File upload handling
- **NodeMailer** - Email notifications
- **XLSX** - Excel file processing

### External Services
- **Microsoft Azure AD** - Authentication
- **iMocha API** - Technical assessments
- **Vercel** - Deployment platform

## 📁 Project Structure

```
src/
├── components/
│   ├── common/
│   │   ├── Toast.js              # Notification system
│   │   ├── Sidebar.js            # Navigation sidebar
│   │   └── Modal.js              # Reusable modal component
│   ├── Login.js                  # Authentication page
│   ├── Dashboard.js              # Main dashboard with charts
│   ├── ECSelection.js            # Role selection interface
│   ├── Recruitment.js            # Recruitment hub
│   ├── AppRecruit.js             # Application recruitment
│   ├── CloudRecruit.js           # Cloud recruitment
│   ├── DataRecruit.js            # Data recruitment
│   ├── CandidatesPage.js         # Candidate management
│   ├── UploadStatus.js           # File upload tracking
│   └── [Additional Components]   # Other feature components
├── App.js                        # Main application component
├── index.js                      # React entry point
└── index.css                     # Global styles

public/
├── index.html                    # HTML template
├── logo.png                      # Company logo
├── teams.png                     # Team images
└── assets/                       # Static assets

api/
└── nodecode.js                   # Express server & API endpoints
```

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn
- PostgreSQL database
- Microsoft Azure AD application

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd tag-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   
   Create a `.env` file in the root directory:
   ```env
   # Database
   DATABASE_URL=postgresql://username:password@host:port/database
   
   # Azure AD
   AZURE_CLIENT_ID=your-client-id
   AZURE_TENANT_ID=your-tenant-id
   
   # API Keys
   IMOCHA_API_KEY=your-imocha-api-key
   GITHUB_TOKEN=your-github-token
   
   # Email Configuration
   SMTP_HOST=your-smtp-host
   SMTP_USER=your-smtp-user
   SMTP_PASS=your-smtp-password
   ```

4. **Database Setup**
   
   Run the database migrations (SQL scripts should be provided separately):
   ```bash
   # Connect to your PostgreSQL database and run the schema
   psql -d your_database -f schema.sql
   ```

5. **Start Development Servers**
   
   **Backend (API Server):**
   ```bash
   npm start
   ```
   
   **Frontend (React Development):**
   ```bash
   npm run dev
   ```

6. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3000/api

## 🔧 Configuration

### Microsoft Azure AD Setup

1. **Register Application** in Azure AD
2. **Configure Redirect URIs**:
   - Development: `http://localhost:3000`
   - Production: `https://your-domain.com`
3. **Set API Permissions**:
   - `User.Read`
   - `Mail.Send`
   - `openid`
   - `profile`

### Database Configuration

The application uses PostgreSQL with the following main tables:
- `admin_table` - User access control
- `candidates` - Candidate information
- `interviews` - Interview scheduling
- `feedback` - Assessment feedback
- `upload_logs` - File upload tracking

## 📊 API Endpoints

### Authentication
- `POST /api/check-admin` - Verify user access
- `POST /api/log-login` - Log user login

### Candidates
- `GET /api/candidate-counts` - Get candidate statistics
- `GET /api/candidates` - List candidates
- `POST /api/upload-resume` - Upload candidate resume
- `PUT /api/candidate-status` - Update candidate status

### Assessments
- `POST /api/invite-candidate` - Send iMocha invitation
- `GET /api/test-results/:id` - Get assessment results
- `POST /api/schedule-interview` - Schedule interview

### Analytics
- `GET /api/devops-resume-count` - DevOps candidate count
- `GET /api/platform-resume-count` - Platform candidate count
- `GET /api/dataengineer-resume-count` - Data engineer count
- [Additional analytics endpoints...]

## 🎨 Component Usage

### Toast Notifications
```jsx
import { showToast } from './utils/toast';

// Success notification
showToast('Operation completed successfully', 'success');

// Error notification
showToast('Something went wrong', 'error');
```

### Modal Component
```jsx
import Modal from './components/common/Modal';

<Modal
  show={showModal}
  onClose={() => setShowModal(false)}
  title="Modal Title"
  size="large"
>
  <p>Modal content goes here</p>
</Modal>
```

### Chart Integration
```jsx
import { Doughnut, Bar } from 'react-chartjs-2';

const chartData = {
  labels: ['Label1', 'Label2'],
  datasets: [{
    data: [10, 20],
    backgroundColor: ['#FF6384', '#36A2EB']
  }]
};

<Doughnut data={chartData} options={chartOptions} />
```

## 🔐 Security Features

- **CSRF Protection** - Cross-site request forgery prevention
- **Input Validation** - Server-side validation for all inputs
- **File Upload Security** - Restricted file types and size limits
- **SQL Injection Prevention** - Parameterized queries
- **XSS Protection** - Content sanitization

## 📱 Responsive Design

The application is fully responsive and works on:
- Desktop (1920x1080+)
- Tablet (768px - 1024px)
- Mobile (320px - 767px)

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Vercel Deployment
```bash
vercel --prod
```

## 🧪 Testing

### Run Tests
```bash
npm test
```

### Test Coverage
```bash
npm run test:coverage
```

## 📈 Performance Optimization

- **Code Splitting** - Lazy loading of components
- **Chart Optimization** - Efficient chart rendering
- **Image Optimization** - Compressed assets
- **Caching Strategy** - API response caching
- **Bundle Analysis** - Webpack bundle analyzer

## 🔄 Migration from Original

### Key Changes
1. **HTML → React Components** - All HTML files converted to React components
2. **Vanilla JS → React Hooks** - State management with useState/useEffect
3. **Direct DOM → Virtual DOM** - React's virtual DOM rendering
4. **Page Routing → React Router** - Client-side routing
5. **Global State → Component State** - Localized state management

### Preserved Functionality
- ✅ All original features maintained
- ✅ API endpoints unchanged
- ✅ Authentication flow preserved
- ✅ Chart functionality intact
- ✅ File upload capabilities
- ✅ Email notifications
- ✅ Database interactions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Contact the development team
- Check the documentation

## 🔮 Future Enhancements

- [ ] Real-time notifications with WebSocket
- [ ] Advanced analytics dashboard
- [ ] Mobile app development
- [ ] AI-powered candidate matching
- [ ] Integration with more assessment platforms
- [ ] Advanced reporting features

---

**Note**: This is a converted React version of the original HTML/JavaScript application. All functionality has been preserved while modernizing the codebase with React best practices.