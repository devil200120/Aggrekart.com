import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './AuthPages.css'

const RegisterPage = () => {
  const { register: registerUser, isAuthenticated, loading } = useAuth()
  const navigate = useNavigate()
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    customerType: 'house_owner',
    address: '',
    city: '',
    state: '',
    pincode: '',
    gstNumber: ''
  })
  const [errors, setErrors] = useState({})

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true })
    }
  }, [isAuthenticated, navigate])

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

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    }

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    // Phone validation
    if (!formData.phoneNumber) {
      newErrors.phoneNumber = 'Phone number is required'
    } else if (!/^[6-9]\d{9}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid 10-digit phone number'
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    // Address validation
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required'
    }

    // City validation
    if (!formData.city.trim()) {
      newErrors.city = 'City is required'
    }

    // State validation
    if (!formData.state.trim()) {
      newErrors.state = 'State is required'
    }

    // Pincode validation
    if (!formData.pincode) {
      newErrors.pincode = 'Pincode is required'
    } else if (!/^[1-9][0-9]{5}$/.test(formData.pincode)) {
      newErrors.pincode = 'Please enter a valid 6-digit pincode'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    
    try {
      const registrationData = {
        name: formData.name.trim(),
        email: formData.email.toLowerCase(),
        phoneNumber: formData.phoneNumber,
        password: formData.password,
        customerType: formData.customerType,
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        pincode: formData.pincode
      }

      // Add GST number if provided
      if (formData.gstNumber.trim()) {
        registrationData.gstNumber = formData.gstNumber.trim()
      }

      console.log('Sending registration data:', registrationData)

      const result = await registerUser(registrationData)

      if (result.success) {
        navigate('/auth/verify-phone', { 
          state: { 
            phoneNumber: formData.phoneNumber,
            email: formData.email 
          } 
        })
      } else {
        setErrors({
          submit: result.message || 'Registration failed. Please try again.'
        })
      }
    } catch (error) {
      console.error('Registration error:', error)
      setErrors({
        submit: 'An error occurred during registration. Please try again.'
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
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">
            Join India's most trusted construction marketplace
          </p>
        </div>

        <div className="auth-card">
          <form onSubmit={handleSubmit} className="auth-form">
            {/* Personal Information */}
            <div className="form-section">
              <h3>👤 Personal Information</h3>
              
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <div className="input-wrapper">
                  <span className="input-icon"></span>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    className={`form-control ${errors.name ? 'error' : ''}`}
                    disabled={isSubmitting}
                  />
                </div>
                {errors.name && (
                  <span className="error-message">⚠️ {errors.name}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div className="input-wrapper">
                  <span className="input-icon"></span>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email address"
                    className={`form-control ${errors.email ? 'error' : ''}`}
                    disabled={isSubmitting}
                  />
                </div>
                {errors.email && (
                  <span className="error-message">⚠️ {errors.email}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <div className="input-wrapper">
                  <span className="input-icon"></span>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    placeholder="Enter 10-digit phone number"
                    className={`form-control ${errors.phoneNumber ? 'error' : ''}`}
                    disabled={isSubmitting}
                    maxLength="10"
                  />
                </div>
                {errors.phoneNumber && (
                  <span className="error-message">⚠️ {errors.phoneNumber}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Customer Type</label>
                <div className="input-wrapper">
                  <span className="input-icon"></span>
                  <select
                    name="customerType"
                    value={formData.customerType}
                    onChange={handleInputChange}
                    className="form-control"
                    disabled={isSubmitting}
                  >
                    <option value="house_owner">House Owner</option>
                    <option value="mason">Mason</option>
                    <option value="builder_contractor">Builder/Contractor</option>
                    <option value="others">Others</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Security Information */}
            <div className="form-section">
              <h3>🔒 Security Information</h3>
              
              <div className="form-group">
                <label className="form-label">Password</label>
                <div className="input-wrapper">
                  <span className="input-icon"></span>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Create a password (min 6 characters)"
                    className={`form-control ${errors.password ? 'error' : ''}`}
                    disabled={isSubmitting}
                  />
                </div>
                {errors.password && (
                  <span className="error-message">⚠️ {errors.password}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <div className="input-wrapper">
                  <span className="input-icon"></span>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm your password"
                    className={`form-control ${errors.confirmPassword ? 'error' : ''}`}
                    disabled={isSubmitting}
                  />
                </div>
                {errors.confirmPassword && (
                  <span className="error-message">⚠️ {errors.confirmPassword}</span>
                )}
              </div>
            </div>

            {/* Address Information */}
            <div className="form-section">
              <h3>📍 Address Information</h3>
              
              <div className="form-group">
                <label className="form-label">Address</label>
                <div className="input-wrapper">
                  <span className="input-icon"></span>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Enter your full address"
                    className={`form-control ${errors.address ? 'error' : ''}`}
                    disabled={isSubmitting}
                  />
                </div>
                {errors.address && (
                  <span className="error-message">⚠️ {errors.address}</span>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">City</label>
                  <div className="input-wrapper">
                    <span className="input-icon"></span>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="City"
                      className={`form-control ${errors.city ? 'error' : ''}`}
                      disabled={isSubmitting}
                    />
                  </div>
                  {errors.city && (
                    <span className="error-message">⚠️ {errors.city}</span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">State</label>
                  <div className="input-wrapper">
                    <span className="input-icon"></span>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      placeholder="State"
                      className={`form-control ${errors.state ? 'error' : ''}`}
                      disabled={isSubmitting}
                    />
                  </div>
                  {errors.state && (
                    <span className="error-message">⚠️ {errors.state}</span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Pincode</label>
                  <div className="input-wrapper">
                    <span className="input-icon"></span>
                    <input
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleInputChange}
                      placeholder="Pincode"
                      className={`form-control ${errors.pincode ? 'error' : ''}`}
                      disabled={isSubmitting}
                      maxLength="6"
                    />
                  </div>
                  {errors.pincode && (
                    <span className="error-message">⚠️ {errors.pincode}</span>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">GST Number (Optional)</label>
                <div className="input-wrapper">
                  <span className="input-icon"></span>
                  <input
                    type="text"
                    name="gstNumber"
                    value={formData.gstNumber}
                    onChange={handleInputChange}
                    placeholder="Enter GST number (optional)"
                    className="form-control"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
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
                  Creating Account...
                </>
              ) : (
                <>
                  🚀 Create Account
                </>
              )}
            </button>
          </form>

          {/* Sign In Link */}
          <div className="auth-footer">
            <p>
              Already have an account?{' '}
              <Link to="/auth/login" className="auth-link">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage