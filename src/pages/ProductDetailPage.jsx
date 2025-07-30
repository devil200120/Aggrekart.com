import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { productsAPI, cartAPI, wishlistAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { toast } from 'react-hot-toast'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorMessage from '../components/common/ErrorMessage'
import ImageWithFallback from '../components/common/ImageWithFallback'
import ReviewSection from '../components/products/ReviewSection'
import './ProductDetailPage.css'

const ProductDetailPage = () => {
  const { productId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { refreshCart } = useCart()
  const queryClient = useQueryClient()
  
  // ALL HOOKS MUST BE CALLED AT THE TOP LEVEL - NEVER CONDITIONALLY
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)
  const [activeTab, setActiveTab] = useState('description')

  // Fetch product details - This hook must always be called
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

  // Add to cart mutation - This hook must always be called
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

  // Add to wishlist mutation - This hook must always be called
  const addToWishlistMutation = useMutation(
    (productId) => wishlistAPI.addToWishlist(productId),
    {
      onSuccess: () => {
        toast.success('Added to wishlist!')
        queryClient.invalidateQueries('wishlist')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to add to wishlist')
      }
    }
  )

  // Helper functions - These are safe to define here
  const safeRender = (value, defaultValue = 'N/A') => {
    if (value === null || value === undefined || value === '') {
      return defaultValue
    }
    if (typeof value === 'object') {
      return JSON.stringify(value)
    }
    return String(value)
  }

  const safeNumber = (value, defaultValue = 0) => {
    const num = Number(value)
    return isNaN(num) ? defaultValue : num
  }

  const calculateAvailableStock = (stock) => {
    return Math.max(0, stock?.available || 0)
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price)
  }

  // Process product data - This should be done after hooks
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
      productId: safeRender(product.productId),
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
        companyName: safeRender(
          product.supplier.companyName || 
          product.supplier.businessName || 
          product.supplier.name, 
          'Unknown Supplier'
        ),
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
    stockQuantity = calculateAvailableStock(productData.stock)
    isInStock = stockQuantity > 0
  }

  // Effect to update quantity when minimum quantity changes
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

  const handleBuyNow = () => {
    if (!user) {
      toast.error('Please login to purchase')
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

    addToCartMutation.mutate(
      {
        productId: productData._id,
        quantity
      },
      {
        onSuccess: () => {
          navigate('/checkout')
        }
      }
    )
  }

  // Render loading state
  if (isLoading) {
    return (
      <div className="product-detail-loading">
        <LoadingSpinner size="large" />
        <p>Loading product details...</p>
      </div>
    )
  }

  // Render error state
  if (error) {
    return (
      <div className="product-detail-error">
        <ErrorMessage 
          message={error.response?.data?.message || error.message || 'Failed to load product details'} 
        />
        <div className="error-actions">
          <button onClick={() => window.location.reload()} className="btn btn-primary">
            Try Again
          </button>
          <button onClick={() => navigate('/products')} className="btn btn-secondary">
            Back to Products
          </button>
        </div>
      </div>
    )
  }

  // Render product not found
  if (!productData) {
    return (
      <div className="product-detail-error">
        <ErrorMessage message="Product not found" />
        <button onClick={() => navigate('/products')} className="btn btn-primary">
          Back to Products
        </button>
      </div>
    )
  }

  // Main render
  return (
    <div className="product-detail-page">
      <div className="container">
        {/* Breadcrumb */}
        <nav className="breadcrumb">
          <button onClick={() => navigate('/')} className="breadcrumb-link">
            <span className="breadcrumb-icon">🏠</span>
            Home
          </button>
          <span className="breadcrumb-separator">›</span>
          <button onClick={() => navigate('/products')} className="breadcrumb-link">
            Products
          </button>
          <span className="breadcrumb-separator">›</span>
          <span className="breadcrumb-current">{productData.category}</span>
          <span className="breadcrumb-separator">›</span>
          <span className="breadcrumb-current">{productData.name}</span>
        </nav>

        <div className="product-detail-content">
          {/* Product Images Section */}
          <div className="product-images-section">
            <div className="main-image-container">
              {hasImages ? (
                <div className="main-image" onClick={() => setShowImageModal(true)}>
                  <ImageWithFallback
                    src={images[selectedImage]?.url || images[0]?.url}
                    alt={productData.name}
                    className="product-main-image"
                    fallbackType="product"
                  />
                  <div className="image-overlay">
                    <span className="zoom-hint">🔍 Click to zoom</span>
                  </div>
                </div>
              ) : (
                <div className="no-image-placeholder">
                  <div className="placeholder-content">
                    <div className="placeholder-icon">📦</div>
                    <span className="placeholder-text">No Image Available</span>
                    <small className="placeholder-subtext">Product images will appear here</small>
                  </div>
                </div>
              )}
              
              {/* Image indicators for mobile */}
              {hasImages && images.length > 1 && (
                <div className="image-indicators">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      className={`indicator ${selectedImage === index ? 'active' : ''}`}
                      onClick={() => setSelectedImage(index)}
                    />
                  ))}
                </div>
              )}
            </div>
            
            {/* Thumbnail gallery for desktop */}
            {hasImages && images.length > 1 && (
              <div className="image-thumbnails">
                {images.map((image, index) => (
                  <button
                    key={index}
                    className={`thumbnail ${selectedImage === index ? 'active' : ''}`}
                    onClick={() => setSelectedImage(index)}
                  >
                    <ImageWithFallback
                      src={image.url}
                      alt={`${productData.name} ${index + 1}`}
                      fallbackType="product"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info Section */}
          <div className="product-info-section">
            {/* Product Header */}
            <div className="product-header">
              <h1 className="product-title">{productData.name}</h1>
              
              {/* Brand & Category */}
              <div className="product-meta">
                {productData.brand && productData.brand !== 'N/A' && (
                  <span className="product-brand">
                    <span className="meta-label">Brand:</span> {productData.brand}
                  </span>
                )}
                <span className="product-category">
                  <span className="meta-label">Category:</span> {productData.category}
                </span>
              </div>
              
              {/* Rating */}
              <div className="product-rating">
                <div className="rating-stars">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span 
                      key={star} 
                      className={`star ${star <= productData.averageRating ? 'filled' : ''}`}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <span className="rating-text">
                  {productData.averageRating.toFixed(1)} ({productData.totalReviews} review{productData.totalReviews !== 1 ? 's' : ''})
                </span>
              </div>
            </div>

            {/* Price Section */}
            <div className="price-section">
              <div className="price-main">
                <span className="current-price">
                  {formatPrice(price)}
                </span>
                <span className="price-unit">/{productData.pricing.unit}</span>
              </div>
              <div className="price-details">
                <span className="gst-info">
                  {productData.pricing.includesGST ? 
                    `Inclusive of ${productData.pricing.gstRate}% GST` : 
                    `+ ${productData.pricing.gstRate}% GST`
                  }
                </span>
                {minQuantity > 1 && (
                  <span className="min-order">
                    Minimum order: {minQuantity} {productData.pricing.unit}
                  </span>
                )}
              </div>
            </div>

            {/* Stock & Availability */}
            <div className="availability-section">
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

            {/* Quantity & Actions */}
            {isInStock && (
              <div className="purchase-section">
                <div className="quantity-section">
                  <label className="quantity-label">Quantity:</label>
                  <div className="quantity-controls">
                    <button 
                      onClick={() => setQuantity(Math.max(minQuantity, quantity - 1))}
                      disabled={quantity <= minQuantity}
                      className="quantity-btn"
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <input 
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(minQuantity, parseInt(e.target.value) || minQuantity))}
                      min={minQuantity}
                      max={stockQuantity}
                      className="quantity-input"
                      aria-label="Product quantity"
                    />
                    <button 
                      onClick={() => setQuantity(Math.min(stockQuantity, quantity + 1))}
                      disabled={quantity >= stockQuantity}
                      className="quantity-btn"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                  <span className="quantity-unit">{productData.pricing.unit}</span>
                </div>

                <div className="action-buttons">
                  <button 
                    onClick={handleAddToCart}
                    disabled={addToCartMutation.isLoading}
                    className="btn btn-secondary add-to-cart-btn"
                  >
                    <span className="btn-icon">🛒</span>
                    {addToCartMutation.isLoading ? 'Adding...' : 'Add to Cart'}
                  </button>
                  
                  <button 
                    onClick={handleBuyNow}
                    disabled={addToCartMutation.isLoading}
                    className="btn btn-primary buy-now-btn"
                  >
                    <span className="btn-icon">⚡</span>
                    Buy Now
                  </button>
                  
                  <button 
                    onClick={handleAddToWishlist}
                    disabled={addToWishlistMutation.isLoading}
                    className="btn btn-outline wishlist-btn"
                    title="Add to Wishlist"
                    aria-label="Add to wishlist"
                  >
                    ♡
                  </button>
                </div>

                {/* Total Price Display */}
                <div className="total-price">
                  <span className="total-label">Total: </span>
                  <span className="total-amount">{formatPrice(price * quantity)}</span>
                </div>
              </div>
            )}

            {/* Supplier Info */}
            {productData.supplier && (
              <div className="supplier-section">
                <h4 className="supplier-title">
                  <span className="supplier-icon">🏪</span>
                  Supplier Information
                </h4>
                <div className="supplier-card">
                  <div className="supplier-details">
                    <div className="supplier-name">{productData.supplier.companyName}</div>
                    {productData.supplier.location.city && (
                      <div className="supplier-location">
                        <span className="location-icon">📍</span>
                        {productData.supplier.location.city}
                        {productData.supplier.location.state && `, ${productData.supplier.location.state}`}
                      </div>
                    )}
                    {productData.supplier.rating > 0 && (
                      <div className="supplier-rating">
                        <span className="rating-icon">⭐</span>
                        {productData.supplier.rating.toFixed(1)} supplier rating
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="product-details-section">
          <div className="details-tabs">
            <button 
              className={`tab ${activeTab === 'description' ? 'active' : ''}`}
              onClick={() => setActiveTab('description')}
            >
              Description
            </button>
            <button 
              className={`tab ${activeTab === 'specifications' ? 'active' : ''}`}
              onClick={() => setActiveTab('specifications')}
            >
              Specifications
            </button>
            <button 
              className={`tab ${activeTab === 'details' ? 'active' : ''}`}
              onClick={() => setActiveTab('details')}
            >
              Product Details
            </button>
          </div>

          <div className="details-content">
            {/* Description Tab */}
            {activeTab === 'description' && (
              <div className="tab-content">
                {productData.description && productData.description !== 'N/A' ? (
                  <div className="description-content">
                    <p className={showFullDescription ? 'full' : 'truncated'}>
                      {productData.description}
                    </p>
                    {productData.description.length > 200 && (
                      <button 
                        className="description-toggle"
                        onClick={() => setShowFullDescription(!showFullDescription)}
                      >
                        {showFullDescription ? 'Show Less' : 'Read More'}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="no-content">
                    <span className="no-content-icon">📝</span>
                    <p>No description available for this product.</p>
                  </div>
                )}
              </div>
            )}

            {/* Specifications Tab */}
            {activeTab === 'specifications' && (
              <div className="tab-content">
                {Object.keys(productData.specifications).length > 0 ? (
                  <div className="specifications-grid">
                    {Object.entries(productData.specifications).map(([key, value]) => (
                      <div key={key} className="spec-item">
                        <span className="spec-label">{key}</span>
                        <span className="spec-value">{safeRender(value)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-content">
                    <span className="no-content-icon">📋</span>
                    <p>No specifications available for this product.</p>
                  </div>
                )}
              </div>
            )}

            {/* Product Details Tab */}
            {activeTab === 'details' && (
              <div className="tab-content">
                <div className="details-grid">
                  <div className="detail-item">
                    <span className="detail-label">Category</span>
                    <span className="detail-value">{productData.category}</span>
                  </div>
                  {productData.subcategory && productData.subcategory !== 'N/A' && (
                    <div className="detail-item">
                      <span className="detail-label">Subcategory</span>
                      <span className="detail-value">{productData.subcategory}</span>
                    </div>
                  )}
                  {productData.hsnCode && productData.hsnCode !== 'N/A' && (
                    <div className="detail-item">
                      <span className="detail-label">HSN Code</span>
                      <span className="detail-value">{productData.hsnCode}</span>
                    </div>
                  )}
                  <div className="detail-item">
                    <span className="detail-label">Unit</span>
                    <span className="detail-value">{productData.pricing.unit}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Delivery Time</span>
                    <span className="detail-value">{productData.deliveryTime}</span>
                  </div>
                  {productData.productId && productData.productId !== 'N/A' && (
                    <div className="detail-item">
                      <span className="detail-label">Product ID</span>
                      <span className="detail-value">{productData.productId}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <ReviewSection productId={productData._id} />

        {/* Image Modal */}
        {showImageModal && hasImages && (
          <div className="image-modal" onClick={() => setShowImageModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button 
                className="modal-close"
                onClick={() => setShowImageModal(false)}
                aria-label="Close modal"
              >
                ✕
              </button>
              <img 
                src={images[selectedImage]?.url} 
                alt={productData.name}
                className="modal-image"
              />
              {images.length > 1 && (
                <div className="modal-navigation">
                  <button 
                    className="nav-btn prev"
                    onClick={() => setSelectedImage(selectedImage > 0 ? selectedImage - 1 : images.length - 1)}
                    aria-label="Previous image"
                  >
                    ‹
                  </button>
                  <button 
                    className="nav-btn next"
                    onClick={() => setSelectedImage(selectedImage < images.length - 1 ? selectedImage + 1 : 0)}
                    aria-label="Next image"
                  >
                    ›
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductDetailPage