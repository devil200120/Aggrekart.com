import React from 'react'
import { Link } from 'react-router-dom'
import ImageWithFallback from '../common/ImageWithFallback'
import './OrderCard.css'
import '../common/ImageWithFallback.css'

const OrderCard = ({ order }) => {
  // Safe rendering function to handle undefined/null values
  const safeRender = (value, fallback = '') => {
    if (value === null || value === undefined) return fallback;
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  const safeNumber = (value, fallback = 0) => {
    if (value === null || value === undefined || isNaN(value)) return fallback;
    return Number(value);
  };

  const formatPrice = (price) => {
    const numPrice = safeNumber(price);
    if (numPrice === 0) return '₹0';
    
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(numPrice);
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Date not available';
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch (error) {
      return 'Invalid date';
    }
  }

  const getStatusColor = (status) => {
    const statusColors = {
      'pending': 'orange',
      'confirmed': 'blue',
      'processing': 'purple',
      'shipped': 'indigo',
      'out_for_delivery': 'cyan',
      'delivered': 'green',
      'cancelled': 'red',
      'returned': 'gray'
    }
    return statusColors[status] || 'gray'
  }

  const getStatusText = (status) => {
    const statusTexts = {
      'pending': 'Order Pending',
      'confirmed': 'Order Confirmed',
      'processing': 'Processing',
      'shipped': 'Shipped',
      'out_for_delivery': 'Out for Delivery',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled',
      'returned': 'Returned'
    }
    return statusTexts[status] || status
  }

  const getDeliveryStatus = () => {
    if (!order.status) return null;
    
    switch (order.status) {
      case 'delivered':
        return `Delivered on ${formatDate(order.deliveredAt)}`
      case 'shipped':
        return `Shipped on ${formatDate(order.shippedAt)}`
      case 'out_for_delivery':
        return 'Out for delivery'
      case 'cancelled':
        return `Cancelled on ${formatDate(order.cancelledAt)}`
      default:
        return null
    }
  }

  // Determine action availability
  const canCancel = order.status === 'pending' || order.status === 'confirmed'
  const canTrack = ['shipped', 'out_for_delivery'].includes(order.status)
  const canReturn = order.status === 'delivered' && order.deliveredAt && 
                   (new Date() - new Date(order.deliveredAt)) < (7 * 24 * 60 * 60 * 1000) // 7 days

  // Extract delivery address with safe fallbacks
  const deliveryAddress = order.deliveryAddress || order.shippingAddress || {};
  const customer = order.customer || {};
  
  // Use customer name if delivery address doesn't have fullName
  const addressName = safeRender(
    deliveryAddress.fullName || 
    deliveryAddress.name || 
    customer.fullName || 
    customer.name, 
    'Name not provided'
  );
  
  const addressLine = safeRender(deliveryAddress.address, 'Address not provided');
  const addressCity = safeRender(deliveryAddress.city, '');
  const addressState = safeRender(deliveryAddress.state, '');
  const addressPincode = safeRender(deliveryAddress.pincode, '');

  // Extract order items safely with better product name handling
  const orderItems = order.items || [];
  const totalItems = orderItems.length;

  // Calculate totals properly
  const itemsTotal = orderItems.reduce((sum, item) => {
    return sum + safeNumber(item.totalPrice || (item.unitPrice * item.quantity));
  }, 0);

  const deliveryCharges = safeNumber(order.delivery?.charges || order.deliveryCharges || 0);
  const totalAmount = safeNumber(order.totalAmount || order.finalAmount || (itemsTotal + deliveryCharges));

  return (
    <div className="order-card">
      {/* Order Header */}
      <div className="order-header">
        <div className="order-info">
          <div className="order-id">
            <span className="label">Order ID:</span>
            <span className="value">#{safeRender(order.orderId || order._id, 'Unknown').slice(-8).toUpperCase()}</span>
          </div>
          
          <div className="order-date">
            <span className="label">Placed on:</span>
            <span className="value">{formatDate(order.createdAt)}</span>
          </div>
        </div>
        
        <div className={`order-status status-${getStatusColor(order.status)}`}>
          {getStatusText(order.status)}
        </div>
      </div>

      {/* Order Content */}
      <div className="order-content">
        {/* Order Items Preview */}
        <div className="order-items">
          {totalItems > 0 ? (
            <>
              <div className="items-header">
                <h4>Items ({totalItems})</h4>
              </div>
              
              <div className="items-preview">
                {orderItems.slice(0, 3).map((item, index) => {
                  const productName = safeRender(
                    item.productSnapshot?.name || 
                    item.product?.name || 
                    'Unknown Product'
                  );
                  
                  const productImage = item.productSnapshot?.imageUrl || 
                                     item.product?.images?.[0];
                  
                  return (
                    <div key={index} className="item-preview">
                      <ImageWithFallback
                        src={productImage}
                        alt={productName}
                        className="item-image"
                        fallbackType="product"
                      />
                      <div className="item-details">
                        <div className="item-name" title={productName}>
                          {productName}
                        </div>
                        <div className="item-meta">
                          <span className="item-quantity">Qty: {safeNumber(item.quantity)}</span>
                          <span className="item-price">{formatPrice(item.unitPrice)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {totalItems > 3 && (
                <div className="more-items">
                  +{totalItems - 3} more items
                </div>
              )}
            </>
          ) : (
            <div className="no-items">No items found</div>
          )}
        </div>

        {/* Order Summary */}
        <div className="order-summary">
          <div className="summary-section">
            <h4>Order Summary</h4>
            
            <div className="summary-row">
              <span>Items ({totalItems})</span>
              <span>{formatPrice(itemsTotal)}</span>
            </div>
            
            {deliveryCharges > 0 && (
              <div className="summary-row">
                <span>Delivery Charges</span>
                <span>{formatPrice(deliveryCharges)}</span>
              </div>
            )}
            
            <div className="summary-row total">
              <span>Total Amount</span>
              <span>{formatPrice(totalAmount)}</span>
            </div>
            
            {getDeliveryStatus() && (
              <div className="summary-row delivery-status">
                <span>Status</span>
                <span className="status-text">{getDeliveryStatus()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Delivery Address */}
        <div className="delivery-info">
          <h4>Delivery Address</h4>
          <div className="address">
            <div className="address-name">{addressName}</div>
            <div className="address-line">{addressLine}</div>
            {(addressCity || addressState || addressPincode) && (
              <div className="address-location">
                {addressCity}
                {addressCity && addressState && ', '}
                {addressState}
                {(addressCity || addressState) && addressPincode && ' - '}
                {addressPincode}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Order Actions */}
      <div className="order-actions">
        <div className="primary-actions">
          <Link 
            to={`/orders/${order._id}`}
            className="btn btn-outline"
          >
            View Details
          </Link>
          
          {canTrack && (
            <Link 
              to={`/orders/${order._id}/track`}
              className="btn btn-primary"
            >
              Track Order
            </Link>
          )}
        </div>

        <div className="secondary-actions">
          {canCancel && (
            <button className="action-link cancel">
              Cancel Order
            </button>
          )}
          
          {canReturn && (
            <button className="action-link return">
              Return Order
            </button>
          )}
          
          {order.status === 'delivered' && (
            <button className="action-link review">
              Write Review
            </button>
          )}
          
          <button className="action-link invoice">
            Download Invoice
          </button>
        </div>
      </div>
    </div>
  )
}

export default OrderCard