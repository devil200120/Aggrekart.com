import React, { useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery } from 'react-query'
import { ordersAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from '../components/common/LoadingSpinner'
import './OrderConfirmationPage.css'

const OrderConfirmationPage = () => {
  const { orderId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  // Fetch order details
  const { data: order, isLoading, error } = useQuery(
    ['order', orderId],
    () => ordersAPI.getOrder(orderId),
    {
      enabled: !!orderId && !!user,
      retry: 1
    }
  )

  useEffect(() => {
    if (!user) {
      navigate('/auth/login')
    }
  }, [user, navigate])

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getEstimatedDelivery = () => {
    if (order?.estimatedDelivery) {
      return formatDate(order.estimatedDelivery)
    }
    
    // Calculate estimated delivery (5-7 business days)
    const orderDate = new Date(order?.createdAt || Date.now())
    const deliveryDate = new Date(orderDate.getTime() + (7 * 24 * 60 * 60 * 1000))
    return deliveryDate.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <div className="order-confirmation-page">
        <div className="container">
          <LoadingSpinner size="large" text="Loading order details..." />
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="order-confirmation-page">
        <div className="container">
          <div className="confirmation-error">
            <div className="error-icon">❌</div>
            <h2>Order Not Found</h2>
            <p>We couldn't find the order you're looking for.</p>
            <div className="error-actions">
              <Link to="/orders" className="btn btn-primary">
                View All Orders
              </Link>
              <Link to="/products" className="btn btn-outline">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="order-confirmation-page">
      <div className="container">
        {/* Success Header */}
        <div className="confirmation-header">
          <div className="success-animation">
            <div className="checkmark">✓</div>
          </div>
          
          <h1>Order Confirmed!</h1>
          <p className="confirmation-message">
            Thank you for your order. We've received your order and will start processing it soon.
          </p>
          
          <div className="order-number">
            <strong>Order #{order.orderNumber || order._id.slice(-8).toUpperCase()}</strong>
          </div>
        </div>

        {/* Order Summary Card */}
        <div className="confirmation-content">
          <div className="order-summary-card">
            <h2>Order Summary</h2>
            
            {/* Order Items */}
            <div className="order-items">
              {order.items.map((item, index) => (
                <div key={index} className="order-item">
                  <div className="item-image">
                    <img 
                      src={item.product.images?.[0] || '/placeholder-product.jpg'} 
                      alt={item.product.name}
                    />
                  </div>
                  <div className="item-details">
                    <h4>{item.product.name}</h4>
                    <div className="item-meta">
                      <span>Quantity: {item.quantity}</span>
                      <span>Price: {formatPrice(item.price)}/{item.product.unit}</span>
                    </div>
                  </div>
                  <div className="item-total">
                    {formatPrice(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>

            {/* Price Breakdown */}
            <div className="price-breakdown">
              <div className="price-row">
                <span>Subtotal</span>
                <span>{formatPrice(order.subtotal || order.totalAmount)}</span>
              </div>
              {order.discount > 0 && (
                <div className="price-row discount">
                  <span>Discount</span>
                  <span>-{formatPrice(order.discount)}</span>
                </div>
              )}
              <div className="price-row">
                <span>Delivery Fee</span>
                <span>{order.deliveryFee ? formatPrice(order.deliveryFee) : 'FREE'}</span>
              </div>
              <div className="price-row">
                <span>Tax (GST)</span>
                <span>{formatPrice(order.tax || 0)}</span>
              </div>
              <div className="price-row total">
                <span>Total Amount</span>
                <span>{formatPrice(order.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Order Details */}
          <div className="order-details-grid">
            {/* Delivery Information */}
            <div className="detail-card">
              <h3>Delivery Information</h3>
              <div className="delivery-info">
                <div className="info-row">
                  <span className="label">Delivery Address:</span>
                  <div className="address">
                    <div>{order.shippingAddress.fullName}</div>
                    <div>{order.shippingAddress.address}</div>
                    <div>
                      {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}
                    </div>
                    <div>Phone: {order.shippingAddress.phone}</div>
                  </div>
                </div>
                <div className="info-row">
                  <span className="label">Estimated Delivery:</span>
                  <span className="delivery-date">{getEstimatedDelivery()}</span>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="detail-card">
              <h3>Payment Information</h3>
              <div className="payment-info">
                <div className="info-row">
                  <span className="label">Payment Method:</span>
                  <span className="payment-method">
                    {order.paymentMethod === 'cod' ? '💰 Cash on Delivery' :
                     order.paymentMethod === 'card' ? '💳 Credit/Debit Card' :
                     order.paymentMethod === 'upi' ? '📱 UPI Payment' :
                     order.paymentMethod}
                  </span>
                </div>
                <div className="info-row">
                  <span className="label">Payment Status:</span>
                  <span className={`payment-status ${order.paymentStatus || 'pending'}`}>
                    {order.paymentStatus === 'paid' ? '✅ Paid' :
                     order.paymentStatus === 'pending' ? '⏳ Pending' :
                     order.paymentMethod === 'cod' ? '💰 Pay on Delivery' : '⏳ Pending'}
                  </span>
                </div>
                <div className="info-row">
                  <span className="label">Order Date:</span>
                  <span>{formatDate(order.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="next-steps">
            <h3>What happens next?</h3>
            <div className="steps-list">
              <div className="step completed">
                <div className="step-icon">✅</div>
                <div className="step-content">
                  <h4>Order Confirmed</h4>
                  <p>We've received your order and payment details</p>
                </div>
              </div>
              
              <div className="step">
                <div className="step-icon">📦</div>
                <div className="step-content">
                  <h4>Processing</h4>
                  <p>We'll prepare your order for shipment</p>
                </div>
              </div>
              
              <div className="step">
                <div className="step-icon">🚚</div>
                <div className="step-content">
                  <h4>Shipped</h4>
                  <p>Your order will be dispatched and you'll receive tracking details</p>
                </div>
              </div>
              
              <div className="step">
                <div className="step-icon">🏠</div>
                <div className="step-content">
                  <h4>Delivered</h4>
                  <p>Your order will be delivered to your specified address</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="confirmation-actions">
            <Link 
              to={`/orders/${order._id}`}
              className="btn btn-primary"
            >
              Track Your Order
            </Link>
            
            <Link 
              to="/products"
              className="btn btn-outline"
            >
              Continue Shopping
            </Link>
            
            <button 
              onClick={() => window.print()}
              className="btn btn-outline"
            >
              Print Receipt
            </button>
          </div>

          {/* Support Information */}
          <div className="support-info">
            <h3>Need Help?</h3>
            <p>
              If you have any questions about your order, feel free to contact our support team.
            </p>
            <div className="support-contacts">
              <div className="contact-item">
                <span className="contact-icon">📞</span>
                <span>Call us: 1800-123-4567</span>
              </div>
              <div className="contact-item">
                <span className="contact-icon">✉️</span>
                <span>Email: support@aggrekart.com</span>
              </div>
              <div className="contact-item">
                <span className="contact-icon">💬</span>
                <span>Live Chat: Available 24/7</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrderConfirmationPage