import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from 'react-query'
import { useForm } from 'react-hook-form'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { ordersAPI, usersAPI } from '../services/api'
import CheckoutSteps from '../components/checkout/CheckoutSteps'
import ShippingAddress from '../components/checkout/ShippingAddress'
import PaymentMethod from '../components/checkout/PaymentMethod'
import OrderSummary from '../components/checkout/OrderSummary'
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

  // ADD ADDRESS MUTATION - Enhanced error handling
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

  // CREATE ORDER MUTATION - Enhanced error handling
  const checkoutMutation = useMutation(
    (orderData) => ordersAPI.checkout(orderData),
    {
      onSuccess: (response) => {
        console.log('✅ Order created successfully:', response)
        
        // Handle different response structures
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
        
        // Handle specific error types
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
          // Handle validation errors
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

  // PAYMENT ERROR HANDLER
  const handlePaymentError = (error) => {
    console.error('Payment failed:', error)
    const errorMessage = error?.message || 'Payment failed. Please try again.'
    toast.error(errorMessage)
    
    if (orderCreated?.orderId) {
      navigate(`/payment/failed/${orderCreated.orderId}`)
    } else {
      setShowPaymentGateway(false)
    }
  }

  // PAYMENT CANCEL HANDLER
  const handlePaymentCancel = () => {
    setShowPaymentGateway(false)
    toast.info('Payment cancelled. You can retry payment later from your orders page.')
  }

  const steps = [
    { number: 1, title: 'Shipping Address', description: 'Where should we deliver?' },
    { number: 2, title: 'Payment Method', description: 'How would you like to pay?' },
    { number: 3, title: 'Review Order', description: 'Confirm your order details' },
    { number: 4, title: 'Payment', description: 'Complete your payment' }
  ]

  const handleShippingSubmit = (data) => {
    try {
      setShippingData(data)
      setCurrentStep(2)
      setOrderError(null) // Clear any previous errors
    } catch (error) {
      console.error('Error in shipping submit:', error)
      toast.error('Error processing shipping information')
    }
  }

  const handlePaymentSubmit = (data) => {
    try {
      setPaymentData(data)
      setCurrentStep(3)
      setOrderError(null) // Clear any previous errors
    } catch (error) {
      console.error('Error in payment submit:', error)
      toast.error('Error processing payment information')
    }
  }

  // ENHANCED - Better error handling and validation
  const handlePlaceOrder = async () => {
    if (!shippingData || !paymentData) {
      toast.error('Please complete all steps')
      return
    }

    // Validate required fields
    if (!shippingData.address || !shippingData.city || !shippingData.state || !shippingData.pincode) {
      toast.error('Please fill in all required address fields')
      setCurrentStep(1)
      return
    }

    setIsProcessing(true)
    setOrderError(null)

    try {
      // Step 1: Save shipping address to user profile
      const addressData = {
        address: shippingData.address,
        city: shippingData.city,
        state: shippingData.state,
        pincode: shippingData.pincode,
        type: shippingData.addressType || 'home',
        isDefault: false
      }

      console.log('📍 Adding address:', addressData)
      const addressResponse = await addAddressMutation.mutateAsync(addressData)
      
      // Handle different response structures
      const addressId = addressResponse?.data?.address?._id || 
                       addressResponse?.address?._id || 
                       addressResponse?.data?._id

      if (!addressId) {
        throw new Error('Failed to get address ID from response')
      }

      console.log('✅ Address added with ID:', addressId)

      // Step 2: Create order with address ID
      const orderData = {
        deliveryAddressId: addressId,
        paymentMethod: paymentData.method,
        advancePercentage: paymentData.method === 'cod' ? 100 : 25,
        notes: shippingData.deliveryInstructions || ''
      }

      console.log('🛍️ Creating order with data:', orderData)
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

  const calculateTotal = () => {
    const subtotal = total
    const deliveryFee = subtotal > 10000 ? 0 : 500
    const tax = Math.round(subtotal * 0.18)
    return subtotal + deliveryFee + tax
  }

  // Enhanced user status checking
  if (!user) {
    return (
      <div className="checkout-page">
        <div className="container">
          <div className="checkout-error">
            <h2>Please Login</h2>
            <p>You need to be logged in to checkout</p>
            <button onClick={() => navigate('/auth/login')} className="btn btn-primary">
              Login Now
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Check user verification status
  if (!user.phoneVerified) {
    return (
      <div className="checkout-page">
        <div className="container">
          <div className="checkout-error">
            <h2>Phone Verification Required</h2>
            <p>Please verify your phone number before placing orders</p>
            <button 
              onClick={() => navigate('/auth/verify-phone', { 
                state: { phoneNumber: user.phoneNumber }
              })} 
              className="btn btn-primary"
            >
              Verify Phone Number
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!user.isActive) {
    return (
      <div className="checkout-page">
        <div className="container">
          <div className="checkout-error">
            <h2>Account Activation Required</h2>
            <p>Please activate your account before placing orders</p>
            <button 
              onClick={() => navigate('/auth/verify-email', { 
                state: { email: user.email }
              })} 
              className="btn btn-primary"
            >
              Activate Account
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!items || items.length === 0) {
    return (
      <div className="checkout-page">
        <div className="container">
          <div className="checkout-error">
            <h2>Cart is Empty</h2>
            <p>Add some items to your cart before checkout</p>
            <button onClick={() => navigate('/products')} className="btn btn-primary">
              Browse Products
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Show payment gateway if order is created and payment method is online
  if (showPaymentGateway && orderCreated) {
    return (
      <div className="checkout-page">
        <div className="container">
          <div className="checkout-header">
            <h1>Complete Payment</h1>
            <p>Order #{orderCreated.orderId} created successfully</p>
          </div>

          <CheckoutSteps steps={steps} currentStep={4} />
          
          <div className="payment-gateway-container">
            <RazorpayPayment
              order={orderCreated}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
              onCancel={handlePaymentCancel}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="checkout-page">
      <div className="container">
        {/* Page Header */}
        <div className="checkout-header">
          <h1>Checkout</h1>
          <p>Complete your order in just a few steps</p>
        </div>

        {/* Error Display */}
        {orderError && (
          <div className="checkout-error-banner">
            <div className="error-content">
              <span className="error-icon">⚠️</span>
              <span className="error-message">{orderError}</span>
              <button 
                onClick={() => setOrderError(null)} 
                className="error-close"
                aria-label="Close error"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Checkout Steps */}
        <CheckoutSteps steps={steps} currentStep={currentStep} />

        {/* Checkout Content */}
        <div className="checkout-content">
          <div className="checkout-main">
            {/* Step 1: Shipping Address */}
            {currentStep === 1 && (
              <ShippingAddress
                register={register}
                handleSubmit={handleSubmit}
                errors={errors}
                onSubmit={handleShippingSubmit}
                watch={watch}
                setValue={setValue}
                defaultData={shippingData}
              />
            )}

            {/* Step 2: Payment Method */}
            {currentStep === 2 && (
              <PaymentMethod
                onSubmit={handlePaymentSubmit}
                onBack={() => setCurrentStep(1)}
                defaultData={paymentData}
                total={calculateTotal()}
              />
            )}

            {/* Step 3: Review Order */}
            {currentStep === 3 && (
              <div className="review-order">
                <div className="step-header">
                  <h2>Review Your Order</h2>
                  <p>Please review all details before placing your order</p>
                </div>

                <div className="review-sections">
                  {/* Shipping Details */}
                  <div className="review-section">
                    <h3>Shipping Address</h3>
                    <div className="address-card">
                      <div className="address-header">
                        <strong>{shippingData?.fullName}</strong>
                        <span className="address-type">{shippingData?.addressType}</span>
                      </div>
                      <div className="address-details">
                        <p>{shippingData?.address}</p>
                        <p>{shippingData?.city}, {shippingData?.state} - {shippingData?.pincode}</p>
                        <p>Phone: {shippingData?.phone}</p>
                        {shippingData?.landmark && <p>Landmark: {shippingData.landmark}</p>}
                      </div>
                    </div>
                    <button 
                      onClick={() => setCurrentStep(1)}
                      className="btn btn-outline btn-sm"
                    >
                      Edit Address
                    </button>
                  </div>

                  {/* Payment Details */}
                  <div className="review-section">
                    <h3>Payment Method</h3>
                    <div className="payment-card">
                      <div className="payment-method">
                        {paymentData?.method === 'cod' && (
                          <>
                            <span className="payment-icon">💰</span>
                            <span>Cash on Delivery</span>
                          </>
                        )}
                        {paymentData?.method === 'card' && (
                          <>
                            <span className="payment-icon">💳</span>
                            <span>Credit/Debit Card</span>
                          </>
                        )}
                        {paymentData?.method === 'upi' && (
                          <>
                            <span className="payment-icon">📱</span>
                            <span>UPI Payment</span>
                          </>
                        )}
                        {paymentData?.method === 'netbanking' && (
                          <>
                            <span className="payment-icon">🏦</span>
                            <span>Net Banking</span>
                          </>
                        )}
                        {paymentData?.method === 'wallet' && (
                          <>
                            <span className="payment-icon">💼</span>
                            <span>Digital Wallet</span>
                          </>
                        )}
                      </div>
                    </div>
                    <button 
                      onClick={() => setCurrentStep(2)}
                      className="btn btn-outline btn-sm"
                    >
                      Change Payment
                    </button>
                  </div>

                  {/* Payment Information */}
                  {paymentData?.method !== 'cod' && (
                    <div className="review-section payment-info">
                      <div className="payment-notice">
                        <h4>🔒 Secure Payment</h4>
                        <p>
                          You will be redirected to our secure payment gateway to complete your transaction.
                          Your payment information is encrypted and secure.
                        </p>
                        <div className="advance-payment-info">
                          <span>Advance Payment Required: <strong>₹{Math.round(calculateTotal() * 0.25).toLocaleString()}</strong></span>
                          <small>25% advance payment required. Remaining amount to be paid on delivery.</small>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Place Order Button */}
                <div className="place-order-section">
                  <button
                    onClick={handlePlaceOrder}
                    disabled={isProcessing}
                    className="btn btn-primary btn-lg place-order-btn"
                  >
                    {isProcessing ? (
                      <>
                        <LoadingSpinner size="small" />
                        Processing Order...
                      </>
                    ) : paymentData?.method === 'cod' ? (
                      `Place Order - ₹${calculateTotal().toLocaleString()}`
                    ) : (
                      `Create Order & Pay - ₹${Math.round(calculateTotal() * 0.25).toLocaleString()} (Advance)`
                    )}
                  </button>
                  
                  <div className="order-terms">
                    <p>
                      By placing this order, you agree to our{' '}
                      <a href="/terms" target="_blank" rel="noopener noreferrer">Terms & Conditions</a>
                      {' '}and{' '}
                      <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="checkout-sidebar">
            <OrderSummary 
              items={items}
              total={total}
              showPromo={currentStep < 3}
              paymentMethod={paymentData?.method}
              advanceAmount={paymentData?.method !== 'cod' ? Math.round(calculateTotal() * 0.25) : null}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default CheckoutPage