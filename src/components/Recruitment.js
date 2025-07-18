import React, { useState, useEffect } from 'react';
import { Button, Card, Input, Modal, LoadingSpinner } from './common';
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
        <LoadingSpinner 
          size="large" 
          text="Loading recruitment data..." 
          variant="primary"
        />
      </div>
    );
  }

  return (
    <div className="recruitment-container">
      <div className="recruitment-header">
        <h1>Recruitment Management</h1>
        <Button 
          variant="primary"
          onClick={() => setShowAddForm(true)}
          icon="fas fa-plus"
        >
          Add New Position
        </Button>
      </div>

      <Modal
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        title="Add New Recruitment Position"
        size="large"
      >
        <form onSubmit={handleSubmit} className="recruitment-form">
          <Input
            label="Position Title"
            name="position"
            value={formData.position}
            onChange={handleInputChange}
            required
            icon="fas fa-briefcase"
          />

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

          <Input
            label="Location"
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            required
            icon="fas fa-map-marker-alt"
          />

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

          <Modal.Footer>
            <Button 
              type="submit" 
              variant="primary"
              icon="fas fa-plus"
            >
              Add Position
            </Button>
            <Button 
              type="button" 
              variant="secondary"
              onClick={() => setShowAddForm(false)}
            >
              Cancel
            </Button>
          </Modal.Footer>
        </form>
      </Modal>

      <div className="recruitment-grid">
        {recruitmentData.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-briefcase"></i>
            <h3>No recruitment positions found</h3>
            <p>Click "Add New Position" to create your first recruitment posting.</p>
          </div>
        ) : (
          recruitmentData.map((position, index) => (
            <Card key={index} hover shadow="medium" className="recruitment-card">
              <Card.Header>
                <Card.Title>{position.position}</Card.Title>
                <span className="department-badge">{position.department}</span>
              </Card.Header>
              <Card.Body>
                <p><strong>Experience:</strong> {position.experience}</p>
                <p><strong>Location:</strong> {position.location}</p>
                <p className="description">{position.description}</p>
              </Card.Body>
              <Card.Footer>
                <div className="card-actions">
                  <Button 
                    variant="primary" 
                    size="small"
                    icon="fas fa-users"
                  >
                    View Candidates
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="small"
                    icon="fas fa-edit"
                  >
                    Edit
                  </Button>
                  <Button 
                    variant="danger" 
                    size="small"
                    icon="fas fa-trash"
                  >
                    Delete
                  </Button>
                </div>
              </Card.Footer>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Recruitment;