import React, { useState } from 'react'
import { useMutation } from 'react-query'
import { productsAPI } from '../../services/api'
import { toast } from 'react-hot-toast'
import './AddReviewModal.css'

const AddReviewModal = ({ productId, onClose, onSuccess }) => {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [errors, setErrors] = useState({})

  const addReviewMutation = useMutation(
    (reviewData) => productsAPI.addReview(productId, reviewData),
    {
      onSuccess: () => {
        onSuccess()
      },
      onError: (error) => {
        const errorMessage = error.response?.data?.message || 'Failed to add review'
        toast.error(errorMessage)
        
        // Handle validation errors
        if (error.response?.data?.errors) {
          const validationErrors = {}
          error.response.data.errors.forEach(err => {
            validationErrors[err.path || err.param] = err.msg
          })
          setErrors(validationErrors)
        }
      }
    }
  )

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Reset errors
    setErrors({})
    
    // Validate
    const newErrors = {}
    if (!rating) {
      newErrors.rating = 'Please select a rating'
    }
    if (comment.trim() && (comment.trim().length < 10 || comment.trim().length > 500)) {
      newErrors.comment = 'Comment must be between 10 and 500 characters'
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    const reviewData = {
      rating,
      ...(comment.trim() && { comment: comment.trim() })
    }

    addReviewMutation.mutate(reviewData)
  }

  const handleStarClick = (selectedRating) => {
    setRating(selectedRating)
    setErrors({ ...errors, rating: undefined })
  }

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const renderStars = () => {
    return (
      <div className="star-rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`star ${star <= (hoverRating || rating) ? 'filled' : ''}`}
            onClick={() => handleStarClick(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
          >
            ★
          </button>
        ))}
      </div>
    )
  }

  const getRatingText = (ratingValue) => {
    const texts = {
      1: 'Poor',
      2: 'Fair', 
      3: 'Good',
      4: 'Very Good',
      5: 'Excellent'
    }
    return texts[ratingValue] || ''
  }

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="add-review-modal">
        <div className="modal-header">
          <h3>Write a Review</h3>
          <button 
            type="button" 
            onClick={onClose}
            className="close-btn"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="review-form">
          <div className="form-group">
            <label>Your Rating *</label>
            {renderStars()}
            {(hoverRating || rating) > 0 && (
              <div className="rating-text">
                {getRatingText(hoverRating || rating)}
              </div>
            )}
            {errors.rating && (
              <span className="error-message">{errors.rating}</span>
            )}
          </div>

          <div className="form-group">
            <label>Your Review (Optional)</label>
            <textarea
              value={comment}
              onChange={(e) => {
                setComment(e.target.value)
                setErrors({ ...errors, comment: undefined })
              }}
              placeholder="Share your experience with this product..."
              rows="4"
              maxLength="500"
              className={errors.comment ? 'error' : ''}
            />
            <div className="character-count">
              {comment.length}/500 characters
            </div>
            {errors.comment && (
              <span className="error-message">{errors.comment}</span>
            )}
          </div>

          <div className="modal-actions">
            <button 
              type="button" 
              onClick={onClose}
              className="btn btn-secondary"
              disabled={addReviewMutation.isLoading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={addReviewMutation.isLoading}
            >
              {addReviewMutation.isLoading ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddReviewModal
