import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import "./AuthDropdown.css";

const AuthDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const closeDropdown = () => {
    setIsOpen(false);
  };

  return (
    <div className="auth-dropdown" ref={dropdownRef}>
      <button
        className="auth-dropdown-trigger"
        onClick={toggleDropdown}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        Sign up / Login
        <svg
          className={`dropdown-arrow ${isOpen ? "open" : ""}`}
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
        >
          <path
            d="M3 4.5L6 7.5L9 4.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="auth-dropdown-menu">
          <div className="dropdown-content">
            <Link
              to="/auth/register"
              className="dropdown-item customer-registration"
              onClick={closeDropdown}
            >
              <div className="item-content">
                <span className="item-icon">👤</span>
                <span className="item-text">Customer Registration</span>
              </div>
            </Link>
            <Link
              to="/auth/whatsapp-register"
              className="dropdown-item instant-registration"
              onClick={closeDropdown}
            >
              <div className="item-content">
                <span className="item-icon">📱</span>
                <span className="item-text">Instant Registration</span>
              </div>
            </Link>

            <Link
              to="/auth/supplier-register"
              className="dropdown-item supplier-registration"
              onClick={closeDropdown}
            >
              <div className="item-content">
                <span className="item-icon">🏪</span>
                <span className="item-text">Supplier Registration</span>
              </div>
            </Link>

            <div className="dropdown-divider"></div>

            <Link
              to="/auth/login"
              className="dropdown-item login-link"
              onClick={closeDropdown}
            >
              <div className="item-content">
                <span className="item-icon">🔐</span>
                <span className="item-text">
                  Already have an account? Login
                </span>
              </div>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthDropdown;
