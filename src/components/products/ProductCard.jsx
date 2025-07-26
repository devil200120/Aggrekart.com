import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from 'react-query'
import { cartAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { toast } from 'react-hot-toast'
import ImageWithFallback from '../common/ImageWithFallback'
import './ProductCard.css'
import '../common/ImageWithFallback.css'

const ProductCard = ({ product, viewMode = 'grid' }) => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [quantity, setQuantity] = useState(1)
  const [isAddingToCart, setIsAddingToCart] = useState(false)

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

  const addToCartMutation = useMutation(
    (data) => cartAPI.addToCart(data),
    {
      onSuccess: () => {
        toast.success('Added to cart successfully!')
        queryClient.invalidateQueries('cart')
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
    
    if (!user) {
      toast.error('Please login to add items to cart')
      return
    }

    if (user.role === 'supplier') {
      toast.error('Suppliers cannot purchase products')
      return
    }

    setIsAddingToCart(true)
    addToCartMutation.mutate({
      productId: product._id,
      quantity
    })
  }

  const formatPrice = (price) => {
    const numPrice = safeNumber(price);
    if (numPrice === 0) return '₹0';
    
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(numPrice)
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

  // Extract data with proper fallbacks based on the actual database schema
  const productData = {
  _id: product._id || '',
  name: safeRender(product.name, 'Unnamed Product'),
  description: safeRender(product.description, 'No description available'),
  
  // Images - FIXED to match backend response
  images: product.images || [],
  primaryImage: product.primaryImage || product.image || (product.images?.[0]?.url),
  
  // Price from pricing.basePrice
  price: safeNumber(product.pricing?.basePrice || product.price),
  originalPrice: safeNumber(product.pricing?.originalPrice || product.originalPrice),
  unit: safeRender(product.pricing?.unit || product.unit, 'unit'),
  
  // Stock from stock.available 
  inStock: product.stock?.available > 0 || product.inStock || false,
  stockQuantity: safeNumber(product.stock?.available || product.stockQuantity),
  
  // Ratings
  averageRating: safeNumber(product.ratings?.average || product.averageRating),
  reviewCount: safeNumber(product.ratings?.totalReviews || product.reviewCount || product.totalReviews),
  
  // Supplier info - FIXED to match backend response
  supplier: {
    _id: product.supplier?._id || '',
    businessName: safeRender(
      product.supplier?.companyName ||     // ← Backend sends 'companyName'
      product.supplierName ||              // ← Backend also sends 'supplierName' 
      product.supplier?.businessName ||    // ← Fallback for old data
      product.supplier?.name,              // ← Another fallback
      'Unknown Supplier'
    ),
    location: {
      city: safeRender(product.supplier?.location?.city, ''),
      state: safeRender(product.supplier?.location?.state, '')
    }
  },
  
  // Other fields
  minOrderQuantity: safeNumber(product.pricing?.minimumQuantity || product.minOrderQuantity),
  badge: product.badge
};

  if (viewMode === 'list') {
    return (
      <div className="product-card list-view">
        <Link to={`/products/${productData._id}`} className="product-link">
          <div className="product-image-container">
            <ImageWithFallback
  src={productData.primaryImage || '/placeholder-product.jpg'}
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
          </div>

          <div className="product-actions">
            <div className="product-pricing">
              <div className="price-main">
                {formatPrice(productData.price)}
                <span className="price-unit">/{productData.unit}</span>
              </div>
              {productData.originalPrice && productData.originalPrice > productData.price && (
                <div className="price-original">
                  {formatPrice(productData.originalPrice)}
                </div>
              )}
            </div>

            <div className="quantity-controls">
              <button 
                onClick={(e) => {
                  e.preventDefault()
                  setQuantity(Math.max(1, quantity - 1))
                }}
                className="quantity-btn"
                disabled={quantity <= 1}
              >
                -
              </button>
              <input 
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="quantity-input"
                min="1"
              />
              <button 
                onClick={(e) => {
                  e.preventDefault()
                  setQuantity(quantity + 1)
                }}
                className="quantity-btn"
              >
                +
              </button>
            </div>

            <button 
              onClick={handleAddToCart}
              disabled={isAddingToCart || !productData.inStock}
              className="btn btn-primary add-to-cart-btn"
            >
              {isAddingToCart ? '...' : !productData.inStock ? 'Out of Stock' : 'Add to Cart'}
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
  src={productData.primaryImage || '/placeholder-product.jpg'}
  alt={productData.name}
  className="product-image"
  fallbackType="product"
/>
          {productData.badge && (
            <span className={`product-badge ${productData.badge.type}`}>
              {productData.badge.text}
            </span>
          )}
          {!productData.inStock && (
            <div className="out-of-stock-overlay">
              <span>Out of Stock</span>
            </div>
          )}
        </div>
      </Link>

      <div className="product-info">
        <Link to={`/products/${productData._id}`} className="product-link">
          <h3 className="product-name">{productData.name}</h3>
        </Link>
        
        <div className="product-supplier">
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
          <div className="price-main">
            {formatPrice(productData.price)}
            <span className="price-unit">/{productData.unit}</span>
          </div>
          {productData.originalPrice && productData.originalPrice > productData.price && (
            <div className="price-original">
              {formatPrice(productData.originalPrice)}
            </div>
          )}
        </div>

        <div className="product-actions">
          <div className="quantity-controls">
            <button 
              onClick={(e) => {
                e.preventDefault()
                setQuantity(Math.max(1, quantity - 1))
              }}
              className="quantity-btn"
              disabled={quantity <= 1}
            >
              -
            </button>
            <input 
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="quantity-input"
              min="1"
            />
            <button 
              onClick={(e) => {
                e.preventDefault()
                setQuantity(quantity + 1)
              }}
              className="quantity-btn"
            >
              +
            </button>
          </div>

          <button 
            onClick={handleAddToCart}
            disabled={isAddingToCart || !productData.inStock}
            className="btn btn-primary add-to-cart-btn"
          >
            {isAddingToCart ? '...' : !productData.inStock ? 'Out of Stock' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProductCard
