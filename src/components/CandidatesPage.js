import React, { useState, useEffect } from 'react';
import { Button, Card, LoadingSpinner, Input, Modal } from './common';

const CandidatesPage = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

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
        <LoadingSpinner 
          size="large" 
          text="Loading candidates..." 
          variant="primary"
        />
      </div>
    );
  }

  return (
    <div className="container">
      <Card>
        <Card.Header>
          <Card.Title level={2}>Candidates Management</Card.Title>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Input
              placeholder="Search candidates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon="fas fa-search"
              size="small"
            />
            <Button 
              variant="primary" 
              onClick={() => setShowAddModal(true)}
              icon="fas fa-plus"
            >
              Add New Candidate
            </Button>
            <Button 
              variant="secondary"
              icon="fas fa-upload"
            >
              Import Candidates
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          <p>Candidates page is under development. This will display and manage all candidate information.</p>
          <div style={{ marginTop: '20px' }}>
            <Card variant="info" padding="large">
              <Card.Body>
                <h4>🚧 Coming Soon</h4>
                <p>This section will include:</p>
                <ul>
                  <li>Candidate profiles and resumes</li>
                  <li>Application status tracking</li>
                  <li>Interview scheduling</li>
                  <li>Skill assessments</li>
                  <li>Communication history</li>
                </ul>
              </Card.Body>
            </Card>
          </div>
        </Card.Body>
      </Card>

      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Candidate"
        size="medium"
      >
        <Modal.Body>
          <p>Candidate addition form will be implemented here.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="primary"
            icon="fas fa-save"
          >
            Save Candidate
          </Button>
          <Button 
            variant="secondary"
            onClick={() => setShowAddModal(false)}
          >
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default CandidatesPage;