import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { PublicClientApplication } from '@azure/msal-browser';

// Import components
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Recruitment from './components/Recruitment';
import AppRecruit from './components/AppRecruit';
import CloudRecruit from './components/CloudRecruit';
import DataRecruit from './components/DataRecruit';
import ECSelection from './components/ECSelection';
import Toast from './components/common/Toast';
import Sidebar from './components/common/Sidebar';

// Import placeholder components
import {
  CandidatesPage,
  InterviewSchedule,
  L1Imocha,
  L2Technical,
  L2AppTechnical,
  L2DataTechnical,
  PanelPage,
  TechnicalPanel,
  GTPreScreening,
  PreScreeningForm,
  UploadStatus,
  ProjectFitment,
  ECFitment,
  ECUseCase,
  ExistingCandidates,
  CandidateStatus,
  FeedbackForm,
  FinalFeedback,
  JdTemplates,
  ExcelRead,
  Admin,
  Panel,
  Imocha,
  L1ImochaOnline
} from './components/placeholder-components';

// MSAL Configuration
const msalConfig = {
  auth: {
    clientId: "ed0b1bf7-b012-4e13-a526-b696932c0673",
    authority: "https://login.microsoftonline.com/13085c86-4bcb-460a-a6f0-b373421c6323",
    redirectUri: window.location.origin,
  },
};

const msalInstance = new PublicClientApplication(msalConfig);

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [sidebarVisible, setSidebarVisible] = useState(true);

  useEffect(() => {
    // Initialize MSAL
    msalInstance.initialize().then(() => {
      // Check if user is already logged in
      const accounts = msalInstance.getAllAccounts();
      if (accounts.length > 0) {
        setIsAuthenticated(true);
        setUserInfo(accounts[0]);
      }
      setLoading(false);
    });
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  const handleLogin = (userInfo) => {
    setIsAuthenticated(true);
    setUserInfo(userInfo);
  };

  const handleLogout = () => {
    msalInstance.logoutRedirect();
    setIsAuthenticated(false);
    setUserInfo(null);
  };

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  if (loading) {
    return (
      <div className="loading-spinner"></div>
    );
  }

  return (
    <Router>
      <div className="app">
        <Toast
          show={toast.show}
          message={toast.message}
          type={toast.type}
        />
        
        {isAuthenticated ? (
          <div className="app-container">
            <Sidebar
              visible={sidebarVisible}
              onToggle={toggleSidebar}
              onLogout={handleLogout}
              userInfo={userInfo}
            />
            <div className={`main-content ${!sidebarVisible ? 'expanded' : ''}`}>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" />} />
                <Route path="/dashboard" element={<Dashboard showToast={showToast} userInfo={userInfo} />} />
                <Route path="/recruitment" element={<Recruitment showToast={showToast} userInfo={userInfo} />} />
                <Route path="/apprecruit" element={<AppRecruit showToast={showToast} userInfo={userInfo} />} />
                <Route path="/cloudrecruit" element={<CloudRecruit showToast={showToast} userInfo={userInfo} />} />
                <Route path="/datarecruit" element={<DataRecruit showToast={showToast} userInfo={userInfo} />} />
                <Route path="/candidates" element={<CandidatesPage showToast={showToast} userInfo={userInfo} />} />
                <Route path="/interview-schedule" element={<InterviewSchedule showToast={showToast} userInfo={userInfo} />} />
                <Route path="/l1-imocha" element={<L1Imocha showToast={showToast} userInfo={userInfo} />} />
                <Route path="/l2-technical" element={<L2Technical showToast={showToast} userInfo={userInfo} />} />
                <Route path="/l2-app-technical" element={<L2AppTechnical showToast={showToast} userInfo={userInfo} />} />
                <Route path="/l2-data-technical" element={<L2DataTechnical showToast={showToast} userInfo={userInfo} />} />
                <Route path="/panel" element={<PanelPage showToast={showToast} userInfo={userInfo} />} />
                <Route path="/technical-panel" element={<TechnicalPanel showToast={showToast} userInfo={userInfo} />} />
                <Route path="/ec-selection" element={<ECSelection showToast={showToast} userInfo={userInfo} />} />
                <Route path="/gt-prescreening" element={<GTPreScreening showToast={showToast} userInfo={userInfo} />} />
                <Route path="/prescreening-form" element={<PreScreeningForm showToast={showToast} userInfo={userInfo} />} />
                <Route path="/upload-status" element={<UploadStatus showToast={showToast} userInfo={userInfo} />} />
                <Route path="/project-fitment" element={<ProjectFitment showToast={showToast} userInfo={userInfo} />} />
                <Route path="/ec-fitment" element={<ECFitment showToast={showToast} userInfo={userInfo} />} />
                <Route path="/ec-usecase" element={<ECUseCase showToast={showToast} userInfo={userInfo} />} />
                <Route path="/existing-candidates" element={<ExistingCandidates showToast={showToast} userInfo={userInfo} />} />
                <Route path="/candidate-status" element={<CandidateStatus showToast={showToast} userInfo={userInfo} />} />
                <Route path="/feedback-form" element={<FeedbackForm showToast={showToast} userInfo={userInfo} />} />
                <Route path="/final-feedback" element={<FinalFeedback showToast={showToast} userInfo={userInfo} />} />
                <Route path="/jd-templates" element={<JdTemplates showToast={showToast} userInfo={userInfo} />} />
                <Route path="/excel-read" element={<ExcelRead showToast={showToast} userInfo={userInfo} />} />
                <Route path="/admin" element={<Admin showToast={showToast} userInfo={userInfo} />} />
                <Route path="/panel-simple" element={<Panel showToast={showToast} userInfo={userInfo} />} />
                <Route path="/imocha" element={<Imocha showToast={showToast} userInfo={userInfo} />} />
                <Route path="/l1-imocha-online" element={<L1ImochaOnline showToast={showToast} userInfo={userInfo} />} />
              </Routes>
            </div>
          </div>
        ) : (
          <Login onLogin={handleLogin} showToast={showToast} />
        )}
      </div>
    </Router>
  );
}

export default App;