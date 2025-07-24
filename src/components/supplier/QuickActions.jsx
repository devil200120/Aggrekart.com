import React from 'react'
import { Link } from 'react-router-dom'
import './QuickActions.css'

const QuickActions = () => {
  const actions = [
    {
      title: 'Add New Product',
      description: 'List a new product in your catalog',
      icon: '➕',
      link: '/supplier/products/add',
      color: 'green'
    },
    {
      title: 'Manage Orders',
      description: 'View and update order status',
      icon: '📋',
      link: '/supplier/orders',
      color: 'blue'
    },
    {
      title: 'Update Inventory',
      description: 'Manage stock levels',
      icon: '📦',
      link: '/supplier/inventory',
      color: 'orange'
    },
    {
      title: 'View Analytics',
      description: 'Detailed sales reports',
      icon: '📊',
      link: '/supplier/analytics',
      color: 'purple'
    },
    {
      title: 'Profile Settings',
      description: 'Update business information',
      icon: '⚙️',
      link: '/supplier/profile',
      color: 'gray'
    },
    {
      title: 'Support Center',
      description: 'Get help and support',
      icon: '🆘',
      link: '/supplier/support',
      color: 'red'
    }
  ]

  return (
    <div className="quick-actions">
      <div className="actions-header">
        <h2>Quick Actions</h2>
        <p>Common tasks and shortcuts</p>
      </div>
      
      <div className="actions-grid">
        {actions.map((action, index) => (
          <Link 
            key={index}
            to={action.link}
            className={`action-card ${action.color}`}
          >
            <div className="action-icon">{action.icon}</div>
            <div className="action-content">
              <h3>{action.title}</h3>
              <p>{action.description}</p>
            </div>
            <div className="action-arrow">→</div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default QuickActions