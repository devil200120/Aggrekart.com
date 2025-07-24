import React, { useState, useMemo } from 'react'
import { useQuery } from 'react-query'
import { usersAPI, ordersAPI, loyaltyAPI } from '../../services/api'
import LoadingSpinner from '../common/LoadingSpinner'
import './UserAnalytics.css'

const UserAnalytics = ({ user }) => {
  const [timeRange, setTimeRange] = useState('3months') // 1month, 3months, 6months, 1year, all

  // Fetch user dashboard data
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery(
    ['userDashboard', timeRange],
    () => usersAPI.getDashboard({ timeRange }),
    {
      staleTime: 300000, // 5 minutes
    }
  )

  // Fetch order analytics
  const { data: orderAnalytics, isLoading: ordersLoading } = useQuery(
    ['userOrderAnalytics', timeRange],
    () => ordersAPI.getOrderHistory({ analytics: true, timeRange }),
    {
      staleTime: 300000,
    }
  )

  // Fetch loyalty data
  const { data: loyaltyData, isLoading: loyaltyLoading } = useQuery(
    'userLoyaltyAnalytics',
    loyaltyAPI.getMyCoins,
    {
      staleTime: 60000, // 1 minute
    }
  )

  const isLoading = dashboardLoading || ordersLoading || loyaltyLoading

  // Calculate analytics from order data
  const analytics = useMemo(() => {
    if (!orderAnalytics?.orders) return null

    const orders = orderAnalytics.orders
    const totalSpent = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0)
    const completedOrders = orders.filter(order => order.status === 'delivered')
    const averageOrderValue = totalSpent / (orders.length || 1)
    
    // Monthly spending
    const monthlySpending = {}
    orders.forEach(order => {
      const month = new Date(order.createdAt).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short' 
      })
      monthlySpending[month] = (monthlySpending[month] || 0) + order.totalAmount
    })

    // Top categories
    const categorySpending = {}
    orders.forEach(order => {
      order.items?.forEach(item => {
        const category = item.product?.category || 'Other'
        categorySpending[category] = (categorySpending[category] || 0) + item.totalPrice
      })
    })

    // Most bought products
    const productCounts = {}
    orders.forEach(order => {
      order.items?.forEach(item => {
        const productName = item.product?.name || 'Unknown'
        productCounts[productName] = (productCounts[productName] || 0) + item.quantity
      })
    })

    return {
      totalOrders: orders.length,
      completedOrders: completedOrders.length,
      totalSpent,
      averageOrderValue,
      monthlySpending: Object.entries(monthlySpending).slice(-6), // Last 6 months
      topCategories: Object.entries(categorySpending)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5),
      topProducts: Object.entries(productCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5),
      savingsFromMembership: totalSpent * 0.05 * (user?.membershipTier === 'gold' ? 2 : user?.membershipTier === 'platinum' ? 3 : 1)
    }
  }, [orderAnalytics, user])

  if (isLoading) {
    return (
      <div className="analytics-loading">
        <LoadingSpinner />
        <p>Loading your analytics...</p>
      </div>
    )
  }

  return (
    <div className="user-analytics">
      {/* Time Range Selector */}
      <div className="analytics-header">
        <h2 className="analytics-title">📊 Your Analytics Dashboard</h2>
        <div className="time-range-selector">
          <label>Time Period:</label>
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

      {/* Key Metrics Cards */}
      <div className="metrics-grid">
        <div className="metric-card spending">
          <div className="metric-icon">💰</div>
          <div className="metric-content">
            <h3>Total Spent</h3>
            <div className="metric-value">₹{analytics?.totalSpent?.toLocaleString() || 0}</div>
            <div className="metric-subtitle">Across {analytics?.totalOrders || 0} orders</div>
          </div>
        </div>

        <div className="metric-card orders">
          <div className="metric-icon">📦</div>
          <div className="metric-content">
            <h3>Orders Placed</h3>
            <div className="metric-value">{analytics?.totalOrders || 0}</div>
            <div className="metric-subtitle">
              {analytics?.completedOrders || 0} completed
            </div>
          </div>
        </div>

        <div className="metric-card average">
          <div className="metric-icon">📈</div>
          <div className="metric-content">
            <h3>Avg Order Value</h3>
            <div className="metric-value">₹{analytics?.averageOrderValue?.toLocaleString() || 0}</div>
            <div className="metric-subtitle">Per order</div>
          </div>
        </div>

        <div className="metric-card loyalty">
          <div className="metric-icon">🏆</div>
          <div className="metric-content">
            <h3>AggreCoins</h3>
            <div className="metric-value">{loyaltyData?.currentBalance || 0}</div>
            <div className="metric-subtitle">
              {user?.membershipTier || 'Silver'} Member
            </div>
          </div>
        </div>

        <div className="metric-card savings">
          <div className="metric-icon">💎</div>
          <div className="metric-content">
            <h3>Membership Savings</h3>
            <div className="metric-value">₹{analytics?.savingsFromMembership?.toLocaleString() || 0}</div>
            <div className="metric-subtitle">From discounts</div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        {/* Monthly Spending Chart */}
        <div className="chart-card">
          <h3 className="chart-title">📊 Monthly Spending Trend</h3>
          <div className="spending-chart">
            {analytics?.monthlySpending?.map(([month, amount]) => (
              <div key={month} className="spending-bar">
                <div 
                  className="bar"
                  style={{
                    height: `${(amount / Math.max(...analytics.monthlySpending.map(([,amt]) => amt))) * 100}%`
                  }}
                  title={`₹${amount.toLocaleString()}`}
                ></div>
                <div className="bar-label">{month}</div>
                <div className="bar-value">₹{amount.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Categories */}
        <div className="chart-card">
          <h3 className="chart-title">🏗️ Top Categories</h3>
          <div className="category-list">
            {analytics?.topCategories?.map(([category, amount], index) => (
              <div key={category} className="category-item">
                <div className="category-info">
                  <span className="category-rank">#{index + 1}</span>
                  <span className="category-name">{category}</span>
                </div>
                <div className="category-amount">₹{amount.toLocaleString()}</div>
                <div 
                  className="category-bar"
                  style={{
                    width: `${(amount / analytics.topCategories[0][1]) * 100}%`
                  }}
                ></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Insights */}
      <div className="insights-section">
        {/* Most Bought Products */}
        <div className="insight-card">
          <h3 className="insight-title">🔥 Most Bought Products</h3>
          <div className="product-list">
            {analytics?.topProducts?.map(([product, quantity], index) => (
              <div key={product} className="product-item">
                <div className="product-rank">#{index + 1}</div>
                <div className="product-name">{product}</div>
                <div className="product-quantity">{quantity} units</div>
              </div>
            ))}
          </div>
        </div>

        {/* Membership Progress */}
        <div className="insight-card">
          <h3 className="insight-title">🏆 Membership Progress</h3>
          <div className="membership-progress">
            <div className="current-tier">
              <div className="tier-badge">
                {user?.membershipTier === 'platinum' ? '💎' : 
                 user?.membershipTier === 'gold' ? '🥇' : '🥈'}
              </div>
              <div className="tier-info">
                <h4>{user?.membershipTier?.toUpperCase() || 'SILVER'} MEMBER</h4>
                <p>
                  {user?.membershipTier === 'platinum' ? 'Maximum benefits unlocked!' :
                   user?.membershipTier === 'gold' ? 'Upgrade to Platinum for maximum benefits' :
                   'Keep spending to unlock Gold benefits'}
                </p>
              </div>
            </div>
            
            {user?.membershipTier !== 'platinum' && (
              <div className="next-tier-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{
                      width: `${Math.min((analytics?.totalSpent || 0) / (user?.membershipTier === 'silver' ? 50000 : 100000) * 100, 100)}%`
                    }}
                  ></div>
                </div>
                <p className="progress-text">
                  ₹{((user?.membershipTier === 'silver' ? 50000 : 100000) - (analytics?.totalSpent || 0)).toLocaleString()} more to {user?.membershipTier === 'silver' ? 'Gold' : 'Platinum'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* AggreCoins Activity */}
        <div className="insight-card">
          <h3 className="insight-title">🪙 AggreCoins Activity</h3>
          <div className="coins-summary">
            <div className="coins-stat">
              <div className="coins-label">Current Balance</div>
              <div className="coins-value">{loyaltyData?.currentBalance || 0}</div>
            </div>
            <div className="coins-stat">
              <div className="coins-label">Total Earned</div>
              <div className="coins-value">{loyaltyData?.totalEarned || 0}</div>
            </div>
            <div className="coins-stat">
              <div className="coins-label">Total Redeemed</div>
              <div className="coins-value">{loyaltyData?.totalRedeemed || 0}</div>
            </div>
          </div>
          <div className="coins-actions">
            <button className="btn btn-primary">Redeem Coins</button>
            <button className="btn btn-outline">Refer Friends</button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3 className="actions-title">⚡ Quick Actions</h3>
        <div className="actions-grid">
          <button className="action-btn">
            <span className="action-icon">🛍️</span>
            <span className="action-text">Reorder Favorites</span>
          </button>
          <button className="action-btn">
            <span className="action-icon">📊</span>
            <span className="action-text">Download Report</span>
          </button>
          <button className="action-btn">
            <span className="action-icon">🎯</span>
            <span className="action-text">Set Budget Goals</span>
          </button>
          <button className="action-btn">
            <span className="action-icon">💰</span>
            <span className="action-text">Track Savings</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default UserAnalytics