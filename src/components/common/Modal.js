import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import Button from './Button';
import './Modal.css';

const Modal = ({ 
  isOpen, 
  onClose, 
  title,
  children, 
  size = 'medium',
  variant = 'default',
  closeOnOverlayClick = true,
  closeOnEsc = true,
  showCloseButton = true,
  className = '',
  ...props 
}) => {
  useEffect(() => {
    if (!closeOnEsc) return;

    const handleEsc = (event) => {
      if (event.keyCode === 27) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, closeOnEsc]);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  const modalClass = `
    modal 
    modal-${size} 
    modal-${variant}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return createPortal(
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className={modalClass} {...props}>
        {(title || showCloseButton) && (
          <div className="modal-header">
            {title && <h3 className="modal-title">{title}</h3>}
            {showCloseButton && (
              <Button
                variant="light"
                size="small"
                onClick={onClose}
                className="modal-close"
                aria-label="Close modal"
              >
                <i className="fas fa-times"></i>
              </Button>
            )}
          </div>
        )}
        <div className="modal-content">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

const ModalHeader = ({ children, className = '', ...props }) => (
  <div className={`modal-header ${className}`} {...props}>
    {children}
  </div>
);

const ModalBody = ({ children, className = '', ...props }) => (
  <div className={`modal-body ${className}`} {...props}>
    {children}
  </div>
);

const ModalFooter = ({ children, className = '', ...props }) => (
  <div className={`modal-footer ${className}`} {...props}>
    {children}
  </div>
);

Modal.Header = ModalHeader;
Modal.Body = ModalBody;
Modal.Footer = ModalFooter;

export default Modal;