import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation } from 'react-query'
import toast from 'react-hot-toast'
import { authAPI } from '../../services/api'
import './AuthPages.css'

const ForgotPasswordPage = () => {
  const [formData, setFormData] = useState({
    identifier: ''
  })
  const [step, setStep] = useState('request') // 'request', 'verify', 'reset'
  const [resetData, setResetData] = useState({
    otp: '',
    newPassword: '',
    confirmPassword: ''
  })

  // Mutation for sending forgot password request
  const forgotPasswordMutation = useMutation(
    authAPI.forgotPassword,
    {
      onSuccess: (data) => {
        toast.success('OTP sent successfully! Check your email/SMS.')
        setStep('verify')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to send reset OTP')
      }
    }
  )

  // Mutation for resetting password with OTP
  const resetPasswordMutation = useMutation(
    authAPI.resetPassword,
    {
      onSuccess: (data) => {
        toast.success('Password reset successfully! Please login with your new password.')
        setStep('success')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to reset password')
      }
    }
  )

  const handleRequestSubmit = (e) => {
    e.preventDefault()
    if (!formData.identifier.trim()) {
      toast.error('Please enter your email or phone number')
      return
    }
    forgotPasswordMutation.mutate(formData)
  }

  const handleResetSubmit = (e) => {
    e.preventDefault()
    
    if (!resetData.otp.trim()) {
      toast.error('Please enter the OTP')
      return
    }
    
    if (!resetData.newPassword) {
      toast.error('Please enter a new password')
      return
    }
    
    if (resetData.newPassword !== resetData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (resetData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long')
      return
    }

    resetPasswordMutation.mutate({
      identifier: formData.identifier,
      otp: resetData.otp,
      newPassword: resetData.newPassword
    })
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleResetInputChange = (e) => {
    const { name, value } = e.target
    setResetData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  if (step === 'success') {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>Password Reset Successful</h1>
            <p>Your password has been reset successfully!</p>
          </div>
          
          <div className="success-message">
            <div className="success-icon">✓</div>
            <p>You can now login with your new password.</p>
          </div>
          
          <div className="auth-footer">
            <Link to="/auth/login" className="btn btn-primary">
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>
            {step === 'request' ? 'Forgot Password' : 'Reset Password'}
          </h1>
          <p>
            {step === 'request' 
              ? 'Enter your email or phone number to receive a reset OTP'
              : 'Enter the OTP sent to your email/phone and your new password'
            }
          </p>
        </div>

        {step === 'request' ? (
          <form onSubmit={handleRequestSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="identifier">Email or Phone Number</label>
              <input
                type="text"
                id="identifier"
                name="identifier"
                value={formData.identifier}
                onChange={handleInputChange}
                placeholder="Enter your email or phone number"
                required
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary btn-full"
              disabled={forgotPasswordMutation.isLoading}
            >
              {forgotPasswordMutation.isLoading ? 'Sending...' : 'Send Reset OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="otp">Reset OTP</label>
              <input
                type="text"
                id="otp"
                name="otp"
                value={resetData.otp}
                onChange={handleResetInputChange}
                placeholder="Enter 6-digit OTP"
                maxLength="6"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={resetData.newPassword}
                onChange={handleResetInputChange}
                placeholder="Enter new password"
                minLength="6"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={resetData.confirmPassword}
                onChange={handleResetInputChange}
                placeholder="Confirm new password"
                minLength="6"
                required
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary btn-full"
              disabled={resetPasswordMutation.isLoading}
            >
              {resetPasswordMutation.isLoading ? 'Resetting...' : 'Reset Password'}
            </button>

            <button 
              type="button" 
              className="btn btn-secondary btn-full"
              onClick={() => setStep('request')}
              disabled={resetPasswordMutation.isLoading}
            >
              Back to Request OTP
            </button>
          </form>
        )}

        <div className="auth-footer">
          <p>
            Remember your password?{' '}
            <Link to="/auth/login" className="auth-link">
              Back to Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default ForgotPasswordPage