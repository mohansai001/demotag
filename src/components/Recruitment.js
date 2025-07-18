import React, { useState, useEffect } from 'react';
import './Recruitment.css';

const Recruitment = () => {
  const [recruitmentData, setRecruitmentData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    position: '',
    department: '',
    experience: '',
    location: '',
    description: ''
  });

  useEffect(() => {
    fetchRecruitmentData();
  }, []);

  const fetchRecruitmentData = async () => {
    try {
      const response = await fetch('/api/recruitment');
      if (response.ok) {
        const data = await response.json();
        setRecruitmentData(data);
      }
    } catch (error) {
      console.error('Error fetching recruitment data:', error);
      window.showToast('Error loading recruitment data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/recruitment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        window.showToast('Recruitment position added successfully', 'success');
        setShowAddForm(false);
        setFormData({
          position: '',
          department: '',
          experience: '',
          location: '',
          description: ''
        });
        fetchRecruitmentData();
      } else {
        window.showToast('Error adding recruitment position', 'error');
      }
    } catch (error) {
      console.error('Error adding recruitment:', error);
      window.showToast('Error adding recruitment position', 'error');
    }
  };

  if (loading) {
    return (
      <div className="recruitment-container">
        <div className="spinner"></div>
        <p>Loading recruitment data...</p>
      </div>
    );
  }

  return (
    <div className="recruitment-container">
      <div className="recruitment-header">
        <h1>Recruitment Management</h1>
        <button 
          className="btn btn-primary"
          onClick={() => setShowAddForm(true)}
        >
          <i className="fas fa-plus"></i> Add New Position
        </button>
      </div>

      {showAddForm && (
        <div className="modal show">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add New Recruitment Position</h3>
              <span className="close" onClick={() => setShowAddForm(false)}>&times;</span>
            </div>
            <form onSubmit={handleSubmit} className="recruitment-form">
              <div className="form-group">
                <label htmlFor="position">Position Title:</label>
                <input
                  type="text"
                  id="position"
                  name="position"
                  value={formData.position}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="department">Department:</label>
                <select
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Department</option>
                  <option value="devops">DevOps</option>
                  <option value="platform">Platform</option>
                  <option value="cloudops">CloudOps</option>
                  <option value="migration">Migration</option>
                  <option value="application">Application</option>
                  <option value="data">Data</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="experience">Experience Level:</label>
                <select
                  id="experience"
                  name="experience"
                  value={formData.experience}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Experience</option>
                  <option value="entry">Entry Level (0-2 years)</option>
                  <option value="mid">Mid Level (2-5 years)</option>
                  <option value="senior">Senior Level (5+ years)</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="location">Location:</label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Job Description:</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="4"
                  required
                ></textarea>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  Add Position
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="recruitment-grid">
        {recruitmentData.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-briefcase"></i>
            <h3>No recruitment positions found</h3>
            <p>Click "Add New Position" to create your first recruitment posting.</p>
          </div>
        ) : (
          recruitmentData.map((position, index) => (
            <div key={index} className="recruitment-card">
              <div className="card-header">
                <h3>{position.position}</h3>
                <span className="department-badge">{position.department}</span>
              </div>
              <div className="card-body">
                <p><strong>Experience:</strong> {position.experience}</p>
                <p><strong>Location:</strong> {position.location}</p>
                <p className="description">{position.description}</p>
              </div>
              <div className="card-actions">
                <button className="btn btn-primary">
                  <i className="fas fa-users"></i> View Candidates
                </button>
                <button className="btn btn-secondary">
                  <i className="fas fa-edit"></i> Edit
                </button>
                <button className="btn btn-danger">
                  <i className="fas fa-trash"></i> Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Recruitment;