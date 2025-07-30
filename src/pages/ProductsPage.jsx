import React, { useState, useEffect, useMemo } from 'react'
import { useQuery } from 'react-query'
import { useSearchParams, Link } from 'react-router-dom'
import { productsAPI } from '../services/api'
import ProductCard from '../components/products/ProductCard'
import ProductFilters from '../components/products/ProductFilters'
import LoadingSpinner from '../components/common/LoadingSpinner'
import './ProductsPage.css'

const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    search: searchParams.get('search') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    rating: searchParams.get('rating') || '',
    availability: searchParams.get('availability') || '',
    sortBy: searchParams.get('sortBy') || 'newest',
    brand: searchParams.get('brand') || ''
  })
  
  const [viewMode, setViewMode] = useState('grid')
  const [currentPage, setCurrentPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

  // Handle window resize for mobile detection
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768
      setIsMobile(mobile)
      if (!mobile) {
        setShowFilters(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Map frontend sort values to backend expected values
  const mapSortValue = (sortBy) => {
    const sortMapping = {
      featured: 'popular',
      price_low: 'price_low',
      price_high: 'price_high',
      rating: 'rating',
      newest: 'newest',
      name: 'newest'
    }
    return sortMapping[sortBy] || 'newest'
  }

  // Prepare API parameters
  const apiParams = useMemo(() => {
    const params = {
      page: currentPage,
      limit: isMobile ? 8 : 12,
      sort: mapSortValue(filters.sortBy)
    }

    // Add only non-empty filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'newest' && key !== 'sortBy') {
        if (key === 'minPrice' || key === 'maxPrice' || key === 'rating') {
          params[key] = parseFloat(value)
        } else {
          params[key] = value
        }
      }
    })

    return params
  }, [filters, currentPage, isMobile])

  // Fetch products with better error handling
  const { data, isLoading, error, refetch } = useQuery(
    ['products', apiParams],
    () => productsAPI.getProducts(apiParams),
    {
      keepPreviousData: true,
      staleTime: 30000,
      retry: 2,
      onSuccess: (data) => {
        console.log('✅ Products loaded:', data?.data?.products?.length)
      },
      onError: (error) => {
        console.error('❌ Products API error:', error)
      }
    }
  )

  // Fetch categories for filters
  const { data: categoriesData, error: categoriesError } = useQuery(
    'categories',
    () => productsAPI.getCategories(),
    {
      staleTime: 300000,
      retry: 3,
      onError: (error) => {
        console.error('❌ Categories API error:', error)
      }
    }
  )

  // Fallback categories if API fails
  const fallbackCategories = [
    { _id: 'cement', name: 'Cement', productCount: 0 },
    { _id: 'tmt_steel', name: 'TMT Steel', productCount: 0 },
    { _id: 'bricks_blocks', name: 'Bricks & Blocks', productCount: 0 },
    { _id: 'sand', name: 'Sand', productCount: 0 },
    { _id: 'aggregate', name: 'Aggregate', productCount: 0 }
  ]

  // Transform categories
  const categories = useMemo(() => {
    if (categoriesError || !categoriesData?.data?.categories) {
      return fallbackCategories
    }
    
    const categoriesObj = categoriesData.data.categories
    return Object.entries(categoriesObj).map(([key, category]) => ({
      _id: key,
      name: category.name,
      productCount: 0,
      subcategories: category.subcategories
    }))
  }, [categoriesData, categoriesError])

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'newest') params.set(key, value)
    })
    if (currentPage > 1) params.set('page', currentPage.toString())
    setSearchParams(params)
  }, [filters, currentPage, setSearchParams])

  // Handle filter changes
  const handleFilterChange = (filterKey, filterValue) => {
    console.log('🔧 Filter change:', filterKey, filterValue)
    
    if (typeof filterKey === 'object') {
      // Handle multiple filters at once
      setFilters(prev => ({ ...prev, ...filterKey }))
    } else {
      // Handle single filter
      setFilters(prev => ({ ...prev, [filterKey]: filterValue }))
    }
    setCurrentPage(1)
    
    // Close mobile filters after category/price selection
    if (isMobile && (filterKey === 'category' || filterKey === 'minPrice' || filterKey === 'maxPrice')) {
      setTimeout(() => setShowFilters(false), 300)
    }
  }

  // Handle search input
  const handleSearchChange = (searchValue) => {
    handleFilterChange('search', searchValue)
  }

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      category: '',
      search: '',
      minPrice: '',
      maxPrice: '',
      rating: '',
      availability: '',
      sortBy: 'newest',
      brand: ''
    })
    setCurrentPage(1)
    setShowFilters(false)
  }

  // Handle mobile filter overlay
  const handleFilterOverlayClick = (e) => {
    if (e.target.classList.contains('filter-overlay')) {
      setShowFilters(false)
    }
  }

  // Calculate data
  const products = data?.data?.products || []
  const totalItems = data?.data?.pagination?.totalItems || 0
  const totalPages = data?.data?.pagination?.totalPages || 1
  const activeFiltersCount = Object.values(filters).filter(f => f && f !== 'newest').length

  return (
    <div className="products-page">
      <div className="container">
        {/* Page Header */}
        <div className="page-header">
          <div className="breadcrumb">
            <Link to="/" className="breadcrumb-link">Home</Link>
            <span className="breadcrumb-separator">›</span>
            <span className="breadcrumb-current">Products</span>
          </div>
          
          <h1 className="page-title">Construction Materials</h1>
          <p className="page-subtitle">
            Find quality construction materials from verified suppliers
          </p>
        </div>

        {/* Search Section - Navbar Style */}

        {/* Enhanced Mobile-First Search Section */}
        <div className="search-section">
          <div className="search-container">
            <div className="search-bar">
              <div className="search-input-wrapper">
                <div className="search-icon-container">
                  <svg className="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search for cement, steel, bricks..."
                  value={filters.search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearchChange(filters.search)}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                />
                
                {filters.search && (
                  <button 
                    className="clear-search"
                    onClick={() => handleSearchChange('')}
                    title="Clear search"
                    type="button"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
                
                <button 
                  className="search-submit-btn"
                  onClick={() => handleSearchChange(filters.search)}
                  title="Search"
                  type="button"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Mobile Filter Button */}
            <button
              className={`filter-toggle-btn ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <svg className="filter-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
              </svg>
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="filter-badge">{activeFiltersCount}</span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Filter Overlay */}
        {isMobile && showFilters && (
          <div className="filter-overlay" onClick={handleFilterOverlayClick}>
            <div className="mobile-filters">
              <div className="mobile-filters-header">
                <h3>Filters</h3>
                <div className="mobile-filters-actions">
                  <button className="clear-all-btn" onClick={clearFilters}>
                    Clear All
                  </button>
                  <button className="close-filters-btn" onClick={() => setShowFilters(false)}>
                    ✕
                  </button>
                </div>
              </div>
              <div className="mobile-filters-content">
                <ProductFilters 
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  categories={categories}
                />
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="products-content">
          {/* Desktop Sidebar Filters */}
          {!isMobile && (
            <aside className="products-sidebar">
              <div className="sidebar-header">
                <h3 className="sidebar-title">Filters</h3>
                {activeFiltersCount > 0 && (
                  <button className="clear-filters-btn" onClick={clearFilters}>
                    Clear All ({activeFiltersCount})
                  </button>
                )}
              </div>
              <ProductFilters 
                filters={filters}
                onFilterChange={handleFilterChange}
                categories={categories}
              />
            </aside>
          )}

          {/* Products Main */}
          <main className="products-main">
            {/* Results Header */}
            <div className="results-header">
              <div className="results-info">
                {isLoading ? (
                  <div className="results-skeleton"></div>
                ) : (
                  <div className="results-text">
                    <span className="results-count">{totalItems.toLocaleString()}</span>
                    <span className="results-label">products found</span>
                    {filters.search && (
                      <span className="search-term">for "{filters.search}"</span>
                    )}
                  </div>
                )}
              </div>
              
              <div className="results-controls">
                {/* View Mode Toggle - Desktop Only */}
                {!isMobile && (
                  <div className="view-toggle">
                    <button
                      className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                      onClick={() => setViewMode('grid')}
                      title="Grid View"
                    >
                      <svg fill="currentColor" viewBox="0 0 20 20">
                        <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                    </button>
                    <button
                      className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                      onClick={() => setViewMode('list')}
                      title="List View"
                    >
                      <svg fill="currentColor" viewBox="0 0 20 20">
                        <path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 8a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 12a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 16a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
                      </svg>
                    </button>
                  </div>
                )}
                
                {/* Sort Dropdown */}
                <select
                  className="sort-select"
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                >
                  <option value="newest">Newest First</option>
                  <option value="featured">Featured</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                  <option value="rating">Best Rated</option>
                </select>
              </div>
            </div>

            {/* Products Content */}
            {isLoading ? (
              <div className="loading-state">
                <LoadingSpinner />
                <p>Loading products...</p>
              </div>
            ) : error ? (
              <div className="error-state">
                <div className="error-icon">⚠️</div>
                <h3>Failed to load products</h3>
                <p>Please check your connection and try again.</p>
                <button className="retry-btn" onClick={() => refetch()}>
                  Try Again
                </button>
              </div>
            ) : products.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📦</div>
                <h3>No products found</h3>
                <p>Try adjusting your search criteria or browse different categories.</p>
                <button className="clear-btn" onClick={clearFilters}>
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                {/* Products Grid */}
                <div className={`products-grid ${viewMode} ${isMobile ? 'mobile' : ''}`}>
                  {products.map((product) => (
                    <ProductCard 
                      key={product._id} 
                      product={product}
                      viewMode={isMobile ? 'grid' : viewMode}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="pagination">
                    <button
                      className="pagination-btn prev"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(currentPage - 1)}
                    >
                      {isMobile ? '‹' : '← Previous'}
                    </button>
                    
                    <div className="pagination-numbers">
                      {/* Smart pagination for mobile */}
                      {Array.from({ length: Math.min(totalPages, isMobile ? 3 : 5) }, (_, i) => {
                        let page = i + 1
                        if (isMobile && totalPages > 3) {
                          if (currentPage <= 2) page = i + 1
                          else if (currentPage >= totalPages - 1) page = totalPages - 2 + i
                          else page = currentPage - 1 + i
                        }
                        
                        return (
                          <button
                            key={page}
                            className={`pagination-number ${currentPage === page ? 'active' : ''}`}
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </button>
                        )
                      })}
                      
                      {!isMobile && totalPages > 5 && currentPage < totalPages - 2 && (
                        <>
                          <span className="pagination-dots">...</span>
                          <button
                            className="pagination-number"
                            onClick={() => setCurrentPage(totalPages)}
                          >
                            {totalPages}
                          </button>
                        </>
                      )}
                    </div>
                    
                    <button
                      className="pagination-btn next"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(currentPage + 1)}
                    >
                      {isMobile ? '›' : 'Next →'}
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}

export default ProductsPage