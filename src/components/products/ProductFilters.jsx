import React, { useState } from 'react'
import './ProductFilters.css'

const ProductFilters = ({ filters, categories, onFilterChange }) => {
  const [expandedSections, setExpandedSections] = useState({
    category: true,
    price: true,
    rating: true,
    availability: true,
    location: false
  })

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const priceRanges = [
    { label: 'Under ₹1,000', min: '', max: '1000' },
    { label: '₹1,000 - ₹5,000', min: '1000', max: '5000' },
    { label: '₹5,000 - ₹10,000', min: '5000', max: '10000' },
    { label: '₹10,000 - ₹25,000', min: '10000', max: '25000' },
    { label: 'Over ₹25,000', min: '25000', max: '' }
  ]

  const ratingOptions = [
    { label: '4★ & above', value: '4' },
    { label: '3★ & above', value: '3' },
    { label: '2★ & above', value: '2' },
    { label: '1★ & above', value: '1' }
  ]

  const availabilityOptions = [
    { label: 'In Stock', value: 'inStock' },
    { label: 'Out of Stock', value: 'outOfStock' }
  ]

  const handlePriceRangeSelect = (min, max) => {
    onFilterChange('minPrice', min)
    onFilterChange('maxPrice', max)
  }

  const isPriceRangeSelected = (min, max) => {
    return filters.minPrice === min && filters.maxPrice === max
  }

  return (
    <div className="product-filters">
      {/* Category Filter */}
      <div className="filter-section">
        <button 
          className="filter-section-header"
          onClick={() => toggleSection('category')}
        >
          <span>Category</span>
          <span className={`expand-icon ${expandedSections.category ? 'expanded' : ''}`}>
            ▼
          </span>
        </button>
        
        {expandedSections.category && (
          <div className="filter-section-content">
            <div className="filter-options">
              <label className="filter-option">
                <input
                  type="radio"
                  name="category"
                  value=""
                  checked={filters.category === ''}
                  onChange={(e) => onFilterChange('category', e.target.value)}
                />
                <span>All Categories</span>
              </label>
              
              {categories?.map((category) => (
                <label key={category._id} className="filter-option">
                  <input
                    type="radio"
                    name="category"
                   value={category._id}
                   checked={filters.category === category._id}
                    onChange={(e) => onFilterChange('category', e.target.value)}
                  />
                  <span>{category.name}</span>
                  <span className="option-count">({category.productCount})</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Price Filter */}
      <div className="filter-section">
        <button 
          className="filter-section-header"
          onClick={() => toggleSection('price')}
        >
          <span>Price Range</span>
          <span className={`expand-icon ${expandedSections.price ? 'expanded' : ''}`}>
            ▼
          </span>
        </button>
        
        {expandedSections.price && (
          <div className="filter-section-content">
            <div className="filter-options">
              {priceRanges.map((range, index) => (
                <label key={index} className="filter-option">
                  <input
                    type="radio"
                    name="priceRange"
                    checked={isPriceRangeSelected(range.min, range.max)}
                    onChange={() => handlePriceRangeSelect(range.min, range.max)}
                  />
                  <span>{range.label}</span>
                </label>
              ))}
            </div>
            
            <div className="custom-price-range">
              <h4>Custom Range</h4>
              <div className="price-inputs">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minPrice}
                  onChange={(e) => onFilterChange('minPrice', e.target.value)}
                  className="price-input"
                />
                <span>to</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxPrice}
                  onChange={(e) => onFilterChange('maxPrice', e.target.value)}
                  className="price-input"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Rating Filter */}
      <div className="filter-section">
        <button 
          className="filter-section-header"
          onClick={() => toggleSection('rating')}
        >
          <span>Customer Rating</span>
          <span className={`expand-icon ${expandedSections.rating ? 'expanded' : ''}`}>
            ▼
          </span>
        </button>
        
        {expandedSections.rating && (
          <div className="filter-section-content">
            <div className="filter-options">
              <label className="filter-option">
                <input
                  type="radio"
                  name="rating"
                  value=""
                  checked={filters.rating === ''}
                  onChange={(e) => onFilterChange('rating', e.target.value)}
                />
                <span>All Ratings</span>
              </label>
              
              {ratingOptions.map((option) => (
                <label key={option.value} className="filter-option">
                  <input
                    type="radio"
                    name="rating"
                    value={option.value}
                    checked={filters.rating === option.value}
                    onChange={(e) => onFilterChange('rating', e.target.value)}
                  />
                  <span className="rating-option">
                    {option.label}
                    <div className="stars">
                      {Array.from({ length: 5 }, (_, i) => (
                        <span 
                          key={i} 
                          className={`star ${i < parseInt(option.value) ? 'filled' : 'empty'}`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Availability Filter */}
      <div className="filter-section">
        <button 
          className="filter-section-header"
          onClick={() => toggleSection('availability')}
        >
          <span>Availability</span>
          <span className={`expand-icon ${expandedSections.availability ? 'expanded' : ''}`}>
            ▼
          </span>
        </button>
        
        {expandedSections.availability && (
          <div className="filter-section-content">
            <div className="filter-options">
              <label className="filter-option">
                <input
                  type="radio"
                  name="availability"
                  value=""
                  checked={filters.availability === ''}
                  onChange={(e) => onFilterChange('availability', e.target.value)}
                />
                <span>All Products</span>
              </label>
              
              {availabilityOptions.map((option) => (
                <label key={option.value} className="filter-option">
                  <input
                    type="radio"
                    name="availability"
                    value={option.value}
                    checked={filters.availability === option.value}
                    onChange={(e) => onFilterChange('availability', e.target.value)}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Location Filter */}
      <div className="filter-section">
        <button 
          className="filter-section-header"
          onClick={() => toggleSection('location')}
        >
          <span>Location</span>
          <span className={`expand-icon ${expandedSections.location ? 'expanded' : ''}`}>
            ▼
          </span>
        </button>
        
        {expandedSections.location && (
          <div className="filter-section-content">
            <input
              type="text"
              placeholder="Enter city or state"
              value={filters.location}
              onChange={(e) => onFilterChange('location', e.target.value)}
              className="location-input"
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductFilters