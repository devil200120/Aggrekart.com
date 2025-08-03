import React from 'react';
import { AlertTriangle, Mail, Phone } from 'lucide-react';
import './SuspensionDialog.css';

const SuspensionDialog = ({ isOpen, suspensionData, onClose, onLogout }) => {
  if (!isOpen) return null;

  return (
    <div className="suspension-dialog-overlay">
      <div className="suspension-dialog">
        <div className="suspension-header">
          <AlertTriangle size={48} className="suspension-icon" />
          <h2>Account Suspended</h2>
        </div>
        
        <div className="suspension-content">
          <p className="suspension-message">
            Your supplier account has been suspended and you cannot access supplier features at this time.
          </p>
          
          <div className="suspension-details">
            <div className="detail-item">
              <strong>Reason:</strong>
              <span>{suspensionData?.suspensionReason || 'Administrative decision'}</span>
            </div>
            
            <div className="detail-item">
              <strong>Suspended on:</strong>
              <span>{new Date(suspensionData?.suspendedAt).toLocaleDateString()}</span>
            </div>
          </div>
          
          <div className="contact-support">
            <h4>Need Help?</h4>
            <p>Please contact our support team for assistance:</p>
            <div className="contact-methods">
              <div className="contact-item">
                <Mail size={16} />
                <span>support@aggrekart.com</span>
              </div>
              <div className="contact-item">
                <Phone size={16} />
                <span>+91-XXX-XXX-XXXX</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="suspension-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            Stay Logged In
          </button>
          <button className="btn btn-primary" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuspensionDialog;