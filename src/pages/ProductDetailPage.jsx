import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { productsAPI, cartAPI, wishlistAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { toast } from 'react-hot-toast'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorMessage from '../components/common/ErrorMessage'
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
        console.log('API Response:', data)
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
    images: Array.isArray(product.images) ? product.images : [],
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
      companyName: safeRender(product.supplier.companyName, 'Unknown Supplier'),
      rating: safeNumber(product.supplier.rating),
      totalOrders: safeNumber(product.supplier.totalOrders)
    } : null,
    specifications: product.specifications || {}
  }

  const images = productData.images
  const hasImages = images.length > 0
  const isInStock = productData.stock.available > 0
  const price = productData.pricing.basePrice
  const stockQuantity = productData.stock.available
  const minQuantity = productData.pricing.minimumQuantity

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
                <img 
                  src={images[selectedImage]?.url || images[0]?.url} 
                  alt={productData.name}
                  className="product-main-image"
                />
              ) : (
                <div className="no-image-placeholder">
                  <div className="placeholder-icon">📦</div>
                  <span>No Image Available</span>
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
                    <img src={image.url} alt={`${productData.name} ${index + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="product-info">
            <h1 className="product-title">{productData.name}</h1>
            
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
                ({productData.averageRating}) • {productData.totalReviews} reviews
              </span>
            </div>

            {/* Price */}
            <div className="product-price">
              <span className="current-price">
                ₹{price.toLocaleString()}
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

            {/* Description */}
            {productData.description && (
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
                <div className="detail-item">
                  <span className="detail-label">Category:</span>
                  <span className="detail-value">{productData.category}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Subcategory:</span>
                  <span className="detail-value">{productData.subcategory}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Brand:</span>
                  <span className="detail-value">{productData.brand}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">HSN Code:</span>
                  <span className="detail-value">{productData.hsnCode}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Delivery Time:</span>
                  <span className="detail-value">{productData.deliveryTime}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Product ID:</span>
                  <span className="detail-value">{productData.productId}</span>
                </div>
                
                {/* Specifications */}
                {Object.keys(productData.specifications).map((key) => {
                  const value = productData.specifications[key]
                  if (value) {
                    return (
                      <div key={key} className="detail-item">
                        <span className="detail-label">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                        </span>
                        <span className="detail-value">{safeRender(value)}</span>
                      </div>
                    )
                  }
                  return null
                })}
              </div>
            </div>

            {/* Supplier Info */}
            {productData.supplier && (
              <div className="supplier-info">
                <h3>Supplier</h3>
                <p>
                  <strong>{productData.supplier.companyName}</strong>
                </p>
                {productData.supplier.rating > 0 && (
                  <div className="supplier-rating">
                    <span>Rating: </span>
                    <div className="stars">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span 
                          key={star}
                          className={`star ${star <= productData.supplier.rating ? 'filled' : ''}`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <span>({productData.supplier.rating})</span>
                  </div>
                )}
                <p className="supplier-orders">
                  Total Orders: {productData.supplier.totalOrders}
                </p>
              </div>
            )}

            {/* Quantity and Actions */}
            <div className="product-actions">
              {isInStock && (
                <div className="quantity-selector">
                  <label htmlFor="quantity">Quantity ({productData.pricing.unit}):</label>
                  <div className="quantity-controls">
                    <button 
                      onClick={() => setQuantity(Math.max(minQuantity, quantity - 1))}
                      disabled={quantity <= minQuantity}
                    >
                      -
                    </button>
                    <input 
                      type="number" 
                      id="quantity"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(minQuantity, parseInt(e.target.value) || minQuantity))}
                      min={minQuantity}
                      max={stockQuantity}
                    />
                    <button 
                      onClick={() => setQuantity(Math.min(stockQuantity, quantity + 1))}
                      disabled={quantity >= stockQuantity}
                    >
                      +
                    </button>
                  </div>
                  <div className="quantity-info">
                    Total: ₹{(price * quantity).toLocaleString()}
                    {!productData.pricing.includesGST && (
                      <span className="gst-extra"> + {productData.pricing.gstRate}% GST</span>
                    )}
                  </div>
                </div>
              )}

              <div className="action-buttons">
                {isInStock ? (
                  <>
                    <button 
                      className="btn btn-primary btn-buy-now"
                      onClick={handleBuyNow}
                      disabled={addToCartMutation.isLoading}
                    >
                      {addToCartMutation.isLoading ? 'Processing...' : 'Buy Now'}
                    </button>
                    
                    <button 
                      className="btn btn-secondary btn-add-to-cart"
                      onClick={handleAddToCart}
                      disabled={addToCartMutation.isLoading}
                    >
                      {addToCartMutation.isLoading ? 'Adding...' : 'Add to Cart'}
                    </button>
                    
                    <button 
                      className="btn btn-outline btn-wishlist"
                      onClick={handleAddToWishlist}
                      disabled={addToWishlistMutation.isLoading}
                    >
                      {addToWishlistMutation.isLoading ? '...' : '♡'} Wishlist
                    </button>
                  </>
                ) : (
                  <button className="btn btn-disabled" disabled>
                    Out of Stock
                  </button>
                )}
              </div>

              {/* Trust Indicators */}
              <div className="trust-indicators">
                <div className="trust-item">
                  <span className="trust-icon">🔒</span>
                  <span>Secure Payment</span>
                </div>
                <div className="trust-item">
                  <span className="trust-icon">↩️</span>
                  <span>Easy Returns</span>
                </div>
                <div className="trust-item">
                  <span className="trust-icon">🚚</span>
                  <span>{productData.deliveryTime}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetailPage