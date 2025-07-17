import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const ECSelection = ({ showToast, userInfo }) => {
  const [selectedValue, setSelectedValue] = useState('');
  const [ecMapping, setEcMapping] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Get ec_mapping from location state or URL params
    const mapping = location.state?.ec_mapping || new URLSearchParams(location.search).get('ec_mapping');
    if (mapping) {
      setEcMapping(mapping);
    }
  }, [location]);

  const handleSubmit = () => {
    if (!selectedValue) {
      showToast('Please select an option', 'error');
      return;
    }

    // Navigate to the appropriate recruitment page based on selection
    switch (selectedValue) {
      case 'Cloud Native Application Engineer - Backend':
        navigate('/apprecruit', { state: { selectedValue, ecMapping } });
        break;
      case 'Cloud Native Application Engineer - Full Stack':
        navigate('/apprecruit', { state: { selectedValue, ecMapping } });
        break;
      case 'Cloud Platform Engineer':
        navigate('/cloudrecruit', { state: { selectedValue, ecMapping } });
        break;
      case 'Cloud-Ops Engineer':
        navigate('/cloudrecruit', { state: { selectedValue, ecMapping } });
        break;
      case 'Migration Engineer':
        navigate('/cloudrecruit', { state: { selectedValue, ecMapping } });
        break;
      case 'Data Engineer':
        navigate('/datarecruit', { state: { selectedValue, ecMapping } });
        break;
      case 'Data-Ops Engineer':
        navigate('/datarecruit', { state: { selectedValue, ecMapping } });
        break;
      case 'Data – BI Visualization Engineer':
        navigate('/datarecruit', { state: { selectedValue, ecMapping } });
        break;
      case 'Data Modeller':
        navigate('/datarecruit', { state: { selectedValue, ecMapping } });
        break;
      case 'Data Analyst':
        navigate('/datarecruit', { state: { selectedValue, ecMapping } });
        break;
      case 'Data Architect':
        navigate('/datarecruit', { state: { selectedValue, ecMapping } });
        break;
      case 'Data Scientist – AI/ML':
        navigate('/datarecruit', { state: { selectedValue, ecMapping } });
        break;
      default:
        navigate('/recruitment', { state: { selectedValue, ecMapping } });
    }
  };

  const roleOptions = [
    'Cloud Native Application Engineer - Backend',
    'Cloud Native Application Engineer - Full Stack',
    'Cloud Platform Engineer',
    'Cloud-Ops Engineer',
    'Migration Engineer',
    'Data Engineer',
    'Data-Ops Engineer',
    'Data – BI Visualization Engineer',
    'Data Modeller',
    'Data Analyst',
    'Data Architect',
    'Data Scientist – AI/ML'
  ];

  return (
    <div style={{
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      margin: 0,
      padding: 0,
      background: "linear-gradient(120deg, #e6e6fa, #daf7a6)",
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center"
    }}>
      <div style={{
        background: "white",
        padding: "40px",
        borderRadius: "10px",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        color: "black",
        minWidth: "500px",
        maxWidth: "600px"
      }}>
        <h1 style={{ textAlign: "center", marginBottom: "30px" }}>
          Select Role for Recruitment
        </h1>
        
        <div style={{ marginBottom: "20px" }}>
          <p><strong>EC Mapping:</strong> {ecMapping}</p>
        </div>

        <div className="form-group">
          <label htmlFor="role-select">Select Role:</label>
          <select
            id="role-select"
            value={selectedValue}
            onChange={(e) => setSelectedValue(e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              fontSize: "16px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              marginTop: "10px"
            }}
          >
            <option value="">-- Select a Role --</option>
            {roleOptions.map((role, index) => (
              <option key={index} value={role}>{role}</option>
            ))}
          </select>
        </div>

        <div style={{ 
          display: "flex", 
          justifyContent: "center", 
          gap: "20px",
          marginTop: "30px"
        }}>
          <button
            onClick={handleSubmit}
            className="button"
            style={{
              padding: "12px 30px",
              fontSize: "16px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Continue
          </button>
          
          <button
            onClick={() => navigate('/dashboard')}
            className="button secondary"
            style={{
              padding: "12px 30px",
              fontSize: "16px",
              backgroundColor: "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ECSelection;