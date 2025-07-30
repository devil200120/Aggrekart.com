import React, { useState, useEffect } from 'react'
import OrderManagement from '../../components/admin/OrderManagement'
import { adminAPI } from '../../services/api'
import './AdminOrdersPage.css'

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  })
  const [summary, setSummary] = useState({
    totalValue: 0,
    totalCommission: 0,
    averageOrderValue: 0
  })
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    supplier: '',
    customer: '',
    dateFrom: '',
    dateTo: ''
  })

  // Replace the fetchOrders function with this corrected version:

  const fetchOrders = async (page = 1, newFilters = filters) => {
    try {
      setLoading(true)
      setError(null)
      
      // Create params object instead of query string
      const params = {
        page: page.toString(),
        limit: '10',
        ...newFilters
      }

      // Remove empty string values and 'all' values
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === 'all') {
          delete params[key]
        }
      })

      const response = await adminAPI.getAllOrders(params)
      
      if (response.success) {
        setOrders(response.data.orders)
        setPagination(response.data.pagination)
        setSummary(response.data.summary)
      } else {
        setError('Failed to fetch orders')
      }
    } catch (err) {
      console.error('Error fetching orders:', err)
      setError(err.response?.data?.message || 'Failed to fetch orders')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    fetchOrders()
  }, [])

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters)
    fetchOrders(1, newFilters)
  }

  const handlePageChange = (page) => {
    fetchOrders(page)
  }

  const handleOrderAction = async (action, orderId, data = {}) => {
    try {
      // Implement order actions if needed
      // This would depend on what order management actions are available
      console.log(`Order action: ${action} on order ${orderId}`, data)
      
      // Refresh orders after action
      fetchOrders(pagination.currentPage)
    } catch (err) {
      console.error(`Error performing ${action} on order:`, err)
      setError(err.response?.data?.message || `Failed to ${action} order`)
    }
  }

  if (loading) {
    return (
      <div className="admin-orders-page">
        <div className="admin-page-container">
          <div className="admin-page-header">
            <h1>Order Management</h1>
            <p>Monitor and manage all orders, track status, and handle order-related issues</p>
          </div>
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading orders...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="admin-orders-page">
        <div className="admin-page-container">
          <div className="admin-page-header">
            <h1>Order Management</h1>
            <p>Monitor and manage all orders, track status, and handle order-related issues</p>
          </div>
          <div className="error-container">
            <div className="error-message">
              <h3>Error Loading Orders</h3>
              <p>{error}</p>
              <button onClick={() => fetchOrders()} className="retry-button">
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-orders-page">
      <div className="admin-page-container">
        <div className="admin-page-header">
          <h1>Order Management</h1>
          <p>Monitor and manage all orders, track status, and handle order-related issues</p>
        </div>
        
        <div className="admin-page-content">
          <div className="order-summary">
            <div className="summary-card">
              <h3>Total Orders Value</h3>
              <p>₹{summary.totalValue.toLocaleString()}</p>
            </div>
            <div className="summary-card">
              <h3>Total Commission</h3>
              <p>₹{summary.totalCommission.toLocaleString()}</p>
            </div>
            <div className="summary-card">
              <h3>Average Order Value</h3>
              <p>₹{summary.averageOrderValue.toLocaleString()}</p>
            </div>
          </div>

          <OrderManagement 
            orders={orders}
            pagination={pagination}
            filters={filters}
            onFilterChange={handleFilterChange}
            onPageChange={handlePageChange}
            onOrderAction={handleOrderAction}
            onRefresh={() => fetchOrders(pagination.currentPage)}
          />
        </div>
      </div>
    </div>
  )
}

export default AdminOrdersPage