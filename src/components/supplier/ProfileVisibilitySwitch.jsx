import React, { useState, useEffect } from 'react';
import { supplierAPI } from '../../services/api';
import { toast } from 'react-toastify';
import './ProfileVisibilitySwitch.css';

const ProfileVisibilitySwitch = () => {
  const [profileEnabled, setProfileEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProfileStatus();
  }, []);

  const fetchProfileStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔍 ProfileVisibilitySwitch: Fetching profile status...');
      
      const apiResponse = await supplierAPI.getProfileStatus();
      console.log('✅ ProfileVisibilitySwitch: API Response:', apiResponse);
      
      if (apiResponse && apiResponse.success === true && apiResponse.data) {
        const { data } = apiResponse;
        console.log('👤 Supplier data:', data.supplier);
        
        if (data.supplier && typeof data.supplier.profileEnabled === 'boolean') {
          const enabled = data.supplier.profileEnabled;
          setProfileEnabled(enabled);
          console.log('✅ Profile enabled status set to:', enabled);
        } else {
          console.error('❌ ProfileEnabled not found:', data.supplier?.profileEnabled);
          setError('Profile enabled status not found in response');
        }
      } else {
        console.error('❌ Response not successful:', apiResponse);
        setError(apiResponse?.message || 'Invalid response from server');
      }
      
    } catch (error) {
      console.error('❌ Error fetching profile status:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load profile status';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (event) => {
    if (toggling || error) {
      event.preventDefault();
      return;
    }

    try {
      setToggling(true);
      const newStatus = !profileEnabled;
      
      console.log('🔄 ProfileVisibilitySwitch: Toggling profile from', profileEnabled, 'to', newStatus);
      
      // Update state immediately for instant UI feedback
      setProfileEnabled(newStatus);
      
      const apiResponse = await supplierAPI.toggleProfile(newStatus);
      console.log('✅ Toggle response:', apiResponse);
      
      // Check if toggle was successful
      if (apiResponse && apiResponse.success) {
        console.log('✅ Toggle successful, status confirmed as:', newStatus);
        
        toast.success(`Profile ${newStatus ? 'enabled' : 'disabled'} successfully`, {
          position: "top-right",
          autoClose: 3000
        });
        
        // Refetch status after a short delay to ensure backend consistency
        setTimeout(() => {
          console.log('🔄 Refetching status to confirm changes...');
          fetchProfileStatus();
        }, 500);
        
      } else {
        console.error('❌ Toggle not successful:', apiResponse);
        // Revert the optimistic update
        setProfileEnabled(!newStatus);
        throw new Error(apiResponse?.message || 'Toggle failed');
      }
      
    } catch (error) {
      console.error('❌ Error toggling profile:', error);
      
      // Revert the optimistic update on error
      setProfileEnabled(!newStatus);
      
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update profile status';
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 5000
      });
    } finally {
      setToggling(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="profile-visibility-switch loading">
        <div className="switch-info">
          <div className="switch-icon loading">
            ⏳
          </div>
          <div className="switch-details">
            <span className="switch-title">Profile Visibility</span>
            <span className="switch-subtitle">Loading status...</span>
          </div>
        </div>
        <div className="switch-toggle">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="profile-visibility-switch error">
        <div className="switch-info">
          <div className="switch-icon error">
            ❌
          </div>
          <div className="switch-details">
            <span className="switch-title">Profile Visibility</span>
            <span className="switch-subtitle">{error}</span>
          </div>
        </div>
        <div className="switch-toggle">
          <button 
            className="retry-button"
            onClick={fetchProfileStatus}
            disabled={loading}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-visibility-switch">
      <div className="switch-info">
        <div className="switch-icon">
          {profileEnabled ? '👁️' : '🚫'}
        </div>
        <div className="switch-details">
          <span className="switch-title">Profile Visibility</span>
          <span className="switch-subtitle">
            {profileEnabled ? 'Products visible to customers' : 'Products hidden from customers'}
          </span>
        </div>
      </div>
      <div className="switch-toggle">
        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={profileEnabled}
            onChange={handleToggle}
            disabled={toggling}
          />
          <span className="slider">
            <span className="slider-button">
              {toggling && <span className="mini-spinner">⟳</span>}
            </span>
          </span>
        </label>
      </div>
    </div>
  );
};

export default ProfileVisibilitySwitch;