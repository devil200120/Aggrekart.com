import { useState, useCallback, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import loyaltyService from '../services/loyaltyService';
import { toast } from 'react-hot-toast';

export const usePromotions = () => {
  const [promotions, setPromotions] = useState({
    loyalty: [],
    supplier: [],
    loading: true,
    error: null
  });
  
  const [applyingPromotions, setApplyingPromotions] = useState(new Set());
  const { total, items, finalAmount } = useCart();
  const { user } = useAuth();

  // Fetch all promotions
  const fetchPromotions = useCallback(async () => {
    try {
      setPromotions(prev => ({ ...prev, loading: true, error: null }));
      
      const result = await loyaltyService.getAllCustomerPromotions();
      
      setPromotions({
        loyalty: result.loyaltyPromotions || [],
        supplier: result.supplierPromotions || [],
        loading: false,
        error: null
      });
      
      return result;
    } catch (error) {
      setPromotions(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to load promotions'
      }));
      throw error;
    }
  }, []);

  // Apply promotion with comprehensive validation
  const applyPromotion = useCallback(async (promotion, isSupplierPromotion = false) => {
    // Validation checks
    if (!items || items.length === 0) {
      toast.error("Please add items to your cart before applying promotions");
      return { success: false, error: 'Cart is empty' };
    }

    const orderValue = finalAmount || total || 0;
    if (orderValue <= 0) {
      toast.error("Cart is empty. Please add items before applying promotions");
      return { success: false, error: 'Invalid order value' };
    }

    // Check minimum order requirements
    if (promotion.eligibility?.minimumOrderValue && orderValue < promotion.eligibility.minimumOrderValue) {
      const errorMsg = `Minimum order value of ₹${promotion.eligibility.minimumOrderValue.toLocaleString()} required`;
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    }

    // Set loading state
    setApplyingPromotions(prev => new Set([...prev, promotion._id]));

    try {
      let result;
      
      if (isSupplierPromotion) {
        result = await loyaltyService.applySupplierPromotion({
          promotionId: promotion._id,
          orderValue,
          items: items.map(item => ({
            productId: item.product._id,
            quantity: item.quantity,
            unitPrice: item.price,
            categoryId: item.product.category
          }))
        });

        if (result?.success) {
          const { data: promotionData } = result;
          
          // Store promotion details
          const appliedPromotion = {
            promotionId: promotion._id,
            title: promotion.title,
            discountAmount: promotionData.savings,
            finalAmount: promotionData.finalAmount,
            supplier: promotionData.promotion.supplier,
            couponCode: promotionData.couponCode,
            appliedAt: new Date().toISOString(),
            type: 'supplier'
          };

          sessionStorage.setItem('appliedSupplierPromotion', JSON.stringify(appliedPromotion));

          // Success notification
          toast.success(
            `🎉 Promotion Applied Successfully!\n` +
            `💰 You'll save: ₹${promotionData.savings.toLocaleString()}\n` +
            `🏷️ Final amount: ₹${promotionData.finalAmount.toLocaleString()}\n` +
            `🏪 From: ${promotionData.promotion.supplier}` +
            (promotionData.couponCode ? `\n📋 Coupon: ${promotionData.couponCode}` : ''),
            { 
              duration: 5000,
              position: 'top-center'
            }
          );

          return { success: true, data: appliedPromotion };
        }
      } else {
        // Loyalty program promotion
        const response = await fetch("/api/customer-promotions/apply", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            promotionId: promotion.id,
            orderValue,
            items: items.map(item => ({
              productId: item.product._id,
              quantity: item.quantity,
              unitPrice: item.price
            }))
          }),
        });

        const data = await response.json();

        if (data.success) {
          const appliedPromotion = {
            promotionId: promotion.id,
            title: promotion.title,
            discountAmount: data.data.discountAmount,
            appliedAt: new Date().toISOString(),
            type: 'loyalty'
          };

          sessionStorage.setItem('appliedLoyaltyPromotion', JSON.stringify(appliedPromotion));

          toast.success(
            `🎉 Loyalty Offer Applied!\n💰 You'll save: ₹${data.data.discountAmount.toLocaleString()}`,
            { duration: 4000, position: 'top-center' }
          );

          return { success: true, data: appliedPromotion };
        } else {
          throw new Error(data.message || 'Failed to apply offer');
        }
      }
      
      throw new Error(result?.message || 'Failed to apply promotion');
      
    } catch (error) {
      const errorMessage = error.message || error.response?.data?.message || 'Error applying promotion';
      toast.error(`❌ ${errorMessage}`, { duration: 4000, position: 'top-center' });
      return { success: false, error: errorMessage };
    } finally {
      setApplyingPromotions(prev => {
        const newSet = new Set(prev);
        newSet.delete(promotion._id);
        return newSet;
      });
    }
  }, [items, finalAmount, total]);

  // Check promotion eligibility
  const checkEligibility = useCallback((promotion) => {
    if (!user) return { eligible: false, reason: "Please login to view promotions" };
    
    const orderValue = finalAmount || total || 0;
    const cartItemCount = items?.length || 0;

    // Check minimum order value
    if (promotion.eligibility?.minimumOrderValue && orderValue < promotion.eligibility.minimumOrderValue) {
      return { 
        eligible: false, 
        reason: `Minimum order: ₹${promotion.eligibility.minimumOrderValue.toLocaleString()}` 
      };
    }

    // Check customer type eligibility
    if (promotion.eligibility?.targetCustomerTypes && 
        !promotion.eligibility.targetCustomerTypes.includes(user.customerType) &&
        !promotion.eligibility.targetCustomerTypes.includes('all')) {
      return { eligible: false, reason: "Not eligible for your customer type" };
    }

    // Check if cart is empty
    if (cartItemCount === 0) {
      return { eligible: false, reason: "Add items to cart to apply" };
    }

    return { eligible: true, reason: "" };
  }, [user, finalAmount, total, items]);

  // Get applied promotions from session storage
  const getAppliedPromotions = useCallback(() => {
    const supplierPromo = sessionStorage.getItem('appliedSupplierPromotion');
    const loyaltyPromo = sessionStorage.getItem('appliedLoyaltyPromotion');
    
    return {
      supplier: supplierPromo ? JSON.parse(supplierPromo) : null,
      loyalty: loyaltyPromo ? JSON.parse(loyaltyPromo) : null
    };
  }, []);

  // Clear applied promotions
  const clearAppliedPromotions = useCallback(() => {
    sessionStorage.removeItem('appliedSupplierPromotion');
    sessionStorage.removeItem('appliedLoyaltyPromotion');
  }, []);

  // Load promotions on hook initialization
  useEffect(() => {
    fetchPromotions();
  }, [fetchPromotions]);

  return {
    promotions,
    applyingPromotions,
    fetchPromotions,
    applyPromotion,
    checkEligibility,
    getAppliedPromotions,
    clearAppliedPromotions,
    isLoading: promotions.loading,
    error: promotions.error
  };
};

export default usePromotions;