import React, { useState, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { ordersAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import LoadingSpinner from '../components/common/LoadingSpinner'
import CoolingPeriodManager from '../components/orders/CoolingPeriodManager'
import ImageWithFallback from '../components/common/ImageWithFallback'
import './OrderDetailPage.css'
import '../components/common/ImageWithFallback.css'

const OrderDetailPage = () => {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [showTrackingModal, setShowTrackingModal] = useState(false)
  const coolingCompleteShown = useRef(false) // PREVENT REPEATED NOTIFICATIONS

  // Fetch order details - REDUCED REFRESH RATE TO PREVENT SPAM
  const { data: orderData, isLoading, error } = useQuery(
    ['order', orderId],
    () => ordersAPI.getOrder(orderId),
    {
      enabled: !!orderId,
      refetchInterval: 120000, // CHANGED: Refresh every 2 minutes instead of 30 seconds
      refetchIntervalInBackground: false, // ADDED: Don't refetch when tab is not active
      staleTime: 60000, // ADDED: Consider data fresh for 1 minute
      cacheTime: 300000, // ADDED: Keep in cache for 5 minutes
      onError: (error) => {
        if (error?.response?.status === 404) {
          toast.error('Order not found')
          navigate('/orders')
        }
      }
    }
  )

  // Track order mutation
  const trackOrderMutation = useMutation(
    () => ordersAPI.trackOrder(orderId),
    {
      onSuccess: (response) => {
        toast.success('Tracking information updated!')
        queryClient.invalidateQueries(['order', orderId])
      },
      onError: (error) => {
        toast.error(error?.response?.data?.message || 'Failed to get tracking info')
      }
    }
  )

  // Cancel order mutation
  const cancelOrderMutation = useMutation(
    (data) => ordersAPI.cancelOrder(orderId, data),
    {
      onSuccess: () => {
        toast.success('Order cancelled successfully!')
        queryClient.invalidateQueries(['order', orderId])
        queryClient.invalidateQueries('orders')
      },
      onError: (error) => {
        toast.error(error?.response?.data?.message || 'Failed to cancel order')
      }
    }
  )

  const order = orderData?.data?.order

  const getStatusInfo = (status) => {
    const statusConfig = {
      'pending': { 
        icon: '⏳', 
        color: '#ffc107', 
        text: 'Pending Confirmation',
        description: 'Your order is waiting for supplier confirmation'
      },
      'confirmed': { 
        icon: '✓', 
        color: '#28a745', 
        text: 'Confirmed',
        description: 'Your order has been confirmed'
      },
      'preparing': { 
        icon: '📋', 
        color: '#17a2b8', 
        text: 'Preparing',
        description: 'Supplier is preparing your order'
      },
      'processing': { 
        icon: '🔄', 
        color: '#007bff', 
        text: 'Processing',
        description: 'Your order is being processed'
      },
      'dispatched': { 
        icon: '🚚', 
        color: '#fd7e14', 
        text: 'Dispatched',
        description: 'Your order is on the way'
      },
      'delivered': { 
        icon: '✅', 
        color: '#28a745', 
        text: 'Delivered',
        description: 'Order has been delivered successfully'
      },
      'cancelled': { 
        icon: '❌', 
        color: '#dc3545', 
        text: 'Cancelled',
        description: 'This order has been cancelled'
      }
    }
    return statusConfig[status] || statusConfig['pending']
  }

  const getPaymentStatusInfo = (status) => {
    const paymentConfig = {
      'pending': { icon: '⏳', color: '#ffc107', text: 'Payment Pending' },
      'paid': { icon: '✅', color: '#28a745', text: 'Payment Completed' },
      'failed': { icon: '❌', color: '#dc3545', text: 'Payment Failed' },
      'refunded': { icon: '↩️', color: '#6c757d', text: 'Refunded' },
      'partial_refund': { icon: '🔄', color: '#17a2b8', text: 'Partial Refund' }
    }
    return paymentConfig[status] || paymentConfig['pending']
  }

  const formatPrice = (price) => {
    if (!price || isNaN(price)) return '₹0'
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price)
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Date not available'
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      return 'Invalid date'
    }
  }

  const handleDownloadInvoice = () => {
    toast.success('Invoice download will be available soon!')
  }

  const handleContactSupplier = () => {
    toast.success('Supplier contact feature coming soon!')
  }

  const handleTrackOrder = () => {
    trackOrderMutation.mutate()
  }

  // FIXED: Prevent repeated cooling complete notifications
  const handleCoolingComplete = () => {
    if (!coolingCompleteShown.current) {
      toast.success('Order confirmed! Processing will begin soon.')
      coolingCompleteShown.current = true
      queryClient.invalidateQueries(['order', orderId])
    }
  }

  // Reset notification flag when order status changes
  React.useEffect(() => {
    if (order?.status !== 'pending' && order?.status !== 'preparing') {
      coolingCompleteShown.current = false
    }
  }, [order?.status])

  if (!user) {
    return (
      <div className="order-detail-page">
        <div className="container">
          <div className="order-error">
            <h2>Access Denied</h2>
            <p>Please login to view order details</p>
            <Link to="/auth/login" className="btn btn-primary">Login</Link>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="order-detail-page">
        <div className="container">
          <LoadingSpinner size="large" text="Loading order details..." />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="order-detail-page">
        <div className="container">
          <div className="order-error">
            <h2>Something went wrong</h2>
            <p>Unable to load order details. Please try again.</p>
            <p className="error-details">
              {error?.response?.data?.message || error?.message || 'Unknown error occurred'}
            </p>
            <button onClick={() => window.location.reload()} className="btn btn-primary">
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="order-detail-page">
        <div className="container">
          <div className="order-error">
            <h2>Order not found</h2>
            <p>The order you're looking for doesn't exist or you don't have access to it.</p>
            <Link to="/orders" className="btn btn-primary">Back to Orders</Link>
          </div>
        </div>
      </div>
    )
  }

  const statusInfo = getStatusInfo(order.status)
  const paymentInfo = getPaymentStatusInfo(order.payment?.status)

  return (
    <div className="order-detail-page">
      <div className="container">
        {/* Header */}
        <div className="order-header">
          <div className="order-header-content">
            <div className="order-basic-info">
              <h1>Order #{order.orderId || order._id.slice(-8).toUpperCase()}</h1>
              <p className="order-date">
                Placed on {formatDate(order.createdAt)}
              </p>
            </div>
          </div>

          <div className="order-status-badge" style={{ backgroundColor: statusInfo.color }}>
            <span className="status-icon">{statusInfo.icon}</span>
            <span className="status-text">{statusInfo.text}</span>
          </div>
        </div>

        {/* Breadcrumb */}
        <nav className="breadcrumb">
          <Link to="/">Home</Link>
          <span className="breadcrumb-separator">›</span>
          <Link to="/orders">My Orders</Link>
          <span className="breadcrumb-separator">›</span>
          <span className="breadcrumb-current">Order Details</span>
        </nav>

        {/* Order Status Overview */}
        <div className="order-status-overview">
          <div className="status-main">
            <div className="status-icon-large" style={{ color: statusInfo.color }}>
              {statusInfo.icon}
            </div>
            <div className="status-details">
              <h2>{statusInfo.text}</h2>
              <p>{statusInfo.description}</p>
            </div>
          </div>

          <div className="status-timeline">
            <div className="timeline-items">
              {['pending', 'confirmed', 'processing', 'dispatched', 'delivered'].map((status, index) => {
                const orderStatusIndex = ['pending', 'confirmed', 'processing', 'dispatched', 'delivered'].indexOf(order.status)
                const isCompleted = orderStatusIndex >= index
                const isCurrent = orderStatusIndex === index
                
                return (
                  <div 
                    key={status}
                    className={`timeline-item ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}
                  >
                    <div className="timeline-dot"></div>
                    <div className="timeline-content">
                      <span className="timeline-status">
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* FIXED: Cooling Period Manager with proper callback */}
        {(['pending', 'preparing'].includes(order.status)) && (
          <CoolingPeriodManager 
            orderId={orderId}
            onCoolingComplete={handleCoolingComplete}
          />
        )}

        <div className="order-content">
          {/* Left Column */}
          <div className="order-main">
            {/* Order Items */}
            <div className="order-section">
              <h3>Order Items ({order.items?.length || 0})</h3>
              <div className="order-items">
                {order.items?.map((item, index) => {
                  const productName = item.productSnapshot?.name || item.product?.name || 'Unknown Product'
                  const productImage = item.productSnapshot?.imageUrl || item.product?.images?.[0]
                  
                  return (
                    <div key={index} className="order-item">
                      <div className="item-image">
                        <ImageWithFallback
                          src={productImage}
                          alt={productName}
                          className="product-image"
                          fallbackType="product"
                        />
                      </div>
                      
                      <div className="item-details">
                        <h4 className="item-name">{productName}</h4>
                        <p className="item-description">
                          {item.productSnapshot?.description || item.product?.description || 'No description available'}
                        </p>
                        
                        {item.specifications && (
                          <div className="item-specifications">
                            {item.specifications.selectedVariant && (
                              <span className="spec">Variant: {item.specifications.selectedVariant}</span>
                            )}
                            {item.specifications.customRequirements && (
                              <span className="spec">Custom: {item.specifications.customRequirements}</span>
                            )}
                          </div>
                        )}
                        
                        <div className="item-meta">
                          <span className="item-quantity">Qty: {item.quantity}</span>
                          <span className="item-unit-price">Unit Price: {formatPrice(item.unitPrice)}</span>
                        </div>
                      </div>
                      
                      <div className="item-total">
                        {formatPrice(item.totalPrice)}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Order Progress */}
            <div className="order-section">
              <h3>Order Progress</h3>
              <div className="progress-timeline">
                <div className="progress-item completed">
                  <div className="progress-icon">●</div>
                  <div className="progress-content">
                    <h4>Pending Confirmation</h4>
                    <p>{formatDate(order.createdAt)}</p>
                    <span className="progress-description">Order created</span>
                  </div>
                </div>
                
                {order.confirmedAt && (
                  <div className="progress-item completed">
                    <div className="progress-icon">●</div>
                    <div className="progress-content">
                      <h4>Order Confirmed</h4>
                      <p>{formatDate(order.confirmedAt)}</p>
                      <span className="progress-description">Supplier confirmed the order</span>
                    </div>
                  </div>
                )}
                
                {order.processedAt && (
                  <div className="progress-item completed">
                    <div className="progress-icon">●</div>
                    <div className="progress-content">
                      <h4>Processing</h4>
                      <p>{formatDate(order.processedAt)}</p>
                      <span className="progress-description">Order is being processed</span>
                    </div>
                  </div>
                )}
                
                {order.dispatchedAt && (
                  <div className="progress-item completed">
                    <div className="progress-icon">●</div>
                    <div className="progress-content">
                      <h4>Dispatched</h4>
                      <p>{formatDate(order.dispatchedAt)}</p>
                      <span className="progress-description">Order has been dispatched</span>
                    </div>
                  </div>
                )}
                
                {order.deliveredAt && (
                  <div className="progress-item completed">
                    <div className="progress-icon">●</div>
                    <div className="progress-content">
                      <h4>Delivered</h4>
                      <p>{formatDate(order.deliveredAt)}</p>
                      <span className="progress-description">Order delivered successfully</span>
                    </div>
                  </div>
                )}
                
                {order.cancelledAt && (
                  <div className="progress-item cancelled">
                    <div className="progress-icon">●</div>
                    <div className="progress-content">
                      <h4>Cancelled</h4>
                      <p>{formatDate(order.cancelledAt)}</p>
                      <span className="progress-description">Order was cancelled</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="order-sidebar">
            {/* Order Summary */}
            <div className="order-section">
              <h3>Order Summary</h3>
              <div className="summary-details">
                <div className="summary-row">
                  <span>Items ({order.items?.length || 0})</span>
                  <span>{formatPrice(order.subtotal || order.totalAmount)}</span>
                </div>
                
                {order.deliveryCharges > 0 && (
                  <div className="summary-row">
                    <span>Delivery Charges</span>
                    <span>{formatPrice(order.deliveryCharges)}</span>
                  </div>
                )}
                
                {order.taxAmount > 0 && (
                  <div className="summary-row">
                    <span>Tax</span>
                    <span>{formatPrice(order.taxAmount)}</span>
                  </div>
                )}
                
                {order.discountAmount > 0 && (
                  <div className="summary-row discount">
                    <span>Discount</span>
                    <span>-{formatPrice(order.discountAmount)}</span>
                  </div>
                )}
                
                <div className="summary-row total">
                  <span>Total Amount</span>
                  <span>{formatPrice(order.totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="order-section">
              <h3>Payment Information</h3>
              <div className="payment-details">
                <div className="payment-method">
                  <span className="label">Payment Method:</span>
                  <span className="value">
                    {order.payment?.method?.toUpperCase() || 'COD'}
                  </span>
                </div>
                
                <div className="payment-status">
                  <span className="label">Payment Status:</span>
                  <span 
                    className="status-badge"
                    style={{ 
                      backgroundColor: paymentInfo.color,
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.875rem'
                    }}
                  >
                    {paymentInfo.icon} {paymentInfo.text}
                  </span>
                </div>
                
                {order.payment?.transactionId && (
                  <div className="transaction-id">
                    <span className="label">Transaction ID:</span>
                    <span className="value">{order.payment.transactionId}</span>
                  </div>
                )}
                
                {order.payment?.advanceAmount && (
                  <div className="advance-payment">
                    <span className="label">Advance Paid:</span>
                    <span className="value">{formatPrice(order.payment.advanceAmount)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Delivery Information */}
            <div className="order-section">
              <h3>Delivery Information</h3>
              <div className="delivery-details">
                <div className="delivery-address">
                  <h4>Delivery Address</h4>
                  <div className="address">
                    {order.deliveryAddress ? (
                      <>
                        <div className="address-name">
                          {order.deliveryAddress.fullName || order.deliveryAddress.name || 'Name not provided'}
                        </div>
                        <div className="address-line">
                          {order.deliveryAddress.address || 'Address not provided'}
                        </div>
                        <div className="address-location">
                          {order.deliveryAddress.city && `${order.deliveryAddress.city}, `}
                          {order.deliveryAddress.state && `${order.deliveryAddress.state} - `}
                          {order.deliveryAddress.pincode || ''}
                        </div>
                      </>
                    ) : (
                      <div>Address not provided</div>
                    )}
                  </div>
                </div>
                
                {order.delivery?.expectedDate && (
                  <div className="expected-delivery">
                    <span className="label">Expected Delivery:</span>
                    <span className="value">{formatDate(order.delivery.expectedDate)}</span>
                  </div>
                )}
                
                {order.delivery?.trackingNumber && (
                  <div className="tracking-number">
                    <span className="label">Tracking Number:</span>
                    <span className="value">{order.delivery.trackingNumber}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Supplier Information */}
            {order.supplier && (
              <div className="order-section">
                <h3>Supplier Information</h3>
                <div className="supplier-details">
                  <div className="supplier-name">
                    <span className="label">Supplier:</span>
                    <span className="value">{order.supplier.businessName || order.supplier.name}</span>
                  </div>
                  
                  {order.supplier.location && (
                    <div className="supplier-location">
                      <span className="label">Location:</span>
                      <span className="value">
                        {order.supplier.location.city}, {order.supplier.location.state}
                      </span>
                    </div>
                  )}
                  
                  {order.supplier.contact && (
                    <div className="supplier-contact">
                      <span className="label">Contact:</span>
                      <span className="value">{order.supplier.contact.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Order Actions */}
            <div className="order-section">
              <h3>Order Actions</h3>
              <div className="order-actions">
                {(['shipped', 'dispatched'].includes(order.status)) && (
                  <button 
                    onClick={handleTrackOrder}
                    className="btn btn-primary"
                    disabled={trackOrderMutation.isLoading}
                  >
                    {trackOrderMutation.isLoading ? 'Tracking...' : 'Track Order'}
                  </button>
                )}
                
                <button 
                  onClick={handleDownloadInvoice}
                  className="btn btn-outline"
                >
                  Download Invoice
                </button>
                
                <button 
                  onClick={handleContactSupplier}
                  className="btn btn-outline"
                >
                  Contact Supplier
                </button>
                
                {order.status === 'delivered' && (
                  <button className="btn btn-primary">
                    Write Review
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrderDetailPage