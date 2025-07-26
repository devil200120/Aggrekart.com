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

  // Fetch orders
  const { data: ordersData, isLoading } = useQuery(
    ['supplier-orders', user?.id, filters],
    () => supplierAPI.getOrders(filters),
    {
      enabled: !!user && user.role === 'supplier',
      keepPreviousData: true,
    }
  )

  // Update order status mutation
  const updateStatusMutation = useMutation(
    ({ orderId, status }) => supplierAPI.updateOrderStatus(orderId, { status }),
    {
      onSuccess: () => {
        toast.success('Order status updated successfully')
        queryClient.invalidateQueries('supplier-orders')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update order status')
      }
    }
  )

  const handleStatusUpdate = (orderId, newStatus) => {
    updateStatusMutation.mutate({ orderId, status: newStatus })
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'orange',
      'preparing': 'blue',
      'processing': 'purple',
      'dispatched': 'indigo',
      'delivered': 'green',
      'cancelled': 'red'
    }
    return colors[status] || 'gray'
  }

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

  const orders = ordersData?.data?.orders || []
  const stats = ordersData?.data?.stats || {}

  return (
    <div className="supplier-orders-page">
      <div className="container">
        {/* Page Header */}
        <div className="orders-header">
          <div className="header-content">
            <h1>Orders Management</h1>
            <p>Manage and track all your customer orders</p>
          </div>
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
            <div className="stat-value">{stats.processing || 0}</div>
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
              <p>You don't have any orders yet.</p>
            </div>
          ) : (
            <div className="orders-list">
              {orders.map((order) => (
                <div key={order._id} className="order-card">
                  <div className="order-header">
                    <div className="order-id">
                      Order #{order.orderNumber || order._id.slice(-6).toUpperCase()}
                    </div>
                    <div className="order-date">
                      {formatDate(order.createdAt)}
                    </div>
                  </div>

                  <div className="order-details">
                    <div className="customer-info">
                      <strong>{order.customer?.name || 'Unknown Customer'}</strong>
                      <div className="customer-phone">{order.customer?.phoneNumber}</div>
                    </div>

                    <div className="order-items">
                      <div className="items-count">
                        {order.items?.length || 0} items
                      </div>
                      <div className="order-amount">
                        {formatCurrency(order.totalAmount)}
                      </div>
                    </div>

                    <div className="order-status-section">
                      <div className={`status-badge ${getStatusColor(order.status)}`}>
                        {order.status}
                      </div>
                      
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                        className="status-select"
                      >
                        <option value="pending">Pending</option>
                        <option value="preparing">Preparing</option>
                        <option value="processing">Processing</option>
                        <option value="dispatched">Dispatched</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SupplierOrdersPage
