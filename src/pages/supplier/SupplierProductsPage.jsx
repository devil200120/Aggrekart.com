import React, { useState } from 'react'
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
      staleTime: 5 * 60 * 1000 // 5 minutes
    }
  )

  // Fetch supplier products (existing logic)
  const { data: productsData, isLoading, error } = useQuery(
    ['supplier-products', user?.id, filters, currentPage],
    () => {
      // Clean parameters - remove empty strings
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
        cleanParams.status = 'all' // Default to 'all' if empty
      }
      
      if (filters.sortBy && filters.sortBy.trim() !== '') {
        cleanParams.sortBy = filters.sortBy
      }
      
      cleanParams.page = currentPage
      cleanParams.limit = 12

      console.log('Sending clean params:', cleanParams) // Debug log
      
      return supplierAPI.getProducts(cleanParams)
    },
    {
      enabled: !!user && user.role === 'supplier' && activeTab === 'my-products',
      keepPreviousData: true,
      staleTime: 5 * 60 * 1000,
      onSuccess: (data) => {
        console.log('Frontend: API Response received:', data)
        console.log('Frontend: Products data:', data?.data?.products)
      },
      onError: (error) => {
        console.error('Frontend: Query error:', error.response?.data || error.message)
      }
    }
  )

  // Set pricing for base product mutation
  const setPricingMutation = useMutation(
    ({ productId, pricingData }) => supplierAPI.setProductPricing(productId, pricingData),
    {
      onSuccess: () => {
        toast.success('Pricing set successfully! Product is now pending approval.')
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

  // Update product pricing mutation
  const updatePricingMutation = useMutation(
    ({ productId, pricingData }) => supplierAPI.updateProductPricing(productId, pricingData),
    {
      onSuccess: () => {
        toast.success('Product pricing updated successfully!')
        queryClient.invalidateQueries(['supplier-products'])
        setShowEditModal(false)
        setSelectedProduct(null)
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update pricing')
      }
    }
  )

  // Delete product mutation
  const deleteProductMutation = useMutation(
    (productId) => supplierAPI.deleteProduct(productId),
    {
      onSuccess: () => {
        toast.success('Product deleted successfully')
        // Clear all supplier product queries and force refresh
        queryClient.removeQueries('supplier-products')
        queryClient.removeQueries(['supplier-products'])
        // Force immediate refetch
        queryClient.refetchQueries(['supplier-products', user?.id, filters, currentPage])
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete product')
      }
    }
  )

  // Toggle product status mutation
  const toggleStatusMutation = useMutation(
    ({ productId, currentStatus }) => {
      console.log('🔄 Toggle Status Input:', { productId, currentStatus });
      
      // CORRECT LOGIC: 
      // If current status is 'inactive', we want to ACTIVATE (set isActive = true)
      // If current status is 'active', we want to DEACTIVATE (set isActive = false)
      const isActive = currentStatus !== 'active';
      
      console.log('🔄 Setting isActive to:', isActive);
      console.log(`🔄 Action: ${currentStatus === 'active' ? 'DEACTIVATING' : 'ACTIVATING'} product`);
      
      return supplierAPI.updateProduct(productId, { isActive });
    },
    {
      onSuccess: (data) => {
        console.log('✅ Status update successful:', data);
        toast.success('Product status updated successfully');
        // Clear cache and refetch
        queryClient.removeQueries('supplier-products');
        queryClient.refetchQueries(['supplier-products', user?.id, filters, currentPage]);
      },
      onError: (error) => {
        console.error('❌ Status toggle error:', error.response?.data);
        toast.error(error.response?.data?.message || 'Failed to update product status');
      }
    }
  );

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  const handleDeleteProduct = (productId, productName) => {
    if (window.confirm(`Are you sure you want to delete "${productName}"?`)) {
      deleteProductMutation.mutate(productId)
    }
  }

  const handleToggleStatus = (productId, currentStatus) => {
    console.log('Toggling status for product:', productId, 'current status:', currentStatus)
    toggleStatusMutation.mutate({ productId, currentStatus })
  }

  // New handlers for base products
  const handleSetPricing = (baseProduct) => {
    setSelectedBaseProduct(baseProduct)
    setShowPricingModal(true)
  }

  // Handler for editing existing product pricing
  const handleEditPricing = (product) => {
    setSelectedProduct(product)
    setShowEditModal(true)
  }

  const handleEditPricingSubmit = (pricingData) => {
    if (!selectedProduct) return
    
    updatePricingMutation.mutate({
      productId: selectedProduct._id,
      pricingData
    })
  }

  const handlePricingSubmit = (pricingData) => {
    if (!selectedBaseProduct) return
    
    setPricingMutation.mutate({
      productId: selectedBaseProduct._id,
      pricingData
    })
  }

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
      <div className="supplier-products-page">
        <div className="container">
          <div className="access-denied">
            <h2>Access Denied</h2>
            <p>Only suppliers can access this page</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="supplier-products-page">
      <div className="container">
        {/* Page Header */}
        <div className="products-header">
          <div className="header-content">
            <h1>📦 Product Management</h1>
            <p>Add pricing to base products created by admin</p>
          </div>
          
          {/* Tab Navigation */}
          <div className="products-tabs">
            <button 
              className={`tab-btn ${activeTab === 'available' ? 'active' : ''}`}
              onClick={() => setActiveTab('available')}
            >
              🛍️ Available Base Products ({baseProducts.length})
            </button>
            <button 
              className={`tab-btn ${activeTab === 'my-products' ? 'active' : ''}`}
              onClick={() => setActiveTab('my-products')}
            >
              📋 My Products ({products.length})
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'available' && (
          <div className="available-products">
            <div className="section-header">
              <h2>Available Base Products</h2>
              <p>⚠️ Admin creates products with images. You can only set pricing and delivery time.</p>
            </div>

            {loadingBase ? (
              <LoadingSpinner text="Loading available products..." />
            ) : baseProducts.length === 0 ? (
              <div className="no-products">
                <div className="no-products-icon">🏪</div>
                <h3>No Products Available</h3>
                <p>No base products are currently available for pricing. Check back later!</p>
              </div>
            ) : (
              <div className="base-products-grid">
                {baseProducts.map(product => (
                  <div key={product._id} className="base-product-card">
                    <div className="product-image">
                      <img 
                        src={product.images?.[0]?.url || '/placeholder-product.jpg'} 
                        alt={product.name}
                        onError={(e) => { e.target.src = '/placeholder-product.jpg'; }}
                      />
                      <div className="admin-badge">👑 Admin Created</div>
                    </div>
                    
                    <div className="product-content">
                      <h3>{product.name}</h3>
                      <p className="product-description">{product.description}</p>
                      <div className="product-meta">
                        <span className="category">{product.category}</span>
                        {product.subcategory && <span className="subcategory">{product.subcategory}</span>}
                        <span className="hsn">HSN: {product.hsnCode}</span>
                      </div>
                      
                      <div className="product-actions">
                        <button 
                          className="btn btn-primary"
                          onClick={() => handleSetPricing(product)}
                          disabled={setPricingMutation.isLoading}
                        >
                          💰 Set My Pricing
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'my-products' && (
          <div className="my-products">
            <div className="section-header">
              <h2>My Products</h2>
              <p>Manage pricing and stock for your products (images controlled by admin)</p>
              
              {/* Filters */}
              <div className="products-filters">
                <div className="filters-row">
                  <div className="search-box">
                    <input
                      type="text"
                      placeholder="Search my products..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      className="search-input"
                    />
                  </div>

                  <div className="filter-selects">
                    <select
                      value={filters.category}
                      onChange={(e) => handleFilterChange('category', e.target.value)}
                      className="filter-select"
                    >
                      <option value="">All Categories</option>
                      <option value="aggregate">Aggregate</option>
                      <option value="sand">Sand</option>
                      <option value="tmt_steel">TMT Steel</option>
                      <option value="bricks_blocks">Bricks & Blocks</option>
                      <option value="cement">Cement</option>
                    </select>

                    <select
                      value={filters.status}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                      className="filter-select"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="pending">Pending Approval</option>
                      <option value="approved">Approved</option>
                    </select>

                    <select
                      value={filters.sortBy}
                      onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                      className="filter-select"
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="name">Name A-Z</option>
                      <option value="price-low">Price: Low to High</option>
                      <option value="price-high">Price: High to Low</option>
                    </select>
                  </div>
                </div>

                <div className="results-info">
                  <span className="results-count">
                    {pagination?.totalItems || 0} products found
                  </span>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            {isLoading ? (
              <LoadingSpinner text="Loading your products..." />
            ) : error ? (
              <div className="products-error">
                <h3>Error Loading Products</h3>
                <p>Unable to load your products. Please try again.</p>
              </div>
            ) : products.length === 0 ? (
              <div className="no-products">
                <div className="no-products-icon">📦</div>
                <h3>No Products Yet</h3>
                <p>You haven't added pricing to any base products yet. Check the "Available Products" tab to get started!</p>
                <button 
                  className="btn btn-primary"
                  onClick={() => setActiveTab('available')}
                >
                  Browse Available Products
                </button>
              </div>
            ) : (
              <>
                <div className="products-grid">
                  {products.map((product) => (
                    <div key={product._id} className="product-card">
                      <div className="product-image">
                        <img 
                          src={product.primaryImage || product.images?.[0]?.url || '/placeholder-product.jpg'} 
                          alt={product.name}
                          onError={(e) => { e.target.src = '/placeholder-product.jpg'; }}
                        />
                        <div className="product-status-overlay">
                          <span className={`status-badge ${product.status}`}>
                            {product.status === 'active' ? 'Active' :
                             product.status === 'inactive' ? 'Inactive' :
                             product.status === 'pending' ? 'Pending Approval' : 
                             product.status}
                          </span>
                        </div>
                        <div className="pricing-only-badge">💰 Pricing Only</div>
                      </div>

                      <div className="product-content">
                        <h3 className="product-name">{product.name}</h3>
                        <div className="product-category">{product.category}</div>
                        
                        <div className="product-details">
                          <div className="product-price">
                            {formatCurrency(product.price || product.pricing?.basePrice || 0)}/{product.unit || product.pricing?.unit || 'unit'}
                          </div>
                          <div className="product-stock">
                            Stock: {product.stockQuantity || product.stock?.available || 0} {product.unit || product.pricing?.unit || 'units'}
                          </div>
                          <div className="delivery-time">
                            🚚 {product.deliveryTime || 'Not set'}
                          </div>
                        </div>

                        <div className="product-meta">
                          <div className="meta-item">
                            <span>Added: {formatDate(product.createdAt)}</span>
                          </div>
                          <div className="meta-item">
                            <span>Views: {product.viewCount || 0}</span>
                          </div>
                        </div>

                        <div className="product-actions">
                          <button
                            onClick={() => handleEditPricing(product)}
                            className="btn btn-outline btn-sm"
                          >
                            💰 Edit Pricing
                          </button>
                          
                          <button
                            onClick={() => handleToggleStatus(product._id, product.status)}
                            disabled={toggleStatusMutation.isLoading}
                            className={`btn btn-sm ${product.status === 'active' ? 'btn-warning' : 'btn-success'}`}
                          >
                            {product.status === 'active' ? 'Deactivate' : 'Activate'}
                          </button>
                          
                          <button
                            onClick={() => handleDeleteProduct(product._id, product.name)}
                            disabled={deleteProductMutation.isLoading}
                            className="btn btn-danger btn-sm"
                          >
                            Delete
                          </button>
                        </div>
                        
                        <div className="admin-note">
                          ⚠️ Images managed by admin. You can only update pricing, stock & delivery time.
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="pagination">
                    <button 
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="pagination-btn"
                    >
                      ← Previous
                    </button>
                    
                    <div className="pagination-pages">
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

        {/* Edit Pricing Modal */}
        {showEditModal && selectedProduct && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>Edit Pricing for {selectedProduct.name}</h3>
                <button 
                  onClick={() => setShowEditModal(false)}
                  className="modal-close"
                >
                  ×
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

        {/* Pricing Modal */}
        {showPricingModal && selectedBaseProduct && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>Set Pricing for {selectedBaseProduct.name}</h3>
                <button 
                  onClick={() => setShowPricingModal(false)}
                  className="modal-close"
                >
                  ×
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
      </div>
    </div>
  )
}

// Enhanced Pricing Form Component with category-specific fields
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
    // Add category-specific fields
    brand: '',
    specifications: {
      // TMT Steel fields
      grade: '',
      diameter: '',
      // Cement fields
      cementGrade: '',
      cementType: '',
      // Bricks & Blocks fields
      size: '',
      // General fields
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
    onSubmit(formData)
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const keys = field.split('.')
      const newData = { ...prev }
      let current = newData
      
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] }
        current = current[keys[i]]
      }
      
      current[keys[keys.length - 1]] = value
      return newData
    })
  }

  // Helper function to check if field is required for current category
  const isFieldRequired = (fieldName) => {
    const category = baseProduct.category
    switch (fieldName) {
      case 'brand':
        return ['tmt_steel', 'bricks_blocks', 'cement'].includes(category)
      case 'grade':
      case 'diameter':
        return category === 'tmt_steel'
      case 'cementGrade':
      case 'cementType':
        return category === 'cement'
      case 'size':
        return category === 'bricks_blocks'
      default:
        return false
    }
  }

  return (
    <form onSubmit={handleSubmit} className="pricing-form">
      <div className="form-section">
        <h4>Product Information</h4>
        <div className="product-info">
          <img 
            src={baseProduct.images?.[0]?.url || '/placeholder-product.jpg'} 
            alt={baseProduct.name}
            className="product-thumbnail"
          />
          <div>
            <h5>{baseProduct.name}</h5>
            <p>{baseProduct.description}</p>
            <p><strong>Category:</strong> {baseProduct.category}</p>
            <p><strong>HSN:</strong> {baseProduct.hsnCode}</p>
          </div>
        </div>
      </div>

      {/* Brand field for applicable categories */}
      {isFieldRequired('brand') && (
        <div className="form-section">
          <h4>Brand Information</h4>
          <div className="form-group">
            <label>Brand Name *</label>
            <input
              type="text"
              value={formData.brand}
              onChange={(e) => handleInputChange('brand', e.target.value)}
              placeholder="Enter brand name"
              required={isFieldRequired('brand')}
            />
          </div>
        </div>
      )}

      {/* TMT Steel specific fields */}
      {baseProduct.category === 'tmt_steel' && (
        <div className="form-section">
          <h4>TMT Steel Specifications</h4>
          <div className="form-row">
            <div className="form-group">
              <label>Grade *</label>
              <select
                value={formData.specifications.grade}
                onChange={(e) => handleInputChange('specifications.grade', e.target.value)}
                required={isFieldRequired('grade')}
              >
                <option value="">Select Grade</option>
                <option value="FE-415">FE-415</option>
                <option value="FE-500">FE-500</option>
                <option value="FE-550">FE-550</option>
                <option value="FE-600">FE-600</option>
              </select>
            </div>
            <div className="form-group">
              <label>Diameter *</label>
              <select
                value={formData.specifications.diameter}
                onChange={(e) => handleInputChange('specifications.diameter', e.target.value)}
                required={isFieldRequired('diameter')}
              >
                <option value="">Select Diameter</option>
                <option value="6mm">6mm</option>
                <option value="8mm">8mm</option>
                <option value="10mm">10mm</option>
                <option value="12mm">12mm</option>
                <option value="16mm">16mm</option>
                <option value="20mm">20mm</option>
                <option value="25mm">25mm</option>
                <option value="32mm">32mm</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Cement specific fields */}
      {baseProduct.category === 'cement' && (
        <div className="form-section">
          <h4>Cement Specifications</h4>
          <div className="form-row">
            <div className="form-group">
              <label>Cement Grade *</label>
              <select
                value={formData.specifications.cementGrade}
                onChange={(e) => handleInputChange('specifications.cementGrade', e.target.value)}
                required={isFieldRequired('cementGrade')}
              >
                <option value="">Select Grade</option>
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
                required={isFieldRequired('cementType')}
              >
                <option value="">Select Type</option>
                <option value="OPC">OPC (Ordinary Portland Cement)</option>
                <option value="PPC">PPC (Portland Pozzolana Cement)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Bricks & Blocks specific fields */}
      {baseProduct.category === 'bricks_blocks' && (
        <div className="form-section">
          <h4>Bricks & Blocks Specifications</h4>
          <div className="form-group">
            <label>Size *</label>
            <input
              type="text"
              value={formData.specifications.size}
              onChange={(e) => handleInputChange('specifications.size', e.target.value)}
              placeholder="e.g., 230x110x70mm"
              required={isFieldRequired('size')}
            />
          </div>
        </div>
      )}

      {/* General specifications for all categories */}
      <div className="form-section">
        <h4>General Specifications (Optional)</h4>
        <div className="form-row">
          <div className="form-group">
            <label>Weight (kg)</label>
            <input
              type="number"
              value={formData.specifications.weight}
              onChange={(e) => handleInputChange('specifications.weight', e.target.value)}
              placeholder="Weight in kg"
              step="0.01"
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Length (mm)</label>
            <input
              type="number"
              value={formData.specifications.dimensions.length}
              onChange={(e) => handleInputChange('specifications.dimensions.length', e.target.value)}
              placeholder="Length"
            />
          </div>
          <div className="form-group">
            <label>Width (mm)</label>
            <input
              type="number"
              value={formData.specifications.dimensions.width}
              onChange={(e) => handleInputChange('specifications.dimensions.width', e.target.value)}
              placeholder="Width"
            />
          </div>
          <div className="form-group">
            <label>Height (mm)</label>
            <input
              type="number"
              value={formData.specifications.dimensions.height}
              onChange={(e) => handleInputChange('specifications.dimensions.height', e.target.value)}
              placeholder="Height"
            />
          </div>
        </div>
      </div>

      <div className="form-section">
        <h4>Pricing Details</h4>
        <div className="form-row">
          <div className="form-group">
            <label>Base Price *</label>
            <input
              type="number"
              value={formData.pricing.basePrice}
              onChange={(e) => handleInputChange('pricing.basePrice', e.target.value)}
              placeholder="Enter price"
              step="0.01"
              min="0"
              required
            />
          </div>
          <div className="form-group">
            <label>Unit</label>
            <select
              value={formData.pricing.unit}
              onChange={(e) => handleInputChange('pricing.unit', e.target.value)}
            >
              <option value="MT">MT (Metric Tons)</option>
              <option value="bags">Bags</option>
              <option value="numbers">Numbers</option>
            </select>
          </div>
        </div>

        <div className="form-row">
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
            />
          </div>
          <div className="form-group">
            <label>Delivery Time *</label>
            <select
              value={formData.deliveryTime}
              onChange={(e) => handleInputChange('deliveryTime', e.target.value)}
              required
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

        <div className="form-group">
          <label>Available Stock *</label>
          <input
            type="number"
            value={formData.stock.available}
            onChange={(e) => handleInputChange('stock.available', e.target.value)}
            placeholder="Available quantity"
            min="0"
            required
          />
        </div>

        <div className="checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={formData.pricing.includesGST}
              onChange={(e) => handleInputChange('pricing.includesGST', e.target.checked)}
            />
            Price includes GST
          </label>
        </div>
      </div>

      <div className="modal-footer">
        <button type="button" onClick={onCancel} className="btn btn-outline">
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={isLoading}>
          {isLoading ? 'Setting Pricing...' : 'Set Pricing'}
        </button>
      </div>
    </form>
  )
}

// Edit Pricing Form Component for existing products
const EditPricingForm = ({ product, onSubmit, onCancel, isLoading }) => {
  const [formData, setFormData] = useState({
    pricing: {
      basePrice: product.pricing?.basePrice || '',
      minimumQuantity: product.pricing?.minimumQuantity || '',
      includesGST: product.pricing?.includesGST || false,
      gstRate: product.pricing?.gstRate || 18,
      transportCost: {
        included: product.pricing?.transportCost?.included || true,
        costPerKm: product.pricing?.transportCost?.costPerKm || 0
      }
    },
    deliveryTime: product.deliveryTime || '',
    stock: {
      available: product.stock?.available || '',
      lowStockThreshold: product.stock?.lowStockThreshold || 10
    }
  })
// Replace the validateForm function:

  const validateForm = () => {
    const errors = []
    const category = baseProduct.category
    
    // Check basic pricing fields
    if (!formData.pricing.basePrice || formData.pricing.basePrice <= 0) {
      errors.push('Base price is required and must be greater than 0')
    }
    if (!formData.pricing.minimumQuantity || formData.pricing.minimumQuantity <= 0) {
      errors.push('Minimum quantity is required and must be greater than 0')
    }
    if (!formData.deliveryTime) {
      errors.push('Delivery time is required')
    }
    if (!formData.stock.available || formData.stock.available < 0) {
      errors.push('Available stock is required and cannot be negative')
    }
    
    // Check category-specific required fields
    switch (category) {
      case 'tmt_steel':
        if (!formData.specifications.grade) {
          errors.push('Grade is required for TMT Steel products')
        }
        if (!formData.specifications.diameter) {
          errors.push('Diameter is required for TMT Steel products')
        }
        if (!formData.brand?.trim()) {
          errors.push('Brand is required for TMT Steel products')
        }
        break
        
      case 'cement':
        if (!formData.specifications.cementGrade) {
          errors.push('Cement grade is required for Cement products')
        }
        if (!formData.specifications.cementType) {
          errors.push('Cement type is required for Cement products')
        }
        if (!formData.brand?.trim()) {
          errors.push('Brand is required for Cement products')
        }
        break
        
      case 'bricks_blocks':
        if (!formData.specifications.size?.trim()) {
          errors.push('Size is required for Bricks & Blocks products')
        }
        if (!formData.brand?.trim()) {
          errors.push('Brand is required for Bricks & Blocks products')
        }
        break
        
      case 'aggregate':
      case 'sand':
        // No specific required fields for these categories
        break
        
      default:
        errors.push(`Unknown product category: ${category}`)
    }
    
    return errors
  }
  // Replace the entire handleSubmit function in the PricingForm component:

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Validate form first
    const validationErrors = validateForm()
    if (validationErrors.length > 0) {
      alert('Please fix the following errors:\n' + validationErrors.join('\n'))
      return
    }
    
    // Create the submission data with proper structure
    const category = baseProduct.category
    const submissionData = {
      // Include category for backend validation
      category: category,
      
      // Pricing information (always required)
      pricing: {
        basePrice: parseFloat(formData.pricing.basePrice),
        unit: formData.pricing.unit,
        minimumQuantity: parseFloat(formData.pricing.minimumQuantity),
        includesGST: formData.pricing.includesGST,
        gstRate: formData.pricing.gstRate || 18,
        transportCost: formData.pricing.transportCost
      },
      
      // Stock information
      stock: {
        available: parseInt(formData.stock.available),
        lowStockThreshold: formData.stock.lowStockThreshold || 10
      },
      
      // Delivery time
      deliveryTime: formData.deliveryTime,
      
      // Specifications - only include relevant fields
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
        
      case 'aggregate':
      case 'sand':
        // For aggregate and sand, no specific fields required
        // Only general specifications if provided
        break
    }
    
    // Add optional general specifications if they have values
    if (formData.specifications.weight) {
      submissionData.specifications.weight = parseFloat(formData.specifications.weight)
    }
    
    // Add dimensions if any are provided
    const dimensions = formData.specifications.dimensions
    if (dimensions.length || dimensions.width || dimensions.height) {
      submissionData.specifications.dimensions = {}
      if (dimensions.length) submissionData.specifications.dimensions.length = parseFloat(dimensions.length)
      if (dimensions.width) submissionData.specifications.dimensions.width = parseFloat(dimensions.width)
      if (dimensions.height) submissionData.specifications.dimensions.height = parseFloat(dimensions.height)
    }
    
    console.log('Final submission data:', submissionData)
    onSubmit(submissionData)
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const keys = field.split('.')
      const newData = { ...prev }
      let current = newData
      
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] }
        current = current[keys[i]]
      }
      
      current[keys[keys.length - 1]] = value
      return newData
    })
  }

  return (
    <form onSubmit={handleSubmit} className="pricing-form">
      <div className="form-section">
        <h4>Product Information</h4>
        <div className="product-info">
          <img 
            src={product.images?.[0]?.url || '/placeholder-product.jpg'} 
            alt={product.name}
            className="product-thumbnail"
          />
          <div>
            <h5>{product.name}</h5>
            <p>{product.description}</p>
            <p><strong>Category:</strong> {product.category}</p>
            <p><strong>Current Status:</strong> {product.status}</p>
          </div>
        </div>
      </div>

      <div className="form-section">
        <h4>Pricing Details</h4>
        <div className="form-row">
          <div className="form-group">
            <label>Base Price *</label>
            <input
              type="number"
              value={formData.pricing.basePrice}
              onChange={(e) => handleInputChange('pricing.basePrice', e.target.value)}
              placeholder="Enter price"
              step="0.01"
              min="0"
              required
            />
          </div>
          <div className="form-group">
            <label>Unit</label>
            <span className="unit-display">{product.pricing?.unit || 'MT'}</span>
          </div>
        </div>

        <div className="form-row">
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
            />
          </div>
          <div className="form-group">
            <label>GST Rate (%)</label>
            <input
              type="number"
              value={formData.pricing.gstRate}
              onChange={(e) => handleInputChange('pricing.gstRate', e.target.value)}
              placeholder="GST rate"
              min="0"
              max="28"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Delivery Time *</label>
          <select
            value={formData.deliveryTime}
            onChange={(e) => handleInputChange('deliveryTime', e.target.value)}
            required
          >
            <option value="">Select delivery time</option>
            <option value="same_day">Same Day</option>
            <option value="next_day">Next Day</option>
            <option value="2_3_days">2-3 Days</option>
            <option value="3_7_days">3-7 Days</option>
            <option value="1_2_weeks">1-2 Weeks</option>
          </select>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Available Stock *</label>
            <input
              type="number"
              value={formData.stock.available}
              onChange={(e) => handleInputChange('stock.available', e.target.value)}
              placeholder="Available quantity"
              min="0"
              required
            />
          </div>
          <div className="form-group">
            <label>Low Stock Threshold</label>
            <input
              type="number"
              value={formData.stock.lowStockThreshold}
              onChange={(e) => handleInputChange('stock.lowStockThreshold', e.target.value)}
              placeholder="Low stock alert"
              min="0"
            />
          </div>
        </div>

        <div className="checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={formData.pricing.includesGST}
              onChange={(e) => handleInputChange('pricing.includesGST', e.target.checked)}
            />
            Price includes GST
          </label>
        </div>

        <div className="checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={formData.pricing.transportCost.included}
              onChange={(e) => handleInputChange('pricing.transportCost.included', e.target.checked)}
            />
            Transport cost included in price
          </label>
        </div>

        {!formData.pricing.transportCost.included && (
          <div className="form-group">
            <label>Transport Cost per KM</label>
            <input
              type="number"
              value={formData.pricing.transportCost.costPerKm}
              onChange={(e) => handleInputChange('pricing.transportCost.costPerKm', e.target.value)}
              placeholder="Cost per kilometer"
              step="0.01"
              min="0"
            />
          </div>
        )}
      </div>

      <div className="modal-footer">
        <button type="button" onClick={onCancel} className="btn btn-outline">
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={isLoading}>
          {isLoading ? 'Updating...' : 'Update Pricing'}
        </button>
      </div>
    </form>
  )
}

export default SupplierProductsPage