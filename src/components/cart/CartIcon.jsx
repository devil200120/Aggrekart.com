import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import './CartIcon.css'

const CartIcon = () => {
  const { itemCount, isLoading } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)

  const handleCartClick = (e) => {
    // If user is not logged in or not a customer, show login prompt
    if (!user || user.role !== 'customer') {
      e.preventDefault()
      setShowLoginPrompt(true)
    }
    // If user is logged in as customer, let the Link navigate normally
  }

  const handleLoginRedirect = (loginType) => {
    setShowLoginPrompt(false)
    if (loginType === 'login') {
      navigate('/auth/login')
    } else {
      navigate('/auth/register')
    }
  }

  const closePrompt = () => {
    setShowLoginPrompt(false)
  }

  return (
    <>
      <Link 
        to={user?.role === 'customer' ? "/cart" : "#"} 
        className="cart-icon"
        onClick={handleCartClick}
      >
        <div className="cart-icon-container">
          <span className="cart-icon-symbol">🛒</span>
          {user?.role === 'customer' && itemCount > 0 && (
            <span className="cart-badge">
              {itemCount > 99 ? '99+' : itemCount}
            </span>
          )}
          {user?.role === 'customer' && isLoading && (
            <div className="cart-loading-indicator"></div>
          )}
        </div>
        <span className="cart-label">Cart</span>
      </Link>

      {/* Login Prompt Modal */}
      {showLoginPrompt && (
        <div className="login-prompt-overlay" onClick={closePrompt}>
          <div className="login-prompt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="login-prompt-header">
              <h3>Login Required</h3>
              <button className="close-btn" onClick={closePrompt}>×</button>
            </div>
            <div className="login-prompt-content">
              <div className="login-prompt-icon">🛒</div>
              <p>Please log in to view your cart and manage your items.</p>
              <div className="login-prompt-actions">
                <button 
                  className="btn-login-prompt"
                  onClick={() => handleLoginRedirect('login')}
                >
                  Login
                </button>
                <button 
                  className="btn-signup-prompt"
                  onClick={() => handleLoginRedirect('signup')}
                >
                  Sign Up
                </button>
              </div>
              <p className="login-prompt-note">
                New to Aggrekart? <span onClick={() => handleLoginRedirect('signup')}>Create an account</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default CartIcon
