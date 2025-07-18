# Recruitment Portal - React Migration

This project has been migrated from a vanilla JavaScript application to a modern React.js application while maintaining the same functionality and backend API.

## 🚀 What's Changed

### Frontend Migration
- **From**: Multiple HTML files with vanilla JavaScript
- **To**: Single-page React application with component-based architecture
- **Benefits**: 
  - Better code organization and maintainability
  - Improved performance with virtual DOM
  - Modern development tools and debugging
  - Component reusability
  - Better state management

### Key Features Migrated
- ✅ **Login System** - MSAL authentication with team selection
- ✅ **Dashboard** - Interactive charts and statistics
- ✅ **Recruitment Management** - Job posting and management
- ✅ **Toast Notifications** - User feedback system
- ✅ **Responsive Design** - Mobile-friendly interface
- 🔄 **Candidates Management** - (In Progress)
- 🔄 **Interview Scheduling** - (In Progress)
- 🔄 **Panel Management** - (In Progress)
- 🔄 **Feedback System** - (In Progress)
- 🔄 **Admin Panel** - (In Progress)

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- PostgreSQL database (existing setup)

## 🛠️ Installation & Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Development Mode
To run both React frontend and Node.js backend simultaneously:
```bash
npm run dev
```

This will start:
- React development server on `http://localhost:3000`
- Node.js backend server on `http://localhost:3000` (or your configured PORT)

### 3. Production Build
```bash
npm run build
npm start
```

## 🗂️ Project Structure

```
├── src/                    # React source code
│   ├── components/         # React components
│   │   ├── Login.js       # Authentication component
│   │   ├── Dashboard.js   # Main dashboard with charts
│   │   ├── Recruitment.js # Job management
│   │   ├── Toast.js       # Notification system
│   │   └── ...
│   ├── App.js             # Main app component with routing
│   ├── App.css            # Global styles
│   └── index.js           # React entry point
├── public/                 # Static files and old HTML files
├── api/                    # Backend API (unchanged)
│   └── nodecode.js        # Express server
├── package.json           # Dependencies and scripts
└── README.md              # This file
```

## 🔧 Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development mode (React + Node.js)
- `npm run client` - Start React development server only
- `npm run server` - Start Node.js server only
- `npm run build` - Build React app for production
- `npm test` - Run tests

## 🌟 Key Components

### Login Component
- Handles MSAL authentication
- Team selection (TAG, Panel, EC Leads, Admin)
- Admin credential validation
- Automatic redirection based on user role

### Dashboard Component
- Interactive charts using Chart.js and react-chartjs-2
- Real-time statistics display
- Responsive grid layout
- Navigation to other sections

### Recruitment Component
- Job posting management
- Modal forms for adding positions
- Department and experience level filtering
- CRUD operations for recruitment data

### Toast Component
- Global notification system
- Success/error message display
- Auto-dismiss functionality

## 🎨 Styling

The application uses:
- **CSS Modules** for component-specific styles
- **Responsive Design** with mobile-first approach
- **FontAwesome** icons for consistent UI
- **Gradient backgrounds** matching the original design
- **Modern card-based layouts**

## 🔌 API Integration

The React app communicates with the existing Node.js backend through:
- `/api/dashboard-stats` - Dashboard statistics
- `/api/chart-data` - Chart data for visualizations
- `/api/recruitment` - Job posting management
- `/api/candidates` - Candidate management
- `/api/log-login` - Login tracking
- `/api/check-admin` - Admin access verification

## 🚧 Migration Status

### ✅ Completed
- Basic React setup and routing
- Login system with MSAL integration
- Dashboard with charts and statistics
- Recruitment management system
- Toast notification system
- Responsive design implementation

### 🔄 In Progress
- Candidates management (detailed view and operations)
- Interview scheduling system
- Panel management interface
- Feedback form and evaluation system
- Admin panel with user management

### 📋 TODO
- Complete remaining component implementations
- Add unit tests
- Implement error boundaries
- Add loading states for better UX
- Optimize bundle size
- Add PWA features

## 🔄 Backward Compatibility

The backend has been updated to serve both:
- **Development**: Original HTML files for testing
- **Production**: React build files

This ensures a smooth transition without breaking existing functionality.

## 🐛 Troubleshooting

### Common Issues

1. **MSAL Authentication Issues**
   - Ensure redirect URI matches your domain
   - Check Azure AD configuration
   - Verify client ID and tenant ID

2. **Chart Not Displaying**
   - Check if Chart.js dependencies are installed
   - Verify data format matches expected structure
   - Check browser console for errors

3. **API Connection Issues**
   - Ensure backend server is running
   - Check CORS configuration
   - Verify API endpoints are accessible

### Development Tips

- Use React Developer Tools for debugging
- Check browser console for errors
- Use Network tab to monitor API calls
- Verify environment variables are set

## 📝 Contributing

When adding new features:
1. Create components in `src/components/`
2. Add corresponding CSS files
3. Update routing in `App.js`
4. Test both mobile and desktop views
5. Ensure API integration works correctly

## 🔒 Security

- MSAL handles authentication securely
- API endpoints validate user permissions
- Environment variables protect sensitive data
- CORS configured for production domains

## 📞 Support

For issues or questions:
1. Check the browser console for errors
2. Verify API endpoints are working
3. Check network connectivity
4. Review authentication configuration

---

**Note**: This migration maintains all existing functionality while providing a modern, maintainable codebase. The React version offers better performance, developer experience, and easier future enhancements.