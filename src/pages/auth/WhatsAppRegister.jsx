import React, { useState, useEffect } from 'react'
import { useMutation } from 'react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { authAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import LocationSelector from '../../components/location/LocationSelector'
import GoogleMapsAddressInput from '../../components/common/GoogleMapsAddressInput'
import './WhatsAppRegister.css'
import Cookies from 'js-cookie'  // ADD THIS IMPORT

const WhatsAppRegister = () => {
  const [step, setStep] = useState(1) // 1: Phone, 2: OTP, 3: Profile (REMOVED EMAIL STEP)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [timer, setTimer] = useState(0)
  const [canResend, setCanResend] = useState(false)
  
  const [profileData, setProfileData] = useState({
    name: '',
    email: '', // OPTIONAL
    customerType: '',
    city: '',
    state: '',
    pincode: '',
    address: '',
    referralCode: '',
    coordinates: null
  })

  const navigate = useNavigate()
  const { setAuthState } = useAuth()  // UPDATED

  // Timer effect
  useEffect(() => {
    let interval = null
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer(timer => timer - 1)
      }, 1000)
    } else if (timer === 0) {
      setCanResend(true)
    }
    return () => clearInterval(interval)
  }, [timer])

  // Send OTP mutation
  const sendOTPMutation = useMutation(
    (phoneNumber) => authAPI.sendOTP({ phoneNumber }),
    {
      onSuccess: () => {
        toast.success('OTP sent successfully!')
        setStep(2)
        setTimer(60)
        setCanResend(false)
      },
      onError: (error) => {
        toast.error(error?.response?.data?.message || 'Failed to send OTP')
      }
    }
  )

  // Verify OTP mutation
  const verifyOTPMutation = useMutation(
    (data) => authAPI.verifyOTP(data),
    {
      onSuccess: () => {
        toast.success('Phone verified successfully!')
        setStep(3)
      },
      onError: (error) => {
        toast.error(error?.response?.data?.message || 'Invalid OTP')
        setOtp(['', '', '', '', '', ''])
      }
    }
  )

  // Register mutation - Simplified (no email verification)
  // ...existing code...

  // Register mutation - FIXED: Use whatsappRegister instead of register
  const registerMutation = useMutation(
    (userData) => authAPI.whatsappRegister(userData),
    {
      onSuccess: (response) => {
        const { token, user } = response.data
        setAuthState(token, user)
        toast.success('Registration successful!')
        navigate('/')
      },
      onError: (error) => {
        toast.error(error?.response?.data?.message || 'Registration failed')
      }
    }
  )

// ...existing code...
  // Handle phone number submission
  const handlePhoneSubmit = (e) => {
    e.preventDefault()
    if (!phoneNumber.trim()) {
      toast.error('Please enter your phone number')
      return
    }
    
    const cleanPhone = phoneNumber.replace(/\D/g, '')
    if (cleanPhone.length !== 10) {
      toast.error('Please enter a valid 10-digit phone number')
      return
    }
    
    sendOTPMutation.mutate(`+91${cleanPhone}`)
  }

  // Handle OTP input
  const handleOTPInput = (index, value) => {
    if (value.length > 1) return
    
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    
    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.querySelector(`input[name="otp-${index + 1}"]`)
      if (nextInput) nextInput.focus()
    }
    
    // Auto-submit when all 6 digits are entered
    if (newOtp.every(digit => digit) && newOtp.join('').length === 6) {
      verifyOTPMutation.mutate({
        phoneNumber: `+91${phoneNumber.replace(/\D/g, '')}`,
        otp: newOtp.join('')
      })
    }
  }

  // Handle profile submission
  const handleProfileSubmit = (e) => {
    e.preventDefault()
    
    if (!profileData.name.trim()) {
      toast.error('Please enter your name')
      return
    }

    // Email validation only if provided
    if (profileData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(profileData.email)) {
        toast.error('Please enter a valid email address')
        return
      }
    }
    
    if (!profileData.customerType) {
      toast.error('Please select customer type')
      return
    }

    // Location validation
    if (!profileData.city || !profileData.state) {
      toast.error('Please select your location')
      return
    }
    
    const userData = {
      name: profileData.name,
      phoneNumber: `+91${phoneNumber.replace(/\D/g, '')}`,
      customerType: profileData.customerType,
      referralCode: profileData.referralCode,
      addresses: [{
        address: profileData.address,
        city: profileData.city,
        state: profileData.state,
        pincode: profileData.pincode,
        isDefault: true
      }]
    }

    // Only add email if provided
    if (profileData.email.trim()) {
      userData.email = profileData.email
    }
    
    registerMutation.mutate(userData)
  }

  // Handle Google Maps address selection (same as before)
  const handleAddressSelect = (addressData) => {
    console.log('📍 Address data received:', addressData)
    
    let city = '', state = '', pincode = ''
    
    // Parse address components from Google Places API
    if (addressData.addressComponents && addressData.addressComponents.length > 0) {
      addressData.addressComponents.forEach(component => {
        const types = component.types
        
        // Extract city (locality or sublocality)
        if (types.includes('locality') || types.includes('sublocality') || types.includes('sublocality_level_1')) {
          city = component.long_name
        }
        // Fallback to district if no locality found
        else if (types.includes('administrative_area_level_2') && !city) {
          city = component.long_name
        }
        
        // Extract state
        if (types.includes('administrative_area_level_1')) {
          state = component.long_name
        }
        
        // Extract pincode
        if (types.includes('postal_code')) {
          pincode = component.long_name
        }
      })
    }
    
    // Fallback: Extract from formatted address if components parsing failed
    if (!pincode && addressData.address) {
      const pincodeMatch = addressData.address.match(/\b\d{6}\b/)
      if (pincodeMatch) {
        pincode = pincodeMatch[0]
      }
    }
    
    // Update form data
    setProfileData(prev => ({
      ...prev,
      address: addressData.address,
      city: city,
      state: state,
      pincode: pincode,
      coordinates: addressData.coordinates
    }))

    console.log('📍 Address parsed:', { address: addressData.address, city, state, pincode })
  }

  // Handle location selection from LocationSelector
  const handleLocationSelect = (location) => {
    setProfileData(prev => ({
      ...prev,
      city: location.city,
      state: location.state,
      pincode: location.pincode || '',
      address: location.address || prev.address
    }))
  }

  // Resend OTP
  const handleResendOTP = () => {
    sendOTPMutation.mutate(`+91${phoneNumber.replace(/\D/g, '')}`)
  }

  return (
    <div className="whatsapp-register">
      <div className="register-container">
        <div className="register-header">
          <div className="whatsapp-logo">
            <span className="logo-icon">📱</span>
            <h1>Quick Registration</h1>
          </div>
          <p className="register-subtitle">Join Aggrekart in just 3 simple steps</p>
        </div>

        {/* Progress Indicator - Back to 3 steps */}
        <div className="progress-indicator">
          <div className={`progress-step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
            <div className="step-number">1</div>
            <div className="step-label">Phone</div>
          </div>
          <div className={`progress-line ${step > 1 ? 'completed' : ''}`}></div>
          <div className={`progress-step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
            <div className="step-number">2</div>
            <div className="step-label">Verify</div>
          </div>
          <div className={`progress-line ${step > 2 ? 'completed' : ''}`}></div>
          <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>
            <div className="step-number">3</div>
            <div className="step-label">Profile</div>
          </div>
        </div>

        {/* Step 1: Phone Number */}
        {step === 1 && (
          <div className="register-step">
            <div className="step-header">
              <h2>Enter Your Phone Number</h2>
              <p>We'll send you a verification code via SMS</p>
            </div>
            
            <form onSubmit={handlePhoneSubmit} className="phone-form">
              <div className="phone-input-group">
                <div className="country-code">+91</div>
                <input
                  type="tel"
                  placeholder="Enter 10-digit mobile number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="phone-input"
                  maxLength="10"
                  autoFocus
                />
              </div>
              
              <button 
                type="submit" 
                className="btn btn-primary btn-full"
                disabled={sendOTPMutation.isLoading || phoneNumber.length !== 10}
              >
                {sendOTPMutation.isLoading ? 'Sending...' : 'Send OTP'}
              </button>
            </form>

            <div className="register-footer">
              <p>Already have an account? <a href="/auth/login">Sign In</a></p>
            </div>
          </div>
        )}

        {/* Step 2: OTP Verification */}
        {step === 2 && (
          <div className="register-step">
            <div className="step-header">
              <h2>Verify Your Phone</h2>
              <p>Enter the 6-digit code sent to +91{phoneNumber}</p>
            </div>
            
            <div className="otp-form">
              <div className="otp-inputs">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    type="text"
                    name={`otp-${index}`}
                    value={digit}
                    onChange={(e) => handleOTPInput(index, e.target.value)}
                    className="otp-input"
                    maxLength="1"
                    autoFocus={index === 0}
                  />
                ))}
              </div>
              
              <div className="otp-actions">
                {timer > 0 ? (
                  <p className="resend-timer">Resend OTP in {timer}s</p>
                ) : (
                  <button 
                    type="button" 
                    className="btn btn-text"
                    onClick={handleResendOTP}
                    disabled={sendOTPMutation.isLoading}
                  >
                    {sendOTPMutation.isLoading ? 'Sending...' : 'Resend OTP'}
                  </button>
                )}
              </div>
            </div>

            <button 
              type="button"
              className="btn btn-outline btn-full"
              onClick={() => setStep(1)}
            >
              Change Number
            </button>
          </div>
        )}

        {/* Step 3: Profile Setup */}
        {step === 3 && (
          <div className="register-step">
            <div className="step-header">
              <h2>Complete Your Profile</h2>
              <p>Tell us a bit about yourself</p>
            </div>
            
            <form onSubmit={handleProfileSubmit} className="profile-form">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={profileData.name}
                  onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                  className="form-input"
                  autoFocus
                />
              </div>

              {/* Email field - OPTIONAL */}
              <div className="form-group">
                <label className="form-label">Email Address (Optional)</label>
                <input
                  type="email"
                  placeholder="Enter your email address (leave blank to skip)"
                  value={profileData.email}
                  onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                  className="form-input"
                />
                <span className="form-hint">Optional - we'll create one for you if left blank</span>
              </div>

              <div className="form-group">
                <label className="form-label">Customer Type *</label>
                <select
                  value={profileData.customerType}
                  onChange={(e) => setProfileData(prev => ({ ...prev, customerType: e.target.value }))}
                  className="form-select"
                >
                  <option value="">Select customer type</option>
                  <option value="individual">Individual Builder</option>
                  <option value="contractor">Contractor</option>
                  <option value="architect">Architect</option>
                  <option value="company">Construction Company</option>
                </select>
              </div>

              {/* Google Maps Address Input */}
              <div className="form-group">
                <label className="form-label">
                  Address *
                  <span className="form-hint">Start typing to see suggestions</span>
                </label>
                <GoogleMapsAddressInput
                  onAddressSelect={handleAddressSelect}
                  defaultValue={profileData.address}
                  placeholder="Start typing your address..."
                  required
                  className="form-input"
                  name="address"
                />
              </div>

              {/* Display parsed address components */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input
                    type="text"
                    value={profileData.city}
                    onChange={(e) => setProfileData(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="City"
                    className="form-input"
                    readOnly={profileData.city ? true : false}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">State</label>
                  <input
                    type="text"
                    value={profileData.state}
                    onChange={(e) => setProfileData(prev => ({ ...prev, state: e.target.value }))}
                    placeholder="State"
                    className="form-input"
                    readOnly={profileData.state ? true : false}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Pincode</label>
                  <input
                    type="text"
                    value={profileData.pincode}
                    onChange={(e) => setProfileData(prev => ({ ...prev, pincode: e.target.value }))}
                    placeholder="Pincode"
                    className="form-input"
                    maxLength="6"
                    pattern="[0-9]{6}"
                  />
                </div>
              </div>

              {/* Fallback LocationSelector */}
              {!profileData.city && !profileData.state && (
                <div className="form-group">
                  <label className="form-label">
                    Or Select Location Manually *
                    <span className="form-hint">If address search didn't work</span>
                  </label>
                  <LocationSelector
                    onLocationChange={handleLocationSelect}
                    selectedLocation={{
                      city: profileData.city,
                      state: profileData.state,
                      pincode: profileData.pincode
                    }}
                    showServiceAreas={false}
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Referral Code (Optional)</label>
                <input
                  type="text"
                  placeholder="Enter referral code if any"
                  value={profileData.referralCode}
                  onChange={(e) => setProfileData(prev => ({ ...prev, referralCode: e.target.value }))}
                  className="form-input"
                />
              </div>
              
              <button 
                type="submit" 
                className="btn btn-primary btn-full"
                disabled={registerMutation.isLoading}
              >
                {registerMutation.isLoading ? 'Creating Account...' : 'Complete Registration'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

export default WhatsAppRegister