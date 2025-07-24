import React, { useState, useEffect, useMemo } from 'react'
import { useQuery } from 'react-query'
import { useSearchParams, Link } from 'react-router-dom'
import { productsAPI } from '../services/api'
import ProductCard from '../components/products/ProductCard'
import ProductFilters from '../components/products/ProductFilters'
import ProductSearch from '../components/products/ProductSearch'
import AdvancedProductSearch from '../components/products/AdvancedProductSearch' // ADDED
import LoadingSpinner from '../components/common/LoadingSpinner'
import './ProductsPage.css'

const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    search: searchParams.get('search') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    supplier: searchParams.get('supplier') || '',
    rating: searchParams.get('rating') || '',
    availability: searchParams.get('availability') || '',
    location: searchParams.get('location') || '',
    sortBy: searchParams.get('sortBy') || 'newest',
    // ADDED: Advanced search filters
    materialGrade: searchParams.get('materialGrade') || '',
    strength: searchParams.get('strength') || '',
    size: searchParams.get('size') || '',
    brand: searchParams.get('brand') || '',
    priceRange: searchParams.get('priceRange') || ''
  })
  const [viewMode, setViewMode] = useState('grid')
  const [currentPage, setCurrentPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const [useAdvancedSearch, setUseAdvancedSearch] = useState(false) // ADDED

  // Map frontend sort values to backend expected values
  const mapSortValue = (sortBy) => {
    const sortMapping = {
      featured: 'popular',
      price_low: 'price_low',
      price_high: 'price_high',
      rating: 'rating',
      newest: 'newest',
      name: 'newest' // fallback
    }
    return sortMapping[sortBy] || 'newest'
  }

  // Prepare API parameters
  const apiParams = useMemo(() => {
    const params = {
      page: currentPage,
      limit: 12,
      sort: mapSortValue(filters.sortBy)
    }

    // Only add parameters that have values and are supported by backend
    if (filters.category) params.category = filters.category
    if (filters.search) params.search = filters.search
    if (filters.minPrice) params.minPrice = parseFloat(filters.minPrice)
    if (filters.maxPrice) params.maxPrice = parseFloat(filters.maxPrice)
    if (filters.supplier) params.supplier = filters.supplier
    if (filters.rating) params.rating = parseFloat(filters.rating)
    if (filters.availability) params.availability = filters.availability
    if (filters.location) params.location = filters.location

    // ADDED: Advanced search parameters
    if (filters.materialGrade) params.materialGrade = filters.materialGrade
    if (filters.strength) params.strength = filters.strength
    if (filters.size) params.size = filters.size
    if (filters.brand) params.brand = filters.brand

    return params
  }, [filters, currentPage])

  // Fetch products
  const { data, isLoading, error } = useQuery(
    ['products', apiParams],
    () => productsAPI.getProducts(apiParams),
    {
      keepPreviousData: true,
      staleTime: 30000,
    }
  )

  // Fetch categories for filters
  // Replace lines 86-92 with:

// Fetch categories for filters - Enhanced with error handling
const { data: categoriesData, error: categoriesError } = useQuery(
  'categories',
  () => productsAPI.getCategories(),
  {
    staleTime: 300000, // 5 minutes
    retry: 3,
    onError: (error) => {
      console.error('Failed to load categories:', error)
    }
  }
)

// Add fallback categories if API fails
const fallbackCategories = [
  { _id: 'cement', name: 'Cement', productCount: 0 },
  { _id: 'tmt_steel', name: 'TMT Steel', productCount: 0 },
  { _id: 'bricks_blocks', name: 'Bricks & Blocks', productCount: 0 },
  { _id: 'sand', name: 'Sand', productCount: 0 },
  { _id: 'aggregate', name: 'Aggregate', productCount: 0 }
]

  // Transform categories object to array format expected by ProductFilters
  // Update the categories useMemo (around line 95):

// Transform categories object to array format expected by ProductFilters
const categories = useMemo(() => {
  // Use fallback categories if API failed or no data
  if (categoriesError || !categoriesData?.data?.categories) {
    return fallbackCategories
  }
  
  const categoriesObj = categoriesData.data.categories
  return Object.entries(categoriesObj).map(([key, category]) => ({
    _id: key,
    name: category.name,
    productCount: 0, // We can add actual count later if needed
    subcategories: category.subcategories
  }))
}, [categoriesData, categoriesError, fallbackCategories])

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value)
    })
    if (currentPage > 1) params.set('page', currentPage.toString())
    setSearchParams(params)
  }, [filters, currentPage, setSearchParams])

  // Handle filter changes
  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
    setCurrentPage(1)
  }

  // ADDED: Handle advanced search
  const handleAdvancedSearch = (searchFilters) => {
    setFilters(prev => ({ ...prev, ...searchFilters }))
    setCurrentPage(1)
    setUseAdvancedSearch(false) // Close advanced search after applying
  }

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      category: '',
      search: '',
      minPrice: '',
      maxPrice: '',
      supplier: '',
      rating: '',
      availability: '',
      location: '',
      sortBy: 'newest',
      materialGrade: '',
      strength: '',
      size: '',
      brand: '',
      priceRange: ''
    })
    setCurrentPage(1)
  }

  // Calculate total pages
  const totalPages = data?.data?.pagination?.totalPages || data?.pagination?.totalPages || 1
  const products = data?.data?.products || data?.products || []

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

        {/* Search Section */}
        <div className="search-section">
          <div className="search-header">
            <ProductSearch 
              value={filters.search}
              onSearchChange={(search) => handleFilterChange({ search })}
              placeholder="Search for cement, steel, bricks..."
            />
            
            {/* ADDED: Advanced Search Toggle */}
            <div className="search-controls">
              <button
                className={`btn ${useAdvancedSearch ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setUseAdvancedSearch(!useAdvancedSearch)}
              >
                🔍 Advanced Search
              </button>
              
              <button
                className={`btn btn-outline mobile-filter-btn ${showFilters ? 'active' : ''}`}
                onClick={() => setShowFilters(!showFilters)}
              >
                <span className="filter-icon">⚙️</span>
                Filters
                {Object.values(filters).some(f => f && f !== 'newest') && (
                  <span className="filter-count">
                    {Object.values(filters).filter(f => f && f !== 'newest').length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* ADDED: Advanced Search Component */}

{/* FIXED: Advanced Search Component */}
{useAdvancedSearch && (
  <div className="advanced-search-container">
    <div className="advanced-search-wrapper">
      <button 
        className="close-advanced-search"
        onClick={() => setUseAdvancedSearch(false)}
      >
        ✕ Close Advanced Search
      </button>
    </div>
    {/* Use the standalone AdvancedProductSearch component */}
    <AdvancedProductSearch />
  </div>
)}
        </div>

        {/* Main Content */}
        <div className="products-content">
          {/* Sidebar Filters */}
          <aside className={`products-sidebar ${showFilters ? 'show' : ''}`}>
            <div className="sidebar-header">
              <h3 className="sidebar-title">Filters</h3>
              <button 
                className="btn btn-text clear-filters-btn"
                onClick={clearFilters}
              >
                Clear All
              </button>
            </div>

{/* Debug Info - Remove in production */}
{import.meta.env.MODE === 'development' && (
  <div style={{ padding: '10px', background: '#f0f0f0', margin: '10px 0', fontSize: '12px' }}>
    <strong>Debug Info:</strong>
    <p>API Params: {JSON.stringify(apiParams, null, 2)}</p>
    <p>Categories Loading: {categoriesData ? 'Loaded' : 'Loading...'}</p>
    <p>Products Count: {products.length}</p>
    {error && <p style={{color: 'red'}}>Error: {error.message}</p>}
  </div>
)}
            <ProductFilters 
              filters={filters}
              onFilterChange={handleFilterChange}
              categories={categories}
            />
          </aside>

          {/* Products Grid */}
          <main className="products-main">
            {/* Results Header */}
            <div className="results-header">
              <div className="results-info">
                {isLoading ? (
                  <div className="results-skeleton">Loading...</div>
                ) : (
                  <span className="results-count">
                    {data?.pagination?.total || 0} products found
                    {filters.search && (
                      <span className="search-term"> for "{filters.search}"</span>
                    )}
                  </span>
                )}
              </div>
              
              <div className="results-controls">
                {/* View Mode Toggle */}
                <div className="view-mode-toggle">
                  <button
                    className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                    onClick={() => setViewMode('grid')}
                    title="Grid View"
                  >
                    ⊞
                  </button>
                  <button
                    className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                    onClick={() => setViewMode('list')}
                    title="List View"
                  >
                    ☰
                  </button>
                </div>
                
                {/* Sort Dropdown */}
                <select
                  className="sort-select"
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange({ sortBy: e.target.value })}
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
              <div className="loading-container">
                <LoadingSpinner />
                <p>Loading products...</p>
              </div>
            ) : error ? (
              <div className="error-container">
                <div className="error-icon">⚠️</div>
                <h3>Failed to load products</h3>
                <p>Please try again later or check your connection.</p>
                <button 
                  className="btn btn-primary"
                  onClick={() => window.location.reload()}
                >
                  Retry
                </button>
              </div>
            ) : products.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📦</div>
                <h3>No products found</h3>
                <p>Try adjusting your search criteria or browse different categories.</p>
                <button 
                  className="btn btn-primary"
                  onClick={clearFilters}
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                {/* Products Grid/List */}
                <div className={`products-grid ${viewMode}`}>
                  {products.map((product) => (
                    <ProductCard 
                      key={product._id} 
                      product={product}
                      viewMode={viewMode}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="pagination">
                    <button
                      className="pagination-btn"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(currentPage - 1)}
                    >
                      ← Previous
                    </button>
                    
                    <div className="pagination-pages">
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        const page = i + 1
                        return (
                          <button
                            key={page}
                            className={`pagination-page ${currentPage === page ? 'active' : ''}`}
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </button>
                        )
                      })}
                      
                      {totalPages > 5 && (
                        <>
                          <span className="pagination-ellipsis">...</span>
                          <button
                            className={`pagination-page ${currentPage === totalPages ? 'active' : ''}`}
                            onClick={() => setCurrentPage(totalPages)}
                          >
                            {totalPages}
                          </button>
                        </>
                      )}
                    </div>
                    
                    <button
                      className="pagination-btn"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(currentPage + 1)}
                    >
                      Next →
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