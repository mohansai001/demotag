import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Sidebar = ({ visible, onToggle, onLogout, userInfo }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      id: 'interviews',
      icon: 'fas fa-users',
      label: 'Pre-Screening',
      path: '/gt-prescreening',
      tooltip: 'Interviews'
    },
    {
      id: 'jd-templates',
      icon: 'fas fa-file-alt',
      label: 'JD Templates',
      path: '/jd-templates',
      tooltip: 'JD Templates',
      comingSoon: true
    },
    {
      id: 'role',
      icon: 'fas fa-file-signature',
      label: 'Fulfillment Form',
      path: '/fulfillment-form',
      tooltip: 'Role',
      comingSoon: true
    },
    {
      id: 'candidateInfo',
      icon: 'fas fa-tasks',
      label: 'Assessment',
      path: '/assessment',
      tooltip: 'candidateInfo',
      comingSoon: true
    },
    {
      id: 'dashboard',
      icon: 'fas fa-tachometer-alt',
      label: 'Reports',
      path: '/dashboard',
      tooltip: 'Dashboard',
      comingSoon: true
    },
    {
      id: 'technical-panel',
      icon: 'fas fa-laptop-code',
      label: 'Technical Panel',
      path: '/technical-panel',
      tooltip: 'Technical Panel',
      comingSoon: true
    }
  ];

  const handleMenuClick = (item) => {
    if (item.comingSoon) {
      // Show coming soon popup
      showPopup();
    } else {
      navigate(item.path);
    }
  };

  const showPopup = () => {
    // This would trigger a modal or popup - for now just alert
    alert('Coming Soon!');
  };

  return (
    <div className={`sidebar ${!visible ? 'hidden' : ''}`}>
      <div className="sidebar-menu">
        <h2>Menu</h2>
        
        {menuItems.map((item) => (
          <div
            key={item.id}
            className={`sidebar-option ${location.pathname === item.path ? 'active' : ''}`}
            onClick={() => handleMenuClick(item)}
            data-tooltip={item.tooltip}
          >
            <i className={item.icon}></i>
            <span>
              {item.label}
              {item.comingSoon && (
                <div className="chip primary">
                  Coming Soon
                </div>
              )}
            </span>
          </div>
        ))}
        
        <div className="sidebar-option logout-option" onClick={onLogout} data-tooltip="Logout">
          <i className="fas fa-sign-out-alt"></i>
          <span>Logout</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;