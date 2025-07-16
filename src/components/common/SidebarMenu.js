import React from 'react';
import { useNavigate } from 'react-router-dom';
import './SidebarMenu.css';

const SidebarMenu = ({ isOpen, onClose, onNavigate }) => {
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    onNavigate(path);
    onClose();
  };

  const handleLogout = () => {
    localStorage.removeItem('userEmail');
    navigate('/');
  };

  return (
    <div className={`sidebar-menu ${isOpen ? 'show' : ''}`}>
      <div className="sidebar-content">
        <div className="menu-item" onClick={() => handleNavigation('/dashboard')}>
          <i className="fas fa-tachometer-alt"></i>
          <span>Dashboard</span>
        </div>
        <div className="menu-item" onClick={() => handleNavigation('/recruitment')}>
          <i className="fas fa-user-tie"></i>
          <span>Recruitment</span>
        </div>
        <div className="menu-item" onClick={() => handleNavigation('/candidates')}>
          <i className="fas fa-users"></i>
          <span>Candidates</span>
        </div>
        <div className="menu-item" onClick={() => handleNavigation('/interview-schedule')}>
          <i className="fas fa-calendar-alt"></i>
          <span>Interview Schedule</span>
        </div>
        <div className="menu-item" onClick={() => handleNavigation('/technical-panel')}>
          <i className="fas fa-laptop-code"></i>
          <span>Technical Panel</span>
        </div>
        <div className="menu-item" onClick={() => handleNavigation('/l1-imocha')}>
          <i className="fas fa-clipboard-check"></i>
          <span>L1 Imocha</span>
        </div>
        <div className="menu-item" onClick={() => handleNavigation('/l2-technical')}>
          <i className="fas fa-code"></i>
          <span>L2 Technical</span>
        </div>
        <div className="menu-item" onClick={() => handleNavigation('/feedback-form')}>
          <i className="fas fa-comments"></i>
          <span>Feedback Form</span>
        </div>
        <div className="menu-item" onClick={() => handleNavigation('/prescreening-form')}>
          <i className="fas fa-file-alt"></i>
          <span>Prescreening Form</span>
        </div>
        <div className="menu-item" onClick={() => handleNavigation('/app-recruit')}>
          <i className="fas fa-mobile-alt"></i>
          <span>App Recruit</span>
        </div>
        <div className="menu-item" onClick={() => handleNavigation('/data-recruit')}>
          <i className="fas fa-database"></i>
          <span>Data Recruit</span>
        </div>
        <div className="menu-item" onClick={() => handleNavigation('/cloud-recruit')}>
          <i className="fas fa-cloud"></i>
          <span>Cloud Recruit</span>
        </div>
        <div className="menu-item" onClick={() => handleNavigation('/ec-selection')}>
          <i className="fas fa-user-check"></i>
          <span>EC Selection</span>
        </div>
        <div className="menu-item" onClick={() => handleNavigation('/project-fitment')}>
          <i className="fas fa-project-diagram"></i>
          <span>Project Fitment</span>
        </div>
        <div className="menu-item" onClick={() => handleNavigation('/jd-templates')}>
          <i className="fas fa-file-contract"></i>
          <span>JD Templates</span>
        </div>
        <div className="menu-item" onClick={() => handleNavigation('/candidate-status')}>
          <i className="fas fa-chart-line"></i>
          <span>Candidate Status</span>
        </div>
        <div className="menu-item" onClick={() => handleNavigation('/excel-read')}>
          <i className="fas fa-file-excel"></i>
          <span>Excel Read</span>
        </div>
      </div>
      <div className="logout-option" onClick={handleLogout}>
        <i className="fas fa-sign-out-alt"></i>
        <span>Logout</span>
      </div>
    </div>
  );
};

export default SidebarMenu;