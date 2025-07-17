import React from 'react';

const Modal = ({ show, onClose, title, children, size = 'medium' }) => {
  if (!show) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getModalSize = () => {
    switch (size) {
      case 'small':
        return { width: '400px', maxWidth: '90vw' };
      case 'large':
        return { width: '800px', maxWidth: '90vw' };
      default:
        return { width: '600px', maxWidth: '90vw' };
    }
  };

  return (
    <div className="modal show" onClick={handleOverlayClick}>
      <div 
        className="modal-content" 
        style={{
          ...getModalSize(),
          margin: '15% auto',
          padding: '20px',
          backgroundColor: '#fff',
          color: 'black',
          border: '1px solid #888',
          borderRadius: '8px',
          position: 'relative'
        }}
      >
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '20px',
          borderBottom: '1px solid #eee',
          paddingBottom: '10px'
        }}>
          {title && <h3 style={{ margin: 0 }}>{title}</h3>}
          <span 
            className="close" 
            onClick={onClose}
            style={{
              fontSize: '28px',
              fontWeight: 'bold',
              cursor: 'pointer',
              color: '#aaa'
            }}
          >
            &times;
          </span>
        </div>
        <div>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;