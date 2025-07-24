import React, { useState, useEffect } from 'react'
import { useQuery } from 'react-query'
import { productsAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { useLocation, useNavigate } from 'react-router-dom'
import './AdvancedProductSearch.css'

const AdvancedProductSearch = () => {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  
  // Parse URL parameters
  const urlParams = new URLSearchParams(location.search)
  
  const [filters, setFilters] = useState({
    search: urlParams.get('search') || '',
    category: urlParams.get('category') || '',
    subCategory: urlParams.get('subCategory') || '',
    priceRange: urlParams.get('priceRange') || '',
    tonnage: urlParams.get('tonnage') || '',
    brand: urlParams.get('brand') || '',
    rating: urlParams.get('rating') || '',
    location: urlParams.get('location') || '',
    inStock: urlParams.get('inStock') === 'true',
    membershipDiscount: urlParams.get('membershipDiscount') === 'true',
    sortBy: urlParams.get('sortBy') || 'relevance'
  })
  
  const [showFilters, setShowFilters] = useState(false)
  const [appliedFilters, setAppliedFilters] = useState({})

  // Categories with construction-specific subcategories
  const categories = {
    'cement': {
      name: 'Cement',
      icon: '🏗️',
      subCategories: ['OPC Cement', 'PPC Cement', 'White Cement', 'Quick Setting Cement'],
      tonnageOptions: ['1-10 bags', '11-50 bags', '51-100 bags', '100+ bags'],
      brands: ['ACC', 'UltraTech', 'Ambuja', 'Shree Cement', 'JK Lakshmi']
    },
    'tmt-steel': {
      name: 'TMT Steel',
      icon: '🔧',
      subCategories: ['Fe-415 Grade', 'Fe-500 Grade', 'Fe-550 Grade', 'Galvanized Steel'],
      tonnageOptions: ['1-5 tons', '6-15 tons', '16-50 tons', '50+ tons'],
      brands: ['TATA Steel', 'JSW Steel', 'SAIL', 'Rashtriya Ispat', 'Kamdhenu']
    },
    'bricks': {
      name: 'Bricks',
      icon: '🧱',
      subCategories: ['Red Bricks', 'Fly Ash Bricks', 'AAC Blocks', 'Concrete Blocks'],
      tonnageOptions: ['1K-5K pieces', '5K-15K pieces', '15K-50K pieces', '50K+ pieces'],
      brands: ['Bharathi Cement', 'ACC Blocks', 'Siporex', 'Magicrete']
    },
    'sand-aggregates': {
      name: 'Sand & Aggregates',
      icon: '⛏️',
      subCategories: ['River Sand', 'M-Sand', 'Stone Chips', 'Gravel'],
      tonnageOptions: ['1-10 tons', '11-25 tons', '26-100 tons', '100+ tons'],
      brands: ['Local Suppliers', 'Certified M-Sand', 'River Sand Co.']
    },
    'ready-mix-concrete': {
      name: 'Ready Mix Concrete',
      icon: '🚛',
      subCategories: ['M20 Grade', 'M25 Grade', 'M30 Grade', 'M35 Grade'],
      tonnageOptions: ['1-5 cubic meters', '6-20 cubic meters', '21-100 cubic meters', '100+ cubic meters'],
      brands: ['ACC RMC', 'UltraTech RMC', 'Dalmia RMC', 'JK Lakshmi RMC']
    },
    'roofing-materials': {
      name: 'Roofing Materials',
      icon: '🏠',
      subCategories: ['Clay Tiles', 'Concrete Tiles', 'Metal Sheets', 'Asbestos Sheets'],
      tonnageOptions: ['100-500 sq ft', '500-1000 sq ft', '1000-5000 sq ft', '5000+ sq ft'],
      brands: ['Mangalore Tiles', 'Elegant Tiles', 'Tata Shaktee', 'Everest Industries']
    }
  }

  const priceRanges = [
    { value: '0-1000', label: '₹0 - ₹1,000' },
    { value: '1000-5000', label: '₹1,000 - ₹5,000' },
    { value: '5000-10000', label: '₹5,000 - ₹10,000' },
    { value: '10000-25000', label: '₹10,000 - ₹25,000' },
    { value: '25000-50000', label: '₹25,000 - ₹50,000' },
    { value: '50000+', label: '₹50,000+' }
  ]

  const sortOptions = [
    { value: 'relevance', label: 'Most Relevant' },
    { value: 'price-low-high', label: 'Price: Low to High' },
    { value: 'price-high-low', label: 'Price: High to Low' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'newest', label: 'Newest First' },
    { value: 'bestseller', label: 'Best Sellers' },
    { value: 'discount', label: 'Maximum Discount' }
  ]

  // Get current category data
  const currentCategory = categories[filters.category]
  const membershipTier = user?.membershipTier || 'silver'

  // Fetch products with filters
  const { data: productsData, isLoading, error, refetch } = useQuery(
    ['products', appliedFilters],
    () => productsAPI.getProducts(appliedFilters),
    {
      enabled: Object.keys(appliedFilters).length > 0,
      keepPreviousData: true
    }
  )

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== '' && value !== false) {
        params.set(key, value)
      }
    })
    
    const newUrl = `${location.pathname}?${params.toString()}`
    window.history.replaceState({}, '', newUrl)
  }, [filters, location.pathname])

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const applyFilters = () => {
    setAppliedFilters({ ...filters })
    setShowFilters(false)
  }

  const clearFilters = () => {
    const clearedFilters = {
      search: '',
      category: '',
      subCategory: '',
      priceRange: '',
      tonnage: '',
      brand: '',
      rating: '',
      location: '',
      inStock: false,
      membershipDiscount: false,
      sortBy: 'relevance'
    }
    setFilters(clearedFilters)
    setAppliedFilters({})
    navigate('/products')
  }

  const getActiveFilterCount = () => {
    return Object.values(filters).filter(value => 
      value && value !== '' && value !== false && value !== 'relevance'
    ).length
  }

  const getMembershipDiscount = (tier) => {
    switch(tier) {
      case 'platinum': return 15
      case 'gold': return 10
      case 'silver': default: return 5
    }
  }

  const products = productsData?.data?.products || []
  const totalProducts = productsData?.data?.total || 0
  const activeFilterCount = getActiveFilterCount()

  return (
    <div className="advanced-product-search">
      {/* Search Header */}
      <div className="search-header">
        <div className="search-bar">
          <div className="search-input-group">
            <input
              type="text"
              placeholder="Search construction materials..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="search-input"
            />
            <button 
              onClick={applyFilters}
              className="search-btn"
            >
              🔍 Search
            </button>
          </div>
          
          {user && (
            <div className="membership-info">
              <span className="membership-badge">{membershipTier}</span>
              <span className="discount-text">{getMembershipDiscount(membershipTier)}% OFF</span>
            </div>
          )}
        </div>

        <div className="search-controls">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`filters-btn ${activeFilterCount > 0 ? 'has-filters' : ''}`}
          >
            🔧 Filters
            {activeFilterCount > 0 && (
              <span className="filter-count">{activeFilterCount}</span>
            )}
          </button>

          <select
            value={filters.sortBy}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            className="sort-select"
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {activeFilterCount > 0 && (
            <button onClick={clearFilters} className="clear-filters-btn">
              ✕ Clear All
            </button>
          )}
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="filters-panel">
          <div className="filters-content">
            {/* Category Filter */}
            <div className="filter-group">
              <h4>Category</h4>
              <div className="category-grid">
                {Object.entries(categories).map(([key, category]) => (
                  <button
                    key={key}
                    className={`category-filter-btn ${filters.category === key ? 'selected' : ''}`}
                    onClick={() => handleFilterChange('category', key)}
                  >
                    <span className="category-icon">{category.icon}</span>
                    <span className="category-name">{category.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Sub-category Filter */}
            {currentCategory && (
              <div className="filter-group">
                <h4>Sub-category</h4>
                <div className="checkbox-group">
                  {currentCategory.subCategories.map(subCat => (
                    <label key={subCat} className="checkbox-label">
                      <input
                        type="radio"
                        name="subCategory"
                        checked={filters.subCategory === subCat}
                        onChange={() => handleFilterChange('subCategory', subCat)}
                      />
                      <span>{subCat}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Tonnage/Quantity Filter */}
            {currentCategory && (
              <div className="filter-group">
                <h4>Quantity Range</h4>
                <div className="tonnage-options">
                  {currentCategory.tonnageOptions.map(tonnage => (
                    <button
                      key={tonnage}
                      className={`tonnage-btn ${filters.tonnage === tonnage ? 'selected' : ''}`}
                      onClick={() => handleFilterChange('tonnage', tonnage)}
                    >
                      {tonnage}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Price Range Filter */}
            <div className="filter-group">
              <h4>Price Range</h4>
              <div className="price-options">
                {priceRanges.map(range => (
                  <label key={range.value} className="radio-label">
                    <input
                      type="radio"
                      name="priceRange"
                      checked={filters.priceRange === range.value}
                      onChange={() => handleFilterChange('priceRange', range.value)}
                    />
                    <span>{range.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Brand Filter */}
            {currentCategory && (
              <div className="filter-group">
                <h4>Brand</h4>
                <div className="brand-options">
                  {currentCategory.brands.map(brand => (
                    <label key={brand} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={filters.brand.includes(brand)}
                        onChange={(e) => {
                          const brands = filters.brand.split(',').filter(b => b)
                          if (e.target.checked) {
                            brands.push(brand)
                          } else {
                            const index = brands.indexOf(brand)
                            if (index > -1) brands.splice(index, 1)
                          }
                          handleFilterChange('brand', brands.join(','))
                        }}
                      />
                      <span>{brand}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Additional Filters */}
            <div className="filter-group">
              <h4>Additional Options</h4>
              <div className="additional-filters">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={filters.inStock}
                    onChange={(e) => handleFilterChange('inStock', e.target.checked)}
                  />
                  <span>In Stock Only</span>
                </label>
                
                {user && (
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={filters.membershipDiscount}
                      onChange={(e) => handleFilterChange('membershipDiscount', e.target.checked)}
                    />
                    <span>Show Member Prices</span>
                  </label>
                )}

                <div className="rating-filter">
                  <span>Minimum Rating:</span>
                  <div className="rating-stars">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        className={`star-btn ${filters.rating >= star ? 'selected' : ''}`}
                        onClick={() => handleFilterChange('rating', star)}
                      >
                        ⭐
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="filters-actions">
            <button onClick={clearFilters} className="btn btn-outline">
              Clear All
            </button>
            <button onClick={applyFilters} className="btn btn-primary">
              Apply Filters ({totalProducts} products)
            </button>
          </div>
        </div>
      )}

      {/* Results Summary */}
      <div className="results-summary">
        <div className="results-info">
          <span className="results-count">
            {isLoading ? 'Searching...' : `${totalProducts.toLocaleString()} products found`}
          </span>
          
          {activeFilterCount > 0 && (
            <div className="active-filters">
              {filters.category && (
                <span className="filter-tag">
                  {categories[filters.category]?.name}
                  <button onClick={() => handleFilterChange('category', '')}>✕</button>
                </span>
              )}
              {filters.subCategory && (
                <span className="filter-tag">
                  {filters.subCategory}
                  <button onClick={() => handleFilterChange('subCategory', '')}>✕</button>
                </span>
              )}
              {filters.tonnage && (
                <span className="filter-tag">
                  {filters.tonnage}
                  <button onClick={() => handleFilterChange('tonnage', '')}>✕</button>
                </span>
              )}
              {filters.priceRange && (
                <span className="filter-tag">
                  {priceRanges.find(r => r.value === filters.priceRange)?.label}
                  <button onClick={() => handleFilterChange('priceRange', '')}>✕</button>
                </span>
              )}
            </div>
          )}
        </div>

        {user && filters.membershipDiscount && (
          <div className="membership-pricing-note">
            <span className="member-icon">💎</span>
            Showing {membershipTier} member prices with {getMembershipDiscount(membershipTier)}% discount
          </div>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="search-error">
          <p>Sorry, we couldn't load the products. Please try again.</p>
          <button onClick={() => refetch()} className="btn btn-primary">
            Retry
          </button>
        </div>
      )}

      {/* Quick Filters for Popular Searches */}
      <div className="quick-filters">
        <span className="quick-filters-label">Popular:</span>
        <div className="quick-filter-tags">
          <button onClick={() => {
            handleFilterChange('category', 'cement')
            applyFilters()
          }}>
            Cement
          </button>
          <button onClick={() => {
            handleFilterChange('category', 'tmt-steel')
            applyFilters()
          }}>
            TMT Steel
          </button>
          <button onClick={() => {
            handleFilterChange('inStock', true)
            applyFilters()
          }}>
            In Stock
          </button>
          <button onClick={() => {
            handleFilterChange('rating', 4)
            applyFilters()
          }}>
            4+ Rating
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdvancedProductSearch