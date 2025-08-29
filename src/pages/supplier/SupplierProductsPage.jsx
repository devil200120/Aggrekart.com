import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Link } from 'react-router-dom'
import { supplierAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { toast } from 'react-hot-toast'
import './SupplierProductsPage.css'

const SupplierProductsPage = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('available')
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    status: 'all',
    sortBy: 'newest'
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedBaseProduct, setSelectedBaseProduct] = useState(null)
  const [showPricingModal, setShowPricingModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)

  // Fetch base products available for pricing
  const { data: baseProductsData, isLoading: loadingBase } = useQuery(
    'supplier-base-products',
    () => supplierAPI.getBaseProducts(),
    {
      enabled: !!user && user.role === 'supplier',
      staleTime: 5 * 60 * 1000
    }
  )

  // Fetch supplier products
  const { data: productsData, isLoading, error } = useQuery(
    ['supplier-products', user?.id, filters, currentPage],
    () => {
      const cleanParams = {}
      
      if (filters.search && filters.search.trim() !== '') {
        cleanParams.search = filters.search
      }
      
      if (filters.category && filters.category.trim() !== '') {
        cleanParams.category = filters.category
      }
      
      if (filters.status && filters.status !== '') {
        cleanParams.status = filters.status
      } else {
        cleanParams.status = 'all'
      }
      
      if (filters.sortBy && filters.sortBy.trim() !== '') {
        cleanParams.sortBy = filters.sortBy
      }
      
      cleanParams.page = currentPage
      cleanParams.limit = 12
      
      return supplierAPI.getProducts(cleanParams)
    },
    {
      enabled: !!user && user.role === 'supplier' && activeTab === 'my-products',
      keepPreviousData: true,
      staleTime: 5 * 60 * 1000
    }
  )

  // Mutations (keeping existing logic)
  const setPricingMutation = useMutation(
    ({ productId, pricingData }) => supplierAPI.setProductPricing(productId, pricingData),
    {
      onSuccess: () => {
        toast.success('🎉 Pricing set successfully! Product pending approval.')
        setShowPricingModal(false)
        setSelectedBaseProduct(null)
        queryClient.invalidateQueries('supplier-base-products')
        queryClient.invalidateQueries('supplier-products')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to set pricing')
      }
    }
  )

  const updatePricingMutation = useMutation(
    ({ productId, pricingData }) => supplierAPI.updateProductPricing(productId, pricingData),
    {
      onSuccess: () => {
        toast.success('✅ Product pricing updated successfully!')
        queryClient.invalidateQueries(['supplier-products'])
        setShowEditModal(false)
        setSelectedProduct(null)
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update pricing')
      }
    }
  )
  // Add after the updatePricingMutation (around line 98)

  // Replace the toggleStockMutation (around line 104)

  const toggleStockMutation = useMutation(
    (productId) => supplierAPI.toggleProductStock(productId),
    {
      onSuccess: (response) => {
        // Handle both possible response structures
        const message = response?.data?.message || response?.message || 'Stock status updated successfully';
        toast.success(`✅ ${message}`)
        queryClient.invalidateQueries(['supplier-products'])
      },
      onError: (error) => {
        console.error('Toggle stock error:', error);
        toast.error(error.response?.data?.message || 'Failed to toggle stock status')
      }
    }
  )
  // Event handlers
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  const handleSetPricing = (baseProduct) => {
    setSelectedBaseProduct(baseProduct)
    setShowPricingModal(true)
  }

  const handleEditPricing = (product) => {
    setSelectedProduct(product)
    setShowEditModal(true)
  }

  const handlePricingSubmit = (pricingData) => {
    if (!selectedBaseProduct) return
    
    setPricingMutation.mutate({
      productId: selectedBaseProduct._id,
      pricingData
    })
  }

  const handleEditPricingSubmit = (pricingData) => {
    if (!selectedProduct) return
    
    updatePricingMutation.mutate({
      productId: selectedProduct._id,
      pricingData
    })
  }

  // Utility functions
  const formatCurrency = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const products = productsData?.data?.products || []
  const pagination = productsData?.data?.pagination || {}
  const stats = productsData?.data?.stats || {}
  const baseProducts = baseProductsData?.data?.baseProducts || []

  if (!user || user.role !== 'supplier') {
    return (
      <div className="swiggy-products-page">
        <div className="swiggy-container">
          <div className="swiggy-access-denied">
            <div className="access-icon">🚫</div>
            <h2>Access Denied</h2>
            <p>Only suppliers can access this page</p>
            <Link to="/auth/login" className="swiggy-btn swiggy-btn-primary">
              Login as Supplier
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="swiggy-products-page">
      <div className="product-management-container">
        {/* Swiggy-style Header */}
        <div className="product-management-header">
          <div className="header-main">
            <div className="header-icon">📦</div>
            <div className="product-header-content">
              <h1>Product Management</h1>
              <p>Manage your product catalog and pricing</p>
            </div>
          </div>
          
          {/* Stats Overview */}
          <div className="product-header-stats">
            <div className="product-stat-item">
              <div className="product-stat-number">{baseProducts.length}</div>
              <div className="stat-label">Available</div>
            </div>
            <div className="product-stat-item">
              <div className="product-stat-number">{products.length}</div>
              <div className="stat-label">My Products</div>
            </div>
            <div className="product-stat-item">
              <div className="product-stat-number">{stats.active || 0}</div>
              <div className="stat-label">Active</div>
            </div>
          </div>
        </div>

        {/* Swiggy-style Tab Navigation */}
        <div className="product-tabs-container">
          <div className="product-tabs">
            <button 
              className={`swiggy-tab ${activeTab === 'available' ? 'active' : ''}`}
              onClick={() => setActiveTab('available')}
            >
              <span className="tab-icon">🛍️</span>
              <span className="product-tab-content">
                <span className="tab-title">Available Products</span>
                <span className="tab-count">{baseProducts.length} products</span>
              </span>
            </button>
            
            <button 
              className={`swiggy-tab ${activeTab === 'my-products' ? 'active' : ''}`}
              onClick={() => setActiveTab('my-products')}
            >
              <span className="tab-icon">💰</span>
              <span className="product-tab-content">
                <span className="tab-title">My Products</span>
                <span className="tab-count">{products.length} products</span>
              </span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'available' && (
          <div className="swiggy-tab-content">
            {/* Info Banner */}
            <div className="swiggy-info-banner">
              <div className="banner-icon">💡</div>
              <div className="banner-content">
                <strong>How it works:</strong>
                <p>Admin creates products with images. You can set pricing, delivery time, and stock levels to start selling.</p>
              </div>
            </div>

            {/* Available Products Section */}
            {loadingBase ? (
              <div className="swiggy-loading-section">
                <div className="swiggy-spinner"></div>
                <h3>Loading available products...</h3>
                <p>Please wait while we fetch the latest products</p>
              </div>
            ) : baseProducts.length === 0 ? (
              <div className="swiggy-empty-state">
                <div className="empty-illustration">
                  <div className="empty-icon">🏪</div>
                  <div className="empty-waves">
                    <div className="wave"></div>
                    <div className="wave"></div>
                    <div className="wave"></div>
                  </div>
                </div>
                <div className="empty-content">
                  <h3>No Products Available</h3>
                  <p>No base products are currently available for pricing. Check back later or contact admin.</p>
                  <div className="empty-actions">
                    <button 
                      onClick={() => queryClient.invalidateQueries('supplier-base-products')}
                      className="swiggy-btn swiggy-btn-outline"
                    >
                      <span className="btn-icon">🔄</span>
                      Refresh
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="swiggy-products-grid">
                {baseProducts.map(product => (
                  <div key={product._id} className="swiggy-product-card available-product">
                    <div className="product-image-container">
                      <img 
                        src={product.images?.[0]?.url || '/placeholder-product.jpg'} 
                        alt={product.name}
                        className="product-image"
                        onError={(e) => { e.target.src = '/placeholder-product.jpg'; }}
                      />
                      <div className="admin-badge">
                        <span className="badge-icon">👑</span>
                        Admin Created
                      </div>
                      <div className="product-overlay">
                        <button 
                          className="swiggy-btn swiggy-btn-primary"
                          onClick={() => handleSetPricing(product)}
                          disabled={setPricingMutation.isLoading}
                        >
                          <span className="btn-icon">💰</span>
                          Set Pricing
                        </button>
                      </div>
                    </div>
                    
                    <div className="product-content">
                      <div className="product-header">
                        <h3 className="product-name">{product.name}</h3>
                        <div className="product-category">{product.category}</div>
                      </div>
                      
                      <p className="product-description">{product.description}</p>
                      
                      <div className="product-meta">
                        <div className="meta-item">
                          <span className="meta-icon">🏷️</span>
                          <span>{product.subcategory}</span>
                        </div>
                        <div className="meta-item">
                          <span className="meta-icon">📋</span>
                          <span>HSN: {product.hsnCode}</span>
                        </div>
                      </div>
                      
                      <div className="product-footer">
                        <div className="footer-text">
                          Ready to add your pricing and start selling?
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'my-products' && (
          <div className="swiggy-tab-content">
            {/* Filters Section */}
            <div className="swiggy-filters-section">
              <div className="filters-header">
                <h3>Filter & Search</h3>
                <p>Find and manage your products</p>
              </div>
              
              <div className="filters-grid">
                <div className="filter-group">
                  <label>Search Products</label>
                  <div className="search-input-container">
                    <span className="search-icon">🔍</span>
                    <input
                      type="text"
                      placeholder="Search by product name..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      className="swiggy-input"
                    />
                  </div>
                </div>

                <div className="filter-group">
                  <label>Category</label>
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="swiggy-select"
                  >
                    <option value="">All Categories</option>
                    <option value="aggregate">Aggregate</option>
                    <option value="sand">Sand</option>
                    <option value="tmt_steel">TMT Steel</option>
                    <option value="bricks_blocks">Bricks & Blocks</option>
                    <option value="cement">Cement</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label>Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="swiggy-select"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label>Sort By</label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    className="swiggy-select"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="name">Name A-Z</option>
                    <option value="price">Price Low-High</option>
                  </select>
                </div>
              </div>
            </div>

            {/* My Products Section */}
            {isLoading ? (
              <div className="swiggy-loading-section">
                <div className="swiggy-spinner"></div>
                <h3>Loading your products...</h3>
                <p>Fetching your product catalog</p>
              </div>
            ) : error ? (
              <div className="swiggy-error-state">
                <div className="error-icon">⚠️</div>
                <h3>Unable to Load Products</h3>
                <p>There was an error loading your products. Please try again.</p>
                <button 
                  onClick={() => queryClient.invalidateQueries(['supplier-products'])}
                  className="swiggy-btn swiggy-btn-primary"
                >
                  <span className="btn-icon">🔄</span>
                  Retry
                </button>
              </div>
            ) : products.length === 0 ? (
              <div className="swiggy-empty-state">
                <div className="empty-illustration">
                  <div className="empty-icon">📦</div>
                  <div className="empty-waves">
                    <div className="wave"></div>
                    <div className="wave"></div>
                    <div className="wave"></div>
                  </div>
                </div>
                <div className="empty-content">
                  <h3>No Products Found</h3>
                  <p>You haven't added any products yet. Set pricing on available base products to start selling.</p>
                  <div className="empty-actions">
                    <button 
                      onClick={() => setActiveTab('available')}
                      className="swiggy-btn swiggy-btn-primary"
                    >
                      <span className="btn-icon">🛍️</span>
                      Browse Available Products
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="swiggy-products-grid">
                  {products.map(product => (
                    <div key={product._id} className="swiggy-product-card my-product">
                      <div className="product-image-container">
                        <img 
                          src={product.primaryImage || product.images?.[0]?.url || '/placeholder-product.jpg'} 
                          alt={product.name}
                          className="product-image"
                          onError={(e) => { e.target.src = '/placeholder-product.jpg'; }}
                        />
                        // Update the product-image-container section (around lines 457-469)

                        <div className={`status-badge ${product.status}`}>
                          <span className="status-icon">
                            {product.status === 'active' ? '✅' :
                             product.status === 'pending' ? '⏳' : '❌'}
                          </span>
                          {product.status === 'active' ? 'Active' :
                           product.status === 'pending' ? 'Pending' : 'Inactive'}
                        </div>
                        
                        <div className={`stock-badge ${product.isActive ? 'in-stock' : 'out-of-stock'}`}>
                          <span className="stock-icon">
                            {product.isActive ? '📦' : '❌'}
                          </span>
                          {product.isActive ? 'In Stock' : 'Out of Stock'}
                        </div>
                        
                        <div className="pricing-badge">
                          <span className="badge-icon">💰</span>
                          Pricing Set
                          </div>
                      </div>

                      <div className="product-content">
                        <div className="product-header">
                          <h3 className="product-name">{product.name}</h3>
                          <div className="product-category">{product.category}</div>
                        </div>

                        <div className="product-pricing">
                          <div className="price-main">
                            {formatCurrency(product.price || product.pricing?.basePrice || 0)}
                            <span className="price-unit">/{product.unit || product.pricing?.unit || 'unit'}</span>
                          </div>
                          <div className="price-details">
                            <span>Min: {product.pricing?.minimumQuantity || 1} {product.unit || 'units'}</span>
                          </div>
                        </div>

                        <div className="product-stats">
                          <div className="stat">
                            <span className="stat-icon">📦</span>
                            <span>Stock: {product.stockQuantity || product.stock?.available || 0}</span>
                          </div>
                          <div className="stat">
                            <span className="stat-icon">🚚</span>
                            <span>{product.deliveryTime || 'Not set'}</span>
                          </div>
                          <div className="stat">
                            <span className="stat-icon">👀</span>
                            <span>{product.viewCount || 0} views</span>
                          </div>
                        </div>


                        <div className="product-actions">
                          <button
                            onClick={() => handleEditPricing(product)}
                            className="swiggy-btn swiggy-btn-outline"
                            disabled={updatePricingMutation.isLoading}
                          >
                            <span className="btn-icon">✏️</span>
                            Edit Pricing
                          </button>
                          
                          <button
                            onClick={() => toggleStockMutation.mutate(product._id)}
                            className={`swiggy-btn ${product.isActive ? 'swiggy-btn-danger' : 'swiggy-btn-success'}`}
                            disabled={toggleStockMutation.isLoading}
                            title={product.isActive ? 'Mark as Out of Stock' : 'Mark as In Stock'}
                          >
                            <span className="btn-icon">{product.isActive ? '📦' : '❌'}</span>
                            {product.isActive ? 'In Stock' : 'Out of Stock'}
                          </button>
                          
                          <button
                            className="swiggy-btn swiggy-btn-secondary"
                          >
                            <span className="btn-icon">📊</span>
                            View Details
                          </button>
                        </div>

                        <div className="product-footer">
                          <div className="footer-date">
                            Added: {formatDate(product.createdAt)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="swiggy-pagination">
                    <button 
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="pagination-btn"
                    >
                      ← Previous
                    </button>
                    
                    <div className="pagination-numbers">
                      {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                        .filter(page => 
                          page === 1 || 
                          page === pagination.totalPages || 
                          Math.abs(page - currentPage) <= 2
                        )
                        .map((page, index, array) => (
                          <React.Fragment key={page}>
                            {index > 0 && array[index - 1] !== page - 1 && (
                              <span className="pagination-ellipsis">...</span>
                            )}
                            <button
                              onClick={() => setCurrentPage(page)}
                              className={`pagination-page ${currentPage === page ? 'active' : ''}`}
                            >
                              {page}
                            </button>
                          </React.Fragment>
                        ))}
                    </div>
                    
                    <button 
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
                      disabled={currentPage === pagination.totalPages}
                      className="pagination-btn"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Pricing Modal - keeping existing modals but with Swiggy styling */}
        {showPricingModal && selectedBaseProduct && (
          <div className="swiggy-modal-overlay">
            <div className="swiggy-modal">
              <div className="swiggy-modal-header">
                <div className="modal-title">
                  <span className="modal-icon">💰</span>
                  <div>
                    <h3>Set Pricing for {selectedBaseProduct.name}</h3>
                    <p>Configure your pricing and delivery options</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowPricingModal(false)}
                  className="modal-close"
                >
                  ✕
                </button>
              </div>
              
              <PricingForm 
                baseProduct={selectedBaseProduct}
                onSubmit={handlePricingSubmit}
                onCancel={() => setShowPricingModal(false)}
                isLoading={setPricingMutation.isLoading}
              />
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && selectedProduct && (
          <div className="swiggy-modal-overlay">
            <div className="swiggy-modal">
              <div className="swiggy-modal-header">
                <div className="modal-title">
                  <span className="modal-icon">✏️</span>
                  <div>
                    <h3>Edit Pricing for {selectedProduct.name}</h3>
                    <p>Update your pricing and delivery options</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowEditModal(false)}
                  className="modal-close"
                >
                  ✕
                </button>
              </div>
              
              <EditPricingForm 
                product={selectedProduct}
                onSubmit={handleEditPricingSubmit}
                onCancel={() => setShowEditModal(false)}
                isLoading={updatePricingMutation.isLoading}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Enhanced Pricing Form Component
const PricingForm = ({ baseProduct, onSubmit, onCancel, isLoading }) => {
  const [formData, setFormData] = useState({
    pricing: {
      basePrice: '',
      unit: baseProduct.pricing?.unit || 'MT',
      minimumQuantity: '',
      includesGST: false,
      transportCost: {
        included: true,
        costPerKm: 0
      }
    },
    deliveryTime: '',
    stock: {
      available: '',
      lowStockThreshold: 10
    },
    brand: '',
    specifications: {
      grade: '',
      diameter: '',
      cementGrade: '',
      cementType: '',
      size: '',
      weight: '',
      dimensions: {
        length: '',
        width: '',
        height: ''
      }
    }
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    
    const category = baseProduct.category
    const submissionData = {
      pricing: {
        basePrice: parseFloat(formData.pricing.basePrice),
        unit: formData.pricing.unit,
        minimumQuantity: parseFloat(formData.pricing.minimumQuantity),
        includesGST: formData.pricing.includesGST,
        gstRate: formData.pricing.gstRate || 18,
        transportCost: formData.pricing.transportCost
      },
      stock: {
        available: parseInt(formData.stock.available),
        lowStockThreshold: formData.stock.lowStockThreshold || 10
      },
      deliveryTime: formData.deliveryTime,
      specifications: {}
    }
    
    // Add category-specific required fields
    switch (category) {
      case 'tmt_steel':
        submissionData.specifications.grade = formData.specifications.grade
        submissionData.specifications.diameter = formData.specifications.diameter
        submissionData.brand = formData.brand
        break
      case 'cement':
        submissionData.specifications.cementGrade = formData.specifications.cementGrade
        submissionData.specifications.cementType = formData.specifications.cementType
        submissionData.brand = formData.brand
        break
      case 'bricks_blocks':
        submissionData.specifications.size = formData.specifications.size
        submissionData.brand = formData.brand
        break
    }
    
    onSubmit(submissionData)
  }

  const handleInputChange = (path, value) => {
    const keys = path.split('.')
    setFormData(prev => {
      const newData = { ...prev }
      let current = newData
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]]
      }
      current[keys[keys.length - 1]] = value
      return newData
    })
  }

  return (
    <form onSubmit={handleSubmit} className="swiggy-form">
      <div className="form-section">
        <div className="section-header">
          <h4>💰 Pricing Information</h4>
          <p>Set your competitive pricing</p>
        </div>
        
        <div className="form-grid">
          <div className="form-group">
            <label>Base Price (₹) *</label>
            <input
              type="number"
              value={formData.pricing.basePrice}
              onChange={(e) => handleInputChange('pricing.basePrice', e.target.value)}
              placeholder="Enter price per unit"
              step="0.01"
              min="0"
              required
              className="swiggy-input"
            />
          </div>
          
          <div className="form-group">
            <label>Unit</label>
            <div className="unit-display">
              <span className="unit-icon">📏</span>
              {baseProduct.pricing?.unit || 'MT'}
            </div>
          </div>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label>Minimum Quantity *</label>
            <input
              type="number"
              value={formData.pricing.minimumQuantity}
              onChange={(e) => handleInputChange('pricing.minimumQuantity', e.target.value)}
              placeholder="Minimum order quantity"
              step="0.1"
              min="0.1"
              required
              className="swiggy-input"
            />
          </div>
          
          <div className="form-group">
            <label>GST Rate (%)</label>
            <input
              type="number"
              value={formData.pricing.gstRate || 18}
              onChange={(e) => handleInputChange('pricing.gstRate', e.target.value)}
              placeholder="GST percentage"
              step="0.1"
              min="0"
              max="100"
              className="swiggy-input"
            />
          </div>
        </div>

        <div className="checkbox-group">
          <label className="swiggy-checkbox">
            <input
              type="checkbox"
              checked={formData.pricing.includesGST}
              onChange={(e) => handleInputChange('pricing.includesGST', e.target.checked)}
            />
            <span className="checkmark"></span>
            Price includes GST
          </label>
        </div>
      </div>

      <div className="form-section">
        <div className="section-header">
          <h4>📦 Stock & Delivery</h4>
          <p>Manage inventory and delivery options</p>
        </div>
        
        <div className="form-grid">
          <div className="form-group">
            <label>Available Stock *</label>
            <input
              type="number"
              value={formData.stock.available}
              onChange={(e) => handleInputChange('stock.available', e.target.value)}
              placeholder="Available quantity"
              min="0"
              required
              className="swiggy-input"
            />
          </div>
          
          <div className="form-group">
            <label>Delivery Time *</label>
            <select
              value={formData.deliveryTime}
              onChange={(e) => handleInputChange('deliveryTime', e.target.value)}
              required
              className="swiggy-select"
            >
              <option value="">Select delivery time</option>
              <option value="same_day">Same Day</option>
              <option value="next_day">Next Day</option>
              <option value="2_3_days">2-3 Days</option>
              <option value="3_7_days">3-7 Days</option>
              <option value="1_2_weeks">1-2 Weeks</option>
            </select>
          </div>
        </div>
      </div>

      {/* Category-specific fields */}
      {baseProduct.category === 'tmt_steel' && (
        <div className="form-section">
          <div className="section-header">
            <h4>🔩 TMT Steel Specifications</h4>
            <p>Required specifications for TMT Steel</p>
          </div>
          
          <div className="form-grid">
            <div className="form-group">
              <label>Grade *</label>
              <select
                value={formData.specifications.grade}
                onChange={(e) => handleInputChange('specifications.grade', e.target.value)}
                required
                className="swiggy-select"
              >
                <option value="">Select grade</option>
                <option value="Fe415">Fe415</option>
                <option value="Fe500">Fe500</option>
                <option value="Fe550">Fe550</option>
                <option value="Fe600">Fe600</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Diameter (mm) *</label>
              <select
                value={formData.specifications.diameter}
                onChange={(e) => handleInputChange('specifications.diameter', e.target.value)}
                required
                className="swiggy-select"
              >
                <option value="">Select diameter</option>
                <option value="8">8mm</option>
                <option value="10">10mm</option>
                <option value="12">12mm</option>
                <option value="16">16mm</option>
                <option value="20">20mm</option>
                <option value="25">25mm</option>
                <option value="32">32mm</option>
              </select>
            </div>
          </div>
          
          <div className="form-group">
            <label>Brand *</label>
            <input
              type="text"
              value={formData.brand}
              onChange={(e) => handleInputChange('brand', e.target.value)}
              placeholder="Enter brand name"
              required
              className="swiggy-input"
            />
          </div>
        </div>
      )}

      {/* Bricks & Blocks specific fields */}
      {baseProduct.category === 'bricks_blocks' && (
        <div className="form-section">
          <div className="section-header">
            <h4>🧱 Bricks & Blocks Specifications</h4>
            <p>Required specifications for Bricks & Blocks</p>
          </div>
          
          <div className="form-grid">
            <div className="form-group">
              <label>Size *</label>
              <select
                value={formData.specifications.size}
                onChange={(e) => handleInputChange('specifications.size', e.target.value)}
                required
                className="swiggy-select"
              >
                <option value="">Select size</option>
                <option value="230x110x70mm">Standard (230x110x70mm)</option>
                <option value="230x110x100mm">Modular (230x110x100mm)</option>
                <option value="190x90x90mm">Common (190x90x90mm)</option>
                <option value="200x100x100mm">Engineering (200x100x100mm)</option>
                <option value="custom">Custom Size</option>
              </select>
            </div>
          </div>
          
          <div className="form-group">
            <label>Brand *</label>
            <input
              type="text"
              value={formData.brand}
              onChange={(e) => handleInputChange('brand', e.target.value)}
              placeholder="Enter brand name (e.g., ACC, Ultratech, etc.)"
              required
              className="swiggy-input"
            />
          </div>
        </div>
      )}

      {/* Cement specific fields */}
      {baseProduct.category === 'cement' && (
        <div className="form-section">
          <div className="section-header">
            <h4>🏗️ Cement Specifications</h4>
            <p>Required specifications for Cement</p>
          </div>
          
          <div className="form-grid">
            <div className="form-group">
              <label>Cement Grade *</label>
              <select
                value={formData.specifications.cementGrade}
                onChange={(e) => handleInputChange('specifications.cementGrade', e.target.value)}
                required
                className="swiggy-select"
              >
                <option value="">Select cement grade</option>
                <option value="33_grade">33 Grade</option>
                <option value="43_grade">43 Grade</option>
                <option value="53_grade">53 Grade</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Cement Type *</label>
              <select
                value={formData.specifications.cementType}
                onChange={(e) => handleInputChange('specifications.cementType', e.target.value)}
                required
                className="swiggy-select"
              >
                <option value="">Select cement type</option>
                <option value="OPC">OPC (Ordinary Portland Cement)</option>
                <option value="PPC">PPC (Portland Pozzolana Cement)</option>
              </select>
            </div>
          </div>
          
          <div className="form-group">
            <label>Brand *</label>
            <input
              type="text"
              value={formData.brand}
              onChange={(e) => handleInputChange('brand', e.target.value)}
              placeholder="Enter brand name (e.g., UltraTech, ACC, Ambuja, etc.)"
              required
              className="swiggy-input"
            />
          </div>
        </div>
      )}

      <div className="form-actions">
        <button 
          type="button" 
          onClick={onCancel} 
          className="swiggy-btn swiggy-btn-outline"
          disabled={isLoading}
        >
          Cancel
        </button>
        <button 
          type="submit" 
          className="swiggy-btn swiggy-btn-primary" 
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span className="btn-spinner">⏳</span>
              Setting Pricing...
            </>
          ) : (
            <>
              <span className="btn-icon">💰</span>
              Set Pricing
            </>
          )}
        </button>
      </div>
    </form>
  )
}

// Edit Pricing Form Component (similar structure)
const EditPricingForm = ({ product, onSubmit, onCancel, isLoading }) => {
  const [formData, setFormData] = useState({
    pricing: {
      basePrice: product.pricing?.basePrice || '',
      minimumQuantity: product.pricing?.minimumQuantity || '',
      includesGST: product.pricing?.includesGST || false,
      gstRate: product.pricing?.gstRate || 18
    },
    deliveryTime: product.deliveryTime || '',
    stock: {
      available: product.stock?.available || '',
      lowStockThreshold: product.stock?.lowStockThreshold || 10
    }
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    
    const submissionData = {
      pricing: {
        basePrice: parseFloat(formData.pricing.basePrice),
        minimumQuantity: parseFloat(formData.pricing.minimumQuantity),
        includesGST: formData.pricing.includesGST,
        gstRate: formData.pricing.gstRate
      },
      stock: {
        available: parseInt(formData.stock.available),
        lowStockThreshold: formData.stock.lowStockThreshold
      },
      deliveryTime: formData.deliveryTime
    }
    
    onSubmit(submissionData)
  }

  const handleInputChange = (path, value) => {
    const keys = path.split('.')
    setFormData(prev => {
      const newData = { ...prev }
      let current = newData
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]]
      }
      current[keys[keys.length - 1]] = value
      return newData
    })
  }

  return (
    <form onSubmit={handleSubmit} className="swiggy-form">
      <div className="form-section">
        <div className="section-header">
          <h4>💰 Update Pricing</h4>
          <p>Modify your pricing information</p>
        </div>
        
        <div className="form-grid">
          <div className="form-group">
            <label>Base Price (₹) *</label>
            <input
              type="number"
              value={formData.pricing.basePrice}
              onChange={(e) => handleInputChange('pricing.basePrice', e.target.value)}
              placeholder="Enter price per unit"
              step="0.01"
              min="0"
              required
              className="swiggy-input"
            />
          </div>
          
          <div className="form-group">
            <label>Minimum Quantity *</label>
            <input
              type="number"
              value={formData.pricing.minimumQuantity}
              onChange={(e) => handleInputChange('pricing.minimumQuantity', e.target.value)}
              placeholder="Minimum order quantity"
              step="0.1"
              min="0.1"
              required
              className="swiggy-input"
            />
          </div>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label>Available Stock *</label>
            <input
              type="number"
              value={formData.stock.available}
              onChange={(e) => handleInputChange('stock.available', e.target.value)}
              placeholder="Available quantity"
              min="0"
              required
              className="swiggy-input"
            />
          </div>
          
          <div className="form-group">
            <label>Delivery Time *</label>
            <select
              value={formData.deliveryTime}
              onChange={(e) => handleInputChange('deliveryTime', e.target.value)}
              required
              className="swiggy-select"
            >
              <option value="">Select delivery time</option>
              <option value="same_day">Same Day</option>
              <option value="next_day">Next Day</option>
              <option value="2_3_days">2-3 Days</option>
              <option value="3_7_days">3-7 Days</option>
              <option value="1_2_weeks">1-2 Weeks</option>
            </select>
          </div>
        </div>

        <div className="checkbox-group">
          <label className="swiggy-checkbox">
            <input
              type="checkbox"
              checked={formData.pricing.includesGST}
              onChange={(e) => handleInputChange('pricing.includesGST', e.target.checked)}
            />
            <span className="checkmark"></span>
            Price includes GST
          </label>
        </div>
      </div>

      <div className="form-actions">
        <button 
          type="button" 
          onClick={onCancel} 
          className="swiggy-btn swiggy-btn-outline"
          disabled={isLoading}
        >
          Cancel
        </button>
        <button 
          type="submit" 
          className="swiggy-btn swiggy-btn-primary" 
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span className="btn-spinner">⏳</span>
              Updating...
            </>
          ) : (
            <>
              <span className="btn-icon">✅</span>
              Update Pricing
            </>
          )}
        </button>
      </div>
    </form>
  )
}

export default SupplierProductsPage