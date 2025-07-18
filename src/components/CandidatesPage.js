import React, { useState, useEffect } from 'react';

const CandidatesPage = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    try {
      const response = await fetch('/api/candidates');
      if (response.ok) {
        const data = await response.json();
        setCandidates(data);
      }
    } catch (error) {
      console.error('Error fetching candidates:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="spinner"></div>
        <p>Loading candidates...</p>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Candidates Management</h2>
        </div>
        <div className="card-body">
          <p>Candidates page is under development. This will display and manage all candidate information.</p>
          <div className="mt-3">
            <button className="btn btn-primary">Add New Candidate</button>
            <button className="btn btn-secondary ml-2">Import Candidates</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidatesPage;