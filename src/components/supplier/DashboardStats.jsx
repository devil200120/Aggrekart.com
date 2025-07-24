import React from 'react'
import './DashboardStats.css'

const DashboardStats = ({ stats }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatNumber = (number) => {
    return new Intl.NumberFormat('en-IN').format(number)
  }

  const formatPercentage = (percentage) => {
    if (percentage === 0) return '0%'
    const sign = percentage > 0 ? '+' : ''
    return `${sign}${percentage.toFixed(1)}%`
  }

  const getGrowthClass = (growth) => {
    if (growth > 0) return 'positive'
    if (growth < 0) return 'negative'
    return 'neutral'
  }

  const statsData = [
    {
      title: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      growth: stats.revenueGrowth,
      icon: '💰',
      color: 'green'
    },
    {
      title: 'Total Orders',
      value: formatNumber(stats.totalOrders),
      growth: stats.ordersGrowth,
      icon: '📦',
      color: 'blue'
    },
    {
      title: 'Total Products',
      value: formatNumber(stats.totalProducts),
      growth: stats.productsGrowth,
      icon: '🏗️',
      color: 'purple'
    },
    {
      title: 'Avg Order Value',
      value: formatCurrency(stats.averageOrderValue),
      growth: stats.aovGrowth,
      icon: '📊',
      color: 'orange'
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
                  {stat.growth > 0 ? '📈' : stat.growth < 0 ? '📉' : '➡️'}
                  {formatPercentage(stat.growth)}
                </span>
              </div>
            </div>
            
            <div className="stat-content">
              <div className="stat-value">{stat.value}</div>
              <div className="stat-title">{stat.title}</div>
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