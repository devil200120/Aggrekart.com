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
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    status: 'all',
    sortBy: 'newest'
  })
  const [currentPage, setCurrentPage] = useState(1)

  // Fetch supplier products
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
    enabled: !!user && user.role === 'supplier',
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


  // Delete product mutation
  const deleteProductMutation = useMutation(
    (productId) => supplierAPI.deleteProduct(productId),
    {
      onSuccess: () => {
        toast.success('Product deleted successfully')
        queryClient.invalidateQueries('supplier-products')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete product')
      }
    }
  )

  // Toggle product status mutation
  // Replace lines 36-45 with this:

  // Toggle product status mutation
  // Replace the toggleStatusMutation (around lines 80-90):

  // Toggle product status mutation - FIXED
  const toggleStatusMutation = useMutation(
    ({ productId, currentStatus }) => {
      // Convert status to isActive boolean for backend
      const isActive = currentStatus !== 'active';
      return supplierAPI.updateProduct(productId, { isActive });
    },
    {
      onSuccess: () => {
        toast.success('Product status updated successfully')
        queryClient.invalidateQueries('supplier-products')
      },
      onError: (error) => {
        console.error('Status toggle error:', error.response?.data)
        toast.error(error.response?.data?.message || 'Failed to update product status')
      }
    }
  )
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  const handleDeleteProduct = (productId, productName) => {
    if (window.confirm(`Are you sure you want to delete "${productName}"?`)) {
      deleteProductMutation.mutate(productId)
    }
  }

  // Replace the handleToggleStatus function (around lines 108-111):

  const handleToggleStatus = (productId, currentStatus) => {
    console.log('Toggling status for product:', productId, 'current status:', currentStatus)
    toggleStatusMutation.mutate({ productId, currentStatus })
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

  if (isLoading) {
    return (
      <div className="supplier-products-page">
        <div className="container">
          <LoadingSpinner size="large" text="Loading your products..." />
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
            <h1>My Products</h1>
            <p>Manage your product catalog and inventory</p>
          </div>
          
          <div className="header-actions">
            <Link to="/supplier/products/add" className="btn btn-primary">
              ➕ Add New Product
            </Link>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="products-filters">
          <div className="filters-row">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search products..."
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

        {/* Products Grid */}
        {error ? (
          <div className="products-error">
            <h3>Error Loading Products</h3>
            <p>Unable to load your products. Please try again.</p>
          </div>
        ) : products.length === 0 ? (
          <div className="no-products">
            <div className="no-products-icon">📦</div>
            <h3>No Products Found</h3>
            <p>
              {Object.values(filters).some(f => f) 
                ? 'Try adjusting your filters'
                : "You haven't added any products yet"
              }
            </p>
            <Link to="/supplier/products/add" className="btn btn-primary">
              Add Your First Product
            </Link>
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
    onError={(e) => {
      e.target.src = '/placeholder-product.jpg';
    }}
  />

                    <div className="product-status-overlay">
                      <span className={`status-badge ${product.status}`}>
                        {product.status === 'active' ? 'Active' :
                         product.status === 'inactive' ? 'Inactive' :
                         product.status === 'pending' ? 'Pending Approval' : 
                         product.status}
                      </span>
                    </div>
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
                      <Link 
                        to={`/supplier/products/${product._id}/edit`}
                        className="btn btn-outline btn-sm"
                      >
                        Edit
                      </Link>
                      
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
    </div>
  )
}

export default SupplierProductsPage
