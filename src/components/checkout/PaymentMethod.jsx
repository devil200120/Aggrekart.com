import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import './PaymentMethod.css'

const PaymentMethod = ({ onSubmit, onBack, defaultData, total }) => {
  const [selectedMethod, setSelectedMethod] = useState(defaultData?.method || 'cod')
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      method: defaultData?.method || 'cod',
      cardNumber: defaultData?.details?.cardNumber || '',
      expiryDate: defaultData?.details?.expiryDate || '',
      cvv: defaultData?.details?.cvv || '',
      cardholderName: defaultData?.details?.cardholderName || '',
      upiId: defaultData?.details?.upiId || ''
    }
  })

  const paymentMethods = [
    {
      id: 'cod',
      name: 'Cash on Delivery',
      icon: '💰',
      description: 'Pay when your order is delivered',
      available: true,
      extraFee: 0
    },
    {
      id: 'card',
      name: 'Credit/Debit Card',
      icon: '💳',
      description: 'Visa, Mastercard, RuPay accepted',
      available: true,
      extraFee: 0
    },
    {
      id: 'upi',
      name: 'UPI Payment',
      icon: '📱',
      description: 'Pay using PhonePe, GPay, Paytm',
      available: true,
      extraFee: 0
    },
    {
      id: 'netbanking',
      name: 'Net Banking',
      icon: '🏦',
      description: 'Pay using your bank account',
      available: true,
      extraFee: 0
    },
    {
      id: 'wallet',
      name: 'Digital Wallet',
      icon: '💼',
      description: 'Paytm, PhonePe, Amazon Pay',
      available: false,
      extraFee: 0
    }
  ]

  const handleMethodSelect = (methodId) => {
    setSelectedMethod(methodId)
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price)
  }

  const onFormSubmit = (data) => {
    const paymentData = {
      method: selectedMethod,
      details: {}
    }

    if (selectedMethod === 'card') {
      paymentData.details = {
        cardNumber: data.cardNumber,
        expiryDate: data.expiryDate,
        cvv: data.cvv,
        cardholderName: data.cardholderName
      }
    } else if (selectedMethod === 'upi') {
      paymentData.details = {
        upiId: data.upiId
      }
    }

    onSubmit(paymentData)
  }

  return (
    <div className="payment-method">
      <div className="step-header">
        <h2>Payment Method</h2>
        <p>Choose how you'd like to pay for your order</p>
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)} className="payment-form">
        {/* Payment Methods List */}
        <div className="payment-methods">
          <h3>Select Payment Method</h3>
          
          <div className="payment-options">
            {paymentMethods.map((method) => (
              <div 
                key={method.id}
                className={`payment-option ${selectedMethod === method.id ? 'selected' : ''} ${!method.available ? 'disabled' : ''}`}
                onClick={() => method.available && handleMethodSelect(method.id)}
              >
                <div className="payment-option-header">
                  <div className="payment-radio">
                    <input
                      type="radio"
                      {...register('method', { required: 'Please select a payment method' })}
                      value={method.id}
                      checked={selectedMethod === method.id}
                      disabled={!method.available}
                      onChange={() => handleMethodSelect(method.id)}
                    />
                  </div>
                  
                  <div className="payment-info">
                    <div className="payment-header">
                      <span className="payment-icon">{method.icon}</span>
                      <span className="payment-name">{method.name}</span>
                      {method.extraFee > 0 && (
                        <span className="extra-fee">+{formatPrice(method.extraFee)}</span>
                      )}
                      {!method.available && (
                        <span className="unavailable-badge">Coming Soon</span>
                      )}
                    </div>
                    <div className="payment-description">{method.description}</div>
                  </div>
                </div>

                {/* COD Details */}
                {selectedMethod === method.id && method.id === 'cod' && (
                  <div className="payment-details">
                    <div className="cod-info">
                      <div className="cod-benefits">
                        <h4>Cash on Delivery Benefits:</h4>
                        <ul>
                          <li>✅ No advance payment required</li>
                          <li>✅ Pay only after receiving your order</li>
                          <li>✅ Inspect products before payment</li>
                          <li>✅ No online transaction fees</li>
                        </ul>
                      </div>
                      <div className="cod-note">
                        <p><strong>Note:</strong> Please keep exact change ready for delivery.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Card Details */}
                {selectedMethod === method.id && method.id === 'card' && (
                  <div className="payment-details">
                    <div className="card-form">
                      <h4>Enter Card Details</h4>
                      
                      <div className="form-group">
                        <label>Cardholder Name *</label>
                        <input
                          type="text"
                          {...register('cardholderName', { 
                            required: 'Cardholder name is required',
                            minLength: { value: 2, message: 'Name must be at least 2 characters' }
                          })}
                          className={errors.cardholderName ? 'error' : ''}
                          placeholder="Name as on card"
                        />
                        {errors.cardholderName && (
                          <span className="error-message">{errors.cardholderName.message}</span>
                        )}
                      </div>

                      <div className="form-group">
                        <label>Card Number *</label>
                        <input
                          type="text"
                          {...register('cardNumber', { 
                            required: 'Card number is required',
                            pattern: { 
                              value: /^[0-9]{13,19}$/, 
                              message: 'Please enter a valid card number' 
                            }
                          })}
                          className={errors.cardNumber ? 'error' : ''}
                          placeholder="1234 5678 9012 3456"
                          maxLength="19"
                        />
                        {errors.cardNumber && (
                          <span className="error-message">{errors.cardNumber.message}</span>
                        )}
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label>Expiry Date *</label>
                          <input
                            type="text"
                            {...register('expiryDate', { 
                              required: 'Expiry date is required',
                              pattern: { 
                                value: /^(0[1-9]|1[0-2])\/([0-9]{2})$/, 
                                message: 'Enter date in MM/YY format' 
                              }
                            })}
                            className={errors.expiryDate ? 'error' : ''}
                            placeholder="MM/YY"
                            maxLength="5"
                          />
                          {errors.expiryDate && (
                            <span className="error-message">{errors.expiryDate.message}</span>
                          )}
                        </div>

                        <div className="form-group">
                          <label>CVV *</label>
                          <input
                            type="text"
                            {...register('cvv', { 
                              required: 'CVV is required',
                              pattern: { 
                                value: /^[0-9]{3,4}$/, 
                                message: 'Enter valid CVV' 
                              }
                            })}
                            className={errors.cvv ? 'error' : ''}
                            placeholder="123"
                            maxLength="4"
                          />
                          {errors.cvv && (
                            <span className="error-message">{errors.cvv.message}</span>
                          )}
                        </div>
                      </div>

                      <div className="card-security">
                        <div className="security-info">
                          <span className="security-icon">🔒</span>
                          <span>Your card details are encrypted and secure</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* UPI Details */}
                {selectedMethod === method.id && method.id === 'upi' && (
                  <div className="payment-details">
                    <div className="upi-form">
                      <h4>Enter UPI Details</h4>
                      
                      <div className="form-group">
                        <label>UPI ID *</label>
                        <input
                          type="text"
                          {...register('upiId', { 
                            required: 'UPI ID is required',
                            pattern: { 
                              value: /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/, 
                              message: 'Please enter a valid UPI ID' 
                            }
                          })}
                          className={errors.upiId ? 'error' : ''}
                          placeholder="yourname@paytm"
                        />
                        {errors.upiId && (
                          <span className="error-message">{errors.upiId.message}</span>
                        )}
                      </div>

                      <div className="upi-apps">
                        <h5>Popular UPI Apps:</h5>
                        <div className="upi-app-list">
                          <div className="upi-app">📱 PhonePe</div>
                          <div className="upi-app">💰 Google Pay</div>
                          <div className="upi-app">💼 Paytm</div>
                          <div className="upi-app">🏛️ BHIM</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Net Banking */}
                {selectedMethod === method.id && method.id === 'netbanking' && (
                  <div className="payment-details">
                    <div className="netbanking-info">
                      <h4>Net Banking</h4>
                      <p>You will be redirected to your bank's secure website to complete the payment.</p>
                      
                      <div className="supported-banks">
                        <h5>Supported Banks:</h5>
                        <div className="bank-list">
                          <div className="bank">🏦 SBI</div>
                          <div className="bank">🏦 HDFC</div>
                          <div className="bank">🏦 ICICI</div>
                          <div className="bank">🏦 Axis</div>
                          <div className="bank">🏦 PNB</div>
                          <div className="bank">➕ More</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {errors.method && (
            <span className="error-message">{errors.method.message}</span>
          )}
        </div>

        {/* Payment Summary */}
        <div className="payment-summary">
          <h3>Payment Summary</h3>
          <div className="summary-details">
            <div className="summary-row">
              <span>Order Total</span>
              <span>{formatPrice(total)}</span>
            </div>
            <div className="summary-row">
              <span>Payment Method</span>
              <span>{paymentMethods.find(m => m.id === selectedMethod)?.name}</span>
            </div>
            <div className="summary-row total">
              <span>Amount to Pay</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button 
            type="button"
            onClick={onBack}
            className="btn btn-outline"
          >
            Back to Address
          </button>
          
          <button type="submit" className="btn btn-primary">
            Continue to Review
          </button>
        </div>
      </form>
    </div>
  )
}

export default PaymentMethod