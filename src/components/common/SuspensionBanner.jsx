import React from 'react';
import { AlertTriangle, X, LogOut } from 'lucide-react';
import './SuspensionBanner.css';

const SuspensionBanner = ({ suspensionData, onClose, onLogout }) => {
  return (
    <div className="suspension-banner">
      <div className="suspension-banner-content">
        <div className="suspension-icon">
          <AlertTriangle size={24} />
        </div>
        <div className="suspension-message">
          <h4>Account Suspended</h4>
          <p>
            Your supplier account has been suspended. 
            Reason: {suspensionData?.suspensionReason || 'Administrative decision'}
          </p>
        </div>
        <div className="suspension-actions">
          <button 
            onClick={onLogout}
            className="logout-btn"
            title="Logout"
          >
            <LogOut size={16} />
            Logout
          </button>
          <button 
            onClick={onClose}
            className="close-btn"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuspensionBanner;