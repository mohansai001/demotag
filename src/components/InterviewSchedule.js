import React from 'react';
import { useNavigate } from 'react-router-dom';

const InterviewSchedule = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('userEmail');
    navigate('/');
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>InterviewSchedule</h1>
        <button onClick={handleLogout} className="btn btn-danger">
          Logout
        </button>
      </div>
      <div className="page-content">
        <p>InterviewSchedule functionality will be implemented here</p>
      </div>
    </div>
  );
};

export default InterviewSchedule;
