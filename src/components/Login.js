import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = ({ onLogin, showToast }) => {
  const [selectedTeam, setSelectedTeam] = useState('');
  const [adminCredentials, setAdminCredentials] = useState({
    username: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const navigate = useNavigate();

  const msalConfig = {
    auth: {
      clientId: "ed0b1bf7-b012-4e13-a526-b696932c0673",
      authority: "https://login.microsoftonline.com/13085c86-4bcb-460a-a6f0-b373421c6323",
      redirectUri: window.location.origin,
    },
  };

  const loginRequest = {
    scopes: ["openid", "profile", "user.read", "Mail.Send"],
  };

  const handleTeamChange = (e) => {
    setSelectedTeam(e.target.value);
  };

  const handleAdminCredentialsChange = (e) => {
    setAdminCredentials({
      ...adminCredentials,
      [e.target.name]: e.target.value
    });
  };

  const showModalMessage = (message) => {
    setModalMessage(message);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalMessage('');
  };

  const logLoginDetails = async (email, name) => {
    const now = new Date();
    const loginData = {
      email: email,
      name: name,
      date: now.toLocaleDateString('en-CA'),
      time: now.toTimeString().split(' ')[0],
    };

    try {
      const response = await fetch('/api/log-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });
      
      if (!response.ok) {
        console.error('Failed to log login details:', await response.text());
        return;
      }
      
      const responseData = await response.json();
      if (responseData.success && responseData.id) {
        localStorage.setItem('loggin-id', responseData.id);
        console.log('Login details logged successfully. ID:', responseData.id);
      }

    } catch (error) {
      console.error('Error sending login details to the server:', error);
    }
  };

  const handleAdminLogin = () => {
    const { username, password } = adminCredentials;
    
    if (username === "admin" && password === "admin") {
      // Simulate admin user info
      const adminUser = {
        username: 'admin@company.com',
        name: 'Administrator',
        isAdmin: true
      };
      onLogin(adminUser);
      navigate('/admin');
    } else {
      showToast("Invalid username or password. Please try again.", "error");
    }
  };

  const handleMsalLogin = async () => {
    if (!selectedTeam) {
      showModalMessage("Please select a team.");
      return;
    }

    if (selectedTeam === "admin-Login") {
      handleAdminLogin();
      return;
    }

    setIsLoading(true);

    try {
      // Import MSAL dynamically
      const msal = await import('@azure/msal-browser');
      const msalInstance = new msal.PublicClientApplication(msalConfig);
      await msalInstance.initialize();

      const loginResponse = await msalInstance.loginPopup(loginRequest);
      const account = loginResponse.account;

      if (account) {
        const email = account.username;
        const name = account.name;
        localStorage.setItem("userEmail", email);
        console.log("Logged in email:", email);
        
        // Log details to the database
        await logLoginDetails(email, name);

        showModalMessage(`Welcome, ${name}!`);

        // If panel, skip DB check and redirect directly
        if (selectedTeam === "panel") {
          const userInfo = {
            ...account,
            team: selectedTeam,
            ec_mapping: selectedTeam
          };
          onLogin(userInfo);
          navigate('/panel');
          return;
        }

        // For other teams, check admin status and get ec_mapping
        const response = await fetch("/api/check-admin", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          showModalMessage(errorData.error || "Error checking admin access.");
          return;
        }

        const { ec_mapping } = await response.json();

        // Create user info object
        const userInfo = {
          ...account,
          team: selectedTeam,
          ec_mapping: ec_mapping
        };

        onLogin(userInfo);

        // Redirect based on the selected team
        if (["tag", "app-ec", "data-ec", "cloud-ec"].includes(selectedTeam)) {
          navigate('/ec-selection', { state: { ec_mapping } });
        }
      }
    } catch (error) {
      console.error("Login failed:", error);
      if (error.name === 'InteractionRequiredAuthError') {
        showModalMessage("Interaction required for login. Please try again.");
      } else {
        showModalMessage("Authentication failed. Please check your network or contact support.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ 
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      margin: 0,
      padding: 0,
      background: "linear-gradient(120deg, #e6e6fa, #daf7a6)",
      color: "#e0e0e0",
      height: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center"
    }}>
      <div style={{
        maxWidth: "46%",
        position: "fixed",
        top: "55px",
        left: "20px"
      }}>
        <img src="/logo.png" alt="Logo" style={{ maxWidth: "100%", height: "auto" }} />
      </div>

      <div style={{
        background: "white",
        padding: "40px",
        borderRadius: "10px",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        color: "black",
        minWidth: "400px"
      }}>
        <h1 style={{ textAlign: "center", marginBottom: "20px" }}>
          Welcome To ValueMomentum Hire Assist Portal
        </h1>

        <form style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <label htmlFor="team-select" style={{ width: "100%", textAlign: "center", marginBottom: "10px" }}>
            Select Your Team:
          </label>
          <select
            id="team-select"
            value={selectedTeam}
            onChange={handleTeamChange}
            required
            style={{ 
              width: "90%", 
              maxWidth: "270px", 
              textAlign: "center",
              padding: "10px",
              marginBottom: "20px",
              border: "1px solid #ddd",
              borderRadius: "4px"
            }}
          >
            <option value="">Select Your Team</option>
            <option value="tag">TAG Team</option>
            <option value="panel">Panel Login</option>
            <option value="app-ec">App EC Lead</option>
            <option value="data-ec">Data EC Lead</option>
            <option value="cloud-ec">Cloud EC Lead</option>
            <option value="admin-Login">Admin</option>
          </select>

          {selectedTeam === "admin-Login" && (
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              width: "90%",
              maxWidth: "270px",
              marginBottom: "20px"
            }}>
              <div style={{ display: "flex", alignItems: "center", marginBottom: "10px", width: "100%" }}>
                <label style={{ marginRight: "10px", minWidth: "80px" }}>Username:</label>
                <input
                  type="text"
                  name="username"
                  value={adminCredentials.username}
                  onChange={handleAdminCredentialsChange}
                  placeholder="Enter Username"
                  style={{ 
                    flex: 1,
                    padding: "8px",
                    border: "1px solid #ddd",
                    borderRadius: "4px"
                  }}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                <label style={{ marginRight: "10px", minWidth: "80px" }}>Password:</label>
                <input
                  type="password"
                  name="password"
                  value={adminCredentials.password}
                  onChange={handleAdminCredentialsChange}
                  placeholder="Enter Password"
                  style={{ 
                    flex: 1,
                    padding: "8px",
                    border: "1px solid #ddd",
                    borderRadius: "4px"
                  }}
                />
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleMsalLogin}
            disabled={isLoading}
            style={{
              maxWidth: "270px",
              width: "90%",
              padding: "15px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              fontSize: "16px",
              cursor: isLoading ? "not-allowed" : "pointer",
              opacity: isLoading ? 0.6 : 1
            }}
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal show">
          <div className="modal-content">
            <span className="close" onClick={closeModal}>&times;</span>
            <p>{modalMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;