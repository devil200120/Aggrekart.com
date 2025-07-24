/* 
FILE: c:\Users\KIIT0001\Desktop\builder_website using mern\front-end\app\src\pages\admin\AdminReportsPage.jsx
PURPOSE: Admin page for reports and analytics
*/

import React from 'react'
import ReportsManager from '../../components/admin/ReportsManager'
import AdminAnalytics from '../../components/admin/AdminAnalytics'
import './AdminReportsPage.css'

const AdminReportsPage = () => {
  return (
    <div className="admin-reports-page">
      <div className="admin-page-container">
        <div className="admin-page-header">
          <h1>Reports & Analytics</h1>
          <p>Generate comprehensive reports, view analytics, and export business data</p>
        </div>
        
        <div className="admin-page-content">
          <div className="reports-section">
            <AdminAnalytics />
          </div>
          
          <div className="reports-section">
            <ReportsManager />
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminReportsPage