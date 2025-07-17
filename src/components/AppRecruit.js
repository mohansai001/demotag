import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Modal from './common/Modal';

const AppRecruit = ({ showToast, userInfo }) => {
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedCloudProvider, setSelectedCloudProvider] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [frontendTechnology, setFrontendTechnology] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [hrEmail, setHrEmail] = useState('');
  const [rrfId, setRrfId] = useState('');
  const [ecName, setEcName] = useState('');
  const [files, setFiles] = useState([]);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const navigate = useNavigate();
  const location = useLocation();

  const duplicateCandidates = new Set();

  // MSAL Configuration (preserved from original)
  const msalConfig = {
    auth: {
      clientId: "ed0b1bf7-b012-4e13-a526-b696932c0673",
      authority: "https://login.microsoftonline.com/13085c86-4bcb-460a-a6f0-b373421c6323",
      redirectUri: window.location.origin,
    },
  };

  useEffect(() => {
    // Get selected value from location state or URL params
    const selectedValue = location.state?.selectedValue || new URLSearchParams(location.search).get('selectedValue');
    if (selectedValue) {
      setEcName(selectedValue);
    }
  }, [location]);

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const fetchJobDescription = async (role, cloudProvider, level, frontendTech) => {
    try {
      if (!cloudProvider) {
        throw new Error("Cloud Provider is missing.");
      }

      if (role === "Cloud Native Application Engineer - Full Stack" && !frontendTech) {
        frontendTech = "None";
      }

      let fileName = "";
      switch (role) {
        case "Cloud Native Application Engineer - Backend":
          fileName = `${level}_${cloudProvider}_App.txt`;
          break;
        case "Cloud Native Application Engineer - Full Stack":
          fileName = `${level}_${cloudProvider}_App_${frontendTech}.txt`;
          break;
        default:
          fileName = `${level}_${cloudProvider}_App.txt`;
      }

      const response = await fetch(`/api/job-description/${fileName}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch job description: ${response.statusText}`);
      }

      const jobDesc = await response.text();
      setJobDescription(jobDesc);
      return jobDesc;
    } catch (error) {
      console.error("Error fetching job description:", error);
      showToast("Error fetching job description: " + error.message, "error");
      return null;
    }
  };

  const handleJobDescriptionFetch = async () => {
    if (!selectedRole || !selectedCloudProvider || !selectedLevel) {
      showToast("Please select all required fields", "error");
      return;
    }

    setLoading(true);
    const jobDesc = await fetchJobDescription(selectedRole, selectedCloudProvider, selectedLevel, frontendTechnology);
    setLoading(false);

    if (jobDesc) {
      showToast("Job description fetched successfully", "success");
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

    // Prepare initial data for upload status tracking
    const initialData = {
      hrEmail,
      rrfId,
      selectedValue: ecName,
      selectedRole,
      selectedCloudProvider,
      globalSelectedLevel: selectedLevel,
      globalfrontendTechnology: frontendTechnology,
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

    // Save to localStorage for upload status page
    localStorage.setItem("multiUploadData", JSON.stringify(initialData));

    // Convert files to data URLs for session storage
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

    // Navigate to upload status page
    navigate('/upload-status');
  };

  const openResumeModal = () => {
    setShowResumeModal(true);
  };

  const closeResumeModal = () => {
    setShowResumeModal(false);
    setFiles([]);
    setUploadProgress(0);
  };

  return (
    <div style={{
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      margin: 0,
      padding: 0,
      background: "linear-gradient(120deg, #e6e6fa, #daf7a6)",
      minHeight: "100vh"
    }}>
      {/* Header */}
      <div style={{
        background: "white",
        padding: "10px 20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
      }}>
        <h1 style={{ color: "black", margin: 0 }}>Application Recruitment</h1>
        <button
          onClick={() => navigate('/recruitment')}
          className="button secondary"
        >
          Back to Recruitment
        </button>
      </div>

      {/* Main Content */}
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
                <option value="Cloud Native Application Engineer - Backend">Cloud Native Application Engineer - Backend</option>
                <option value="Cloud Native Application Engineer - Full Stack">Cloud Native Application Engineer - Full Stack</option>
              </select>
            </div>

            <div className="form-group">
              <label>Cloud Provider:</label>
              <select
                value={selectedCloudProvider}
                onChange={(e) => setSelectedCloudProvider(e.target.value)}
                style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
              >
                <option value="">Select Cloud Provider</option>
                <option value="AWS">AWS</option>
                <option value="Azure">Azure</option>
                <option value="GCP">GCP</option>
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

            {selectedRole === "Cloud Native Application Engineer - Full Stack" && (
              <div className="form-group">
                <label>Frontend Technology:</label>
                <select
                  value={frontendTechnology}
                  onChange={(e) => setFrontendTechnology(e.target.value)}
                  style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
                >
                  <option value="">Select Frontend Technology</option>
                  <option value="React">React</option>
                  <option value="Angular">Angular</option>
                  <option value="Vue">Vue</option>
                </select>
              </div>
            )}

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
              onClick={handleJobDescriptionFetch}
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

        {/* Job Description Display */}
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

      {/* Resume Upload Modal */}
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

          {uploadProgress > 0 && (
            <div style={{ marginTop: "15px" }}>
              <div style={{ marginBottom: "5px" }}>Upload Progress: {uploadProgress}%</div>
              <div style={{
                width: "100%",
                height: "20px",
                backgroundColor: "#e0e0e0",
                borderRadius: "10px",
                overflow: "hidden"
              }}>
                <div style={{
                  width: `${uploadProgress}%`,
                  height: "100%",
                  backgroundColor: "#007bff",
                  transition: "width 0.3s ease"
                }}></div>
              </div>
            </div>
          )}

          <div style={{ marginTop: "20px", textAlign: "right" }}>
            <button
              onClick={closeResumeModal}
              className="button secondary"
              style={{ marginRight: "10px" }}
            >
              Cancel
            </button>
            <button
              onClick={uploadResume}
              disabled={files.length === 0}
              className="button"
            >
              Upload & Process
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AppRecruit;