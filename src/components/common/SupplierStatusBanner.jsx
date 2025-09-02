import React from "react";
import { AlertTriangle, Clock, Mail, Phone } from "lucide-react";
import "./SupplierStatusBanner.css";

const SupplierStatusBanner = ({ isOpen, alertData, onClose, onLogout }) => {
  if (!isOpen || !alertData) return null;

  const isPendingApproval = alertData.type === "SUPPLIER_PENDING_APPROVAL";
  const isSuspended = alertData.type === "SUPPLIER_SUSPENDED";

  return (
    <div className="supplier-status-banner-overlay">
      <div className="supplier-status-banner">
        <div className="banner-header">
          {isPendingApproval ? (
            <>
              <Clock size={48} className="pending-icon" />
              <h2>Account Pending Approval</h2>
            </>
          ) : (
            <>
              <AlertTriangle size={48} className="suspended-icon" />
              <h2>Account Suspended</h2>
            </>
          )}
        </div>

        <div className="banner-content">
          <p className="status-message">{alertData.message}</p>

          {isPendingApproval && (
            <div className="pending-details">
              <div className="detail-item">
                <strong>Company:</strong>
                <span>{alertData.data?.companyName}</span>
              </div>

              <div className="detail-item">
                <strong>Submitted:</strong>
                <span>
                  {new Date(alertData.data?.submittedAt).toLocaleDateString()}
                </span>
              </div>

              <div className="next-steps">
                <h4>What happens next?</h4>
                <ul>
                  {alertData.data?.nextSteps?.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {isSuspended && (
            <div className="suspension-details">
              <div className="detail-item">
                <strong>Reason:</strong>
                <span>
                  {alertData.data?.suspensionReason ||
                    "Administrative decision"}
                </span>
              </div>

              <div className="detail-item">
                <strong>Suspended on:</strong>
                <span>
                  {new Date(alertData.data?.suspendedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          )}

          <div className="contact-support">
            <h4>Need Help?</h4>
            <div className="contact-info">
              <div className="contact-item">
                <Mail size={16} />
                <span>{alertData.data?.contactSupport?.email}</span>
              </div>
              {alertData.data?.contactSupport?.phone && (
                <div className="contact-item">
                  <Phone size={16} />
                  <span>{alertData.data?.contactSupport?.phone}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="banner-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            {isPendingApproval ? "Continue Browsing" : "Dismiss"}
          </button>
          <button className="btn btn-primary" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default SupplierStatusBanner;
