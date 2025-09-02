// Create new component for profile visibility control:

import React, { useState, useEffect } from "react";
import { supplierAPI } from "../../services/api";
import { toast } from "react-toastify";
import "./ProfileToggle.css";

const ProfileToggle = () => {
  const [profileStatus, setProfileStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [disableReason, setDisableReason] = useState("");

  useEffect(() => {
    fetchProfileStatus();
  }, []);

  // Replace the fetchProfileStatus function around line 20:

  const fetchProfileStatus = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching profile status...');
      
      const response = await supplierAPI.getProfileStatus();
      console.log('✅ Raw API response:', response);
      console.log('📦 Response data:', response.data);
      
      // Check if we have the expected response structure
      if (response.data) {
        // FIX: Handle both nested and direct data structures
        const profileData = response.data.data || response.data;
        
        if (profileData && profileData.supplier) {
          console.log('✅ Setting profile status:', profileData);
          setProfileStatus(profileData);
        } else {
          console.error('❌ Missing supplier data in response:', response.data);
          throw new Error('Invalid response structure - missing supplier data');
        }
      } else {
        console.error('❌ No data in response:', response);
        throw new Error('No data received from server');
      }
    } catch (error) {
      console.error('❌ Error fetching profile status:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      
      // Show more specific error message
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load profile status';
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };
  const handleToggleProfile = async () => {
    if (!profileStatus.supplier.profileEnabled) {
      // Enabling profile - no confirmation needed
      await toggleProfile(true);
    } else {
      // Disabling profile - show confirmation modal
      setShowConfirmModal(true);
    }
  };

  const toggleProfile = async (enabled, reason = "") => {
    try {
      setToggling(true);
      await supplierAPI.toggleProfile(enabled, reason);

      toast.success(`Profile ${enabled ? "enabled" : "disabled"} successfully`);
      await fetchProfileStatus();
      setShowConfirmModal(false);
      setDisableReason("");
    } catch (error) {
      console.error("❌ Error toggling profile:", error);
      toast.error(
        error.response?.data?.message || "Failed to update profile status"
      );
    } finally {
      setToggling(false);
    }
  };

  const confirmDisable = () => {
    toggleProfile(false, disableReason);
  };

  if (loading) {
    return (
      <div className="profile-toggle-loading">
        <div className="spinner"></div>
        <p>Loading profile status...</p>
      </div>
    );
  }

  if (!profileStatus) {
    return (
      <div className="profile-toggle-error">
        <p>Unable to load profile status</p>
        <button onClick={fetchProfileStatus} className="btn btn-primary">
          Retry
        </button>
      </div>
    );
  }

  const { supplier, productStats, canToggle } = profileStatus;

  return (
    <div className="profile-toggle-container">
      <div className="profile-status-card">
        <div className="status-header">
          <h2>Profile Visibility</h2>
          <div
            className={`status-badge ${supplier.profileEnabled ? "enabled" : "disabled"}`}
          >
            {supplier.profileEnabled ? "✅ Enabled" : "❌ Disabled"}
          </div>
        </div>

        <div className="profile-info">
          <div className="company-info">
            <h3>{supplier.companyName}</h3>
            <p>Supplier ID: {supplier.supplierId}</p>
          </div>

          {!supplier.profileEnabled && supplier.profileDisabledAt && (
            <div className="disabled-info">
              <p>
                <strong>Disabled on:</strong>{" "}
                {new Date(supplier.profileDisabledAt).toLocaleString()}
              </p>
              {supplier.profileDisabledReason && (
                <p>
                  <strong>Reason:</strong> {supplier.profileDisabledReason}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="product-stats">
          <h4>Product Statistics</h4>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-number">{productStats.totalProducts}</span>
              <span className="stat-label">Total Products</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{productStats.activeProducts}</span>
              <span className="stat-label">Active Products</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">
                {productStats.visibleProducts}
              </span>
              <span className="stat-label">Visible to Customers</span>
            </div>
            {productStats.hiddenProducts > 0 && (
              <div className="stat-item hidden">
                <span className="stat-number">
                  {productStats.hiddenProducts}
                </span>
                <span className="stat-label">Hidden Products</span>
              </div>
            )}
          </div>
        </div>

        <div className="impact-info">
          {supplier.profileEnabled ? (
            <div className="warning-message">
              <h4>⚠️ Impact of Disabling Profile</h4>
              <p>
                Disabling your profile will immediately hide{" "}
                <strong>{productStats.activeProducts} products</strong> from
                customers. They won't be able to see or purchase your products
                until you re-enable your profile.
              </p>
            </div>
          ) : (
            <div className="success-message">
              <h4>✅ Impact of Enabling Profile</h4>
              <p>
                Enabling your profile will make{" "}
                <strong>{productStats.activeProducts} approved products</strong>{" "}
                visible to customers immediately.
              </p>
            </div>
          )}
        </div>

        <div className="toggle-actions">
          {!canToggle ? (
            <div className="cannot-toggle">
              <p>
                ❌ Cannot toggle profile - your account needs to be approved and
                active
              </p>
              <p>
                Status: {!supplier.isApproved && "Not Approved"}{" "}
                {!supplier.isActive && "Not Active"}
              </p>
            </div>
          ) : (
            <button
              onClick={handleToggleProfile}
              disabled={toggling}
              className={`btn btn-toggle ${supplier.profileEnabled ? "btn-danger" : "btn-success"}`}
            >
              {toggling ? (
                <>
                  <span className="spinner small"></span>
                  Updating...
                </>
              ) : supplier.profileEnabled ? (
                "Disable Profile"
              ) : (
                "Enable Profile"
              )}
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="modal-overlay">
          <div className="confirmation-modal">
            <h3>Confirm Profile Disable</h3>
            <p>
              Are you sure you want to disable your profile? This will hide all
              your products from customers.
            </p>

            <div className="form-group">
              <label htmlFor="disable-reason">Reason (optional):</label>
              <textarea
                id="disable-reason"
                value={disableReason}
                onChange={(e) => setDisableReason(e.target.value)}
                placeholder="Why are you disabling your profile?"
                rows={3}
                maxLength={500}
              />
              <small>{disableReason.length}/500 characters</small>
            </div>

            <div className="modal-actions">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="btn btn-secondary"
                disabled={toggling}
              >
                Cancel
              </button>
              <button
                onClick={confirmDisable}
                className="btn btn-danger"
                disabled={toggling}
              >
                {toggling ? "Disabling..." : "Confirm Disable"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileToggle;
