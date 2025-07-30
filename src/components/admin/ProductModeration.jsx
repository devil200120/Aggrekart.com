// Replace the existing component with this updated version that fetches products:

import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
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

const ProductModeration = () => {
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

  // Fetch products for admin review
  const { data: productsData, isLoading: loading, error } = useQuery(
    ['admin-products', filterStatus, filterCategory, searchTerm],
    () => adminAPI.getAllProducts({
      status: filterStatus !== 'all' ? filterStatus : undefined,
      category: filterCategory !== 'all' ? filterCategory : undefined,
      search: searchTerm || undefined,
      limit: 50
    }),
    {
      keepPreviousData: true,
      staleTime: 30000 // 30 seconds
    }
  )

  const products = productsData?.data?.products || []

  // Rest of your existing mutations and logic...
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

  // Rest of your existing component logic...
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

    // Sort logic
    filtered.sort((a, b) => {
      let aValue = a[sortBy]
      let bValue = b[sortBy]
      
      if (sortBy === 'createdAt') {
        aValue = new Date(aValue)
        bValue = new Date(bValue)
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }, [products, searchTerm, filterStatus, filterCategory, sortBy, sortOrder])

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <p>Loading products for review...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="admin-error">
        <AlertTriangle size={48} />
        <h3>Error Loading Products</h3>
        <p>{error.message}</p>
        <button onClick={() => queryClient.invalidateQueries('admin-products')}>
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="product-moderation">
      <div className="moderation-header">
        <div className="header-content">
          <h2>Product Moderation</h2>
          <p>Review and approve supplier product listings</p>
        </div>
        
        <div className="header-stats">
          <div className="stat-card">
            <span className="stat-number">{products.filter(p => p.status === 'pending').length}</span>
            <span className="stat-label">Pending Review</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{products.filter(p => p.status === 'approved').length}</span>
            <span className="stat-label">Approved</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{products.filter(p => p.status === 'rejected').length}</span>
            <span className="stat-label">Rejected</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="moderation-controls">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search products, suppliers, categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-controls">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            <option value="aggregate">Aggregate</option>
            <option value="sand">Sand</option>
            <option value="tmt_steel">TMT Steel</option>
            <option value="bricks_blocks">Bricks & Blocks</option>
            <option value="cement">Cement</option>
          </select>
        </div>
      </div>

      {/* Products List */}
      <div className="products-list">
        {filteredProducts.length === 0 ? (
          <div className="no-products">
            <Package size={48} />
            <h3>No Products Found</h3>
            <p>No products match your current filters.</p>
          </div>
        ) : (
          <div className="products-grid">
            {filteredProducts.map(product => (
              <div key={product._id} className="product-card">
                <div className="product-header">
                  <div className="product-image">
                    {product.images?.[0] ? (
                      <img src={product.images[0]} alt={product.name} />
                    ) : (
                      <div className="image-placeholder">
                        <Image size={24} />
                      </div>
                    )}
                  </div>
                  <div className={`status-badge ${product.status}`}>
                    {product.status}
                  </div>
                </div>

                <div className="product-content">
                  <h3>{product.name}</h3>
                  <div className="product-meta">
                    <div className="meta-item">
                      <Building size={14} />
                      <span>{product.supplier?.businessName || 'Unknown Supplier'}</span>
                    </div>
                    <div className="meta-item">
                      <Tag size={14} />
                      <span>{product.category}</span>
                    </div>
                    <div className="meta-item">
                      <DollarSign size={14} />
                      <span>₹{product.price || product.pricing?.basePrice}</span>
                    </div>
                  </div>

                  <div className="product-actions">
                    <button 
                      className="btn btn-outline"
                      onClick={() => {
                        setSelectedProduct(product)
                        setShowProductModal(true)
                      }}
                    >
                      <Eye size={16} />
                      View Details
                    </button>

                    {product.status === 'pending' && (
                      <>
                        <button 
                          className="btn btn-success"
                          onClick={() => handleApprove(product)}
                        >
                          <CheckCircle size={16} />
                          Approve
                        </button>
                        <button 
                          className="btn btn-danger"
                          onClick={() => handleReject(product)}
                        >
                          <XCircle size={16} />
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  function handleApprove(product) {
    approveProductMutation.mutate({ 
      productId: product._id, 
      data: { reason: 'Approved by admin' } 
    })
  }

  function handleReject(product) {
    const reason = prompt('Please provide a reason for rejection:')
    if (reason) {
      rejectProductMutation.mutate({ 
        productId: product._id, 
        data: { reason } 
      })
    }
  }
}

export default ProductModeration