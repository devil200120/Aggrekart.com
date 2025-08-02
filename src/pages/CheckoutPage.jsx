import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from 'react-query'
import { useForm } from 'react-hook-form'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { ordersAPI, usersAPI } from '../services/api'
import LoadingSpinner from '../components/common/LoadingSpinner'
import RazorpayPayment from '../components/payment/RazorpayPayment'
import { toast } from 'react-hot-toast'
import './CheckoutPage.css'

const CheckoutPage = () => {
  const { user } = useAuth()
  const { items, total, clearCart } = useCart()
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [shippingData, setShippingData] = useState(null)
  const [paymentData, setPaymentData] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [orderCreated, setOrderCreated] = useState(null)
  const [showPaymentGateway, setShowPaymentGateway] = useState(false)
  const [orderError, setOrderError] = useState(null)
  const [estimatedDelivery, setEstimatedDelivery] = useState('45-60 mins')

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm({
    defaultValues: {
      fullName: user?.name || '',
      email: user?.email || '',
      phone: user?.phoneNumber || '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      landmark: '',
      addressType: 'home'
    }
  })

  // Redirect if cart is empty
  useEffect(() => {
    if (!items || items.length === 0) {
      navigate('/cart')
      toast.error('Your cart is empty')
    }
  }, [items, navigate])

  // Redirect if not customer
  useEffect(() => {
    if (user && user.role !== 'customer') {
      navigate('/')
      toast.error('Only customers can place orders')
    }
  }, [user, navigate])

  // ADD ADDRESS MUTATION
  const addAddressMutation = useMutation(
    (addressData) => usersAPI.addAddress(addressData),
    {
      onSuccess: (response) => {
        console.log('✅ Address added successfully:', response)
      },
      onError: (error) => {
        console.error('❌ Failed to add address:', error)
        const errorMessage = error?.response?.data?.message || 'Failed to save address'
        toast.error(errorMessage)
        setIsProcessing(false)
        setOrderError(errorMessage)
      }
    }
  )

  // CREATE ORDER MUTATION
  const checkoutMutation = useMutation(
    (orderData) => ordersAPI.checkout(orderData),
    {
      onSuccess: (response) => {
        console.log('✅ Order created successfully:', response)
        
        const orderData = response?.data?.order || response?.order || response?.data
        
        if (!orderData) {
          throw new Error('Invalid order response structure')
        }
        
        setOrderCreated(orderData)
        
        if (paymentData?.method === 'cod') {
          clearCart()
          navigate(`/order-confirmation/${orderData.orderId}`)
          toast.success('Order placed successfully!')
        } else {
          setShowPaymentGateway(true)
          toast.success('Order created! Please complete payment.')
        }
        setIsProcessing(false)
      },
      onError: (error) => {
        console.error('❌ Checkout error:', error)
        
        const errorResponse = error?.response?.data
        let errorMessage = 'Failed to place order'
        
        if (errorResponse?.requiresVerification) {
          const verificationType = errorResponse.verificationType
          
          if (verificationType === 'phone') {
            errorMessage = 'Please verify your phone number first'
            navigate('/auth/verify-phone', { 
              state: { phoneNumber: user?.phoneNumber }
            })
          } else if (verificationType === 'account_activation') {
            errorMessage = 'Please activate your account first'
            navigate('/auth/verify-email', { 
              state: { email: user?.email }
            })
          }
        } else if (errorResponse?.errors && Array.isArray(errorResponse.errors)) {
          errorMessage = errorResponse.errors.map(err => err.msg || err.message).join(', ')
        } else if (errorResponse?.message) {
          errorMessage = errorResponse.message
        }
        
        toast.error(errorMessage)
        setOrderError(errorMessage)
        setIsProcessing(false)
      }
    }
  )

  // PAYMENT SUCCESS HANDLER
  const handlePaymentSuccess = (paymentDetails) => {
    try {
      clearCart()
      navigate(`/payment/success/${orderCreated.orderId}`)
      toast.success('Payment completed successfully!')
    } catch (error) {
      console.error('Error in payment success handler:', error)
      toast.error('Payment successful but there was an issue. Please contact support.')
    }
  }

  // Calculate totals
  const calculateTotals = () => {
    const subtotal = total
    const deliveryFee = subtotal > 10000 ? 0 : 500
    const packagingCharges = 25
    const gst = Math.round(subtotal * 0.18)
    const finalTotal = subtotal + deliveryFee + packagingCharges + gst
    
    return { subtotal, deliveryFee, packagingCharges, gst, finalTotal }
  }

  const { subtotal, deliveryFee, packagingCharges, gst, finalTotal } = calculateTotals()

  const handlePlaceOrder = async () => {
    if (!shippingData || !paymentData) {
      toast.error('Please complete all steps')
      return
    }

    setIsProcessing(true)
    setOrderError(null)

    try {
      const addressData = {
        address: shippingData.address,
        city: shippingData.city,
        state: shippingData.state,
        pincode: shippingData.pincode,
        type: shippingData.addressType || 'home',
        isDefault: false
      }

      const addressResponse = await addAddressMutation.mutateAsync(addressData)
      const addressId = addressResponse?.data?.address?._id || 
                       addressResponse?.address?._id || 
                       addressResponse?.data?._id

      if (!addressId) {
        throw new Error('Failed to get address ID from response')
      }

      const orderData = {
        deliveryAddressId: addressId,
        paymentMethod: paymentData.method,
        advancePercentage: paymentData.method === 'cod' ? 100 : 25,
        notes: shippingData.deliveryInstructions || ''
      }

      await checkoutMutation.mutateAsync(orderData)

    } catch (error) {
      console.error('❌ Error in handlePlaceOrder:', error)
      
      let errorMessage = 'Failed to process order. Please try again.'
      
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error?.message) {
        errorMessage = error.message
      }
      
      toast.error(errorMessage)
      setOrderError(errorMessage)
      setIsProcessing(false)
    }
  }

  if (!user) {
    return (
      <div className="checkout-page">
        <div className="container">
          <div className="login-required">
            <div className="login-icon">🔐</div>
            <h2>Login Required</h2>
            <p>Please login to continue with your order</p>
            <button onClick={() => navigate('/auth/login')} className="login-btn">
              Login to Continue
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!user.phoneVerified) {
    return (
      <div className="checkout-page">
        <div className="container">
          <div className="verification-required">
            <div className="verify-icon">📱</div>
            <h2>Phone Verification Required</h2>
            <p>Please verify your phone number to place orders</p>
            <button 
              onClick={() => navigate('/auth/verify-phone', { 
                state: { phoneNumber: user?.phoneNumber }
              })}
              className="verify-btn"
            >
              Verify Phone Number
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="checkout-page">
      <div className="container">
        {/* Header */}
        <div className="checkout-header">
          <button 
            onClick={() => navigate('/cart')} 
            className="back-btn"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
            </svg>
          </button>
          <div className="header-content">
            <h1>Checkout</h1>
            <p>{items?.length || 0} items • ₹{subtotal?.toLocaleString()}</p>
          </div>
        </div>

        <div className="checkout-content">
          {/* Delivery Address Section */}
          <div className="checkout-section">
            <div className="section-header">
              <div className="section-icon">📍</div>
              <div className="section-info">
                <h3>Delivery Address</h3>
                <p>Where should we deliver your order?</p>
              </div>
              {shippingData && (
                <button 
                  onClick={() => {
                    setCurrentStep(1)
                    setShippingData(null)
                  }}
                  className="edit-btn"
                >
                  Edit
                </button>
              )}
            </div>

            {!shippingData ? (
              <div className="address-form">
                <form onSubmit={handleSubmit((data) => {
                  setShippingData(data)
                  setCurrentStep(2)
                })}>
                  <div className="form-row">
                    <div className="form-group">
                      <input
                        {...register('fullName', { required: 'Full name is required' })}
                        placeholder="Full Name"
                        className={errors.fullName ? 'error' : ''}
                      />
                      {errors.fullName && <span className="error-msg">{errors.fullName.message}</span>}
                    </div>
                    <div className="form-group">
                      <input
                        {...register('phone', { 
                          required: 'Phone number is required',
                          pattern: {
                            value: /^[6-9]\d{9}$/,
                            message: 'Please enter a valid phone number'
                          }
                        })}
                        placeholder="Phone Number"
                        className={errors.phone ? 'error' : ''}
                      />
                      {errors.phone && <span className="error-msg">{errors.phone.message}</span>}
                    </div>
                  </div>

                  <div className="form-group">
                    <textarea
                      {...register('address', { required: 'Address is required' })}
                      placeholder="Complete Address (House/Flat/Building Name, Area, Locality)"
                      rows="3"
                      className={errors.address ? 'error' : ''}
                    />
                    {errors.address && <span className="error-msg">{errors.address.message}</span>}
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <input
                        {...register('city', { required: 'City is required' })}
                        placeholder="City"
                        className={errors.city ? 'error' : ''}
                      />
                      {errors.city && <span className="error-msg">{errors.city.message}</span>}
                    </div>
                    <div className="form-group">
                      <input
                        {...register('state', { required: 'State is required' })}
                        placeholder="State"
                        className={errors.state ? 'error' : ''}
                      />
                      {errors.state && <span className="error-msg">{errors.state.message}</span>}
                    </div>
                    <div className="form-group">
                      <input
                        {...register('pincode', { 
                          required: 'Pincode is required',
                          pattern: {
                            value: /^[1-9][0-9]{5}$/,
                            message: 'Please enter a valid pincode'
                          }
                        })}
                        placeholder="Pincode"
                        className={errors.pincode ? 'error' : ''}
                      />
                      {errors.pincode && <span className="error-msg">{errors.pincode.message}</span>}
                    </div>
                  </div>

                  <div className="form-group">
                    <input
                      {...register('landmark')}
                      placeholder="Nearby Landmark (Optional)"
                    />
                  </div>

                  <div className="address-type-selector">
                    <p>Save address as:</p>
                    <div className="address-types">
                      <label className="address-type">
                        <input
                          type="radio"
                          value="home"
                          {...register('addressType')}
                          defaultChecked
                        />
                        <span>🏠 Home</span>
                      </label>
                      <label className="address-type">
                        <input
                          type="radio"
                          value="office"
                          {...register('addressType')}
                        />
                        <span>🏢 Office</span>
                      </label>
                      <label className="address-type">
                        <input
                          type="radio"
                          value="other"
                          {...register('addressType')}
                        />
                        <span>📍 Other</span>
                      </label>
                    </div>
                  </div>

                  <button type="submit" className="continue-btn">
                    Continue to Payment
                  </button>
                </form>
              </div>
            ) : (
              <div className="selected-address">
                <div className="address-card">
                  <div className="address-type-badge">{shippingData.addressType}</div>
                  <h4>{shippingData.fullName}</h4>
                  <p>{shippingData.address}</p>
                  <p>{shippingData.city}, {shippingData.state} - {shippingData.pincode}</p>
                  <p className="phone">📞 {shippingData.phone}</p>
                </div>
              </div>
            )}
          </div>

          {/* Payment Method Section */}
          {currentStep >= 2 && (
            <div className="checkout-section">
              <div className="section-header">
                <div className="section-icon">💳</div>
                <div className="section-info">
                  <h3>Payment Method</h3>
                  <p>Choose your preferred payment option</p>
                </div>
                {paymentData && (
                  <button 
                    onClick={() => {
                      setCurrentStep(2)
                      setPaymentData(null)
                    }}
                    className="edit-btn"
                  >
                    Edit
                  </button>
                )}
              </div>

              {!paymentData ? (
                <div className="payment-methods">
                  <div 
                    className="payment-option"
                    onClick={() => {
                      setPaymentData({ method: 'cod' })
                      setCurrentStep(3)
                    }}
                  >
                    <div className="payment-icon">💰</div>
                    <div className="payment-info">
                      <h4>Cash on Delivery</h4>
                      <p>Pay when your order arrives</p>
                    </div>
                    <div className="payment-radio">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M9 12l2 2 4-4"/>
                      </svg>
                    </div>
                  </div>

                  <div 
                    className="payment-option"
                    onClick={() => {
                      setPaymentData({ method: 'online' })
                      setCurrentStep(3)
                    }}
                  >
                    <div className="payment-icon">💳</div>
                    <div className="payment-info">
                      <h4>Online Payment</h4>
                      <p>UPI, Cards, Net Banking</p>
                    </div>
                    <div className="payment-radio">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M9 12l2 2 4-4"/>
                      </svg>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="selected-payment">
                  <div className="payment-card">
                    <div className="payment-icon">
                      {paymentData.method === 'cod' ? '💰' : '💳'}
                    </div>
                    <div className="payment-details">
                      <h4>{paymentData.method === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</h4>
                      <p>{paymentData.method === 'cod' ? 'Pay when order arrives' : 'Pay securely online'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Order Summary Section */}
          {currentStep >= 3 && (
            <div className="checkout-section">
              <div className="section-header">
                <div className="section-icon">🛍️</div>
                <div className="section-info">
                  <h3>Order Summary</h3>
                  <p>Review your order details</p>
                </div>
              </div>

              <div className="order-items">
                {items?.map((item) => (
                  <div key={item._id} className="order-item">
                    <div className="item-image">
                      <img src={item.product?.images?.[0]?.url || '/placeholder-product.jpg'} alt={item.product?.name} />
                    </div>
                    <div className="item-details">
                      <h4>{item.product?.name}</h4>
                      <p>{item.product?.supplier?.companyName}</p>
                      <div className="item-quantity">Qty: {item.quantity}</div>
                    </div>
                    <div className="item-price">
                      ₹{(item.price * item.quantity).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              <div className="bill-details">
                <h4>Bill Details</h4>
                <div className="bill-row">
                  <span>Item Total</span>
                  <span>₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="bill-row">
                  <span>Delivery Fee</span>
                  <span>{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</span>
                </div>
                <div className="bill-row">
                  <span>Packaging Charges</span>
                  <span>₹{packagingCharges}</span>
                </div>
                <div className="bill-row">
                  <span>GST (18%)</span>
                  <span>₹{gst.toLocaleString()}</span>
                </div>
                <div className="bill-row total">
                  <span>Total</span>
                  <span>₹{finalTotal.toLocaleString()}</span>
                </div>
              </div>

              <div className="delivery-info">
                <div className="delivery-time">
                  <span className="delivery-icon">🕐</span>
                  <span>Estimated delivery: {estimatedDelivery}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Place Order Button */}
        {currentStep >= 3 && shippingData && paymentData && (
          <div className="place-order-section">
            <button 
              onClick={handlePlaceOrder}
              disabled={isProcessing}
              className="place-order-btn"
            >
              {isProcessing ? (
                <>
                  <LoadingSpinner />
                  Processing Order...
                </>
              ) : (
                <>
                  Place Order • ₹{finalTotal.toLocaleString()}
                </>
              )}
            </button>

            <div className="order-note">
              <p>By placing this order, you agree to our Terms & Conditions</p>
            </div>
          </div>
        )}

        {/* Payment Gateway Modal */}
        {showPaymentGateway && orderCreated && (
          <RazorpayPayment
            orderData={orderCreated}
            onSuccess={handlePaymentSuccess}
            onError={(error) => {
              console.error('Payment failed:', error)
              toast.error('Payment failed. Please try again.')
              setShowPaymentGateway(false)
            }}
            onCancel={() => {
              setShowPaymentGateway(false)
              toast.info('Payment cancelled')
            }}
          />
        )}
      </div>
    </div>
  )
}

export default CheckoutPage