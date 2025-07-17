# React Project Folder Structure

```
src/
├── components/
│   ├── common/
│   │   ├── Toast.js ✓
│   │   ├── Sidebar.js ✓
│   │   ├── Modal.js
│   │   ├── LoadingSpinner.js
│   │   └── Header.js
│   ├── Login.js ✓
│   ├── Dashboard.js ✓
│   ├── ECSelection.js ✓
│   ├── Recruitment.js
│   ├── AppRecruit.js
│   ├── CloudRecruit.js
│   ├── DataRecruit.js
│   ├── CandidatesPage.js
│   ├── InterviewSchedule.js
│   ├── L1Imocha.js
│   ├── L2Technical.js
│   ├── L2AppTechnical.js
│   ├── L2DataTechnical.js
│   ├── PanelPage.js
│   ├── TechnicalPanel.js
│   ├── GTPreScreening.js
│   ├── PreScreeningForm.js
│   ├── UploadStatus.js
│   ├── ProjectFitment.js
│   ├── ECFitment.js
│   ├── ECUseCase.js
│   ├── ExistingCandidates.js
│   ├── CandidateStatus.js
│   ├── FeedbackForm.js
│   ├── FinalFeedback.js
│   ├── JdTemplates.js
│   ├── ExcelRead.js
│   ├── Admin.js
│   ├── Panel.js
│   ├── Imocha.js
│   └── L1ImochaOnline.js
├── hooks/
│   ├── useAuth.js
│   ├── useApi.js
│   └── useLocalStorage.js
├── services/
│   ├── api.js
│   ├── auth.js
│   └── constants.js
├── utils/
│   ├── helpers.js
│   ├── validators.js
│   └── formatters.js
├── App.js ✓
├── index.js ✓
└── index.css ✓

public/
├── index.html ✓
├── favicon.ico
├── logo.png ✓
├── teams.png ✓
├── vam.png ✓
├── assets/
│   └── (other static assets)
└── javascript/ (legacy - can be removed after conversion)
    └── (original JS files for reference)

api/
└── nodecode.js ✓ (backend - unchanged)

Root Files:
├── package.json ✓
├── package-lock.json ✓
├── vercel.json ✓
└── README.md (to be created)
```

## Key Features Preserved:

### Authentication & Authorization
- MSAL integration for Microsoft authentication
- Team-based access control
- Admin login functionality
- Session management

### Dashboard & Analytics
- Real-time charts using Chart.js and react-chartjs-2
- Multiple chart types (doughnut, bar)
- Data visualization for different teams
- Interactive dashboard cards

### Recruitment Management
- Role-based recruitment flows
- File upload functionality
- Candidate management
- Interview scheduling
- Technical assessments

### Data Management
- API integration with existing backend
- Local storage for session data
- Form handling and validation
- File processing

### UI/UX Components
- Responsive design
- Toast notifications
- Modal dialogs
- Loading states
- Sidebar navigation

## Dependencies Added:
- react & react-dom (18.2.0)
- react-router-dom (6.8.0)
- react-scripts (5.0.1)
- chart.js (4.2.1)
- react-chartjs-2 (5.2.0)
- chartjs-plugin-datalabels (2.2.0)
- html2canvas (1.4.1)
- pptxgenjs (3.12.0)

## External Dependencies (CDN):
- MSAL Browser (2.37.0)
- Chart.js
- HTML2Canvas
- PPTXGenJS
- ChartJS Plugin DataLabels
- Font Awesome (6.4.0)

## Backend API Endpoints (Preserved):
All existing API endpoints in `api/nodecode.js` remain unchanged and are used by the React components.

## Conversion Status:
✓ = Completed
- Basic structure and routing
- Authentication system
- Dashboard with charts
- Core navigation
- Toast notifications
- EC Selection

Remaining components will follow the same pattern, preserving all original functionality while converting to React structure.