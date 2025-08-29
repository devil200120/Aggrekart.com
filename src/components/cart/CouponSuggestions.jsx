import React, { useState, useEffect } from "react";
import {
  getCouponSuggestions,
  applyCouponToCart,
} from "../../services/loyaltyService";
import { toast } from "react-hot-toast";
import "./CouponSuggestions.css";

const CouponSuggestions = ({ onCouponApplied, appliedCoupon }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [applyingCoupon, setApplyingCoupon] = useState(null);

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    try {
      setIsLoading(true);
      const data = await getCouponSuggestions();
      console.log("🔍 Coupon suggestions received:", data);
      setSuggestions(data.suggestions || []);
    } catch (error) {
      console.error("Error fetching coupon suggestions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyCoupon = async (coupon) => {
    if (applyingCoupon || appliedCoupon) return;

    try {
      const couponCode = coupon.coupon?.code || coupon.code;
      console.log(
        "🎫 Applying coupon:",
        couponCode,
        "Full coupon object:",
        coupon
      );

      if (!couponCode) {
        console.error("❌ No coupon code found in:", coupon);
        toast.error("Invalid coupon code");
        return;
      }

      setApplyingCoupon(couponCode);
      const response = await applyCouponToCart(couponCode);

      if (response.success) {
        const discountAmount = response.data?.discountAmount || 0;
        const formattedDiscount = `₹${discountAmount}`;

        toast.success(
          `🎉 Coupon ${couponCode} applied! You saved ${formattedDiscount}`
        );

        if (onCouponApplied) {
          onCouponApplied();
        }

        setTimeout(() => {
          fetchSuggestions();
        }, 500);
      }
    } catch (error) {
      console.error("❌ Error applying coupon:", error);
      toast.error(error.message || "Failed to apply coupon");
    } finally {
      setApplyingCoupon(null);
    }
  };

  if (isLoading) {
    return (
      <div className="coupon-suggestions loading">
        <div className="loading-spinner"></div>
        <p>Finding best coupons for you...</p>
      </div>
    );
  }

  if (!suggestions.length) {
    return null;
  }

  const priorityOrder = { owned: 1, eligible: 2, almost: 3 };
  const sortedSuggestions = [...suggestions].sort(
    (a, b) => priorityOrder[a.type] - priorityOrder[b.type]
  );

  const getTypeIcon = (type) => {
    switch (type) {
      case "owned":
        return "✨";
      case "eligible":
        return "🔥";
      case "almost":
        return "⚡";
      default:
        return "🎫";
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case "owned":
        return "Your Coupon";
      case "eligible":
        return "Hot Deal";
      case "almost":
        return "Almost There";
      default:
        return "Coupon";
    }
  };

  return (
    <div className="coupon-suggestions">
      <div
        className="suggestions-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h4>🎫 Available Coupons ({suggestions.length})</h4>
        <button className="expand-toggle">{isExpanded ? "−" : "+"}</button>
      </div>

      {isExpanded && (
        <div className="suggestions-list">
          {sortedSuggestions.map((suggestion, index) => {
            console.log(`🎫 Rendering suggestion ${index}:`, suggestion);

            // Extract coupon details properly
            const couponData = suggestion.coupon || suggestion;
            const couponCode =
              couponData.code || couponData.couponCode || "NO_CODE";
            const couponName =
              couponData.name || couponData.title || "Discount Coupon";
            const couponDesc =
              couponData.description ||
              suggestion.description ||
              suggestion.message ||
              "Save money with this coupon";
            const minOrder =
              couponData.minOrderValue || couponData.minOrderAmount;
            const savingsText =
              suggestion.savings || `₹${couponData.discountValue || 0}`;

            return (
              <div
                key={couponCode + index}
                className={`suggestion-card ${suggestion.type || "eligible"}`}
              >
                {/* Coupon Icon */}
                <div className="coupon-icon">
                  {getTypeIcon(suggestion.type || "eligible")}
                </div>

                {/* Coupon Header */}
                <div className="coupon-header">
                  <span className="coupon-type">
                    {getTypeLabel(suggestion.type || "eligible")}
                  </span>
                  <div className="coupon-code">{couponCode}</div>
                </div>

                {/* Coupon Details */}
                <div className="coupon-details">
                  <div className="discount-text">{couponDesc}</div>

                  {minOrder && (
                    <div className="min-order">Min order ₹{minOrder}</div>
                  )}

                  {savingsText && suggestion.type !== "almost" && (
                    <div className="potential-savings">Save {savingsText}</div>
                  )}

                  {suggestion.type === "almost" && suggestion.amountNeeded && (
                    <div className="almost-eligible-info">
                      Add ₹{suggestion.amountNeeded} more to unlock this offer!
                    </div>
                  )}
                </div>

                {/* Apply Button */}
                {suggestion.type !== "almost" && (
                  <button
                    className="apply-coupon-btn"
                    onClick={() => handleApplyCoupon(suggestion)}
                    disabled={applyingCoupon === couponCode}
                  >
                    {applyingCoupon === couponCode ? (
                      <>
                        <span className="spinner"></span>
                        Applying...
                      </>
                    ) : (
                      "APPLY COUPON"
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CouponSuggestions;
