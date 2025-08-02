import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { productsAPI, cartAPI, wishlistAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { toast } from 'react-hot-toast'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ReviewSection from '../components/products/ReviewSection'
import './ProductDetailPage.css'

const ProductDetailPage = () => {
  const { productId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { refreshCart } = useCart()
  const queryClient = useQueryClient()
  
  // State management
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [showImageModal, setShowImageModal] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [isWishlisted, setIsWishlisted] = useState(false)

  // Fetch product details
  const { data: response, isLoading, error } = useQuery(
    ['product', productId],
    () => productsAPI.getProduct(productId),
    {
      enabled: !!productId,
      retry: 1,
      onError: (error) => {
        console.error('Failed to fetch product:', error)
      }
    }
  )

  // Add to cart mutation
  const addToCartMutation = useMutation(
    (data) => cartAPI.addToCart(data),
    {
      onSuccess: () => {
        toast.success('Added to cart successfully!')
        refreshCart()
        queryClient.invalidateQueries('cart')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to add to cart')
      }
    }
  )

  // Add to wishlist mutation
  const addToWishlistMutation = useMutation(
    (productId) => wishlistAPI.addToWishlist(productId),
    {
      onSuccess: () => {
        toast.success('Added to wishlist!')
        setIsWishlisted(true)
        queryClient.invalidateQueries('wishlist')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to add to wishlist')
      }
    }
  )

  // Helper functions
  const safeRender = (value, defaultValue = 'N/A') => {
    if (value === null || value === undefined || value === '') {
      return defaultValue
    }
    return String(value)
  }

  const safeNumber = (value, defaultValue = 0) => {
    const num = Number(value)
    return isNaN(num) ? defaultValue : num
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price)
  }

  const renderStars = (rating) => {
    const stars = []
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 !== 0
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={i} className="star filled">★</span>)
    }
    if (hasHalfStar) {
      stars.push(<span key="half" className="star half">★</span>)
    }
    for (let i = stars.length; i < 5; i++) {
      stars.push(<span key={i} className="star empty">☆</span>)
    }
    return stars
  }

  // Process product data
  let productData = null
  let images = []
  let hasImages = false
  let price = 0
  let minQuantity = 1
  let stockQuantity = 0
  let isInStock = false

  if (response?.data?.product) {
    const product = response.data.product
    
    productData = {
      _id: product._id || '',
      name: safeRender(product.name, 'Unnamed Product'),
      description: safeRender(product.description, ''),
      category: safeRender(product.category),
      subcategory: safeRender(product.subcategory),
      brand: safeRender(product.brand),
      hsnCode: safeRender(product.hsnCode),
      deliveryTime: safeRender(product.deliveryTime),
      averageRating: safeNumber(product.averageRating),
      totalReviews: safeNumber(product.totalReviews),
      
      images: (() => {
        if (!product.images || !Array.isArray(product.images)) {
          return []
        }
        return product.images.filter(img => img && img.url)
      })(),
      
      pricing: {
        basePrice: safeNumber(product.pricing?.basePrice),
        unit: safeRender(product.pricing?.unit, 'unit'),
        minimumQuantity: safeNumber(product.pricing?.minimumQuantity, 1),
        includesGST: Boolean(product.pricing?.includesGST),
        gstRate: safeNumber(product.pricing?.gstRate, 18)
      },
      stock: {
        available: safeNumber(product.stock?.available),
        reserved: safeNumber(product.stock?.reserved)
      },
      supplier: product.supplier ? {
        _id: product.supplier._id || '',
        companyName: safeRender(product.supplier.companyName, 'Unknown Supplier'),
        rating: safeNumber(product.supplier.rating),
        totalOrders: safeNumber(product.supplier.totalOrders),
        location: product.supplier.location || {}
      } : null,
      specifications: product.specifications || {}
    }

    images = productData.images
    hasImages = images.length > 0
    price = productData.pricing.basePrice
    minQuantity = productData.pricing.minimumQuantity
    stockQuantity = productData.stock.available
    isInStock = stockQuantity > 0
  }

  // Effects
  useEffect(() => {
    if (minQuantity > 0) {
      setQuantity(minQuantity)
    }
  }, [minQuantity])

  // Event handlers
  const handleAddToCart = () => {
    if (!user) {
      toast.error('Please login to add items to cart')
      navigate('/auth/login')
      return
    }

    if (user.role === 'supplier') {
      toast.error('Suppliers cannot purchase products')
      return
    }

    if (!isInStock || stockQuantity < quantity) {
      toast.error('Product is out of stock')
      return
    }

    addToCartMutation.mutate({
      productId: productData._id,
      quantity
    })
  }

  const handleAddToWishlist = () => {
    if (!user) {
      toast.error('Please login to add items to wishlist')
      navigate('/auth/login')
      return
    }

    if (user.role === 'supplier') {
      toast.error('Suppliers cannot add items to wishlist')
      return
    }

    addToWishlistMutation.mutate(productData._id)
  }

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity >= minQuantity && newQuantity <= stockQuantity) {
      setQuantity(newQuantity)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="swiggy-product-loading">
        <div className="loading-container">
          <div className="swiggy-spinner"></div>
          <h3>Loading Product...</h3>
          <p>Please wait while we fetch the details</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !productData) {
    return (
      <div className="swiggy-product-error">
        <div className="error-container">
          <div className="error-icon">😕</div>
          <h2>Product Not Found</h2>
          <p>The product you're looking for doesn't exist or has been removed.</p>
          <button onClick={() => navigate('/products')} className="swiggy-btn swiggy-btn-primary">
            <span className="btn-icon">🔍</span>
            Browse Products
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="swiggy-product-detail">
      <div className="swiggy-container">
        {/* Breadcrumb */}
        <nav className="swiggy-breadcrumb">
          <button onClick={() => navigate('/')} className="breadcrumb-link">
            <span className="breadcrumb-icon">🏠</span>
            Home
          </button>
          <span className="breadcrumb-separator">›</span>
          <button onClick={() => navigate('/products')} className="breadcrumb-link">
            Products
          </button>
          <span className="breadcrumb-separator">›</span>
          <span className="breadcrumb-current">{productData.name}</span>
        </nav>

        {/* Main Product Section */}
        <div className="swiggy-product-main">
          {/* Product Images */}
          <div className="swiggy-product-images">
            <div className="main-image-container">
              {hasImages ? (
                <img 
                  src={images[selectedImage]?.url || '/placeholder-product.jpg'}
                  alt={productData.name}
                  className="main-image"
                  onClick={() => setShowImageModal(true)}
                  onError={(e) => { e.target.src = '/placeholder-product.jpg' }}
                />
              ) : (
                <div className="no-image-placeholder">
                  <span className="placeholder-icon">📦</span>
                  <span>No Image Available</span>
                </div>
              )}
              
              {/* Image zoom indicator */}
              {hasImages && (
                <div className="zoom-indicator">
                  <span className="zoom-icon">🔍</span>
                  Click to zoom
                </div>
              )}
            </div>

            {/* Thumbnail Images */}
            {hasImages && images.length > 1 && (
              <div className="thumbnail-container">
                {images.map((image, index) => (
                  <button
                    key={index}
                    className={`thumbnail ${selectedImage === index ? 'active' : ''}`}
                    onClick={() => setSelectedImage(index)}
                  >
                    <img 
                      src={image.url} 
                      alt={`${productData.name} ${index + 1}`}
                      onError={(e) => { e.target.src = '/placeholder-product.jpg' }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Information */}
          <div className="swiggy-product-info">
            {/* Product Header */}
            <div className="product-header">
              <div className="product-category">
                <span className="category-badge">{productData.category}</span>
                {productData.subcategory && (
                  <span className="subcategory-badge">{productData.subcategory}</span>
                )}
              </div>

              <h1 className="product-title">{productData.name}</h1>

              {/* Rating and Reviews */}
              <div className="product-rating">
                <div className="rating-stars">
                  {renderStars(productData.averageRating)}
                </div>
                <div className="rating-info">
                  <span className="rating-value">{productData.averageRating.toFixed(1)}</span>
                  <span className="rating-count">({productData.totalReviews} reviews)</span>
                </div>
              </div>

              {/* Brand */}
              {productData.brand && productData.brand !== 'N/A' && (
                <div className="product-brand">
                  <span className="brand-label">Brand:</span>
                  <span className="brand-name">{productData.brand}</span>
                </div>
              )}
            </div>

            {/* Price Section */}
            <div className="swiggy-price-section">
              <div className="price-main">
                <span className="current-price">{formatPrice(price)}</span>
                <span className="price-unit">/{productData.pricing.unit}</span>
              </div>
              
              <div className="price-details">
                {productData.pricing.includesGST && (
                  <span className="gst-info">+ {productData.pricing.gstRate}% GST</span>
                )}
                {minQuantity > 1 && (
                  <span className="min-order">
                    Minimum order: {minQuantity} {productData.pricing.unit}
                  </span>
                )}
              </div>
            </div>

            {/* Stock Status */}
            <div className="swiggy-stock-section">
              <div className={`stock-status ${isInStock ? 'in-stock' : 'out-of-stock'}`}>
                <span className="status-icon">
                  {isInStock ? '✓' : '✗'}
                </span>
                <span className="status-text">
                  {isInStock ? 
                    `In Stock (${stockQuantity} ${productData.pricing.unit} available)` : 
                    'Out of Stock'
                  }
                </span>
              </div>
              
              {productData.deliveryTime && productData.deliveryTime !== 'N/A' && (
                <div className="delivery-info">
                  <span className="delivery-icon">🚚</span>
                  <span>Delivery: {productData.deliveryTime}</span>
                </div>
              )}
            </div>

            {/* Quantity Selector */}
            {isInStock && user && user.role !== 'supplier' && (
              <div className="swiggy-quantity-section">
                <label className="quantity-label">Quantity:</label>
                <div className="quantity-controls">
                  <button 
                    className="quantity-btn"
                    onClick={() => handleQuantityChange(quantity - 1)}
                    disabled={quantity <= minQuantity}
                  >
                    -
                  </button>
                  <span className="quantity-value">
                    {quantity} {productData.pricing.unit}
                  </span>
                  <button 
                    className="quantity-btn"
                    onClick={() => handleQuantityChange(quantity + 1)}
                    disabled={quantity >= stockQuantity}
                  >
                    +
                  </button>
                </div>
                <span className="quantity-info">
                  Min: {minQuantity} • Max: {stockQuantity}
                </span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="swiggy-action-buttons">
              {user && user.role !== 'supplier' ? (
                <>
                  <button 
                    className={`swiggy-btn swiggy-btn-primary ${!isInStock ? 'disabled' : ''}`}
                    onClick={handleAddToCart}
                    disabled={!isInStock || addToCartMutation.isLoading}
                  >
                    {addToCartMutation.isLoading ? (
                      <>
                        <span className="btn-spinner">⏳</span>
                        Adding to Cart...
                      </>
                    ) : (
                      <>
                        <span className="btn-icon">🛒</span>
                        Add to Cart
                      </>
                    )}
                  </button>

                  <button 
                    className={`swiggy-btn swiggy-btn-outline ${isWishlisted ? 'wishlisted' : ''}`}
                    onClick={handleAddToWishlist}
                    disabled={addToWishlistMutation.isLoading}
                  >
                    <span className="btn-icon">{isWishlisted ? '❤️' : '🤍'}</span>
                    {isWishlisted ? 'Wishlisted' : 'Add to Wishlist'}
                  </button>
                </>
              ) : !user ? (
                <button 
                  className="swiggy-btn swiggy-btn-primary"
                  onClick={() => navigate('/auth/login')}
                >
                  <span className="btn-icon">🔐</span>
                  Login to Purchase
                </button>
              ) : (
                <div className="supplier-notice">
                  <span className="notice-icon">ℹ️</span>
                  Suppliers cannot purchase products
                </div>
              )}
            </div>

            {/* Supplier Information */}
            {productData.supplier && (
              <div className="swiggy-supplier-info">
                <h3 className="supplier-title">Sold by</h3>
                <div className="supplier-card">
                  <div className="supplier-icon">🏪</div>
                  <div className="supplier-details">
                    <div className="supplier-name">{productData.supplier.companyName}</div>
                    <div className="supplier-stats">
                      <span className="supplier-rating">
                        ⭐ {productData.supplier.rating.toFixed(1)}
                      </span>
                      <span className="supplier-orders">
                        📦 {productData.supplier.totalOrders} orders
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="swiggy-product-tabs">
          <div className="tab-navigation">
            <button 
              className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <span className="tab-icon">📋</span>
              Overview
            </button>
            <button 
              className={`tab-btn ${activeTab === 'specifications' ? 'active' : ''}`}
              onClick={() => setActiveTab('specifications')}
            >
              <span className="tab-icon">⚙️</span>
              Specifications
            </button>
            <button 
              className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
              onClick={() => setActiveTab('reviews')}
            >
              <span className="tab-icon">⭐</span>
              Reviews ({productData.totalReviews})
            </button>
          </div>

          <div className="tab-content">
            {activeTab === 'overview' && (
              <div className="overview-content">
                <div className="product-description">
                  <h3>Product Description</h3>
                  <p>{productData.description || 'No description available for this product.'}</p>
                </div>

                <div className="product-highlights">
                  <h3>Key Features</h3>
                  <div className="highlights-grid">
                    <div className="highlight-item">
                      <span className="highlight-icon">📦</span>
                      <div className="highlight-content">
                        <strong>Category</strong>
                        <span>{productData.category}</span>
                      </div>
                    </div>
                    
                    {productData.hsnCode && productData.hsnCode !== 'N/A' && (
                      <div className="highlight-item">
                        <span className="highlight-icon">🏷️</span>
                        <div className="highlight-content">
                          <strong>HSN Code</strong>
                          <span>{productData.hsnCode}</span>
                        </div>
                      </div>
                    )}
                    
                    <div className="highlight-item">
                      <span className="highlight-icon">📏</span>
                      <div className="highlight-content">
                        <strong>Unit</strong>
                        <span>{productData.pricing.unit}</span>
                      </div>
                    </div>
                    
                    <div className="highlight-item">
                      <span className="highlight-icon">🚚</span>
                      <div className="highlight-content">
                        <strong>Delivery Time</strong>
                        <span>{productData.deliveryTime}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'specifications' && (
              <div className="specifications-content">
                <h3>Technical Specifications</h3>
                {Object.keys(productData.specifications).length > 0 ? (
                  <div className="specs-table">
                    {Object.entries(productData.specifications).map(([key, value]) => (
                      <div key={key} className="spec-row">
                        <span className="spec-label">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                        <span className="spec-value">{value}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-specs">
                    <span className="no-specs-icon">📋</span>
                    <p>No detailed specifications available for this product.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="reviews-content">
                <ReviewSection productId={productData._id} />
              </div>
            )}
          </div>
        </div>

        {/* Image Modal */}
        {showImageModal && hasImages && (
          <div className="swiggy-image-modal" onClick={() => setShowImageModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button 
                className="modal-close"
                onClick={() => setShowImageModal(false)}
              >
                ✕
              </button>
              <img 
                src={images[selectedImage]?.url}
                alt={productData.name}
                className="modal-image"
                onError={(e) => { e.target.src = '/placeholder-product.jpg' }}
              />
              <div className="modal-navigation">
                <button 
                  className="nav-btn prev"
                  onClick={() => setSelectedImage(selectedImage > 0 ? selectedImage - 1 : images.length - 1)}
                >
                  ‹
                </button>
                <span className="image-counter">
                  {selectedImage + 1} / {images.length}
                </span>
                <button 
                  className="nav-btn next"
                  onClick={() => setSelectedImage(selectedImage < images.length - 1 ? selectedImage + 1 : 0)}
                >
                  ›
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductDetailPage