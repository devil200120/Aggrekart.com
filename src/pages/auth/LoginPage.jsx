import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './AuthPages.css'

const LoginPage = () => {
  const { login, isAuthenticated, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  const [showPassword, setShowPassword] = useState(false)
  const [loginType, setLoginType] = useState('email') // 'email' or 'phone'
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    identifier: '',
    password: ''
  })
  const [errors, setErrors] = useState({})

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/'
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, navigate, location])

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  // Validate form
  const validateForm = () => {
    const newErrors = {}

    if (!formData.identifier) {
      newErrors.identifier = loginType === 'email' ? 'Email is required' : 'Phone number is required'
    } else if (loginType === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.identifier)) {
        newErrors.identifier = 'Please enter a valid email address'
      }
    } else if (loginType === 'phone') {
      const phoneRegex = /^[6-9]\d{9}$/
      if (!phoneRegex.test(formData.identifier)) {
        newErrors.identifier = 'Please enter a valid 10-digit phone number'
      }
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle login type switch
  const handleLoginTypeChange = (type) => {
    setLoginType(type)
    setFormData(prev => ({
      ...prev,
      identifier: ''
    }))
    setErrors({})
  }

  // Add this to the handleSubmit function (around line 85):

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    
    try {
      const result = await login({
        identifier: formData.identifier,
        password: formData.password,
        loginType
      })

      if (result.success) {
        // Check if verification is required
        if (result.requiresVerification) {
          const verificationData = result.data
          
          // Navigate to appropriate verification screen
          if (!verificationData.user.phoneVerified) {
            navigate('/auth/verify-phone', { 
              state: { 
                phoneNumber: verificationData.user.phoneNumber,
                email: verificationData.user.email,
                fromLogin: true,
                verificationStatus: verificationData.verificationStatus,
                devOtps: verificationData.dev_otps // For development
              } 
            })
          } else if (!verificationData.user.emailVerified) {
            navigate('/auth/verify-email', { 
              state: { 
                email: verificationData.user.email,
                phoneNumber: verificationData.user.phoneNumber,
                fromLogin: true,
                verificationStatus: verificationData.verificationStatus,
                devOtps: verificationData.dev_otps // For development
              } 
            })
          }
        } else {
          // Normal login success
          const from = location.state?.from?.pathname || '/'
          navigate(from, { replace: true })
        }
      } else {
        setErrors({
          submit: result.message || 'Login failed. Please check your credentials.'
        })
      }
    } catch (error) {
      console.error('Login error:', error)
      setErrors({
        submit: 'An error occurred during login. Please try again.'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <Link to="/" className="auth-logo">
            <span className="logo-icon">🏗️</span>
            <span className="logo-text">Aggrekart</span>
          </Link>
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">
            Sign in to your account to continue your construction journey
          </p>
        </div>

        <div className="auth-card">
          {/* Login Type Toggle */}
          <div className="login-type-toggle">
            <button
              type="button"
              className={`toggle-btn ${loginType === 'email' ? 'active' : ''}`}
              onClick={() => handleLoginTypeChange('email')}
            >
               Email
            </button>
            <button
              type="button"
              className={`toggle-btn ${loginType === 'phone' ? 'active' : ''}`}
              onClick={() => handleLoginTypeChange('phone')}
            >
              Phone
            </button>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {/* Identifier Input */}
            <div className="form-group">
              <label className="form-label">
                {loginType === 'email' ? 'Email Address' : 'Phone Number'}
              </label>
              <div className="input-wrapper">
                <span className="input-icon">
                  {loginType === 'email' ? '📧' : '📱'}
                </span>
                <input
                  type={loginType === 'email' ? 'email' : 'tel'}
                  name="identifier"
                  value={formData.identifier}
                  onChange={handleInputChange}
                  placeholder={
                    loginType === 'email' 
                      ? 'Enter your email address'
                      : 'Enter your phone number'
                  }
                  className={`form-control ${errors.identifier ? 'error' : ''}`}
                  disabled={isSubmitting}
                />
              </div>
              {errors.identifier && (
                <span className="error-message">
                  ⚠️ {errors.identifier}
                </span>
              )}
            </div>

            {/* Password Input */}
            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-wrapper">
                <span className="input-icon">🔒</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                  className={`form-control ${errors.password ? 'error' : ''}`}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isSubmitting}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              {errors.password && (
                <span className="error-message">
                  ⚠️ {errors.password}
                </span>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="form-options">
              <label className="checkbox-wrapper">
                <input type="checkbox" />
                <span className="checkmark"></span>
                Remember me
              </label>
              <Link to="/auth/forgot-password" className="forgot-password">
                Forgot Password?
              </Link>
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="error-banner">
                ⚠️ {errors.submit}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner-sm"></span>
                  Signing In...
                </>
              ) : (
                <>
                  🚀 Sign In
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="auth-divider">
            <span>or</span>
          </div>

          {/* Social Login */}
          <div className="social-login">
            <button className="btn btn-social google" type="button">
              🔍 Continue with Google
            </button>
            <button className="btn btn-social facebook" type="button">
              📘 Continue with Facebook
            </button>
          </div>

          {/* Sign Up Link */}
          <div className="auth-footer">
            <p>
              Don't have an account?{' '}
              <Link to="/auth/register" className="auth-link">
                Sign up here
              </Link>
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="auth-features">
          <div className="feature">
            <span className="feature-icon">✅</span>
            <span>Verified Suppliers</span>
          </div>
          <div className="feature">
            <span className="feature-icon">🚚</span>
            <span>Fast Delivery</span>
          </div>
          <div className="feature">
            <span className="feature-icon">💰</span>
            <span>Best Prices</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage