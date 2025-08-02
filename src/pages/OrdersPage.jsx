import React, { useState } from 'react'
import { useQuery } from 'react-query'
import { Link } from 'react-router-dom'
import { ordersAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from '../components/common/LoadingSpinner'
import './OrdersPage.css'

const OrdersPage = () => {
  const { user } = useAuth()
  const [filters, setFilters] = useState({
    status: '',
    dateRange: '',
    sortBy: 'newest'
  })
  const [currentPage, setCurrentPage] = useState(1)

  // Fetch orders
  const { 
    data: ordersResponse, 
    isLoading, 
    error,
    refetch 
  } = useQuery(
    ['orders', filters, currentPage],
    () => {
      const apiParams = {
        page: currentPage,
        limit: 10
      }
      
      const validStatuses = ['pending', 'confirmed', 'preparing', 'processing', 'material_loading', 'dispatched', 'delivered', 'cancelled']
      if (filters.status && validStatuses.includes(filters.status)) {
        apiParams.status = filters.status
      }
      
      return ordersAPI.getOrders(apiParams)
    },
    {
      enabled: !!user,
      keepPreviousData: true,
      staleTime: 2 * 60 * 1000,
    }
  )

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
    setCurrentPage(1)
  }

  const orders = ordersResponse?.data?.orders || []
  const pagination = ordersResponse?.data?.pagination || {}

  // Enhanced price formatting
  const formatPrice = (price) => {
    const numPrice = Number(price) || 0;
    if (numPrice === 0) return '₹0';
    
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(numPrice);
  }

  // Enhanced date formatting
  const formatDate = (dateString, showTime = false) => {
    if (!dateString) return 'Date not available';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (showTime) {
        return date.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      
      if (diffDays === 1) {
        return 'Today';
      } else if (diffDays === 2) {
        return 'Yesterday';
      } else if (diffDays <= 7) {
        return `${diffDays - 1} days ago`;
      } else {
        return date.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
      }
    } catch (error) {
      return 'Invalid date';
    }
  }

  // Enhanced status configuration with progress tracking
  const getStatusInfo = (status) => {
    const statusConfig = {
      'pending': { 
        text: 'Order Placed', 
        color: '#ff9500', 
        bgColor: '#fff5e6', 
        icon: '📋',
        progress: 10,
        description: 'Your order has been placed successfully'
      },
      'confirmed': { 
        text: 'Order Confirmed', 
        color: '#34a853', 
        bgColor: '#e8f5e8', 
        icon: '✅',
        progress: 25,
        description: 'Supplier has confirmed your order'
      },
      'preparing': { 
        text: 'Preparing', 
        color: '#ff6d00', 
        bgColor: '#fff3e0', 
        icon: '👨‍🔧',
        progress: 40,
        description: 'Materials are being prepared'
      },
      'processing': { 
        text: 'Processing', 
        color: '#673ab7', 
        bgColor: '#f3e5f5', 
        icon: '⚙️',
        progress: 50,
        description: 'Order is being processed'
      },
      'material_loading': { 
        text: 'Loading', 
        color: '#2196f3', 
        bgColor: '#e3f2fd', 
        icon: '📦',
        progress: 70,
        description: 'Materials are being loaded for delivery'
      },
      'dispatched': { 
        text: 'Dispatched', 
        color: '#1976d2', 
        bgColor: '#e1f5fe', 
        icon: '🚚',
        progress: 85,
        description: 'Order is on the way'
      },
      'delivered': { 
        text: 'Delivered', 
        color: '#388e3c', 
        bgColor: '#e8f5e8', 
        icon: '✅',
        progress: 100,
        description: 'Order delivered successfully'
      },
      'cancelled': { 
        text: 'Cancelled', 
        color: '#d32f2f', 
        bgColor: '#ffebee', 
        icon: '❌',
        progress: 0,
        description: 'Order has been cancelled'
      }
    }
    return statusConfig[status] || { 
      text: status, 
      color: '#616161', 
      bgColor: '#f5f5f5', 
      icon: '❓',
      progress: 0,
      description: 'Status unknown'
    }
  }

  // Extract order totals properly
  const getOrderTotal = (order) => {
    return order.pricing?.totalAmount || 
           order.totalAmount || 
           order.finalAmount || 
           calculateItemsTotal(order.items || []);
  }

  // Calculate items total
  const calculateItemsTotal = (items) => {
    return items.reduce((sum, item) => {
      const itemTotal = item.totalPrice || (item.unitPrice * item.quantity) || 0;
      return sum + itemTotal;
    }, 0);
  }

  // Get delivery address
  const getDeliveryAddress = (order) => {
    const addr = order.deliveryAddress;
    if (!addr) return 'Address not available';
    
    return `${addr.address || ''}, ${addr.city || ''}, ${addr.state || ''} - ${addr.pincode || ''}`.replace(/^,\s*|,\s*$/, '');
  }

  // Check if order can be cancelled
  const canCancelOrder = (order) => {
    const cancelableStatuses = ['pending', 'confirmed', 'preparing'];
    return cancelableStatuses.includes(order.status) && 
           order.coolingPeriod?.isActive && 
           new Date() < new Date(order.coolingPeriod?.endTime);
  }

  // Get expected delivery date
  const getExpectedDelivery = (order) => {
    if (order.delivery?.estimatedTime) {
      return order.delivery.estimatedTime;
    }
    if (order.status === 'delivered' && order.delivery?.actualDeliveryTime) {
      return `Delivered on ${formatDate(order.delivery.actualDeliveryTime, true)}`;
    }
    // Default estimate based on status
    const daysToAdd = order.status === 'dispatched' ? 1 : 3;
    const estimatedDate = new Date();
    estimatedDate.setDate(estimatedDate.getDate() + daysToAdd);
    return `Expected by ${formatDate(estimatedDate)}`;
  }

  if (!user) {
    return (
      <div className="orders-page">
        <div className="container">
          <div className="empty-state">
            <div className="empty-illustration">
              <img src="/placeholder-login.svg" alt="Login required" className="empty-image" />
            </div>
            <h2>Please sign in to view your orders</h2>
            <p>Track your construction material orders and manage deliveries</p>
            <Link to="/auth/login" className="cta-button primary">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="orders-page">
        <div className="container">
          <div className="loading-state">
            <LoadingSpinner size="large" />
            <h3>Loading your orders...</h3>
            <p>Please wait while we fetch your order history</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="orders-page">
        <div className="container">
          <div className="error-state">
            <div className="error-illustration">
              <span className="error-icon">⚠️</span>
            </div>
            <h2>Unable to load orders</h2>
            <p>Please check your connection and try again</p>
            <button onClick={refetch} className="cta-button secondary">
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="orders-page">
      <div className="container">
        {/* Page Header */}
        <div className="page-header">
          <div className="header-content">
            <h1>Your Orders</h1>
            <p className="header-subtitle">
              {pagination.totalItems || 0} orders • Track, reorder, and manage your construction materials
            </p>
          </div>
          
          {/* Quick Summary */}
          <div className="order-summary-cards">
            <div className="summary-card">
              <div className="summary-number">{orders.filter(o => o.status === 'delivered').length}</div>
              <div className="summary-label">Delivered</div>
            </div>
            <div className="summary-card">
              <div className="summary-number">
                {orders.filter(o => ['pending', 'confirmed', 'preparing', 'processing', 'material_loading', 'dispatched'].includes(o.status)).length}
              </div>
              <div className="summary-label">In Progress</div>
            </div>
            <div className="summary-card">
              <div className="summary-number">{orders.filter(o => o.status === 'cancelled').length}</div>
              <div className="summary-label">Cancelled</div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="filter-section">
          <div className="filter-tabs">
            {[
              { key: '', label: 'All orders', icon: '📋' },
              { key: 'delivered', label: 'Delivered', icon: '✅' },
              { key: 'pending', label: 'In progress', icon: '🚚' },
              { key: 'cancelled', label: 'Cancelled', icon: '❌' }
            ].map(tab => (
              <button 
                key={tab.key}
                className={`filter-tab ${filters.status === tab.key ? 'active' : ''}`}
                onClick={() => handleFilterChange('status', tab.key)}
              >
                <span className="tab-icon">{tab.icon}</span>
                <span className="tab-label">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-illustration">
              <span className="empty-icon">📦</span>
            </div>
            <h2>No orders found</h2>
            <p>Start shopping for construction materials and your orders will appear here</p>
            <Link to="/products" className="cta-button primary">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => {
              const statusInfo = getStatusInfo(order.status);
              const orderTotal = getOrderTotal(order);
              const itemCount = order.items?.length || 0;
              const firstItem = order.items?.[0];
              const canCancel = canCancelOrder(order);

              return (
                <div key={order._id} className="order-card">
                  {/* Order Header */}
                  <div className="order-header">
                    <div className="order-meta">
                      <div className="order-id-section">
                        <h3 className="order-id">
                          Order #{(order.orderId || order._id).slice(-8).toUpperCase()}
                        </h3>
                        <span className="order-date">{formatDate(order.createdAt)}</span>
                      </div>
                      
                      <div className="order-total-section">
                        <div className="total-amount">{formatPrice(orderTotal)}</div>
                        <div className="item-count">{itemCount} item{itemCount > 1 ? 's' : ''}</div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="status-section">
                      <div 
                        className="status-badge"
                        style={{ 
                          backgroundColor: statusInfo.bgColor,
                          color: statusInfo.color,
                          border: `1px solid ${statusInfo.color}20`
                        }}
                      >
                        <span className="status-icon">{statusInfo.icon}</span>
                        <span className="status-text">{statusInfo.text}</span>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="progress-bar-container">
                        <div 
                          className="progress-bar"
                          style={{ 
                            width: `${statusInfo.progress}%`,
                            backgroundColor: statusInfo.color
                          }}
                        ></div>
                      </div>
                      
                      <div className="status-description">{statusInfo.description}</div>
                    </div>
                  </div>

                  {/* Order Content */}
                  <div className="order-content">
                    {/* Main Item Display */}
                    {firstItem && (
                      <div className="main-item">
                        <div className="item-image-placeholder">
                          {firstItem.productSnapshot?.imageUrl ? (
                            <img 
                              src={firstItem.productSnapshot.imageUrl} 
                              alt={firstItem.productSnapshot.name}
                              className="item-image"
                            />
                          ) : (
                            <div className="placeholder-icon">🏗️</div>
                          )}
                        </div>
                        
                        <div className="item-info">
                          <h4 className="item-title">
                            {firstItem.productSnapshot?.name || firstItem.product?.name || 'Construction Material'}
                          </h4>
                          <div className="item-details">
                            <span className="item-quantity">Qty: {firstItem.quantity}</span>
                            <span className="item-separator">•</span>
                            <span className="item-price">₹{firstItem.unitPrice}/unit</span>
                            {firstItem.productSnapshot?.brand && (
                              <>
                                <span className="item-separator">•</span>
                                <span className="item-brand">{firstItem.productSnapshot.brand}</span>
                              </>
                            )}
                          </div>
                          
                          {itemCount > 1 && (
                            <div className="additional-items">
                              +{itemCount - 1} more item{itemCount > 2 ? 's' : ''}
                            </div>
                          )}
                        </div>
                        
                        <div className="item-total">
                          {formatPrice(firstItem.totalPrice || (firstItem.unitPrice * firstItem.quantity))}
                        </div>
                      </div>
                    )}

                    {/* Order Details Grid */}
                    <div className="order-details-grid">
                      {/* Supplier Info */}
                      <div className="detail-section">
                        <div className="detail-label">Supplier</div>
                        <div className="detail-value">
                          {order.supplier?.businessName || order.supplier?.name || 'Aggrekart Supplier'}
                        </div>
                      </div>

                      {/* Delivery Address */}
                      <div className="detail-section">
                        <div className="detail-label">Delivery Address</div>
                        <div className="detail-value address">
                          {getDeliveryAddress(order)}
                        </div>
                      </div>

                      {/* Payment Method */}
                      <div className="detail-section">
                        <div className="detail-label">Payment</div>
                        <div className="detail-value payment">
                          <span className="payment-method">
                            {order.payment?.method?.toUpperCase() || 'COD'}
                          </span>
                          <span 
                            className={`payment-status ${order.payment?.status || 'pending'}`}
                          >
                            {order.payment?.status === 'paid' ? 'Paid' : 'Pending'}
                          </span>
                        </div>
                      </div>

                      {/* Expected Delivery */}
                      <div className="detail-section">
                        <div className="detail-label">Delivery</div>
                        <div className="detail-value">
                          {getExpectedDelivery(order)}
                        </div>
                      </div>
                    </div>

                    {/* Pricing Breakdown */}
                    {(order.pricing?.transportCost > 0 || order.pricing?.gstAmount > 0) && (
                      <div className="pricing-breakdown">
                        <div className="pricing-header">Bill Details</div>
                        <div className="pricing-rows">
                          <div className="pricing-row">
                            <span>Item total</span>
                            <span>{formatPrice(calculateItemsTotal(order.items))}</span>
                          </div>
                          
                          {order.pricing?.transportCost > 0 && (
                            <div className="pricing-row">
                              <span>Delivery charges</span>
                              <span>{formatPrice(order.pricing.transportCost)}</span>
                            </div>
                          )}
                          
                          {order.pricing?.gstAmount > 0 && (
                            <div className="pricing-row">
                              <span>Taxes & fees</span>
                              <span>{formatPrice(order.pricing.gstAmount)}</span>
                            </div>
                          )}
                          
                          <div className="pricing-row total">
                            <span>Total amount</span>
                            <span>{formatPrice(orderTotal)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Order Actions */}
                  <div className="order-actions">
                    <div className="primary-actions">
                      <Link 
                        to={`/orders/${order._id}`}
                        className="action-button secondary"
                      >
                        View details
                      </Link>
                      
                      {order.status === 'delivered' && (
                        <button className="action-button primary">
                          Buy again
                        </button>
                      )}
                      
                      {['dispatched', 'material_loading', 'processing'].includes(order.status) && (
                        <Link 
                          to={`/orders/${order._id}/track`}
                          className="action-button primary"
                        >
                          Track order
                        </Link>
                      )}
                    </div>

                    <div className="secondary-actions">
                      {canCancel && (
                        <button className="action-button danger">
                          Cancel order
                        </button>
                      )}
                      
                      {order.status === 'delivered' && !order.customerRating?.rating && (
                        <button className="action-button outline">
                          Rate order
                        </button>
                      )}
                      
                      {order.invoice?.invoiceNumber && (
                        <button className="action-button outline">
                          Download invoice
                        </button>
                      )}
                      
                      <button className="action-button outline">
                        Get help
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="pagination-section">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="pagination-button"
            >
              ← Previous
            </button>
            
            <div className="pagination-info">
              <span className="current-page">{currentPage}</span>
              <span className="page-separator">of</span>
              <span className="total-pages">{pagination.totalPages}</span>
            </div>
            
            <button 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
              disabled={currentPage === pagination.totalPages}
              className="pagination-button"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default OrdersPage