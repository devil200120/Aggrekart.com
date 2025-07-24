import React, { useState } from 'react'
import { useQuery } from 'react-query'
import { Link } from 'react-router-dom'
import { ordersAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import OrderCard from '../components/orders/OrderCard'
import OrderFilters from '../components/orders/OrderFilters'
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
      // Only send supported parameters to backend
      const apiParams = {
        page: currentPage,
        limit: 10
      }
      
      // Only add status if it's not empty and is a valid status
      const validStatuses = ['pending', 'preparing', 'processing', 'dispatched', 'delivered', 'cancelled']
      if (filters.status && validStatuses.includes(filters.status)) {
        apiParams.status = filters.status
      }
      
      console.log('🔍 Fetching orders with params:', apiParams);
      return ordersAPI.getOrders(apiParams)
    },
    {
      enabled: !!user,
      keepPreviousData: true,
      staleTime: 2 * 60 * 1000, // 2 minutes
      onSuccess: (data) => {
        console.log('✅ Orders API Response:', data);
      },
      onError: (error) => {
        console.log('❌ Orders API Error:', error);
      }
    }
  )

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
    setCurrentPage(1)
  }

  // Fix: Extract data from the correct response structure
  const orders = ordersResponse?.data?.orders || []
  const pagination = ordersResponse?.data?.pagination || {}

  console.log('📦 Extracted orders:', orders);
  console.log('📄 Extracted pagination:', pagination);

  if (!user) {
    return (
      <div className="orders-page">
        <div className="container">
          <div className="orders-empty">
            <h2>Please Login</h2>
            <p>You need to be logged in to view your orders</p>
            <Link to="/auth/login" className="btn btn-primary">
              Login Now
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
          <LoadingSpinner size="large" text="Loading your orders..." />
        </div>
      </div>
    )
  }

  if (error) {
    console.log('❌ Error details:', error);
    return (
      <div className="orders-page">
        <div className="container">
          <div className="orders-error">
            <h2>Something went wrong</h2>
            <p>Unable to load your orders. Please try again.</p>
            <p className="error-details">
              {error?.response?.data?.message || error?.message || 'Unknown error occurred'}
            </p>
            <button onClick={refetch} className="btn btn-primary">
              Retry
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
        <div className="orders-header">
          <div className="orders-header-content">
            <h1>My Orders</h1>
            <p>Track and manage all your orders</p>
          </div>
          
          <div className="orders-header-actions">
            <Link to="/products" className="btn btn-outline">
              Continue Shopping
            </Link>
          </div>
        </div>

        {/* Breadcrumb */}
        <nav className="breadcrumb">
          <Link to="/">Home</Link>
          <span className="breadcrumb-separator">›</span>
          <span className="breadcrumb-current">My Orders</span>
        </nav>

        {/* Debug Info (remove in production) */}
        <div style={{ 
          background: '#f5f5f5', 
          padding: '10px', 
          margin: '10px 0', 
          borderRadius: '5px',
          fontSize: '12px',
          fontFamily: 'monospace'
        }}>
          <strong>Debug Info:</strong><br/>
          Response: {ordersResponse ? 'Received' : 'None'}<br/>
          Orders count: {orders.length}<br/>
          Total from pagination: {pagination.totalItems || 0}<br/>
          Current page: {pagination.currentPage || 1}<br/>
          User ID: {user?._id}
        </div>

        {/* Orders Content */}
        <div className="orders-content">
          {/* Filters Sidebar */}
          <aside className="orders-sidebar">
            <OrderFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              totalOrders={pagination.totalItems || 0}
            />
          </aside>

          {/* Orders List */}
          <main className="orders-main">
            {/* Results Header */}
            <div className="orders-results-header">
              <div className="results-count">
                {pagination.totalItems || 0} orders found
              </div>
              
              <div className="results-sort">
                <select 
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="sort-select"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="amount-high">Amount: High to Low</option>
                  <option value="amount-low">Amount: Low to High</option>
                </select>
              </div>
            </div>

            {/* Orders List */}
            {orders.length === 0 ? (
              <div className="no-orders">
                <div className="no-orders-icon">📦</div>
                <h3>No orders found</h3>
                <p>
                  {Object.values(filters).some(f => f) 
                    ? 'Try adjusting your filters'
                    : "You haven't placed any orders yet"
                  }
                </p>
                <Link to="/products" className="btn btn-primary">
                  Start Shopping
                </Link>
              </div>
            ) : (
              <>
                <div className="orders-list">
                  {orders.map((order) => (
                    <OrderCard 
                      key={order._id}
                      order={order}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="pagination">
                    <button 
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="pagination-btn"
                    >
                      ← Previous
                    </button>
                    
                    <div className="pagination-pages">
                      {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                        .filter(page => 
                          page === 1 || 
                          page === pagination.totalPages || 
                          Math.abs(page - currentPage) <= 2
                        )
                        .map((page, index, array) => (
                          <React.Fragment key={page}>
                            {index > 0 && array[index - 1] !== page - 1 && (
                              <span className="pagination-ellipsis">...</span>
                            )}
                            <button
                              onClick={() => setCurrentPage(page)}
                              className={`pagination-page ${currentPage === page ? 'active' : ''}`}
                            >
                              {page}
                            </button>
                          </React.Fragment>
                        ))}
                    </div>
                    
                    <button 
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
                      disabled={currentPage === pagination.totalPages}
                      className="pagination-btn"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}

export default OrdersPage