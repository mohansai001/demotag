import React from 'react';
import './Button.css';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'medium', 
  disabled = false, 
  loading = false,
  icon,
  onClick,
  type = 'button',
  className = '',
  ...props 
}) => {
  const buttonClass = `
    btn 
    btn-${variant} 
    btn-${size} 
    ${disabled ? 'btn-disabled' : ''} 
    ${loading ? 'btn-loading' : ''} 
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <button
      type={type}
      className={buttonClass}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && <span className="btn-spinner"></span>}
      {icon && !loading && <i className={`${icon} btn-icon`}></i>}
      {children}
    </button>
  );
};

export default Button;