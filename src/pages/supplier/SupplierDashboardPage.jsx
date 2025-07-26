import React, { useState, useEffect } from 'react'
import { useQuery } from 'react-query'
import { useAuth } from '../../context/AuthContext'
import { supplierAPI } from '../../services/api'
import { Link } from 'react-router-dom'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import DashboardStats from '../../components/supplier/DashboardStats'
import SalesChart from '../../components/supplier/SalesChart'
import QuickActions from '../../components/supplier/QuickActions'
import './SupplierDashboardPage.css'

const SupplierDashboardPage = () => {
  const { user } = useAuth()
  const [dateRange, setDateRange] = useState('30')
  const [greeting, setGreeting] = useState('')

  // Set dynamic greeting based on time
  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting('Good Morning')
    else if (hour < 17) setGreeting('Good Afternoon')
    else setGreeting('Good Evening')
  }, [])

  // Fetch dashboard data
  const { data: dashboardData, isLoading, error, refetch } = useQuery(
    ['supplier-dashboard', user?.id, dateRange],
    () => supplierAPI.getDashboardData({ days: dateRange }),
    {
      enabled: !!user && user.role === 'supplier',
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      onError: (error) => {
        console.error('Dashboard fetch error:', error)
      }
    }
  )

  // Access control
  if (!user || user.role !== 'supplier') {
    return (
      <div className="supplier-dashboard-page">
        <div className="container">
          <div className="access-denied">
            <div className="access-denied-icon">🚫</div>
            <h2>Access Denied</h2>
            <p>Only suppliers can access this dashboard</p>
            <Link to="/auth/login" className="btn btn-primary">Login as Supplier</Link>
          </div>
        </div>
      </div>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="supplier-dashboard-page">
        <div className="container">
          <div className="loading-container">
            <LoadingSpinner size="large" />
            <h3>Loading Dashboard...</h3>
            <p>Fetching your latest business data</p>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="supplier-dashboard-page">
        <div className="container">
          <div className="error-container">
            <div className="error-icon">⚠️</div>
            <h2>Unable to Load Dashboard</h2>
            <p>We're having trouble fetching your dashboard data.</p>
            <div className="error-actions">
              <button onClick={refetch} className="btn btn-primary">
                Try Again
              </button>
              <Link to="/supplier/products" className="btn btn-secondary">
                View Products
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const { supplier, stats, products, salesData, approvalStatus, notifications } = dashboardData.data

  return (
    <div className="supplier-dashboard-page">
      <div className="container">
        {/* Dashboard Header */}
        <div className="dashboard-header">
          <div className="header-content">
            <div className="welcome-section">
              <h1 className="main-title">
                {greeting}, {supplier.name}! 👋
              </h1>
              <p className="welcome-subtitle">
                Here's what's happening with your business today
              </p>
              <div className="supplier-meta">
                <span className="supplier-id">ID: {supplier.supplierId}</span>
                <span className="member-since">
                  Member since {new Date(supplier.memberSince).toLocaleDateString('en-IN', { 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </span>
                <div className={`status-badge ${approvalStatus.isApproved ? 'approved' : 'pending'}`}>
                  {approvalStatus.isApproved ? '✓ Approved' : '⏳ Pending'}
                </div>
              </div>
            </div>
            
            <div className="header-controls">
              <div className="date-range-selector">
                <label htmlFor="dateRange">📊 Time Period:</label>
                <select 
                  id="dateRange"
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="date-select"
                >
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 3 months</option>
                  <option value="365">Last year</option>
                </select>
              </div>
              
              <button onClick={refetch} className="refresh-btn" title="Refresh Data">
                🔄
              </button>
            </div>
          </div>
        </div>

        {/* Notifications Panel */}
        {notifications && notifications.length > 0 && (
          <NotificationPanel notifications={notifications} />
        )}

        {/* Dashboard Stats */}
        <DashboardStats stats={stats} />

        {/* Main Dashboard Grid */}
        <div className="dashboard-grid">
          {/* Left Column */}
          <div className="dashboard-main">
            {/* Sales Chart */}
            <div className="dashboard-card chart-card">
              <div className="card-header">
                <div className="header-info">
                  <h2>📈 Sales Overview</h2>
                  <p>Revenue and orders trends for the selected period</p>
                </div>
                <div className="chart-legend">
                  <div className="legend-item">
                    <span className="legend-color revenue"></span>
                    Revenue
                  </div>
                  <div className="legend-item">
                    <span className="legend-color orders"></span>
                    Orders
                  </div>
                </div>
              </div>
              <SalesChart data={salesData} dateRange={dateRange} />
            </div>

            {/* Recent Products */}
            <div className="dashboard-card">
              <div className="card-header">
                <div className="header-info">
                  <h2>🆕 Recent Products</h2>
                  <p>Your latest product additions</p>
                </div>
                <Link to="/supplier/products" className="view-all-link">
                  View All Products →
                </Link>
              </div>
              <RecentProducts products={products.recent} />
            </div>
          </div>

          {/* Right Column */}
          <div className="dashboard-sidebar">
            {/* Quick Actions */}
            <QuickActions />

            {/* Product Overview */}
            <div className="dashboard-card product-overview">
              <div className="card-header">
                <h2>📦 Product Overview</h2>
                <p>Your product catalog status</p>
              </div>
              <div className="product-stats-grid">
                <div className="product-stat">
                  <div className="stat-number">{products.total}</div>
                  <div className="stat-label">Total Products</div>
                </div>
                <div className="product-stat active">
                  <div className="stat-number">{products.active}</div>
                  <div className="stat-label">Active</div>
                </div>
                <div className="product-stat pending">
                  <div className="stat-number">{products.pending}</div>
                  <div className="stat-label">Pending</div>
                </div>
                <div className="product-stat inactive">
                  <div className="stat-number">{products.inactive}</div>
                  <div className="stat-label">Inactive</div>
                </div>
              </div>
              
              {products.total === 0 && (
                <div className="empty-state">
                  <div className="empty-icon">📦</div>
                  <p>No products yet</p>
                  <Link to="/supplier/products/add" className="btn btn-primary btn-small">
                    Add Your First Product
                  </Link>
                </div>
              )}
            </div>

            {/* Top Products */}
            <TopProducts products={products.topPerforming} />

            {/* Business Insights */}
            <div className="dashboard-card insights-card">
              <div className="card-header">
                <h2>💡 Business Insights</h2>
                <p>Key metrics and recommendations</p>
              </div>
              <div className="insights-content">
                <div className="insight-item">
                  <div className={`insight-icon ${stats.revenueGrowth >= 0 ? 'positive' : 'negative'}`}>
                    {stats.revenueGrowth >= 0 ? '📈' : '📉'}
                  </div>
                  <div className="insight-text">
                    <h4>Revenue Trend</h4>
                    <p>
                      {stats.revenueGrowth >= 0 ? 'Revenue is growing' : 'Revenue needs attention'}
                      <span className={`growth-value ${stats.revenueGrowth >= 0 ? 'positive' : 'negative'}`}>
                        {stats.revenueGrowth > 0 ? '+' : ''}{stats.revenueGrowth?.toFixed(1)}%
                      </span>
                    </p>
                  </div>
                </div>

                <div className="insight-item">
                  <div className={`insight-icon ${stats.ordersGrowth >= 0 ? 'positive' : 'negative'}`}>
                    🛒
                  </div>
                  <div className="insight-text">
                    <h4>Order Volume</h4>
                    <p>
                      {stats.ordersGrowth >= 0 ? 'Orders increasing' : 'Orders declining'}
                      <span className={`growth-value ${stats.ordersGrowth >= 0 ? 'positive' : 'negative'}`}>
                        {stats.ordersGrowth > 0 ? '+' : ''}{stats.ordersGrowth?.toFixed(1)}%
                      </span>
                    </p>
                  </div>
                </div>

                <div className="insight-item">
                  <div className="insight-icon">⭐</div>
                  <div className="insight-text">
                    <h4>Product Rating</h4>
                    <p>
                      {stats.avgProductRating > 0 
                        ? `Average rating: ${stats.avgProductRating.toFixed(1)}/5`
                        : 'No ratings yet'
                      }
                      {stats.totalReviews > 0 && (
                        <span className="reviews-count">
                          ({stats.totalReviews} review{stats.totalReviews !== 1 ? 's' : ''})
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="insight-item">
                  <div className="insight-icon">👀</div>
                  <div className="insight-text">
                    <h4>Product Views</h4>
                    <p>
                      {stats.productViews > 0 
                        ? `${stats.productViews.toLocaleString()} total views`
                        : 'No views yet'
                      }
                      {stats.productViews > 1000 && (
                        <span className="achievement">🔥 Popular!</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {!approvalStatus.isApproved && (
                <div className="approval-notice">
                  <div className="notice-icon">⚠️</div>
                  <div className="notice-text">
                    <strong>Account Pending Approval</strong>
                    <p>Complete your profile to start selling and receiving orders.</p>
                    <Link to="/supplier/profile" className="btn btn-primary btn-small">
                      Complete Profile
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SupplierDashboardPage
