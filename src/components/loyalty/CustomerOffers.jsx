import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Hammer,
  Building,
  Home,
  Users,
  Percent,
  Clock,
  MapPin,
  Star,
  Check,
  X,
  Gift,
  Tag,
  Store,
  Truck,
  Coins,
  Calendar,
  Award,
  ShoppingCart,
  Eye,
  TrendingUp,
} from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import loyaltyService from "../../services/loyaltyService";
import { cartAPI } from "../../services/api";
import { toast } from "react-hot-toast";
import "./CustomerOffers.css";

const CustomerOffers = ({ customerType }) => {
  const [offers, setOffers] = useState([]);
  const [supplierPromotions, setSupplierPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [error, setError] = useState(null);
  const [applyingPromotions, setApplyingPromotions] = useState(new Set());

  // Get cart context and user data
  const { total, items, finalAmount, refreshCart, dispatch } = useCart();
  const { user } = useAuth();

  useEffect(() => {
    fetchAllPromotions();
  }, [customerType]);

  const fetchAllPromotions = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await loyaltyService.getAllCustomerPromotions();

      setOffers(result.loyaltyPromotions || []);
      setSupplierPromotions(result.supplierPromotions || []);

      console.log("✅ Promotions fetched:", {
        loyaltyCount: result.loyaltyPromotions?.length || 0,
        supplierCount: result.supplierPromotions?.length || 0,
      });
    } catch (error) {
      console.error("❌ Error fetching promotions:", error);
      setError(error.message || "Failed to load promotions");
    } finally {
      setLoading(false);
    }
  };

  // Enhanced apply promotion handler with real cart integration
  const handleApplyOffer = async (offer, isSupplierPromotion = false) => {
    try {
      // Validate cart has items
      if (!items || items.length === 0) {
        toast.error("Please add items to your cart before applying promotions");
        return;
      }

      // Get the actual order value from cart
      const orderValue = finalAmount || total || 0;

      if (orderValue <= 0) {
        toast.error(
          "Cart is empty. Please add items before applying promotions"
        );
        return;
      }

      // Check minimum order requirements for the promotion
      if (isSupplierPromotion && offer.eligibility?.minimumOrderValue) {
        if (orderValue < offer.eligibility.minimumOrderValue) {
          toast.error(
            `Minimum order value of ₹${offer.eligibility.minimumOrderValue.toLocaleString()} required for this promotion`
          );
          return;
        }
      }

      // Set loading state for this specific promotion
      setApplyingPromotions((prev) => new Set([...prev, offer._id]));

      if (isSupplierPromotion) {
        // Apply supplier promotion - UPDATED VERSION WITH CART INTEGRATION
        try {
          console.log("🔍 Applying supplier promotion with data:", {
            promotionId: offer._id,
            orderValue,
            itemsCount: items.length,
          });

          // Step 1: Calculate discount via API
          const promotionData = await loyaltyService.applySupplierPromotion({
            promotionId: offer._id,
            orderValue: orderValue,
            items: items.map((item) => ({
              productId: item.product._id,
              quantity: item.quantity,
              unitPrice: item.price,
              categoryId: item.product.category,
            })),
          });

          console.log("✅ Supplier promotion response:", promotionData);

          if (
            promotionData &&
            (promotionData.savings || promotionData.finalAmount !== undefined)
          ) {
            // Step 2: Apply the discount to the actual cart
            const cartResponse = await cartAPI.applySupplierPromotionToCart({
              promotionId: offer._id,
              discountAmount: promotionData.savings,
              title: offer.title,
              supplier: promotionData.promotion.supplier,
              couponCode: promotionData.couponCode,
            });

            if (cartResponse.success) {
              // Step 3: Update cart context immediately
              dispatch({
                type: "SET_CART",
                payload: {
                  items: cartResponse.data.cart.items,
                  total: cartResponse.data.cart.totalAmount,
                  itemCount: cartResponse.data.cart.totalItems,
                  appliedCoupon: cartResponse.data.cart.appliedCoupon,
                  appliedCoins: cartResponse.data.cart.appliedCoins,
                  appliedSupplierPromotion:
                    cartResponse.data.cart.appliedSupplierPromotion,
                  finalAmount: cartResponse.data.cart.finalAmount,
                },
              });

              // Step 4: Show success message
              toast.success(
                `🎉 Promotion Applied to Cart!\n` +
                  `💰 You'll save: ₹${promotionData.savings.toLocaleString()}\n` +
                  `🏷️ New cart total: ₹${cartResponse.data.cart.finalAmount.toLocaleString()}\n` +
                  `🏪 From: ${promotionData.promotion.supplier}` +
                  (promotionData.couponCode
                    ? `\n📋 Coupon: ${promotionData.couponCode}`
                    : ""),
                {
                  duration: 6000,
                  position: "top-center",
                  style: {
                    background: "#10B981",
                    color: "white",
                    fontWeight: "bold",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  },
                }
              );

              // Step 5: Trigger cart refresh for other components
              if (typeof refreshCart === "function") {
                await refreshCart();
              }
            } else {
              throw new Error("Failed to apply promotion to cart");
            }
          } else {
            throw new Error("Invalid promotion response");
          }
        } catch (supplierError) {
          console.error("❌ Supplier promotion error:", supplierError);
          throw supplierError;
        }
      } else {
        // Apply loyalty program promotion (keep existing logic)
        const response = await fetch("/api/customer-promotions/apply", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            promotionId: offer.id,
            orderValue: orderValue,
            items: items.map((item) => ({
              productId: item.product._id,
              quantity: item.quantity,
              unitPrice: item.price,
            })),
          }),
        });

        const data = await response.json();

        if (data.success) {
          toast.success(
            `🎉 Loyalty Offer Applied!\n💰 You'll save: ₹${data.data.discountAmount.toLocaleString()}`,
            {
              duration: 4000,
              position: "top-center",
              style: {
                background: "#3B82F6",
                color: "white",
                fontWeight: "bold",
                borderRadius: "8px",
              },
            }
          );
        } else {
          throw new Error(data.message || "Failed to apply offer");
        }
      }
    } catch (error) {
      console.error("❌ Error applying promotion:", error);

      // Enhanced error message handling
      let errorMessage = "Error applying promotion. Please try again.";

      // Check different error sources
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      // Show specific error messages for common issues
      if (errorMessage.includes("Promotion not found")) {
        errorMessage = "This promotion is no longer available.";
      } else if (errorMessage.includes("minimum order")) {
        errorMessage = "Your cart doesn't meet the minimum order requirement.";
      } else if (errorMessage.includes("not approved")) {
        errorMessage = "This supplier's promotion is not currently active.";
      } else if (errorMessage.includes("expired")) {
        errorMessage = "This promotion has expired.";
      }

      toast.error(`❌ ${errorMessage}`, {
        duration: 4000,
        position: "top-center",
        style: {
          background: "#EF4444",
          color: "white",
          fontWeight: "bold",
          borderRadius: "8px",
        },
      });
    } finally {
      // Remove loading state for this promotion
      setApplyingPromotions((prev) => {
        const newSet = new Set(prev);
        newSet.delete(offer._id);
        return newSet;
      });
    }
  };

  // Enhanced eligibility checker
  const checkPromotionEligibility = (promotion) => {
    if (!user)
      return { eligible: false, reason: "Please login to view promotions" };

    const orderValue = finalAmount || total || 0;
    const cartItemCount = items?.length || 0;

    // Check minimum order value
    if (
      promotion.eligibility?.minimumOrderValue &&
      orderValue < promotion.eligibility.minimumOrderValue
    ) {
      return {
        eligible: false,
        reason: `Minimum order: ₹${promotion.eligibility.minimumOrderValue.toLocaleString()}`,
      };
    }

    // Check customer type eligibility
    if (
      promotion.eligibility?.targetCustomerTypes &&
      !promotion.eligibility.targetCustomerTypes.includes(user.customerType) &&
      !promotion.eligibility.targetCustomerTypes.includes("all")
    ) {
      return { eligible: false, reason: "Not eligible for your customer type" };
    }

    // Check if cart is empty
    if (cartItemCount === 0) {
      return { eligible: false, reason: "Add items to cart to apply" };
    }

    return { eligible: true, reason: "" };
  };

  // Helper functions
  const formatDiscountText = (promotion) => {
    const { benefits } = promotion;
    switch (benefits.discountType) {
      case "percentage":
        return `${benefits.discountValue}% OFF`;
      case "fixed_amount":
        return `₹${benefits.discountValue} OFF`;
      case "free_delivery":
        return "FREE DELIVERY";
      case "coins_multiplier":
        return `${benefits.coinsMultiplier}x COINS`;
      default:
        return "SPECIAL OFFER";
    }
  };

  const formatValidityText = (promotion) => {
    const now = new Date();
    const endDate = new Date(promotion.endDate);
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return "Expired";
    if (diffDays === 1) return "Ends today";
    if (diffDays <= 7) return `${diffDays} days left`;
    return `Valid till ${endDate.toLocaleDateString()}`;
  };

  const getCustomerTypeIcon = (customerType) => {
    const icons = {
      house_owner: Home,
      builder_contractor: Building,
      mason: Hammer,
      others: Users,
    };
    return icons[customerType] || Users;
  };

  // Filter functions
  const filterPromotionsByTab = (promotions, tab) => {
    switch (tab) {
      case "loyalty":
        return offers;
      case "supplier":
        return supplierPromotions;
      case "all":
      default:
        return [...offers, ...supplierPromotions];
    }
  };

  const filteredPromotions = filterPromotionsByTab(
    [...offers, ...supplierPromotions],
    activeTab
  );

  // Loading state
  if (loading) {
    return (
      <div className="customer-offers">
        <div className="offers-header">
          <div className="header-contenth">
            <Gift className="header-icon" />
            <div>
              <h2>Special Offers & Promotions</h2>
              <p>Loading exclusive deals for you...</p>
            </div>
          </div>
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Fetching your personalized offers...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="customer-offers">
        <div className="offers-header">
          <div className="header-contenth">
            <Gift className="header-icon" />
            <div>
              <h2>Special Offers & Promotions</h2>
              <p>Exclusive deals for construction professionals</p>
            </div>
          </div>
        </div>
        <div className="error-container">
          <X className="error-icon" />
          <h3>Unable to Load Offers</h3>
          <p>{error}</p>
          <button onClick={fetchAllPromotions} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="customer-offers">
      {/* Header */}
      <div className="offers-header">
        <div className="header-contenth">
          <Gift className="header-icon" />
          <div>
            <h2>Special Offers & Promotions</h2>
            <p>Exclusive deals for construction professionals</p>
          </div>
        </div>

        {/* Cart Summary for Context */}
        <div className="cart-context">
          <div className="cart-info">
            <ShoppingCart size={16} />
            <span>Cart: {items?.length || 0} items</span>
            <span className="cart-value">
              ₹{(finalAmount || total || 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Statistics Bar */}
      <div className="stats-bar">
        <div className="stat-item">
          <div className="stat-number">
            {offers.length + supplierPromotions.length}
          </div>
          <div className="stat-label">Total Offers</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">{offers.length}</div>
          <div className="stat-label">Loyalty Rewards</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">{supplierPromotions.length}</div>
          <div className="stat-label">Supplier Deals</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">
            {
              filteredPromotions.filter(
                (p) => checkPromotionEligibility(p).eligible
              ).length
            }
          </div>
          <div className="stat-label">Available Now</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="offer-tabs">
        {[
          {
            key: "all",
            label: "All Offers",
            count: offers.length + supplierPromotions.length,
          },
          { key: "loyalty", label: "Loyalty Program", count: offers.length },
          {
            key: "supplier",
            label: "Supplier Offers",
            count: supplierPromotions.length,
          },
        ].map((tab) => (
          <button
            key={tab.key}
            className={`tab-btn ${activeTab === tab.key ? "active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            <span className="tab-count">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Offers Grid */}
      <div className="offers-grid">
        <AnimatePresence>
          {/* Loyalty Program Offers */}
          {(activeTab === "all" || activeTab === "loyalty") &&
            offers.map((offer) => {
              const eligibility = checkPromotionEligibility(offer);
              const isApplying = applyingPromotions.has(offer._id);

              return (
                <motion.div
                  key={`loyalty-${offer._id}`}
                  className={`offer-card loyalty-offer ${!eligibility.eligible ? "ineligible" : ""}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <div className="offer-header">
                    <div className="offer-type">
                      <Coins className="type-icon" />
                      <span>Loyalty Program</span>
                    </div>
                    <div className="offer-discount">
                      {formatDiscountText(offer)}
                    </div>
                  </div>

                  <div className="offer-content">
                    <h3>{offer.title}</h3>
                    <p>{offer.description}</p>

                    <div className="offer-details">
                      <div className="detail-item">
                        <Clock size={16} />
                        <span>{formatValidityText(offer)}</span>
                      </div>
                      {offer.eligibility?.minimumOrderValue && (
                        <div className="detail-item">
                          <Tag size={16} />
                          <span>
                            Min. Order: ₹
                            {offer.eligibility.minimumOrderValue.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>

                    {offer.eligibility?.targetCustomerTypes && (
                      <div className="target-customers">
                        <span className="target-label">For:</span>
                        <div className="target-icons">
                          {offer.eligibility.targetCustomerTypes.map((type) => {
                            const IconComponent = getCustomerTypeIcon(type);
                            return (
                              <div key={type} className="target-icon">
                                <IconComponent size={16} />
                                <span>{type.replace("_", " ")}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="offer-footer">
                    {!eligibility.eligible && (
                      <div className="ineligibility-reason">
                        <X size={14} />
                        <span>{eligibility.reason}</span>
                      </div>
                    )}
                    <button
                      className={`apply-btn ${eligibility.eligible ? "eligible" : "disabled"}`}
                      onClick={() => handleApplyOffer(offer, false)}
                      disabled={!eligibility.eligible || isApplying}
                    >
                      {isApplying ? (
                        <>
                          <div className="btn-spinner"></div>
                          Applying...
                        </>
                      ) : eligibility.eligible ? (
                        "Apply Offer"
                      ) : (
                        "Not Available"
                      )}
                    </button>
                  </div>
                </motion.div>
              );
            })}

          {/* Supplier Promotions */}
          {(activeTab === "all" || activeTab === "supplier") &&
            supplierPromotions.map((promotion) => {
              const eligibility = checkPromotionEligibility(promotion);
              const isApplying = applyingPromotions.has(promotion._id);

              return (
                <motion.div
                  key={`supplier-${promotion._id}`}
                  className={`offer-card supplier-offer ${!eligibility.eligible ? "ineligible" : ""}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <div className="offer-header">
                    <div className="offer-type">
                      <Store className="type-icon" />
                      <span>Supplier Promotion</span>
                    </div>
                    <div className="offer-discount">
                      {formatDiscountText(promotion)}
                    </div>
                  </div>

                  <div className="offer-content">
                    <h3>{promotion.title}</h3>
                    <p>{promotion.description}</p>

                    <div className="supplier-info">
                      <Building size={16} />
                      <span>
                        By{" "}
                        {promotion.supplier?.companyName || "Verified Supplier"}
                      </span>
                    </div>

                    <div className="offer-details">
                      <div className="detail-item">
                        <Clock size={16} />
                        <span>{formatValidityText(promotion)}</span>
                      </div>
                      {promotion.eligibility?.minimumOrderValue && (
                        <div className="detail-item">
                          <Tag size={16} />
                          <span>
                            Min. Order: ₹
                            {promotion.eligibility.minimumOrderValue.toLocaleString()}
                          </span>
                        </div>
                      )}
                      {promotion.usageLimit && (
                        <div className="detail-item">
                          <Award size={16} />
                          <span>
                            {promotion.usageCount || 0}/{promotion.usageLimit}{" "}
                            used
                          </span>
                        </div>
                      )}
                    </div>

                    {promotion.couponCode && (
                      <div className="coupon-code">
                        <span className="coupon-label">Code:</span>
                        <span className="coupon-value">
                          {promotion.couponCode}
                        </span>
                      </div>
                    )}

                    {promotion.eligibility?.targetCustomerTypes && (
                      <div className="target-customers">
                        <span className="target-label">For:</span>
                        <div className="target-icons">
                          {promotion.eligibility.targetCustomerTypes.map(
                            (type) => {
                              const IconComponent = getCustomerTypeIcon(type);
                              return (
                                <div key={type} className="target-icon">
                                  <IconComponent size={16} />
                                  <span>{type.replace("_", " ")}</span>
                                </div>
                              );
                            }
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="offer-footer">
                    {!eligibility.eligible && (
                      <div className="ineligibility-reason">
                        <X size={14} />
                        <span>{eligibility.reason}</span>
                      </div>
                    )}
                    <button
                      className={`apply-btn ${eligibility.eligible ? "eligible" : "disabled"}`}
                      onClick={() => handleApplyOffer(promotion, true)}
                      disabled={!eligibility.eligible || isApplying}
                    >
                      {isApplying ? (
                        <>
                          <div className="btn-spinner"></div>
                          Applying...
                        </>
                      ) : eligibility.eligible ? (
                        "Apply Promotion"
                      ) : (
                        "Not Available"
                      )}
                    </button>
                  </div>
                </motion.div>
              );
            })}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filteredPromotions.length === 0 && (
        <div className="empty-offers">
          <Gift size={48} />
          <h3>No offers available</h3>
          <p>Check back later for new promotions and exclusive deals!</p>
        </div>
      )}

      {/* Modal for offer details */}
      <AnimatePresence>
        {showModal && selectedOffer && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowModal(false)}
          >
            <motion.div
              className="modal-content"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3>{selectedOffer.title}</h3>
                <button
                  className="modal-close"
                  onClick={() => setShowModal(false)}
                >
                  <X size={20} />
                </button>
              </div>
              <div className="modal-body">
                <p>{selectedOffer.description}</p>
                {/* Add more detailed information here */}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomerOffers;
