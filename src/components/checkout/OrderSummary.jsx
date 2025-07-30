import React, { useState } from 'react'
import './OrderSummary.css'

const OrderSummary = ({ 
  items = [], 
  total = 0, 
  showPromo = true, 
  paymentMethod = null,
  advanceAmount = null 
}) => {
  const [promoCode, setPromoCode] = useState('')
  const [promoApplied, setPromoApplied] = useState(null)
  const [isApplyingPromo, setIsApplyingPromo] = useState(false)

  // Safe price parsing with fallbacks
  const parsePrice = (price) => {
    const parsed = parseFloat(price)
    return isNaN(parsed) ? 0 : parsed
  }

  // Calculate totals with validation
  const subtotal = parsePrice(total)
  const discount = promoApplied ? parsePrice(promoApplied.discountAmount) : 0
  const deliveryFee = subtotal > 10000 ? 0 : 500
  const taxableAmount = Math.max(subtotal - discount, 0)
  const tax = Math.round(taxableAmount * 0.18)
  const finalTotal = subtotal - discount + deliveryFee + tax

  const formatPrice = (price) => {
    const numPrice = parsePrice(price)
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(numPrice)
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

  // Ensure items is always an array
  const safeItems = Array.isArray(items) ? items : []

  return (
    <div className="checkout-order-summary">
      <div className="summary-header">
        <h3>Order Summary</h3>
        <span className="item-count">{safeItems.length} item{safeItems.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="summary-content">
        {/* Items List */}
        <div className="summary-items">
          {safeItems.length === 0 ? (
            <div className="empty-cart">
              <p>No items in cart</p>
            </div>
          ) : (
            safeItems.map((item) => {
              // Safe data extraction with fallbacks
              const product = item.product || {}
              const itemPrice = parsePrice(item.price || item.priceAtTime || product.price || product.pricing?.basePrice || 0)
              const itemQuantity = parsePrice(item.quantity || 0)
              const itemTotal = itemPrice * itemQuantity
              const productName = product.name || 'Unknown Product'
              const productUnit = product.unit || product.pricing?.unit || 'unit'
              const productImage = product.images?.[0] || product.imageUrl || '/placeholder-product.jpg'

              return (
                <div key={item._id || item.id || Math.random()} className="summary-item">
                  <div className="item-image">
                    <img 
                      src={productImage}
                      alt={productName}
                      onError={(e) => {
                        e.target.src = '/placeholder-product.jpg'
                      }}
                    />
                  </div>
                  <div className="item-details">
                    <div className="item-name" title={productName}>
                      {productName}
                    </div>
                    <div className="item-meta">
                      <span>Qty: {itemQuantity} {productUnit}</span>
                      <span>₹{itemPrice.toLocaleString()}/{productUnit}</span>
                    </div>
                    {item.specifications?.selectedVariant && (
                      <div className="item-variant">
                        Variant: {item.specifications.selectedVariant}
                      </div>
                    )}
                  </div>
                  <div className="item-total">
                    {formatPrice(itemTotal)}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Promo Code */}
        {showPromo && safeItems.length > 0 && (
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
        {safeItems.length > 0 && (
          <div className="price-breakdown">
            <div className="price-row">
              <span>Subtotal ({safeItems.length} item{safeItems.length !== 1 ? 's' : ''})</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            
            {promoApplied && discount > 0 && (
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

            {/* Advance Payment Info */}
            {paymentMethod && paymentMethod !== 'cod' && advanceAmount && (
              <div className="advance-payment-row">
                <div className="price-row advance">
                  <span>Advance Payment (25%)</span>
                  <span>{formatPrice(advanceAmount)}</span>
                </div>
                <div className="price-row remaining">
                  <span>Pay on Delivery</span>
                  <span>{formatPrice(finalTotal - advanceAmount)}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Savings & Delivery Info */}
        {safeItems.length > 0 && (
          <>
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
          </>
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

        {/* Empty Cart Message */}
        {safeItems.length === 0 && (
          <div className="empty-cart-message">
            <p>Your cart is empty</p>
            <small>Add some items to proceed with checkout</small>
          </div>
        )}
      </div>
    </div>
  )
}

export default OrderSummary