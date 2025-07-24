import React from 'react'
import './LoadingSpinner.css'

const LoadingSpinner = ({ 
  size = 'medium', 
  color = 'primary', 
  text = '', 
  overlay = false,
  className = '' 
}) => {
  const sizeClass = `spinner-${size}`
  const colorClass = `spinner-${color}`
  
  const spinner = (
    <div className={`loading-spinner ${sizeClass} ${colorClass} ${className}`}>
      <div className="spinner-ring">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
      {text && <p className="spinner-text">{text}</p>}
    </div>
  )

  if (overlay) {
    return (
      <div className="spinner-overlay">
        {spinner}
      </div>
    )
  }

  return spinner
}

export default LoadingSpinner