// Replace the entire component:

import React, { useState, useEffect } from 'react';
import { supplierAPI } from '../../services/api';
import { toast } from 'react-toastify';
import './NavbarProfileToggle.css';

const NavbarProfileToggle = () => {
  const [profileEnabled, setProfileEnabled] = useState(true); // Default to true instead of null
  const [loading, setLoading] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [hasData, setHasData] = useState(false); // Track if we have data

  useEffect(() => {
    fetchProfileStatus();
  }, []);

  const fetchProfileStatus = async () => {
    try {
      console.log('🔍 NavbarProfileToggle: Fetching profile status...');
      const response = await supplierAPI.getProfileStatus();
      console.log('✅ NavbarProfileToggle: Response received:', response.data);
      
      if (response.data && response.data.data && response.data.data.supplier) {
        setProfileEnabled(response.data.data.supplier.profileEnabled);
        setHasData(true);
        console.log('✅ NavbarProfileToggle: Profile enabled status:', response.data.data.supplier.profileEnabled);
      } else {
        console.warn('⚠️ NavbarProfileToggle: Invalid response structure');
        setHasData(false);
      }
    } catch (error) {
      console.error('❌ NavbarProfileToggle: Error fetching profile status:', error);
      setHasData(false);
      // Don't show toast error in navbar to avoid disrupting navigation
    }
  };

  const handleToggle = async () => {
    if (loading) return;

    try {
      setLoading(true);
      const newStatus = !profileEnabled;
      
      console.log('🔄 NavbarProfileToggle: Toggling profile to:', newStatus);
      await supplierAPI.toggleProfile(newStatus);
      setProfileEnabled(newStatus);
      
      toast.success(`Profile ${newStatus ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('❌ NavbarProfileToggle: Error toggling profile:', error);
      toast.error('Failed to update profile status');
    } finally {
      setLoading(false);
    }
  };

  const tooltipText = profileEnabled 
    ? 'Profile visible - Click to hide your products' 
    : 'Profile hidden - Click to show your products';

  return (
    <div 
      className="navbar-profile-toggle"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <button
        onClick={handleToggle}
        disabled={loading}
        className={`profile-toggle-btn ${profileEnabled ? 'enabled' : 'disabled'} ${!hasData ? 'no-data' : ''}`}
        title={hasData ? tooltipText : 'Loading profile status...'}
      >
        {loading ? (
          <span className="toggle-spinner">⟳</span>
        ) : !hasData ? (
          <span className="toggle-icon">❓</span>
        ) : (
          <span className="toggle-icon">
            {profileEnabled ? '👁️' : '🚫'}
          </span>
        )}
      </button>
      
      {showTooltip && hasData && (
        <div className="profile-toggle-tooltip">
          <div className="tooltip-content">
            <strong>{profileEnabled ? 'Profile Visible' : 'Profile Hidden'}</strong>
            <p>{profileEnabled ? 'Products visible to customers' : 'Products hidden from customers'}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default NavbarProfileToggle;