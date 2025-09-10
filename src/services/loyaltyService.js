import axios from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL = 'https://aggrekart-com-backend.onrender.com/api';

// Create axios instance with proper configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor - Use cookies for authentication
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('aggrekart_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('✅ LoyaltyService: Using token from cookies for', config.url);
    } else {
      console.warn('❌ LoyaltyService: No token found in cookies for', config.url);
    }
    return config;
  },
  (error) => {
    console.error('❌ LoyaltyService request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('✅ LoyaltyService response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('❌ LoyaltyService response error:', error);
    
    // Handle authentication errors
    if (error.response?.status === 401) {
      console.warn('🔓 Authentication failed, redirecting to login');
      // Clear invalid token
      Cookies.remove('aggrekart_token');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// Helper function to handle API responses
const handleApiResponse = (response) => {
  if (response.data.success) {
    return response.data.data;
  } else {
    throw new Error(response.data.message || 'API request failed');
  }
};

// Helper function to handle API errors
const handleApiError = (error) => {
  console.error('API Error:', error);
  
  if (error.response?.data?.message) {
    throw new Error(error.response.data.message);
  } else if (error.message) {
    throw new Error(error.message);
  } else {
    throw new Error('An unexpected error occurred');
  }
};

// =============================================================================
// CUSTOMER LOYALTY METHODS
// =============================================================================

// Get user's loyalty dashboard data
export const getUserLoyaltyDashboard = async () => {
  try {
    console.log('🔍 Fetching user loyalty dashboard...');
    const response = await api.get('/loyalty/dashboard');
    return handleApiResponse(response);
  } catch (error) {
    handleApiError(error);
  }
};

// Get user's loyalty history
// Replace line 96 (around line 93-100):

// Get user's loyalty history
export const getUserLoyaltyHistory = async (page = 1, limit = 10) => {
  try {
    console.log('🔍 Fetching user loyalty history...');
    const response = await api.get(`/loyalty/transactions?page=${page}&limit=${limit}`); // Change from /history to /transactions
    console.log('✅ Loyalty history fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching loyalty history:', error);
    throw error;
  }
};
// Get available loyalty programs
export const getAvailableLoyaltyPrograms = async () => {
  try {
    console.log('🔍 Fetching available loyalty programs...');
    const response = await api.get('/loyalty/programs');
    return handleApiResponse(response);
  } catch (error) {
    handleApiError(error);
  }
};
// Add this method after getUserLoyaltyHistory (around line 105)

// Get user's available coupons
export const getUserCoupons = async () => {
  try {
    console.log('🔍 Fetching user coupons...');
    const response = await api.get('/loyalty/coupons');
    return handleApiResponse(response);
  } catch (error) {
    handleApiError(error);
  }
};
// Join a loyalty program
export const joinLoyaltyProgram = async (programId) => {
  try {
    console.log(`🔍 Joining loyalty program: ${programId}`);
    const response = await api.post(`/loyalty/programs/${programId}/join`);
    return handleApiResponse(response);
  } catch (error) {
    handleApiError(error);
  }
};
// Add this method after the getUserCoupons function (around line 130)

// Get coupon suggestions for cart
export const getCouponSuggestions = async () => {
  try {
    console.log('🔍 Fetching coupon suggestions...');
    const response = await api.get('/loyalty/coupon-suggestions');
    return handleApiResponse(response);
  } catch (error) {
    handleApiError(error);
  }
};
// Redeem loyalty coins
export const redeemLoyaltyCoins = async (coinsToRedeem, redeemType, orderTotal) => {
  try {
    console.log('🔍 Redeeming loyalty coins:', { coinsToRedeem, redeemType, orderTotal });
    const response = await api.post('/loyalty/redeem', {
      coinsToRedeem,
      redeemType,
      orderTotal
    });
    return handleApiResponse(response);
  } catch (error) {
    handleApiError(error);
  }
};

export const getUserAchievements = async () => {
  try {
    console.log('🔍 Fetching user achievements...');
    const response = await api.get('/loyalty/achievements');
    console.log('✅ Achievements fetched successfully:', response.data);
    return handleApiResponse(response);
  } catch (error) {
    console.error('❌ Error fetching achievements:', error);
    handleApiError(error);
  }
};

// Get referral stats for user
export const getUserReferralStats = async () => {
  try {
    console.log('🔍 Fetching user referral stats...');
    const response = await api.get('/loyalty/referral-stats');
    return handleApiResponse(response);
  } catch (error) {
    handleApiError(error);
  }
};

// =============================================================================
// ADMIN LOYALTY METHODS
// =============================================================================

// Get admin loyalty dashboard
export const getAdminLoyaltyDashboard = async () => {
  try {
    console.log('🔍 Fetching admin loyalty dashboard...');
    const response = await api.get('/admin-loyalty/dashboard');
    return handleApiResponse(response);
  } catch (error) {
    handleApiError(error);
  }
};

// Get admin referral stats
export const getAdminReferralStats = async () => {
  try {
    console.log('🔍 Fetching admin referral stats...');
    const response = await api.get('/admin-loyalty/referral-stats');
    return handleApiResponse(response);
  } catch (error) {
    handleApiError(error);
  }
};

// Get pending loyalty programs for approval
export const getPendingPrograms = async () => {
  try {
    console.log('🔍 Fetching pending loyalty programs...');
    const response = await api.get('/admin-loyalty/pending-programs');
    return handleApiResponse(response);
  } catch (error) {
    handleApiError(error);
  }
};

// Approve or reject a loyalty program
export const approveLoyaltyProgram = async (programId, action, rejectionReason = '') => {
  try {
    console.log(`🔍 ${action} loyalty program: ${programId}`);
    const response = await api.post(`/admin-loyalty/programs/${programId}/${action}`, {
      rejectionReason
    });
    return handleApiResponse(response);
  } catch (error) {
    handleApiError(error);
  }
};

// Get customer type analytics
export const getCustomerTypeAnalytics = async () => {
  try {
    console.log('🔍 Fetching customer type analytics...');
    const response = await api.get('/admin-loyalty/analytics/customer-types'); // Fixed endpoint
    return handleApiResponse(response);
  } catch (error) {
    handleApiError(error);
  }
};
// Add after line 208 (after getCustomerTypeAnalytics):

// Enhanced customer analytics with filtering and pagination
export const getCustomerAnalytics = async (filters = {}) => {
  try {
    console.log('🔍 Fetching customer analytics with filters:', filters);
    const params = new URLSearchParams();
    
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        params.append(key, filters[key]);
      }
    });
    
    const response = await api.get(`/admin-loyalty/customers?${params.toString()}`);
    return handleApiResponse(response);
  } catch (error) {
    handleApiError(error);
  }
};

// Get individual customer details
export const getCustomerDetails = async (customerId) => {
  try {
    console.log(`🔍 Fetching customer details for: ${customerId}`);
    const response = await api.get(`/admin-loyalty/customers/${customerId}`);
    return handleApiResponse(response);
  } catch (error) {
    handleApiError(error);
  }
};
// Bulk award coins to customers
export const bulkAwardCoins = async (criteria, coins, reason) => {
  try {
    console.log('🔍 Bulk awarding coins:', { criteria, coins, reason });
    const response = await api.post('/admin-loyalty/bulk-award-coins', {
      criteria,
      coins,
      reason
    });
    return handleApiResponse(response);
  } catch (error) {
    handleApiError(error);
  }
};
// Add these methods after the existing bulkAwardCoins method (around line 250)

// Individual award coins to specific customers
export const individualAwardCoins = async (customerIds, coins, reason, notifyCustomer = true) => {
  try {
    console.log('🔍 Individual awarding coins to customers:', customerIds);
    const response = await api.post('/admin-loyalty/individual-award-coins', {
      customerIds,
      coins,
      reason,
      notifyCustomer
    });
    return handleApiResponse(response);
  } catch (error) {
    handleApiError(error);
  }
};

// Search customers for individual awards
export const searchCustomers = async (search = '', customerType = '', membershipTier = '', page = 1, limit = 20) => {
  try {
    console.log('🔍 Searching customers for awards...');
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (customerType) params.append('customerType', customerType);
    if (membershipTier) params.append('membershipTier', membershipTier);
    params.append('page', page);
    params.append('limit', limit);
    
    const response = await api.get(`/admin-loyalty/customer-search?${params.toString()}`);
    return handleApiResponse(response);
  } catch (error) {
    handleApiError(error);
  }
};

// Create a new coupon
export const createCoupon = async (couponData) => {
  try {
    console.log('🔍 Creating new coupon:', couponData);
    const response = await api.post('/admin-loyalty/create-coupon', couponData);
    return handleApiResponse(response);
  } catch (error) {
    handleApiError(error);
  }
};

// Award coupons to specific customers
export const awardCoupons = async (customerIds, couponId, reason, notifyCustomer = true) => {
  try {
    console.log('🔍 Awarding coupons to customers:', customerIds);
    const response = await api.post('/admin-loyalty/award-coupons', {
      customerIds,
      couponId,
      reason,
      notifyCustomer
    });
    return handleApiResponse(response);
  } catch (error) {
    handleApiError(error);
  }
};

// Get available coupons for awarding
export const getAvailableCoupons = async () => {
  try {
    console.log('🔍 Fetching available coupons...');
    const response = await api.get('/admin-loyalty/available-coupons');
    return handleApiResponse(response);
  } catch (error) {
    handleApiError(error);
  }
};

// Create customer type promotion
export const createCustomerTypePromotion = async (promotionData) => {
  try {
    console.log('🔍 Creating customer type promotion:', promotionData);
    const response = await api.post('/admin-loyalty/create-customer-type-promotion', promotionData);
    return handleApiResponse(response);
  } catch (error) {
    handleApiError(error);
  }
};

// Update coin earning rules
export const updateCoinRules = async (rules) => {
  try {
    console.log('🔍 Updating coin rules:', rules);
    const response = await api.post('/admin-loyalty/config/coin-rules', rules);
    return handleApiResponse(response);
  } catch (error) {
    handleApiError(error);
  }
};

// Get all loyalty programs for admin
export const getAllLoyaltyPrograms = async () => {
  try {
    console.log('🔍 Fetching all loyalty programs for admin...');
    const response = await api.get('/admin-loyalty/programs');
    return handleApiResponse(response);
  } catch (error) {
    handleApiError(error);
  }
};
export const getMembershipConfigs = async () => {
  try {
    console.log('🔍 Fetching membership configurations...');
    const response = await api.get('/admin/membership-config');
    return handleApiResponse(response);
  } catch (error) {
    handleApiError(error);
  }
};

// Update membership configuration
export const updateMembershipConfig = async (tier, configData) => {
  try {
    console.log(`🔍 Updating membership config for ${tier}:`, configData);
    const response = await api.put(`/admin/membership-config/${tier}`, configData);
    return handleApiResponse(response);
  } catch (error) {
    handleApiError(error);
  }
};

// Get membership statistics
export const getMembershipStats = async () => {
  try {
    console.log('🔍 Fetching membership statistics...');
    const response = await api.get('/admin/membership-stats');
    return handleApiResponse(response);
  } catch (error) {
    handleApiError(error);
  }
};

// Reset membership configs to defaults
export const resetMembershipConfigsToDefaults = async () => {
  try {
    console.log('🔍 Resetting membership configs to defaults...');
    const response = await api.post('/admin/membership-config/reset-defaults');
    return handleApiResponse(response);
  } catch (error) {
    handleApiError(error);
  }
};

// Get detailed user loyalty data for admin
export const getUserLoyaltyDetails = async (userId) => {
  try {
    console.log(`🔍 Fetching loyalty details for user: ${userId}`);
    const response = await api.get(`/admin-loyalty/user/${userId}/details`);
    return handleApiResponse(response);
  } catch (error) {
    handleApiError(error);
  }
};

// Get loyalty system configuration
export const getLoyaltySystemConfig = async () => {
  try {
    console.log('🔍 Fetching loyalty system configuration...');
    const response = await api.get('/admin-loyalty/config');
    return handleApiResponse(response);
  } catch (error) {
    handleApiError(error);
  }
};

// Update loyalty system configuration
export const updateLoyaltySystemConfig = async (config) => {
  try {
    console.log('🔍 Updating loyalty system configuration:', config);
    const response = await api.put('/admin-loyalty/config', config);
    return handleApiResponse(response);
  } catch (error) {
    handleApiError(error);
  }
};

// Export loyalty data (for reports)
export const exportLoyaltyData = async (format = 'csv', filters = {}) => {
  try {
    console.log('🔍 Exporting loyalty data:', { format, filters });
    const response = await api.post('/admin-loyalty/export', { format, filters }, {
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

// =============================================================================
// SUPPLIER LOYALTY METHODS
// =============================================================================

// Get supplier's loyalty programs
export const getSupplierLoyaltyPrograms = async () => {
  try {
    console.log('🔍 Fetching supplier loyalty programs...');
    const response = await api.get('/supplier-loyalty/programs');
    return handleApiResponse(response);
  } catch (error) {
    handleApiError(error);
  }
};

// Create new loyalty program
export const createLoyaltyProgram = async (programData) => {
  try {
    console.log('🔍 Creating new loyalty program:', programData);
    const response = await api.post('/supplier-loyalty/programs', programData);
    return handleApiResponse(response);
  } catch (error) {
    handleApiError(error);
  }
};

// Update loyalty program
export const updateLoyaltyProgram = async (programId, programData) => {
  try {
    console.log(`🔍 Updating loyalty program: ${programId}`, programData);
    const response = await api.put(`/supplier-loyalty/programs/${programId}`, programData);
    return handleApiResponse(response);
  } catch (error) {
    handleApiError(error);
  }
};

// Delete loyalty program
export const deleteLoyaltyProgram = async (programId) => {
  try {
    console.log(`🔍 Deleting loyalty program: ${programId}`);
    const response = await api.delete(`/supplier-loyalty/programs/${programId}`);
    return handleApiResponse(response);
  } catch (error) {
    handleApiError(error);
  }
};

// Get supplier loyalty dashboard
export const getSupplierLoyaltyDashboard = async () => {
  try {
    console.log('🔍 Fetching supplier loyalty dashboard...');
    const response = await api.get('/supplier-loyalty/dashboard');
    return handleApiResponse(response);
  } catch (error) {
    handleApiError(error);
  }
};
// ADD THESE METHODS BEFORE THE EXPORT SECTION (around line 500):

// Get user's available coins
export const getUserCoins = async () => {
  try {
    console.log('🔍 Fetching user coins...');
    const response = await api.get('/loyalty/coins');
    return handleApiResponse(response);
  } catch (error) {
    handleApiError(error);
  }
};

// Apply coupon to cart
export const applyCouponToCart = async (couponCode) => {
  try {
    console.log('🔍 Applying coupon to cart:', couponCode);
    const response = await api.post('/cart/apply-coupon', { couponCode });
    return response.data; // Return full response for cart operations
  } catch (error) {
    handleApiError(error);
  }
};

// Remove coupon from cart
export const removeCouponFromCart = async () => {
  try {
    console.log('🔍 Removing coupon from cart...');
    const response = await api.post('/cart/remove-coupon');
    return response.data; // Return full response for cart operations
  } catch (error) {
    handleApiError(error);
  }
};

// Apply coins to cart
export const applyCoinsToCart = async (coinsToUse) => {
  try {
    console.log('🔍 Applying coins to cart:', coinsToUse);
    const response = await api.post('/cart/apply-coins', { coinsToUse });
    return response.data; // Return full response for cart operations
  } catch (error) {
    handleApiError(error);
  }
};

// Remove coins from cart
export const removeCoinsFromCart = async () => {
  try {
    console.log('🔍 Removing coins from cart...');
    const response = await api.post('/cart/remove-coins');
    return response.data; // Return full response for cart operations
  } catch (error) {
    handleApiError(error);
  }
};

export const getSupplierPromotions = async (filters = {}) => {
  try {
    console.log('🔍 Fetching supplier promotions...', filters);
    const params = new URLSearchParams();
    
    if (filters.status) params.append('status', filters.status);
    if (filters.type) params.append('type', filters.type);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);
    
    const response = await api.get(`/supplier-loyalty/promotions?${params}`);
    return handleApiResponse(response);
  } catch (error) {
    handleApiError(error);
  }
};

// Create supplier promotion
export const createSupplierPromotion = async (promotionData) => {
  try {
    console.log('🔍 Creating supplier promotion...', promotionData);
    const response = await api.post('/supplier-loyalty/promotions', promotionData);
    return handleApiResponse(response);
  } catch (error) {
    handleApiError(error);
  }
};

// Update supplier promotion
export const updateSupplierPromotion = async (promotionId, promotionData) => {
  try {
    console.log(`🔍 Updating promotion ${promotionId}...`, promotionData);
    const response = await api.put(`/supplier-loyalty/promotions/${promotionId}`, promotionData);
    return handleApiResponse(response);
  } catch (error) {
    handleApiError(error);
  }
};

// Delete supplier promotion
export const deleteSupplierPromotion = async (promotionId) => {
  try {
    console.log(`🔍 Deleting promotion ${promotionId}...`);
    const response = await api.delete(`/supplier-loyalty/promotions/${promotionId}`);
    return handleApiResponse(response);
  } catch (error) {
    handleApiError(error);
  }
};

// Get promotion details
export const getSupplierPromotionDetails = async (promotionId) => {
  try {
    console.log(`🔍 Fetching promotion details for ${promotionId}...`);
    const response = await api.get(`/supplier-loyalty/promotions/${promotionId}`);
    return handleApiResponse(response);
  } catch (error) {
    handleApiError(error);
  }
};

// Toggle promotion status
export const toggleSupplierPromotionStatus = async (promotionId, isActive) => {
  try {
    console.log(`🔍 Toggling promotion ${promotionId} status to ${isActive}...`);
    const response = await api.post(`/supplier-loyalty/promotions/${promotionId}/toggle`, { isActive });
    return handleApiResponse(response);
  } catch (error) {
    handleApiError(error);
  }
};

// Get promotion analytics
export const getSupplierPromotionAnalytics = async (promotionId, dateRange = '30') => {
  try {
    console.log(`🔍 Fetching promotion analytics for ${promotionId}...`);
    const response = await api.get(`/supplier-loyalty/promotions/${promotionId}/analytics?days=${dateRange}`);
    return handleApiResponse(response);
  } catch (error) {
    handleApiError(error);
  }
};

// Get all promotion analytics for supplier
export const getSupplierPromotionsOverview = async (dateRange = '30') => {
  try {
    console.log('🔍 Fetching supplier promotions overview...');
    const response = await api.get(`/supplier-loyalty/promotions-overview?days=${dateRange}`);
    return handleApiResponse(response);
  } catch (error) {
    handleApiError(error);
  }
};

// Get targeting options (cities, customer types, etc.)
export const getTargetingOptions = async () => {
  try {
    console.log('🔍 Fetching targeting options...');
    const response = await api.get('/supplier-loyalty/targeting-options');
    return handleApiResponse(response);
  } catch (error) {
    handleApiError(error);
  }
};

// =============================================================================
// ADMIN LOYALTY METHODS (ADD THESE AFTER EXISTING ADMIN METHODS)
// =============================================================================

// Get all supplier promotions (Admin)
export const getAdminSupplierPromotions = async (filters = {}) => {
  try {
    console.log('🔍 Admin fetching all supplier promotions...', filters);
    const params = new URLSearchParams();
    
    if (filters.status) params.append('status', filters.status);
    if (filters.supplier) params.append('supplier', filters.supplier);
    if (filters.type) params.append('type', filters.type);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);
    
    const response = await api.get(`/admin/supplier-promotions?${params}`);
    return handleApiResponse(response);
  } catch (error) {
    handleApiError(error);
  }
};

// Approve/Reject supplier promotion (Admin)
export const approveSupplierPromotion = async (promotionId, action, reason = '') => {
  try {
    console.log(`🔍 Admin ${action} promotion ${promotionId}...`);
    const response = await api.patch(`/admin/supplier-promotions/${promotionId}/review`, {
      action, // 'approve' or 'reject'
      reason
    });
    return handleApiResponse(response);
  } catch (error) {
    handleApiError(error);
  }
};

// Get supplier promotion statistics (Admin)
export const getAdminPromotionStats = async (dateRange = '30') => {
  try {
    console.log('🔍 Admin fetching promotion statistics...');
    const response = await api.get(`/admin/promotion-stats?days=${dateRange}`);
    return handleApiResponse(response);
  } catch (error) {
    handleApiError(error);
  }
};

// Get customer type analytics (Admin)
export const getAdminCustomerTypeAnalytics = async (dateRange = '30') => {
  try {
    console.log('🔍 Admin fetching customer type analytics...');
    const response = await api.get(`/admin/customer-type-analytics?days=${dateRange}`);
    return handleApiResponse(response);
  } catch (error) {
    handleApiError(error);
  }
};
export const getPersonalizedPromotions = async () => {
  try {
    console.log('🔍 Fetching personalized promotions for customer...');
    const response = await api.get('/customer-promotions/personalized');
    return handleApiResponse(response);
  } catch (error) {
    handleApiError(error);
  }
};

// Get approved supplier promotions for customers
export const getSupplierPromotionsForCustomers = async () => {
  try {
    console.log('🔍 Fetching supplier promotions for customers...');
    const response = await api.get('/customer-promotions/supplier-promotions');
    return handleApiResponse(response);
  } catch (error) {
    handleApiError(error);
  }
};

// Get promotions from a specific supplier
export const getPromotionsBySupplier = async (supplierId) => {
  try {
    console.log(`🔍 Fetching promotions from supplier: ${supplierId}`);
    const response = await api.get(`/customer-promotions/by-supplier/${supplierId}`);
    return handleApiResponse(response);
  } catch (error) {
    handleApiError(error);
  }
};

// Get promotions by customer type
export const getPromotionsByCustomerType = async (customerType, filters = {}) => {
  try {
    console.log(`🔍 Fetching promotions for customer type: ${customerType}`, filters);
    const params = new URLSearchParams();
    
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        params.append(key, filters[key]);
      }
    });
    
    const response = await api.get(`/customer-promotions/by-type/${customerType}${params.toString() ? `?${params.toString()}` : ''}`);
    return handleApiResponse(response);
  } catch (error) {
    handleApiError(error);
  }
};

// Apply supplier promotion to calculate discount
export const applySupplierPromotion = async (promotionData) => {
  try {
    console.log('🔍 Applying supplier promotion:', promotionData);
    const response = await api.post('/customer-promotions/apply-supplier-promotion', promotionData);
    
    console.log('🔍 Raw API response:', response);
    
    if (response.data && response.data.success) {
      console.log('✅ Promotion applied successfully:', response.data.data);
      return response.data.data; // Return the data directly
    } else {
      throw new Error(response.data?.message || 'Failed to apply promotion');
    }
  } catch (error) {
    console.error('❌ Supplier promotion API error:', error);
    
    // Enhanced error handling
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    } else if (error.response?.status === 400) {
      throw new Error('Invalid promotion request. Please check your cart items.');
    } else if (error.response?.status === 404) {
      throw new Error('Promotion not found or no longer available.');
    } else if (error.response?.status === 401) {
      throw new Error('Please login to apply promotions.');
    } else if (error.message) {
      throw new Error(error.message);
    } else {
      throw new Error('Failed to apply promotion. Please try again.');
    }
  }
};

// Get mason exclusive promotions
export const getMasonExclusivePromotions = async () => {
  try {
    console.log('🔍 Fetching mason exclusive promotions...');
    const response = await api.get('/customer-promotions/mason-exclusive');
    return handleApiResponse(response);
  } catch (error) {
    handleApiError(error);
  }
};

// Get builder/contractor exclusive promotions
export const getBuilderExclusivePromotions = async () => {
  try {
    console.log('🔍 Fetching builder/contractor exclusive promotions...');
    const response = await api.get('/customer-promotions/builder-exclusive');
    return handleApiResponse(response);
  } catch (error) {
    handleApiError(error);
  }
};

// Get all available promotions for customer (combined loyalty + supplier promotions)
export const getAllCustomerPromotions = async () => {
  try {
    console.log('🔍 Fetching all customer promotions (loyalty + supplier)...');
    
    // Fetch both personalized and supplier promotions concurrently
    const [personalizedResponse, supplierResponse] = await Promise.allSettled([
      api.get('/customer-promotions/personalized'),
      api.get('/customer-promotions/supplier-promotions')
    ]);

    const result = {
      loyaltyPromotions: [],
      supplierPromotions: [],
      totalCount: 0,
      error: null
    };

    // Handle personalized (loyalty) promotions
    if (personalizedResponse.status === 'fulfilled' && personalizedResponse.value.data.success) {
      result.loyaltyPromotions = personalizedResponse.value.data.data.customerTypePromotions || [];
    } else if (personalizedResponse.status === 'rejected') {
      console.warn('Failed to fetch loyalty promotions:', personalizedResponse.reason);
    }

    // Handle supplier promotions
    if (supplierResponse.status === 'fulfilled' && supplierResponse.value.data.success) {
      result.supplierPromotions = supplierResponse.value.data.data.allPromotions || [];
    } else if (supplierResponse.status === 'rejected') {
      console.warn('Failed to fetch supplier promotions:', supplierResponse.reason);
    }

    result.totalCount = result.loyaltyPromotions.length + result.supplierPromotions.length;
    
    console.log(`✅ Fetched ${result.totalCount} total promotions (${result.loyaltyPromotions.length} loyalty, ${result.supplierPromotions.length} supplier)`);
    
    return result;
  } catch (error) {
    console.error('❌ Error fetching all customer promotions:', error);
    throw error;
  }
};

// Create system-wide promotion (Admin)
export const createSystemPromotion = async (promotionData) => {
  try {
    console.log('🔍 Admin creating system promotion...', promotionData);
    const response = await api.post('/admin/system-promotions', promotionData);
    return handleApiResponse(response);
  } catch (error) {
    handleApiError(error);
  }
};
const getPendingPromotions = async () => {
  try {
    console.log('🔍 Fetching pending promotions...');
    const response = await api.get('/admin-loyalty/pending-promotions');
    console.log('✅ Pending promotions fetched:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Get pending promotions failed:', error);
    throw error;
  }
};

// Approve a supplier promotion
const approvePromotion = async (promotionId, notes = '') => {
  try {
    console.log('🔍 Approving promotion:', promotionId);
    const response = await api.post(`/admin-loyalty/promotions/${promotionId}/approve`, {
      notes
    });
    console.log('✅ Promotion approved:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Approve promotion failed:', error);
    throw error;
  }
};

// Reject a supplier promotion
const rejectPromotion = async (promotionId, reason) => {
  try {
    console.log('🔍 Rejecting promotion:', promotionId);
    const response = await api.post(`/admin-loyalty/promotions/${promotionId}/reject`, {
      reason
    });
    console.log('✅ Promotion rejected:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Reject promotion failed:', error);
    throw error;
  }
};

// Get promotions overview
const getPromotionsOverview = async () => {
  try {
    console.log('🔍 Fetching promotions overview...');
    const response = await api.get('/admin-loyalty/promotions-overview');
    console.log('✅ Promotions overview fetched:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Get promotions overview failed:', error);
    throw error;
  }
};
export const getCouponAnalytics = async () => {
  try {
    console.log('🔍 Fetching coupon analytics...');
    const response = await api.get('/admin-loyalty/coupon-analytics');
    return handleApiResponse(response);
  } catch (error) {
    handleApiError(error);
  }
};

// Get detailed usage information for a specific coupon
export const getCouponUsageDetails = async (couponId, page = 1, limit = 20) => {
  try {
    console.log(`🔍 Fetching coupon usage details for: ${couponId}`);
    const response = await api.get(`/admin-loyalty/coupon/${couponId}/usage-details?page=${page}&limit=${limit}`);
    return handleApiResponse(response);
  } catch (error) {
    handleApiError(error);
  }
};

// Get coupon usage summary by different dimensions
export const getCouponUsageSummary = async (period = '30d', groupBy = 'tier') => {
  try {
    console.log(`🔍 Fetching coupon usage summary: ${period}, groupBy: ${groupBy}`);
    const response = await api.get(`/admin-loyalty/coupon-usage-summary?period=${period}&groupBy=${groupBy}`);
    return handleApiResponse(response);
  } catch (error) {
    handleApiError(error);
  }
};

// Export coupon analytics data
export const exportCouponAnalytics = async (format = 'csv') => {
  try {
    console.log(`🔍 Exporting coupon analytics in ${format} format...`);
    const response = await api.get(`/admin-loyalty/coupon-analytics/export?format=${format}`, {
      responseType: 'blob'
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `coupon-analytics-${new Date().toISOString().split('T')[0]}.${format}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    return { success: true, message: 'Export downloaded successfully' };
  } catch (error) {
    handleApiError(error);
  }
};
// Add before the export section (around line 1000)

// User Frequency Tracking Methods
const getUserCouponFrequency = async (filters = {}) => {
  try {
    console.log('🔍 Getting user coupon frequency data with filters:', filters);
    const response = await api.get('/admin-loyalty/user-coupon-frequency', {
      params: filters
    });
    console.log('✅ User frequency data loaded successfully');
    return response.data;
  } catch (error) {
    console.error('❌ Error getting user coupon frequency:', error);
    throw error;
  }
};

const getUserCouponHistory = async (userId) => {
  try {
    console.log('🔍 Getting user coupon history for user:', userId);
    const response = await api.get(`/admin-loyalty/user/${userId}/coupon-history`);
    console.log('✅ User coupon history loaded successfully');
    return response.data;
  } catch (error) {
    console.error('❌ Error getting user coupon history:', error);
    throw error;
  }
};

const exportUserFrequencyData = async (filters = {}) => {
  try {
    console.log('📊 Exporting user frequency data with filters:', filters);
    const response = await api.get('/admin-loyalty/user-coupon-frequency/export', {
      params: filters,
      responseType: 'blob'
    });

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `user-frequency-data-${timestamp}.csv`);
    
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    console.log('✅ User frequency data exported successfully');
    return response;
  } catch (error) {
    console.error('❌ Error exporting user frequency data:', error);
    throw error;
  }
};
// ...existing code... (add this function after createCustomerTypePromotion, around line 367)

// Create customer type promotion


// CREATE SUPPLIER PROMOTION AS ADMIN - ADD THIS NEW FUNCTION:
export const createSupplierPromotionAsAdmin = async (promotionData) => {
  try {
    console.log('🔍 Creating supplier promotion as admin:', promotionData);
    const response = await api.post('/admin/supplier-promotions/create', promotionData);
    return handleApiResponse(response);
  } catch (error) {
    handleApiError(error);
  }
};
// Add this method after getMembershipStats() around line 418:

// Get approved suppliers for promotions
export const getApprovedSuppliers = async (limit = 100) => {
  try {
    console.log('🔍 Fetching approved suppliers for promotions...');
    const response = await api.get(`/admin/suppliers?status=approved&limit=${limit}`);
    return handleApiResponse(response);
  } catch (error) {
    handleApiError(error);
  }
};

// Add this method after the getCouponSuggestions method (around line 580)

// Get promotion suggestions for cart
export const getPromotionSuggestions = async () => {
  try {
    console.log('🔍 Fetching promotion suggestions...');
    const response = await api.get('/customer-promotions/promotion-suggestions');
    console.log('✅ Promotion suggestions received:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('❌ Error fetching promotion suggestions:', error);
    handleApiError(error);
  }
};

// Apply promotion to cart
export const applyPromotionToCart = async (promotionData) => {
  try {
    console.log('🔍 Applying promotion to cart:', promotionData);
    
    // Extract required fields from the promotion data
    const requestBody = {
      promotionId: promotionData._id || promotionData.promotionId,
      discountAmount: promotionData.savings || 0,
      title: promotionData.title || 'Promotion',
      supplier: promotionData.supplier || 'Unknown Supplier'
    };
    
    console.log('📤 Sending promotion application:', requestBody);
    const response = await api.post('/cart/apply-supplier-promotion', requestBody);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};
// Remove promotion from cart
export const removePromotionFromCart = async () => {
  try {
    console.log('🔍 Removing promotion from cart...');
    const response = await api.delete('/cart/remove-supplier-promotion');
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};
export const getUserMembershipProgress = async () => {
  try {
    console.log('🔍 Fetching user membership progress...');
    const response = await api.get('/loyalty/membership/progress');
    return handleApiResponse(response);
  } catch (error) {
    handleApiError(error);
  }
};

const loyaltyService = {
  getUserMembershipProgress, 
  getPromotionSuggestions,
  applyPromotionToCart,
  removePromotionFromCart,
  // Customer methods
  getUserLoyaltyDashboard,
  getUserLoyaltyHistory,
  getAvailableLoyaltyPrograms,
  joinLoyaltyProgram,
  redeemLoyaltyCoins,
  getUserReferralStats,
  getPersonalizedPromotions,
  getSupplierPromotionsForCustomers,
  getPromotionsBySupplier,
  getPromotionsByCustomerType,
  applySupplierPromotion,
  getMasonExclusivePromotions,
  getBuilderExclusivePromotions,
  getAllCustomerPromotions,
  // Admin methods
   getAdminSupplierPromotions,
  approveSupplierPromotion,
  getAdminPromotionStats,
  getAdminCustomerTypeAnalytics,
  createSystemPromotion,
  getAdminLoyaltyDashboard,
  getAdminReferralStats,
  getPendingPrograms,
  approveLoyaltyProgram,
  getCustomerTypeAnalytics,
  bulkAwardCoins,
  
  updateCoinRules,
  getAllLoyaltyPrograms,
  getUserLoyaltyDetails,
  getLoyaltySystemConfig,
  updateLoyaltySystemConfig,
  exportLoyaltyData,
  individualAwardCoins, // New method
  searchCustomers, // New method
  createCoupon, // New method
  awardCoupons, // New method
  getAvailableCoupons, // New method
  getUserCoupons, // New method
  getPendingPromotions,
  approvePromotion,
  rejectPromotion,
  getPromotionsOverview,
  getCouponSuggestions,
  // Supplier methods
  getApprovedSuppliers, // ADD THIS LINE
  getCouponAnalytics,
  getCouponUsageDetails,
  getCouponUsageSummary,
  exportCouponAnalytics,
  getSupplierPromotions,
  createSupplierPromotion,
  updateSupplierPromotion,
  deleteSupplierPromotion,
  getSupplierPromotionDetails,
  toggleSupplierPromotionStatus,
  getSupplierPromotionAnalytics,
  getSupplierPromotionsOverview,
  getTargetingOptions,
  getSupplierLoyaltyPrograms,
  createLoyaltyProgram,
  updateLoyaltyProgram,
  deleteLoyaltyProgram,
  getSupplierLoyaltyDashboard,
  getCustomerAnalytics,        // Add this new method
getCustomerDetails,
getUserAchievements, // Add this line
// ADD THESE TO THE EXPORT SECTION:
createCustomerTypePromotion,
  createSupplierPromotionAsAdmin, // ADD THIS LINE
getUserCouponFrequency,
  getUserCouponHistory,
  exportUserFrequencyData,
   getMembershipConfigs,
  updateMembershipConfig,
  getMembershipStats,
  resetMembershipConfigsToDefaults,
  getUserCoins, // Add this
  applyCouponToCart, // Add this
  removeCouponFromCart, // Add this
  applyCoinsToCart, // Add this
  removeCoinsFromCart, // Add this
};

export default loyaltyService;