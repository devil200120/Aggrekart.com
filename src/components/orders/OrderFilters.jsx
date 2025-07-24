import React from 'react'
import './OrderFilters.css'

const OrderFilters = ({ filters, onFilterChange, totalOrders }) => {
  const statusOptions = [
    { value: '', label: 'All Orders', count: totalOrders },
    { value: 'pending', label: 'Pending', count: 0 },
    { value: 'confirmed', label: 'Confirmed', count: 0 },
    { value: 'processing', label: 'Processing', count: 0 },
    { value: 'shipped', label: 'Shipped', count: 0 },
    { value: 'delivered', label: 'Delivered', count: 0 },
    { value: 'cancelled', label: 'Cancelled', count: 0 },
    { value: 'returned', label: 'Returned', count: 0 }
  ]

  const dateRangeOptions = [
    { value: '', label: 'All Time' },
    { value: 'last_7_days', label: 'Last 7 Days' },
    { value: 'last_30_days', label: 'Last 30 Days' },
    { value: 'last_3_months', label: 'Last 3 Months' },
    { value: 'last_6_months', label: 'Last 6 Months' },
    { value: 'last_year', label: 'Last Year' }
  ]

  const clearFilters = () => {
    onFilterChange('status', '')
    onFilterChange('dateRange', '')
  }

  const hasActiveFilters = filters.status || filters.dateRange

  return (
    <div className="order-filters">
      <div className="filters-header">
        <h3>Filter Orders</h3>
        {hasActiveFilters && (
          <button 
            onClick={clearFilters}
            className="clear-filters"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Order Status Filter */}
      <div className="filter-section">
        <h4>Order Status</h4>
        <div className="filter-options">
          {statusOptions.map((option) => (
            <label 
              key={option.value} 
              className={`filter-option ${filters.status === option.value ? 'active' : ''}`}
            >
              <input
                type="radio"
                name="status"
                value={option.value}
                checked={filters.status === option.value}
                onChange={(e) => onFilterChange('status', e.target.value)}
              />
              <span className="option-content">
                <span className="option-label">{option.label}</span>
                <span className="option-count">({option.count})</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="filter-section">
        <h4>Time Period</h4>
        <div className="filter-options">
          {dateRangeOptions.map((option) => (
            <label 
              key={option.value} 
              className={`filter-option ${filters.dateRange === option.value ? 'active' : ''}`}
            >
              <input
                type="radio"
                name="dateRange"
                value={option.value}
                checked={filters.dateRange === option.value}
                onChange={(e) => onFilterChange('dateRange', e.target.value)}
              />
              <span className="option-label">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="filter-section">
        <h4>Quick Actions</h4>
        <div className="quick-actions">
          <button 
            onClick={() => onFilterChange('status', 'delivered')}
            className="quick-action"
          >
            📦 Delivered Orders
          </button>
          <button 
            onClick={() => onFilterChange('status', 'pending')}
            className="quick-action"
          >
            ⏳ Pending Orders
          </button>
          <button 
            onClick={() => {
              onFilterChange('dateRange', 'last_30_days')
              onFilterChange('status', '')
            }}
            className="quick-action"
          >
            📅 Recent Orders
          </button>
        </div>
      </div>

      {/* Order Statistics */}
      <div className="filter-section">
        <h4>Order Statistics</h4>
        <div className="order-stats">
          <div className="stat-item">
            <span className="stat-label">Total Orders</span>
            <span className="stat-value">{totalOrders}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">This Month</span>
            <span className="stat-value">0</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total Spent</span>
            <span className="stat-value">₹0</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrderFilters