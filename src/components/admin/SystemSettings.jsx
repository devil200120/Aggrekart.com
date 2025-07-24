/* 
FILE: c:\Users\KIIT0001\Desktop\builder_website using mern\front-end\app\src\components\admin\SystemSettings.jsx
LINES: 1-250
PURPOSE: Component for admin to manage system-wide settings
*/

import React, { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { 
  Save, 
  Settings, 
  Globe, 
  Shield, 
  Mail, 
  DollarSign,
  Truck,
  AlertTriangle,
  Clock,
  Percent
} from 'lucide-react'
import { adminAPI } from '../../services/api'
import toast from 'react-hot-toast'
import './SystemSettings.css'

const SystemSettings = () => {
  const [activeTab, setActiveTab] = useState('general')
  const [settings, setSettings] = useState({})
  const [hasChanges, setHasChanges] = useState(false)
  const queryClient = useQueryClient()

  // Fetch system settings
  const { data: systemSettings, isLoading } = useQuery(
    'admin-system-settings',
    adminAPI.getSystemSettings,
    {
      onSuccess: (data) => {
        setSettings(data)
      }
    }
  )

  // Update settings mutation
  const updateSettingsMutation = useMutation(
    (settingsData) => adminAPI.updateSystemSettings(settingsData),
    {
      onSuccess: () => {
        toast.success('Settings updated successfully!')
        setHasChanges(false)
        queryClient.invalidateQueries('admin-system-settings')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update settings')
      }
    }
  )

  // Maintenance mode mutation
  const maintenanceMutation = useMutation(
    ({ enabled, message }) => adminAPI.updateSiteMaintenance(enabled, message),
    {
      onSuccess: (data, { enabled }) => {
        toast.success(`Maintenance mode ${enabled ? 'enabled' : 'disabled'}`)
        queryClient.invalidateQueries('admin-system-settings')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update maintenance mode')
      }
    }
  )

  const handleSettingChange = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }))
    setHasChanges(true)
  }

  const handleSave = () => {
    updateSettingsMutation.mutate(settings)
  }

  const handleMaintenanceToggle = () => {
    const enabled = !settings.maintenance?.enabled
    const message = enabled ? 'System is under maintenance. Please check back later.' : ''
    
    maintenanceMutation.mutate({ enabled, message })
  }

  const settingsTabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'business', label: 'Business', icon: DollarSign },
    { id: 'shipping', label: 'Shipping', icon: Truck },
    { id: 'notifications', label: 'Notifications', icon: Mail },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'maintenance', label: 'Maintenance', icon: AlertTriangle }
  ]

  if (isLoading) {
    return (
      <div className="system-settings">
        <div className="settings-header">
          <h3>System Settings</h3>
        </div>
        <div className="loading-settings">
          <div className="loading-spinner"></div>
          <p>Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="system-settings">
      <div className="settings-header">
        <h3>System Settings</h3>
        {hasChanges && (
          <button 
            className="btn btn-primary"
            onClick={handleSave}
            disabled={updateSettingsMutation.isLoading}
          >
            <Save size={16} />
            {updateSettingsMutation.isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        )}
      </div>

      <div className="settings-container">
        {/* Settings Navigation */}
        <div className="settings-nav">
          {settingsTabs.map((tab) => {
            const IconComponent = tab.icon
            return (
              <button
                key={tab.id}
                className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <IconComponent size={16} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Settings Content */}
        <div className="settings-content">
          {activeTab === 'general' && (
            <div className="settings-section">
              <h4>General Settings</h4>
              
              <div className="setting-group">
                <label>Site Name</label>
                <input
                  type="text"
                  value={settings.general?.siteName || ''}
                  onChange={(e) => handleSettingChange('general', 'siteName', e.target.value)}
                  placeholder="Aggrekart"
                />
              </div>

              <div className="setting-group">
                <label>Site Description</label>
                <textarea
                  value={settings.general?.siteDescription || ''}
                  onChange={(e) => handleSettingChange('general', 'siteDescription', e.target.value)}
                  placeholder="Your trusted construction materials marketplace"
                  rows={3}
                />
              </div>

              <div className="setting-group">
                <label>Contact Email</label>
                <input
                  type="email"
                  value={settings.general?.contactEmail || ''}
                  onChange={(e) => handleSettingChange('general', 'contactEmail', e.target.value)}
                  placeholder="support@aggrekart.com"
                />
              </div>

              <div className="setting-group">
                <label>Contact Phone</label>
                <input
                  type="tel"
                  value={settings.general?.contactPhone || ''}
                  onChange={(e) => handleSettingChange('general', 'contactPhone', e.target.value)}
                  placeholder="+91 9876543210"
                />
              </div>

              <div className="setting-group">
                <label>Default Currency</label>
                <select
                  value={settings.general?.currency || 'INR'}
                  onChange={(e) => handleSettingChange('general', 'currency', e.target.value)}
                >
                  <option value="INR">Indian Rupee (₹)</option>
                  <option value="USD">US Dollar ($)</option>
                  <option value="EUR">Euro (€)</option>
                </select>
              </div>

              <div className="setting-group">
                <label>Timezone</label>
                <select
                  value={settings.general?.timezone || 'Asia/Kolkata'}
                  onChange={(e) => handleSettingChange('general', 'timezone', e.target.value)}
                >
                  <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === 'business' && (
            <div className="settings-section">
              <h4>Business Settings</h4>
              
              <div className="setting-group">
                <label>Platform Commission (%)</label>
                <div className="input-with-icon">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={settings.business?.platformCommission || ''}
                    onChange={(e) => handleSettingChange('business', 'platformCommission', e.target.value)}
                    placeholder="5.0"
                  />
                  <Percent size={16} />
                </div>
              </div>

              <div className="setting-group">
                <label>Minimum Order Value</label>
                <div className="input-with-icon">
                  <input
                    type="number"
                    min="0"
                    value={settings.business?.minimumOrderValue || ''}
                    onChange={(e) => handleSettingChange('business', 'minimumOrderValue', e.target.value)}
                    placeholder="500"
                  />
                  <DollarSign size={16} />
                </div>
              </div>

              <div className="setting-group">
                <label>Tax Rate (%)</label>
                <div className="input-with-icon">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={settings.business?.taxRate || ''}
                    onChange={(e) => handleSettingChange('business', 'taxRate', e.target.value)}
                    placeholder="18.0"
                  />
                  <Percent size={16} />
                </div>
              </div>

              <div className="setting-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.business?.autoApproveProducts || false}
                    onChange={(e) => handleSettingChange('business', 'autoApproveProducts', e.target.checked)}
                  />
                  Auto-approve products
                </label>
              </div>

              <div className="setting-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.business?.autoApproveSuppliers || false}
                    onChange={(e) => handleSettingChange('business', 'autoApproveSuppliers', e.target.checked)}
                  />
                  Auto-approve suppliers
                </label>
              </div>
            </div>
          )}

          {activeTab === 'shipping' && (
            <div className="settings-section">
              <h4>Shipping Settings</h4>
              
              <div className="setting-group">
                <label>Default Shipping Fee</label>
                <div className="input-with-icon">
                  <input
                    type="number"
                    min="0"
                    value={settings.shipping?.defaultShippingFee || ''}
                    onChange={(e) => handleSettingChange('shipping', 'defaultShippingFee', e.target.value)}
                    placeholder="100"
                  />
                  <DollarSign size={16} />
                </div>
              </div>

              <div className="setting-group">
                <label>Free Shipping Threshold</label>
                <div className="input-with-icon">
                  <input
                    type="number"
                    min="0"
                    value={settings.shipping?.freeShippingThreshold || ''}
                    onChange={(e) => handleSettingChange('shipping', 'freeShippingThreshold', e.target.value)}
                    placeholder="1000"
                  />
                  <DollarSign size={16} />
                </div>
              </div>

              <div className="setting-group">
                <label>Estimated Delivery Time (days)</label>
                <div className="input-with-icon">
                  <input
                    type="number"
                    min="1"
                    value={settings.shipping?.estimatedDeliveryDays || ''}
                    onChange={(e) => handleSettingChange('shipping', 'estimatedDeliveryDays', e.target.value)}
                    placeholder="3-5"
                  />
                  <Clock size={16} />
                </div>
              </div>

              <div className="setting-group">
                <label>Supported Shipping Zones</label>
                <textarea
                  value={settings.shipping?.supportedZones || ''}
                  onChange={(e) => handleSettingChange('shipping', 'supportedZones', e.target.value)}
                  placeholder="Delhi, Mumbai, Bangalore, Chennai, Kolkata"
                  rows={3}
                />
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="settings-section">
              <h4>Notification Settings</h4>
              
              <div className="setting-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.notifications?.emailEnabled || false}
                    onChange={(e) => handleSettingChange('notifications', 'emailEnabled', e.target.checked)}
                  />
                  Enable email notifications
                </label>
              </div>

              <div className="setting-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.notifications?.smsEnabled || false}
                    onChange={(e) => handleSettingChange('notifications', 'smsEnabled', e.target.checked)}
                  />
                  Enable SMS notifications
                </label>
              </div>

              <div className="setting-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.notifications?.orderUpdates || false}
                    onChange={(e) => handleSettingChange('notifications', 'orderUpdates', e.target.checked)}
                  />
                  Send order update notifications
                </label>
              </div>

              <div className="setting-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.notifications?.promotionalEmails || false}
                    onChange={(e) => handleSettingChange('notifications', 'promotionalEmails', e.target.checked)}
                  />
                  Send promotional emails
                </label>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="settings-section">
              <h4>Security Settings</h4>
              
              <div className="setting-group">
                <label>Password Minimum Length</label>
                <input
                  type="number"
                  min="6"
                  max="20"
                  value={settings.security?.passwordMinLength || ''}
                  onChange={(e) => handleSettingChange('security', 'passwordMinLength', e.target.value)}
                  placeholder="8"
                />
              </div>

              <div className="setting-group">
                <label>Session Timeout (minutes)</label>
                <input
                  type="number"
                  min="5"
                  max="1440"
                  value={settings.security?.sessionTimeout || ''}
                  onChange={(e) => handleSettingChange('security', 'sessionTimeout', e.target.value)}
                  placeholder="30"
                />
              </div>

              <div className="setting-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.security?.requireEmailVerification || false}
                    onChange={(e) => handleSettingChange('security', 'requireEmailVerification', e.target.checked)}
                  />
                  Require email verification
                </label>
              </div>

              <div className="setting-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.security?.requirePhoneVerification || false}
                    onChange={(e) => handleSettingChange('security', 'requirePhoneVerification', e.target.checked)}
                  />
                  Require phone verification
                </label>
              </div>

              <div className="setting-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.security?.enableTwoFactor || false}
                    onChange={(e) => handleSettingChange('security', 'enableTwoFactor', e.target.checked)}
                  />
                  Enable two-factor authentication
                </label>
              </div>
            </div>
          )}

          {activeTab === 'maintenance' && (
            <div className="settings-section">
              <h4>Maintenance Mode</h4>
              
              <div className="maintenance-status">
                <div className="maintenance-info">
                  <h5>
                    Current Status: 
                    <span className={`status ${settings.maintenance?.enabled ? 'enabled' : 'disabled'}`}>
                      {settings.maintenance?.enabled ? 'Maintenance Mode ON' : 'Site is Live'}
                    </span>
                  </h5>
                  <p>
                    {settings.maintenance?.enabled 
                      ? 'The site is currently in maintenance mode. Only admins can access the platform.'
                      : 'The site is live and accessible to all users.'
                    }
                  </p>
                </div>

                <button
                  className={`btn ${settings.maintenance?.enabled ? 'btn-success' : 'btn-warning'}`}
                  onClick={handleMaintenanceToggle}
                  disabled={maintenanceMutation.isLoading}
                >
                  <AlertTriangle size={16} />
                  {maintenanceMutation.isLoading 
                    ? 'Updating...' 
                    : settings.maintenance?.enabled 
                      ? 'Disable Maintenance' 
                      : 'Enable Maintenance'
                  }
                </button>
              </div>

              {settings.maintenance?.enabled && (
                <div className="setting-group">
                  <label>Maintenance Message</label>
                  <textarea
                    value={settings.maintenance?.message || ''}
                    onChange={(e) => handleSettingChange('maintenance', 'message', e.target.value)}
                    placeholder="We are currently performing maintenance. Please check back later."
                    rows={3}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SystemSettings