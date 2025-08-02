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
        <div className="swiggy-container">
          <div className="swiggy-access-denied">
            <div className="swiggy-empty-icon">🚫</div>
            <h2>Access Denied</h2>
            <p>Only suppliers can access this dashboard</p>
            <Link to="/auth/login" className="swiggy-btn swiggy-btn-primary">Login as Supplier</Link>
          </div>
        </div>
      </div>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="supplier-dashboard-page">
        <div className="swiggy-container">
          <div className="swiggy-loading">
            <div className="swiggy-spinner"></div>
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
        <div className="swiggy-container">
          <div className="swiggy-error">
            <div className="swiggy-empty-icon">⚠️</div>
            <h2>Oops! Something went wrong</h2>
            <p>We're having trouble loading your dashboard. Please try again.</p>
            <div className="swiggy-error-actions">
              <button onClick={refetch} className="swiggy-btn swiggy-btn-primary">
                <span className="btn-icon">🔄</span>
                Try Again
              </button>
              <Link to="/supplier/products" className="swiggy-btn swiggy-btn-outline">
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
      <div className="swiggy-container">
        {/* Swiggy-style Header */}
        <div className="swiggy-header">
          <div className="swiggy-header-content">
            <div className="swiggy-welcome">
              <div className="swiggy-greeting">
                <h1>{greeting}, {supplier.name}! 👋</h1>
                <p>Here's how your business is performing today</p>
              </div>
              <div className="swiggy-supplier-info">
                <div className="swiggy-badge swiggy-supplier-id">
                  <span className="badge-icon">🏪</span>
                  ID: {supplier.supplierId}
                </div>
                <div className="swiggy-badge swiggy-member-since">
                  <span className="badge-icon">📅</span>
                  Member since {new Date(supplier.memberSince).toLocaleDateString('en-IN', { 
                    month: 'short', 
                    year: 'numeric' 
                  })}
                </div>
                <div className={`swiggy-status ${approvalStatus.isApproved ? 'approved' : 'pending'}`}>
                  <span className="status-icon">{approvalStatus.isApproved ? '✓' : '⏳'}</span>
                  {approvalStatus.isApproved ? 'Approved' : 'Pending Approval'}
                </div>
              </div>
            </div>
            
            <div className="swiggy-header-controls">
              <div className="swiggy-time-selector">
                <select 
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="swiggy-select"
                >
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 3 months</option>
                  <option value="365">Last year</option>
                </select>
              </div>
              
              <button onClick={refetch} className="swiggy-refresh-btn" title="Refresh Data">
                <span className="refresh-icon">🔄</span>
              </button>
            </div>
          </div>

          {/* Swiggy-style notification banner */}
          {!approvalStatus.isApproved && (
            <div className="swiggy-notification-banner">
              <div className="banner-icon">⚠️</div>
              <div className="banner-content">
                <strong>Complete your profile to start selling</strong>
                <p>Get approved and start receiving orders from customers</p>
              </div>
              <Link to="/supplier/profile" className="swiggy-btn swiggy-btn-small">
                Complete Profile
              </Link>
            </div>
          )}
        </div>

        {/* Swiggy-style Stats Cards */}
        <div className="swiggy-stats-grid">
          <div className="swiggy-stat-card revenue">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <div className="stat-value">₹{stats.totalRevenue?.toLocaleString() || '0'}</div>
              <div className="stat-label">Total Revenue</div>
              <div className={`stat-change ${stats.revenueGrowth >= 0 ? 'positive' : 'negative'}`}>
                <span className="change-icon">{stats.revenueGrowth >= 0 ? '↗️' : '↘️'}</span>
                {stats.revenueGrowth > 0 ? '+' : ''}{stats.revenueGrowth?.toFixed(1) || '0'}%
              </div>
            </div>
          </div>

          <div className="swiggy-stat-card orders">
            <div className="stat-icon">📦</div>
            <div className="stat-content">
              <div className="stat-value">{stats.totalOrders || '0'}</div>
              <div className="stat-label">Total Orders</div>
              <div className={`stat-change ${stats.ordersGrowth >= 0 ? 'positive' : 'negative'}`}>
                <span className="change-icon">{stats.ordersGrowth >= 0 ? '↗️' : '↘️'}</span>
                {stats.ordersGrowth > 0 ? '+' : ''}{stats.ordersGrowth?.toFixed(1) || '0'}%
              </div>
            </div>
          </div>

          <div className="swiggy-stat-card products">
            <div className="stat-icon">🛍️</div>
            <div className="stat-content">
              <div className="stat-value">{products.active || '0'}</div>
              <div className="stat-label">Active Products</div>
              <div className="stat-subtitle">{products.total || '0'} total products</div>
            </div>
          </div>

          <div className="swiggy-stat-card rating">
            <div className="stat-icon">⭐</div>
            <div className="stat-content">
              <div className="stat-value">{stats.avgProductRating?.toFixed(1) || '0.0'}</div>
              <div className="stat-label">Avg. Rating</div>
              <div className="stat-subtitle">{stats.totalReviews || '0'} reviews</div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="swiggy-main-grid">
          {/* Left Column */}
          <div className="swiggy-main-content">
            {/* Sales Chart Card */}
            <div className="swiggy-card swiggy-chart-card">
              <div className="swiggy-card-header">
                <div className="card-title">
                  <h3>📈 Sales Overview</h3>
                  <p>Revenue and order trends</p>
                </div>
                <div className="chart-legend">
                  <div className="legend-item">
                    <span className="legend-dot revenue"></span>
                    Revenue
                  </div>
                  <div className="legend-item">
                    <span className="legend-dot orders"></span>
                    Orders
                  </div>
                </div>
              </div>
              <div className="swiggy-card-body">
                <SalesChart data={salesData} dateRange={dateRange} />
              </div>
            </div>

            {/* Product Performance */}
            <div className="swiggy-card">
              <div className="swiggy-card-header">
                <div className="card-title">
                  <h3>🚀 Product Performance</h3>
                  <p>Your best performing products</p>
                </div>
                <Link to="/supplier/products" className="swiggy-link">View All →</Link>
              </div>
              <div className="swiggy-card-body">
                {products.total > 0 ? (
                  <div className="swiggy-product-list">
                    {/* This would be populated with actual product data */}
                    <div className="swiggy-product-item">
                      <div className="product-info">
                        <div className="product-name">Sample Product</div>
                        <div className="product-stats">125 views • 12 orders</div>
                      </div>
                      <div className="product-rating">
                        <span className="rating-value">4.5</span>
                        <span className="rating-stars">⭐</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="swiggy-empty-state">
                    <div className="empty-icon">📦</div>
                    <p>No products yet</p>
                    <Link to="/supplier/products" className="swiggy-btn swiggy-btn-outline swiggy-btn-small">
                      Add Products
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="swiggy-sidebar">
            {/* Quick Actions */}
            <div className="swiggy-card swiggy-quick-actions">
              <div className="swiggy-card-header">
                <div className="card-title">
                  <h3>⚡ Quick Actions</h3>
                  <p>Manage your business</p>
                </div>
              </div>
              <div className="swiggy-card-body">
                <div className="swiggy-action-grid">
                  <Link to="/supplier/products" className="swiggy-action-item">
                    <div className="action-icon">💰</div>
                    <span>My Products</span>
                  </Link>
                  <Link to="/supplier/orders" className="swiggy-action-item">
                    <div className="action-icon">📋</div>
                    <span>Orders</span>
                  </Link>
                  <Link to="/supplier/profile" className="swiggy-action-item">
                    <div className="action-icon">👤</div>
                    <span>Profile</span>
                  </Link>
                  <Link to="/settings" className="swiggy-action-item">
                    <div className="action-icon">⚙️</div>
                    <span>Settings</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Product Overview */}
            <div className="swiggy-card">
              <div className="swiggy-card-header">
                <div className="card-title">
                  <h3>📊 Product Summary</h3>
                </div>
              </div>
              <div className="swiggy-card-body">
                <div className="swiggy-summary-grid">
                  <div className="summary-item">
                    <div className="summary-number">{products.total || '0'}</div>
                    <div className="summary-label">Total</div>
                  </div>
                  <div className="summary-item active">
                    <div className="summary-number">{products.active || '0'}</div>
                    <div className="summary-label">Active</div>
                  </div>
                  <div className="summary-item pending">
                    <div className="summary-number">{products.pending || '0'}</div>
                    <div className="summary-label">Pending</div>
                  </div>
                  <div className="summary-item inactive">
                    <div className="summary-number">{products.inactive || '0'}</div>
                    <div className="summary-label">Inactive</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Business Tips */}
            <div className="swiggy-card swiggy-tips">
              <div className="swiggy-card-header">
                <div className="card-title">
                  <h3>💡 Business Tips</h3>
                </div>
              </div>
              <div className="swiggy-card-body">
                <div className="swiggy-tip-item">
                  <div className="tip-icon">📸</div>
                  <div className="tip-content">
                    <strong>Add quality photos</strong>
                    <p>Products with good photos get 3x more orders</p>
                  </div>
                </div>
                <div className="swiggy-tip-item">
                  <div className="tip-icon">⚡</div>
                  <div className="tip-content">
                    <strong>Quick delivery wins</strong>
                    <p>Faster delivery times improve customer satisfaction</p>
                  </div>
                </div>
                <div className="swiggy-tip-item">
                  <div className="tip-icon">💬</div>
                  <div className="tip-content">
                    <strong>Respond to reviews</strong>
                    <p>Engaging with customers builds trust</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SupplierDashboardPage