import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { authAPI } from '../../services/api'
import toast from 'react-hot-toast'
import './AuthPages.css'

const VerifyEmailPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { verifyEmail } = useAuth()
  
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [timer, setTimer] = useState(300) // 5 minutes
  const [canResend, setCanResend] = useState(false)
  
  const otpRefs = useRef([])
  const email = location.state?.email
  const phoneNumber = location.state?.phoneNumber
  const fromLogin = location.state?.fromLogin
  const devOtps = location.state?.devOtps

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

  // Redirect if no email in state
  useEffect(() => {
    if (!email) {
      navigate('/auth/register')
    }
  }, [email, navigate])

  // Auto-fill OTP in development
  useEffect(() => {
    if (devOtps?.emailOTP && import.meta.env.MODE === 'development') {
      const otpArray = devOtps.emailOTP.split('')
      setOtp(otpArray)
      toast.success(`Development: Auto-filled OTP: ${devOtps.emailOTP}`)
    }
  }, [devOtps])

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return
    
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

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
    
    const nextIndex = Math.min(pastedData.length, 5)
    otpRefs.current[nextIndex]?.focus()
  }

  // Update the handleVerifyOtp function and add dev OTP auto-fill:

const handleVerifyOtp = async () => {
  const otpString = otp.join('')
  
  if (otpString.length !== 6) {
    toast.error('Please enter a complete 6-digit OTP')
    return
  }

  setIsSubmitting(true)
  
  try {
    const result = await verifyEmail({
      email,
      otp: otpString
    })

    if (result.success) {
      if (result.fullyVerified) {
        // Fully verified, redirect to home
        toast.success('Email verified successfully! Welcome to Aggrekart!')
        navigate('/', { replace: true })
      } else {
        // Email verified but phone verification still needed
        toast.success('Email verified! Please verify your phone.')
        navigate('/auth/verify-phone', { 
          state: { 
            phoneNumber: phoneNumber || location.state?.phoneNumber,
            email,
            fromLogin: location.state?.fromLogin,
            verificationStatus: {
              phoneVerified: false,
              emailVerified: true
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
    console.error('Email verification error:', error)
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
        type: 'email',
        identifier: email
      })

      if (response.success) {
        toast.success('New OTP sent to your email!')
        setTimer(300)
        setCanResend(false)
        
        // Auto-fill in development
        if (response.data?.otp && import.meta.env.MODE === 'development') {
          setTimeout(() => {
            const otpArray = response.data.otp.split('')
            setOtp(otpArray)
            toast.success(`Development: New OTP: ${response.data.otp}`)
          }, 1000)
        }
      }
    } catch (error) {
      toast.error('Failed to resend OTP. Please try again.', error)
    } finally {
      setIsResending(false)
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-logo">
            <span className="logo-icon">🏗️</span>
            <span className="logo-text">Aggrekart</span>
          </div>
          <h1 className="auth-title">Verify Your Email</h1>
          <p className="auth-subtitle">
            We've sent a 6-digit verification code to<br />
            <strong>{email?.replace(/(.{2})(.*)(@.*)/, '$1***$3')}</strong>
          </p>
        </div>

        <div className="auth-card">
          <div className="otp-container">
            <div className="otp-inputs">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (otpRefs.current[index] = el)}
                  type="text"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className={`otp-input ${digit ? 'filled' : ''}`}
                  disabled={isSubmitting}
                />
              ))}
            </div>

            <button
              onClick={handleVerifyOtp}
              disabled={isSubmitting || otp.join('').length !== 6}
              className="btn btn-primary btn-full"
            >
              {isSubmitting ? 'Verifying...' : 'Verify Email'}
            </button>

            <div className="resend-section">
              {!canResend ? (
                <p className="timer-text">
                  Resend OTP in {formatTime(timer)}
                </p>
              ) : (
                <button
                  onClick={handleResendOtp}
                  disabled={isResending}
                  className="btn btn-link"
                >
                  {isResending ? 'Sending...' : 'Resend OTP'}
                </button>
              )}
            </div>

            {import.meta.env.MODE === 'development' && devOtps?.emailOTP && (
              <div className="dev-info">
                <p>🔧 Development OTP: {devOtps.emailOTP}</p>
              </div>
            )}
          </div>

          <div className="auth-footer">
            <p>
              Wrong email? 
              <button 
                onClick={() => navigate('/auth/register')}
                className="btn btn-link"
              >
                Go back to registration
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VerifyEmailPage
