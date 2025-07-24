import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Link } from 'react-router-dom'
import { wishlistAPI, cartAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ProductCard from '../components/products/ProductCard'
import './WishlistPage.css'

const WishlistPage = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [viewMode, setViewMode] = useState('grid')

  // Fetch wishlist items
  const { 
    data: wishlistData, 
    isLoading, 
    error 
  } = useQuery(
    'wishlist',
    () => wishlistAPI.getWishlist(),
    {
      enabled: !!user,
      staleTime: 2 * 60 * 1000,
    }
  )

  // Remove from wishlist mutation
  const removeFromWishlistMutation = useMutation(
    (productId) => wishlistAPI.removeFromWishlist(productId),
    {
      onSuccess: () => {
        toast.success('Removed from wishlist')
        queryClient.invalidateQueries('wishlist')
      },
      onError: (error) => {
        toast.error(error?.response?.data?.message || 'Failed to remove from wishlist')
      }
    }
  )

  // Add to cart mutation
  const addToCartMutation = useMutation(
    (data) => cartAPI.addToCart(data),
    {
      onSuccess: () => {
        toast.success('Added to cart successfully!')
        queryClient.invalidateQueries('cart')
      },
      onError: (error) => {
        toast.error(error?.response?.data?.message || 'Failed to add to cart')
      }
    }
  )

  // Clear wishlist mutation
  const clearWishlistMutation = useMutation(
    () => wishlistAPI.clearWishlist(),
    {
      onSuccess: () => {
        toast.success('Wishlist cleared')
        queryClient.invalidateQueries('wishlist')
      },
      onError: (error) => {
        toast.error(error?.response?.data?.message || 'Failed to clear wishlist')
      }
    }
  )

  const handleRemoveFromWishlist = (productId) => {
    removeFromWishlistMutation.mutate(productId)
  }

  const handleAddToCart = (product) => {
    addToCartMutation.mutate({
      productId: product._id,
      quantity: 1,
      specifications: product.specifications || {}
    })
  }

  const handleClearWishlist = () => {
    if (window.confirm('Are you sure you want to clear your entire wishlist?')) {
      clearWishlistMutation.mutate()
    }
  }

  const handleMoveAllToCart = () => {
    if (wishlistItems.length === 0) return
    
    const promises = wishlistItems.map(item => 
      cartAPI.addToCart({
        productId: item.product._id,
        quantity: 1,
        specifications: item.product.specifications || {}
      })
    )

    Promise.all(promises)
      .then(() => {
        toast.success('All items moved to cart!')
        queryClient.invalidateQueries('cart')
        clearWishlistMutation.mutate()
      })
      .catch(() => {
        toast.error('Some items could not be moved to cart')
      })
  }

  const wishlistItems = wishlistData?.data?.items || []

  if (isLoading) {
    return (
      <div className="wishlist-page">
        <div className="container">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="wishlist-page">
        <div className="container">
          <div className="error-state">
            <h2>Something went wrong</h2>
            <p>Unable to load your wishlist. Please try again.</p>
            <button onClick={() => window.location.reload()} className="btn btn-primary">
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="wishlist-page">
      <div className="container">
        {/* Page Header */}
        <div className="wishlist-header">
          <div className="wishlist-header-content">
            <h1 className="wishlist-title">
              💝 My Wishlist
            </h1>
            <p className="wishlist-subtitle">
              {wishlistItems.length === 0 
                ? "Your wishlist is empty"
                : `${wishlistItems.length} ${wishlistItems.length === 1 ? 'item' : 'items'} saved for later`
              }
            </p>
          </div>

          {wishlistItems.length > 0 && (
            <div className="wishlist-actions">
              <button
                onClick={handleMoveAllToCart}
                className="btn btn-primary"
                disabled={addToCartMutation.isLoading}
              >
                {addToCartMutation.isLoading ? 'Moving...' : 'Move All to Cart'}
              </button>
              <button
                onClick={handleClearWishlist}
                className="btn btn-outline btn-danger"
                disabled={clearWishlistMutation.isLoading}
              >
                Clear Wishlist
              </button>
            </div>
          )}
        </div>

        {/* Wishlist Content */}
        {wishlistItems.length === 0 ? (
          <div className="empty-wishlist">
            <div className="empty-wishlist-content">
              <div className="empty-icon">💔</div>
              <h2>Your wishlist is empty</h2>
              <p>
                Save items you love to your wishlist. Review them anytime and easily move them to your cart.
              </p>
              <Link to="/products" className="btn btn-primary">
                Start Shopping
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Toolbar */}
            <div className="wishlist-toolbar">
              <div className="toolbar-left">
                <span className="items-count">
                  {wishlistItems.length} {wishlistItems.length === 1 ? 'Item' : 'Items'}
                </span>
              </div>

              <div className="toolbar-right">
                {/* View Mode Toggle */}
                <div className="view-toggle">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                    title="Grid View"
                  >
                    ⚏
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                    title="List View"
                  >
                    ☰
                  </button>
                </div>
              </div>
            </div>

            {/* Wishlist Grid/List */}
            <div className={`wishlist-grid ${viewMode}`}>
              {wishlistItems.map((item) => (
                <div key={item._id} className="wishlist-item">
                  <div className="product-card-wrapper">
                    <ProductCard
                      product={item.product}
                      viewMode={viewMode}
                      isWishlistItem={true}
                    />
                  </div>
                  
                  <div className="wishlist-item-actions">
                    <button
                      onClick={() => handleAddToCart(item.product)}
                      className="btn btn-primary btn-sm"
                      disabled={addToCartMutation.isLoading}
                    >
                      {addToCartMutation.isLoading ? (
                        <>
                          <span className="spinner-small"></span>
                          Adding...
                        </>
                      ) : (
                        '🛒 Add to Cart'
                      )}
                    </button>
                    
                    <button
                      onClick={() => handleRemoveFromWishlist(item.product._id)}
                      className="btn btn-outline btn-sm btn-danger"
                      disabled={removeFromWishlistMutation.isLoading}
                    >
                      {removeFromWishlistMutation.isLoading ? (
                        <>
                          <span className="spinner-small"></span>
                          Removing...
                        </>
                      ) : (
                        '🗑️ Remove'
                      )}
                    </button>
                  </div>

                  {/* Date Added */}
                  <div className="wishlist-item-meta">
                    <span className="date-added">
                      Added {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Continue Shopping */}
            <div className="continue-shopping">
              <Link to="/products" className="btn btn-outline">
                ← Continue Shopping
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default WishlistPage