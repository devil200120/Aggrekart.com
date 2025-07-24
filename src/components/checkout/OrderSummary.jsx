import React, { useState } from 'react'
import './OrderSummary.css'

const OrderSummary = ({ items, total, showPromo = true }) => {
  const [promoCode, setPromoCode] = useState('')
  const [promoApplied, setPromoApplied] = useState(null)
  const [isApplyingPromo, setIsApplyingPromo] = useState(false)

  const subtotal = total
  const discount = promoApplied ? promoApplied.discountAmount : 0
  const deliveryFee = subtotal > 10000 ? 0 : 500
  const tax = Math.round((subtotal - discount) * 0.18)
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
    <div className="checkout-order-summary">
      <div className="summary-header">
        <h3>Order Summary</h3>
      </div>

      <div className="summary-content">
        {/* Items List */}
        <div className="summary-items">
          {items?.map((item) => (
            <div key={item._id} className="summary-item">
              <div className="item-image">
                <img 
                  src={item.product.images?.[0] || '/placeholder-product.jpg'} 
                  alt={item.product.name}
                />
              </div>
              <div className="item-details">
                <div className="item-name">{item.product.name}</div>
                <div className="item-meta">
                  <span>Qty: {item.quantity}</span>
                  <span>₹{item.price}/{item.product.unit}</span>
                </div>
              </div>
              <div className="item-total">
                {formatPrice(item.price * item.quantity)}
              </div>
            </div>
          ))}
        </div>

        {/* Promo Code */}
        {showPromo && (
          <div className="promo-section">
            {!promoApplied ? (
              <div className="promo-input">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  placeholder="Enter promo code"
                  className="promo-field"
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
                  <span className="promo-code">{promoApplied.code}</span>
                  <span className="promo-discount">-{formatPrice(promoApplied.discountAmount)}</span>
                </div>
                <button onClick={removePromo} className="remove-promo">✕</button>
              </div>
            )}
          </div>
        )}

        {/* Price Breakdown */}
        <div className="price-breakdown">
          <div className="price-row">
            <span>Subtotal ({items?.length || 0} items)</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          
          {promoApplied && (
            <div className="price-row discount">
              <span>Discount ({promoApplied.code})</span>
              <span>-{formatPrice(discount)}</span>
            </div>
          )}
          
          <div className="price-row">
            <span>
              Delivery Fee
              {deliveryFee === 0 && <span className="free-tag">FREE</span>}
            </span>
            <span>{deliveryFee === 0 ? 'FREE' : formatPrice(deliveryFee)}</span>
          </div>
          
          <div className="price-row">
            <span>GST (18%)</span>
            <span>{formatPrice(tax)}</span>
          </div>
          
          <div className="price-row total">
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

        {deliveryFee > 0 && subtotal < 10000 && (
          <div className="delivery-info">
            Add {formatPrice(10000 - subtotal)} more for FREE delivery
          </div>
        )}

        {/* Security Info */}
        <div className="security-info">
          <div className="security-badges">
            <div className="security-badge">
              <span>🔒</span>
              <span>Secure Checkout</span>
            </div>
            <div className="security-badge">
              <span>✅</span>
              <span>Safe Payment</span>
            </div>
            <div className="security-badge">
              <span>🚚</span>
              <span>Fast Delivery</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrderSummary