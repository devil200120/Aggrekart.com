import React, { useState } from 'react'
import { useQuery } from 'react-query'
import { useAuth } from '../../context/AuthContext'
import { supplierAPI } from '../../services/api'
import DashboardStats from '../../components/supplier/DashboardStats'
import RecentOrders from '../../components/supplier/RecentOrders'
import ProductPerformance from '../../components/supplier/ProductPerformance'
import SalesChart from '../../components/supplier/SalesChart'
import QuickActions from '../../components/supplier/QuickActions'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import './SupplierDashboardPage.css'

const SupplierDashboardPage = () => {
  const { user } = useAuth()
  const [dateRange, setDateRange] = useState('30') // days

  // Fetch dashboard data
  const { data: dashboardData, isLoading, error } = useQuery(
    ['supplier-dashboard', user?.id, dateRange],
    () => supplierAPI.getDashboardData({ days: dateRange }),
    {
      enabled: !!user && user.role === 'supplier',
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  )

  // Fetch recent orders
  const { data: recentOrders } = useQuery(
    ['supplier-recent-orders', user?.id],
    () => supplierAPI.getOrders({ limit: 5, status: 'recent' }),
    {
      enabled: !!user && user.role === 'supplier',
      staleTime: 2 * 60 * 1000, // 2 minutes
    }
  )

  // Fetch product performance
  const { data: productPerformance } = useQuery(
    ['supplier-product-performance', user?.id, dateRange],
    () => supplierAPI.getProductAnalytics({ days: dateRange }),
    {
      enabled: !!user && user.role === 'supplier',
      staleTime: 10 * 60 * 1000, // 10 minutes
    }
  )

  if (!user || user.role !== 'supplier') {
    return (
      <div className="supplier-dashboard-page">
        <div className="container">
          <div className="access-denied">
            <h2>Access Denied</h2>
            <p>Only suppliers can access this dashboard</p>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="supplier-dashboard-page">
        <div className="container">
          <LoadingSpinner size="large" text="Loading dashboard..." />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="supplier-dashboard-page">
        <div className="container">
          <div className="dashboard-error">
            <h2>Something went wrong</h2>
            <p>Unable to load dashboard data. Please try again.</p>
          </div>
        </div>
      </div>
    )
  }

  const stats = dashboardData?.stats || {
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    averageOrderValue: 0,
    revenueGrowth: 0,
    ordersGrowth: 0,
    productsGrowth: 0,
    aovGrowth: 0
  }

  return (
    <div className="supplier-dashboard-page">
      <div className="container">
        {/* Dashboard Header */}
        <div className="dashboard-header">
          <div className="header-content">
            <h1>Supplier Dashboard</h1>
            <p>Welcome back, {user.businessName || user.name}!</p>
          </div>
          
          <div className="header-actions">
            <div className="date-range-selector">
              <label htmlFor="dateRange">Time Period:</label>
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
          </div>
        </div>

        {/* Dashboard Stats */}
        <DashboardStats stats={stats} />

        {/* Dashboard Grid */}
        <div className="dashboard-grid">
          {/* Left Column */}
          <div className="dashboard-main">
            {/* Sales Chart */}
            <div className="dashboard-card">
              <div className="card-header">
                <h2>Sales Overview</h2>
                <p>Revenue trends over time</p>
              </div>
              <SalesChart 
                data={dashboardData?.salesData || []} 
                dateRange={dateRange}
              />
            </div>

            {/* Recent Orders */}
            <div className="dashboard-card">
              <div className="card-header">
                <h2>Recent Orders</h2>
                <p>Latest orders from customers</p>
              </div>
              <RecentOrders orders={recentOrders?.orders || []} />
            </div>
          </div>

          {/* Right Column */}
          <div className="dashboard-sidebar">
            {/* Quick Actions */}
            <QuickActions />

            {/* Product Performance */}
            <div className="dashboard-card">
              <div className="card-header">
                <h2>Top Products</h2>
                <p>Best performing products</p>
              </div>
              <ProductPerformance 
                products={productPerformance?.topProducts || []} 
              />
            </div>

            {/* Business Insights */}
            <div className="dashboard-card">
              <div className="card-header">
                <h2>Business Insights</h2>
                <p>Key metrics and recommendations</p>
              </div>
              <div className="insights-content">
                <div className="insight-item">
                  <div className="insight-icon">📈</div>
                  <div className="insight-text">
                    <h4>Sales Trend</h4>
                    <p>
                      {stats.revenueGrowth >= 0 ? 'Revenue is growing' : 'Revenue needs attention'}
                      {' '}({stats.revenueGrowth > 0 ? '+' : ''}{stats.revenueGrowth?.toFixed(1)}%)
                    </p>
                  </div>
                </div>

                <div className="insight-item">
                  <div className="insight-icon">🛒</div>
                  <div className="insight-text">
                    <h4>Order Volume</h4>
                    <p>
                      {stats.ordersGrowth >= 0 ? 'Orders are increasing' : 'Orders are declining'}
                      {' '}({stats.ordersGrowth > 0 ? '+' : ''}{stats.ordersGrowth?.toFixed(1)}%)
                    </p>
                  </div>
                </div>

                <div className="insight-item">
                  <div className="insight-icon">💰</div>
                  <div className="insight-text">
                    <h4>Average Order</h4>
                    <p>
                      Order value is {stats.aovGrowth >= 0 ? 'improving' : 'decreasing'}
                      {' '}({stats.aovGrowth > 0 ? '+' : ''}{stats.aovGrowth?.toFixed(1)}%)
                    </p>
                  </div>
                </div>

                <div className="insight-item">
                  <div className="insight-icon">📦</div>
                  <div className="insight-text">
                    <h4>Product Catalog</h4>
                    <p>
                      You have {stats.totalProducts} products listed
                      {stats.totalProducts < 10 && ' (Consider adding more products)'}
                    </p>
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