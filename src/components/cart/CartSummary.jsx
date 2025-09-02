import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import CouponSuggestions from "./CouponSuggestions";
import AutoCartDistancePricing from "./AutoCartDistancePricing";
import {
  getUserCoins,
  applyCouponToCart,
  removeCouponFromCart,
  applyCoinsToCart,
  removeCoinsFromCart,
} from "../../services/loyaltyService";
import { toast } from "react-hot-toast";
import "./CartSummary.css";
import { useDistancePricing } from "../../hooks/useDistancePricing";
import DistanceCalculator from "../common/DistanceCalculator";
import OptimalSuppliers from "../common/OptimalSuppliers";
import PromotionSuggestions from "./PromotionSuggestions";

const CartSummary = ({ total, itemCount, cart, onCartUpdate }) => {
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(cart?.appliedCoupon || null);
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
const [useAutoDistancePricing, setUseAutoDistancePricing] = useState(true);
const [autoDeliveryCosts, setAutoDeliveryCosts] = useState({});
const [totalAutoDeliveryCost, setTotalAutoDeliveryCost] = useState(0);
  const [coinsToUse, setCoinsToUse] = useState("");
  const [coinsApplied, setCoinsApplied] = useState(cart?.appliedCoins || null);
  const [availableCoins, setAvailableCoins] = useState(0);
  const [isApplyingCoins, setIsApplyingCoins] = useState(false);
  const [showDistanceCalculator, setShowDistanceCalculator] = useState(false);
  const [selectedSuppliers, setSelectedSuppliers] = useState([]);
  const [deliveryInfo, setDeliveryInfo] = useState(null);
  const [useOptimalSuppliers, setUseOptimalSuppliers] = useState(false);
  const [calculatedDeliveryCost, setCalculatedDeliveryCost] = useState(0);

  // ADD THIS HOOK:
  const { userLocation, getCurrentLocation } = useDistancePricing();
  const { user } = useAuth();

  // Load user's available coins
  useEffect(() => {
    const fetchUserCoins = async () => {
      try {
        const coinsData = await getUserCoins();
        setAvailableCoins(coinsData.availableCoins || 0);
      } catch (error) {
        console.error("Error fetching coins:", error);
      }
    };

    if (user) {
      fetchUserCoins();
    }
  }, [user]);

  // Update local state when cart changes
  useEffect(() => {
    // Only show coupon if it has a positive discount
    const validCoupon =
      cart?.appliedCoupon && cart.appliedCoupon.discountAmount > 0;
    setPromoApplied(validCoupon ? cart.appliedCoupon : null);

    setCoinsApplied(cart?.appliedCoins || null);
  }, [cart]);
  // ADD THESE LINES AFTER LINE 48:

  // Use finalAmount from cart if available (includes supplier promotion discount)
  const subtotal = cart?.finalAmount ?? total;
  const couponDiscount =
    promoApplied && promoApplied.discountAmount > 0
      ? promoApplied.discountAmount
      : 0;
  const coinDiscount = coinsApplied ? coinsApplied.discount : 0;
  // REPLACE THIS LINE (around line 50):
  // const deliveryFee = subtotal > 10000 ? 0 : 500;

  // WITH THIS:
  const baseDeliveryFee = subtotal > 10000 ? 0 : 500;
  const totalDeliveryCost = selectedSuppliers.reduce(
    (sum, supplier) => sum + supplier.transportCost,
    0
  );
  const deliveryFee = useAutoDistancePricing && totalAutoDeliveryCost > 0
  ? totalAutoDeliveryCost
  : useOptimalSuppliers && totalDeliveryCost > 0
    ? totalDeliveryCost
    : calculatedDeliveryCost > 0
      ? calculatedDeliveryCost
      : baseDeliveryFee;

  const discountedAmount = subtotal - couponDiscount - coinDiscount;
  const commission = Math.round(Math.max(0, discountedAmount) * 0.05);
  const amountWithCommission = Math.max(0, discountedAmount) + commission;
  const tax = Math.round(amountWithCommission * 0.18);
  // REPLACE LINE 51:
  const finalTotal = amountWithCommission + deliveryFee + tax;

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;

    setIsApplyingPromo(true);

    try {
      const response = await applyCouponToCart(promoCode);
      if (response.success) {
        setPromoApplied({
          code: response.data.couponCode,
          discountAmount: response.data.discountAmount,
        });
        toast.success("Coupon applied successfully!");
        if (onCartUpdate) onCartUpdate();
      } else {
        toast.error(response.message || "Invalid coupon code");
      }
    } catch (error) {
      toast.error(error.message || "Failed to apply coupon");
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const removePromo = async () => {
    try {
      const response = await removeCouponFromCart();
      if (response.success) {
        setPromoApplied(null);
        setPromoCode("");
        toast.success("Coupon removed");
        if (onCartUpdate) onCartUpdate();
      }
    } catch (error) {
      toast.error("Failed to remove coupon");
    }
  };

  const handleApplyCoins = async () => {
    const coins = parseInt(coinsToUse);
    if (!coins || coins <= 0) return;

    if (coins > availableCoins) {
      toast.error(`You only have ${availableCoins} coins available`);
      return;
    }

    setIsApplyingCoins(true);

    try {
      const response = await applyCoinsToCart(coins);
      if (response.success) {
        setCoinsApplied({
          amount: response.data.coinsUsed,
          discount: response.data.coinDiscount,
        });
        setAvailableCoins(response.data.availableCoins);
        toast.success(`${response.data.coinsUsed} coins applied!`);
        if (onCartUpdate) onCartUpdate();
      } else {
        toast.error(response.message || "Failed to apply coins");
      }
    } catch (error) {
      toast.error(error.message || "Failed to apply coins");
    } finally {
      setIsApplyingCoins(false);
    }
  };

  const removeCoins = async () => {
    try {
      const response = await removeCoinsFromCart();
      if (response.success) {
        setCoinsApplied(null);
        setCoinsToUse("");
        toast.success("Coins removed");
        // Refresh available coins
        const coinsData = await getUserCoins();
        setAvailableCoins(coinsData.availableCoins || 0);
        if (onCartUpdate) onCartUpdate();
      }
    } catch (error) {
      toast.error("Failed to remove coins");
    }
  };

const handleAutoDistanceCostsCalculated = (costs) => {
  console.log("🚚 Auto delivery costs calculated:", costs);
  setAutoDeliveryCosts(costs);
  
  const total = Object.values(costs).reduce((sum, supplierCost) => {
    return sum + (supplierCost?.totalCost || 0);
  }, 0);
  
  setTotalAutoDeliveryCost(total);
};

  // ADD THESE FUNCTIONS before the return statement:

  const handleSupplierSelection = (suppliers, consolidationOption) => {
    setSelectedSuppliers(suppliers);
    setDeliveryInfo(consolidationOption);
  };

  // REPLACE your handleDistanceCalculated function with:
  const handleDistanceCalculated = (distanceInfo) => {
    console.log("🔍 FULL DISTANCE CALCULATION DEBUG:");
    console.log("Distance Info:", distanceInfo);
    console.log("Distance value:", distanceInfo?.distance?.value);
    console.log("Zone:", distanceInfo?.pricing?.zone);
    console.log("Transport cost:", distanceInfo?.pricing?.transportCost);
    console.log("Source:", distanceInfo?.distance?.source);

    if (
      distanceInfo &&
      distanceInfo.pricing &&
      typeof distanceInfo.pricing.transportCost === "number"
    ) {
      setCalculatedDeliveryCost(distanceInfo.pricing.transportCost);
    } else {
      setCalculatedDeliveryCost(0);
    }
  };
  // Auto-enable distance calculation if user has items from different suppliers
  useEffect(() => {
    if (cart?.items) {
      const uniqueSuppliers = new Set(
        cart.items.map(
          (item) => item.product?.supplier?._id || item.product?.supplier
        )
      );

      if (uniqueSuppliers.size > 1) {
        setUseOptimalSuppliers(true);
      }
    }
  }, [cart]);
  return (
    <div className="cart-summary">
      <div className="summary-header">
        <h3>Order Summary</h3>
      </div>

      <div className="summary-content">
        {/* Items Summary */}
        <div className="summary-section">
          <div className="summary-row">
            <span>Items ({itemCount})</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
        </div>
        {/* Coupon Suggestions - ADD THIS SECTION */}
        {!promoApplied && !isApplyingPromo && (
          <div className="summary-section">
            <CouponSuggestions
              onCouponApplied={onCartUpdate}
              appliedCoupon={promoApplied}
            />
          </div>
        )}
        <div className="summary-section">
            <PromotionSuggestions
              onPromotionApplied={onCartUpdate}
              appliedPromotion={cart?.appliedSupplierPromotion}
            />
          </div>
        {/* Promo Code Section */}
        <div className="summary-section">
          <div className="promo-code">
            <label>Coupon Code</label>

            {!promoApplied ? (
              <div className="promo-input-group">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  placeholder="Enter coupon code"
                  className="promo-input"
                />
                <button
                  onClick={handleApplyPromo}
                  disabled={!promoCode.trim() || isApplyingPromo}
                  className="btn btn-outline btn-sm"
                >
                  {isApplyingPromo ? "..." : "Apply"}
                </button>
              </div>
            ) : (
              <div className="promo-applied">
                <div className="promo-info">
                  <span className="promo-code-text">{promoApplied.code}</span>
                  <span className="promo-discount">
                    -{formatPrice(promoApplied.discountAmount)}
                  </span>
                </div>
                <button onClick={removePromo} className="remove-promo">
                  ✕
                </button>
              </div>
            )}
          </div>

          {promoApplied && couponDiscount > 0 && (
            <div className="summary-row discount">
              <span>Coupon Discount ({promoApplied.code})</span>
              <span>-{formatPrice(couponDiscount)}</span>
            </div>
          )}
        </div>

        {/* Aggre Coins Section */}
        {availableCoins > 0 && (
          <div className="summary-section">
            <div className="promo-code">
              <label>Aggre Coins (Available: {availableCoins})</label>
              {!coinsApplied ? (
                <div className="promo-input-group">
                  <input
                    type="number"
                    value={coinsToUse}
                    onChange={(e) => setCoinsToUse(e.target.value)}
                    placeholder={`Max ${Math.min(availableCoins, Math.floor(Math.max(0, subtotal - couponDiscount)))}`}
                    min="1"
                    max={Math.min(
                      availableCoins,
                      Math.floor(Math.max(0, subtotal - couponDiscount))
                    )}
                    className="promo-input"
                  />
                  <button
                    onClick={handleApplyCoins}
                    disabled={!coinsToUse || isApplyingCoins}
                    className="btn btn-outline btn-sm"
                  >
                    {isApplyingCoins ? "..." : "Apply"}
                  </button>
                </div>
              ) : (
                <div className="promo-applied">
                  <div className="promo-info">
                    <span className="promo-code-text">
                      {coinsApplied.amount} Coins Used
                    </span>
                    <span className="promo-discount">
                      -{formatPrice(coinsApplied.discount)}
                    </span>
                  </div>
                  <button onClick={removeCoins} className="remove-promo">
                    ✕
                  </button>
                </div>
              )}
            </div>

            {coinsApplied && (
              <div className="summary-row discount">
                <span>Coin Discount ({coinsApplied.amount} coins)</span>
                <span>-{formatPrice(coinDiscount)}</span>
              </div>
            )}
          </div>
        )}
        {/* ADD THIS SECTION AFTER THE AGGRE COINS SECTION */}

        {/* Distance-Based Delivery Options */}

        {/* Distance-Based Delivery Options */}
        {/* Smart Delivery Pricing Section */}
<div className="summary-section">
  <div className="delivery-options">
    <h4 className="delivery-title">🚚 Smart Delivery Pricing</h4>

    {/* Auto Distance Pricing Toggle */}
    <div className="option-toggle">
      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={useAutoDistancePricing}
          onChange={(e) => setUseAutoDistancePricing(e.target.checked)}
        />
        <span>✨ Auto-calculate delivery costs by location</span>
      </label>
    </div>

    {/* Auto Distance Pricing Component */}
    {useAutoDistancePricing && cart?.items?.length > 0 && (
      <AutoCartDistancePricing
        cartItems={cart.items}
        onCostsCalculated={handleAutoDistanceCostsCalculated}
      />
    )}

    {/* Manual Options (when auto is disabled) */}
    {!useAutoDistancePricing && (
      <>
        {!userLocation && (
          <button onClick={getCurrentLocation} className="location-btn">
            📍 Get My Location for Accurate Pricing
          </button>
        )}

        <div className="option-toggle">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={showDistanceCalculator}
              onChange={(e) => setShowDistanceCalculator(e.target.checked)}
            />
            <span>Calculate delivery costs based on distance</span>
          </label>
        </div>

        {cart?.items?.some((item) => item.product?.supplier) && (
          <div className="option-toggle">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={useOptimalSuppliers}
                onChange={(e) => setUseOptimalSuppliers(e.target.checked)}
              />
              <span>Find optimal suppliers by location</span>
            </label>
          </div>
        )}

        {/* Keep existing manual distance calculator and optimal suppliers code here */}
      </>
    )}
  </div>
</div>
        {/* Delivery & Tax */}
        {/* MODIFY THE EXISTING DELIVERY & TAX SECTION */}
        <div className="summary-section">
          <div className="summary-row">
            <span>
              Delivery Fee
              {deliveryFee === 0 && (
                <span className="free-delivery"> (FREE)</span>
              )}
              {/* ADD DISTANCE INFO */}
              {(calculatedDeliveryCost > 0 || totalDeliveryCost > 0) && (
                <span
                  className="distance-info"
                  style={{ fontSize: "12px", color: "#6b7280" }}
                >
                  {useOptimalSuppliers ? " (Distance-based)" : " (Calculated)"}
                </span>
              )}
            </span>
            <span>{deliveryFee === 0 ? "FREE" : formatPrice(deliveryFee)}</span>
          </div>
          <div className="summary-row">
            <span>GST (18%)</span>
            <span>{formatPrice(tax)}</span>
          </div>

          <div className="summary-row">
            <span>Platform Fee (5%)</span>
            <span>{formatPrice(commission)}</span>
          </div>
        </div>
        {/* Total */}
        <div className="summary-section total-section">
          <div className="summary-row total">
            <span>Total Amount</span>
            <span>{formatPrice(finalTotal)}</span>
          </div>
        </div>

        {/* Savings Info */}
        {(couponDiscount > 0 || coinDiscount > 0) && (
          <div className="savings-info">
            🎉 You saved {formatPrice(couponDiscount + coinDiscount)}!
          </div>
        )}

        {/* Checkout Button */}
        <div className="checkout-section">
          <Link to="/checkout" className="btn btn-primary btn-lg checkout-btn">
            Proceed to Checkout
          </Link>

          <div className="secure-checkout">🔒 Secure Checkout</div>
        </div>

        {/* Accepted Payments */}
        <div className="payment-methods">
          <h4>We Accept</h4>
          <div className="payment-icons">
            <span className="payment-icon">💳</span>
            <span className="payment-icon">🏦</span>
            <span className="payment-icon">📱</span>
            <span className="payment-icon">💰</span>
          </div>
          <p>Credit/Debit Cards, Net Banking, UPI, Cash on Delivery</p>
        </div>
      </div>
    </div>
  );
};

export default CartSummary;
