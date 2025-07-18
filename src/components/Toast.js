import React, { useState, useEffect } from 'react';

const Toast = () => {
  const [toast, setToast] = useState({ message: '', type: '', show: false });

  useEffect(() => {
    // Global function to show toast
    window.showToast = (message, type = 'success') => {
      setToast({ message, type, show: true });
      
      // Auto-hide after 3 seconds
      setTimeout(() => {
        setToast(prev => ({ ...prev, show: false }));
      }, 3000);
    };

    return () => {
      delete window.showToast;
    };
  }, []);

  if (!toast.show) return null;

  return (
    <div className={`toast show ${toast.type}`}>
      {toast.message}
    </div>
  );
};

export default Toast;