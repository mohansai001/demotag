import React from 'react';
import './Card.css';

const Card = ({ 
  children, 
  variant = 'default',
  hover = false,
  shadow = 'medium',
  padding = 'medium',
  className = '',
  ...props 
}) => {
  const cardClass = `
    card 
    card-${variant} 
    ${hover ? 'card-hover' : ''} 
    card-shadow-${shadow}
    card-padding-${padding}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <div className={cardClass} {...props}>
      {children}
    </div>
  );
};

const CardHeader = ({ children, className = '', ...props }) => (
  <div className={`card-header ${className}`} {...props}>
    {children}
  </div>
);

const CardBody = ({ children, className = '', ...props }) => (
  <div className={`card-body ${className}`} {...props}>
    {children}
  </div>
);

const CardFooter = ({ children, className = '', ...props }) => (
  <div className={`card-footer ${className}`} {...props}>
    {children}
  </div>
);

const CardTitle = ({ children, level = 3, className = '', ...props }) => {
  const Tag = `h${level}`;
  return (
    <Tag className={`card-title ${className}`} {...props}>
      {children}
    </Tag>
  );
};

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;
Card.Title = CardTitle;

export default Card;