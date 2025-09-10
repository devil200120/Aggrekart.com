import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { authAPI } from '../../services/api'
import toast from 'react-hot-toast'
import './VerifyPhone.css'

const VerifyPhonePage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { verifyPhone } = useAuth()
  
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [timer, setTimer] = useState(60) // 1 minutes
  const [canResend, setCanResend] = useState(false)
  
  const otpRefs = useRef([])
  const phoneNumber = location.state?.phoneNumber
  const email = location.state?.email
  const devOtps = location.state?.devOtps

  // Auto-fill OTP in development
  useEffect(() => {
    if (import.meta.env.MODE === 'development' && devOtps?.phoneOTP) {
      console.log('🔧 Development mode: Auto-filling phone OTP:', devOtps.phoneOTP)
      const otpString = String(devOtps.phoneOTP)
      const otpArray = otpString.padStart(6, '0').split('')
      setOtp(otpArray)
      toast.success(`Development: Auto-filled OTP: ${devOtps.phoneOTP}`, { duration: 5000 })
    }
  }, [devOtps])

  // Timer countdown
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer(timer - 1)
      }, 1000)
      return () => clearInterval(interval)
    } else {
      setCanResend(true)
    }
  }, [timer])

  // Redirect if no phone number in state
  useEffect(() => {
    if (!phoneNumber) {
      navigate('/auth/register')
    }
  }, [phoneNumber, navigate])

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    // Move to next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus()
    }

    // Auto-submit when all fields are filled
    if (value && newOtp.every(digit => digit)) {
      setTimeout(() => handleVerifyOtp(), 100)
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text/plain').replace(/\D/g, '').slice(0, 6)
    const newOtp = pastedData.padEnd(6, '').split('')
    setOtp(newOtp)
    
    const nextIndex = Math.min(pastedData.length, 5)
    otpRefs.current[nextIndex]?.focus()

    // Auto-submit if paste fills all fields
    if (pastedData.length === 6) {
      setTimeout(() => handleVerifyOtp(), 100)
    }
  }

  const handleVerifyOtp = async () => {
    const otpString = otp.join('')
    
    if (otpString.length !== 6) {
      toast.error('Please enter a complete 6-digit OTP')
      return
    }

    setIsSubmitting(true)
    
    try {
      const result = await verifyPhone({
        phoneNumber,
        otp: otpString
      })

      if (result.success) {
        if (result.fullyVerified) {
          toast.success('Phone verified successfully! Welcome to Aggrekart!')
          navigate('/', { replace: true })
        } else {
          toast.success('Phone verified! Please verify your email.')
          navigate('/auth/verify-email', { 
            state: { 
              email: email || location.state?.email,
              phoneNumber,
              fromLogin: location.state?.fromLogin,
              verificationStatus: {
                phoneVerified: true,
                emailVerified: false
              }
            },
            replace: true 
          })
        }
      } else {
        toast.error(result.message || 'Invalid OTP. Please try again.')
        setOtp(['', '', '', '', '', ''])
        otpRefs.current[0]?.focus()
      }
    } catch (error) {
      console.error('OTP verification error:', error)
      toast.error('Verification failed. Please try again.')
      setOtp(['', '', '', '', '', ''])
      otpRefs.current[0]?.focus()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResendOtp = async () => {
    setIsResending(true)
    
    try {
      const response = await authAPI.resendOTP({
        type: 'phone',
        identifier: phoneNumber
      })
      
      if (response.success) {
        toast.success('New OTP sent successfully!')
        setTimer(60)
        setCanResend(false)
        setOtp(['', '', '', '', '', ''])
        otpRefs.current[0]?.focus()
        
        if (import.meta.env.MODE === 'development' && response.devOtp) {
          toast.success(`Development: New OTP: ${response.devOtp}`, { duration: 5000 })
        }
      } else {
        toast.error(response.message || 'Failed to resend OTP')
      }
    } catch (error) {
      console.error('Resend OTP error:', error)
      
      if (error.response?.status === 400) {
        toast.error(error.response.data?.message || 'Invalid request')
      } else if (error.response?.status === 404) {
        toast.error('User not found. Please register again.')
        navigate('/auth/register')
      } else {
        toast.error('Failed to resend OTP. Please try again.')
      }
    } finally {
      setIsResending(false)
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getTimerProgress = () => {
    return ((300 - timer) / 300) * 100
  }

  if (!phoneNumber) {
    return null
  }

  return (
    <div className="verify-phone-page">
      <div className="verify-phone-container">
        {/* Background Elements */}
        <div className="bg-elements">
          <div className="bg-circle bg-circle-1"></div>
          <div className="bg-circle bg-circle-2"></div>
          <div className="bg-pattern"></div>
        </div>

        {/* Header Section */}
        <div className="verify-header">
          <div className="brand-section">
            <div className="brand-logo">
              <span className="logo-icon">🏗️</span>
              <span className="brand-name">Aggrekart</span>
            </div>
            <p className="brand-tagline">Building dreams, delivering quality</p>
          </div>
          
          <div className="verification-hero">
            <div className="hero-icon">
              <div className="phone-icon">📱</div>
              <div className="verification-badge">✓</div>
            </div>
            <h1 className="hero-title">Verify Your Phone Number</h1>
            <p className="hero-subtitle">
              We've sent a 6-digit verification code to
            </p>
            <div className="phone-display">
              <span className="country-code">+91</span>
              <span className="phone-number">{phoneNumber}</span>
              <button 
                className="edit-phone-btn"
                onClick={() => navigate('/auth/register')}
                title="Edit phone number"
              >
                ✏️
              </button>
            </div>
          </div>
        </div>

        {/* OTP Input Section */}
        <div className="otp-section">
          <div className="otp-input-container">
            <label className="otp-label">Enter 6-digit verification code</label>
            <div className="otp-inputs">
              {otp.map((digit, index) => (
                <div key={index} className="otp-input-wrapper">
                  <input
                    ref={(el) => (otpRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value.replace(/\D/g, ''))}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    className={`otp-input ${digit ? 'filled' : ''} ${isSubmitting ? 'submitting' : ''}`}
                    disabled={isSubmitting}
                    autoFocus={index === 0}
                  />
                  <div className="input-underline"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Timer Section */}
          <div className="timer-section">
            {!canResend ? (
              <div className="timer-active">
                <div className="timer-display">
                  <div className="timer-icon">⏱️</div>
                  <span className="timer-text">Code expires in</span>
                  <span className="timer-countdown">{formatTime(timer)}</span>
                </div>
                <div className="timer-progress">
                  <div 
                    className="progress-bar" 
                    style={{ width: `${100 - getTimerProgress()}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="resend-section">
                <p className="resend-info">Didn't receive the code?</p>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isResending}
                  className="resend-btn"
                >
                  <span className="resend-icon">🔄</span>
                  {isResending ? 'Sending new code...' : 'Resend verification code'}
                </button>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="action-buttons">
            <button
              type="button"
              onClick={handleVerifyOtp}
              disabled={isSubmitting || otp.join('').length !== 6}
              className="verify-btn primary-btn"
            >
              {isSubmitting ? (
                <>
                  <div className="loading-spinner"></div>
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <span>Verify & Continue</span>
                  <span className="btn-arrow">→</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => navigate('/auth/register')}
              className="varify-back-btn varify-secondary-btn"
            >
              <span className="btn-arrow">←</span>
              <span>Back to Registration</span>
            </button>
          </div>
        </div>

        {/* Help Section */}
        <div className="help-section">
          <div className="help-header">
            <span className="help-icon">💡</span>
            <h3>Having trouble receiving the code?</h3>
          </div>
          <ul className="help-list">
            <li>
              <span className="help-item-icon">📱</span>
              Check your SMS inbox and spam folder
            </li>
            <li>
              <span className="help-item-icon">📶</span>
              Ensure you have good network coverage
            </li>
            <li>
              <span className="help-item-icon">🔄</span>
              Wait for the timer to expire and request a new code
            </li>
            <li>
              <span className="help-item-icon">✏️</span>
              Make sure your phone number is correct
            </li>
          </ul>
        </div>

        {/* Development Info */}
        {import.meta.env.MODE === 'development' && devOtps?.phoneOTP && (
          <div className="dev-info">
            <div className="dev-badge">DEV MODE</div>
            <p>Auto-filled OTP: <strong>{devOtps.phoneOTP}</strong></p>
          </div>
        )}
      </div>
    </div>
  )
}

export default VerifyPhonePage