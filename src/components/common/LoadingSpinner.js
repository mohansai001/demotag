import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ 
  size = 'medium', 
  variant = 'primary',
  text,
  overlay = false,
  className = '',
  ...props 
}) => {
  const spinnerClass = `
    loading-spinner 
    loading-spinner-${size} 
    loading-spinner-${variant}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  const content = (
    <div className={`loading-container ${overlay ? 'loading-overlay' : ''}`}>
      <div className={spinnerClass} {...props}>
        <div className="spinner-circle"></div>
        <div className="spinner-circle"></div>
        <div className="spinner-circle"></div>
        <div className="spinner-circle"></div>
      </div>
      {text && <div className="loading-text">{text}</div>}
    </div>
  );

  return content;
};

export default LoadingSpinner;