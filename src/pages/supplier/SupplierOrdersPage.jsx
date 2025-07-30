import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { supplierAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { toast } from 'react-hot-toast'
import './SupplierOrdersPage.css'

const SupplierOrdersPage = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState({
    status: '',
    page: 1,
    limit: 10
  })

  console.log('SupplierOrdersPage - Current user:', user)

  // Fetch orders with enhanced error handling
  const { data: ordersData, isLoading, error, refetch } = useQuery(
    ['supplier-orders', user?.id, filters],
    async () => {
      console.log('Fetching supplier orders with filters:', filters)
      
      // Clean up filters to avoid sending empty strings
      const cleanFilters = {}
      if (filters.status && filters.status !== '') cleanFilters.status = filters.status
      if (filters.page) cleanFilters.page = filters.page
      if (filters.limit) cleanFilters.limit = filters.limit
      
      console.log('Clean filters:', cleanFilters)
      const response = await supplierAPI.getOrders(cleanFilters)
      console.log('Orders API Response:', response)
      return response
    },
    {
      enabled: !!user && user.role === 'supplier',
      keepPreviousData: true,
      onError: (error) => {
        console.error('Orders fetch error:', error)
        const errorMessage = error?.response?.data?.message || error.message
        toast.error(`Failed to load orders: ${errorMessage}`)
      },
      onSuccess: (data) => {
        console.log('Orders fetched successfully:', data)
      }
    }
  )

  // Update order status mutation
  const updateStatusMutation = useMutation(
    ({ orderId, status }) => {
      console.log('Updating order status:', { orderId, status })
      return supplierAPI.updateOrderStatus(orderId, { status })
    },
    {
      onSuccess: () => {
        toast.success('Order status updated successfully')
        queryClient.invalidateQueries('supplier-orders')
      },
      onError: (error) => {
        console.error('Status update error:', error)
        toast.error(error.response?.data?.message || 'Failed to update order status')
      }
    }
  )

  const handleStatusUpdate = (orderId, newStatus) => {
    updateStatusMutation.mutate({ orderId, status: newStatus })
  }

  // Enhanced currency formatting with fallback
  const formatCurrency = (amount) => {
    if (!amount || amount === null || amount === undefined || isNaN(amount)) {
      return '₹0'
    }
    
    const numAmount = Number(amount)
    if (isNaN(numAmount)) {
      return '₹0'
    }
    
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(numAmount)
  }

  // Enhanced date formatting
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown Date'
    
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      console.error('Date formatting error:', error)
      return 'Invalid Date'
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'pending',
      'confirmed': 'confirmed',
      'preparing': 'preparing',
      'processing': 'processing',
      'dispatched': 'dispatched',
      'delivered': 'delivered',
      'cancelled': 'cancelled'
    }
    return colors[status] || 'pending'
  }

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filters change
    }))
  }

  // Handle page change
  const handlePageChange = (newPage) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }))
  }

  // Get order amount with fallback
  const getOrderAmount = (order) => {
    return order.pricing?.totalAmount || 
           order.totalAmount || 
           order.amount || 
           0
  }

  // Get order items count with fallback
  const getItemsCount = (order) => {
    return order.items?.length || 0
  }

  // Check user permissions
  if (!user) {
    return (
      <div className="supplier-orders-page">
        <div className="container">
          <div className="access-denied">
            <h2>Authentication Required</h2>
            <p>Please log in to access this page</p>
          </div>
        </div>
      </div>
    )
  }

  if (user.role !== 'supplier') {
    return (
      <div className="supplier-orders-page">
        <div className="container">
          <div className="access-denied">
            <h2>Access Denied</h2>
            <p>Only suppliers can access this page</p>
            <div className="debug-info">
              <p><strong>Your role:</strong> {user.role}</p>
              <p><strong>User ID:</strong> {user.id || user._id}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="supplier-orders-page">
        <div className="container">
          <div className="loading-container">
            <LoadingSpinner size="large" text="Loading orders..." />
            <p>Fetching your order data...</p>
          </div>
        </div>
      </div>
    )
  }

  // Handle error state
  if (error && !ordersData) {
    return (
      <div className="supplier-orders-page">
        <div className="container">
          <div className="error-container">
            <h2>Unable to Load Orders</h2>
            <p>{error?.response?.data?.message || error.message}</p>
            
            <div className="error-actions">
              <button onClick={() => refetch()} className="retry-btn">
                Try Again
              </button>
              <button 
                onClick={() => window.location.reload()} 
                className="reload-btn"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Extract data with comprehensive fallbacks
  const orders = ordersData?.data?.orders || []
  const stats = ordersData?.data?.stats || {
    total: 0,
    pending: 0,
    confirmed: 0,
    preparing: 0,
    processing: 0,
    dispatched: 0,
    delivered: 0,
    cancelled: 0
  }
  const pagination = ordersData?.data?.pagination || {}

  console.log('Rendered data:', { orders, stats, pagination })

  return (
    <div className="supplier-orders-page">
      <div className="container">
        {/* Page Header */}
        <div className="orders-header">
          <div className="header-content">
            <h1>Orders Management</h1>
            <p>Manage and track all your customer orders</p>
          </div>
          
          {/* Debug info for development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="debug-info-header">
              <small>
                User: {user.name} ({user.role}) | 
                Orders: {orders.length} | 
                Total Stats: {stats.total}
              </small>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="orders-filters">
          <div className="filter-group">
            <label htmlFor="status-filter">Filter by Status:</label>
            <select
              id="status-filter"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="filter-select"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="preparing">Preparing</option>
              <option value="processing">Processing</option>
              <option value="dispatched">Dispatched</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label htmlFor="limit-filter">Items per page:</label>
            <select
              id="limit-filter"
              value={filters.limit}
              onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
              className="filter-select"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>

          <button onClick={() => refetch()} className="refresh-btn">
            🔄 Refresh
          </button>
        </div>

        {/* Order Stats */}
        <div className="order-stats">
          <div className="stat-card">
            <div className="stat-value">{stats.total || 0}</div>
            <div className="stat-label">Total Orders</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.pending || 0}</div>
            <div className="stat-label">Pending</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{(stats.preparing || 0) + (stats.processing || 0)}</div>
            <div className="stat-label">Processing</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.delivered || 0}</div>
            <div className="stat-label">Delivered</div>
          </div>
        </div>

        {/* Orders List */}
        <div className="orders-content">
          {orders.length === 0 ? (
            <div className="no-orders">
              <div className="no-orders-icon">📦</div>
              <h3>No Orders Found</h3>
              <p>
                {filters.status 
                  ? `No orders found with status "${filters.status}"`
                  : 'You don\'t have any orders yet.'
                }
              </p>
              {filters.status && (
                <button 
                  onClick={() => handleFilterChange('status', '')}
                  className="clear-filters-btn"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="orders-list">
                {orders.map((order) => {
                  console.log('Rendering order:', order)
                  
                  return (
                    <div key={order._id} className="order-card">
                      <div className="order-header">
                        <div className="order-id">
                          Order #{order.orderId || order._id?.slice(-6)?.toUpperCase() || 'Unknown'}
                        </div>
                        <div className="order-date">
                          {formatDate(order.createdAt)}
                        </div>
                      </div>

                      <div className="order-details">
                        <div className="customer-info">
                          <strong>{order.customer?.name || 'Unknown Customer'}</strong>
                          <div className="customer-contact">
                            {order.customer?.email && (
                              <div className="customer-email">{order.customer.email}</div>
                            )}
                            {order.customer?.phoneNumber && (
                              <div className="customer-phone">{order.customer.phoneNumber}</div>
                            )}
                          </div>
                        </div>

                        <div className="order-items">
                          <div className="items-count">
                            {getItemsCount(order)} items
                          </div>
                          <div className="order-amount">
                            {formatCurrency(getOrderAmount(order))}
                          </div>
                        </div>

                        <div className="order-status-section">
                          <div className={`status-badge ${getStatusColor(order.status)}`}>
                            {order.status || 'pending'}
                          </div>
                          
                          <select
                            value={order.status || 'pending'}
                            onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                            className="status-select"
                            disabled={updateStatusMutation.isLoading}
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="preparing">Preparing</option>
                            <option value="processing">Processing</option>
                            <option value="dispatched">Dispatched</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>
                      </div>

                      {/* Order Items Details */}
                      {order.items && order.items.length > 0 && (
                        <div className="order-items-details">
                          <h4>Order Items:</h4>
                          {order.items.map((item, index) => (
                            <div key={index} className="order-item">
                              <span className="item-name">
                                {item.productSnapshot?.name || 
                                 item.product?.name || 
                                 'Unknown Product'}
                              </span>
                              <span className="item-quantity">
                                Qty: {item.quantity || 0}
                              </span>
                              <span className="item-price">
                                {formatCurrency(item.totalPrice || (item.unitPrice * item.quantity) || 0)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Debug Info for Development */}
                      {process.env.NODE_ENV === 'development' && (
                        <div className="order-debug" style={{ 
                          marginTop: '10px', 
                          padding: '10px', 
                          backgroundColor: '#f8f9fa', 
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                          fontFamily: 'monospace'
                        }}>
                          <strong>Debug Info:</strong>
                          <div>Order ID: {order._id}</div>
                          <div>Pricing: {JSON.stringify(order.pricing)}</div>
                          <div>Total Amount: {order.totalAmount}</div>
                          <div>Items Count: {order.items?.length}</div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="pagination">
                  <button
                    onClick={() => handlePageChange(filters.page - 1)}
                    disabled={filters.page <= 1}
                    className="pagination-btn"
                  >
                    Previous
                  </button>
                  
                  <span className="pagination-info">
                    Page {filters.page} of {pagination.totalPages} 
                    ({pagination.totalItems} total orders)
                  </span>
                  
                  <button
                    onClick={() => handlePageChange(filters.page + 1)}
                    disabled={filters.page >= pagination.totalPages}
                    className="pagination-btn"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default SupplierOrdersPage