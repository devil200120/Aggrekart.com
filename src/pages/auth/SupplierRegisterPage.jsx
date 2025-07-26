import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supplierAPI } from '../../services/api'
import toast from 'react-hot-toast'
import './AuthPages.css'

const SupplierRegisterPage = () => {
  const navigate = useNavigate()
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    // Business Information
    businessName: '',
    businessType: 'manufacturer',
    gstNumber: '',
    panNumber: '',
    businessRegistrationNumber: '',
    
    // Contact Information
    contactPersonName: '',
    email: '',
    phoneNumber: '',
    alternatePhone: '',
    
    // Business Address
    businessAddress: '',
    city: '',
    state: '',
    pincode: '',
    
    // Account Information
    password: '',
    confirmPassword: '',
    
    // Product Categories
    productCategories: [],
    
    // Business Details
    yearEstablished: '',
    numberOfEmployees: '',
    annualTurnover: '',
    
    // Banking Information
    bankAccountNumber: '',
    bankName: '',
    ifscCode: '',
    accountHolderName: '',
    
    // Agreements
    agreeToTerms: false,
    agreeToCommission: false
  })
  const [errors, setErrors] = useState({})

  const businessTypes = [
    { value: 'manufacturer', label: 'Manufacturer' },
    { value: 'distributor', label: 'Distributor' },
    { value: 'wholesaler', label: 'Wholesaler' },
    { value: 'retailer', label: 'Retailer' },
    { value: 'contractor', label: 'Contractor' },
    { value: 'supplier', label: 'Supplier' }
  ]

  const productCategoriesOptions = [
    'aggregate', 'sand', 'tmt_steel', 'bricks_blocks', 'cement'
  ]

  const employeeRanges = [
    { value: '1-10', label: '1-10 employees' },
    { value: '11-50', label: '11-50 employees' },
    { value: '51-200', label: '51-200 employees' },
    { value: '201-500', label: '201-500 employees' },
    { value: '500+', label: '500+ employees' }
  ]

  const turnoverRanges = [
    { value: 'under-1cr', label: 'Under ₹1 Crore' },
    { value: '1-5cr', label: '₹1-5 Crores' },
    { value: '5-10cr', label: '₹5-10 Crores' },
    { value: '10-25cr', label: '₹10-25 Crores' },
    { value: '25cr+', label: '₹25+ Crores' }
  ]

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  // Handle product categories selection
  const handleCategoryChange = (category) => {
    setFormData(prev => ({
      ...prev,
      productCategories: prev.productCategories.includes(category)
        ? prev.productCategories.filter(cat => cat !== category)
        : [...prev.productCategories, category]
    }))
  }

  // Validate form
  const validateForm = () => {
    const newErrors = {}

    // Business Information
    if (!formData.businessName.trim()) {
      newErrors.businessName = 'Business name is required'
    }

    if (!formData.gstNumber.trim()) {
      newErrors.gstNumber = 'GST number is required'
    } else if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(formData.gstNumber)) {
      newErrors.gstNumber = 'Please enter a valid GST number'
    }

    if (!formData.panNumber.trim()) {
      newErrors.panNumber = 'PAN number is required'
    } else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panNumber)) {
      newErrors.panNumber = 'Please enter a valid PAN number'
    }

    // Contact Information
    if (!formData.contactPersonName.trim()) {
      newErrors.contactPersonName = 'Contact person name is required'
    }

    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!formData.phoneNumber) {
      newErrors.phoneNumber = 'Phone number is required'
    } else if (!/^[6-9]\d{9}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid 10-digit phone number'
    }

    // Address
    if (!formData.businessAddress.trim()) {
      newErrors.businessAddress = 'Business address is required'
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required'
    }

    if (!formData.state.trim()) {
      newErrors.state = 'State is required'
    }

    if (!formData.pincode) {
      newErrors.pincode = 'Pincode is required'
    } else if (!/^[1-9][0-9]{5}$/.test(formData.pincode)) {
      newErrors.pincode = 'Please enter a valid 6-digit pincode'
    }

    // Password
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    // Product Categories
    if (formData.productCategories.length === 0) {
      newErrors.productCategories = 'Please select at least one product category'
    }

    // Banking Information
    if (!formData.bankAccountNumber.trim()) {
      newErrors.bankAccountNumber = 'Bank account number is required'
    }

    if (!formData.bankName.trim()) {
      newErrors.bankName = 'Bank name is required'
    }

    if (!formData.ifscCode.trim()) {
      newErrors.ifscCode = 'IFSC code is required'
    } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.ifscCode)) {
      newErrors.ifscCode = 'Please enter a valid IFSC code'
    }

    if (!formData.accountHolderName.trim()) {
      newErrors.accountHolderName = 'Account holder name is required'
    }

    // Agreements
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms and conditions'
    }

    if (!formData.agreeToCommission) {
      newErrors.agreeToCommission = 'You must agree to the commission structure'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Update the handleSubmit function around line 217

const handleSubmit = async (e) => {
  e.preventDefault()
  
  if (!validateForm()) {
    return
  }

  setIsSubmitting(true)
  
  try {
   // Replace the registrationData object in handleSubmit (around line 225):

    // Replace the registrationData object in handleSubmit function (around line 225):

    const registrationData = {
      // User fields (exact match to backend validation)
      email: formData.email.toLowerCase().trim(),
      phoneNumber: formData.phoneNumber,
      password: formData.password,
      contactPersonName: formData.contactPersonName.trim(),
      
      // Supplier fields (exact match to backend validation)
      businessName: formData.businessName.trim(),
      gstNumber: formData.gstNumber.trim().toUpperCase(),
      panNumber: formData.panNumber?.trim().toUpperCase() || '', // Fix: Handle empty PAN
      businessAddress: formData.businessAddress.trim(),
      city: formData.city.trim(),
      state: formData.state.trim(),
      pincode: formData.pincode,
      
      // Optional fields with proper defaults
      productCategories: formData.productCategories || [],
      yearEstablished: formData.yearEstablished ? parseInt(formData.yearEstablished) : new Date().getFullYear(),
      numberOfEmployees: formData.numberOfEmployees || '1-10',
      annualTurnover: formData.annualTurnover || 'under-1cr',
      
      // Bank details structure (EXACT match to backend expectation)
      bankDetails: {
        bankName: formData.bankName.trim(),
        accountNumber: formData.bankAccountNumber.trim(), // Fix: frontend uses bankAccountNumber, backend expects accountNumber
        ifscCode: formData.ifscCode.trim().toUpperCase(),
        accountHolderName: formData.accountHolderName.trim(),
        branchName: 'Main Branch', // Add required field
        upiId: '' // Add optional field
      }
    }
    console.log('Sending supplier registration data:', registrationData)

    const result = await supplierAPI.register(registrationData)
    console.log('Registration result:', result)

        if (result.success) {
      toast.success('Supplier registration successful! Your application is under review.')
      
      // Show verification codes in development
      if (result.data?.dev_otps) {
        console.log('Verification codes:', result.data.dev_otps)
        toast.success(`Development - Phone OTP: ${result.data.dev_otps.phoneOTP}, Email OTP: ${result.data.dev_otps.emailOTP}`, {
          duration: 10000
        })
      }
      
      // Navigate to phone verification
      navigate('/auth/verify-phone', { 
        state: { 
          phoneNumber: formData.phoneNumber,
          email: formData.email,
          userType: 'supplier',
          message: 'Please verify your phone number to complete supplier registration.',
          devOtps: result.data?.dev_otps,
          redirectAfterVerification: '/auth/supplier-dashboard'
        } 
      }
    )
    
    
    } else {
      toast.error(result.message || 'Registration failed. Please try again.')
      setErrors({
        submit: result.message || 'Registration failed. Please try again.'
      })
    }
  } catch (error) {
    console.error('Supplier registration error:', error)
    
    if (error.response?.status === 401) {
      toast.error('Authentication error. Please try again.')
    } else if (error.response?.status === 400) {
      const errorMessage = error.response?.data?.message || 'Validation failed'
      toast.error(errorMessage)
      
      // Handle validation errors
      if (error.response?.data?.errors) {
        const validationErrors = {}
        error.response.data.errors.forEach(err => {
          const field = err.path || err.param || 'submit'
          validationErrors[field] = err.message
        })
        setErrors(validationErrors)
      } else {
        setErrors({ submit: errorMessage })
      }
    } else {
      const errorMessage = error?.response?.data?.message || 'An error occurred during registration. Please try again.'
      toast.error(errorMessage)
      setErrors({ submit: errorMessage })
    }
  } finally {
    setIsSubmitting(false)
  }
}

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <Link to="/" className="auth-logo">
            <span className="logo-icon">🏗️</span>
            <span className="logo-text">Aggrekart</span>
          </Link>
          <h1 className="auth-title">Become a Supplier</h1>
          <p className="auth-subtitle">
            Join India's most trusted construction marketplace and grow your business
          </p>
        </div>

        <div className="auth-card supplier-register-card">
          <form onSubmit={handleSubmit} className="auth-form supplier-form">
            
            {/* Business Information */}
            <div className="form-section">
              <h3>🏢 Business Information</h3>
              
              <div className="form-group">
                <label>Business Name *</label>
                <input
                  type="text"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleInputChange}
                  placeholder="Enter your business name"
                  className={errors.businessName ? 'error' : ''}
                />
                {errors.businessName && <span className="error-text">{errors.businessName}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Business Type *</label>
                  <select
                    name="businessType"
                    value={formData.businessType}
                    onChange={handleInputChange}
                  >
                    {businessTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Year Established</label>
                  <input
                    type="number"
                    name="yearEstablished"
                    value={formData.yearEstablished}
                    onChange={handleInputChange}
                    placeholder="e.g., 2010"
                    min="1900"
                    max="2025"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>GST Number *</label>
                  <input
                    type="text"
                    name="gstNumber"
                    value={formData.gstNumber}
                    onChange={handleInputChange}
                    placeholder="22AAAAA0000A1Z5"
                    className={errors.gstNumber ? 'error' : ''}
                  />
                  {errors.gstNumber && <span className="error-text">{errors.gstNumber}</span>}
                </div>

                <div className="form-group">
                  <label>PAN Number *</label>
                  <input
                    type="text"
                    name="panNumber"
                    value={formData.panNumber}
                    onChange={handleInputChange}
                    placeholder="ABCDE1234F"
                    className={errors.panNumber ? 'error' : ''}
                  />
                  {errors.panNumber && <span className="error-text">{errors.panNumber}</span>}
                </div>
              </div>

              <div className="form-group">
                <label>Business Registration Number</label>
                <input
                  type="text"
                  name="businessRegistrationNumber"
                  value={formData.businessRegistrationNumber}
                  onChange={handleInputChange}
                  placeholder="Enter registration number (if applicable)"
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className="form-section">
              <h3>👤 Contact Information</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Contact Person Name *</label>
                  <input
                    type="text"
                    name="contactPersonName"
                    value={formData.contactPersonName}
                    onChange={handleInputChange}
                    placeholder="Full name of contact person"
                    className={errors.contactPersonName ? 'error' : ''}
                  />
                  {errors.contactPersonName && <span className="error-text">{errors.contactPersonName}</span>}
                </div>

                <div className="form-group">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="business@example.com"
                    className={errors.email ? 'error' : ''}
                  />
                  {errors.email && <span className="error-text">{errors.email}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Phone Number *</label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    placeholder="10-digit mobile number"
                    className={errors.phoneNumber ? 'error' : ''}
                  />
                  {errors.phoneNumber && <span className="error-text">{errors.phoneNumber}</span>}
                </div>

                <div className="form-group">
                  <label>Alternate Phone</label>
                  <input
                    type="tel"
                    name="alternatePhone"
                    value={formData.alternatePhone}
                    onChange={handleInputChange}
                    placeholder="Alternate contact number"
                  />
                </div>
              </div>
            </div>

            {/* Business Address */}
            <div className="form-section">
              <h3>📍 Business Address</h3>
              
              <div className="form-group">
                <label>Business Address *</label>
                <textarea
                  name="businessAddress"
                  value={formData.businessAddress}
                  onChange={handleInputChange}
                  placeholder="Complete business address"
                  rows="3"
                  className={errors.businessAddress ? 'error' : ''}
                />
                {errors.businessAddress && <span className="error-text">{errors.businessAddress}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>City *</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="City"
                    className={errors.city ? 'error' : ''}
                  />
                  {errors.city && <span className="error-text">{errors.city}</span>}
                </div>

                <div className="form-group">
                  <label>State *</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    placeholder="State"
                    className={errors.state ? 'error' : ''}
                  />
                  {errors.state && <span className="error-text">{errors.state}</span>}
                </div>

                <div className="form-group">
                  <label>Pincode *</label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    placeholder="6-digit pincode"
                    className={errors.pincode ? 'error' : ''}
                  />
                  {errors.pincode && <span className="error-text">{errors.pincode}</span>}
                </div>
              </div>
            </div>

            {/* Product Categories */}
            <div className="form-section">
              <h3>📦 Product Categories</h3>
              <p className="section-description">Select the categories of products you supply</p>
              
              <div className="checkbox-grid">
                {productCategoriesOptions.map(category => (
                  <label key={category} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.productCategories.includes(category)}
                      onChange={() => handleCategoryChange(category)}
                    />
                    <span className="checkbox-text">
                      {category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </label>
                ))}
              </div>
              {errors.productCategories && <span className="error-text">{errors.productCategories}</span>}
            </div>

            {/* Business Details */}
            <div className="form-section">
              <h3>📊 Business Details</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Number of Employees</label>
                  <select
                    name="numberOfEmployees"
                    value={formData.numberOfEmployees}
                    onChange={handleInputChange}
                  >
                    <option value="">Select range</option>
                    {employeeRanges.map(range => (
                      <option key={range.value} value={range.value}>
                        {range.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Annual Turnover</label>
                  <select
                    name="annualTurnover"
                    value={formData.annualTurnover}
                    onChange={handleInputChange}
                  >
                    <option value="">Select range</option>
                    {turnoverRanges.map(range => (
                      <option key={range.value} value={range.value}>
                        {range.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Banking Information */}
            <div className="form-section">
              <h3>🏦 Banking Information</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Bank Account Number *</label>
                  <input
                    type="text"
                    name="bankAccountNumber"
                    value={formData.bankAccountNumber}
                    onChange={handleInputChange}
                    placeholder="Bank account number"
                    className={errors.bankAccountNumber ? 'error' : ''}
                  />
                  {errors.bankAccountNumber && <span className="error-text">{errors.bankAccountNumber}</span>}
                </div>

                <div className="form-group">
                  <label>Bank Name *</label>
                  <input
                    type="text"
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleInputChange}
                    placeholder="Name of the bank"
                    className={errors.bankName ? 'error' : ''}
                  />
                  {errors.bankName && <span className="error-text">{errors.bankName}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>IFSC Code *</label>
                  <input
                    type="text"
                    name="ifscCode"
                    value={formData.ifscCode}
                    onChange={handleInputChange}
                    placeholder="ABCD0123456"
                    className={errors.ifscCode ? 'error' : ''}
                  />
                  {errors.ifscCode && <span className="error-text">{errors.ifscCode}</span>}
                </div>

                <div className="form-group">
                  <label>Account Holder Name *</label>
                  <input
                    type="text"
                    name="accountHolderName"
                    value={formData.accountHolderName}
                    onChange={handleInputChange}
                    placeholder="Name as per bank records"
                    className={errors.accountHolderName ? 'error' : ''}
                  />
                  {errors.accountHolderName && <span className="error-text">{errors.accountHolderName}</span>}
                </div>
              </div>
            </div>

            {/* Account Information */}
            <div className="form-section">
              <h3>🔒 Account Security</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Password *</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Create a strong password"
                    className={errors.password ? 'error' : ''}
                  />
                  {errors.password && <span className="error-text">{errors.password}</span>}
                </div>

                <div className="form-group">
                  <label>Confirm Password *</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm your password"
                    className={errors.confirmPassword ? 'error' : ''}
                  />
                  {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
                </div>
              </div>
            </div>

            {/* Terms and Agreements */}
            <div className="form-section">
              <h3>📋 Terms & Agreements</h3>
              
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="agreeToTerms"
                    checked={formData.agreeToTerms}
                    onChange={handleInputChange}
                    className={errors.agreeToTerms ? 'error' : ''}
                  />
                  <span className="checkbox-text">
                    I agree to the <Link to="/terms" target="_blank">Terms and Conditions</Link> and <Link to="/privacy" target="_blank">Privacy Policy</Link> *
                  </span>
                </label>
                {errors.agreeToTerms && <span className="error-text">{errors.agreeToTerms}</span>}

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="agreeToCommission"
                    checked={formData.agreeToCommission}
                    onChange={handleInputChange}
                    className={errors.agreeToCommission ? 'error' : ''}
                  />
                  <span className="checkbox-text">
                    I agree to the commission structure and payment terms *
                  </span>
                </label>
                {errors.agreeToCommission && <span className="error-text">{errors.agreeToCommission}</span>}
              </div>
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="error-message">
                {errors.submit}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary btn-full"
            >
              {isSubmitting ? (
                <>
                  <span className="spinner"></span>
                  Submitting Application...
                </>
              ) : (
                'Submit Supplier Application'
              )}
            </button>

            <div className="auth-footer">
              <p>
                Already have a supplier account?{' '}
                <Link to="/auth/login" className="auth-link">
                  Login here
                </Link>
              </p>
              <p>
                Want to register as a customer?{' '}
                <Link to="/auth/register" className="auth-link">
                  Customer Registration
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default SupplierRegisterPage
