/* 
FILE: c:\Users\KIIT0001\Desktop\builder_website using mern\front-end\app\src\pages\admin\AdminProductsPage.jsx
PURPOSE: Admin page for product moderation and management
*/

import React from 'react'
import ProductModeration from '../../components/admin/ProductModeration'
import './AdminProductsPage.css'

const AdminProductsPage = () => {
  return (
    <div className="admin-products-page">
      <div className="admin-page-container">
        <div className="admin-page-header">
          <h1>Product Management</h1>
          <p>Moderate product listings, approve new products, and manage product catalog</p>
        </div>
        
        <div className="admin-page-content">
          <ProductModeration />
        </div>
      </div>
    </div>
  )
}

export default AdminProductsPage