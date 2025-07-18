import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Import components
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Recruitment from './components/Recruitment';
import CandidatesPage from './components/CandidatesPage';
import InterviewSchedule from './components/InterviewSchedule';
import PanelPage from './components/PanelPage';
import FeedbackForm from './components/FeedbackForm';
import AdminPanel from './components/AdminPanel';
import Toast from './components/Toast';

function App() {
  return (
    <Router>
      <div className="App">
        <Toast />
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/recruitment" element={<Recruitment />} />
          <Route path="/candidates" element={<CandidatesPage />} />
          <Route path="/interviews" element={<InterviewSchedule />} />
          <Route path="/panel" element={<PanelPage />} />
          <Route path="/feedback" element={<FeedbackForm />} />
          <Route path="/admin" element={<AdminPanel />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;