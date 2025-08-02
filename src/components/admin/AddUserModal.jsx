import React, { useState } from 'react'
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  Lock, 
  UserCheck, 
  Calendar,
  MapPin,
  Eye,
  EyeOff,
  Users
} from 'lucide-react'
import { useMutation, useQueryClient } from 'react-query'
import { adminAPI } from '../../services/api'
import toast from 'react-hot-toast'
import './AddUserModal.css'

const AddUserModal = ({ isOpen, onClose, onUserCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    role: 'customer',
    customerType: 'others',
    isActive: true,
    isPhoneVerified: false,
    isEmailVerified: false,
    dateOfBirth: '',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: ''
    }
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const queryClient = useQueryClient()

  const createUserMutation = useMutation(
    (userData) => adminAPI.createUser(userData),
    {
      onSuccess: (response) => {
        toast.success('User created successfully! 🎉')
        queryClient.invalidateQueries('admin-users')
        if (onUserCreated) onUserCreated(response.data.user)
        handleClose()
      },
      onError: (error) => {
        console.error('User creation error:', error)
        const message = error.response?.data?.message || 'Failed to create user'
        toast.error(message)
        
        // Handle validation errors
        if (error.response?.data?.errors) {
          const validationErrors = {}
          error.response.data.errors.forEach(err => {
            validationErrors[err.param] = err.msg
          })
          setErrors(validationErrors)
        }
      }
    }
  )

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1]
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }))
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) newErrors.name = 'Name is required'
    if (!formData.email.trim()) newErrors.email = 'Email is required'
    if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email format'
    if (!formData.password) newErrors.password = 'Password is required'
    if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters'
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    
    // Phone number is optional, but if provided, validate it
    if (formData.phoneNumber && !/^[6-9]\d{9}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Invalid Indian phone number (10 digits starting with 6-9)'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('Please fix the errors below')
      return
    }

    // Prepare data for API
    const userData = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      password: formData.password,
      role: formData.role,
      phoneNumber: formData.phoneNumber || undefined, // Send undefined if empty
      isActive: formData.isActive,
      isPhoneVerified: formData.isPhoneVerified,
      isEmailVerified: formData.isEmailVerified,
      dateOfBirth: formData.dateOfBirth || undefined,
      customerType: formData.role === 'customer' ? formData.customerType : undefined,
      address: formData.address.street ? formData.address : undefined
    }

    createUserMutation.mutate(userData)
  }

  const handleClose = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      phoneNumber: '',
      role: 'customer',
      customerType: 'others',
      isActive: true,
      isPhoneVerified: false,
      isEmailVerified: false,
      dateOfBirth: '',
      address: {
        street: '',
        city: '',
        state: '',
        pincode: ''
      }
    })
    setErrors({})
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="add-user-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            <div className="title-icon">
              <User size={24} />
            </div>
            <div>
              <h2>Add New User</h2>
              <p>Create a new user account for the platform</p>
            </div>
          </div>
          <button 
            className="close-button"
            onClick={handleClose}
            disabled={createUserMutation.isLoading}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-sections">
            {/* Basic Information */}
            <div className="form-section">
              <h3>📋 Basic Information</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">
                    <User size={16} />
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter full name"
                    className={errors.name ? 'error' : ''}
                    disabled={createUserMutation.isLoading}
                  />
                  {errors.name && <span className="error-text">{errors.name}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="role">
                    <UserCheck size={16} />
                    Role *
                  </label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    disabled={createUserMutation.isLoading}
                  >
                    <option value="customer">Customer</option>
                    <option value="supplier">Supplier</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              {/* Customer Type - only show for customers */}
              {formData.role === 'customer' && (
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="customerType">
                      <Users size={16} />
                      Customer Type
                    </label>
                    <select
                      id="customerType"
                      name="customerType"
                      value={formData.customerType}
                      onChange={handleInputChange}
                      disabled={createUserMutation.isLoading}
                    >
                      <option value="house_owner">House Owner</option>
                      <option value="mason">Mason</option>
                      <option value="builder_contractor">Builder/Contractor</option>
                      <option value="others">Others</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="email">
                    <Mail size={16} />
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter email address"
                    className={errors.email ? 'error' : ''}
                    disabled={createUserMutation.isLoading}
                  />
                  {errors.email && <span className="error-text">{errors.email}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="phoneNumber">
                    <Phone size={16} />
                    Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    placeholder="Enter 10-digit phone number (optional)"
                    className={errors.phoneNumber ? 'error' : ''}
                    disabled={createUserMutation.isLoading}
                  />
                  {errors.phoneNumber && <span className="error-text">{errors.phoneNumber}</span>}
                  <small className="help-text">
                    If not provided, a phone number will be auto-generated
                  </small>
                </div>
              </div>
            </div>

            {/* Security */}
            <div className="form-section">
              <h3>🔐 Security</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="password">
                    <Lock size={16} />
                    Password *
                  </label>
                  <div className="password-input">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Enter password (min 6 characters)"
                      className={errors.password ? 'error' : ''}
                      disabled={createUserMutation.isLoading}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && <span className="error-text">{errors.password}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">
                    <Lock size={16} />
                    Confirm Password *
                  </label>
                  <div className="password-input">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Confirm password"
                      className={errors.confirmPassword ? 'error' : ''}
                      disabled={createUserMutation.isLoading}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="form-section">
              <h3>📝 Additional Information</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="dateOfBirth">
                    <Calendar size={16} />
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    id="dateOfBirth"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    disabled={createUserMutation.isLoading}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="address.street">
                    <MapPin size={16} />
                    Address (Optional)
                  </label>
                  <input
                    type="text"
                    id="address.street"
                    name="address.street"
                    value={formData.address.street}
                    onChange={handleInputChange}
                    placeholder="Street address"
                    disabled={createUserMutation.isLoading}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <input
                    type="text"
                    name="address.city"
                    value={formData.address.city}
                    onChange={handleInputChange}
                    placeholder="City"
                    disabled={createUserMutation.isLoading}
                  />
                </div>
                <div className="form-group">
                  <input
                    type="text"
                    name="address.state"
                    value={formData.address.state}
                    onChange={handleInputChange}
                    placeholder="State"
                    disabled={createUserMutation.isLoading}
                  />
                </div>
                <div className="form-group">
                  <input
                    type="text"
                    name="address.pincode"
                    value={formData.address.pincode}
                    onChange={handleInputChange}
                    placeholder="Pincode"
                    disabled={createUserMutation.isLoading}
                  />
                </div>
              </div>
            </div>

            {/* Account Settings */}
            <div className="form-section">
              <h3>⚙️ Account Settings</h3>
              
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    disabled={createUserMutation.isLoading}
                  />
                  <span className="checkmark"></span>
                  Account Active
                </label>

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="isEmailVerified"
                    checked={formData.isEmailVerified}
                    onChange={handleInputChange}
                    disabled={createUserMutation.isLoading}
                  />
                  <span className="checkmark"></span>
                  Email Verified
                </label>

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="isPhoneVerified"
                    checked={formData.isPhoneVerified}
                    onChange={handleInputChange}
                    disabled={createUserMutation.isLoading}
                  />
                  <span className="checkmark"></span>
                  Phone Verified
                </label>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClose}
              disabled={createUserMutation.isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={createUserMutation.isLoading}
            >
              {createUserMutation.isLoading ? (
                <>
                  <div className="loading-spinner"></div>
                  Creating User...
                </>
              ) : (
                <>
                  <User size={16} />
                  Create User
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddUserModal