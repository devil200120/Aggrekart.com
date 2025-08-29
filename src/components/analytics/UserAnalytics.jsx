import React, { useState, useMemo } from 'react'
import { useQuery } from 'react-query'
import { usersAPI, ordersAPI, loyaltyAPI, supplierAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import LoadingSpinner from '../common/LoadingSpinner'
import './UserAnalytics.css'

const UserAnalytics = ({ user }) => {
  const { user: contextUser } = useAuth()
  const currentUser = user || contextUser
  const isSupplier = currentUser?.role === 'supplier'
  
  const [timeRange, setTimeRange] = useState('3months') // 1month, 3months, 6months, 1year, all

  // Helper function to convert time range to days
  const getDaysFromTimeRange = (range) => {
    switch(range) {
      case '1month': return 30
      case '3months': return 90
      case '6months': return 180
      case '1year': return 365
      case 'all': return 3650
      default: return 90
    }
  }

  // Supplier Analytics Queries
  const { data: supplierDashboard, isLoading: supplierDashboardLoading, error: supplierDashboardError } = useQuery(
    ['supplierDashboard', timeRange],
    () => supplierAPI.getDashboard({ days: getDaysFromTimeRange(timeRange) }),
    {
      enabled: isSupplier,
      staleTime: 300000,
      retry: 2,
      onError: (error) => {
        console.warn('Supplier dashboard API error:', error)
      }
    }
  )

  const { data: supplierAnalytics, isLoading: supplierAnalyticsLoading, error: supplierAnalyticsError } = useQuery(
    ['supplierAnalytics', timeRange],
    () => supplierAPI.getProductAnalytics({ period: getDaysFromTimeRange(timeRange) }),
    {
      enabled: isSupplier,
      staleTime: 300000,
      retry: 2,
      onError: (error) => {
        console.warn('Supplier analytics API error:', error)
      }
    }
  )

  // Regular User Analytics Queries
  const { data: dashboardData, isLoading: dashboardLoading, error: dashboardError } = useQuery(
    ['userDashboard', timeRange],
    () => usersAPI.getDashboard({ timeRange }),
    {
      enabled: !isSupplier,
      staleTime: 300000,
      retry: 2,
      onError: (error) => {
        console.warn('Dashboard API error:', error)
      }
    }
  )

  const { data: orderAnalytics, isLoading: ordersLoading, error: ordersError } = useQuery(
    ['userOrderAnalytics', timeRange],
    () => ordersAPI.getOrderHistory({ analytics: true, timeRange, limit: 100 }),
    {
      enabled: !isSupplier,
      staleTime: 300000,
      retry: 2,
      onError: (error) => {
        console.warn('Order analytics API error:', error)
      }
    }
  )

  const { data: loyaltyData, isLoading: loyaltyLoading, error: loyaltyError } = useQuery(
    'userLoyaltyAnalytics',
    loyaltyAPI.getMyCoins,
    {
      enabled: !isSupplier,
      staleTime: 60000,
      retry: 2,
      onError: (error) => {
        console.warn('Loyalty API error:', error)
      }
    }
  )

  const isLoading = isSupplier 
    ? (supplierDashboardLoading || supplierAnalyticsLoading)
    : (dashboardLoading || ordersLoading || loyaltyLoading)

  // Calculate analytics from available data
  const analytics = useMemo(() => {
    if (isSupplier) {
      // Supplier Analytics
      const dashboardStats = supplierDashboard?.data?.stats || {}
      const analyticsData = supplierAnalytics?.data || {}
      
      return {
        totalOrders: dashboardStats.totalOrders || 0,
        totalSpent: dashboardStats.totalRevenue || 0,
        averageOrderValue: dashboardStats.averageOrderValue || 0,
        completedOrders: dashboardStats.totalOrders || 0, // For suppliers, all orders are "completed" from their perspective
        monthlySpending: {},
        topCategories: [],
        recentActivity: supplierDashboard?.data?.products?.recent || []
      }
    } else {
      // Regular User Analytics
      const dashboardStats = dashboardData?.data?.stats || {}
      const orderAnalyticsData = orderAnalytics?.data?.analytics || {}
      const orders = orderAnalytics?.data?.orders || []

      const totalOrders = dashboardStats.totalOrders || orderAnalyticsData.totalOrders || orders.length || 0
      const totalSpent = dashboardStats.totalSpent || orderAnalyticsData.totalSpent || 0
      const completedOrders = dashboardStats.completedOrders || orderAnalyticsData.completedOrders || 0
      const averageOrderValue = dashboardStats.averageOrderValue || orderAnalyticsData.averageOrderValue || 
                                (totalOrders > 0 ? totalSpent / totalOrders : 0)

      const monthlySpending = orderAnalyticsData.monthlySpending || {}
      const topCategories = orderAnalyticsData.topCategories || []
      const recentActivity = dashboardData?.data?.recentOrders || orders.slice(0, 5) || []

      return {
        totalOrders,
        totalSpent,
        averageOrderValue,
        completedOrders,
        monthlySpending,
        topCategories,
        recentActivity
      }
    }
  }, [isSupplier, supplierDashboard, supplierAnalytics, dashboardData, orderAnalytics])

  if (isLoading) {
    return (
      <div className="user-analytics">
        <div className="analytics-loading">
          <LoadingSpinner />
          <p>Loading analytics...</p>
        </div>
      </div>
    )
  }

  // Different stats for suppliers vs customers
  const stats = isSupplier ? [
    {
      label: 'Total Orders',
      value: analytics.totalOrders,
      icon: '📦',
      color: '#667eea',
      description: 'Orders received from customers'
    },
    {
      label: 'Total Revenue',
      value: `₹${Math.round(analytics.totalSpent).toLocaleString()}`,
      icon: '💰',
      color: '#10b981',
      description: 'Total sales revenue'
    },
    {
      label: 'Average Order Value',
      value: `₹${Math.round(analytics.averageOrderValue).toLocaleString()}`,
      icon: '📊',
      color: '#f59e0b',
      description: 'Average order value'
    },
    {
      label: 'Active Orders',
      value: analytics.completedOrders,
      icon: '✅',
      color: '#06b6d4',
      description: 'Currently active orders'
    }
  ] : [
    {
      label: 'Total Orders',
      value: analytics.totalOrders,
      icon: '📦',
      color: '#667eea',
      description: 'All time orders placed'
    },
    {
      label: 'Total Spent',
      value: `₹${Math.round(analytics.totalSpent).toLocaleString()}`,
      icon: '💰',
      color: '#10b981',
      description: 'Total amount spent'
    },
    {
      label: 'Average Order',
      value: `₹${Math.round(analytics.averageOrderValue).toLocaleString()}`,
      icon: '📊',
      color: '#f59e0b',
      description: 'Average order value'
    },
    {
      label: 'Completed Orders',
      value: analytics.completedOrders,
      icon: '✅',
      color: '#06b6d4',
      description: 'Successfully delivered orders'
    }
  ]

  return (
    <div className="user-analytics">
      <div className="analytics-header">
        <h3>{isSupplier ? 'Supplier Analytics' : 'Analytics Overview'}</h3>
        <div className="time-range-selector">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="time-range-select"
          >
            <option value="1month">Last Month</option>
            <option value="3months">Last 3 Months</option>
            <option value="6months">Last 6 Months</option>
            <option value="1year">Last Year</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      <div className="analytics-stats">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card" style={{ borderLeftColor: stat.color }}>
            <div className="stat-icon" style={{ backgroundColor: `${stat.color}20`, color: stat.color }}>
              {stat.icon}
            </div>
            <div className="stat-content">
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
              <div className="stat-description">{stat.description}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity Section - Different for suppliers vs customers */}
      {analytics.recentActivity && analytics.recentActivity.length > 0 && (
        <div className="analytics-section">
          <h4>{isSupplier ? 'Recent Products' : 'Recent Orders'}</h4>
          <div className="recent-orders">
            {analytics.recentActivity.slice(0, 5).map((item, index) => (
              <div key={index} className="order-item">
                {isSupplier ? (
                  // Supplier: Show recent products
                  <>
                    <div className="order-info">
                      <span className="order-id">{item.name || `Product ${index + 1}`}</span>
                      <span className="order-supplier">{item.category || 'N/A'}</span>
                    </div>
                    <div className="order-details">
                      <span className="order-amount">₹{(item.pricing?.basePrice || 0).toLocaleString()}</span>
                      <span className={`order-status ${item.isActive ? 'status-active' : 'status-inactive'}`}>
                        {item.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </>
                ) : (
                  // Customer: Show recent orders
                  <>
                    <div className="order-info">
                      <span className="order-id">{item.orderId || `Order ${index + 1}`}</span>
                      <span className="order-supplier">{item.supplier || 'N/A'}</span>
                    </div>
                    <div className="order-details">
                      <span className="order-amount">₹{(item.totalAmount || item.pricing?.totalAmount || 0).toLocaleString()}</span>
                      <span className={`order-status status-${item.status}`}>{item.status || 'N/A'}</span>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Categories Section - Only for customers */}
      {!isSupplier && analytics.topCategories && analytics.topCategories.length > 0 && (
        <div className="analytics-section">
          <h4>Top Categories</h4>
          <div className="category-list">
            {analytics.topCategories.map((category, index) => (
              <div key={index} className="category-item">
                <span className="category-name">{category.name}</span>
                <span className="category-amount">₹{category.amount.toLocaleString()}</span>
                <div className="category-bar">
                  <div 
                    className="category-fill" 
                    style={{ 
                      width: `${(category.amount / analytics.topCategories[0].amount) * 100}%`,
                      backgroundColor: ['#667eea', '#10b981', '#f59e0b', '#06b6d4', '#8b5cf6'][index % 5]
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loyalty Overview Section - Only for customers */}
      {!isSupplier && loyaltyData?.data && !loyaltyError && (
        <div className="analytics-section">
          <h4>Loyalty Overview</h4>
          <div className="loyalty-stats">
            <div className="loyalty-item">
              <span className="loyalty-label">AggreCoins Balance</span>
              <span className="loyalty-value">{loyaltyData.data.balance || 0}</span>
            </div>
            <div className="loyalty-item">
              <span className="loyalty-label">Total Earned</span>
              <span className="loyalty-value">{loyaltyData.data.totalEarned || 0}</span>
            </div>
            <div className="loyalty-item">
              <span className="loyalty-label">Total Redeemed</span>
              <span className="loyalty-value">{loyaltyData.data.totalRedeemed || 0}</span>
            </div>
          </div>
        </div>
      )}

      {/* Error States */}
      {((isSupplier && supplierDashboardError && supplierAnalyticsError) || 
        (!isSupplier && dashboardError && ordersError)) && (
        <div className="analytics-section">
          <div className="analytics-unavailable">
            <div className="unavailable-message">
              <h4>📊 Analytics Temporarily Unavailable</h4>
              <p>We're working on bringing you detailed analytics. 
                {isSupplier ? ' Your data will show here once you receive some orders!' : ' Your data will show here once you place some orders!'}
              </p>
              {analytics.totalOrders === 0 && (
                <p><strong>{isSupplier ? 'Start selling to see your analytics!' : 'Start shopping to see your analytics!'}</strong></p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserAnalytics