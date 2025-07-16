import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Admin from './components/Admin';
import Panel from './components/Panel';
import Recruitment from './components/Recruitment';
import CandidatesPage from './components/CandidatesPage';
import InterviewSchedule from './components/InterviewSchedule';
import TechnicalPanel from './components/TechnicalPanel';
import L1Imocha from './components/L1Imocha';
import L2Technical from './components/L2Technical';
import FeedbackForm from './components/FeedbackForm';
import FinalFeedback from './components/FinalFeedback';
import PrescreeningForm from './components/PrescreeningForm';
import GTPrescreening from './components/GTPrescreening';
import AppRecruit from './components/AppRecruit';
import DataRecruit from './components/DataRecruit';
import CloudRecruit from './components/CloudRecruit';
import ECSelection from './components/ECSelection';
import ProjectFitment from './components/ProjectFitment';
import ECFitment from './components/ECFitment';
import ECUseCase from './components/ECUseCase';
import JDTemplates from './components/JDTemplates';
import CandidateStatus from './components/CandidateStatus';
import ExcelRead from './components/ExcelRead';
import L1ImochaOnline from './components/L1ImochaOnline';
import L2AppTechnical from './components/L2AppTechnical';
import L2DataTechnical from './components/L2DataTechnical';
import './App.css';

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/panel" element={<Panel />} />
        <Route path="/recruitment" element={<Recruitment />} />
        <Route path="/candidates" element={<CandidatesPage />} />
        <Route path="/interview-schedule" element={<InterviewSchedule />} />
        <Route path="/technical-panel" element={<TechnicalPanel />} />
        <Route path="/l1-imocha" element={<L1Imocha />} />
        <Route path="/l2-technical" element={<L2Technical />} />
        <Route path="/feedback-form" element={<FeedbackForm />} />
        <Route path="/final-feedback" element={<FinalFeedback />} />
        <Route path="/prescreening-form" element={<PrescreeningForm />} />
        <Route path="/gt-prescreening" element={<GTPrescreening />} />
        <Route path="/app-recruit" element={<AppRecruit />} />
        <Route path="/data-recruit" element={<DataRecruit />} />
        <Route path="/cloud-recruit" element={<CloudRecruit />} />
        <Route path="/ec-selection" element={<ECSelection />} />
        <Route path="/project-fitment" element={<ProjectFitment />} />
        <Route path="/ec-fitment" element={<ECFitment />} />
        <Route path="/ec-usecase" element={<ECUseCase />} />
        <Route path="/jd-templates" element={<JDTemplates />} />
        <Route path="/candidate-status" element={<CandidateStatus />} />
        <Route path="/excel-read" element={<ExcelRead />} />
        <Route path="/l1-imocha-online" element={<L1ImochaOnline />} />
        <Route path="/l2-app-technical" element={<L2AppTechnical />} />
        <Route path="/l2-data-technical" element={<L2DataTechnical />} />
      </Routes>
      <ToastContainer position="top-right" autoClose={4000} />
    </div>
  );
}

export default App;