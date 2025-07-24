import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import CartIcon from '../cart/CartIcon'
import './Navbar.css'
// Import the logo image
import logoImage from '../../image.png'

const Navbar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/')
      setIsMenuOpen(false)
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

  const isActivePage = (path) => {
    return location.pathname === path
  }

  const getAllMenuItems = () => {
    const baseItems = [
      { path: '/', label: 'Home', icon: '🏠' },
      { path: '/products', label: 'Products', icon: '📦' },
    ]

    if (user) {
      switch (user.role) {
        case 'customer':
          return [
            ...baseItems,
            { path: '/orders', label: 'My Orders', icon: '📋' },
            { path: '/profile', label: 'Profile', icon: '👤' },
            { path: '/wishlist', label: 'Wishlist', icon: '❤️' },
            { path: '/cart', label: 'Cart', icon: '🛒' },
            { path: '/settings', label: 'Settings', icon: '⚙️' },
            { type: 'divider' },
            { type: 'action', action: handleLogout, label: 'Logout', icon: '🚪', className: 'logout' }
          ]
        case 'supplier':
          return [
            ...baseItems,
            { path: '/supplier/dashboard', label: 'Dashboard', icon: '📊' },
            { path: '/supplier/products', label: 'Products', icon: '📦' },
            { path: '/supplier/orders', label: 'Orders', icon: '📋' },
            { path: '/profile', label: 'Profile', icon: '👤' },
            { path: '/settings', label: 'Settings', icon: '⚙️' },
            { type: 'divider' },
            { type: 'action', action: handleLogout, label: 'Logout', icon: '🚪', className: 'logout' }
          ]
        case 'admin':
          return [
            ...baseItems,
            { path: '/admin/dashboard', label: 'Admin Panel', icon: '🛡️' },
            { path: '/admin/users', label: 'Users', icon: '👥' },
            { path: '/admin/suppliers', label: 'Suppliers', icon: '🏪' },
            { path: '/admin/orders', label: 'Orders', icon: '📋' },
            { path: '/admin/products', label: 'Products', icon: '📦' },
            { path: '/settings', label: 'Settings', icon: '⚙️' },
            { type: 'divider' },
            { type: 'action', action: handleLogout, label: 'Logout', icon: '🚪', className: 'logout' }
          ]
        default:
          return baseItems
      }
    } else {
      return [
        ...baseItems,
        { type: 'divider' },
        { path: '/auth/login', label: 'Login', icon: '🔐' },
        { path: '/auth/whatsapp-register', label: 'Quick Register', icon: '📱', className: 'whatsapp' },
        { path: '/auth/register', label: 'Email Register', icon: '✉️' },
        { path: '/auth/supplier-register', label: 'Join as Supplier', icon: '🏪', className: 'supplier' },
      ]
    }
  }

  return (
    <nav className={`navbar ${isScrolled ? 'navbar-scrolled' : ''}`}>
      <div className="container">
        <div className="navbar-content">
          {/* Logo - Updated with image */}
          <Link to="/" className="navbar-logo" onClick={closeMenu}>
            <img 
              src={logoImage} 
              alt="Aggrekart Logo" 
              className="logo-image"
            />
            
          </Link>

          {/* Desktop Navigation - REMOVED Home and Products */}
          <div className="navbar-nav">
            {/* Only show customer orders link in desktop nav if needed */}
            
          </div>

          {/* Right Actions */}
          <div className="navbar-actions">
            {/* Cart Icon for customers */}
            {user?.role === 'customer' && <CartIcon />}

            {/* User Avatar */}
            {user && (
              <div className="user-avatar">
                {user.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            )}

            {/* Hamburger Menu Toggle */}
            <button 
              className={`hamburger-btn ${isMenuOpen ? 'active' : ''}`}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>

        {/* Hamburger Menu - KEEPS all items including Home and Products */}
        {isMenuOpen && (
          <div className="hamburger-menu">
            {/* User Info */}
            {user && (
              <div className="menu-user-info">
                <div className="user-avatar-large">
                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="user-details">
                  <h3>{user.name}</h3>
                  <p>{user.email}</p>
                  <span className="role-badge">{user.role}</span>
                </div>
              </div>
            )}

            {/* Menu Items */}
            <div className="menu-items">
              {getAllMenuItems().map((item, index) => {
                if (item.type === 'divider') {
                  return <hr key={index} className="menu-divider" />
                }
                
                if (item.type === 'action') {
                  return (
                    <button
                      key={index}
                      onClick={() => {
                        item.action()
                        closeMenu()
                      }}
                      className={`menu-item ${item.className || ''}`}
                    >
                      <span className="menu-icon">{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  )
                }
                
                return (
                  <Link
                    key={index}
                    to={item.path}
                    className={`menu-item ${isActivePage(item.path) ? 'active' : ''} ${item.className || ''}`}
                    onClick={closeMenu}
                  >
                    <span className="menu-icon">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar