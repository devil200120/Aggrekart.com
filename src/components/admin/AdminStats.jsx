import React from 'react'
import { useNavigate } from 'react-router-dom'
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
  const navigate = useNavigate()

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

  const handleCardClick = (cardId) => {
    switch (cardId) {
      case 'total-users':
        navigate('/admin/users')
        break
      case 'active-suppliers':
        navigate('/admin/suppliers')
        break
      case 'total-orders':
        navigate('/admin/orders')
        break
      case 'total-revenue':
        navigate('/admin/reports?tab=revenue')
        break
      case 'pending-approvals':
        navigate('/admin/approvals')
        break
      case 'monthly-revenue':
        navigate('/admin/reports?tab=monthly')
        break
      case 'active-products':
        navigate('/admin/products')
        break
      case 'platform-commission':
        navigate('/admin/reports?tab=commission')
        break
      default:
        console.log('No navigation defined for:', cardId)
    }
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
      format: 'number',
      description: 'Click to manage users'
    },
    {
      id: 'active-suppliers',
      title: 'Active Suppliers',
      value: stats?.activeSuppliers || 0,
      change: stats?.supplierGrowth || 0,
      icon: Store,
      color: 'green',
      format: 'number',
      description: 'Click to view suppliers'
    },
    {
      id: 'total-orders',
      title: 'Total Orders',
      value: stats?.totalOrders || 0,
      change: stats?.orderGrowth || 0,
      icon: ShoppingBag,
      color: 'purple',
      format: 'number',
      description: 'Click to view all orders'
    },
    {
      id: 'total-revenue',
      title: 'Total Revenue',
      value: stats?.totalRevenue || 0,
      change: stats?.revenueGrowth || 0,
      icon: DollarSign,
      color: 'orange',
      format: 'currency',
      description: 'Click to view revenue reports'
    },
    {
      id: 'pending-approvals',
      title: 'Pending Approvals',
      value: stats?.pendingApprovals || 0,
      change: stats?.approvalChange || 0,
      icon: AlertTriangle,
      color: 'yellow',
      format: 'number',
      urgent: (stats?.pendingApprovals || 0) > 10,
      description: 'Click to review approvals'
    },
    {
      id: 'monthly-revenue',
      title: 'Monthly Revenue',
      value: stats?.monthlyRevenue || 0,
      change: stats?.monthlyGrowth || 0,
      icon: TrendingUp,
      color: 'teal',
      format: 'currency',
      description: 'Click to view monthly reports'
    },
    {
      id: 'active-products',
      title: 'Active Products',
      value: stats?.activeProducts || 0,
      change: stats?.productGrowth || 0,
      icon: CheckCircle,
      color: 'indigo',
      format: 'number',
      description: 'Click to manage products'
    },
    {
      id: 'platform-commission',
      title: 'Platform Commission',
      value: stats?.platformCommission || 0,
      change: stats?.commissionGrowth || 0,
      icon: DollarSign,
      color: 'pink',
      format: 'currency',
      description: 'Click to view commission reports'
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
            className={`stat-card ${stat.color} ${stat.urgent ? 'urgent' : ''} clickable`}
            onClick={() => handleCardClick(stat.id)}
            role="button"
            tabIndex={0}
            title={stat.description}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleCardClick(stat.id)
              }
            }}
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

            {/* Hover indicator */}
            <div className="click-indicator">
              <span className="click-icon">→</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default AdminStats