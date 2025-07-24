import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import CartItem from '../components/cart/CartItem'
import CartSummary from '../components/cart/CartSummary'
import LoadingSpinner from '../components/common/LoadingSpinner'
import './CartPage.css'

const CartPage = () => {
  const { user } = useAuth()
  const { 
    items, 
    total, 
    itemCount, 
    isLoading, 
    clearCart, 
    isClearing 
  } = useCart()
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  if (!user) {
    return (
      <div className="cart-page">
        <div className="container">
          <div className="cart-empty">
            <div className="empty-cart-icon">🛒</div>
            <h2>Please Login</h2>
            <p>You need to be logged in to view your cart</p>
            <Link to="/auth/login" className="btn btn-primary">
              Login Now
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (user.role !== 'customer') {
    return (
      <div className="cart-page">
        <div className="container">
          <div className="cart-empty">
            <div className="empty-cart-icon">🚫</div>
            <h2>Access Denied</h2>
            <p>Only customers can view cart</p>
            <Link to="/" className="btn btn-primary">
              Go Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="cart-page">
        <div className="container">
          <LoadingSpinner size="large" text="Loading your cart..." />
        </div>
      </div>
    )
  }

  if (!items || items.length === 0) {
    return (
      <div className="cart-page">
        <div className="container">
          <div className="cart-empty">
            <div className="empty-cart-icon">🛒</div>
            <h2>Your Cart is Empty</h2>
            <p>Looks like you haven't added any items to your cart yet</p>
            <Link to="/products" className="btn btn-primary">
              Start Shopping
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const handleClearCart = async () => {
    try {
      await clearCart()
      setShowClearConfirm(false)
    } catch (error) {
      console.error('Failed to clear cart:', error)
    }
  }

  return (
    <div className="cart-page">
      <div className="container">
        {/* Page Header */}
        <div className="cart-header">
          <div className="cart-header-left">
            <h1 className="cart-title">Shopping Cart</h1>
            <p className="cart-subtitle">
              {itemCount} {itemCount === 1 ? 'item' : 'items'} in your cart
            </p>
          </div>
          
          <div className="cart-header-actions">
            <button
              onClick={() => setShowClearConfirm(true)}
              className="btn btn-outline btn-sm"
              disabled={isClearing}
            >
              {isClearing ? '...' : 'Clear Cart'}
            </button>
          </div>
        </div>

        {/* Breadcrumb */}
        <nav className="breadcrumb">
          <Link to="/">Home</Link>
          <span className="breadcrumb-separator">›</span>
          <Link to="/products">Products</Link>
          <span className="breadcrumb-separator">›</span>
          <span className="breadcrumb-current">Cart</span>
        </nav>

        {/* Cart Content */}
        <div className="cart-content">
          {/* Cart Items */}
          <div className="cart-items-section">
            <div className="cart-items-header">
              <h3>Items in Cart</h3>
            </div>
            
            <div className="cart-items">
              {items.map((item) => (
                <CartItem 
                  key={item._id} 
                  item={item}
                />
              ))}
            </div>
          </div>

          {/* Cart Summary */}
          <div className="cart-summary-section">
            <CartSummary 
              items={items}
              total={total}
              itemCount={itemCount}
            />
          </div>
        </div>

        {/* Continue Shopping */}
        <div className="continue-shopping">
          <Link to="/products" className="btn btn-outline">
            ← Continue Shopping
          </Link>
        </div>

        {/* Clear Cart Confirmation Modal */}
        {showClearConfirm && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>Clear Cart?</h3>
              <p>Are you sure you want to remove all items from your cart?</p>
              <div className="modal-actions">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearCart}
                  className="btn btn-primary"
                  disabled={isClearing}
                >
                  {isClearing ? 'Clearing...' : 'Clear Cart'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CartPage