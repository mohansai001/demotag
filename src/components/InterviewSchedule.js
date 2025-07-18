import React, { useState, useEffect } from 'react';

const InterviewSchedule = () => {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    try {
      const response = await fetch('/api/interviews');
      if (response.ok) {
        const data = await response.json();
        setInterviews(data);
      }
    } catch (error) {
      console.error('Error fetching interviews:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="spinner"></div>
        <p>Loading interviews...</p>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Interview Schedule</h2>
        </div>
        <div className="card-body">
          <p>Interview scheduling page is under development. This will manage all interview schedules and appointments.</p>
          <div className="mt-3">
            <button className="btn btn-primary">Schedule New Interview</button>
            <button className="btn btn-secondary ml-2">View Calendar</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewSchedule;