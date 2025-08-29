/* 
FILE: c:\Users\KIIT0001\Desktop\builder_website using mern\front-end\app\src\components\admin\OrderManagement.jsx
LINES: 1-450
PURPOSE: Component for admin to manage all platform orders - FIXED VERSION
*/

import React, { useState, useMemo } from 'react'
import { useMutation, useQueryClient } from 'react-query'
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  RefreshCw,
  Calendar,
  DollarSign,
  Package,
  User,
  MapPin,
  Clock,
  Truck,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { adminAPI } from '../../services/api'
import toast from 'react-hot-toast'
import './OrderManagement.css'

const OrderManagement = ({ 
  orders = [], 
  pagination = {}, 
  filters = {}, 
  onFilterChange, 
  onPageChange, 
  onOrderAction, 
  onRefresh,
  loading = false 
}) => {
  const [searchTerm, setSearchTerm] = useState(filters.search || '')
  const [filterStatus, setFilterStatus] = useState(filters.status || 'all')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [actionLoading, setActionLoading] = useState({})
  const queryClient = useQueryClient()

  // Update order status mutation
  const updateOrderMutation = useMutation(
    ({ orderId, status, notes }) => adminAPI.updateOrderStatus(orderId, status, notes),
    {
      onSuccess: () => {
        toast.success('Order status updated successfully!')
        queryClient.invalidateQueries('admin-orders')
        if (onRefresh) onRefresh()
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update order')
      }
    }
  )

  // Filtered orders based on search
  const filteredOrders = useMemo(() => {
    if (!searchTerm) return orders

    return orders.filter(order => {
      const searchLower = searchTerm.toLowerCase()
      return (
        order.orderId?.toLowerCase().includes(searchLower) ||
        order.customer?.name?.toLowerCase().includes(searchLower) ||
        order.customer?.email?.toLowerCase().includes(searchLower) ||
        order.supplier?.companyName?.toLowerCase().includes(searchLower)
      )
    })
  }, [orders, searchTerm])

  const getStatusBadge = (status) => {
    const badges = {
      pending: { label: 'Pending', className: 'status-pending', icon: Clock, color: '#f59e0b' },
      confirmed: { label: 'Confirmed', className: 'status-confirmed', icon: CheckCircle, color: '#10b981' },
      processing: { label: 'Processing', className: 'status-processing', icon: Package, color: '#3b82f6' },
      shipped: { label: 'Shipped', className: 'status-shipped', icon: Truck, color: '#8b5cf6' },
      delivered: { label: 'Delivered', className: 'status-delivered', icon: CheckCircle, color: '#059669' },
      cancelled: { label: 'Cancelled', className: 'status-cancelled', icon: XCircle, color: '#ef4444' },
      refunded: { label: 'Refunded', className: 'status-refunded', icon: RefreshCw, color: '#6b7280' }
    }
    
    const badge = badges[status] || badges.pending
    const IconComponent = badge.icon
    
    return (
      <span className={`status-badge ${badge.className}`} style={{ color: badge.color }}>
        <IconComponent size={12} />
        {badge.label}
      </span>
    )
  }

  const formatCurrency = (amount) => {
    // Handle NaN and undefined values
    const numAmount = Number(amount)
    if (isNaN(numAmount) || !isFinite(numAmount)) {
      return '₹0'
    }
    
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

  const handleSearchChange = (value) => {
    setSearchTerm(value)
  }

  const handleFilterStatusChange = (status) => {
    setFilterStatus(status)
    if (onFilterChange) {
      onFilterChange({ ...filters, status })
    }
  }

  const handleViewOrder = (order) => {
    setSelectedOrder(order)
    setShowOrderModal(true)
    console.log('Viewing order:', order)
  }

  const handleConfirmOrder = async (order) => {
    if (!order || !order._id) {
      toast.error('Invalid order data')
      return
    }

    const confirmMessage = `Are you sure you want to confirm order ${order.orderId}?`
    if (!window.confirm(confirmMessage)) return

    try {
      setActionLoading(prev => ({ ...prev, [order._id]: 'confirming' }))
      
      if (onOrderAction) {
        await onOrderAction('confirm', order._id, { status: 'confirmed' })
      } else {
        // Fallback direct API call
        await updateOrderMutation.mutateAsync({
          orderId: order._id,
          status: 'confirmed',
          notes: 'Order confirmed by admin'
        })
      }
      
      toast.success(`Order ${order.orderId} confirmed successfully!`)
    } catch (error) {
      console.error('Error confirming order:', error)
      toast.error(error.message || 'Failed to confirm order')
    } finally {
      setActionLoading(prev => ({ ...prev, [order._id]: null }))
    }
  }

  const getOrderTotal = (order) => {
    // Try different possible total fields
    return order.pricing?.totalAmount || 
           order.total || 
           order.totalAmount || 
           order.pricing?.subtotal || 
           0
  }

  const getItemCount = (order) => {
    return order.items?.length || 0
  }

  const exportOrders = () => {
    toast.success('Export functionality coming soon!')
  }

  if (loading) {
    return (
      <div className="order-management">
        <div className="order-management-header">
          <h3>Order Management</h3>
        </div>
        <div className="loading-orders">
          <div className="loading-spinner"></div>
          <p>Loading orders...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="order-management">
      <div className="order-management-header">
        <h3>Order Management</h3>
        <div className="header-actions">
          <button className="btn btn-outline" onClick={exportOrders}>
            <Download size={16} />
            Export
          </button>
          {onRefresh && (
            <button className="btn btn-outline" onClick={onRefresh}>
              <RefreshCw size={16} />
              Refresh
            </button>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="order-controls">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search by order ID, customer name, or email..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
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
            <select 
              value={filterStatus} 
              onChange={(e) => handleFilterStatusChange(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>
      )}

      {/* Orders Table */}
      <div className="orders-table-container">
        <table className="orders-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Status</th>
              <th>Total</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length > 0 ? filteredOrders.map((order) => (
              <tr key={order._id}>
                <td>
                  <div className="order-info">
                    <div className="order-number">#{order.orderId || 'N/A'}</div>
                    <div className="order-items">
                      {getItemCount(order)} items
                    </div>
                  </div>
                </td>
                <td>
                  <div className="customer-info">
                    <div className="customer-name">
                      {order.customer?.name || 'Unknown Customer'}
                    </div>
                    <div className="customer-email">
                      {order.customer?.email || 'No email'}
                    </div>
                    {order.deliveryAddress && (
                      <div className="customer-location">
                        <MapPin size={12} />
                        {order.deliveryAddress.city}, {order.deliveryAddress.state}
                      </div>
                    )}
                  </div>
                </td>
                <td>{getStatusBadge(order.status)}</td>
                <td>
                  <div className="order-total">
                    <div className="total-amount">
                      {formatCurrency(getOrderTotal(order))}
                    </div>
                    <div className="payment-method">
                      {order.paymentMethod || 'N/A'}
                    </div>
                  </div>
                </td>
                <td>
                  <div className="order-date">
                    <Calendar size={14} />
                    <span>{formatDate(order.createdAt)}</span>
                  </div>
                </td>
                <td>
                  <div className="order-actions">
                    <button 
                      className="btn btn-outline btn-sm"
                      onClick={() => handleViewOrder(order)}
                      disabled={actionLoading[order._id]}
                    >
                      <Eye size={14} />
                      {actionLoading[order._id] === 'viewing' ? 'Loading...' : 'VIEW'}
                    </button>
                    
                    {order.status === 'pending' && (
                      <button 
                        className="btn btn-success btn-sm"
                        onClick={() => handleConfirmOrder(order)}
                        disabled={actionLoading[order._id] || updateOrderMutation.isLoading}
                      >
                        {actionLoading[order._id] === 'confirming' ? (
                          <>
                            <RefreshCw size={14} className="animate-spin" />
                            Confirming...
                          </>
                        ) : (
                          <>
                            <CheckCircle size={14} />
                            CONFIRM
                          </>
                        )}
                      </button>
                    )}
                    
                    {order.status === 'confirmed' && (
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={() => {
                          if (onOrderAction) {
                            onOrderAction('process', order._id, { status: 'processing' })
                          }
                        }}
                        disabled={actionLoading[order._id]}
                      >
                        <Package size={14} />
                        Process
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="6" className="no-data-cell">
                  <div className="no-orders">
                    <div className="no-orders-icon">📦</div>
                    <h4>No orders found</h4>
                    <p>
                      {searchTerm 
                        ? 'Try adjusting your search criteria.' 
                        : 'No orders available at the moment.'}
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>


      {/* Mobile Orders View */}
      <div className="orders-mobile">
        {filteredOrders && filteredOrders.length > 0 ? filteredOrders.map((order) => (
          <div key={order._id} className="order-card">
            <div className="order-card-header">
              <div className="order-card-left">
                <div className="order-number">#{(order.orderId || order._id).slice(-8).toUpperCase()}</div>
                <div className="order-date">
                  <Calendar size={14} />
                  {formatDate(order.createdAt)}
                </div>
              </div>
              <div className="order-card-right">
                {getStatusBadge(order.status)}
              </div>
            </div>

            <div className="order-card-body">
              <div className="customer-section">
                <h4>
                  <User size={16} />
                  Customer
                </h4>
                <div className="customer-name">{order.customer?.name || 'Unknown Customer'}</div>
                <div className="customer-email">{order.customer?.email || 'No email'}</div>
                {order.deliveryAddress && (
                  <div className="customer-location">
                    <MapPin size={12} />
                    {order.deliveryAddress.city}, {order.deliveryAddress.state}
                  </div>
                )}
              </div>

              <div className="order-section">
                <h4>
                  <Package size={16} />
                  Order Details
                </h4>
                <div className="order-meta">
                  <div className="order-items">{getItemCount(order)} items</div>
                  <div className="payment-method">{order.paymentMethod || 'N/A'}</div>
                </div>
              </div>

              <div className="total-section">
                <h4>
                  <DollarSign size={16} />
                  Total Amount
                </h4>
                <div className="total-amount">{formatCurrency(getOrderTotal(order))}</div>
              </div>
            </div>

            <div className="order-card-footer">
              <button 
                className="btn btn-outline btn-sm"
                onClick={() => handleViewOrder(order)}
                disabled={actionLoading[order._id]}
              >
                <Eye size={14} />
                {actionLoading[order._id] === 'viewing' ? 'Loading...' : 'VIEW'}
              </button>
              
              {order.status === 'pending' && (
                <button 
                  className="btn btn-success btn-sm"
                  onClick={() => handleConfirmOrder(order)}
                  disabled={actionLoading[order._id] || updateOrderMutation.isLoading}
                >
                  {actionLoading[order._id] === 'confirming' ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      Confirming...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={14} />
                      CONFIRM
                    </>
                  )}
                </button>
              )}
              
              {order.status === 'confirmed' && (
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    if (onOrderAction) {
                      onOrderAction('process', order._id, { status: 'processing' })
                    }
                  }}
                  disabled={actionLoading[order._id]}
                >
                  <Package size={14} />
                  Process
                </button>
              )}
            </div>
          </div>
        )) : (
          <div className="no-orders">
            <div className="no-orders-icon">📦</div>
            <h4>No orders found</h4>
            <p>
              {searchTerm 
                ? 'Try adjusting your search criteria.' 
                : 'No orders available at the moment.'}
            </p>
          </div>
        )}
      </div>
      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="pagination">
          <button 
            className="btn btn-outline"
            onClick={() => onPageChange && onPageChange(pagination.currentPage - 1)}
            disabled={pagination.currentPage <= 1}
          >
            Previous
          </button>
          
          <span className="pagination-info">
            Page {pagination.currentPage} of {pagination.totalPages}
            ({pagination.totalItems} total orders)
          </span>
          
          <button 
            className="btn btn-outline"
            onClick={() => onPageChange && onPageChange(pagination.currentPage + 1)}
            disabled={pagination.currentPage >= pagination.totalPages}
          >
            Next
          </button>
        </div>
      )}

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
              <div className="order-details-grid">
                <div className="detail-section">
                  <h4>Customer Information</h4>
                  <p><strong>Name:</strong> {selectedOrder.customer?.name}</p>
                  <p><strong>Email:</strong> {selectedOrder.customer?.email}</p>
                  <p><strong>Phone:</strong> {selectedOrder.customer?.phoneNumber}</p>
                </div>
                
                <div className="detail-section">
                  <h4>Order Information</h4>
                  <p><strong>Status:</strong> {getStatusBadge(selectedOrder.status)}</p>
                  <p><strong>Total:</strong> {formatCurrency(getOrderTotal(selectedOrder))}</p>
                  <p><strong>Date:</strong> {formatDate(selectedOrder.createdAt)}</p>
                </div>
                
                <div className="detail-section">
                  <h4>Items ({getItemCount(selectedOrder)})</h4>
                  {selectedOrder.items?.map((item, index) => (
                    <div key={index} className="order-item">
                      <p><strong>{item.productSnapshot?.name || 'Product'}</strong></p>
                      <p>Quantity: {item.quantity} | Price: {formatCurrency(item.totalPrice)}</p>
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

export default OrderManagement