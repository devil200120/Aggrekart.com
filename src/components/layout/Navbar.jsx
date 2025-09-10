import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import CartIcon from "../cart/CartIcon";
import WishlistIcon from "../cart/WishlistIcon";
import AuthDropdown from "../auth/AuthDropdown";
import "./Navbar.css";
import SearchBar from "../common/SearchBar";
import ProfileVisibilitySwitch from "../supplier/ProfileVisibilitySwitch"; // CHANGE THIS LINE
import { CompactLanguageSelector } from "../common/LanguageSelector";
// import { useLanguage } from "../../context/LanguageContext";
import GoogleTranslate from "../common/GoogleTranslate"; // Add this import

// Import the logo image
import logoImage from "../../image.png";

const Navbar = () => {
  // const { t, isRTL } = useLanguage();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
      setIsMenuOpen(false);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const isActivePage = (path) => {
    return location.pathname === path;
  };

  const getAllMenuItems = () => {
    const baseItems = [
      { path: "/", label: "Home", icon: "🏠" },
      { path: "/products", label: "Products", icon: "📦" },
    ];

    if (user) {
      switch (user.role) {
        case "customer":
          return [
            ...baseItems,
            { path: "/orders", label: "My Orders", icon: "📋" },
            { path: "/profile", label: "Profile", icon: "👤" },
            {
              path: "/loyalty/dashboard",
              label: "Loyalty Dashboard",
              icon: "🪙",
            },
            { path: "/loyalty/membership", label: "Membership", icon: "👑" },
            { path: "/loyalty/referrals", label: "Referrals", icon: "🎁" },
            { path: "/loyalty/offers", label: "Exclusive Offers", icon: "🏷️" },
            { path: "/wishlist", label: "Wishlist", icon: "❤️" },
            { path: "/cart", label: "Cart", icon: "🛒" },
            { path: "/support/tickets", label: "Support", icon: "🎫" }, // 🔥 ADD THIS LINE
            { path: "/settings", label: "Settings", icon: "⚙️" },
            { type: "divider" },
            {
              type: "action",
              action: handleLogout,
              label: "Logout",
              icon: "🚪",
              className: "logout",
            },
          ];
        case "supplier":
          return [
            ...baseItems,
            { path: "/supplier/dashboard", label: "Dashboard", icon: "📊" },
            {
              path: "/supplier/products",
              label: "Manage Products",
              icon: "📦",
            },
            { path: "/supplier/orders", label: "Orders", icon: "📋" },
            { path: "/supplier/profile", label: "Profile", icon: "👤" },
            { path: "/supplier/transport-rates", label: "Transport Rates", icon: "🚛" },
            { path: "/settings", label: "Settings", icon: "⚙️" },
             { path: "/supplier/loyalty", label: "Loyalty & Promotions", icon: "🎯" },
            { type: "divider" },
            {
              type: "action",
              action: handleLogout,
              label: "Logout",
              icon: "🚪",
              className: "logout",
            },
          ];
        case "admin":
          return [
            { path: "/products", label: "Products", icon: "📦" },
            { path: "/admin/dashboard", label: "Admin Panel", icon: "🛡️" },
            { path: "/admin/users", label: "Users", icon: "👥" },
            { path: "/admin/suppliers", label: "Suppliers", icon: "🏪" },
            { path: "/admin/orders", label: "Orders", icon: "📋" },
            { path: "/admin/loyalty", label: "Loyalty Management", icon: "🪙" },
            { path: "/admin/products", label: "Manage Products", icon: "📦" },
            { path: "/admin/know-more", label: "Know More Management", icon: "📝" },
            {
              path: "/admin/reports",
              label: "Reports & Analytics",
              icon: "📊",
            },
            { path: "/settings", label: "Settings", icon: "⚙️" },
            { type: "divider" },
            {
              type: "action",
              action: handleLogout,
              label: "Logout",
              icon: "🚪",
              className: "logout",
            },
          ];
        default:
          return baseItems;
      }
    } else {
      return [
        ...baseItems,
        { type: "divider" },
        { path: "/auth/login", label: "Login", icon: "🔐" },
        { path: "/auth/register", label: "Customer Registration", icon: "👤" },
        {
          path: "/auth/supplier-register",
          label: "Supplier Registration",
          icon: "🏪",
          className: "supplier",
        },
      ];
    }
  };

  return (
    <nav className={`navbar ${isScrolled ? "navbar-scrolled" : ""}`}>
      <div className="navbar-container">
        <div className="navbar-content">
          {/* Logo */}
          
          <Link to="/" className="navbar-logo" onClick={closeMenu}>
            <img src={logoImage} alt="Aggrekart Logo" className="logo-image" />
          </Link>
          <div className="navbar-search desktop-search">
            <SearchBar />
          </div>


          {/* Desktop Navigation Links */}
          <div className="navbar-nav desktop-nav">
            {user?.role === "customer" && (
              <Link
                to="/orders"
                className={`nav-link ${isActivePage("/orders") ? "active" : ""}`}
              >
                My Orders
              </Link>
            )}
          </div>

          {/* Right Actions */}
          <div className="navbar-actions">
            
            {/* User Actions for Customers */}
            {/* User Actions for Customers Only */}
            {user?.role === "customer" && (
              <div className="user-actions">
                <WishlistIcon />
                <CartIcon />
              </div>
            )}

            {/* User Avatar */}
            {user && (
              <div className="user-avatar" title={user.name}>
                {user.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
            )}

            {/* Authentication Dropdown for non-logged in users */}
            {!user && (
              <div className="auth-buttons desktop-auth">
                <AuthDropdown />
              </div>
            )}
        {/* Google Translate for Desktop Only */}

            {/* Hamburger Menu Toggle */}
            <button
              className={`hamburger-btn ${isMenuOpen ? "active" : ""}`}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>

        {/* Mobile Hamburger Menu */}
        {isMenuOpen && (
          <div className="hamburger-menu">
            {/* User Info */}
            {user && (
              <div className="menu-user-info">
                <div className="user-avatar-large">
                  {user.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <div className="user-details">
                  <h3>{user.name}</h3>
                  <p>{user.email}</p>
                  <span className="role-badge">{user.role}</span>
                </div>
              </div>
            )}
            {user?.role === "supplier" && <ProfileVisibilitySwitch />}
            <div className="mobile-search">
              <SearchBar />
            </div>
            <GoogleTranslate />
            {/* Menu Items */}
            <div className="menu-items">
              {getAllMenuItems().map((item, index) => {
                if (item.type === "divider") {
                  return <hr key={index} className="menu-divider" />;
                }

                if (item.type === "action") {
                  return (
                    <button
                      key={index}
                      onClick={() => {
                        item.action();
                        closeMenu();
                      }}
                      className={`menu-item ${item.className || ""}`}
                    >
                      <span className="menu-icon">{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  );
                }

                return (
                  <Link
                    key={index}
                    to={item.path}
                    className={`menu-item ${isActivePage(item.path) ? "active" : ""} ${item.className || ""}`}
                    onClick={closeMenu}
                  >
                    <span className="menu-icon">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
