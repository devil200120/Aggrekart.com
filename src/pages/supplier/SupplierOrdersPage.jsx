import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { supplierAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { toast } from 'react-hot-toast'
import { 
  Clock, 
  CheckCircle, 
  Package, 
  Truck, 
  Star,
  Phone,
  Mail,
  MapPin,
  Eye,
  Filter,
  Search,
  RefreshCw,
  TrendingUp,
  Calendar
} from 'lucide-react'
import './SupplierOrdersPage.css'

const SupplierOrdersPage = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState({
    status: '',
    page: 1,
    limit: 10,
    search: ''
  })
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showOrderModal, setShowOrderModal] = useState(false)

  console.log('SupplierOrdersPage - Current user:', user)

  // Fetch orders
  const { data: ordersData, isLoading, error, refetch } = useQuery(
    ['supplier-orders', user?.id, filters],
    async () => {
      const cleanFilters = {}
      if (filters.status && filters.status !== '') cleanFilters.status = filters.status
      if (filters.page) cleanFilters.page = filters.page
      if (filters.limit) cleanFilters.limit = filters.limit
      if (filters.search && filters.search !== '') cleanFilters.search = filters.search
      
      const response = await supplierAPI.getOrders(cleanFilters)
      return response
    },
    {
      enabled: !!user && user.role === 'supplier',
      keepPreviousData: true,
      onError: (error) => {
        const errorMessage = error?.response?.data?.message || error.message
        toast.error(`Failed to load orders: ${errorMessage}`)
      }
    }
  )

  // Update order status mutation
  const updateStatusMutation = useMutation(
    ({ orderId, status }) => {
      return supplierAPI.updateOrderStatus(orderId, { status })
    },
    {
      onSuccess: (data) => {
        toast.success(`Order status updated successfully!`)
        queryClient.invalidateQueries('supplier-orders')
      },
      onError: (error) => {
        const errorMessage = error?.response?.data?.message || 'Failed to update order status'
        toast.error(errorMessage)
      }
    }
  )

  // Helper functions
  const formatCurrency = (amount) => {
    const numAmount = Number(amount)
    if (isNaN(numAmount)) return '₹0'
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numAmount)
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      return 'Invalid Date'
    }
  }

  const getStatusInfo = (status) => {
    const statusMap = {
      pending: { 
        label: 'Pending', 
        color: '#FF6B35', 
        bgColor: '#FFF3F0',
        icon: Clock,
        action: 'Confirm Order'
      },
      confirmed: { 
        label: 'Confirmed', 
        color: '#2E8B57', 
        bgColor: '#F0FFF4',
        icon: CheckCircle,
        action: 'Start Preparing'
      },
      preparing: { 
        label: 'Preparing', 
        color: '#4169E1', 
        bgColor: '#F0F4FF',
        icon: Package,
        action: 'Mark Processing'
      },
      processing: { 
        label: 'Processing', 
        color: '#8A2BE2', 
        bgColor: '#F8F0FF',
        icon: Package,
        action: 'Mark Dispatched'
      },
      dispatched: { 
        label: 'Dispatched', 
        color: '#FF8C00', 
        bgColor: '#FFF8F0',
        icon: Truck,
        action: 'Mark Delivered'
      },
      delivered: { 
        label: 'Delivered', 
        color: '#32CD32', 
        bgColor: '#F0FFF0',
        icon: CheckCircle,
        action: null
      },
      cancelled: { 
        label: 'Cancelled', 
        color: '#DC143C', 
        bgColor: '#FFF0F0',
        icon: Clock,
        action: null
      }
    }
    return statusMap[status] || statusMap.pending
  }

  const getNextStatus = (currentStatus) => {
    const statusFlow = {
      'pending': 'confirmed',
      'confirmed': 'preparing',
      'preparing': 'processing',
      'processing': 'dispatched',
      'dispatched': 'delivered'
    }
    return statusFlow[currentStatus]
  }

  const handleStatusUpdate = (orderId, newStatus) => {
    updateStatusMutation.mutate({ orderId, status: newStatus })
  }

  // ...existing code...
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      // Only reset to first page when filtering by non-page criteria
      ...(key !== 'page' && { page: 1 })
    }))
  }
// ...existing code...

  const handleViewOrder = (order) => {
    setSelectedOrder(order)
    setShowOrderModal(true)
  }

  // Extract data
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

  if (!user || user.role !== 'supplier') {
    return (
      <div className="supplier-orders-page">
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
      <div className="supplier-orders-page">
        <div className="container">
          <LoadingSpinner size="large" text="Loading orders..." />
        </div>
      </div>
    )
  }

  return (
    <div className="supplier-orders-page">
      {/* Header */}
      <div className="page-header">
        <div className="container">
          <div className="header-content">
            <div className="header-title">
              <h1>Order Management</h1>
              <p>Manage and track all your customer orders</p>
            </div>
            <div className="header-actions">
              <button onClick={() => refetch()} className="refresh-btn">
                <RefreshCw size={20} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="container">
        <div className="stats-grid">
          <div className="stat-card total">
            <div className="stat-icon">
              <TrendingUp size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.total || 0}</div>
              <div className="stat-label">Total Orders</div>
            </div>
          </div>
          
          <div className="stat-card pending">
            <div className="stat-icon">
              <Clock size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.pending || 0}</div>
              <div className="stat-label">Pending</div>
            </div>
          </div>
          
          <div className="stat-card processing">
            <div className="stat-icon">
              <Package size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{(stats.confirmed || 0) + (stats.preparing || 0) + (stats.processing || 0)}</div>
              <div className="stat-label">Processing</div>
            </div>
          </div>
          
          <div className="stat-card delivered">
            <div className="stat-icon">
              <CheckCircle size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.delivered || 0}</div>
              <div className="stat-label">Delivered</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <div className="search-filter">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search orders by ID, customer name..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="status-filter">
            <Filter size={20} />
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="status-select"
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
        </div>

        {/* Orders List */}
        <div className="orders-container">
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
            </div>
          ) : (
            <div className="orders-grid">
              {orders.map((order) => {
                const statusInfo = getStatusInfo(order.status)
                const nextStatus = getNextStatus(order.status)
                const StatusIcon = statusInfo.icon
                
                return (
                  <div key={order._id} className="order-card" style={{ borderLeft: `4px solid ${statusInfo.color}` }}>
                    {/* Order Header */}
                    <div className="order-header">
                      <div className="order-id">
                        <span className="order-number">#{order.orderId || order._id?.slice(-6)?.toUpperCase()}</span>
                        <span className="order-date">
                          <Calendar size={14} />
                          {formatDate(order.createdAt)}
                        </span>
                      </div>
                      <div className="order-status" style={{ 
                        color: statusInfo.color, 
                        backgroundColor: statusInfo.bgColor 
                      }}>
                        <StatusIcon size={16} />
                        {statusInfo.label}
                      </div>
                    </div>

                    {/* Customer Info */}
                    <div className="customer-section">
                      <div className="customer-info">
                        <div className="customer-name">
                          {order.customer?.name || 'Unknown Customer'}
                        </div>
                        <div className="customer-details">
                          {order.customer?.email && (
                            <div className="customer-contact">
                              <Mail size={14} />
                              {order.customer.email}
                            </div>
                          )}
                          {order.customer?.phoneNumber && (
                            <div className="customer-contact">
                              <Phone size={14} />
                              {order.customer.phoneNumber}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Order Summary */}
                    <div className="order-summary">
                      <div className="order-items">
                        <span className="items-count">
                          {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}
                        </span>
                        <span className="order-amount">
                          {formatCurrency(order.pricing?.totalAmount || order.totalAmount || 0)}
                        </span>
                      </div>
                    </div>

                    {/* Order Items Preview */}
                    {order.items && order.items.length > 0 && (
                      <div className="items-preview">
                        {order.items.slice(0, 2).map((item, index) => (
                          <div key={index} className="item-preview">
                            <span className="item-name">
                              {item.productSnapshot?.name || item.product?.name || 'Unknown Product'}
                            </span>
                            <span className="item-qty">
                              Qty: {item.quantity || 0}
                            </span>
                          </div>
                        ))}
                        {order.items.length > 2 && (
                          <div className="more-items">
                            +{order.items.length - 2} more items
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="order-actions">
                      <button 
                        onClick={() => handleViewOrder(order)}
                        className="btn-view"
                      >
                        <Eye size={16} />
                        View Details
                      </button>
                      
                      {nextStatus && statusInfo.action && (
                        <button 
                          onClick={() => handleStatusUpdate(order._id, nextStatus)}
                          disabled={updateStatusMutation.isLoading}
                          className="btn-action"
                          style={{ backgroundColor: statusInfo.color }}
                        >
                          {updateStatusMutation.isLoading ? (
                            <>
                              <RefreshCw size={16} className="spin" />
                              Updating...
                            </>
                          ) : (
                            statusInfo.action
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => handleFilterChange('page', Math.max(1, filters.page - 1))}
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
                onClick={() => handleFilterChange('page', Math.min(pagination.totalPages, filters.page + 1))}
                disabled={filters.page >= pagination.totalPages}
                className="pagination-btn"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowOrderModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Order Details - #{selectedOrder.orderId}</h3>
              <button 
                className="modal-close"
                onClick={() => setShowOrderModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="order-detail-sections">
                <div className="detail-section">
                  <h4>Customer Information</h4>
                  <p><strong>Name:</strong> {selectedOrder.customer?.name || 'N/A'}</p>
                  <p><strong>Email:</strong> {selectedOrder.customer?.email || 'N/A'}</p>
                  <p><strong>Phone:</strong> {selectedOrder.customer?.phoneNumber || 'N/A'}</p>
                </div>
                
                <div className="detail-section">
                  <h4>Order Information</h4>
                  <p><strong>Status:</strong> {getStatusInfo(selectedOrder.status).label}</p>
                  <p><strong>Total:</strong> {formatCurrency(selectedOrder.pricing?.totalAmount || 0)}</p>
                  <p><strong>Date:</strong> {formatDate(selectedOrder.createdAt)}</p>
                </div>
                
                <div className="detail-section">
                  <h4>Items ({selectedOrder.items?.length || 0})</h4>
                  {selectedOrder.items?.map((item, index) => (
                    <div key={index} className="modal-order-item">
                      <p><strong>{item.productSnapshot?.name || 'Product'}</strong></p>
                      <p>Quantity: {item.quantity} | Price: {formatCurrency(item.totalPrice || 0)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SupplierOrdersPage