import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Recruitment = ({ showToast, userInfo }) => {
  const [uploadCount, setUploadCount] = useState(0);
  const [shortlistedCount, setShortlistedCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadCandidateCounts();
  }, []);

  const loadCandidateCounts = async () => {
    try {
      const response = await fetch('/api/candidate-counts');
      const data = await response.json();
      
      setUploadCount(data.totalCount || 0);
      setShortlistedCount(data.shortlistedCount || 0);
      setRejectedCount(data.rejectedCount || 0);
    } catch (error) {
      console.error('Error fetching candidate counts:', error);
      showToast('Error loading candidate counts', 'error');
    }
  };

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  const navigateTo = (page) => {
    navigate(page);
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
        <button
          onClick={toggleSidebar}
          style={{
            backgroundColor: "white",
            color: "black",
            border: "none",
            cursor: "pointer",
            fontSize: "18px",
            width: "93px"
          }}
        >
          ☰ Menu
        </button>
        <h1 style={{ color: "black", margin: 0 }}>Recruitment Dashboard</h1>
        <div></div>
      </div>

      {/* Main Content */}
      <div style={{ padding: "20px" }}>
        {/* Dashboard Cards */}
        <div style={{
          display: "flex",
          gap: "20px",
          marginLeft: "430px",
          marginTop: "10px",
          flexWrap: "wrap"
        }}>
          <div style={{
            backgroundColor: "#3b3f45",
            borderRadius: "10px",
            padding: "20px",
            textAlign: "center",
            width: "200px",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
            color: "white"
          }}>
            <h2 style={{ margin: 0, fontSize: "2em" }}>{uploadCount}</h2>
            <p style={{ marginTop: "10px", fontSize: "1.1em" }}>Total Uploaded</p>
          </div>

          <div style={{
            backgroundColor: "#3b3f45",
            borderRadius: "10px",
            padding: "20px",
            textAlign: "center",
            width: "200px",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
            color: "white"
          }}>
            <h2 style={{ margin: 0, fontSize: "2em" }}>{shortlistedCount}</h2>
            <p style={{ marginTop: "10px", fontSize: "1.1em" }}>Shortlisted</p>
          </div>

          <div style={{
            backgroundColor: "#3b3f45",
            borderRadius: "10px",
            padding: "20px",
            textAlign: "center",
            width: "200px",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
            color: "white"
          }}>
            <h2 style={{ margin: 0, fontSize: "2em" }}>{rejectedCount}</h2>
            <p style={{ marginTop: "10px", fontSize: "1.1em" }}>Rejected</p>
          </div>
        </div>

        {/* Navigation Options */}
        <div style={{
          backgroundColor: "white",
          borderRadius: "10px",
          padding: "30px",
          marginTop: "30px",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)"
        }}>
          <h2 style={{ color: "black", marginBottom: "20px" }}>Recruitment Options</h2>
          
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "20px"
          }}>
            <button
              onClick={() => navigateTo('/apprecruit')}
              style={{
                padding: "20px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "16px",
                transition: "background-color 0.3s ease"
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = "#0056b3"}
              onMouseOut={(e) => e.target.style.backgroundColor = "#007bff"}
            >
              <i className="fas fa-code" style={{ marginRight: "10px" }}></i>
              Application Recruitment
            </button>

            <button
              onClick={() => navigateTo('/cloudrecruit')}
              style={{
                padding: "20px",
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "16px",
                transition: "background-color 0.3s ease"
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = "#218838"}
              onMouseOut={(e) => e.target.style.backgroundColor = "#28a745"}
            >
              <i className="fas fa-cloud" style={{ marginRight: "10px" }}></i>
              Cloud Recruitment
            </button>

            <button
              onClick={() => navigateTo('/datarecruit')}
              style={{
                padding: "20px",
                backgroundColor: "#ffc107",
                color: "black",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "16px",
                transition: "background-color 0.3s ease"
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = "#e0a800"}
              onMouseOut={(e) => e.target.style.backgroundColor = "#ffc107"}
            >
              <i className="fas fa-database" style={{ marginRight: "10px" }}></i>
              Data Recruitment
            </button>

            <button
              onClick={() => navigateTo('/candidates')}
              style={{
                padding: "20px",
                backgroundColor: "#17a2b8",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "16px",
                transition: "background-color 0.3s ease"
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = "#138496"}
              onMouseOut={(e) => e.target.style.backgroundColor = "#17a2b8"}
            >
              <i className="fas fa-users" style={{ marginRight: "10px" }}></i>
              View Candidates
            </button>

            <button
              onClick={() => navigateTo('/upload-status')}
              style={{
                padding: "20px",
                backgroundColor: "#6f42c1",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "16px",
                transition: "background-color 0.3s ease"
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = "#5a32a3"}
              onMouseOut={(e) => e.target.style.backgroundColor = "#6f42c1"}
            >
              <i className="fas fa-upload" style={{ marginRight: "10px" }}></i>
              Upload Status
            </button>

            <button
              onClick={() => navigateTo('/interview-schedule')}
              style={{
                padding: "20px",
                backgroundColor: "#dc3545",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "16px",
                transition: "background-color 0.3s ease"
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = "#c82333"}
              onMouseOut={(e) => e.target.style.backgroundColor = "#dc3545"}
            >
              <i className="fas fa-calendar-alt" style={{ marginRight: "10px" }}></i>
              Interview Schedule
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div style={{
          backgroundColor: "white",
          borderRadius: "10px",
          padding: "30px",
          marginTop: "30px",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)"
        }}>
          <h2 style={{ color: "black", marginBottom: "20px" }}>Quick Statistics</h2>
          
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "20px"
          }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ 
                fontSize: "2em", 
                fontWeight: "bold", 
                color: "#007bff",
                marginBottom: "10px"
              }}>
                {uploadCount}
              </div>
              <div style={{ color: "#666" }}>Total Resumes</div>
            </div>

            <div style={{ textAlign: "center" }}>
              <div style={{ 
                fontSize: "2em", 
                fontWeight: "bold", 
                color: "#28a745",
                marginBottom: "10px"
              }}>
                {shortlistedCount}
              </div>
              <div style={{ color: "#666" }}>Shortlisted</div>
            </div>

            <div style={{ textAlign: "center" }}>
              <div style={{ 
                fontSize: "2em", 
                fontWeight: "bold", 
                color: "#dc3545",
                marginBottom: "10px"
              }}>
                {rejectedCount}
              </div>
              <div style={{ color: "#666" }}>Rejected</div>
            </div>

            <div style={{ textAlign: "center" }}>
              <div style={{ 
                fontSize: "2em", 
                fontWeight: "bold", 
                color: "#ffc107",
                marginBottom: "10px"
              }}>
                {uploadCount > 0 ? Math.round((shortlistedCount / uploadCount) * 100) : 0}%
              </div>
              <div style={{ color: "#666" }}>Success Rate</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Recruitment;