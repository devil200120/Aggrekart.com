import React from 'react'
import { Link } from 'react-router-dom'
import './ProductPerformance.css'

const ProductPerformance = ({ products }) => {
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

  if (!products || products.length === 0) {
    return (
      <div className="product-performance">
        <div className="no-products">
          <div className="no-products-icon">🏗️</div>
          <h3>No Product Data</h3>
          <p>Add products to see performance metrics.</p>
          <Link to="/supplier/products/add" className="btn btn-primary btn-sm">
            Add Product
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="product-performance">
      <div className="products-list">
        {products.slice(0, 5).map((product, index) => (
          <div key={product._id} className="product-item">
            <div className="product-rank">
              <span className="rank-number">#{index + 1}</span>
            </div>

            <div className="product-info">
              <div className="product-image">
                <img 
                  src={product.images?.[0] || '/placeholder-product.jpg'} 
                  alt={product.name}
                />
              </div>
              
              <div className="product-details">
                <h4 className="product-name">{product.name}</h4>
                <div className="product-category">{product.category}</div>
              </div>
            </div>

            <div className="product-metrics">
              <div className="metric">
                <div className="metric-label">Revenue</div>
                <div className="metric-value">
                  {formatCurrency(product.revenue || 0)}
                </div>
              </div>
              
              <div className="metric">
                <div className="metric-label">Units Sold</div>
                <div className="metric-value">
                  {formatNumber(product.unitsSold || 0)}
                </div>
              </div>
              
              <div className="metric">
                <div className="metric-label">Views</div>
                <div className="metric-value">
                  {formatNumber(product.views || 0)}
                </div>
              </div>
            </div>

            <div className="product-actions">
              <Link 
                to={`/supplier/products/${product._id}`}
                className="btn btn-outline btn-xs"
              >
                View
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div className="performance-footer">
        <Link to="/supplier/products" className="btn btn-primary">
          Manage Products
        </Link>
      </div>
    </div>
  )
}

export default ProductPerformance