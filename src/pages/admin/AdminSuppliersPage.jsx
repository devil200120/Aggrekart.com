/* 
FILE: c:\Users\KIIT0001\Desktop\builder_website using mern\front-end\app\src\pages\admin\AdminSuppliersPage.jsx
PURPOSE: Admin page for supplier management and approvals
*/

import React from 'react'
import SupplierApproval from '../../components/admin/SupplierApproval'
import './AdminSuppliersPage.css'

const AdminSuppliersPage = () => {
  return (
    <div className="admin-suppliers-page">
      <div className="admin-page-container">
        <div className="admin-page-header">
          <h1>Supplier Management</h1>
          <p>Review supplier applications, manage approvals, and oversee supplier activities</p>
        </div>
        
        <div className="admin-page-content">
          <SupplierApproval />
        </div>
      </div>
    </div>
  )
}

export default AdminSuppliersPage