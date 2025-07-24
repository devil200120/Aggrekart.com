import React, { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../services/api'
import Cookies from 'js-cookie'
import toast from 'react-hot-toast'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Check authentication status on mount
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const token = Cookies.get('aggrekart_token')
      if (token) {
        const response = await authAPI.getMe()
        if (response.success) {
          setUser(response.data.user)
          setIsAuthenticated(true)
        } else {
          // Invalid token, remove it
          Cookies.remove('aggrekart_token')
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      Cookies.remove('aggrekart_token')
    } finally {
      setLoading(false)
    }
  }

  const login = async (credentials) => {
    try {
      setLoading(true)
      console.log('🔍 Attempting login...')
      
      const response = await authAPI.login(credentials)
      
      console.log('📡 Login response:', response)
      
      if (response.success) {
        // Check if verification is required
        if (response.requiresVerification) {
          console.log('🔄 Verification required')
          return { 
            success: true, 
            requiresVerification: true,
            data: response.data
          }
        }
        
        // Normal login success
        const { token, user } = response.data
        
        // Store token in cookie
        Cookies.set('aggrekart_token', token, { expires: 30 })
        
        setUser(user)
        setIsAuthenticated(true)
        toast.success('Login successful!')
        return { success: true }
      } else {
        toast.error(response.message || 'Login failed')
        return { success: false, message: response.message }
      }
    } catch (error) {
      console.error('💥 Login error:', error)
      const message = error.response?.data?.message || 'Login failed'
      toast.error(message)
      return { success: false, message }
    } finally {
      setLoading(false)
    }
  }

  const verifyPhone = async (phoneData) => {
    try {
      setLoading(true)
      const response = await authAPI.verifyPhone(phoneData)
      
      if (response.success) {
        if (response.fullyVerified) {
          // User is fully verified, log them in
          const { token, user } = response.data
          Cookies.set('aggrekart_token', token, { expires: 30 })
          setUser(user)
          setIsAuthenticated(true)
          toast.success('Account fully verified! Welcome to Aggrekart!')
          return { success: true, fullyVerified: true }
        } else {
          // Phone verified but email still needed
          toast.success('Phone verified! Please verify your email.')
          return { success: true, fullyVerified: false, nextStep: 'email_verification' }
        }
      } else {
        toast.error(response.message || 'Phone verification failed')
        return { success: false, message: response.message }
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Phone verification failed'
      toast.error(message)
      return { success: false, message }
    } finally {
      setLoading(false)
    }
  }

  const verifyEmail = async (emailData) => {
    try {
      setLoading(true)
      const response = await authAPI.verifyEmail(emailData)
      
      if (response.success) {
        if (response.fullyVerified) {
          // User is fully verified, log them in
          const { token, user } = response.data
          Cookies.set('aggrekart_token', token, { expires: 30 })
          setUser(user)
          setIsAuthenticated(true)
          toast.success('Account fully verified! Welcome to Aggrekart!')
          return { success: true, fullyVerified: true }
        } else {
          // Email verified but phone still needed
          toast.success('Email verified! Please verify your phone.')
          return { success: true, fullyVerified: false, nextStep: 'phone_verification' }
        }
      } else {
        toast.error(response.message || 'Email verification failed')
        return { success: false, message: response.message }
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Email verification failed'
      toast.error(message)
      return { success: false, message }
    } finally {
      setLoading(false)
    }
  }

  const register = async (userData) => {
    try {
      setLoading(true)
      const response = await authAPI.register(userData)
      
      if (response.success) {
        toast.success('Registration successful! Please verify your phone number and email.')
        return { success: true, data: response.data }
      } else {
        toast.error(response.message || 'Registration failed')
        return { success: false, message: response.message }
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed'
      toast.error(message)
      return { success: false, message }
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await authAPI.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Clear local state regardless of API call result
      Cookies.remove('aggrekart_token')
      setUser(null)
      setIsAuthenticated(false)
      toast.success('Logged out successfully')
    }
  }

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    checkAuth,
    verifyPhone,
    verifyEmail
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}