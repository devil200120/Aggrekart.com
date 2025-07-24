import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'  // Add this import

import { authAPI } from '../../services/api'
import toast from 'react-hot-toast'
import './AuthPages.css'

const VerifyPhonePage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { verifyPhone } = useAuth()  // Add this line

  
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [timer, setTimer] = useState(300) // 5 minutes
  const [canResend, setCanResend] = useState(false)
  
  const otpRefs = useRef([])
  const phoneNumber = location.state?.phoneNumber
  const email = location.state?.email
  const devOtps = location.state?.devOtps
  useEffect(() => {
    if (import.meta.env.MODE === 'development' && devOtps?.phoneOTP) {
      console.log('🔧 Development mode: Auto-filling phone OTP:', devOtps.phoneOTP)
      const otpArray = devOtps.phoneOTP.split('')
      setOtp(otpArray)
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
    if (value.length > 1) return // Prevent multiple characters
    
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    // Move to next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text/plain').slice(0, 6)
    const newOtp = pastedData.split('').concat(Array(6).fill('')).slice(0, 6)
    setOtp(newOtp)
    
    // Focus on the next empty input or last input
    const nextIndex = Math.min(pastedData.length, 5)
    otpRefs.current[nextIndex]?.focus()
  }

  // Replace the handleVerifyOtp function (around line 68-95):

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
        // User is fully verified, redirect to home
        toast.success('Phone number verified successfully! Welcome to Aggrekart!')
        navigate('/', { replace: true })
      } else {
        // Phone verified but email verification needed
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
      const response = await authAPI.resendOtp({ phoneNumber })
      
      if (response.success) {
        toast.success('OTP sent successfully!')
        setTimer(300) // Reset timer
        setCanResend(false)
        setOtp(['', '', '', '', '', ''])
        otpRefs.current[0]?.focus()
      } else {
        toast.error(response.message || 'Failed to resend OTP')
      }
    } catch (error) {
      console.error('Resend OTP error:', error)
      toast.error('Failed to resend OTP. Please try again.')
    } finally {
      setIsResending(false)
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!phoneNumber) {
    return null // Will redirect to register
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-logo">
            <span className="logo-icon">🏗️</span>
            <span className="logo-text">Aggrekart</span>
          </div>
          <h1 className="auth-title">Verify Phone Number</h1>
          <p className="auth-subtitle">
            We've sent a 6-digit OTP to <strong>+91 {phoneNumber}</strong>
          </p>
        </div>

        <div className="auth-card">
          <div className="verify-phone-content">
            <div className="phone-icon">
              📱
            </div>
            
            <div className="otp-input-container">
              <label className="otp-label">Enter OTP</label>
              <div className="otp-inputs">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (otpRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    className="otp-input"
                    disabled={isSubmitting}
                  />
                ))}
              </div>
            </div>

            <div className="otp-timer">
              {!canResend ? (
                <p>
                  <span className="timer-icon">⏱️</span>
                  Resend OTP in {formatTime(timer)}
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isResending}
                  className="resend-button"
                >
                  {isResending ? (
                    <>
                      <span className="spinner-small"></span>
                      Sending...
                    </>
                  ) : (
                    <>
                      🔄 Resend OTP
                    </>
                  )}
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={handleVerifyOtp}
              disabled={isSubmitting || otp.join('').length !== 6}
              className="btn btn-primary verify-button"
            >
              {isSubmitting ? (
                <>
                  <span className="spinner-small"></span>
                  Verifying...
                </>
              ) : (
                <>
                  ✅ Verify & Continue
                </>
              )}
            </button>

            <div className="verify-help">
              <p>Didn't receive the OTP?</p>
              <ul>
                <li>Check your SMS inbox</li>
                <li>Ensure you have network coverage</li>
                <li>Wait for the timer to expire and resend</li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => navigate('/auth/register')}
              className="btn btn-secondary back-button"
            >
              ← Back to Registration
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VerifyPhonePage