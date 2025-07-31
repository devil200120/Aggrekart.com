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

  // Fixed fetchOrders function with better error handling
  const fetchOrders = async (page = 1, newFilters = filters) => {
    try {
      setLoading(true)
      setError(null)
      
      // Create params object
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

      console.log('Fetching orders with params:', params)

      const response = await adminAPI.getAllOrders(params)
      
      console.log('Orders API response:', response)

      if (response.success) {
        setOrders(response.data.orders || [])
        setPagination(response.data.pagination || pagination)
        
        // Handle summary with NaN protection
        const summaryData = response.data.summary || {}
        setSummary({
          totalValue: Number(summaryData.totalValue) || 0,
          totalCommission: Number(summaryData.totalCommission) || 0,
          averageOrderValue: Number(summaryData.averageOrderValue) || 0
        })
      } else {
        setError(response.message || 'Failed to fetch orders')
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
    console.log('Filter change:', newFilters)
    setFilters(newFilters)
    fetchOrders(1, newFilters)
  }

  const handlePageChange = (page) => {
    console.log('Page change:', page)
    fetchOrders(page)
  }

  const handleOrderAction = async (action, orderId, data = {}) => {
    try {
      console.log(`Order action: ${action} on order ${orderId}`, data)
      
      switch (action) {
        case 'confirm':
          await adminAPI.updateOrderStatus(orderId, 'confirmed', data.notes || 'Order confirmed by admin')
          break
        case 'process':
          await adminAPI.updateOrderStatus(orderId, 'processing', data.notes || 'Order processing started')
          break
        case 'ship':
          await adminAPI.updateOrderStatus(orderId, 'shipped', data.notes || 'Order shipped')
          break
        case 'deliver':
          await adminAPI.updateOrderStatus(orderId, 'delivered', data.notes || 'Order delivered')
          break
        default:
          console.warn('Unknown order action:', action)
      }
      
      // Refresh orders after action
      fetchOrders(pagination.currentPage)
    } catch (err) {
      console.error(`Error performing ${action} on order:`, err)
      throw new Error(err.response?.data?.message || `Failed to ${action} order`)
    }
  }

  // Format currency with NaN protection
  const formatCurrency = (amount) => {
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
              <p>{formatCurrency(summary.totalValue)}</p>
            </div>
            <div className="summary-card">
              <h3>Total Commission</h3>
              <p>{formatCurrency(summary.totalCommission)}</p>
            </div>
            <div className="summary-card">
              <h3>Average Order Value</h3>
              <p>{formatCurrency(summary.averageOrderValue)}</p>
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
            loading={loading}
          />
        </div>
      </div>
    </div>
  )
}

export default AdminOrdersPage