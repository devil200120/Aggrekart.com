import React from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import './CartIcon.css'

const CartIcon = () => {
  const { itemCount, isLoading } = useCart()

  return (
    <Link to="/cart" className="cart-icon">
      <div className="cart-icon-container">
        <span className="cart-icon-symbol">🛒</span>
        {itemCount > 0 && (
          <span className="cart-badge">
            {itemCount > 99 ? '99+' : itemCount}
          </span>
        )}
        {isLoading && (
          <div className="cart-loading-indicator"></div>
        )}
      </div>
      <span className="cart-label">Cart</span>
    </Link>
  )
}

export default CartIcon