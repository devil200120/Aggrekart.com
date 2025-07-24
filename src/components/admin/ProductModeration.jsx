/* 
FILE: c:\Users\KIIT0001\Desktop\builder_website using mern\front-end\app\src\components\admin\ProductModeration.jsx
LINES: 1-300
PURPOSE: Component for admin to review and moderate products
*/

import React, { useState, useMemo } from 'react'
import { useMutation, useQueryClient } from 'react-query'
import { 
  Search, 
  Filter, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Star,
  AlertTriangle,
  Image,
  DollarSign,
  Package,
  Building,
  Calendar,
  Tag
} from 'lucide-react'
import { adminAPI } from '../../services/api'
import toast from 'react-hot-toast'
import './ProductModeration.css'

const ProductModeration = ({ products = [], loading }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('pending')
  const [filterCategory, setFilterCategory] = useState('all')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [showProductModal, setShowProductModal] = useState(false)
  const [actionReason, setActionReason] = useState('')
  const queryClient = useQueryClient()

  // Approve product mutation
  const approveProductMutation = useMutation(
    ({ productId, data }) => adminAPI.approveProduct(productId, data),
    {
      onSuccess: () => {
        toast.success('Product approved successfully!')
        queryClient.invalidateQueries('admin-products')
        setShowProductModal(false)
        setActionReason('')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to approve product')
      }
    }
  )

  // Reject product mutation
  const rejectProductMutation = useMutation(
    ({ productId, data }) => adminAPI.rejectProduct(productId, data),
    {
      onSuccess: () => {
        toast.success('Product rejected successfully!')
        queryClient.invalidateQueries('admin-products')
        setShowProductModal(false)
        setActionReason('')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to reject product')
      }
    }
  )

  // Feature product mutation
  const featureProductMutation = useMutation(
    ({ productId, featured }) => adminAPI.featuredProduct(productId, featured),
    {
      onSuccess: (data, { featured }) => {
        toast.success(`Product ${featured ? 'featured' : 'unfeatured'} successfully!`)
        queryClient.invalidateQueries('admin-products')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update product')
      }
    }
  )

  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    let filtered = products.filter(product => {
      const matchesSearch = 
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.supplier?.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = filterStatus === 'all' || product.status === filterStatus
      const matchesCategory = filterCategory === 'all' || product.category === filterCategory
      
      return matchesSearch && matchesStatus && matchesCategory
    })

    // Sort products
    filtered.sort((a, b) => {
      let aValue = a[sortBy]
      let bValue = b[sortBy]
      
      if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
        aValue = new Date(aValue)
        bValue = new Date(bValue)
      } else if (sortBy === 'price') {
        aValue = parseFloat(aValue)
        bValue = parseFloat(bValue)
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }, [products, searchTerm, filterStatus, filterCategory, sortBy, sortOrder])

  const getStatusBadge = (status) => {
    const badges = {
      pending: { label: 'Pending Review', className: 'status-pending', icon: AlertTriangle },
      approved: { label: 'Approved', className: 'status-approved', icon: CheckCircle },
      rejected: { label: 'Rejected', className: 'status-rejected', icon: XCircle },
      draft: { label: 'Draft', className: 'status-draft', icon: Package }
    }
    
    const badge = badges[status] || badges.pending
    const IconComponent = badge.icon
    
    return (
      <span className={`status-badge ${badge.className}`}>
        <IconComponent size={12} />
        {badge.label}
      </span>
    )
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const handleApprove = (product) => {
    setSelectedProduct(product)
    setShowProductModal(true)
  }

  const handleReject = (product) => {
    setSelectedProduct(product)
    setShowProductModal(true)
  }

  const confirmAction = (action) => {
    if (!selectedProduct) return

    const data = {
      reason: actionReason,
      reviewedBy: 'admin', // This would come from auth context
      reviewedAt: new Date().toISOString()
    }

    if (action === 'approve') {
      approveProductMutation.mutate({ productId: selectedProduct._id, data })
    } else if (action === 'reject') {
      rejectProductMutation.mutate({ productId: selectedProduct._id, data })
    }
  }

  const toggleFeatured = (product) => {
    featureProductMutation.mutate({
      productId: product._id,
      featured: !product.featured
    })
  }

  if (loading) {
    return (
      <div className="product-moderation">
        <div className="product-moderation-header">
          <h3>Product Moderation</h3>
        </div>
        <div className="loading-products">
          <div className="loading-spinner"></div>
          <p>Loading products...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="product-moderation">
      <div className="product-moderation-header">
        <h3>Product Moderation</h3>
        <div className="moderation-stats">
          <span className="stat-item">
            <span className="stat-value">{products.filter(p => p.status === 'pending').length}</span>
            <span className="stat-label">Pending</span>
          </span>
          <span className="stat-item">
            <span className="stat-value">{products.filter(p => p.status === 'approved').length}</span>
            <span className="stat-label">Approved</span>
          </span>
          <span className="stat-item">
            <span className="stat-value">{products.filter(p => p.featured).length}</span>
            <span className="stat-label">Featured</span>
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="product-controls">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search products by name, supplier, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <button 
          className={`filter-toggle ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={20} />
          Filters
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="filter-panel">
          <div className="filter-group">
            <label>Status</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="pending">Pending Review</option>
              <option value="all">All Status</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="draft">Draft</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Category</label>
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
              <option value="all">All Categories</option>
              <option value="cement">Cement</option>
              <option value="steel">Steel</option>
              <option value="bricks">Bricks</option>
              <option value="tiles">Tiles</option>
              <option value="pipes">Pipes</option>
              <option value="tools">Tools</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Sort By</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="createdAt">Date Added</option>
              <option value="price">Price</option>
              <option value="name">Product Name</option>
              <option value="supplier.businessName">Supplier</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Order</label>
            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>
      )}

      {/* Products Grid */}
      <div className="products-grid">
        {filteredProducts.map((product) => (
          <div key={product._id} className="product-card">
            <div className="product-card-header">
              <div className="product-image">
                {product.images && product.images.length > 0 ? (
                  <img src={product.images[0]} alt={product.name} />
                ) : (
                  <div className="image-placeholder">
                    <Image size={24} />
                  </div>
                )}
                {product.featured && (
                  <div className="featured-badge">
                    <Star size={12} />
                  </div>
                )}
              </div>
              {getStatusBadge(product.status)}
            </div>

            <div className="product-card-body">
              <h4 className="product-name">{product.name}</h4>
              
              <div className="product-meta">
                <div className="meta-item">
                  <Building size={14} />
                  <span>{product.supplier?.businessName}</span>
                </div>
                <div className="meta-item">
                  <Tag size={14} />
                  <span>{product.category}</span>
                </div>
                <div className="meta-item">
                  <DollarSign size={14} />
                  <span>{formatCurrency(product.price)}</span>
                </div>
                <div className="meta-item">
                  <Calendar size={14} />
                  <span>Added {formatDate(product.createdAt)}</span>
                </div>
              </div>

              <div className="product-description">
                <p>{product.description}</p>
              </div>

              <div className="product-specs">
                {product.specifications && (
                  <div className="spec-item">
                    <span className="spec-label">Specs:</span>
                    <span className="spec-value">{product.specifications}</span>
                  </div>
                )}
                {product.brand && (
                  <div className="spec-item">
                    <span className="spec-label">Brand:</span>
                    <span className="spec-value">{product.brand}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="product-card-footer">
              <button 
                className="btn btn-outline btn-sm"
                onClick={() => {
                  setSelectedProduct(product)
                  setShowProductModal(true)
                }}
              >
                <Eye size={14} />
                View Details
              </button>

              {product.status === 'pending' && (
                <>
                  <button 
                    className="btn btn-success btn-sm"
                    onClick={() => handleApprove(product)}
                  >
                    <CheckCircle size={14} />
                    Approve
                  </button>
                  <button 
                    className="btn btn-danger btn-sm"
                    onClick={() => handleReject(product)}
                  >
                    <XCircle size={14} />
                    Reject
                  </button>
                </>
              )}

              {product.status === 'approved' && (
                <button 
                  className={`btn btn-sm ${product.featured ? 'btn-warning' : 'btn-primary'}`}
                  onClick={() => toggleFeatured(product)}
                  disabled={featureProductMutation.isLoading}
                >
                  <Star size={14} />
                  {product.featured ? 'Unfeature' : 'Feature'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="no-products">
          <div className="no-products-icon">📦</div>
          <h4>No products found</h4>
          <p>Try adjusting your search or filter criteria.</p>
        </div>
      )}

      {/* Product Details Modal */}
      {showProductModal && selectedProduct && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Product Details</h3>
              <button 
                className="modal-close"
                onClick={() => setShowProductModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="product-details">
                <div className="product-images">
                  {selectedProduct.images && selectedProduct.images.length > 0 ? (
                    <img src={selectedProduct.images[0]} alt={selectedProduct.name} />
                  ) : (
                    <div className="image-placeholder">
                      <Image size={48} />
                    </div>
                  )}
                </div>

                <div className="product-info">
                  <h4>{selectedProduct.name}</h4>
                  <p className="product-price">{formatCurrency(selectedProduct.price)}</p>
                  <p className="product-description">{selectedProduct.description}</p>
                  
                  <div className="product-attributes">
                    <div className="attribute">
                      <span className="attribute-label">Supplier:</span>
                      <span className="attribute-value">{selectedProduct.supplier?.businessName}</span>
                    </div>
                    <div className="attribute">
                      <span className="attribute-label">Category:</span>
                      <span className="attribute-value">{selectedProduct.category}</span>
                    </div>
                    <div className="attribute">
                      <span className="attribute-label">Stock:</span>
                      <span className="attribute-value">{selectedProduct.stockQuantity}</span>
                    </div>
                  </div>
                </div>
              </div>

              {selectedProduct.status === 'pending' && (
                <div className="action-section">
                  <div className="action-reason">
                    <label htmlFor="reason">Review Notes</label>
                    <textarea
                      id="reason"
                      value={actionReason}
                      onChange={(e) => setActionReason(e.target.value)}
                      placeholder="Add notes for approval/rejection..."
                      rows={3}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button 
                className="btn btn-outline"
                onClick={() => setShowProductModal(false)}
              >
                Close
              </button>
              
              {selectedProduct.status === 'pending' && (
                <>
                  <button 
                    className="btn btn-success"
                    onClick={() => confirmAction('approve')}
                    disabled={approveProductMutation.isLoading}
                  >
                    {approveProductMutation.isLoading ? 'Approving...' : 'Approve Product'}
                  </button>
                  <button 
                    className="btn btn-danger"
                    onClick={() => confirmAction('reject')}
                    disabled={rejectProductMutation.isLoading}
                  >
                    {rejectProductMutation.isLoading ? 'Rejecting...' : 'Reject Product'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductModeration