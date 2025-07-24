/* 
FILE: c:\Users\KIIT0001\Desktop\builder_website using mern\front-end\app\src\components\admin\AdminStats.jsx
LINES: 1-100
PURPOSE: Admin dashboard statistics cards with real-time data
*/

import React from 'react'
import { 
  Users, 
  Store, 
  ShoppingBag, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle 
} from 'lucide-react'
import './AdminStats.css'

const AdminStats = ({ stats, loading }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatNumber = (number) => {
    return new Intl.NumberFormat('en-IN').format(number)
  }

  const formatPercentage = (value) => {
    const sign = value >= 0 ? '+' : ''
    return `${sign}${value.toFixed(1)}%`
  }

  if (loading) {
    return (
      <div className="admin-stats">
        {[...Array(8)].map((_, index) => (
          <div key={index} className="stat-card loading">
            <div className="stat-icon loading-shimmer"></div>
            <div className="stat-content">
              <div className="stat-value loading-shimmer"></div>
              <div className="stat-label loading-shimmer"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const statCards = [
    {
      id: 'total-users',
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      change: stats?.userGrowth || 0,
      icon: Users,
      color: 'blue',
      format: 'number'
    },
    {
      id: 'active-suppliers',
      title: 'Active Suppliers',
      value: stats?.activeSuppliers || 0,
      change: stats?.supplierGrowth || 0,
      icon: Store,
      color: 'green',
      format: 'number'
    },
    {
      id: 'total-orders',
      title: 'Total Orders',
      value: stats?.totalOrders || 0,
      change: stats?.orderGrowth || 0,
      icon: ShoppingBag,
      color: 'purple',
      format: 'number'
    },
    {
      id: 'total-revenue',
      title: 'Total Revenue',
      value: stats?.totalRevenue || 0,
      change: stats?.revenueGrowth || 0,
      icon: DollarSign,
      color: 'orange',
      format: 'currency'
    },
    {
      id: 'pending-approvals',
      title: 'Pending Approvals',
      value: stats?.pendingApprovals || 0,
      change: stats?.approvalChange || 0,
      icon: AlertTriangle,
      color: 'yellow',
      format: 'number',
      urgent: (stats?.pendingApprovals || 0) > 10
    },
    {
      id: 'monthly-revenue',
      title: 'Monthly Revenue',
      value: stats?.monthlyRevenue || 0,
      change: stats?.monthlyGrowth || 0,
      icon: TrendingUp,
      color: 'teal',
      format: 'currency'
    },
    {
      id: 'active-products',
      title: 'Active Products',
      value: stats?.activeProducts || 0,
      change: stats?.productGrowth || 0,
      icon: CheckCircle,
      color: 'indigo',
      format: 'number'
    },
    {
      id: 'platform-commission',
      title: 'Platform Commission',
      value: stats?.platformCommission || 0,
      change: stats?.commissionGrowth || 0,
      icon: DollarSign,
      color: 'pink',
      format: 'currency'
    }
  ]

  return (
    <div className="admin-stats">
      {statCards.map((stat) => {
        const IconComponent = stat.icon
        const isPositive = stat.change >= 0
        const formatValue = stat.format === 'currency' ? formatCurrency : formatNumber

        return (
          <div 
            key={stat.id} 
            className={`stat-card ${stat.color} ${stat.urgent ? 'urgent' : ''}`}
          >
            <div className="stat-icon">
              <IconComponent size={24} />
            </div>
            
            <div className="stat-content">
              <div className="stat-value">
                {formatValue(stat.value)}
              </div>
              <div className="stat-label">
                {stat.title}
              </div>
              
              {stat.change !== undefined && (
                <div className={`stat-change ${isPositive ? 'positive' : 'negative'}`}>
                  {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  <span>{formatPercentage(stat.change)}</span>
                </div>
              )}
            </div>

            {stat.urgent && (
              <div className="urgent-indicator">
                <AlertTriangle size={16} />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default AdminStats