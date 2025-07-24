import axios from 'axios'
import Cookies from 'js-cookie'

// Determine the API base URL based on environment
const getApiBaseUrl = () => {
  // Production environment detection
  if (import.meta.env.PROD) {
    // Use environment variable for production API URL
    return import.meta.env.VITE_API_URL || 'https://your-backend-app-name.onrender.com/api'
  }
  
  // Development environment - use proxy
  return '/api'
}

// Create axios instance with dynamic base URL
const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 30000, // Increased timeout for Render cold starts
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('aggrekart_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // Add production environment headers
    if (import.meta.env.PROD) {
      config.headers['X-Requested-With'] = 'XMLHttpRequest'
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Handle network errors (common in production)
    if (error.code === 'NETWORK_ERROR' || error.code === 'ECONNABORTED') {
      console.error('Network error:', error.message)
      return Promise.reject(new Error('Network connection failed. Please check your internet connection.'))
    }
    
    if (error.response?.status === 401) {
      // Unauthorized - remove token and redirect to login
      Cookies.remove('aggrekart_token')
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/auth/login')) {
        window.location.href = '/auth/login'
      }
    }
    
    return Promise.reject(error)
  }
)

// ...existing code...
// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - remove token and redirect to login
      Cookies.remove('aggrekart_token')
      window.location.href = '/auth/login'
    }
    return Promise.reject(error)
  }
)

// Auth API endpoints - Following your backend routes
export const authAPI = {
  // POST /api/auth/register
  register: (userData) => api.post('/auth/register', userData),
  
  // POST /api/auth/login  
  login: (credentials) => api.post('/auth/login', credentials),
  
  // GET /api/auth/me
  getMe: () => api.get('/auth/me'),


  // WhatsApp Registration - ADDED
  sendOTP: (data) => api.post('/auth/send-otp', data),
  verifyOTP: (data) => api.post('/auth/verify-otp', data),
  whatsappRegister: (userData) => api.post('/auth/whatsapp-register', userData),
  
  // POST /api/auth/logout
  logout: () => api.post('/auth/logout'),
  
  completeRegistration: (data) => api.post('/auth/complete-registration', data),
  
  // POST /api/auth/verify-phone
  verifyPhone: (data) => api.post('/auth/verify-phone', data),
  
  // POST /api/auth/verify-email
  verifyEmail: (data) => api.post('/auth/verify-email', data),
  
  // POST /api/auth/resend-otp
  resendOTP: (data) => api.post('/auth/resend-otp', data),
  
  // POST /api/auth/forgot-password
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  
  // POST /api/auth/reset-password
  resetPassword: (data) => api.post('/auth/reset-password', data),
  
  // POST /api/auth/change-password
  changePassword: (data) => api.post('/auth/change-password', data),
  
  // POST /api/auth/refresh-token
  refreshToken: () => api.post('/auth/refresh-token'),
  
  // POST /api/auth/enable-2fa
  enable2FA: () => api.post('/auth/enable-2fa'),
  
  // POST /api/auth/verify-2fa
  verify2FA: (data) => api.post('/auth/verify-2fa', data),
  
  // POST /api/auth/disable-2fa
  disable2FA: (data) => api.post('/auth/disable-2fa', data),
}


// Products API - Following your backend routes
export const productsAPI = {
  // GET /api/products/categories
  getCategories: () => api.get('/products/categories'),
  
  // GET /api/products
  getProducts: (params) => api.get('/products', { params }),
  
  // GET /api/products/:productId
  getProduct: (productId) => api.get(`/products/${productId}`),
  
  // POST /api/products/:productId/reviews
  addReview: (productId, reviewData) => api.post(`/products/${productId}/reviews`, reviewData),
  
  // GET /api/products/:productId/reviews
  getReviews: (productId, params) => api.get(`/products/${productId}/reviews`, { params }),
  
  // GET /api/products/search
  searchProducts: (params) => api.get('/products/search', { params }),
  
  // GET /api/products/recommendations
  getRecommendations: (params) => api.get('/products/recommendations', { params }),
}

// Cart API - Following your backend routes
export const cartAPI = {
  // GET /api/cart
  getCart: () => api.get('/cart'),
  
  // POST /api/cart/items
  addToCart: (itemData) => api.post('/cart/items', itemData),
  
  // PUT /api/cart/items/:itemId
  updateCartItem: (itemId, data) => api.put(`/cart/items/${itemId}`, data),
  
  // DELETE /api/cart/items/:itemId
  removeFromCart: (itemId) => api.delete(`/cart/items/${itemId}`),
  
  // DELETE /api/cart
  clearCart: () => api.delete('/cart'),
  
  // POST /api/cart/validate
  validateCart: () => api.post('/cart/validate'),
  
  // POST /api/cart/apply-coupon
  applyCoupon: (couponCode) => api.post('/cart/apply-coupon', { couponCode }),
  
  // DELETE /api/cart/remove-coupon
  removeCoupon: () => api.delete('/cart/remove-coupon'),
}

// Wishlist API endpoints
export const wishlistAPI = {
  // GET /api/wishlist
  getWishlist: () => api.get('/wishlist'),
  
  // POST /api/wishlist/add
  addToWishlist: (productId) => api.post('/wishlist/add', { productId }),
  
  // DELETE /api/wishlist/remove/:productId
  removeFromWishlist: (productId) => api.delete(`/wishlist/remove/${productId}`),
  
  // DELETE /api/wishlist/clear
  clearWishlist: () => api.delete('/wishlist/clear'),
  
  // POST /api/wishlist/move-to-cart/:productId
  moveToCart: (productId) => api.post(`/wishlist/move-to-cart/${productId}`),
  
  // POST /api/wishlist/bulk-add
  bulkAddToWishlist: (productIds) => api.post('/wishlist/bulk-add', { productIds }),
  
  // POST /api/wishlist/bulk-move-to-cart
  bulkMoveToCart: (productIds) => api.post('/wishlist/bulk-move-to-cart', { productIds }),
}

// Orders API - Following your backend routes
export const ordersAPI = {
  // POST /api/orders/checkout
  checkout: (orderData) => api.post('/orders/checkout', orderData),
  
  // GET /api/orders
  getOrders: (params) => api.get('/orders', { params }),
  
  // GET /api/orders/:orderId
  getOrder: (orderId) => api.get(`/orders/${orderId}`),
  
  // PUT /api/orders/:orderId/cancel
  cancelOrder: (orderId, data) => api.put(`/orders/${orderId}/cancel`, data),
  
  // PUT /api/orders/:orderId/modify
  modifyOrder: (orderId, data) => api.put(`/orders/${orderId}/modify`, data),
  
  // POST /api/orders/:orderId/track
  trackOrder: (orderId) => api.post(`/orders/${orderId}/track`),
  
  // POST /api/orders/:orderId/review
  reviewOrder: (orderId, reviewData) => api.post(`/orders/${orderId}/review`, reviewData),
  
  // GET /api/orders/history
  getOrderHistory: (params) => api.get('/orders/history', { params }),
  
}

// Payment API - Razorpay Integration
export const paymentsAPI = {
  // POST /api/payments/create-order
  createPaymentOrder: (orderData) => api.post('/payments/create-order', orderData),
  
  // POST /api/payments/verify
  verifyPayment: (paymentData) => api.post('/payments/verify', paymentData),
  
  // GET /api/payments/status/:orderId
  getPaymentStatus: (orderId) => api.get(`/payments/status/${orderId}`),
  
  // POST /api/payments/refund/:orderId
  processRefund: (orderId, refundData) => api.post(`/payments/refund/${orderId}`, refundData),
  
  // GET /api/payments/methods
  getPaymentMethods: () => api.get('/payments/methods'),
  
  // GET /api/payments/history
  getPaymentHistory: (params) => api.get('/payments/history', { params }),
  
  // POST /api/payments/save-method
  savePaymentMethod: (methodData) => api.post('/payments/save-method', methodData),
  
  // DELETE /api/payments/remove-method/:methodId
  removePaymentMethod: (methodId) => api.delete(`/payments/remove-method/${methodId}`),
}

// Users API - Enhanced for Settings functionality
export const usersAPI = {
  // GET /api/users/profile
  getProfile: () => api.get('/users/profile'),
  
  // PUT /api/users/profile
  updateProfile: (data) => api.put('/users/profile', data),
  
  // GET /api/users/addresses
  getAddresses: () => api.get('/users/addresses'),
  
  // POST /api/users/addresses
  addAddress: (addressData) => api.post('/users/addresses', addressData),
  
  // PUT /api/users/addresses/:addressId
  updateAddress: (addressId, data) => api.put(`/users/addresses/${addressId}`, data),
  
  // DELETE /api/users/addresses/:addressId
  deleteAddress: (addressId) => api.delete(`/users/addresses/${addressId}`),
  
  // GET /api/users/dashboard
  getDashboard: () => api.get('/users/dashboard'),
  
  // PUT /api/users/preferences - Enhanced for comprehensive settings
  updatePreferences: (data) => api.put('/users/preferences', data),
  
  // GET /api/users/preferences
  getPreferences: () => api.get('/users/preferences'),
  
  // POST /api/users/deactivate
  deactivateAccount: (data) => api.post('/users/deactivate', data),
  
  // POST /api/users/delete-account
  deleteAccount: (data) => api.post('/users/delete-account', data),
  
  // POST /api/users/export-data
  exportUserData: () => api.post('/users/export-data'),
  
  // GET /api/users/export-data/status/:requestId
  getExportStatus: (requestId) => api.get(`/users/export-data/status/${requestId}`),
  
  // GET /api/users/download-data/:exportId
  downloadUserData: (exportId) => api.get(`/users/download-data/${exportId}`, { responseType: 'blob' }),
  
  // GET /api/users/privacy-settings
  getPrivacySettings: () => api.get('/users/privacy-settings'),
  
  // PUT /api/users/privacy-settings
  updatePrivacySettings: (data) => api.put('/users/privacy-settings', data),
  
  // GET /api/users/notification-settings
  getNotificationSettings: () => api.get('/users/notification-settings'),
  
  // PUT /api/users/notification-settings
  updateNotificationSettings: (data) => api.put('/users/notification-settings', data),
  
  // GET /api/users/security-logs
  getSecurityLogs: (params) => api.get('/users/security-logs', { params }),
  
  // GET /api/users/active-sessions
  getActiveSessions: () => api.get('/users/active-sessions'),
  
  // DELETE /api/users/sessions/:sessionId
  terminateSession: (sessionId) => api.delete(`/users/sessions/${sessionId}`),
  
  // DELETE /api/users/sessions/all
  terminateAllSessions: () => api.delete('/users/sessions/all'),
  
  // GET /api/users/membership
  getMembershipDetails: () => api.get('/users/membership'),
  
  // POST /api/users/membership/upgrade
  upgradeMembership: (data) => api.post('/users/membership/upgrade', data),
  getAnalytics: (params) => api.get('/users/analytics', { params }),

}

// Notifications API
export const notificationsAPI = {
  // GET /api/notifications
  getNotifications: (params) => api.get('/notifications', { params }),
  
  // PUT /api/notifications/:notificationId/read
  markAsRead: (notificationId) => api.put(`/notifications/${notificationId}/read`),
  
  // PUT /api/notifications/mark-all-read
  markAllAsRead: () => api.put('/notifications/mark-all-read'),
  
  // DELETE /api/notifications/:notificationId
  deleteNotification: (notificationId) => api.delete(`/notifications/${notificationId}`),
  
  // DELETE /api/notifications/clear-all
  clearAllNotifications: () => api.delete('/notifications/clear-all'),
  
  // GET /api/notifications/settings
  getNotificationSettings: () => api.get('/notifications/settings'),
  
  // PUT /api/notifications/settings
  updateNotificationSettings: (data) => api.put('/notifications/settings', data),
  
  // POST /api/notifications/test
  sendTestNotification: (type) => api.post('/notifications/test', { type }),
}

// Suppliers API - Following your backend routes
export const suppliersAPI = {
  register: (supplierData) => api.post('/suppliers/register-new', supplierData),
  
  // POST /api/suppliers/register (for existing users to become suppliers)
  registerExistingUser: (supplierData) => api.post('/suppliers/register', supplierData),
  
  // GET /api/suppliers/profile
  getProfile: () => api.get('/suppliers/profile'),
  
  // PUT /api/suppliers/profile
  updateProfile: (data) => api.put('/suppliers/profile', data),
  
  // GET /api/suppliers/dashboard
  getDashboard: () => api.get('/suppliers/dashboard'),
  
  // GET /api/suppliers/nearby
  getNearbySuppliers: (params) => api.get('/suppliers/nearby', { params }),
  
  // GET /api/suppliers/:supplierId/details
  getSupplierDetails: (supplierId) => api.get(`/suppliers/${supplierId}/details`),
  
  // GET /api/suppliers/search
  searchSuppliers: (params) => api.get('/suppliers/search', { params }),
}

// Supplier API - For authenticated suppliers
export const supplierAPI = {
  // Get supplier dashboard data
  getProfile: () => api.get('/suppliers/profile'),
  updateProfile: (data) => api.put('/suppliers/profile', data),
  getDashboard: () => api.get('/suppliers/dashboard'),
  getNearbySuppliers: (params) => api.get('/suppliers/nearby', { params }),
  getSupplierDetails: (supplierId) => api.get(`/suppliers/${supplierId}/details`),
  searchSuppliers: (params) => api.get('/suppliers/search', { params }),
  register: (supplierData) => api.post('/suppliers/register-new', supplierData),
  registerExistingUser: (supplierData) => api.post('/suppliers/register', supplierData),

  
  // Get supplier statistics
  getStats: () => api.get('/supplier/stats'),
  
  // Get supplier's products with filtering
  getProducts: (params) => api.get('/supplier/products', { params }),
  
  // Add a new product
  addProduct: (productData) => api.post('/supplier/products', productData),
  
  // Update existing product
  updateProduct: (productId, data) => api.put(`/supplier/products/${productId}`, data),
  
  // Delete a product
  deleteProduct: (productId) => api.delete(`/supplier/products/${productId}`),
  
  // Get orders for this supplier
  getOrders: (params) => api.get('/supplier/orders', { params }),
  
  // Update order status
  updateOrderStatus: (orderId, status) => api.put(`/supplier/orders/${orderId}/status`, { status }),
  
  // Get sales analytics data
  getSalesAnalytics: (params) => api.get('/supplier/sales-analytics', { params }),
  
  // Get supplier profile
  getProfile: () => api.get('/supplier/profile'),
  
  // Update supplier profile
  updateProfile: (data) => api.put('/supplier/profile', data),
  
  // Get performance metrics
  getPerformance: (params) => api.get('/supplier/performance', { params }),
  
  // Upload product images
  uploadProductImages: (productId, formData) => api.post(`/supplier/products/${productId}/images`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  
  // Delete product image
  deleteProductImage: (productId, imageId) => api.delete(`/supplier/products/${productId}/images/${imageId}`),
  
  // Get inventory data
  getInventory: (params) => api.get('/supplier/inventory', { params }),
  
  // Update inventory
  updateInventory: (productId, data) => api.put(`/supplier/inventory/${productId}`, data),
  
  // Get supplier settings
  getSettings: () => api.get('/supplier/settings'),
  
  // Update supplier settings
  updateSettings: (data) => api.put('/supplier/settings', data),
}

// Admin API - Administrative functions and dashboard
export const adminAPI = {
  // Dashboard and Statistics
  getDashboardStats: () => api.get('/admin/dashboard/stats'),
  
  getSystemHealth: () => api.get('/admin/system/health'),
  
  // User Management
  getUsers: (params) => api.get('/admin/users', { params }),
  
  getUser: (userId) => api.get(`/admin/users/${userId}`),
  
  updateUser: (userId, data) => api.put(`/admin/users/${userId}`, data),
  
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  
  suspendUser: (userId, reason) => api.put(`/admin/users/${userId}/suspend`, { reason }),
  
  activateUser: (userId) => api.put(`/admin/users/${userId}/activate`),
  
  // Supplier Management
  getSuppliers: (params) => api.get('/admin/suppliers', { params }),
  
  getSupplier: (supplierId) => api.get(`/admin/suppliers/${supplierId}`),
  
  approveSupplier: (supplierId, data) => api.put(`/admin/suppliers/${supplierId}/approve`, data),
  
  rejectSupplier: (supplierId, data) => api.put(`/admin/suppliers/${supplierId}/reject`, data),
  
  suspendSupplier: (supplierId, reason) => api.put(`/admin/suppliers/${supplierId}/suspend`, { reason }),
  
  // Order Management
  getAllOrders: (params) => api.get('/admin/orders', { params }),
  
  getOrderDetails: (orderId) => api.get(`/admin/orders/${orderId}`),
  
  updateOrderStatus: (orderId, status, notes) => api.put(`/admin/orders/${orderId}/status`, { status, notes }),
  
  refundOrder: (orderId, data) => api.put(`/admin/orders/${orderId}/refund`, data),
  
  // Product Management
  getAllProducts: (params) => api.get('/admin/products', { params }),
  
  getProductDetails: (productId) => api.get(`/admin/products/${productId}`),
  
  approveProduct: (productId, data) => api.put(`/admin/products/${productId}/approve`, data),
  
  rejectProduct: (productId, data) => api.put(`/admin/products/${productId}/reject`, data),
  
  featuredProduct: (productId, featured) => api.put(`/admin/products/${productId}/featured`, { featured }),
  
  deleteProduct: (productId) => api.delete(`/admin/products/${productId}`),
  
  // Approvals and Moderation
  getPendingApprovals: () => api.get('/admin/approvals/pending'),
  
  getApprovalDetails: (approvalId) => api.get(`/admin/approvals/${approvalId}`),
  
  processApproval: (approvalId, action, data) => api.put(`/admin/approvals/${approvalId}/${action}`, data),
  
  // Analytics and Reports
  getAnalytics: (params) => api.get('/admin/analytics', { params }),
  
  getRevenueAnalytics: (params) => api.get('/admin/analytics/revenue', { params }),
  
  getUserAnalytics: (params) => api.get('/admin/analytics/users', { params }),
  
  getOrderAnalytics: (params) => api.get('/admin/analytics/orders', { params }),
  
  generateReport: (reportType, params) => api.post(`/admin/reports/${reportType}`, params),
  
  downloadReport: (reportId) => api.get(`/admin/reports/${reportId}/download`, { responseType: 'blob' }),
  
  // System Settings
  getSystemSettings: () => api.get('/admin/settings'),
  
  updateSystemSettings: (settings) => api.put('/admin/settings', settings),
  
  getConfigurableSettings: () => api.get('/admin/settings/configurable'),
  
  updateSiteMaintenance: (enabled, message) => api.put('/admin/settings/maintenance', { enabled, message }),
  
  // Platform Management
  getCategories: () => api.get('/admin/categories'),
  
  createCategory: (categoryData) => api.post('/admin/categories', categoryData),
  
  updateCategory: (categoryId, data) => api.put(`/admin/categories/${categoryId}`, data),
  
  deleteCategory: (categoryId) => api.delete(`/admin/categories/${categoryId}`),
  
  // Notifications and Communications
  sendBulkNotification: (data) => api.post('/admin/notifications/bulk', data),
  
  getNotificationTemplates: () => api.get('/admin/notifications/templates'),
  
  createNotificationTemplate: (template) => api.post('/admin/notifications/templates', template),
  
  // Audit and Logs
  getAuditLogs: (params) => api.get('/admin/audit/logs', { params }),
  
  getSystemLogs: (params) => api.get('/admin/system/logs', { params }),
  
  // Backup and Maintenance
  createBackup: () => api.post('/admin/backup/create'),
  
  getBackups: () => api.get('/admin/backup/list'),
  
  restoreBackup: (backupId) => api.post(`/admin/backup/${backupId}/restore`),
  
  // Performance Monitoring
  getPerformanceMetrics: (params) => api.get('/admin/performance/metrics', { params }),
  
  getServerStatus: () => api.get('/admin/system/status'),
}
// ...existing code...

// Loyalty API endpoints - NEW ADDITION
export const loyaltyAPI = {
  // GET /api/loyalty/my-coins
 
  // GET /api/loyalty/my-coins
  getMyCoins: () => api.get('/loyalty/my-coins'),
  
  // POST /api/loyalty/redeem
  redeemCoins: (data) => api.post('/loyalty/redeem', data),
  
  // GET /api/loyalty/programs
  getPrograms: () => api.get('/loyalty/programs'),
  
  // GET /api/loyalty/milestones
  getMilestones: () => api.get('/loyalty/milestones'),
  
  // POST /api/loyalty/refer - Fixed endpoint and data structure
  referFriend: (data) => api.post('/loyalty/refer', data),
  
  // GET /api/loyalty/referral-stats - Fixed endpoint
  getReferrals: () => api.get('/loyalty/referral-stats'),
}


// ...existing code...




// Settings API - Dedicated settings management
export const settingsAPI = {
  // Get all user settings
  getAllSettings: () => api.get('/users/settings/all'),
  
  // Update account settings
  updateAccountSettings: (data) => api.put('/users/settings/account', data),
  
  // Update security settings
  updateSecuritySettings: (data) => api.put('/users/settings/security', data),
  
  // Update notification preferences
  updateNotificationPreferences: (data) => api.put('/users/settings/notifications', data),
  
  // Update privacy settings
  updatePrivacySettings: (data) => api.put('/users/settings/privacy', data),
  
  // Get data export options
  getDataExportOptions: () => api.get('/users/settings/export-options'),
  
  // Request data export
  requestDataExport: (options) => api.post('/users/settings/export-data', options),
  
  // Get export status
  getExportStatus: (exportId) => api.get(`/users/settings/export-data/${exportId}/status`),
  
  // Download exported data
  downloadExportedData: (exportId) => api.get(`/users/settings/export-data/${exportId}/download`, { 
    responseType: 'blob' 
  }),
  
  // Request account deactivation
  requestDeactivation: (reason) => api.post('/users/settings/deactivate', { reason }),
  
  // Request account deletion
  requestDeletion: (reason, password) => api.post('/users/settings/delete-account', { reason, password }),
  
  // Get security logs
  getSecurityLogs: (params) => api.get('/users/settings/security-logs', { params }),
  
  // Get active sessions
  getActiveSessions: () => api.get('/users/settings/sessions'),
  
  // Terminate session
  terminateSession: (sessionId) => api.delete(`/users/settings/sessions/${sessionId}`),
  
  // Terminate all sessions except current
  terminateAllOtherSessions: () => api.delete('/users/settings/sessions/others'),
  
  // Reset all settings to default
  resetToDefaults: (category) => api.post('/users/settings/reset-defaults', { category }),
  
  // Backup user settings
  backupSettings: () => api.post('/users/settings/backup'),
  
  // Restore user settings
  restoreSettings: (backupData) => api.post('/users/settings/restore', backupData),
}

// Support API
export const supportAPI = {
  // Create support ticket
  createTicket: (ticketData) => api.post('/support/tickets', ticketData),
  
  // Get user tickets
  getTickets: (params) => api.get('/support/tickets', { params }),
  
  // Get ticket details
  getTicket: (ticketId) => api.get(`/support/tickets/${ticketId}`),
  
  // Reply to ticket
  replyToTicket: (ticketId, message) => api.post(`/support/tickets/${ticketId}/reply`, { message }),
  
  // Close ticket
  closeTicket: (ticketId) => api.put(`/support/tickets/${ticketId}/close`),
  
  // Get FAQ
  getFAQ: (category) => api.get('/support/faq', { params: { category } }),
  
  // Search help articles
  searchHelp: (query) => api.get('/support/help/search', { params: { q: query } }),
  
  // Get help article
  getHelpArticle: (articleId) => api.get(`/support/help/${articleId}`),
  
  // Submit feedback
  submitFeedback: (feedbackData) => api.post('/support/feedback', feedbackData),
}

// Utility function to handle file uploads
export const uploadAPI = {
  // Upload single file
  uploadFile: (file, type = 'general') => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)
    
    return api.post('/upload/single', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  
  // Upload multiple files
  uploadFiles: (files, type = 'general') => {
    const formData = new FormData()
    files.forEach(file => formData.append('files', file))
    formData.append('type', type)
    
    return api.post('/upload/multiple', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  
  // Delete uploaded file
  deleteFile: (fileId) => api.delete(`/upload/${fileId}`),
  
  // Get file info
  getFileInfo: (fileId) => api.get(`/upload/${fileId}/info`),
}

export default api
