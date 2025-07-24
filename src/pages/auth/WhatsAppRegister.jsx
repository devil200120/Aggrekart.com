import React, { useState, useEffect } from 'react'
import { useMutation } from 'react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { authAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import LocationSelector from '../../components/location/LocationSelector'
import './WhatsAppRegister.css'

const WhatsAppRegister = () => {
  const [step, setStep] = useState(1) // 1: Phone, 2: OTP, 3: Profile
  const [phoneNumber, setPhoneNumber] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [timer, setTimer] = useState(0)
  const [canResend, setCanResend] = useState(false)
  
  const [profileData, setProfileData] = useState({
    name: '',
    customerType: '',
    city: '',
    state: '',
    pincode: '',
    address: '',
    referralCode: ''
  })

  const navigate = useNavigate()
  const { login } = useAuth()

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

  // Register mutation - FIXED: Use whatsappRegister instead of register
  const registerMutation = useMutation(
    (userData) => authAPI.whatsappRegister(userData),
    {
      onSuccess: (data) => {
        login(data.token, data.user)
        toast.success('Registration successful!')
        navigate('/')
      },
      onError: (error) => {
        toast.error(error?.response?.data?.message || 'Registration failed')
      }
    }
  )

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
    
    registerMutation.mutate(userData)
  }

  // Handle location selection
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

        {/* Progress Indicator */}
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

              <div className="form-group">
                <label className="form-label">Location *</label>
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

              <div className="form-group">
                <label className="form-label">Address (Optional)</label>
                <input
                  type="text"
                  placeholder="Enter your address"
                  value={profileData.address}
                  onChange={(e) => setProfileData(prev => ({ ...prev, address: e.target.value }))}
                  className="form-input"
                />
              </div>

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