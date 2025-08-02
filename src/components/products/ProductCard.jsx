import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from 'react-query'
import { cartAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { toast } from 'react-hot-toast'
import ImageWithFallback from '../common/ImageWithFallback'
import './ProductCard.css'
import {  useNavigate } from 'react-router-dom'

const ProductCard = ({ product, viewMode = 'grid' }) => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [quantity, setQuantity] = useState(1)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [showQuantityInput, setShowQuantityInput] = useState(false)

  // Safe rendering functions to handle undefined/null values
  const safeRender = (value, fallback = '') => {
    if (value === null || value === undefined) return fallback;
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  const safeNumber = (value, fallback = 0) => {
    if (value === null || value === undefined || isNaN(value)) return fallback;
    return Number(value);
  };

  // Extract product data with enhanced quantity controls
  const productData = {
    _id: product._id || '',
    name: safeRender(product.name, 'Construction Material'),
    description: safeRender(product.description, 'High quality construction material'),
    
    // Images
    images: product.images || [],
    primaryImage: product.primaryImage || product.image || (product.images?.[0]?.url) || '/placeholder-product.jpg',
    
    // Price from pricing.basePrice
    price: safeNumber(product.pricing?.basePrice || product.price, 999),
    originalPrice: safeNumber(product.pricing?.originalPrice || product.originalPrice),
    unit: safeRender(product.pricing?.unit || product.unit, 'unit'),
    
    // Stock info
    inStock: product.stock?.available > 0 || product.inStock !== false,
    stockQuantity: safeNumber(product.stock?.available || product.stockQuantity, 100),
    
    // Quantity constraints
    minOrderQuantity: safeNumber(product.pricing?.minimumQuantity || product.minOrderQuantity, 1),
    maxOrderQuantity: safeNumber(product.stock?.available || product.stockQuantity, 100),
    
    // Ratings
    averageRating: safeNumber(product.ratings?.average || product.averageRating || product.rating, 4.2),
    reviewCount: safeNumber(product.ratings?.totalReviews || product.reviewCount || product.totalReviews || product.reviews, 25),
    
    // Supplier info
    supplier: {
      _id: product.supplier?._id || '',
      businessName: safeRender(
        product.supplier?.companyName ||
        product.supplierName ||
        product.supplier?.businessName ||
        product.supplier?.name,
        'Verified Supplier'
      ),
      location: {
        city: safeRender(product.supplier?.location?.city, ''),
        state: safeRender(product.supplier?.location?.state, '')
      }
    },
    
    category: safeRender(product.category, 'Construction'),
    badge: product.badge
  };

  // Set initial quantity to minimum order quantity
  useEffect(() => {
    setQuantity(productData.minOrderQuantity);
  }, [productData.minOrderQuantity]);

  const addToCartMutation = useMutation(
    (data) => cartAPI.addToCart(data),
    {
      onSuccess: () => {
        toast.success(`Added ${quantity} ${productData.unit}${quantity > 1 ? 's' : ''} to cart!`)
        queryClient.invalidateQueries('cart')
        
        // 🆕 REDIRECT TO CART PAGE AFTER SUCCESS
        setTimeout(() => {
          navigate('/cart')
        }, 1500) // Wait 1.5 seconds to show success message
        
        // Reset quantity to minimum after successful add
        setQuantity(productData.minOrderQuantity)
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to add to cart')
      },
      onSettled: () => {
        setIsAddingToCart(false)
      }
    }
  )

  const handleAddToCart = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!user) {
      toast.error('Please login to add items to cart')
      return
    }

    if (user.role === 'supplier') {
      toast.error('Suppliers cannot purchase products')
      return
    }

    // Validate quantity
    if (quantity < productData.minOrderQuantity) {
      toast.error(`Minimum order quantity is ${productData.minOrderQuantity} ${productData.unit}${productData.minOrderQuantity > 1 ? 's' : ''}`)
      return
    }

    if (quantity > productData.maxOrderQuantity) {
      toast.error(`Maximum available quantity is ${productData.maxOrderQuantity} ${productData.unit}${productData.maxOrderQuantity > 1 ? 's' : ''}`)
      return
    }

    setIsAddingToCart(true)
    addToCartMutation.mutate({
      productId: product._id,
      quantity
    })
  }

  const handleQuantityChange = (e, action) => {
    e.preventDefault()
    e.stopPropagation()
    
    let newQuantity = quantity;
    
    if (action === 'decrease') {
      newQuantity = Math.max(productData.minOrderQuantity, quantity - 1)
    } else if (action === 'increase') {
      newQuantity = Math.min(productData.maxOrderQuantity, quantity + 1)
    }
    
    setQuantity(newQuantity)
  }

  const handleDirectQuantityInput = (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    const value = parseInt(e.target.value) || productData.minOrderQuantity
    const clampedValue = Math.max(
      productData.minOrderQuantity, 
      Math.min(productData.maxOrderQuantity, value)
    )
    setQuantity(clampedValue)
  }

  const handleQuantityKeyPress = (e) => {
    if (e.key === 'Enter') {
      setShowQuantityInput(false)
    }
  }

  const getQuantitySteps = () => {
    // Quick quantity options based on product type
    const steps = [productData.minOrderQuantity]
    const max = Math.min(productData.maxOrderQuantity, 50)
    
    if (productData.unit === 'MT' || productData.unit === 'bags') {
      // For bulk items like cement/steel
      steps.push(5, 10, 25, 50)
    } else if (productData.unit === 'numbers') {
      // For bricks/blocks
      steps.push(100, 500, 1000, 5000)
    } else {
      // Default steps
      steps.push(5, 10, 20, 50)
    }
    
    return [...new Set(steps)].filter(step => step <= max && step >= productData.minOrderQuantity).sort((a, b) => a - b)
  }

  const formatPrice = (price) => {
    const numPrice = safeNumber(price);
    if (numPrice === 0) return '₹999';
    
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(numPrice)
  }

  const getTotalPrice = () => {
    return formatPrice(productData.price * quantity)
  }

  const renderStars = (rating) => {
    const stars = []
    const numRating = safeNumber(rating);
    const fullStars = Math.floor(numRating)
    const hasHalfStar = numRating % 1 !== 0

    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={i} className="star filled">★</span>)
    }

    if (hasHalfStar) {
      stars.push(<span key="half" className="star half">★</span>)
    }

    const remainingStars = 5 - Math.ceil(numRating)
    for (let i = 0; i < remainingStars; i++) {
      stars.push(<span key={`empty-${i}`} className="star empty">★</span>)
    }

    return stars
  }

  // Enhanced Quantity Controls Component
  const QuantityControls = () => (
    <div className="quantity-section">
      <div className="quantity-controls">
        <button 
          onClick={(e) => handleQuantityChange(e, 'decrease')}
          className="quantity-btn decrease"
          disabled={quantity <= productData.minOrderQuantity}
          title="Decrease quantity"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <path d="M2 6h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
        
        {showQuantityInput ? (
          <input
            type="number"
            value={quantity}
            onChange={handleDirectQuantityInput}
            onKeyPress={handleQuantityKeyPress}
            onBlur={() => setShowQuantityInput(false)}
            className="quantity-input"
            min={productData.minOrderQuantity}
            max={productData.maxOrderQuantity}
            autoFocus
          />
        ) : (
          <span 
            className="quantity-display"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setShowQuantityInput(true)
            }}
            title="Click to edit quantity"
          >
            {quantity}
          </span>
        )}
        
        <button 
          onClick={(e) => handleQuantityChange(e, 'increase')}
          className="quantity-btn increase"
          disabled={quantity >= productData.maxOrderQuantity}
          title="Increase quantity"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
      
      <div className="quantity-info">
        <span className="quantity-unit">{productData.unit}</span>
        {productData.minOrderQuantity > 1 && (
          <span className="min-order">Min: {productData.minOrderQuantity}</span>
        )}
      </div>
      
      {/* Quick quantity buttons */}
      <div className="quantity-quick-select">
        {getQuantitySteps().map(step => (
          <button
            key={step}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setQuantity(step)
            }}
            className={`quick-qty-btn ${quantity === step ? 'active' : ''}`}
            disabled={step > productData.maxOrderQuantity}
          >
            {step}
          </button>
        ))}
      </div>
    </div>
  )

  // List view
  if (viewMode === 'list') {
    return (
      <div className="product-card list-view">
        <Link to={`/products/${productData._id}`} className="product-link">
          <div className="product-image-container">
            <ImageWithFallback
              src={productData.primaryImage}
              alt={productData.name}
              className="product-image"
              fallbackType="product"
            />
            {productData.badge && (
              <span className={`product-badge ${productData.badge.type}`}>
                {productData.badge.text}
              </span>
            )}
          </div>
        </Link>

        <div className="product-info">
          <div className="product-details">
            <Link to={`/products/${productData._id}`} className="product-link">
              <h3 className="product-name">{productData.name}</h3>
            </Link>
            
            <div className="product-category">
              <span className="category-badge">{productData.category}</span>
            </div>
            
            <p className="product-description">{productData.description}</p>
            
            <div className="product-meta">
              <div className="product-supplier">
                <span className="supplier-label">By:</span>
                <Link 
                  to={`/suppliers/${productData.supplier._id}`}
                  className="supplier-name"
                >
                  {productData.supplier.businessName}
                </Link>
              </div>
              
              {productData.supplier.location.city && (
                <div className="product-location">
                  📍 {productData.supplier.location.city}
                  {productData.supplier.location.state && `, ${productData.supplier.location.state}`}
                </div>
              )}
            </div>

            <div className="product-rating">
              <div className="stars">
                {renderStars(productData.averageRating)}
              </div>
              <span className="rating-count">
                ({productData.reviewCount} reviews)
              </span>
            </div>

            <div className="stock-info">
              <span className={`stock-status ${productData.inStock ? 'in-stock' : 'out-of-stock'}`}>
                {productData.inStock ? `${productData.stockQuantity} available` : 'Out of stock'}
              </span>
            </div>
          </div>

          <div className="product-actions">
            <div className="product-pricing">
              <div className="price-info">
                <div className="price-main">
                  {formatPrice(productData.price)}
                  <span className="price-unit">/{productData.unit}</span>
                </div>
                {quantity > 1 && (
                  <div className="total-price">
                    Total: {getTotalPrice()}
                  </div>
                )}
                {productData.originalPrice && productData.originalPrice > productData.price && (
                  <div className="price-original">
                    {formatPrice(productData.originalPrice)}
                  </div>
                )}
              </div>
            </div>

            <QuantityControls />

            <button 
              onClick={handleAddToCart}
              disabled={isAddingToCart || !productData.inStock}
              className="btn btn-primary add-to-cart-btn"
            >
              {isAddingToCart ? (
                <>
                  <span className="loading-spinner"></span>
                  ADDING...
                </>
              ) : (
                <>
                  ADD {quantity} {productData.unit.toUpperCase()}{quantity > 1 ? 'S' : ''} TO CART
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Grid view (default)
  return (
    <div className="product-card grid-view">
      <Link to={`/products/${productData._id}`} className="product-link">
        <div className="product-image-container">
          <ImageWithFallback
            src={productData.primaryImage}
            alt={productData.name}
            className="product-image"
            fallbackType="product"
          />
          {productData.badge && (
            <span className={`product-badge ${productData.badge.type}`}>
              {productData.badge.text}
            </span>
          )}
        </div>
      </Link>

      <div className="product-info">
        <Link to={`/products/${productData._id}`} className="product-link">
          <h3 className="product-name">{productData.name}</h3>
        </Link>
        
        <div className="product-category">
          <span className="category-badge">{productData.category}</span>
        </div>
        
        <div className="product-supplier">
          <span className="supplier-label">By </span>
          <Link 
            to={`/suppliers/${productData.supplier._id}`}
            className="supplier-name"
          >
            {productData.supplier.businessName}
          </Link>
        </div>

        <div className="product-rating">
          <div className="stars">
            {renderStars(productData.averageRating)}
          </div>
          <span className="rating-count">
            ({productData.reviewCount})
          </span>
        </div>

        <div className="product-pricing">
          <div className="price-info">
            <div className="price-main">
              {formatPrice(productData.price)}
              <span className="price-unit">/{productData.unit}</span>
            </div>
            {quantity > 1 && (
              <div className="total-price">
                Total: {getTotalPrice()}
              </div>
            )}
            {productData.originalPrice && productData.originalPrice > productData.price && (
              <div className="price-original">
                {formatPrice(productData.originalPrice)}
              </div>
            )}
          </div>
        </div>

        <div className="stock-info">
          <span className={`stock-status ${productData.inStock ? 'in-stock' : 'out-of-stock'}`}>
            {productData.inStock ? `${productData.stockQuantity} available` : 'Out of stock'}
          </span>
        </div>

        <div className="product-actions">
          <QuantityControls />
          
          <button 
            onClick={handleAddToCart}
            disabled={isAddingToCart || !productData.inStock}
            className="btn btn-primary add-to-cart-btn"
          >
            {isAddingToCart ? (
              <>
                <span className="loading-spinner"></span>
                ADDING...
              </>
            ) : (
              <>
                ADD {quantity} {productData.unit.toUpperCase()}{quantity > 1 ? 'S' : ''} TO CART
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProductCard