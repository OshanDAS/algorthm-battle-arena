import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/mortal-kombat-theme.css';

export default function MKNavButton({ className = '' }) {
  const navigate = useNavigate();

  return (
    <button 
      className={`mk-btn mk-btn-fight ${className}`}
      onClick={() => navigate('/mk-demo')}
      style={{ 
        position: 'fixed', 
        top: '20px', 
        right: '20px', 
        zIndex: 1000,
        fontSize: '0.9rem',
        padding: '8px 16px'
      }}
    >
      MK Demo
    </button>
  );
}