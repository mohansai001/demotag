import React, { useState, useEffect } from 'react';

const AdminPanel = () => {
  const [adminData, setAdminData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const response = await fetch('/api/admin');
      if (response.ok) {
        const data = await response.json();
        setAdminData(data);
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="spinner"></div>
        <p>Loading admin panel...</p>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Admin Panel</h2>
        </div>
        <div className="card-body">
          <p>Admin panel is under development. This will provide administrative controls and system management.</p>
          <div className="mt-3">
            <button className="btn btn-primary">User Management</button>
            <button className="btn btn-secondary ml-2">System Settings</button>
            <button className="btn btn-info ml-2">Reports</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;