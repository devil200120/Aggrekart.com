import React from 'react'
import './DashboardStats.css'

const DashboardStats = ({ stats }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0)
  }

  const formatNumber = (number) => {
    return new Intl.NumberFormat('en-IN').format(number || 0)
  }

  const formatPercentage = (percentage) => {
    if (!percentage || percentage === 0) return '0%'
    const sign = percentage > 0 ? '+' : ''
    return `${sign}${percentage.toFixed(1)}%`
  }

  const getGrowthClass = (growth) => {
    if (growth > 0) return 'positive'
    if (growth < 0) return 'negative'
    return 'neutral'
  }

  const getGrowthIcon = (growth) => {
    if (growth > 0) return '📈'
    if (growth < 0) return '📉'
    return '➡️'
  }

  const statsData = [
    {
      title: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      growth: stats.revenueGrowth,
      icon: '💰',
      color: 'revenue',
      description: 'Total earnings from sales'
    },
    {
      title: 'Total Orders',
      value: formatNumber(stats.totalOrders),
      growth: stats.ordersGrowth,
      icon: '📦',
      color: 'orders',
      description: 'Number of completed orders'
    },
    {
      title: 'Active Products',
      value: formatNumber(stats.totalProducts),
      growth: stats.productsGrowth,
      icon: '🏗️',
      color: 'products',
      description: 'Products in your catalog'
    },
    {
      title: 'Avg Order Value',
      value: formatCurrency(stats.averageOrderValue),
      growth: stats.aovGrowth,
      icon: '📊',
      color: 'aov',
      description: 'Average revenue per order'
    }
  ]

  return (
    <div className="dashboard-stats">
      <div className="stats-grid">
        {statsData.map((stat, index) => (
          <div key={index} className={`stat-card ${stat.color}`}>
            <div className="stat-header">
              <div className="stat-icon">{stat.icon}</div>
              <div className="stat-growth">
                <span className={`growth-indicator ${getGrowthClass(stat.growth)}`}>
                  <span className="growth-icon">{getGrowthIcon(stat.growth)}</span>
                  <span className="growth-text">{formatPercentage(stat.growth)}</span>
                </span>
              </div>
            </div>
            
            <div className="stat-content">
              <div className="stat-value">{stat.value}</div>
              <div className="stat-title">{stat.title}</div>
              <div className="stat-description">{stat.description}</div>
            </div>

            <div className="stat-footer">
              <span className="stat-period">vs. previous period</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default DashboardStats
