import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = () => {
  const [selectedTeam, setSelectedTeam] = useState('');
  const [adminCredentials, setAdminCredentials] = useState({
    username: '',
    password: ''
  });
  const [showAdminFields, setShowAdminFields] = useState(false);
  const [msalInstance, setMsalInstance] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Initialize MSAL
    const msalConfig = {
      auth: {
        clientId: "ed0b1bf7-b012-4e13-a526-b696932c0673",
        authority: "https://login.microsoftonline.com/13085c86-4bcb-460a-a6f0-b373421c6323",
        redirectUri: window.location.origin,
      },
    };

    if (window.msal) {
      const instance = new window.msal.PublicClientApplication(msalConfig);
      setMsalInstance(instance);
    }
  }, []);

  const handleTeamChange = (e) => {
    const team = e.target.value;
    setSelectedTeam(team);
    setShowAdminFields(team === 'admin-Login');
  };

  const handleAdminCredentialsChange = (e) => {
    const { name, value } = e.target;
    setAdminCredentials(prev => ({
      ...prev,
      [name]: value
    }));
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
    
    if (username === 'admin' && password === 'admin') {
      navigate('/admin');
    } else {
      window.showToast('Invalid username or password. Please try again.', 'error');
    }
  };

  const handleLogin = async () => {
    if (!selectedTeam) {
      window.showToast('Please select a team.', 'error');
      return;
    }

    if (selectedTeam === 'admin-Login') {
      handleAdminLogin();
      return;
    }

    if (!msalInstance) {
      window.showToast('Authentication service not available.', 'error');
      return;
    }

    try {
      const loginRequest = {
        scopes: ["openid", "profile", "user.read", "Mail.Send"],
      };

      const loginResponse = await msalInstance.loginPopup(loginRequest);
      const account = loginResponse.account;

      if (account) {
        const email = account.username;
        const name = account.name;
        localStorage.setItem("userEmail", email);
        
        await logLoginDetails(email, name);
        window.showToast(`Welcome, ${name}!`, 'success');

        // If panel, redirect directly
        if (selectedTeam === 'panel') {
          navigate(`/panel?ec_mapping=${encodeURIComponent(selectedTeam)}`);
          return;
        }

        // For other teams, check admin status
        const response = await fetch('/api/check-admin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          window.showToast(errorData.error || 'Error checking admin access.', 'error');
          return;
        }

        const { ec_mapping } = await response.json();

        // Redirect based on the selected team
        if (['tag', 'app-ec', 'data-ec', 'cloud-ec'].includes(selectedTeam)) {
          navigate(`/dashboard?ec_mapping=${encodeURIComponent(ec_mapping)}`);
        }
      }
    } catch (error) {
      console.error('Login failed:', error);
      window.showToast('Authentication failed. Please check your network or contact support.', 'error');
    }
  };

  return (
    <div className="login-container">
      <div className="login-logo">
        <img src="/logo.png" alt="Logo" />
      </div>
      
      <div className="login-form-container">
        <h1>Welcome To ValueMomentum Hire Assist Portal</h1>
        
        <form className="login-form">
          <div className="form-group">
            <label htmlFor="team-select">Select Your Team:</label>
            <select
              id="team-select"
              value={selectedTeam}
              onChange={handleTeamChange}
              required
            >
              <option value="">Select Your Team</option>
              <option value="tag">TAG Team</option>
              <option value="panel">Panel Login</option>
              <option value="app-ec">App EC Lead</option>
              <option value="data-ec">Data EC Lead</option>
              <option value="cloud-ec">Cloud EC Lead</option>
              <option value="admin-Login">Admin</option>
            </select>
          </div>

          {showAdminFields && (
            <div className="admin-credentials">
              <div className="form-group">
                <label htmlFor="admin-username">Username:</label>
                <input
                  type="text"
                  id="admin-username"
                  name="username"
                  value={adminCredentials.username}
                  onChange={handleAdminCredentialsChange}
                  placeholder="Enter Username"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="admin-password">Password:</label>
                <input
                  type="password"
                  id="admin-password"
                  name="password"
                  value={adminCredentials.password}
                  onChange={handleAdminCredentialsChange}
                  placeholder="Enter Password"
                />
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleLogin}
            className="btn btn-primary login-btn"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;