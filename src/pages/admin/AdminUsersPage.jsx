/* 
FILE: c:\Users\KIIT0001\Desktop\builder_website using mern\front-end\app\src\pages\admin\AdminUsersPage.jsx
PURPOSE: Admin page for user management
*/

import React from 'react'
import UserManagement from '../../components/admin/UserManagement'
import './AdminUsersPage.css'

const AdminUsersPage = () => {
  return (
    <div className="admin-users-page">
      <div className="admin-page-container">
        <div className="admin-page-header">
          <h1>User Management</h1>
          <p>Manage all registered users, view profiles, and handle user-related activities</p>
        </div>
        
        <div className="admin-page-content">
          <UserManagement />
        </div>
      </div>
    </div>
  )
}

export default AdminUsersPage