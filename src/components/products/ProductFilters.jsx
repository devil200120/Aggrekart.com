import React, { useState } from 'react'
import './ProductFilters.css'

const ProductFilters = ({ filters, categories, onFilterChange }) => {
  const [expandedSections, setExpandedSections] = useState({
    category: true,
    subcategory: true,
    price: true,
    rating: true,
    availability: true,
    location: false // Add location section
  })

  const [locationState, setLocationState] = useState({
    enabled: false,
    detecting: false,
    currentLocation: null,
    maxDistance: 10,
    error: null
  })

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  // Simple location detection function
  const detectLocation = () => {
    if (!navigator.geolocation) {
      setLocationState(prev => ({
        ...prev,
        error: 'Geolocation not supported'
      }))
      return
    }

    setLocationState(prev => ({
      ...prev,
      detecting: true,
      error: null
    }))

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }
        
        setLocationState(prev => ({
          ...prev,
          detecting: false,
          currentLocation: location,
          enabled: true
        }))

        // Update filters with location data
        onFilterChange('userLatitude', location.latitude)
        onFilterChange('userLongitude', location.longitude)
        onFilterChange('maxDistance', locationState.maxDistance)
        onFilterChange('sortBy', 'distance')
      },
      (error) => {
        setLocationState(prev => ({
          ...prev,
          detecting: false,
          error: 'Location access denied'
        }))
      }
    )
  }

  const toggleLocationFilter = () => {
    if (locationState.enabled) {
      // Disable location
      setLocationState(prev => ({ ...prev, enabled: false }))
      onFilterChange('userLatitude', '')
      onFilterChange('userLongitude', '')
      onFilterChange('maxDistance', '')
      if (filters.sortBy === 'distance') {
        onFilterChange('sortBy', 'newest')
      }
    } else if (locationState.currentLocation) {
      // Re-enable with existing location
      setLocationState(prev => ({ ...prev, enabled: true }))
      onFilterChange('userLatitude', locationState.currentLocation.latitude)
      onFilterChange('userLongitude', locationState.currentLocation.longitude)
      onFilterChange('maxDistance', locationState.maxDistance)
      onFilterChange('sortBy', 'distance')
    } else {
      // Detect new location
      detectLocation()
    }
  }

  const handleDistanceChange = (distance) => {
    setLocationState(prev => ({ ...prev, maxDistance: distance }))
    if (locationState.enabled && locationState.currentLocation) {
      onFilterChange('maxDistance', distance)
    }
  }

  // Get subcategories for the selected category
  const getSubcategoriesForCategory = (categoryId) => {
    if (!categoryId || !categories) return []
    
    const category = categories.find(cat => cat._id === categoryId)
    if (!category?.subcategories) return []
    
    return Object.entries(category.subcategories).map(([key, value]) => ({
      id: key,
      name: value
    }))
  }

  const selectedCategorySubcategories = getSubcategoriesForCategory(filters.category)

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
      {/* Location Filter */}
      <div className="filter-section">
        <button 
          className="filter-section-header"
          onClick={() => toggleSection('location')}
        >
          <span>📍 Location</span>
          <span className={`expand-icon ${expandedSections.location ? 'expanded' : ''}`}>
            ▼
          </span>
        </button>
        
        {expandedSections.location && (
          <div className="filter-section-content">
            <div className="location-filter">
              <div className="location-toggle">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={locationState.enabled}
                    onChange={toggleLocationFilter}
                    disabled={locationState.detecting}
                  />
                  <span>Show nearby suppliers</span>
                </label>
              </div>

              {locationState.detecting && (
                <div className="location-status">
                  <span>📍 Detecting location...</span>
                </div>
              )}

              {locationState.error && (
                <div className="location-error">
                  <span>⚠️ {locationState.error}</span>
                </div>
              )}

              {locationState.currentLocation && (
                <div className="location-detected">
                  <span>✅ Location detected</span>
                </div>
              )}

              {locationState.enabled && (
                <div className="distance-selector">
                  <label>Show suppliers within:</label>
                  <div className="distance-options">
                    {[5, 10, 20, 50].map(distance => (
                      <button
                        key={distance}
                        className={`distance-btn ${locationState.maxDistance === distance ? 'active' : ''}`}
                        onClick={() => handleDistanceChange(distance)}
                      >
                        {distance}km
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

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
                  onChange={(e) => {
                    onFilterChange('category', e.target.value)
                    onFilterChange('subcategory', '')
                  }}
                />
                <span>All Categories</span>
              </label>
              {categories.map(category => (
                <label key={category._id} className="filter-option">
                  <input
                    type="radio"
                    name="category"
                    value={category._id}
                    checked={filters.category === category._id}
                    onChange={(e) => {
                      onFilterChange('category', e.target.value)
                      onFilterChange('subcategory', '')
                    }}
                  />
                  <span>{category.name}</span>
                  {category.productCount > 0 && (
                    <span className="count">({category.productCount})</span>
                  )}
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Subcategory Filter */}
      {filters.category && selectedCategorySubcategories.length > 0 && (
        <div className="filter-section">
          <button 
            className="filter-section-header"
            onClick={() => toggleSection('subcategory')}
          >
            <span>Subcategory</span>
            <span className={`expand-icon ${expandedSections.subcategory ? 'expanded' : ''}`}>
              ▼
            </span>
          </button>
          
          {expandedSections.subcategory && (
            <div className="filter-section-content">
              <div className="filter-options">
                <label className="filter-option">
                  <input
                    type="radio"
                    name="subcategory"
                    value=""
                    checked={filters.subcategory === ''}
                    onChange={(e) => onFilterChange('subcategory', e.target.value)}
                  />
                  <span>All Subcategories</span>
                </label>
                {selectedCategorySubcategories.map(subcategory => (
                  <label key={subcategory.id} className="filter-option">
                    <input
                      type="radio"
                      name="subcategory"
                      value={subcategory.id}
                      checked={filters.subcategory === subcategory.id}
                      onChange={(e) => onFilterChange('subcategory', e.target.value)}
                    />
                    <span>{subcategory.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

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
              <label className="filter-option">
                <input
                  type="radio"
                  name="priceRange"
                  checked={!filters.minPrice && !filters.maxPrice}
                  onChange={() => handlePriceRangeSelect('', '')}
                />
                <span>Any Price</span>
              </label>
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
              <div className="price-inputs">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minPrice}
                  onChange={(e) => onFilterChange('minPrice', e.target.value)}
                  className="price-input"
                />
                <span>-</span>
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
          <span>Rating</span>
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
                <span>Any Rating</span>
              </label>
              {ratingOptions.map(option => (
                <label key={option.value} className="filter-option">
                  <input
                    type="radio"
                    name="rating"
                    value={option.value}
                    checked={filters.rating === option.value}
                    onChange={(e) => onFilterChange('rating', e.target.value)}
                  />
                  <span>{option.label}</span>
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
              {availabilityOptions.map(option => (
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
    </div>
  )
}

export default ProductFilters