import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './SupportWidget.css';

const SupportWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();

  // Only show for customers
  if (!user || user.role !== 'customer') {
    return null;
  }

  return (
    <div className="support-widget">
      <button 
        className="support-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Support"
      >
        🎫
      </button>
      
      {isOpen && (
        <div className="support-menu">
          <div className="support-header">
            <h4>Need Help?</h4>
            <button 
              className="close-btn"
              onClick={() => setIsOpen(false)}
            >
              ×
            </button>
          </div>
          
          <div className="support-options">
            <Link 
              to="/support/create" 
              className="support-option"
              onClick={() => setIsOpen(false)}
            >
              <span className="option-icon">📝</span>
              <span className="option-text">Create Ticket</span>
            </Link>
            
            <Link 
              to="/support/tickets" 
              className="support-option"
              onClick={() => setIsOpen(false)}
            >
              <span className="option-icon">📋</span>
              <span className="option-text">My Tickets</span>
            </Link>
            
            <a 
              href="mailto:support@aggrekart.com" 
              className="support-option"
              onClick={() => setIsOpen(false)}
            >
              <span className="option-icon">📧</span>
              <span className="option-text">Email Support</span>
            </a>
            
            <a 
              href="tel:+918837788388" 
              className="support-option"
              onClick={() => setIsOpen(false)}
            >
              <span className="option-icon">📞</span>
              <span className="option-text">Call Support</span>
            </a>
          </div>
          
          <div className="support-footer">
            <small>Mon-Sat: 9AM-7PM</small>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportWidget;