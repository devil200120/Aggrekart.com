import React, { useState, useMemo } from 'react'
import { useQuery } from 'react-query'
import { usersAPI, ordersAPI, loyaltyAPI } from '../../services/api'
import LoadingSpinner from '../common/LoadingSpinner'
import './UserAnalytics.css'

const UserAnalytics = ({ user }) => {
  const [timeRange, setTimeRange] = useState('3months') // 1month, 3months, 6months, 1year, all

  // Fetch user dashboard data with error handling
  const { data: dashboardData, isLoading: dashboardLoading, error: dashboardError } = useQuery(
    ['userDashboard', timeRange],
    () => usersAPI.getDashboard({ timeRange }),
    {
      staleTime: 300000, // 5 minutes
      retry: 2,
      onError: (error) => {
        console.warn('Dashboard API error:', error)
      }
    }
  )

  // Fetch order analytics with error handling
  const { data: orderAnalytics, isLoading: ordersLoading, error: ordersError } = useQuery(
    ['userOrderAnalytics', timeRange],
    () => ordersAPI.getOrderHistory({ analytics: true, timeRange, limit: 100 }),
    {
      staleTime: 300000,
      retry: 2,
      onError: (error) => {
        console.warn('Order analytics API error:', error)
      }
    }
  )

  // Fetch loyalty data with error handling
  const { data: loyaltyData, isLoading: loyaltyLoading, error: loyaltyError } = useQuery(
    'userLoyaltyAnalytics',
    loyaltyAPI.getMyCoins,
    {
      staleTime: 60000, // 1 minute
      retry: 2,
      onError: (error) => {
        console.warn('Loyalty API error:', error)
      }
    }
  )

  const isLoading = dashboardLoading || ordersLoading || loyaltyLoading

  // Calculate analytics from available data
  const analytics = useMemo(() => {
    // Try to get data from multiple sources
    const dashboardStats = dashboardData?.data?.stats || {};
    const orderAnalyticsData = orderAnalytics?.data?.analytics || {};
    const orders = orderAnalytics?.data?.orders || [];

    // Use dashboard data as primary source, order analytics as secondary
    const totalOrders = dashboardStats.totalOrders || orderAnalyticsData.totalOrders || orders.length || 0;
    const totalSpent = dashboardStats.totalSpent || orderAnalyticsData.totalSpent || 0;
    const completedOrders = dashboardStats.completedOrders || orderAnalyticsData.completedOrders || 0;
    const averageOrderValue = dashboardStats.averageOrderValue || orderAnalyticsData.averageOrderValue || 
                              (totalOrders > 0 ? totalSpent / totalOrders : 0);

    // Get other analytics data
    const monthlySpending = orderAnalyticsData.monthlySpending || {};
    const topCategories = orderAnalyticsData.topCategories || [];
    const recentActivity = dashboardData?.data?.recentOrders || orders.slice(0, 5) || [];

    return {
      totalOrders,
      totalSpent,
      averageOrderValue,
      completedOrders,
      monthlySpending,
      topCategories,
      recentActivity
    };
  }, [dashboardData, orderAnalytics])

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

  // Show analytics even if some APIs fail
  const stats = [
    {
      label: 'Total Orders',
      value: analytics.totalOrders,
      icon: '📦',
      color: '#667eea',
      description: 'All time orders placed'
    },
    {
      label: 'Total Spent',
      value: `₹${analytics.totalSpent.toLocaleString()}`,
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
        <h3>Analytics Overview</h3>
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

      {/* Recent Activity Section */}
      {analytics.recentActivity && analytics.recentActivity.length > 0 && (
        <div className="analytics-section">
          <h4>Recent Orders</h4>
          <div className="recent-orders">
            {analytics.recentActivity.slice(0, 5).map((order, index) => (
              <div key={index} className="order-item">
                <div className="order-info">
                  <span className="order-id">{order.orderId}</span>
                  <span className="order-supplier">{order.supplier}</span>
                </div>
                <div className="order-details">
                  <span className="order-amount">₹{(order.totalAmount || order.pricing?.totalAmount || 0).toLocaleString()}</span>
                  <span className={`order-status status-${order.status}`}>{order.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Categories Section */}
      {analytics.topCategories && analytics.topCategories.length > 0 && (
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

      {/* Loyalty Overview Section */}
      {loyaltyData?.data && !loyaltyError && (
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
      {dashboardError && ordersError && (
        <div className="analytics-section">
          <div className="analytics-unavailable">
            <div className="unavailable-message">
              <h4>📊 Analytics Temporarily Unavailable</h4>
              <p>We're working on bringing you detailed analytics. Your data will show here once you place some orders!</p>
              {analytics.totalOrders === 0 && (
                <p><strong>Start shopping to see your analytics!</strong></p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserAnalytics