import React, { useState } from 'react'
import ProductModeration from '../../components/admin/ProductModeration'
import BaseProductCreator from '../../components/admin/BaseProductCreator'
import './AdminProductsPage.css'

const AdminProductsPage = () => {
  const [activeTab, setActiveTab] = useState('moderation')

  return (
    <div className="admin-products-page">
      <div className="admin-page-container">
        <div className="admin-page-header">
          <h1>Product Management</h1>
          <p>Create base products and moderate supplier listings</p>
          
          {/* Tab Navigation */}
          <div className="admin-tabs">
            <button 
              className={`tab-btn ${activeTab === 'moderation' ? 'active' : ''}`}
              onClick={() => setActiveTab('moderation')}
            >
              📋 Product Moderation
            </button>
            <button 
              className={`tab-btn ${activeTab === 'create' ? 'active' : ''}`}
              onClick={() => setActiveTab('create')}
            >
              ➕ Create Base Product
            </button>
          </div>
        </div>
        
        <div className="admin-page-content">
          {activeTab === 'moderation' && <ProductModeration />}
          {activeTab === 'create' && <BaseProductCreator />}
        </div>
      </div>
    </div>
  )
}

export default AdminProductsPage