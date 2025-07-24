/* 
FILE: c:\Users\KIIT0001\Desktop\builder_website using mern\front-end\app\src\pages\admin\AdminSettingsPage.jsx
PURPOSE: Admin page for system settings and configuration
*/

import React from 'react'
import SystemSettings from '../../components/admin/SystemSettings'
import './AdminSettingsPage.css'

const AdminSettingsPage = () => {
  return (
    <div className="admin-settings-page">
      <div className="admin-page-container">
        <div className="admin-page-header">
          <h1>System Settings</h1>
          <p>Configure system-wide settings, payment methods, and application preferences</p>
        </div>
        
        <div className="admin-page-content">
          <SystemSettings />
        </div>
      </div>
    </div>
  )
}

export default AdminSettingsPage