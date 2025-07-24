import React, { useState, useEffect } from 'react'
import './ErrorMessage.css'

const ErrorMessage = ({ 
  message, 
  type = 'error',
  dismissible = false,
  onDismiss,
  className = '',
  icon = true,
  actions = [],
  autoHide = false,
  autoHideDelay = 5000
}) => {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (autoHide && autoHideDelay > 0) {
      const timer = setTimeout(() => {
        handleDismiss()
      }, autoHideDelay)

      return () => clearTimeout(timer)
    }
  }, [autoHide, autoHideDelay])

  const handleDismiss = () => {
    setIsVisible(false)
    if (onDismiss) {
      setTimeout(onDismiss, 300) // Wait for animation
    }
  }

  if (!message || !isVisible) return null

  const typeConfig = {
    error: {
      icon: '⚠️',
      bgColor: '#fef2f2',
      borderColor: '#fecaca',
      textColor: '#dc2626',
      darkBg: '#1f1f1f',
      darkBorder: '#dc2626',
      darkText: '#f87171'
    },
    warning: {
      icon: '⚠️',
      bgColor: '#fffbeb',
      borderColor: '#fed7aa',
      textColor: '#d97706',
      darkBg: '#1f1f1f',
      darkBorder: '#d97706',
      darkText: '#fbbf24'
    },
    info: {
      icon: 'ℹ️',
      bgColor: '#eff6ff',
      borderColor: '#bfdbfe',
      textColor: '#2563eb',
      darkBg: '#1f1f1f',
      darkBorder: '#2563eb',
      darkText: '#60a5fa'
    },
    success: {
      icon: '✅',
      bgColor: '#f0fdf4',
      borderColor: '#bbf7d0',
      textColor: '#16a34a',
      darkBg: '#1f1f1f',
      darkBorder: '#16a34a',
      darkText: '#4ade80'
    }
  }

  const config = typeConfig[type] || typeConfig.error

  return (
    <div 
      className={`error-message error-message--${type} ${className}`}
      role="alert"
      aria-live="polite"
    >
      <div className="error-message__content">
        {icon && (
          <div className="error-message__icon">
            {config.icon}
          </div>
        )}
        
        <div className="error-message__body">
          <div className="error-message__text">
            {typeof message === 'string' ? message : JSON.stringify(message)}
          </div>
          
          {actions.length > 0 && (
            <div className="error-message__actions">
              {actions.map((action, index) => (
                <button
                  key={index}
                  className={`error-message__action ${action.variant || 'primary'}`}
                  onClick={action.onClick}
                  disabled={action.disabled}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
        
        {dismissible && (
          <button
            className="error-message__dismiss"
            onClick={handleDismiss}
            aria-label="Dismiss message"
          >
            ×
          </button>
        )}
      </div>
      
      {autoHide && (
        <div 
          className="error-message__progress"
          style={{ animationDuration: `${autoHideDelay}ms` }}
        />
      )}
    </div>
  )
}

// Compound component for multiple errors
export const ErrorList = ({ errors = [], className = '', ...props }) => {
  if (!errors.length) return null

  return (
    <div className={`error-list ${className}`}>
      {errors.map((error, index) => (
        <ErrorMessage
          key={index}
          message={error.message || error}
          type={error.type || 'error'}
          {...props}
        />
      ))}
    </div>
  )
}

// Hook for error state management
export const useErrorHandler = () => {
  const [errors, setErrors] = useState([])

  const addError = (error, type = 'error') => {
    const errorObj = {
      id: Date.now() + Math.random(),
      message: error,
      type,
      timestamp: Date.now()
    }
    setErrors(prev => [...prev, errorObj])
  }

  const removeError = (id) => {
    setErrors(prev => prev.filter(error => error.id !== id))
  }

  const clearErrors = () => {
    setErrors([])
  }

  return {
    errors,
    addError,
    removeError,
    clearErrors
  }
}

export default ErrorMessage