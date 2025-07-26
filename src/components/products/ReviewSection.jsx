import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { productsAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { toast } from 'react-hot-toast'
import LoadingSpinner from '../common/LoadingSpinner'
import AddReviewModal from './AddReviewModal'
import './ReviewSection.css'

const ReviewSection = ({ productId }) => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [showAddReview, setShowAddReview] = useState(false)
  const [filterRating, setFilterRating] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  // Fetch reviews
  const { data: reviewsData, isLoading, error } = useQuery(
    ['product-reviews', productId, { page: currentPage, rating: filterRating }],
    () => productsAPI.getReviews(productId, { 
      page: currentPage, 
      limit: 10,
      ...(filterRating && { rating: filterRating })
    }),
    {
      enabled: !!productId,
      onError: (error) => {
        console.error('Failed to fetch reviews:', error)
      }
    }
  )

  const reviews = reviewsData?.data?.reviews || []
  const pagination = reviewsData?.data?.pagination || {}
  const summary = reviewsData?.data?.summary || {}

  const renderStars = (rating, size = 'small') => {
    return (
      <div className={`stars ${size}`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span 
            key={star} 
            className={`star ${star <= rating ? 'filled' : ''}`}
          >
            ★
          </span>
        ))}
      </div>
    )
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const canAddReview = user && user.role === 'customer' && !reviews.some(review => 
    review.user?._id === user._id
  )

  const handleAddReviewSuccess = () => {
    setShowAddReview(false)
    queryClient.invalidateQueries(['product-reviews', productId])
    queryClient.invalidateQueries(['product', productId])
    toast.success('Review added successfully!')
  }

  if (isLoading) {
    return (
      <div className="review-section">
        <h3>Customer Reviews</h3>
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="review-section">
        <h3>Customer Reviews</h3>
        <div className="error-message">
          Failed to load reviews. Please try again later.
        </div>
      </div>
    )
  }

  return (
    <div className="review-section">
      <div className="review-header">
        <h3>Customer Reviews</h3>
        {canAddReview && (
          <button 
            onClick={() => setShowAddReview(true)}
            className="btn btn-primary add-review-btn"
          >
            Write a Review
          </button>
        )}
      </div>

      {summary.totalReviews > 0 ? (
        <>
          {/* Review Summary */}
          <div className="review-summary">
            <div className="overall-rating">
              <div className="rating-score">
                <span className="score">{summary.averageRating?.toFixed(1) || '0.0'}</span>
                {renderStars(summary.averageRating || 0, 'large')}
              </div>
              <div className="rating-count">
                Based on {summary.totalReviews} review{summary.totalReviews !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Rating Distribution */}
            <div className="rating-distribution">
              {[5, 4, 3, 2, 1].map(rating => {
                const count = summary.ratingDistribution?.[rating] || 0
                const percentage = summary.totalReviews > 0 ? (count / summary.totalReviews) * 100 : 0
                
                return (
                  <div key={rating} className="rating-bar">
                    <span className="rating-label">{rating} ★</span>
                    <div className="bar-container">
                      <div 
                        className="bar-fill" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="rating-count">({count})</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Filter Controls */}
          <div className="review-filters">
            <label>Filter by rating:</label>
            <select 
              value={filterRating} 
              onChange={(e) => {
                setFilterRating(e.target.value)
                setCurrentPage(1)
              }}
              className="rating-filter"
            >
              <option value="">All ratings</option>
              <option value="5">5 stars</option>
              <option value="4">4 stars</option>
              <option value="3">3 stars</option>
              <option value="2">2 stars</option>
              <option value="1">1 star</option>
            </select>
          </div>

          {/* Reviews List */}
          <div className="reviews-list">
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <div key={review._id} className="review-item">
                  <div className="review-header">
                    <div className="reviewer-info">
                      <div className="reviewer-name">
                        {review.user?.name || 'Anonymous'}
                        {review.isVerifiedPurchase && (
                          <span className="verified-badge">✓ Verified Purchase</span>
                        )}
                      </div>
                      <div className="review-date">{formatDate(review.createdAt)}</div>
                    </div>
                    <div className="review-rating">
                      {renderStars(review.rating)}
                    </div>
                  </div>
                  
                  {review.comment && (
                    <div className="review-comment">
                      {review.comment}
                    </div>
                  )}

                  {review.images && review.images.length > 0 && (
                    <div className="review-images">
                      {review.images.map((image, index) => (
                        <img 
                          key={index}
                          src={image} 
                          alt={`Review image ${index + 1}`}
                          className="review-image"
                        />
                      ))}
                    </div>
                  )}

                  {review.helpfulCount > 0 && (
                    <div className="review-helpful">
                      {review.helpfulCount} people found this helpful
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="no-reviews">
                No reviews found for the selected rating.
              </div>
            )}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="review-pagination">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="pagination-btn"
              >
                Previous
              </button>
              
              <span className="pagination-info">
                Page {currentPage} of {pagination.totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                disabled={currentPage === pagination.totalPages}
                className="pagination-btn"
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="no-reviews-yet">
          <div className="no-reviews-icon">💬</div>
          <h4>No reviews yet</h4>
          <p>Be the first to review this product!</p>
          {canAddReview && (
            <button 
              onClick={() => setShowAddReview(true)}
              className="btn btn-primary"
            >
              Write the First Review
            </button>
          )}
        </div>
      )}

      {/* Add Review Modal */}
      {showAddReview && (
        <AddReviewModal
          productId={productId}
          onClose={() => setShowAddReview(false)}
          onSuccess={handleAddReviewSuccess}
        />
      )}
    </div>
  )
}

export default ReviewSection
