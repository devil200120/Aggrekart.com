import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@context/AuthContext'

const ProtectedRoute = ({ children, roles = [] }) => {
  const { isAuthenticated, user, loading } = useAuth()
  const location = useLocation()

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '50vh' 
      }}>
        <div className="spinner"></div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Check if user has required role
  if (roles.length > 0 && !roles.includes(user?.role)) {
    return (
      <div className="container" style={{ padding: '2rem 0', textAlign: 'center' }}>
        <h1>Access Denied</h1>
        <p>You don't have permission to access this page.</p>
        <button 
          className="btn btn-primary"
          onClick={() => window.history.back()}
        >
          Go Back
        </button>
      </div>
    )
  }

  return children
}

export default ProtectedRoute