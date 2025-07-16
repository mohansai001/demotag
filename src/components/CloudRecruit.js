import React from 'react';
import { useNavigate } from 'react-router-dom';

const CloudRecruit = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('userEmail');
    navigate('/');
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>CloudRecruit</h1>
        <button onClick={handleLogout} className="btn btn-danger">
          Logout
        </button>
      </div>
      <div className="page-content">
        <p>CloudRecruit functionality will be implemented here</p>
      </div>
    </div>
  );
};

export default CloudRecruit;
