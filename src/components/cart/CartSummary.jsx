import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import './CartSummary.css'

const CartSummary = ({  total, itemCount }) => {
  const [promoCode, setPromoCode] = useState('')
  const [promoApplied, setPromoApplied] = useState(null)
  const [isApplyingPromo, setIsApplyingPromo] = useState(false)

  const subtotal = total
  const discount = promoApplied ? promoApplied.discountAmount : 0
  const deliveryFee = subtotal > 10000 ? 0 : 500 // Free delivery above ₹10,000
  const tax = Math.round((subtotal - discount) * 0.18) // 18% GST
  const finalTotal = subtotal - discount + deliveryFee + tax

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price)
  }

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return
    
    setIsApplyingPromo(true)
    
    // Simulate promo code validation
    setTimeout(() => {
      if (promoCode.toUpperCase() === 'WELCOME10') {
        setPromoApplied({
          code: promoCode,
          discountAmount: Math.round(subtotal * 0.1),
          discountPercent: 10
        })
      } else if (promoCode.toUpperCase() === 'SAVE500') {
        setPromoApplied({
          code: promoCode,
          discountAmount: 500,
          discountPercent: null
        })
      } else {
        setPromoApplied(null)
        alert('Invalid promo code')
      }
      setIsApplyingPromo(false)
    }, 1000)
  }

  const removePromo = () => {
    setPromoApplied(null)
    setPromoCode('')
  }

  return (
    <div className="cart-summary">
      <div className="summary-header">
        <h3>Order Summary</h3>
      </div>

      <div className="summary-content">
        {/* Items Summary */}
        <div className="summary-section">
          <div className="summary-row">
            <span>Items ({itemCount})</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
        </div>

        {/* Promo Code */}
        <div className="summary-section">
          <div className="promo-code">
            <label>Promo Code</label>
            {!promoApplied ? (
              <div className="promo-input-group">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  placeholder="Enter promo code"
                  className="promo-input"
                />
                <button
                  onClick={handleApplyPromo}
                  disabled={!promoCode.trim() || isApplyingPromo}
                  className="btn btn-outline btn-sm"
                >
                  {isApplyingPromo ? '...' : 'Apply'}
                </button>
              </div>
            ) : (
              <div className="promo-applied">
                <div className="promo-info">
                  <span className="promo-code-text">
                    {promoApplied.code}
                  </span>
                  <span className="promo-discount">
                    -{formatPrice(promoApplied.discountAmount)}
                  </span>
                </div>
                <button
                  onClick={removePromo}
                  className="remove-promo"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {promoApplied && (
            <div className="summary-row discount">
              <span>Discount ({promoApplied.code})</span>
              <span>-{formatPrice(discount)}</span>
            </div>
          )}
        </div>

        {/* Delivery & Tax */}
        <div className="summary-section">
          <div className="summary-row">
            <span>
              Delivery Fee
              {deliveryFee === 0 && (
                <span className="free-delivery"> (FREE)</span>
              )}
            </span>
            <span>{deliveryFee === 0 ? 'FREE' : formatPrice(deliveryFee)}</span>
          </div>
          
          <div className="summary-row">
            <span>GST (18%)</span>
            <span>{formatPrice(tax)}</span>
          </div>
        </div>

        {/* Total */}
        <div className="summary-section total-section">
          <div className="summary-row total">
            <span>Total Amount</span>
            <span>{formatPrice(finalTotal)}</span>
          </div>
        </div>

        {/* Savings Info */}
        {deliveryFee === 0 && subtotal >= 10000 && (
          <div className="savings-info">
            🎉 You saved ₹500 on delivery!
          </div>
        )}

        {!deliveryFee === 0 && subtotal < 10000 && (
          <div className="delivery-info">
            Add {formatPrice(10000 - subtotal)} more for FREE delivery
          </div>
        )}

        {/* Checkout Button */}
        <div className="checkout-section">
          <Link 
            to="/checkout" 
            className="btn btn-primary btn-lg checkout-btn"
          >
            Proceed to Checkout
          </Link>
          
          <div className="secure-checkout">
            🔒 Secure Checkout
          </div>
        </div>

        {/* Accepted Payments */}
        <div className="payment-methods">
          <h4>We Accept</h4>
          <div className="payment-icons">
            <span className="payment-icon">💳</span>
            <span className="payment-icon">🏦</span>
            <span className="payment-icon">📱</span>
            <span className="payment-icon">💰</span>
          </div>
          <p>Credit/Debit Cards, Net Banking, UPI, Cash on Delivery</p>
        </div>
      </div>
    </div>
  )
}

export default CartSummary