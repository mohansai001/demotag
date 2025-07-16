# ValueMomentum Hire Assist Portal - React Version

This is a complete React conversion of the ValueMomentum Hire Assist Portal recruitment management system. The application has been converted from vanilla HTML/CSS/JavaScript to a modern React application while maintaining all existing functionality.

## Features

- **Authentication**: Microsoft Azure AD integration using MSAL
- **Multi-role Support**: TAG Team, Panel Login, App EC Lead, Data EC Lead, Cloud EC Lead, Admin
- **Dashboard**: Interactive charts and statistics using Chart.js
- **Recruitment Management**: Complete recruitment workflow
- **Candidate Management**: Track and manage candidates
- **Interview Scheduling**: Schedule and manage interviews
- **Technical Assessments**: L1 Imocha, L2 Technical panels
- **Feedback System**: Comprehensive feedback forms
- **Reporting**: Various reports and analytics

## Technology Stack

### Frontend
- **React 18** - Modern React with hooks
- **React Router** - Client-side routing
- **MSAL React** - Microsoft Authentication Library
- **Chart.js** - Interactive charts and graphs
- **React Toastify** - Toast notifications
- **Font Awesome** - Icons
- **CSS3** - Styling with responsive design

### Backend
- **Node.js** - Server runtime
- **Express.js** - Web framework
- **PostgreSQL** - Database
- **CORS** - Cross-origin resource sharing
- **Nodemailer** - Email notifications
- **XLSX** - Excel file processing
- **Axios** - HTTP requests

## Project Structure

```
src/
├── components/
│   ├── common/
│   │   ├── Modal.js
│   │   ├── SidebarMenu.js
│   │   ├── Modal.css
│   │   └── SidebarMenu.css
│   ├── Login.js
│   ├── Dashboard.js
│   ├── Admin.js
│   ├── Panel.js
│   ├── Recruitment.js
│   ├── CandidatesPage.js
│   ├── InterviewSchedule.js
│   ├── TechnicalPanel.js
│   ├── L1Imocha.js
│   ├── L2Technical.js
│   ├── FeedbackForm.js
│   ├── FinalFeedback.js
│   ├── PrescreeningForm.js
│   ├── GTPrescreening.js
│   ├── AppRecruit.js
│   ├── DataRecruit.js
│   ├── CloudRecruit.js
│   ├── ECSelection.js
│   ├── ProjectFitment.js
│   ├── ECFitment.js
│   ├── ECUseCase.js
│   ├── JDTemplates.js
│   ├── CandidateStatus.js
│   ├── ExcelRead.js
│   ├── L1ImochaOnline.js
│   ├── L2AppTechnical.js
│   └── L2DataTechnical.js
├── config/
│   └── msalConfig.js
├── App.js
├── App.css
├── index.js
└── index.css
```

## Installation

1. **Install dependencies**:
```bash
npm install
```

2. **Environment Setup**:
   - Ensure PostgreSQL database is configured
   - Update MSAL configuration in `src/config/msalConfig.js`
   - Update database connection string in `api/nodecode.js`

3. **Development**:
```bash
# Start React development server
npm start

# Start backend server (in separate terminal)
npm run server
```

4. **Production Build**:
```bash
npm run build
```

## Key Conversion Changes

### Authentication
- Converted from vanilla MSAL to `@azure/msal-react`
- Implemented React Context for authentication state
- Added proper error handling and loading states

### Routing
- Replaced manual page navigation with React Router
- Implemented protected routes
- Added proper URL parameter handling

### Components
- Converted all HTML pages to React components
- Implemented proper state management with React hooks
- Added component lifecycle management

### Styling
- Reorganized CSS into component-specific files
- Maintained existing visual design
- Added responsive design improvements

### Charts
- Migrated from vanilla Chart.js to `react-chartjs-2`
- Implemented dynamic data fetching
- Added chart interaction capabilities

### Forms
- Converted HTML forms to controlled React components
- Added form validation
- Implemented proper event handling

## API Endpoints

The backend provides the following API endpoints:

- `POST /api/check-admin` - User authentication and role verification
- `GET /api/[role]-resume-count` - Get resume counts for different roles
- `POST /api/invite-candidate` - Invite candidates to assessments
- Various other endpoints for candidate management, interviews, etc.

## Database Schema

The application uses PostgreSQL with the following key tables:
- `admin_table` - User authentication and roles
- `candidates` - Candidate information
- `interviews` - Interview scheduling
- `assessments` - Technical assessments
- Various other tables for recruitment workflow

## Configuration

### MSAL Configuration
Update `src/config/msalConfig.js` with your Azure AD settings:

```javascript
export const msalConfig = {
  auth: {
    clientId: "your-client-id",
    authority: "https://login.microsoftonline.com/your-tenant-id",
    redirectUri: "your-redirect-uri",
  },
};
```

### Database Configuration
Update the connection string in `api/nodecode.js`:

```javascript
const connectionString = "your-postgresql-connection-string";
```

## Deployment

### Development
```bash
npm start
```

### Production
```bash
npm run build
npm run server
```

### Vercel Deployment
The application is configured for Vercel deployment with:
- React build served from `/build` directory
- API routes served from `/api` directory
- Proper CORS configuration for production

## Migration Notes

This React version maintains 100% functional compatibility with the original HTML/JavaScript application:

1. **All user workflows remain identical**
2. **All API endpoints are preserved**
3. **All database schemas are unchanged**
4. **All authentication flows work the same way**
5. **All charts and visualizations are preserved**

The main benefits of the React conversion:
- Better code organization and maintainability
- Improved performance with virtual DOM
- Better state management
- More robust error handling
- Easier testing and development
- Modern development workflow

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes while maintaining backward compatibility
4. Test thoroughly
5. Submit a pull request

## License

This project is proprietary software for ValueMomentum.