import React, { useState } from 'react'
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
  
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [showFullDescription, setShowFullDescription] = useState(false)

  // Helper function to safely render values
  const safeRender = (value, defaultValue = 'N/A') => {
    if (value === null || value === undefined || value === '') {
      return defaultValue
    }
    if (typeof value === 'object') {
      return JSON.stringify(value)
    }
    return String(value)
  }

  // Helper function to safely get number values
  const safeNumber = (value, defaultValue = 0) => {
    const num = Number(value)
    return isNaN(num) ? defaultValue : num
  }

  // Fetch product details
  const { data: response, isLoading, error } = useQuery(
    ['product', productId],
    () => productsAPI.getProduct(productId),
    {
      enabled: !!productId,
      retry: 1,
      onError: (error) => {
        console.error('Failed to fetch product:', error)
      },
      onSuccess: (data) => {
        console.log('ProductDetailPage API Response:', data)
        console.log('Product data structure:', data?.data?.product)
        console.log('Images array:', data?.data?.product?.images)
        console.log('Supplier info:', data?.data?.product?.supplier)
        console.log('Reviews info:', {
          averageRating: data?.data?.product?.averageRating,
          totalReviews: data?.data?.product?.totalReviews,
          reviewsArray: data?.data?.product?.reviews?.length || 0
        })
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
        queryClient.invalidateQueries('wishlist')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to add to wishlist')
      }
    }
  )

  // Loading state
  if (isLoading) {
    return (
      <div className="product-detail-loading">
        <LoadingSpinner size="large" />
        <p>Loading product details...</p>
      </div>
    )
  }

  // Error state
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

  // Extract product data safely
  const product = response?.data?.product
  if (!product) {
    return (
      <div className="product-detail-error">
        <ErrorMessage message="Product not found" />
        <button onClick={() => navigate('/products')} className="btn btn-primary">
          Back to Products
        </button>
      </div>
    )
  }

  // Safely extract all product data with fallbacks
  const productData = {
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
    
    // Enhanced image handling with debugging
    images: (() => {
      console.log('Processing images:', product.images)
      
      if (!product.images || !Array.isArray(product.images)) {
        console.log('No images array found')
        return []
      }
      
      const validImages = product.images.filter(img => img && img.url)
      console.log('Valid images found:', validImages.length, validImages)
      return validImages
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

  const images = productData.images
  const hasImages = images.length > 0
  const isInStock = productData.stock.available > 0
  const price = productData.pricing.basePrice
  const stockQuantity = productData.stock.available
  const minQuantity = productData.pricing.minimumQuantity

  console.log('Final processed data:', {
    hasImages,
    imageCount: images.length,
    firstImageUrl: images[0]?.url,
    selectedImage,
    supplier: productData.supplier,
    reviews: {
      averageRating: productData.averageRating,
      totalReviews: productData.totalReviews
    }
  })

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

  return (
    <div className="product-detail-page">
      <div className="container">
        {/* Breadcrumb */}
        <nav className="breadcrumb">
          <button onClick={() => navigate('/products')} className="breadcrumb-link">
            Products
          </button>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">{productData.name}</span>
        </nav>

        <div className="product-detail-content">
          {/* Product Images */}
          <div className="product-images">
            <div className="main-image">
              {hasImages ? (
                <ImageWithFallback
                  src={images[selectedImage]?.url || images[0]?.url}
                  alt={productData.name}
                  className="product-main-image"
                  fallbackType="product"
                />
              ) : (
                <div className="no-image-placeholder">
                  <div className="placeholder-icon">📦</div>
                  <span>No Image Available</span>
                  <small>Product images will appear here once uploaded</small>
                </div>
              )}
            </div>
            
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

          {/* Product Info */}
          <div className="product-info">
            <h1 className="product-title">{productData.name}</h1>
            
            {/* Brand */}
            {productData.brand && productData.brand !== 'N/A' && (
              <div className="product-brand">
                <span className="brand-label">Brand:</span> {productData.brand}
              </div>
            )}
            
            {/* Rating */}
            <div className="product-rating">
              <div className="stars">
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
                ({productData.averageRating.toFixed(1)}) • {productData.totalReviews} review{productData.totalReviews !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Price */}
            <div className="product-price">
              <span className="current-price">
                ₹{price.toLocaleString('en-IN')}
                <span className="price-unit"> /{productData.pricing.unit}</span>
              </span>
              <div className="gst-info">
                {productData.pricing.includesGST ? 
                  `(GST ${productData.pricing.gstRate}% included)` : 
                  `(+ ${productData.pricing.gstRate}% GST)`
                }
              </div>
            </div>

            {/* Stock Status */}
            <div className={`stock-status ${isInStock ? 'in-stock' : 'out-of-stock'}`}>
              {isInStock ? (
                <span>✓ In Stock ({stockQuantity} {productData.pricing.unit} available)</span>
              ) : (
                <span>✗ Out of Stock</span>
              )}
            </div>

            {/* Minimum Order Info */}
            {minQuantity > 1 && (
              <div className="minimum-order">
                <span>⚠️ Minimum order: {minQuantity} {productData.pricing.unit}</span>
              </div>
            )}

            {/* Supplier Info */}
            {productData.supplier && (
              <div className="supplier-info">
                <h4>Supplier Information</h4>
                <div className="supplier-details">
                  <div className="supplier-name">
                    <strong>{productData.supplier.companyName}</strong>
                  </div>
                  {productData.supplier.location.city && (
                    <div className="supplier-location">
                      📍 {productData.supplier.location.city}
                      {productData.supplier.location.state && `, ${productData.supplier.location.state}`}
                    </div>
                  )}
                  {productData.supplier.rating > 0 && (
                    <div className="supplier-rating">
                      ⭐ {productData.supplier.rating.toFixed(1)} supplier rating
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Quantity Selection & Actions */}
            {isInStock && (
              <div className="product-actions">
                <div className="quantity-selector">
                  <label>Quantity:</label>
                  <div className="quantity-controls">
                    <button 
                      onClick={() => setQuantity(Math.max(minQuantity, quantity - 1))}
                      disabled={quantity <= minQuantity}
                      className="quantity-btn"
                    >
                      -
                    </button>
                    <input 
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(minQuantity, parseInt(e.target.value) || minQuantity))}
                      min={minQuantity}
                      max={stockQuantity}
                      className="quantity-input"
                    />
                    <button 
                      onClick={() => setQuantity(Math.min(stockQuantity, quantity + 1))}
                      disabled={quantity >= stockQuantity}
                      className="quantity-btn"
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
                    {addToCartMutation.isLoading ? 'Adding...' : 'Add to Cart'}
                  </button>
                  
                  <button 
                    onClick={handleBuyNow}
                    disabled={addToCartMutation.isLoading}
                    className="btn btn-primary buy-now-btn"
                  >
                    Buy Now
                  </button>
                  
                  <button 
                    onClick={handleAddToWishlist}
                    disabled={addToWishlistMutation.isLoading}
                    className="btn btn-outline wishlist-btn"
                    title="Add to Wishlist"
                  >
                    ♡
                  </button>
                </div>
              </div>
            )}

            {/* Description */}
            {productData.description && productData.description !== 'N/A' && (
              <div className="product-description">
                <h3>Description</h3>
                <p className={showFullDescription ? 'full' : 'truncated'}>
                  {productData.description}
                </p>
                {productData.description.length > 200 && (
                  <button 
                    className="description-toggle"
                    onClick={() => setShowFullDescription(!showFullDescription)}
                  >
                    {showFullDescription ? 'Show Less' : 'Show More'}
                  </button>
                )}
              </div>
            )}

            {/* Product Details */}
            <div className="product-details">
              <h3>Product Details</h3>
              <div className="details-grid">
                <div className="detail-row">
                  <span className="detail-label">Category:</span>
                  <span className="detail-value">{productData.category}</span>
                </div>
                {productData.subcategory && productData.subcategory !== 'N/A' && (
                  <div className="detail-row">
                    <span className="detail-label">Subcategory:</span>
                    <span className="detail-value">{productData.subcategory}</span>
                  </div>
                )}
                {productData.hsnCode && productData.hsnCode !== 'N/A' && (
                  <div className="detail-row">
                    <span className="detail-label">HSN Code:</span>
                    <span className="detail-value">{productData.hsnCode}</span>
                  </div>
                )}
                <div className="detail-row">
                  <span className="detail-label">Delivery Time:</span>
                  <span className="detail-value">{productData.deliveryTime}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Unit:</span>
                  <span className="detail-value">{productData.pricing.unit}</span>
                </div>
              </div>
            </div>

            {/* Specifications */}
            {Object.keys(productData.specifications).length > 0 && (
              <div className="product-specifications">
                <h3>Specifications</h3>
                <div className="specs-grid">
                  {Object.entries(productData.specifications).map(([key, value]) => (
                    <div key={key} className="spec-row">
                      <span className="spec-label">{key}:</span>
                      <span className="spec-value">{safeRender(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <ReviewSection productId={productData._id} />
      </div>
    </div>
  )
}

export default ProductDetailPage
