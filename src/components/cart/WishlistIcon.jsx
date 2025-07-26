import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './WishlistIcon.css'

const WishlistIcon = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [wishlistCount, setWishlistCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)

  useEffect(() => {
    if (user?.role === 'customer') {
      fetchWishlistCount()
    }
  }, [user])

  const fetchWishlistCount = async () => {
    if (!user) return
    
    setIsLoading(true)
    try {
      const response = await fetch('/api/wishlist/count', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setWishlistCount(data.count || 0)
      }
    } catch (error) {
      console.error('Error fetching wishlist count:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleWishlistClick = (e) => {
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
        to={user?.role === 'customer' ? "/wishlist" : "#"} 
        className="wishlist-icon"
        onClick={handleWishlistClick}
      >
        <div className="wishlist-icon-container">
          <span className="wishlist-icon-symbol">❤️</span>
          {user?.role === 'customer' && wishlistCount > 0 && (
            <span className="wishlist-badge">
              {wishlistCount > 99 ? '99+' : wishlistCount}
            </span>
          )}
          {user?.role === 'customer' && isLoading && (
            <div className="wishlist-loading-indicator"></div>
          )}
        </div>
        <span className="wishlist-label">Wishlist</span>
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
              <div className="login-prompt-icon">❤️</div>
              <p>Please log in to use the wishlist feature and save your favorite items.</p>
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

export default WishlistIcon
