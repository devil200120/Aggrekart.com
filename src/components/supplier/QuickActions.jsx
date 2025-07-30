import React from 'react'
import { Link } from 'react-router-dom'
import './QuickActions.css'

const QuickActions = () => {
  const actions = [
    {
      id: 'add-product',
      title: 'Add Product',
      description: 'List a new product in your catalog',
      icon: '➕',
      link: '/supplier/products/add',
      className: 'add-product'
    },
    {
      id: 'manage-orders',
      title: 'Manage Orders',
      description: 'View and process customer orders',
      icon: '📦',
      link: '/supplier/orders',
      className: 'manage-orders'
    },
    {
      id: 'inventory',
      title: 'Inventory',
      description: 'Manage stock levels and updates',
      icon: '📊',
      link: '/supplier/inventory',
      className: 'inventory'
    },
    {
      id: 'analytics',
      title: 'Analytics',
      description: 'View sales reports and insights',
      icon: '📈',
      link: '/supplier/analytics',
      className: 'analytics'
    },
    {
      id: 'profile',
      title: 'Profile',
      description: 'Update business information',
      icon: '👤',
      link: '/supplier/profile',
      className: 'profile'
    },
    {
      id: 'settings',
      title: 'Settings',
      description: 'Configure account preferences',
      icon: '⚙️',
      link: '/supplier/settings',
      className: 'settings'
    }
  ]

  return (
    <div className="quick-actions">
      <div className="actions-header">
        <h3 className="actions-title">Quick Actions</h3>
      </div>
      
      <div className="actions-grid">
        {actions.map((action) => (
          <Link
            key={action.id}
            to={action.link}
            className={`action-card ${action.className}`}
          >
            <div className="action-icon">
              {action.icon}
            </div>
            <h4 className="action-title">{action.title}</h4>
            <p className="action-description">{action.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default QuickActions