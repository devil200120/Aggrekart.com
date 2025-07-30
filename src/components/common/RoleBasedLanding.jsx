import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import HomePage from '../../pages/Homepage'

const RoleBasedLanding = () => {
  const { user, loading, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    // Wait for auth loading to complete
    if (loading) return

    // If user is authenticated, redirect based on role
    if (isAuthenticated && user) {
      switch (user.role) {
        case 'admin':
          navigate('/admin/dashboard', { replace: true })
          return
        case 'supplier':
          navigate('/supplier/dashboard', { replace: true })
          return
        case 'customer':
          // Customers can see the home page, so do nothing
          break
        default:
          // Unknown role, treat as customer
          break
      }
    }
  }, [user, loading, isAuthenticated, navigate])

  // Show loading while checking authentication
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '60vh' 
      }}>
        <div>Loading...</div>
      </div>
    )
  }

  // If not authenticated or is a customer, show the home page
  if (!isAuthenticated || (user && user.role === 'customer')) {
    return <HomePage />
  }

  // This should not be reached due to the useEffect redirect above
  return null
}

export default RoleBasedLanding