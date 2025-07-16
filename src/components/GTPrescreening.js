import React from 'react';
import { useNavigate } from 'react-router-dom';

const GTPrescreening = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('userEmail');
    navigate('/');
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>GTPrescreening</h1>
        <button onClick={handleLogout} className="btn btn-danger">
          Logout
        </button>
      </div>
      <div className="page-content">
        <p>GTPrescreening functionality will be implemented here</p>
      </div>
    </div>
  );
};

export default GTPrescreening;
