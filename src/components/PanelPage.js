import React, { useState, useEffect } from 'react';

const PanelPage = () => {
  const [panels, setPanels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPanels();
  }, []);

  const fetchPanels = async () => {
    try {
      const response = await fetch('/api/panels');
      if (response.ok) {
        const data = await response.json();
        setPanels(data);
      }
    } catch (error) {
      console.error('Error fetching panels:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="spinner"></div>
        <p>Loading panels...</p>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Panel Management</h2>
        </div>
        <div className="card-body">
          <p>Panel management page is under development. This will manage interview panels and their members.</p>
          <div className="mt-3">
            <button className="btn btn-primary">Create New Panel</button>
            <button className="btn btn-secondary ml-2">Manage Members</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PanelPage;