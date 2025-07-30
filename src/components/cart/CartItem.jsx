import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import './CartItem.css'

const CartItem = ({ item }) => {
  const { updateCartItem, removeFromCart, isUpdating, isRemoving } = useCart()
  const [quantity, setQuantity] = useState(item.quantity)
  const [isUpdatingLocal, setIsUpdatingLocal] = useState(false)

  const product = item.product || {}
  
  // Fix price logic - use priceAtTime from cart item, fallback to product price
  const itemPrice = item.priceAtTime || item.price || product.pricing?.basePrice || product.price || 0
  const itemTotal = itemPrice * quantity

  const formatPrice = (price) => {
    if (!price || isNaN(price)) return '₹0'
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price)
  }

  const handleQuantityChange = async (newQuantity) => {
    if (newQuantity < 1) return
    
    setQuantity(newQuantity)
    setIsUpdatingLocal(true)
    
    try {
      await updateCartItem(item._id, newQuantity)
    } catch (error) {
      console.log(error)
      // Revert quantity on error
      setQuantity(item.quantity)
    } finally {
      setIsUpdatingLocal(false)
    }
  }

  const handleRemove = async () => {
    try {
      await removeFromCart(item._id)
    } catch (error) {
      console.error('Failed to remove item:', error)
    }
  }

  const isLoading = isUpdatingLocal || isUpdating || isRemoving

  // Calculate stock status
  const getStockStatus = () => {
    const available = product.stock?.available || 0;
    const reserved = product.stock?.reserved || 0;
    const actualStock = available - reserved;
    const isInStock = product.inStock || actualStock > 0;
    
    return {
      isInStock,
      actualStock,
      text: isInStock 
        ? `In Stock${actualStock > 0 ? ` (${actualStock} available)` : ''}`
        : 'Out of Stock'
    };
  }

  const stockStatus = getStockStatus();

  return (
    <div className={`cart-item ${isLoading ? 'loading' : ''}`}>
      <div className="cart-item-content">
        {/* Mobile/Tablet: Top Row - Image + Details */}
        <div className="cart-item-top">
          <div className="cart-item-image">
            <Link to={`/products/${product._id}`}>
              <img 
                src={product.images?.[0]?.url || product.images?.[0] || '/placeholder-product.jpg'} 
                alt={product.name}
                loading="lazy"
              />
            </Link>
          </div>

          <div className="cart-item-details">
            <div className="cart-item-info">
              <Link 
                to={`/products/${product._id}`}
                className="cart-item-name"
              >
                {product.name}
              </Link>
              
              <div className="cart-item-supplier">
                <span>Sold by:</span>
                <Link 
                  to={`/suppliers/${product.supplier?._id}`}
                  className="supplier-link"
                >
                  {product.supplier?.businessName || product.supplier?.companyName || 'Unknown Supplier'}
                </Link>
              </div>

              <div className="cart-item-specs">
                {product.category && (
                  <span className="spec">Category: {product.category}</span>
                )}
                {(product.pricing?.unit || product.unit) && (
                  <span className="spec">Unit: {product.pricing?.unit || product.unit}</span>
                )}
              </div>

              <div className={`stock-status ${stockStatus.isInStock ? 'in-stock' : 'out-of-stock'}`}>
                {stockStatus.isInStock ? '✅' : '❌'} {stockStatus.text}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile/Tablet: Middle Row - Quantity + Price */}
        <div className="cart-item-middle">
          {/* Quantity Controls */}
          <div className="cart-item-quantity">
            <label className="quantity-label">Quantity</label>
            <div className="quantity-controls">
              <button 
                onClick={() => handleQuantityChange(quantity - 1)}
                disabled={quantity <= 1 || isLoading}
                className="quantity-btn"
                aria-label="Decrease quantity"
              >
                -
              </button>
              <input 
                type="number"
                value={quantity}
                onChange={(e) => {
                  const newQty = Math.max(1, parseInt(e.target.value) || 1)
                  handleQuantityChange(newQty)
                }}
                disabled={isLoading}
                className="quantity-input"
                min="1"
                aria-label="Item quantity"
              />
              <button 
                onClick={() => handleQuantityChange(quantity + 1)}
                disabled={isLoading}
                className="quantity-btn"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </div>

          {/* Price */}
          <div className="cart-item-price">
            <div className="price-per-unit">
              {formatPrice(itemPrice)}/{product.pricing?.unit || product.unit || 'unit'}
            </div>
            <div className="price-total">
              {formatPrice(itemTotal)}
            </div>
          </div>
        </div>

        {/* Mobile/Tablet: Bottom Row - Actions */}
        <div className="cart-item-actions">
          <button
            onClick={handleRemove}
            disabled={isLoading}
            className="remove-btn"
            aria-label="Remove item from cart"
          >
            {isRemoving ? (
              <span>Removing...</span>
            ) : (
              <>
                <span className="remove-icon">🗑️</span>
                <span className="remove-text">Remove</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default CartItem