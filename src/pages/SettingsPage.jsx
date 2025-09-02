// Replace the entire file with this Swiggy-style version:

import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { usersAPI, authAPI, supplierAPI } from '../services/api' 
import toast from 'react-hot-toast'
import LoadingSpinner from '../components/common/LoadingSpinner'
import UserAnalytics from '../components/analytics/UserAnalytics'
// Add this import:
import { useAuth } from '../context/AuthContext'

import './SettingsPage.css'

const SettingsPage = () => {
  const { user, logout } = useAuth()
  const queryClient = useQueryClient()
  
  const [activeTab, setActiveTab] = useState('account')
  const [isEditing, setIsEditing] = useState(false)
  
  // Account settings form
  const [accountForm, setAccountForm] = useState({
    name: '',
    phoneNumber: ''
  })
  
  // Password change form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  
  // Notification preferences
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    smsNotifications: true,
    orderUpdates: true,
    promotionalEmails: false,
    securityAlerts: true,
    newsletterSubscription: false
  })
  
  // Privacy settings
  const [privacy, setPrivacy] = useState({
    profileVisibility: 'private',
    dataSharing: false,
    marketingCommunications: false,
    thirdPartySharing: false
  })

  // Fetch user profile
  const { data: profileData, isLoading: profileLoading } = useQuery(
    'userSettings',
    usersAPI.getProfile,
    {
      onSuccess: (data) => {
        if (data?.success && data?.data?.user) {
          const userData = data.data.user
          setAccountForm({
            name: userData.name || '',
            phoneNumber: userData.phoneNumber || ''
          })
          
          if (userData.preferences) {
            const backendNotifications = userData.preferences.notifications || {}
            setNotifications({
              emailNotifications: backendNotifications.emailNotifications ?? backendNotifications.email ?? true,
              smsNotifications: backendNotifications.smsNotifications ?? backendNotifications.sms ?? true,
              orderUpdates: backendNotifications.orderUpdates ?? true,
              promotionalEmails: backendNotifications.promotionalEmails ?? false,
              securityAlerts: backendNotifications.securityAlerts ?? true,
              newsletterSubscription: backendNotifications.newsletterSubscription ?? false
            })
            
            const backendPrivacy = userData.preferences.privacy || {}
            setPrivacy({
              profileVisibility: backendPrivacy.profileVisibility || 'private',
              dataSharing: backendPrivacy.dataSharing || false,
              marketingCommunications: backendPrivacy.marketingCommunications || false,
              thirdPartySharing: backendPrivacy.thirdPartySharing || false
            })
          }
        }
      },
      onError: (error) => {
        console.error('Failed to load user settings:', error)
        toast.error('Failed to load settings')
      }
    }
  )

  // Update account information
  const updateAccountMutation = useMutation(
    (data) => usersAPI.updateProfile(data),
    {
      onSuccess: (response) => {
        if (response?.success) {
          toast.success('Account information updated successfully!')
          setIsEditing(false)
          queryClient.invalidateQueries('userSettings')
        } else {
          toast.error(response?.message || 'Failed to update account information')
        }
      },
      onError: (error) => {
        console.error('Update account error:', error)
        toast.error('Failed to update account information')
      }
    }
  )

  // Change password mutation
  const changePasswordMutation = useMutation(
    (data) => authAPI.changePassword(data),
    {
      onSuccess: (response) => {
        if (response?.success) {
          toast.success('Password changed successfully!')
          setPasswordForm({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          })
        } else {
          toast.error(response?.message || 'Failed to change password')
        }
      },
      onError: (error) => {
        console.error('Change password error:', error)
        toast.error('Failed to change password')
      }
    }
  )

  // Update preferences mutation
  const updatePreferencesMutation = useMutation(
    (data) => usersAPI.updateProfile({ preferences: data }),
    {
      onSuccess: () => {
        toast.success('Preferences updated successfully!')
        queryClient.invalidateQueries('userSettings')
      },
      onError: (error) => {
        console.error('Update preferences error:', error)
        toast.error('Failed to update preferences')
      }
    }
  )

  // Data export mutation
  // Data export mutation
// Update the dataExportMutation in SettingsPage.jsx:
// Replace the entire dataExportMutation around lines 152-184
const dataExportMutation = useMutation(
  () => {
    return user?.role === 'supplier' 
      ? supplierAPI.exportData()
      : usersAPI.exportUserData()
  },
  {
    onSuccess: (blob) => {
      // Handle PDF blob response
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${user?.role === 'supplier' ? 'supplier' : 'user'}-data-${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Data exported and downloaded successfully!');
    },
    onError: (error) => {
      console.error('Data export error:', error);
      toast.error('Failed to export data');
    }
  }
)
  const handleAccountSubmit = (e) => {
    e.preventDefault()
    
    if (!accountForm.name.trim()) {
      toast.error('Name is required')
      return
    }
    
    if (!accountForm.phoneNumber.trim()) {
      toast.error('Phone number is required')
      return
    }
    
    updateAccountMutation.mutate(accountForm)
  }

  const handlePasswordSubmit = (e) => {
    e.preventDefault()
    
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error('All password fields are required')
      return
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }
    
    if (passwordForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long')
      return
    }
    
    changePasswordMutation.mutate({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword
    })
  }

  const handleNotificationChange = (key, value) => {
    const updatedNotifications = { ...notifications, [key]: value }
    setNotifications(updatedNotifications)
    updatePreferencesMutation.mutate({ notifications: updatedNotifications })
  }

  const handlePrivacyChange = (key, value) => {
    const updatedPrivacy = { ...privacy, [key]: value }
    setPrivacy(updatedPrivacy)
    updatePreferencesMutation.mutate({ privacy: updatedPrivacy })
  }

  const handleDataExport = () => {
    const confirmed = window.confirm(
      'This will generate a file containing all your account data. You will receive an email when the export is ready. Continue?'
    )
    if (confirmed) {
      dataExportMutation.mutate()
    }
  }

  const handleDeleteAccount = () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone.'
    )
    if (confirmed) {
      const doubleConfirm = window.confirm(
        'This will permanently delete all your data including orders, addresses, and preferences. Are you absolutely sure?'
      )
      if (doubleConfirm) {
        toast.error('Account deletion feature is coming soon. Please contact support for assistance.')
      }
    }
  }

  const tabs = [
    { 
      id: 'account', 
      label: 'Account', 
      icon: '👤',
      description: 'Update your basic account details'
    },
    { 
      id: 'security', 
      label: 'Security', 
      icon: '🔒',
      description: 'Change password and security settings'
    },
    { 
      id: 'analytics', 
      label: 'Analytics', 
      icon: '📊',
      description: 'View your usage statistics'
    },
    { 
      id: 'notifications', 
      label: 'Notifications', 
      icon: '🔔',
      description: 'Manage notification preferences'
    },
    { 
      id: 'privacy', 
      label: 'Privacy', 
      icon: '🛡️',
      description: 'Control your privacy settings'
    },
    { 
      id: 'danger', 
      label: 'Account Management', 
      icon: '⚠️',
      description: 'Export data or delete account'
    }
  ]

  if (profileLoading) {
    return (
      <div className="swiggy-loading">
        <LoadingSpinner />
        <p>Loading your settings...</p>
      </div>
    )
  }

  return (
    <div className="swiggy-settings">
      {/* Header */}
      <div className="swiggy-header">
        <div className="swiggy-container">
          <h1 className="swiggy-title">Settings</h1>
          <p className="swiggy-subtitle">Manage your account preferences and security settings</p>
        </div>
      </div>

      <div className="swiggy-container">
        <div className="swiggy-content">
          {/* Sidebar Navigation */}
          <div className="swiggy-sidebar">
            <nav className="swiggy-nav">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`swiggy-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <div className="nav-icon">{tab.icon}</div>
                  <div className="nav-content">
                    <span className="nav-label">{tab.label}</span>
                    <span className="nav-description">{tab.description}</span>
                  </div>
                  <div className="nav-arrow">›</div>
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="swiggy-main">
            {/* Account Settings */}
            {activeTab === 'account' && (
              <div className="swiggy-section">
                <div className="section-header">
                  <h2>Account Information</h2>
                  <p>Update your basic account details</p>
                </div>

                <div className="swiggy-card">
                  <form onSubmit={handleAccountSubmit} className="swiggy-form">
                    <div className="form-row">
                      <label>Full Name</label>
                      <input
                        type="text"
                        value={accountForm.name}
                        onChange={(e) => setAccountForm({...accountForm, name: e.target.value})}
                        placeholder="Enter your full name"
                        disabled={!isEditing}
                      />
                    </div>

                    <div className="form-row">
                      <label>Email Address</label>
                      <input
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="disabled-input"
                      />
                      <small className="form-help success">Email cannot be changed. Contact support if needed.</small>
                    </div>

                    <div className="form-row">
                      <label>Phone Number</label>
                      <input
                        type="tel"
                        value={accountForm.phoneNumber}
                        onChange={(e) => setAccountForm({...accountForm, phoneNumber: e.target.value})}
                        placeholder="Enter your phone number"
                        disabled={!isEditing}
                      />
                    </div>

                    <div className="form-actions">
                      {!isEditing ? (
                        <button 
                          type="button" 
                          className="swiggy-btn primary"
                          onClick={() => setIsEditing(true)}
                        >
                          Edit Information
                        </button>
                      ) : (
                        <div className="action-group">
                          <button 
                            type="submit" 
                            className="swiggy-btn primary"
                            disabled={updateAccountMutation.isLoading}
                          >
                            {updateAccountMutation.isLoading ? 'Saving...' : 'Save Changes'}
                          </button>
                          <button 
                            type="button" 
                            className="swiggy-btn secondary"
                            onClick={() => setIsEditing(false)}
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <div className="swiggy-section">
                <div className="section-header">
                  <h2>Security</h2>
                  <p>Change your password and manage security settings</p>
                </div>

                <div className="swiggy-card">
                  <form onSubmit={handlePasswordSubmit} className="swiggy-form">
                    <div className="form-row">
                      <label>Current Password</label>
                      <input
                        type="password"
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                        placeholder="Enter current password"
                      />
                    </div>

                    <div className="form-row">
                      <label>New Password</label>
                      <input
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                        placeholder="Enter new password"
                      />
                    </div>

                    <div className="form-row">
                      <label>Confirm New Password</label>
                      <input
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                        placeholder="Confirm new password"
                      />
                    </div>

                    <div className="form-actions">
                      <button 
                        type="submit" 
                        className="swiggy-btn primary"
                        disabled={changePasswordMutation.isLoading}
                      >
                        {changePasswordMutation.isLoading ? 'Changing...' : 'Change Password'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Analytics */}
            {activeTab === 'analytics' && (
              <div className="swiggy-section">
                <div className="section-header">
                  <h2>Analytics</h2>
                  <p>View your usage statistics and activity</p>
                </div>
                <div className="swiggy-card">
                  <UserAnalytics />
                </div>
              </div>
            )}

            {/* Notifications */}
            {activeTab === 'notifications' && (
              <div className="swiggy-section">
                <div className="section-header">
                  <h2>Notifications</h2>
                  <p>Choose what notifications you want to receive</p>
                </div>

                <div className="swiggy-card">
                  <div className="toggle-list">
                    {Object.entries(notifications).map(([key, value]) => (
                      <div key={key} className="toggle-item">
                        <div className="toggle-content">
                          <span className="toggle-label">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </span>
                          <span className="toggle-description">
                            {key === 'emailNotifications' && 'Receive notifications via email'}
                            {key === 'smsNotifications' && 'Receive notifications via SMS'}
                            {key === 'orderUpdates' && 'Get updates about your orders'}
                            {key === 'promotionalEmails' && 'Receive promotional offers'}
                            {key === 'securityAlerts' && 'Important security notifications'}
                            {key === 'newsletterSubscription' && 'Subscribe to our newsletter'}
                          </span>
                        </div>
                        <label className="toggle-switch">
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={(e) => handleNotificationChange(key, e.target.checked)}
                          />
                          <span className="slider"></span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Privacy */}
            {activeTab === 'privacy' && (
              <div className="swiggy-section">
                <div className="section-header">
                  <h2>Privacy</h2>
                  <p>Control your privacy and data sharing preferences</p>
                </div>

                <div className="swiggy-card">
                  <div className="toggle-list">
                    {Object.entries(privacy).map(([key, value]) => (
                      <div key={key} className="toggle-item">
                        <div className="toggle-content">
                          <span className="toggle-label">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </span>
                        </div>
                        <label className="toggle-switch">
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={(e) => handlePrivacyChange(key, e.target.checked)}
                          />
                          <span className="slider"></span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Account Management */}
            {activeTab === 'danger' && (
              <div className="swiggy-section">
                <div className="section-header">
                  <h2>Account Management</h2>
                  <p>Export your data or delete your account</p>
                </div>

                <div className="swiggy-card">
                  <div className="danger-actions">
                    <div className="danger-item">
                      <div className="danger-content">
                        <h3>Export Data</h3>
                        <p>Download a copy of all your account data</p>
                      </div>
                      <button 
                        className="swiggy-btn secondary"
                        onClick={handleDataExport}
                        disabled={dataExportMutation.isLoading}
                      >
                        {dataExportMutation.isLoading ? 'Exporting...' : 'Export Data'}
                      </button>
                    </div>

                    <div className="danger-item">
                      <div className="danger-content">
                        <h3>Delete Account</h3>
                        <p>Permanently delete your account and all data</p>
                      </div>
                      <button 
                        className="swiggy-btn danger"
                        onClick={handleDeleteAccount}
                      >
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage