import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Trophy,
  Star,
  Crown,
  TrendingUp,
  ShoppingBag,
  IndianRupee,
  Gift,
  Zap,
  Award,
  Target,
  LogIn,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext"; // Add this import
import Cookies from "js-cookie"; // Add this import
import "./MembershipProgress.css";

const MembershipProgress = () => {
  const [membershipData, setMembershipData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, isAuthenticated } = useAuth(); // Add this

  useEffect(() => {
    if (isAuthenticated) {
      fetchMembershipProgress();
    } else {
      setError("Please login to view your membership data");
      setLoading(false);
    }
  }, [isAuthenticated]);

  const fetchMembershipProgress = async () => {
    try {
      // Use YOUR token system (cookies)
      const token = Cookies.get("aggrekart_token");

      if (!token) {
        throw new Error("Please login to view your membership data");
      }

      console.log("🔍 Fetching REAL membership progress...");

      const response = await fetch(
        "/api/loyalty/membership/progress",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          Cookies.remove("aggrekart_token");
          throw new Error("Your session has expired. Please login again.");
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // ADD DEBUG LOGGING TO SEE WHAT WE'RE GETTING
      console.log(
        "🔥 DEBUG - Full API Response:",
        JSON.stringify(data, null, 2)
      );
      console.log("🔥 DEBUG - Current Tier:", data.data?.currentTier);
      console.log("🔥 DEBUG - Progress Data:", data.data?.progress);
      console.log("🔥 DEBUG - User Stats:", data.data?.userStats);

      if (data.success) {
        setMembershipData(data.data);
        setError(null);
        console.log(
          "✅ REAL membership data loaded successfully for:",
          user?.name
        );
      } else {
        throw new Error(data.message || "Failed to fetch membership data");
      }
    } catch (error) {
      console.error("Error fetching membership progress:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    // Clear any existing tokens
    localStorage.removeItem("token");
    localStorage.removeItem("authToken");
    localStorage.removeItem("aggrekart_token");

    // Redirect to login page
    window.location.href = "/auth/login";
  };

  const getTierIcon = (tier) => {
    switch (tier) {
      case "platinum":
        return <Crown className="tier-icon platinum" />;
      case "gold":
        return <Trophy className="tier-icon gold" />;
      case "silver":
      default:
        return <Star className="tier-icon silver" />;
    }
  };

  const getTierColor = (tier) => {
    switch (tier) {
      case "platinum":
        return "#9c27b0";
      case "gold":
        return "#ff9800";
      case "silver":
      default:
        return "#607d8b";
    }
  };

  const getTierGradient = (tier) => {
    switch (tier) {
      case "platinum":
        return "linear-gradient(135deg, #9c27b0, #e1bee7)";
      case "gold":
        return "linear-gradient(135deg, #ff9800, #ffcc02)";
      case "silver":
      default:
        return "linear-gradient(135deg, #607d8b, #90a4ae)";
    }
  };

  if (loading) {
    return (
      <div className="membership-progress-loading">
        <div className="loading-spinner"></div>
        <p>Loading membership progress...</p>
      </div>
    );
  }

  // Check if it's an authentication error
  const isAuthError =
    error &&
    (error.includes("log in") ||
      error.includes("token") ||
      error.includes("session") ||
      error.includes("Authentication"));

  if (error) {
    return (
      <div className="membership-progress-error">
        <div className="error-message">
          <h3>
            {isAuthError
              ? "Authentication Required"
              : "Unable to load membership data"}
          </h3>
          <p>{error}</p>
          <div className="error-buttons">
            {isAuthError ? (
              <button onClick={handleLogin} className="login-button">
                <LogIn size={18} />
                Login Now
              </button>
            ) : (
              <button
                onClick={fetchMembershipProgress}
                className="retry-button"
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!membershipData) {
    return (
      <div className="membership-progress-error">
        <div className="error-message">
          <h3>No membership data available</h3>
          <p>Unable to retrieve your membership information.</p>
          <div className="error-buttons">
            <button onClick={fetchMembershipProgress} className="retry-button">
              Retry
            </button>
            <button onClick={handleLogin} className="login-button">
              <LogIn size={18} />
              Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { currentTier, progress, tierBenefits, userStats } = membershipData;
  const allTiers = ["silver", "gold", "platinum"];
  const currentTierIndex = allTiers.indexOf(currentTier);

  return (
    <div className="membership-progress">
      {/* Header */}
      <motion.div
        className="membership-headers"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="header-contents">
          <div className="current-tier-display">
            {getTierIcon(currentTier)}
            <div className="tier-info">
              <h2>{currentTier?.toUpperCase()} MEMBER</h2>
              <p>Your current membership tier</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* User Stats */}
      <motion.div
        className="user-stats"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="stats-grid">
          <div className="stat-card">
            <ShoppingBag className="stat-icon" />
            <div className="stat-content">
              <h4>{userStats?.totalOrders || 0}</h4>
              <p>Total Orders</p>
            </div>
          </div>
          <div className="stat-card">
            <IndianRupee className="stat-icon" />
            <div className="stat-content">
              <h4>₹{userStats?.totalSpent?.toLocaleString() || 0}</h4>
              <p>Total Spent</p>
            </div>
          </div>
          <div className="stat-card">
            <Star className="stat-icon" />
            <div className="stat-content">
              <h4>{userStats?.aggreCoinsBalance || 0}</h4>
              <p>AggreCoins</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tier Progression */}
      <motion.div
        className="tier-progression"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h3>Membership Progression</h3>
        <div className="tiers-timeline">
          {allTiers.map((tier, index) => (
            <div
              key={tier}
              className={`tier-milestone ${
                index <= currentTierIndex ? "achieved" : "upcoming"
              }`}
            >
              <div
                className="milestone-icon"
                style={{
                  background:
                    index <= currentTierIndex
                      ? getTierGradient(tier)
                      : "#f0f0f0",
                }}
              >
                {getTierIcon(tier)}
              </div>
              <div className="milestone-content">
                <h4>{tier.toUpperCase()}</h4>
                <div className="tier-requirements">
                  {tier === "silver" && (
                    <>
                      <span>0+ Orders</span>
                      <span>₹0+ Spent</span>
                    </>
                  )}
                  {tier === "gold" && (
                    <>
                      <span>20+ Orders</span>
                      <span>₹50,000+ Spent</span>
                    </>
                  )}
                  {tier === "platinum" && (
                    <>
                      <span>50+ Orders</span>
                      <span>₹2,00,000+ Spent</span>
                    </>
                  )}
                </div>
                <div className="tier-coin-multiplier">
                  {tier === "silver" && "1x Coin Multiplier"}
                  {tier === "gold" && "1.5x Coin Multiplier"}
                  {tier === "platinum" && "2x Coin Multiplier"}
                </div>
              </div>
              {index <= currentTierIndex && (
                <div className="achievement-badge">
                  <Award size={16} />
                </div>
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Progress to Next Tier OR Maximum Tier Message */}
      {progress?.nextTier ? (
        <motion.div
          className="next-tier-progress"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3>Progress to {progress.nextTier?.toUpperCase()}</h3>
          <div className="progress-cards">
            <div className="progress-card orders">
              <div className="progress-header">
                <ShoppingBag className="progress-icon" />
                <span>Orders Progress</span>
              </div>
              <div className="progress-bar-container">
                <div className="progress-bar">
                  <div
                    className="progress-fill orders-fill"
                    style={{
                      width: `${progress.progress?.ordersProgress || 0}%`,
                    }}
                  ></div>
                </div>
                <span className="progress-text">
                  {Math.round(progress.progress?.ordersProgress || 0)}%
                </span>
              </div>
              <div className="progress-details">
                <span>
                  {progress.progress?.ordersNeeded || 0} more orders needed
                </span>
              </div>
            </div>

            <div className="progress-card spending">
              <div className="progress-header">
                <IndianRupee className="progress-icon" />
                <span>Spending Progress</span>
              </div>
              <div className="progress-bar-container">
                <div className="progress-bar">
                  <div
                    className="progress-fill spending-fill"
                    style={{
                      width: `${progress.progress?.spendingProgress || 0}%`,
                    }}
                  ></div>
                </div>
                <span className="progress-text">
                  {Math.round(progress.progress?.spendingProgress || 0)}%
                </span>
              </div>
              <div className="progress-details">
                <span>
                  ₹{progress.progress?.spendingNeeded?.toLocaleString() || 0}{" "}
                  more needed
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      ) : (
        /* ADDED: Maximum Tier Achievement Message */
        <motion.div
          className="max-tier-achievement"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="achievement-card">
            <div className="achievement-icon">
              <Crown className="crown-icon" />
            </div>
            <h3>🎉 Maximum Tier Achieved!</h3>
            <p>
              Congratulations! You have reached the highest membership tier with{" "}
              <strong>{userStats?.totalOrders || 0} orders</strong> and{" "}
              <strong>
                ₹{userStats?.totalSpent?.toLocaleString("en-IN") || "0"}
              </strong>{" "}
              in total spending.
            </p>
            <div className="achievement-benefits">
              <h4>Your PLATINUM Benefits:</h4>
              <ul>
                <li>24/7 VIP customer support</li>
                <li>Express delivery on all orders</li>
                <li>3x AggreCoin multiplier</li>
                <li>Exclusive platinum member deals</li>
                <li>Free delivery on all orders</li>
                <li>Early access to new products</li>
              </ul>
            </div>
          </div>
        </motion.div>
      )}

      {/* Current Tier Benefits */}
      <motion.div
        className="current-benefits"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h3>Your {currentTier?.toUpperCase()} Benefits</h3>
        <div className="benefits-grid">
          {tierBenefits?.[currentTier]?.benefits?.map((benefit, index) => (
            <motion.div
              key={index}
              className="benefit-card"
              whileHover={{ scale: 1.02 }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
            >
              <div className="benefit-icon-container">
                {benefit.includes("support") && <Zap />}
                {benefit.includes("delivery") && <TrendingUp />}
                {benefit.includes("discount") && <Gift />}
                {!benefit.includes("support") &&
                  !benefit.includes("delivery") &&
                  !benefit.includes("discount") && <Star />}
              </div>
              <span className="benefit-text">{benefit}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Upgrade Incentive */}
      {progress?.nextTier && (
        <motion.div
          className="upgrade-incentive"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="incentive-content">
            <div className="incentive-icon">
              <Target />
            </div>
            <div className="incentive-text">
              <h4>Why Upgrade to {progress.nextTier?.toUpperCase()}?</h4>
              <div className="upgrade-benefits">
                {progress.nextTier === "gold" && (
                  <>
                    <span>🌟 1.5x Coin Multiplier</span>
                    <span>⚡ Priority Support</span>
                    <span>🚀 Faster Delivery</span>
                    <span>💰 5% Extra Discount</span>
                  </>
                )}
                {progress.nextTier === "platinum" && (
                  <>
                    <span>👑 2x Coin Multiplier</span>
                    <span>🎯 VIP Support</span>
                    <span>⚡ Express Delivery</span>
                    <span>💎 10% Extra Discount</span>
                    <span>🎁 Exclusive Offers</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="incentive-cta">
            <button className="start-shopping-btn">
              <ShoppingBag size={18} />
              Start Shopping
            </button>
          </div>
        </motion.div>
      )}

      {/* Tier Comparison */}
      <motion.div
        className="tier-comparison"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <h3>Compare All Tiers</h3>
        <div className="comparison-table">
          <div className="comparison-header">
            <div className="feature-column">Features</div>
            <div className="tier-column silver">Silver</div>
            <div className="tier-column gold">Gold</div>
            <div className="tier-column platinum">Platinum</div>
          </div>

          <div className="comparison-row">
            <div className="feature">Coin Multiplier</div>
            <div className="tier-value">1x</div>
            <div className="tier-value">1.5x</div>
            <div className="tier-value">2x</div>
          </div>

          <div className="comparison-row">
            <div className="feature">Support Level</div>
            <div className="tier-value">Basic</div>
            <div className="tier-value">Priority</div>
            <div className="tier-value">VIP</div>
          </div>

          <div className="comparison-row">
            <div className="feature">Delivery Speed</div>
            <div className="tier-value">Standard</div>
            <div className="tier-value">Faster</div>
            <div className="tier-value">Express</div>
          </div>

          <div className="comparison-row">
            <div className="feature">Extra Discount</div>
            <div className="tier-value">-</div>
            <div className="tier-value">5%</div>
            <div className="tier-value">10%</div>
          </div>

          <div className="comparison-row">
            <div className="feature">Requirements</div>
            <div className="tier-value">0 orders</div>
            <div className="tier-value">20+ orders</div>
            <div className="tier-value">50+ orders</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default MembershipProgress;
