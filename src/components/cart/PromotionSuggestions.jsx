import React, { useState, useEffect } from "react";
import {
  getPromotionSuggestions,
  applyPromotionToCart,
  removePromotionFromCart,
} from "../../services/loyaltyService";
import { toast } from "react-hot-toast";
import "./PromotionSuggestions.css";

const PromotionSuggestions = ({ onPromotionApplied, appliedPromotion }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [removingPromotion, setRemovingPromotion] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [applyingPromotion, setApplyingPromotion] = useState(null);
const [justRemoved, setJustRemoved] = useState(false);

  useEffect(() => {
  fetchSuggestions();
}, [appliedPromotion]); // Only refetch when appliedPromotion changes
  const fetchSuggestions = async () => {
    try {
      setIsLoading(true);
      const data = await getPromotionSuggestions();
      console.log("🔍 Promotion suggestions received:", data);
      setSuggestions(data.suggestions || []);

      // Auto-expand if there are good suggestions
      if (data.suggestions?.some((s) => s.type === "eligible")) {
        setIsExpanded(true);
      }
    } catch (error) {
      console.error("Error fetching promotion suggestions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyPromotion = async (suggestion) => {
    if (applyingPromotion || appliedPromotion) return;

    try {
      // Pass the full promotion data
      const promotionToApply = {
        _id: suggestion.promotion._id,
        promotionId: suggestion.promotion._id,
        savings: suggestion.savings,
        title: suggestion.promotion.title,
        supplier: suggestion.promotion.supplier,
      };

      setApplyingPromotion(suggestion.promotion._id);
      console.log("🔥 Applying promotion:", promotionToApply);

      await applyPromotionToCart(promotionToApply);

      toast.success(`Promotion applied! You saved ₹${suggestion.savings}`);

      if (onPromotionApplied) {
        onPromotionApplied();
      }

      await fetchSuggestions(); // Refresh suggestions
    } catch (error) {
      console.error("❌ Error applying promotion:", error);
      toast.error("Failed to apply promotion");
    } finally {
      setApplyingPromotion(null);
    }
  };
  const handleRemovePromotion = async () => {
  if (removingPromotion) return;

  try {
    setRemovingPromotion(true);
    console.log("🗑️ Removing applied promotion...");

    await removePromotionFromCart();
    toast.success("Promotion removed successfully");
    
    // Set local flag that promotion was just removed
    setJustRemoved(true);

    if (onPromotionApplied) {
      onPromotionApplied(); // Refresh cart
    }

  } catch (error) {
    console.error("❌ Error removing promotion:", error);
    toast.error("Failed to remove promotion");
    setJustRemoved(false); // Reset on error
  } finally {
    setRemovingPromotion(false);
  }
};
useEffect(() => {
  if (!appliedPromotion && justRemoved) {
    setJustRemoved(false);
  }
}, [appliedPromotion, justRemoved]);

  if (isLoading) {
    return (
      <div className="promotion-suggestions loading">
        <div className="loading-spinner"></div>
        <p>Finding best deals for you...</p>
      </div>
    );
  }

  if (!suggestions.length) {
    return null;
  }

  const priorityOrder = { eligible: 1, almost: 2 };
  const sortedSuggestions = [...suggestions].sort(
    (a, b) => priorityOrder[a.type] - priorityOrder[b.type]
  );

  const getTypeIcon = (type) => {
    switch (type) {
      case "eligible":
        return "🎯";
      case "almost":
        return "⚡";
      default:
        return "🎁";
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case "eligible":
        return "Special Deal";
      case "almost":
        return "Almost There";
      default:
        return "Promotion";
    }
  };

  return (
    <div className="promotion-suggestions">
      {appliedPromotion && (
        <div className="applied-promotion-banner">
          <div className="applied-promotion-info">
            <span className="applied-icon">✅</span>
            <div className="applied-details">
              <span className="applied-title">{appliedPromotion.title}</span>
              <span className="applied-savings">
                Saved ₹{appliedPromotion.discountAmount}
              </span>
            </div>
          </div>
          <button
            className="remove-promotion-btn"
            onClick={handleRemovePromotion}
            disabled={removingPromotion}
          >
            {removingPromotion ? "⏳" : "❌"}
          </button>
        </div>
      )}
      <div
        className="suggestions-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h4>🎁 Available Promotions ({suggestions.length})</h4>
        <button className="expand-toggle">{isExpanded ? "−" : "+"}</button>
      </div>

      {isExpanded && (
        <div className="suggestions-list">
          {sortedSuggestions.map((promotion, index) => {
            console.log(`🎁 Rendering promotion ${index}:`, promotion);

            const promotionData = promotion.promotion || promotion;
            const promotionId = promotionData._id || promotionData.promotionId;
            const title = promotionData.title || "Special Promotion";
            const description =
              promotionData.description ||
              promotion.message ||
              "Save money with this promotion";
            const supplier = promotionData.supplier || "Supplier";
            const savingsText = `₹${promotion.savings || 0}`;

            return (
              <div
                key={promotionId + index}
                className={`promotion-card ${promotion.type || "eligible"}`}
              >
                {/* Promotion Icon */}
                <div className="promotion-icon">
                  {getTypeIcon(promotion.type || "eligible")}
                </div>

                {/* Promotion Header */}
                <div className="promotion-header">
                  <span className="promotion-type">
                    {getTypeLabel(promotion.type || "eligible")}
                  </span>
                  <div className="promotion-supplier">{supplier}</div>
                </div>

                {/* Promotion Details */}
                <div className="promotion-details">
                  <div className="promotion-title">{title}</div>
                  <div className="promotion-description">{description}</div>

                  {promotionData.minOrderValue && (
                    <div className="min-order">
                      Min order ₹{promotionData.minOrderValue}
                    </div>
                  )}

                  {promotion.savings && promotion.type !== "almost" && (
                    <div className="potential-savings">Save {savingsText}</div>
                  )}

                  {promotion.type === "almost" && promotion.amountNeeded && (
                    <div className="almost-eligible-info">
                      Add ₹{promotion.amountNeeded} more to unlock this deal!
                    </div>
                  )}
                </div>

                {/* Apply Button */}
                {(appliedPromotion && !justRemoved) ? (
  <button
    className="apply-promotion-btn remove"
    onClick={handleRemovePromotion}
    disabled={removingPromotion}
  >
    {removingPromotion ? "Removing..." : "REMOVE PROMOTION"}
  </button>
) : (
  <button
    className="apply-promotion-btn"
    onClick={() => handleApplyPromotion(promotion)}
    disabled={applyingPromotion === promotionId}
  >
    {applyingPromotion === promotionId ? (
      <>
        <span className="spinner"></span>
        Applying...
      </>
    ) : (
      "APPLY DEAL"
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

export default PromotionSuggestions;
