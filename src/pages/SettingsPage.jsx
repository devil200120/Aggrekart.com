import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { usersAPI, authAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import LoadingSpinner from '../components/common/LoadingSpinner'
import UserAnalytics from '../components/analytics/UserAnalytics'

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
          
          // Set preferences if they exist
          if (userData.preferences) {
            // Map backend notification structure to frontend
            const backendNotifications = userData.preferences.notifications || {}
            setNotifications({
              emailNotifications: backendNotifications.emailNotifications ?? backendNotifications.email ?? true,
              smsNotifications: backendNotifications.smsNotifications ?? backendNotifications.sms ?? true,
              orderUpdates: backendNotifications.orderUpdates ?? true,
              promotionalEmails: backendNotifications.promotionalEmails ?? false,
              securityAlerts: backendNotifications.securityAlerts ?? true,
              newsletterSubscription: backendNotifications.newsletterSubscription ?? false
            })
            
            // Map backend privacy structure to frontend
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
          queryClient.invalidateQueries('auth')
        } else {
          toast.error(response?.message || 'Failed to update account information')
        }
      },
      onError: (error) => {
        const message = error.response?.data?.message || 'Failed to update account information'
        toast.error(message)
      }
    }
  )

  // Change password
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
        const message = error.response?.data?.message || 'Failed to change password'
        toast.error(message)
      }
    }
  )

  // Update preferences
  const updatePreferencesMutation = useMutation(
    (data) => usersAPI.updatePreferences(data),
    {
      onSuccess: (response) => {
        if (response?.success) {
          toast.success('Preferences updated successfully!')
          queryClient.invalidateQueries('userSettings')
        } else {
          toast.error(response?.message || 'Failed to update preferences')
        }
      },
      onError: (error) => {
        const message = error.response?.data?.message || 'Failed to update preferences'
        toast.error(message)
      }
    }
  )

  // Request data export
  const dataExportMutation = useMutation(
    () => usersAPI.requestDataExport(),
    {
      onSuccess: (response) => {
        if (response?.success) {
          toast.success('Data export request submitted! You will receive an email when ready.')
        } else {
          toast.error(response?.message || 'Failed to request data export')
        }
      },
      onError: (error) => {
        const message = error.response?.data?.message || 'Failed to request data export'
        toast.error(message)
      }
    }
  )

  const handleAccountSubmit = (e) => {
    e.preventDefault()
    if (!accountForm.name.trim()) {
      toast.error('Name is required')
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
    
    // Update backend with proper structure
    updatePreferencesMutation.mutate({ 
      notifications: updatedNotifications
    })
  }

  const handlePrivacyChange = (key, value) => {
    const updatedPrivacy = { ...privacy, [key]: value }
    setPrivacy(updatedPrivacy)
    
    // Update backend with proper structure
    updatePreferencesMutation.mutate({ 
      privacy: updatedPrivacy
    })
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
    { id: 'account', label: 'Account', icon: '👤' },
    { id: 'security', label: 'Security', icon: '🔒' },
      { id: 'analytics', label: 'Analytics', icon: '📊' }, // ADD THIS

    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'privacy', label: 'Privacy', icon: '🛡️' },
    { id: 'danger', label: 'Account Management', icon: '⚠️' }
  ]

  if (profileLoading) {
    return (
      <div className="settings-loading">
        <LoadingSpinner />
        <p>Loading settings...</p>
      </div>
    )
  }

  return (
    <div className="settings-page">
      <div className="settings-container">
        <div className="settings-header">
          <h1 className="settings-title">Settings</h1>
          <p className="settings-subtitle">Manage your account preferences and security settings</p>
        </div>

        <div className="settings-content">
          <div className="settings-sidebar">
            <nav className="settings-nav">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`settings-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span className="nav-icon">{tab.icon}</span>
                  <span className="nav-label">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="settings-main">
            {/* Account Settings Tab */}
            {activeTab === 'account' && (
              <div className="settings-section">
                <div className="section-header">
                  <h2>Account Information</h2>
                  <p>Update your basic account details</p>
                </div>

                <form onSubmit={handleAccountSubmit} className="settings-form">
                  <div className="form-group">
                    <label htmlFor="name">Full Name</label>
                    <input
                      type="text"
                      id="name"
                      value={accountForm.name}
                      onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                      disabled={!isEditing}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">Email Address</label>
                    <input
                      type="email"
                      id="email"
                      value={user?.email || ''}
                      disabled
                      className="disabled-input"
                    />
                    <small className="form-help">Email cannot be changed. Contact support if needed.</small>
                  </div>

                  <div className="form-group">
                    <label htmlFor="phone">Phone Number</label>
                    <input
                      type="tel"
                      id="phone"
                      value={accountForm.phoneNumber}
                      onChange={(e) => setAccountForm({ ...accountForm, phoneNumber: e.target.value })}
                      disabled={!isEditing}
                      pattern="[6-9][0-9]{9}"
                      title="Please enter a valid 10-digit Indian phone number"
                    />
                    {isEditing && (
                      <small className="form-help">Changing phone number will require re-verification</small>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Account Type</label>
                    <div className="account-type-info">
                      <span className="account-badge">{user?.role || 'customer'}</span>
                      <small>Account type cannot be changed</small>
                    </div>
                  </div>

                  <div className="form-actions">
                    {!isEditing ? (
                      <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="btn btn-primary"
                      >
                        Edit Information
                      </button>
                    ) : (
                      <div className="action-buttons">
                        <button
                          type="submit"
                          className="btn btn-primary"
                          disabled={updateAccountMutation.isLoading}
                        >
                          {updateAccountMutation.isLoading ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditing(false)
                            // Reset form to original values
                            const userData = profileData?.data?.user
                            if (userData) {
                              setAccountForm({
                                name: userData.name || '',
                                phoneNumber: userData.phoneNumber || ''
                              })
                            }
                          }}
                          className="btn btn-outline"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </form>
              </div>
            )}

            {/* Security Settings Tab */}
            {activeTab === 'security' && (
              <div className="settings-section">
                <div className="section-header">
                  <h2>Security Settings</h2>
                  <p>Manage your password and security preferences</p>
                </div>

                <form onSubmit={handlePasswordSubmit} className="settings-form">
                  <h3>Change Password</h3>
                  
                  <div className="form-group">
                    <label htmlFor="currentPassword">Current Password</label>
                    <input
                      type="password"
                      id="currentPassword"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="newPassword">New Password</label>
                    <input
                      type="password"
                      id="newPassword"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      minLength="6"
                      required
                    />
                    <small className="form-help">Password must be at least 6 characters long</small>
                  </div>

                  <div className="form-group">
                    <label htmlFor="confirmPassword">Confirm New Password</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-actions">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={changePasswordMutation.isLoading}
                    >
                      {changePasswordMutation.isLoading ? 'Changing Password...' : 'Change Password'}
                    </button>
                  </div>
                </form>

                <div className="security-info">
                  <h3>Security Information</h3>
                  <div className="security-item">
                    <span className="security-label">Last Login:</span>
                    <span className="security-value">
                      {user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'N/A'}
                    </span>
                  </div>
                  <div className="security-item">
                    <span className="security-label">Account Created:</span>
                    <span className="security-value">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div className="security-item">
                    <span className="security-label">Phone Verified:</span>
                    <span className={`security-value ${user?.phoneVerified ? 'verified' : 'unverified'}`}>
                      {user?.phoneVerified ? '✅ Verified' : '❌ Not Verified'}
                    </span>
                  </div>
                  <div className="security-item">
                    <span className="security-label">Email Verified:</span>
                    <span className={`security-value ${user?.emailVerified ? 'verified' : 'unverified'}`}>
                      {user?.emailVerified ? '✅ Verified' : '❌ Not Verified'}
                    </span>
                  </div>
                  <div className="security-item">
                    <span className="security-label">Two-Factor Authentication:</span>
                    <span className="security-value coming-soon">Coming Soon</span>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="settings-section">
                <div className="section-header">
                  <h2>Notification Preferences</h2>
                  <p>Choose how you want to receive notifications</p>
                </div>

                <div className="settings-form">
                  <div className="notification-category">
                    <h3>Communication Preferences</h3>
                    
                    <div className="setting-item">
                      <div className="setting-info">
                        <span className="setting-label">Email Notifications</span>
                        <span className="setting-description">Receive notifications via email</span>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={notifications.emailNotifications}
                          onChange={(e) => handleNotificationChange('emailNotifications', e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>

                    <div className="setting-item">
                      <div className="setting-info">
                        <span className="setting-label">SMS Notifications</span>
                        <span className="setting-description">Receive notifications via SMS</span>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={notifications.smsNotifications}
                          onChange={(e) => handleNotificationChange('smsNotifications', e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  </div>

                  <div className="notification-category">
                    <h3>Order & Account Updates</h3>
                    
                    <div className="setting-item">
                      <div className="setting-info">
                        <span className="setting-label">Order Updates</span>
                        <span className="setting-description">Get notified about order status changes</span>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={notifications.orderUpdates}
                          onChange={(e) => handleNotificationChange('orderUpdates', e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>

                    <div className="setting-item">
                      <div className="setting-info">
                        <span className="setting-label">Security Alerts</span>
                        <span className="setting-description">Important security-related notifications</span>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={notifications.securityAlerts}
                          onChange={(e) => handleNotificationChange('securityAlerts', e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  </div>

                  <div className="notification-category">
                    <h3>Marketing & Promotions</h3>
                    
                    <div className="setting-item">
                      <div className="setting-info">
                        <span className="setting-label">Promotional Emails</span>
                        <span className="setting-description">Receive promotional offers and deals</span>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={notifications.promotionalEmails}
                          onChange={(e) => handleNotificationChange('promotionalEmails', e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>

                    <div className="setting-item">
                      <div className="setting-info">
                        <span className="setting-label">Newsletter Subscription</span>
                        <span className="setting-description">Weekly newsletter with updates and tips</span>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={notifications.newsletterSubscription}
                          onChange={(e) => handleNotificationChange('newsletterSubscription', e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'analytics' && (
  <div className="tab-content">
    <UserAnalytics user={user} />
  </div>
)}

            {/* Privacy Tab */}
            {activeTab === 'privacy' && (
              <div className="settings-section">
                <div className="section-header">
                  <h2>Privacy Settings</h2>
                  <p>Control your privacy and data sharing preferences</p>
                </div>

                <div className="settings-form">
                  <div className="privacy-category">
                    <h3>Profile Visibility</h3>
                    
                    <div className="setting-item">
                      <div className="setting-info">
                        <span className="setting-label">Profile Visibility</span>
                        <span className="setting-description">Control who can see your profile information</span>
                      </div>
                      <select
                        value={privacy.profileVisibility}
                        onChange={(e) => handlePrivacyChange('profileVisibility', e.target.value)}
                        className="select-input"
                      >
                        <option value="private">Private</option>
                        <option value="suppliers">Visible to Suppliers</option>
                        <option value="public">Public</option>
                      </select>
                    </div>
                  </div>

                  <div className="privacy-category">
                    <h3>Data Sharing</h3>
                    
                    <div className="setting-item">
                      <div className="setting-info">
                        <span className="setting-label">Data Analytics</span>
                        <span className="setting-description">Help improve our services with anonymous usage data</span>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={privacy.dataSharing}
                          onChange={(e) => handlePrivacyChange('dataSharing', e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>

                    <div className="setting-item">
                      <div className="setting-info">
                        <span className="setting-label">Marketing Communications</span>
                        <span className="setting-description">Allow personalized marketing based on your preferences</span>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={privacy.marketingCommunications}
                          onChange={(e) => handlePrivacyChange('marketingCommunications', e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>

                    <div className="setting-item">
                      <div className="setting-info">
                        <span className="setting-label">Third-party Sharing</span>
                        <span className="setting-description">Share data with trusted partners for better services</span>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={privacy.thirdPartySharing}
                          onChange={(e) => handlePrivacyChange('thirdPartySharing', e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  </div>

                  <div className="privacy-info">
                    <h3>Privacy Information</h3>
                    <p>
                      We take your privacy seriously. Read our{' '}
                      <a href="/privacy-policy" className="privacy-link">Privacy Policy</a>{' '}
                      to learn more about how we collect, use, and protect your data.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Danger Zone Tab */}
            {activeTab === 'danger' && (
              <div className="settings-section">
                <div className="section-header">
                  <h2>Account Management</h2>
                  <p>Manage your account preferences and data</p>
                </div>

                <div className="settings-form">
                  <div className="danger-section">
                    <h3>Data Export</h3>
                    <p>Download a copy of your account data including orders, addresses, and preferences</p>
                    <button 
                      className="btn btn-outline"
                      onClick={handleDataExport}
                      disabled={dataExportMutation.isLoading}
                    >
                      {dataExportMutation.isLoading ? 'Requesting...' : 'Export My Data'}
                    </button>
                  </div>

                  <div className="danger-section">
                    <h3>Account Deactivation</h3>
                    <p>Temporarily deactivate your account while preserving your data</p>
                    <button 
                      className="btn btn-outline"
                      onClick={() => toast.info('Account deactivation feature coming soon!')}
                    >
                      Deactivate Account
                    </button>
                  </div>

                  <div className="danger-section danger-zone">
                    <h3>Delete Account</h3>
                    <p>Permanently delete your account and all associated data. This action cannot be undone.</p>
                    <button 
                      className="btn btn-danger"
                      onClick={handleDeleteAccount}
                    >
                      Delete Account
                    </button>
                  </div>

                  <div className="logout-section">
                    <h3>Session Management</h3>
                    <p>Sign out of your account on this device</p>
                    <button 
                      className="btn btn-outline"
                      onClick={logout}
                    >
                      Sign Out
                    </button>
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