import React, { useState } from 'react';
import { useMsal } from '@azure/msal-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { loginRequest } from '../config/msalConfig';
import Modal from './common/Modal';
import './Login.css';

const Login = () => {
  const { instance } = useMsal();
  const navigate = useNavigate();
  const [selectedTeam, setSelectedTeam] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  const handleTeamChange = (event) => {
    setSelectedTeam(event.target.value);
  };

  const handleLogin = async () => {
    if (!selectedTeam) {
      setModalMessage('Please select a team.');
      setShowModal(true);
      return;
    }

    if (selectedTeam === 'admin-Login') {
      handleAdminLogin();
    } else {
      try {
        const loginResponse = await instance.loginPopup(loginRequest);
        const account = loginResponse.account;

        if (account) {
          const email = account.username;
          localStorage.setItem('userEmail', email);
          console.log('Logged in email:', email);
          
          setModalMessage(`Welcome, ${account.name}!`);
          setShowModal(true);

          // If panel, skip DB check and redirect directly
          if (selectedTeam === 'panel') {
            setTimeout(() => {
              navigate(`/panel?ec_mapping=${encodeURIComponent(selectedTeam)}`);
            }, 1000);
            return;
          }

          // For other teams, check admin status and get ec_mapping
          const response = await fetch('/api/check-admin', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            setModalMessage(errorData.error || 'Error checking admin access.');
            setShowModal(true);
            return;
          }

          const { ec_mapping } = await response.json();

          // Redirect based on the selected team
          if (['tag', 'app-ec', 'data-ec', 'cloud-ec'].includes(selectedTeam)) {
            setTimeout(() => {
              navigate(`/dashboard?ec_mapping=${encodeURIComponent(ec_mapping)}`);
            }, 1000);
          }
        }
      } catch (error) {
        console.error('Login failed:', error);
        if (error.errorCode === 'interaction_required') {
          setModalMessage('Interaction required for login. Please try again.');
        } else {
          setModalMessage('Authentication failed. Please check your network or contact support.');
        }
        setShowModal(true);
      }
    }
  };

  const handleAdminLogin = () => {
    if (adminUsername === 'admin' && adminPassword === 'admin') {
      navigate('/admin');
    } else {
      toast.success('Invalid username or password. Please try again.');
    }
  };

  return (
    <div className="login-container">
      <div className="logo-container">
        <img src="/logo.png" alt="Logo" className="logo" />
      </div>

      <div className="login-form-container">
        <h1>Welcome To ValueMomentum Hire Assist Portal</h1>

        <form className="login-form">
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

          {selectedTeam === 'admin-Login' && (
            <div className="admin-credentials">
              <div className="credential-field">
                <label htmlFor="admin-username">Username:</label>
                <input
                  type="text"
                  id="admin-username"
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  placeholder="Enter Username"
                />
              </div>

              <div className="credential-field">
                <label htmlFor="admin-password">Password:</label>
                <input
                  type="password"
                  id="admin-password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Enter Password"
                />
              </div>
            </div>
          )}

          <button type="button" onClick={handleLogin} className="login-button">
            Login
          </button>
        </form>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        message={modalMessage}
      />
    </div>
  );
};

export default Login;