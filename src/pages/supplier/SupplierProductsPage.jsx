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
    status: '',
    sortBy: 'newest'
  })
  const [currentPage, setCurrentPage] = useState(1)

  // Fetch supplier products
  const { data: productsData, isLoading, error } = useQuery(
    ['supplier-products', user?.id, filters, currentPage],
    () => supplierAPI.getProducts({
      ...filters,
      page: currentPage,
      limit: 12
    }),
    {
      enabled: !!user && user.role === 'supplier',
      keepPreviousData: true,
      staleTime: 5 * 60 * 1000,
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
  const toggleStatusMutation = useMutation(
    ({ productId, status }) => supplierAPI.updateProductStatus(productId, status),
    {
      onSuccess: () => {
        toast.success('Product status updated')
        queryClient.invalidateQueries('supplier-products')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update status')
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

  const handleToggleStatus = (productId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    toggleStatusMutation.mutate({ productId, status: newStatus })
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

  const products = productsData?.products || []
  const pagination = productsData?.pagination || {}

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
                <option value="cement">Cement</option>
                <option value="steel">TMT Steel</option>
                <option value="bricks">Bricks</option>
                <option value="sand">Sand</option>
                <option value="aggregates">Aggregates</option>
              </select>

              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="filter-select"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="out_of_stock">Out of Stock</option>
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
              {pagination.total || 0} products found
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
                      src={product.images?.[0] || '/placeholder-product.jpg'} 
                      alt={product.name}
                    />
                    <div className="product-status-overlay">
                      <span className={`status-badge ${product.status}`}>
                        {product.status === 'active' ? 'Active' :
                         product.status === 'inactive' ? 'Inactive' :
                         product.status === 'out_of_stock' ? 'Out of Stock' : product.status}
                      </span>
                    </div>
                  </div>

                  <div className="product-content">
                    <h3 className="product-name">{product.name}</h3>
                    <div className="product-category">{product.category}</div>
                    
                    <div className="product-details">
                      <div className="product-price">
                        {formatCurrency(product.price)}/{product.unit}
                      </div>
                      <div className="product-stock">
                        Stock: {product.stockQuantity || 0} {product.unit}
                      </div>
                    </div>

                    <div className="product-meta">
                      <div className="meta-item">
                        <span>Added: {formatDate(product.createdAt)}</span>
                      </div>
                      <div className="meta-item">
                        <span>Views: {product.views || 0}</span>
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