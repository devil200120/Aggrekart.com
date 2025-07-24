import React from 'react'
import { Link } from 'react-router-dom'
import './RecentOrders.css'

const RecentOrders = ({ orders }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status) => {
    const statusColors = {
      'pending': 'orange',
      'confirmed': 'blue',
      'processing': 'purple',
      'shipped': 'indigo',
      'delivered': 'green',
      'cancelled': 'red'
    }
    return statusColors[status] || 'gray'
  }

  const getStatusText = (status) => {
    const statusTexts = {
      'pending': 'Pending',
      'confirmed': 'Confirmed',
      'processing': 'Processing',
      'shipped': 'Shipped',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled'
    }
    return statusTexts[status] || status
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="recent-orders">
        <div className="no-orders">
          <div className="no-orders-icon">📦</div>
          <h3>No Recent Orders</h3>
          <p>You don't have any recent orders yet.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="recent-orders">
      <div className="orders-list">
        {orders.slice(0, 5).map((order) => (
          <div key={order._id} className="order-item">
            <div className="order-main">
              <div className="order-info">
                <div className="order-id">
                  <strong>#{order.orderNumber || order._id.slice(-6).toUpperCase()}</strong>
                </div>
                <div className="order-customer">
                  {order.customer?.name || 'Unknown Customer'}
                </div>
                <div className="order-date">
                  {formatDate(order.createdAt)}
                </div>
              </div>

              <div className="order-items">
                <div className="items-count">
                  {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}
                </div>
                <div className="order-amount">
                  {formatCurrency(order.totalAmount)}
                </div>
              </div>
            </div>

            <div className="order-status">
              <span className={`status-badge ${getStatusColor(order.status)}`}>
                {getStatusText(order.status)}
              </span>
            </div>

            <div className="order-actions">
              <Link 
                to={`/supplier/orders/${order._id}`}
                className="btn btn-outline btn-sm"
              >
                View Details
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div className="orders-footer">
        <Link to="/supplier/orders" className="btn btn-primary">
          View All Orders
        </Link>
      </div>
    </div>
  )
}

export default RecentOrders