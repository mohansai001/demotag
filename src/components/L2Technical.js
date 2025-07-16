import React from 'react';
import { useNavigate } from 'react-router-dom';

const L2Technical = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('userEmail');
    navigate('/');
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>L2Technical</h1>
        <button onClick={handleLogout} className="btn btn-danger">
          Logout
        </button>
      </div>
      <div className="page-content">
        <p>L2Technical functionality will be implemented here</p>
      </div>
    </div>
  );
};

export default L2Technical;
