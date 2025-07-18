import React, { forwardRef } from 'react';
import './Input.css';

const Input = forwardRef(({ 
  type = 'text',
  label,
  placeholder,
  value,
  onChange,
  onBlur,
  onFocus,
  error,
  disabled = false,
  required = false,
  size = 'medium',
  variant = 'default',
  icon,
  className = '',
  containerClassName = '',
  ...props 
}, ref) => {
  const inputClass = `
    input 
    input-${size} 
    input-${variant}
    ${error ? 'input-error' : ''}
    ${disabled ? 'input-disabled' : ''}
    ${icon ? 'input-with-icon' : ''}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  const containerClass = `
    input-container 
    ${containerClassName}
  `.trim().replace(/\s+/g, ' ');

  return (
    <div className={containerClass}>
      {label && (
        <label className="input-label">
          {label}
          {required && <span className="input-required">*</span>}
        </label>
      )}
      <div className="input-wrapper">
        {icon && <i className={`input-icon ${icon}`}></i>}
        <input
          ref={ref}
          type={type}
          className={inputClass}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          onFocus={onFocus}
          disabled={disabled}
          required={required}
          {...props}
        />
      </div>
      {error && <span className="input-error-message">{error}</span>}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;