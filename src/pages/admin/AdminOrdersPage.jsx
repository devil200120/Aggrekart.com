/* 
FILE: c:\Users\KIIT0001\Desktop\builder_website using mern\front-end\app\src\pages\admin\AdminOrdersPage.jsx
PURPOSE: Admin page for order management and tracking
*/

import React from 'react'
import OrderManagement from '../../components/admin/OrderManagement'
import './AdminOrdersPage.css'

const AdminOrdersPage = () => {
  return (
    <div className="admin-orders-page">
      <div className="admin-page-container">
        <div className="admin-page-header">
          <h1>Order Management</h1>
          <p>Track and manage all orders, update statuses, and handle order-related issues</p>
        </div>
        
        <div className="admin-page-content">
          <OrderManagement />
        </div>
      </div>
    </div>
  )
}

export default AdminOrdersPage