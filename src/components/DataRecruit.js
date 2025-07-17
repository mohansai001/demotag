import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Modal from './common/Modal';

const DataRecruit = ({ showToast, userInfo }) => {
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [hrEmail, setHrEmail] = useState('');
  const [rrfId, setRrfId] = useState('');
  const [ecName, setEcName] = useState('');
  const [files, setFiles] = useState([]);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const selectedValue = location.state?.selectedValue || new URLSearchParams(location.search).get('selectedValue');
    if (selectedValue) {
      setEcName(selectedValue);
    }
  }, [location]);

  const dataRoles = [
    'Data Engineer',
    'Data-Ops Engineer',
    'Data – BI Visualization Engineer',
    'Data Modeller',
    'Data Analyst',
    'Data Architect',
    'Data Scientist – AI/ML'
  ];

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const fetchJobDescription = async () => {
    if (!selectedRole || !selectedLevel) {
      showToast("Please select all required fields", "error");
      return;
    }

    setLoading(true);
    try {
      const fileName = `${selectedLevel}_Data_${selectedRole.replace(/\s+/g, '_').replace(/[–-]/g, '_')}.txt`;
      const response = await fetch(`/api/job-description/${fileName}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch job description: ${response.statusText}`);
      }

      const jobDesc = await response.text();
      setJobDescription(jobDesc);
      showToast("Job description fetched successfully", "success");
    } catch (error) {
      console.error("Error fetching job description:", error);
      showToast("Error fetching job description: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
  };

  const uploadResume = async () => {
    if (!hrEmail || !validateEmail(hrEmail)) {
      showToast("Please enter a valid HR email.", "error");
      return;
    }

    if (!files || files.length === 0) {
      showToast("Please upload at least one document file.", "error");
      return;
    }

    if (!jobDescription) {
      showToast("Please fetch job description first.", "error");
      return;
    }

    const initialData = {
      hrEmail,
      rrfId,
      selectedValue: ecName,
      selectedRole,
      globalSelectedLevel: selectedLevel,
      globalJobDescription: jobDescription,
      fileEvaluations: {},
      timestamp: new Date().toISOString(),
    };

    files.forEach((file, index) => {
      initialData.fileEvaluations[index] = {
        fileName: file.name,
        status: "Queued",
        content: null,
        resumeUrl: null,
      };
    });

    localStorage.setItem("multiUploadData", JSON.stringify(initialData));

    const fileReaders = files.map((file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          resolve({ name: file.name, dataUrl: event.target.result });
        };
        reader.readAsDataURL(file);
      });
    });

    const fileDataArray = await Promise.all(fileReaders);
    sessionStorage.setItem("multiUploadFiles", JSON.stringify(fileDataArray));

    navigate('/upload-status');
  };

  const openResumeModal = () => {
    setShowResumeModal(true);
  };

  const closeResumeModal = () => {
    setShowResumeModal(false);
    setFiles([]);
  };

  return (
    <div style={{
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      margin: 0,
      padding: 0,
      background: "linear-gradient(120deg, #e6e6fa, #daf7a6)",
      minHeight: "100vh"
    }}>
      <div style={{
        background: "white",
        padding: "10px 20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
      }}>
        <h1 style={{ color: "black", margin: 0 }}>Data Recruitment</h1>
        <button onClick={() => navigate('/recruitment')} className="button secondary">
          Back to Recruitment
        </button>
      </div>

      <div style={{ padding: "20px" }}>
        <div style={{
          backgroundColor: "white",
          borderRadius: "10px",
          padding: "30px",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
          marginBottom: "20px"
        }}>
          <h2 style={{ color: "black", marginBottom: "20px" }}>Job Configuration</h2>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div className="form-group">
              <label>EC Name:</label>
              <input
                type="text"
                value={ecName}
                onChange={(e) => setEcName(e.target.value)}
                style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
              />
            </div>

            <div className="form-group">
              <label>Role:</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
              >
                <option value="">Select Role</option>
                {dataRoles.map((role, index) => (
                  <option key={index} value={role}>{role}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Experience Level:</label>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
              >
                <option value="">Select Level</option>
                <option value="L1">L1 (0-2 years)</option>
                <option value="L2">L2 (2-5 years)</option>
                <option value="L3">L3 (5+ years)</option>
              </select>
            </div>

            <div className="form-group">
              <label>HR Email:</label>
              <input
                type="email"
                value={hrEmail}
                onChange={(e) => setHrEmail(e.target.value)}
                style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
                placeholder="Enter HR email"
              />
            </div>

            <div className="form-group">
              <label>RRF ID:</label>
              <input
                type="text"
                value={rrfId}
                onChange={(e) => setRrfId(e.target.value)}
                style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
                placeholder="Enter RRF ID"
              />
            </div>
          </div>

          <div style={{ marginTop: "20px" }}>
            <button
              onClick={fetchJobDescription}
              disabled={loading}
              className="button"
              style={{ marginRight: "10px" }}
            >
              {loading ? "Fetching..." : "Fetch Job Description"}
            </button>
            
            <button
              onClick={openResumeModal}
              disabled={!jobDescription}
              className="button secondary"
            >
              Upload Resumes
            </button>
          </div>
        </div>

        {jobDescription && (
          <div style={{
            backgroundColor: "white",
            borderRadius: "10px",
            padding: "30px",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)"
          }}>
            <h3 style={{ color: "black", marginBottom: "15px" }}>Job Description</h3>
            <pre style={{
              whiteSpace: "pre-wrap",
              color: "black",
              background: "#f8f9fa",
              padding: "15px",
              borderRadius: "4px",
              border: "1px solid #dee2e6",
              fontSize: "14px",
              lineHeight: "1.5"
            }}>
              {jobDescription}
            </pre>
          </div>
        )}
      </div>

      <Modal
        show={showResumeModal}
        onClose={closeResumeModal}
        title="Upload Resume Files"
        size="large"
      >
        <div>
          <div className="form-group">
            <label>Select Resume Files:</label>
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
              style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
            />
            <small style={{ color: "#666" }}>
              Supported formats: PDF, DOC, DOCX. You can select multiple files.
            </small>
          </div>

          {files.length > 0 && (
            <div style={{ marginTop: "15px" }}>
              <h4>Selected Files:</h4>
              <ul>
                {files.map((file, index) => (
                  <li key={index} style={{ marginBottom: "5px" }}>
                    {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div style={{ marginTop: "20px", textAlign: "right" }}>
            <button onClick={closeResumeModal} className="button secondary" style={{ marginRight: "10px" }}>
              Cancel
            </button>
            <button onClick={uploadResume} disabled={files.length === 0} className="button">
              Upload & Process
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DataRecruit;