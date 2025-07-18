import React, { useState, useEffect } from 'react';

const FeedbackForm = () => {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      const response = await fetch('/api/feedback');
      if (response.ok) {
        const data = await response.json();
        setFeedback(data);
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="spinner"></div>
        <p>Loading feedback...</p>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Feedback Management</h2>
        </div>
        <div className="card-body">
          <p>Feedback management page is under development. This will handle all interview feedback and evaluations.</p>
          <div className="mt-3">
            <button className="btn btn-primary">Submit Feedback</button>
            <button className="btn btn-secondary ml-2">View All Feedback</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackForm;