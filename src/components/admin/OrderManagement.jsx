/* 
FILE: c:\Users\KIIT0001\Desktop\builder_website using mern\front-end\app\src\components\admin\OrderManagement.jsx
LINES: 1-250
PURPOSE: Component for admin to manage all platform orders
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
  XCircle
} from 'lucide-react'
import { adminAPI } from '../../services/api'
import toast from 'react-hot-toast'
import './OrderManagement.css'

const OrderManagement = ({ orders = [], loading }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterDateRange, setFilterDateRange] = useState('all')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const queryClient = useQueryClient()

  // Update order status mutation
  const updateOrderMutation = useMutation(
    ({ orderId, status, notes }) => adminAPI.updateOrderStatus(orderId, status, notes),
    {
      onSuccess: () => {
        toast.success('Order status updated successfully!')
        queryClient.invalidateQueries('admin-orders')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update order')
      }
    }
  )

  // Refund order mutation
  const refundOrderMutation = useMutation(
    ({ orderId, data }) => adminAPI.refundOrder(orderId, data),
    {
      onSuccess: () => {
        toast.success('Order refund processed successfully!')
        queryClient.invalidateQueries('admin-orders')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to process refund')
      }
    }
  )

  // Filtered and sorted orders
  const filteredOrders = useMemo(() => {
    let filtered = orders.filter(order => {
      const matchesSearch = 
        order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = filterStatus === 'all' || order.status === filterStatus
      
      let matchesDate = true
      if (filterDateRange !== 'all') {
        const orderDate = new Date(order.createdAt)
        const now = new Date()
        const days = {
          'today': 1,
          'week': 7,
          'month': 30,
          'quarter': 90
        }
        const daysAgo = days[filterDateRange]
        if (daysAgo) {
          const filterDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000))
          matchesDate = orderDate >= filterDate
        }
      }
      
      return matchesSearch && matchesStatus && matchesDate
    })

    // Sort orders
    filtered.sort((a, b) => {
      let aValue = a[sortBy]
      let bValue = b[sortBy]
      
      if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
        aValue = new Date(aValue)
        bValue = new Date(bValue)
      } else if (sortBy === 'total') {
        aValue = parseFloat(aValue)
        bValue = parseFloat(bValue)
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }, [orders, searchTerm, filterStatus, filterDateRange, sortBy, sortOrder])

  const getStatusBadge = (status) => {
    const badges = {
      pending: { label: 'Pending', className: 'status-pending', icon: Clock },
      confirmed: { label: 'Confirmed', className: 'status-confirmed', icon: CheckCircle },
      processing: { label: 'Processing', className: 'status-processing', icon: Package },
      shipped: { label: 'Shipped', className: 'status-shipped', icon: Truck },
      delivered: { label: 'Delivered', className: 'status-delivered', icon: CheckCircle },
      cancelled: { label: 'Cancelled', className: 'status-cancelled', icon: XCircle },
      refunded: { label: 'Refunded', className: 'status-refunded', icon: RefreshCw }
    }
    
    const badge = badges[status] || badges.pending
    const IconComponent = badge.icon
    
    return (
      <span className={`status-badge ${badge.className}`}>
        <IconComponent size={12} />
        {badge.label}
      </span>
    )
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
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

  const handleStatusUpdate = (order, newStatus) => {
    const notes = prompt(`Add notes for status change to ${newStatus}:`)
    if (notes !== null) {
      updateOrderMutation.mutate({
        orderId: order._id,
        status: newStatus,
        notes
      })
    }
  }

  const handleRefund = (order) => {
    const reason = prompt('Enter refund reason:')
    if (reason) {
      refundOrderMutation.mutate({
        orderId: order._id,
        data: { reason, amount: order.total }
      })
    }
  }

  const exportOrders = () => {
    // This would trigger CSV/Excel export
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
        </div>
      </div>

      {/* Controls */}
      <div className="order-controls">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search by order number, customer name, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
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
          
          <div className="filter-group">
            <label>Date Range</label>
            <select value={filterDateRange} onChange={(e) => setFilterDateRange(e.target.value)}>
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">Last 3 Months</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Sort By</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="createdAt">Order Date</option>
              <option value="total">Total Amount</option>
              <option value="status">Status</option>
              <option value="customer.name">Customer Name</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Order</label>
            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
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
            {filteredOrders.map((order) => (
              <tr key={order._id}>
                <td>
                  <div className="order-info">
                    <div className="order-number">#{order.orderNumber}</div>
                    <div className="order-items">
                      {order.items?.length} items
                    </div>
                  </div>
                </td>
                <td>
                  <div className="customer-info">
                    <div className="customer-name">{order.customer?.name}</div>
                    <div className="customer-email">{order.customer?.email}</div>
                    {order.shippingAddress && (
                      <div className="customer-location">
                        <MapPin size={12} />
                        {order.shippingAddress.city}, {order.shippingAddress.state}
                      </div>
                    )}
                  </div>
                </td>
                <td>{getStatusBadge(order.status)}</td>
                <td>
                  <div className="order-total">
                    <div className="total-amount">{formatCurrency(order.total)}</div>
                    <div className="payment-method">{order.paymentMethod}</div>
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
                      onClick={() => {
                        setSelectedOrder(order)
                        setShowOrderModal(true)
                      }}
                    >
                      <Eye size={14} />
                      View
                    </button>
                    
                    {order.status === 'pending' && (
                      <button 
                        className="btn btn-success btn-sm"
                        onClick={() => handleStatusUpdate(order, 'confirmed')}
                      >
                        Confirm
                      </button>
                    )}
                    
                    {order.status === 'confirmed' && (
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={() => handleStatusUpdate(order, 'processing')}
                      >
                        Process
                      </button>
                    )}
                    
                    {(order.status === 'delivered' || order.status === 'processing') && (
                      <button 
                        className="btn btn-warning btn-sm"
                        onClick={() => handleRefund(order)}
                        disabled={refundOrderMutation.isLoading}
                      >
                        Refund
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredOrders.length === 0 && (
        <div className="no-orders">
          <div className="no-orders-icon">📦</div>
          <h4>No orders found</h4>
          <p>Try adjusting your search or filter criteria.</p>
        </div>
      )}

      {/* Order Details Modal would go here */}
    </div>
  )
}

export default OrderManagement