import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import IndividualAwardModal from "./IndividualAwardModal";
import CouponManagementModal from "./CouponManagementModal";
import loyaltyService from "../../services/loyaltyService";

import Cookies from "js-cookie";
import {
  Users,
  TrendingUp,
  Award,
  Coins,
  Crown,
  UserPlus,
  Gift,
  Settings,
  Activity,
  BarChart3,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertTriangle,
  Calendar,
  Target,
  Eye,
  X,
  Mail,
  Edit,
  Save,
  RotateCcw,
  Shield,
  Package, // Add this for promotions tab
  Clock, // Add this for pending status
  ThumbsUp, // Add this for approval
  ThumbsDown, // Add this for rejection
  Ticket, // ADD THIS LINE
  FileText, // ADD THIS LINE
  Download, // ADD THIS LINE
} from "lucide-react";

import "./AdminLoyaltyManagement.css";

const AdminLoyaltyManagement = () => {
  // State management
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [referralStats, setReferralStats] = useState(null);
  const [pendingPrograms, setPendingPrograms] = useState([]);
  const [individualAwardModal, setIndividualAwardModal] = useState(false);
  const [couponManagementModal, setCouponManagementModal] = useState(false);
  // Error states
  // Membership config states
  // const [membershipConfigModal, setMembershipConfigModal] = useState(false);
  const [membershipConfigs, setMembershipConfigs] = useState([]);
  const [membershipStats, setMembershipStats] = useState(null);
  const [editingConfig, setEditingConfig] = useState(null);
  const [configFormData, setConfigFormData] = useState({});
  const [error, setError] = useState(null);
  const [tabErrors, setTabErrors] = useState({});

  // Modal states
  const [bulkAwardModal, setBulkAwardModal] = useState(false);
  const [promotionModal, setPromotionModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [pendingPromotions, setPendingPromotions] = useState([]);
  const [promotionsOverview, setPromotionsOverview] = useState(null);
  const [selectedPromotion, setSelectedPromotion] = useState(null);
  const [promotionReviewModal, setPromotionReviewModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [approvalNotes, setApprovalNotes] = useState("");
  // Form states
  const [couponAnalytics, setCouponAnalytics] = useState(null);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [couponUsageDetails, setCouponUsageDetails] = useState(null);
  const [couponUsageSummary, setCouponUsageSummary] = useState(null);
  const [couponTrackingView, setCouponTrackingView] = useState("overview");
  const [couponFilters, setCouponFilters] = useState({
    period: "30d",
    groupBy: "tier",
  });
  // Add these new state variables after the existing promotionData
  const [promotionType, setPromotionType] = useState("platform"); // "platform" or "supplier"
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [suppliersList, setSuppliersList] = useState([]);
  // User frequency tracking states
  const [userFrequencyData, setUserFrequencyData] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [userCouponHistory, setUserCouponHistory] = useState(null);
  const [frequencyFilters, setFrequencyFilters] = useState({
    sortBy: "totalUsage", // Changed from 'usage_frequency' to 'totalUsage'
    sortOrder: "desc",
    minUsage: undefined, // Changed from '' to undefined
    customerType: undefined, // Changed from '' to undefined
    membershipTier: undefined, // Changed from '' to undefined
  });
  const [bulkCriteria, setBulkCriteria] = useState({
    customerType: "",
    membershipTier: "",
    minOrderValue: "",
    registrationDateFrom: "",
    registrationDateTo: "",
  });
  const [bulkCoins, setBulkCoins] = useState("");
  const [bulkReason, setBulkReason] = useState("");

  // Update the initial promotionData state (around line 90):

const [promotionData, setPromotionData] = useState({
  name: "",
  description: "",
  type: "discount",
  customerType: "",
  // Benefits
  discountType: "",
  discountValue: "",
  maxDiscount: "",
  freeDeliveryRadius: "",
  coinsMultiplier: "1",
  // Targeting
  customerTypes: [],
  membershipTiers: [],
  newCustomersOnly: false,
  returningCustomersOnly: false,
  // Conditions
  minOrderAmount: "",
  maxOrderValue: "",
  minQuantity: "1",
  categories: [],
  // Usage limits
  totalLimit: "",
  perUserLimit: "1",
  dailyLimit: "",
  // Validity
  validFrom: "",
  validUntil: "",
  // Budget
  totalBudget: ""
});

  // Load data on mount and tab change
  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    if (activeTab && !tabErrors[activeTab]) {
      loadTabData(activeTab);
    }
  }, [activeTab]);
  // Add this useEffect after the existing useEffects (around line 120)

  // Reload user frequency data when filters change
  useEffect(() => {
    if (activeTab === "user-frequency") {
      const debounceTimer = setTimeout(() => {
        loadUserFrequencyData();
      }, 500); // Debounce API calls by 500ms

      return () => clearTimeout(debounceTimer);
    }
  }, [frequencyFilters, activeTab]);
  const getEmptyDashboardData = () => ({
    overview: {
      totalLoyaltyMembers: 0,
      memberGrowth: 0,
      totalCoinsInCirculation: 0,
      coinsIssued: 0,
      activePrograms: 0,
      pendingPrograms: 0,
      engagementRate: 0,
      engagementChange: 0,
    },
    customerAnalysis: {},
    membershipTiers: {},
    programsPerformance: [],
    recentActivity: [],
  });

  const getEmptyReferralStats = () => ({
    totalReferrals: 0,
    successfulReferrals: 0,
    conversionRate: 0,
    totalRewardsDistributed: 0,
    topReferrers: [],
    monthlyTrends: [],
    avgReferralsPerUser: 0,
  });
  // Add missing loadMembershipConfigs function
  const loadMembershipConfigs = async () => {
    try {
      console.log("🔍 Loading membership configurations...");
      const data = await loyaltyService.getMembershipConfigs();
      console.log("✅ Membership configs loaded:", data);
      setMembershipConfigs(data || []);
      return data; // Return data for Promise.allSettled
    } catch (error) {
      console.error("Error loading membership configs:", error);
      setTabErrors((prev) => ({
        ...prev,
        "membership-config":
          error.message || "Failed to load membership configurations",
      }));
      throw error; // Re-throw for Promise.allSettled to catch
    }
  };
  const loadMembershipStats = async () => {
    try {
      console.log("🔍 Loading membership statistics...");
      const data = await loyaltyService.getMembershipStats();
      console.log("✅ Membership stats loaded:", data);
      setMembershipStats(data);
      return data; // Return data for Promise.allSettled
    } catch (error) {
      console.error("Error loading membership stats:", error);
      // Don't set error state for stats as it's not critical
      console.warn("⚠️ Membership stats not available, continuing...");
      return null; // Return null instead of throwing
    }
  };

  // ...existing code...

  const loadAllData = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log("🔍 Loading all admin loyalty data...");

      // Load all data concurrently with proper error handling
      const [
        dashboardResult,
        referralResult,
        programsResult,
        configResult,
        statsResult,
      ] = await Promise.allSettled([
        loyaltyService.getAdminLoyaltyDashboard(),
        loyaltyService.getAdminReferralStats(),
        loyaltyService.getPendingPrograms(),
        loadMembershipConfigs(),
        loadMembershipStats(),
      ]);

      // Handle dashboard data
      if (dashboardResult.status === "fulfilled") {
        console.log("✅ Dashboard data loaded:", dashboardResult.value);
        setDashboardData(dashboardResult.value || getEmptyDashboardData());
      } else {
        console.error("❌ Dashboard data failed:", dashboardResult.reason);
        setTabErrors((prev) => ({
          ...prev,
          overview:
            dashboardResult.reason?.message || "Failed to load dashboard",
        }));
        setDashboardData(getEmptyDashboardData());
      }

      // Handle referral stats
      if (referralResult.status === "fulfilled") {
        console.log("✅ Referral stats loaded:", referralResult.value);
        setReferralStats(referralResult.value || getEmptyReferralStats());
      } else {
        console.error("❌ Referral stats failed:", referralResult.reason);
        setTabErrors((prev) => ({
          ...prev,
          referrals:
            referralResult.reason?.message || "Failed to load referral stats",
        }));
        setReferralStats(getEmptyReferralStats());
      }

      // Handle pending programs
      if (programsResult.status === "fulfilled") {
        console.log("✅ Pending programs loaded:", programsResult.value);
        setPendingPrograms(
          Array.isArray(programsResult.value) ? programsResult.value : []
        );
      } else {
        console.error("❌ Pending programs failed:", programsResult.reason);
        setTabErrors((prev) => ({
          ...prev,
          programs: programsResult.reason?.message || "Failed to load programs",
        }));
        setPendingPrograms([]);
      }

      // Handle membership configs
      if (configResult.status === "fulfilled") {
        console.log("✅ Membership configs handled successfully");
      } else {
        console.error("❌ Membership configs failed:", configResult.reason);
        // Error already handled in loadMembershipConfigs function
      }

      // Handle membership stats
      if (statsResult.status === "fulfilled") {
        console.log("✅ Membership stats handled successfully");
      } else {
        console.warn(
          "⚠️ Membership stats failed but continuing:",
          statsResult.reason
        );
        // Stats failure is not critical, continue without error
      }
    } catch (error) {
      console.error("❌ Failed to load loyalty data:", error);
      setError(error.message || "Failed to load admin loyalty data");
      toast.error("Failed to load loyalty management data");
    } finally {
      setLoading(false);
    }
  };

  // ...existing code...
  // ...existing code... (add this function after other data loading functions, around line 300)

  // ...existing code... (replace the loadSuppliersList function)

  // Update the loadSuppliersList function:

  const loadSuppliersList = async () => {
    console.log("🔄 Loading suppliers list...");

    try {
      // Use limit of 50 instead of 100
      const result = await loyaltyService.getApprovedSuppliers(50);

      console.log("📊 Suppliers API response:", result);

      if (result && result.suppliers && Array.isArray(result.suppliers)) {
        const activeSuppliers = result.suppliers.filter(
          (supplier) =>
            supplier &&
            supplier.isApproved === true &&
            supplier.isActive !== false &&
            supplier.companyName &&
            supplier._id
        );

        setSuppliersList(activeSuppliers);
        console.log(
          `✅ Suppliers loaded: ${activeSuppliers.length} active suppliers`
        );

        if (activeSuppliers.length === 0) {
          toast.info("No active suppliers available for promotions");
        }
      } else {
        console.warn("⚠️ No suppliers data in response:", result);
        setSuppliersList([]);
        toast.warn("No suppliers data received from server");
      }
    } catch (error) {
      console.error("❌ Error loading suppliers:", error);
      toast.error(`Failed to load suppliers: ${error.message}`);
      setSuppliersList([]);
    }
  };
  // ...existing code...
  const loadTabData = async (tab) => {
    // Skip if data is already loaded or tab has error
    if (tabErrors[tab]) return;

    try {
      switch (tab) {
        case "customers":
          // Load customer analytics if not already loaded
          if (
            !dashboardData?.customerAnalysis ||
            Object.keys(dashboardData.customerAnalysis).length === 0
          ) {
            console.log("🔍 Loading customer analytics...");
            const result = await loyaltyService.getCustomerTypeAnalytics();
            if (result) {
              setDashboardData((prev) => ({
                ...prev,
                customerAnalysis: result,
              }));
            }
          }
          break;

        case "analytics":
          // Load additional analytics data if needed
          console.log("🔍 Analytics tab data already loaded with dashboard");
          break;
        case "membership-config":
          if (!membershipConfigs.length) {
            await loadMembershipConfigs();
          }
          if (!membershipStats) {
            await loadMembershipStats();
          }
          break;
        case "promotions": {
          const [pendingData, overviewData] = await Promise.all([
            loyaltyService.getPendingPromotions(),
            loyaltyService.getPromotionsOverview(),
          ]);
          setPendingPromotions(pendingData.data || []);
          setPromotionsOverview(overviewData.data || null);
          break;
        }
        case "coupon-tracking": // ADD THIS CASE
          if (!couponAnalytics) loadCouponAnalytics();
          break;
        case "user-frequency":
          await loadUserFrequencyData();
          break;

        default:
          // Other tabs use data already loaded
          break;
      }
    } catch (error) {
      console.error(`❌ Error loading ${tab} data:`, error);
      setTabErrors((prev) => ({
        ...prev,
        [tab]: error.message || `Failed to load ${tab} data`,
      }));
    }
  };

  // ADD THESE METHODS AFTER THE EXISTING LOAD METHODS (around line 300)
  const loadCouponAnalytics = async () => {
    try {
      console.log("🔍 Loading coupon analytics...");
      const data = await loyaltyService.getCouponAnalytics();
      console.log("✅ Coupon analytics loaded:", data);
      setCouponAnalytics(data);
      return data;
    } catch (error) {
      console.error("Error loading coupon analytics:", error);
      setTabErrors((prev) => ({
        ...prev,
        "coupon-tracking": error.message || "Failed to load coupon analytics",
      }));
      throw error;
    }
  };

  const loadCouponUsageDetails = async (couponId, page = 1) => {
    try {
      console.log(`🔍 Loading coupon usage details for: ${couponId}`);
      const data = await loyaltyService.getCouponUsageDetails(couponId, page);
      console.log("✅ Coupon usage details loaded:", data);
      setCouponUsageDetails(data);
      return data;
    } catch (error) {
      console.error("Error loading coupon usage details:", error);
      toast.error("Failed to load coupon usage details");
      throw error;
    }
  };

  const loadCouponUsageSummary = async (period = "30d", groupBy = "tier") => {
    try {
      console.log(`🔍 Loading coupon usage summary: ${period}, ${groupBy}`);
      const data = await loyaltyService.getCouponUsageSummary(period, groupBy);
      console.log("✅ Coupon usage summary loaded:", data);
      setCouponUsageSummary(data);
      return data;
    } catch (error) {
      console.error("Error loading coupon usage summary:", error);
      toast.error("Failed to load coupon usage summary");
      throw error;
    }
  };

  const handleCouponViewChange = (view) => {
    setCouponTrackingView(view);

    switch (view) {
      case "overview":
        if (!couponAnalytics) {
          loadCouponAnalytics();
        }
        break;
      case "summary":
        loadCouponUsageSummary(couponFilters.period, couponFilters.groupBy);
        break;
      default:
        break;
    }
  };

  const handleCouponSelection = (coupon) => {
    setSelectedCoupon(coupon);
    setCouponTrackingView("details");
    loadCouponUsageDetails(coupon._id);
  };

  const exportCouponAnalytics = async () => {
    try {
      setActionLoading("export-coupons");
      await loyaltyService.exportCouponAnalytics("csv");
      toast.success("Coupon analytics exported successfully");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export coupon analytics");
    } finally {
      setActionLoading(null);
    }
  };
  // User Frequency Methods
  const loadUserFrequencyData = async () => {
    try {
      setActionLoading("frequency");

      // Clean filters - remove undefined/empty values
      const cleanedFilters = Object.entries(frequencyFilters).reduce(
        (acc, [key, value]) => {
          if (value !== undefined && value !== "" && value !== null) {
            acc[key] = value;
          }
          return acc;
        },
        {}
      );

      console.log("🔍 Sending cleaned filters:", cleanedFilters);
      const response =
        await loyaltyService.getUserCouponFrequency(cleanedFilters);
      // ... rest of function
      setUserFrequencyData(response.data);
      setTabErrors((prev) => ({ ...prev, "user-frequency": null }));
    } catch (error) {
      console.error("Error loading user frequency data:", error);
      setTabErrors((prev) => ({
        ...prev,
        "user-frequency":
          error.response?.data?.message || "Failed to load frequency data",
      }));
    } finally {
      setActionLoading(null);
    }
  };

  const loadUserCouponHistory = async (userId) => {
    try {
      setActionLoading("history");
      const response = await loyaltyService.getUserCouponHistory(userId);
      setUserCouponHistory(response.data);
      setSelectedUserId(userId);
    } catch (error) {
      console.error("Error loading user coupon history:", error);
      toast.error("Failed to load user coupon history");
    } finally {
      setActionLoading(null);
    }
  };

  const handleUserSelect = (userId) => {
    loadUserCouponHistory(userId);
  };

  const exportFrequencyData = async () => {
    try {
      setActionLoading("export-frequency");
      await loyaltyService.exportUserFrequencyData(frequencyFilters);
      toast.success("Frequency data exported successfully");
    } catch (error) {
      console.error("Error exporting frequency data:", error);
      toast.error("Failed to export frequency data");
    } finally {
      setActionLoading(null);
    }
  };
  const handleApprovePromotion = async (promotionId) => {
    try {
      setActionLoading(`approve-${promotionId}`);
      await loyaltyService.approvePromotion(promotionId, approvalNotes);
      toast.success("Promotion approved successfully");

      // Refresh data
      await loadTabData("promotions");

      // Close modal and reset
      setPromotionReviewModal(false);
      setSelectedPromotion(null);
      setApprovalNotes("");
    } catch (error) {
      console.error("❌ Approve promotion failed:", error);
      toast.error(
        error.response?.data?.message || "Failed to approve promotion"
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectPromotion = async (promotionId) => {
    try {
      if (!rejectionReason.trim()) {
        toast.error("Please provide a reason for rejection");
        return;
      }

      setActionLoading(`reject-${promotionId}`);
      await loyaltyService.rejectPromotion(promotionId, rejectionReason);
      toast.success("Promotion rejected successfully");

      // Refresh data
      await loadTabData("promotions");

      // Close modal and reset
      setPromotionReviewModal(false);
      setSelectedPromotion(null);
      setRejectionReason("");
    } catch (error) {
      console.error("❌ Reject promotion failed:", error);
      toast.error(
        error.response?.data?.message || "Failed to reject promotion"
      );
    } finally {
      setActionLoading(null);
    }
  };

  // Add promotion review modal handler
  const openPromotionReview = (promotion) => {
    setSelectedPromotion(promotion);
    setPromotionReviewModal(true);
    setRejectionReason("");
    setApprovalNotes("");
  };

  const handleProgramAction = async (programId, action) => {
    setActionLoading(`${programId}-${action}`);

    try {
      console.log(`🔍 ${action} program:`, programId);

      const result = await loyaltyService.approveLoyaltyProgram(
        programId,
        action
      );

      if (result) {
        toast.success(`Program ${action}d successfully`);

        // Remove from pending programs
        setPendingPrograms((prev) =>
          prev.filter((program) => program._id !== programId)
        );

        // Refresh dashboard data
        await loadAllData();
      }
    } catch (error) {
      console.error(`❌ Failed to ${action} program:`, error);
      toast.error(`Failed to ${action} program: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkAward = async () => {
    if (!bulkCoins || !bulkReason) {
      toast.error("Please fill in all required fields");
      return;
    }

    setActionLoading("bulk-award");

    try {
      console.log("🔍 Bulk awarding coins...");

      const result = await loyaltyService.bulkAwardCoins(
        bulkCriteria,
        parseInt(bulkCoins),
        bulkReason
      );

      if (result) {
        toast.success(
          `Bulk award completed: ${result.customersAffected || 0} customers received coins`
        );
        setBulkAwardModal(false);

        // Reset form
        setBulkCriteria({
          customerType: "",
          membershipTier: "",
          minOrderValue: "",
          registrationDateFrom: "",
          registrationDateTo: "",
        });
        setBulkCoins("");
        setBulkReason("");

        // Refresh data
        await loadAllData();
      }
    } catch (error) {
      console.error("❌ Bulk award failed:", error);
      toast.error(`Bulk award failed: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  // ...existing code... (replace the existing handleCreatePromotion function)

  // Replace the handleCreatePromotion function:

const handleCreatePromotion = async () => {
  try {
    setActionLoading("create-promotion");

    // Validation
    if (!promotionData.name.trim()) {
      toast.error("Please enter promotion name");
      return;
    }
    
    if (!promotionData.discountType) {
      toast.error("Please select discount type");
      return;
    }
    
    if (!promotionData.discountValue || promotionData.discountValue <= 0) {
      toast.error("Please enter valid discount value");
      return;
    }
    
    if (!promotionData.validFrom || !promotionData.validUntil) {
      toast.error("Please set validity period");
      return;
    }
    
    if (new Date(promotionData.validUntil) <= new Date(promotionData.validFrom)) {
      toast.error("End date must be after start date");
      return;
    }

    if (promotionType === "supplier" && !selectedSupplier) {
      toast.error("Please select a supplier");
      return;
    }

    if (promotionType === "platform" && !promotionData.customerType) {
      toast.error("Please select customer type");
      return;
    }

    let result;
    if (promotionType === "platform") {
      // Create platform-wide promotion
      result = await loyaltyService.createCustomerTypePromotion({
        customerType: promotionData.customerType,
        title: promotionData.name,
        description: promotionData.description,
        discountPercentage: parseFloat(promotionData.discountValue) || 0,
        minOrderAmount: parseFloat(promotionData.minOrderAmount) || 0,
        validFrom: promotionData.validFrom,
        validUntil: promotionData.validUntil,
      });
    } else {
      // Create comprehensive supplier promotion
      result = await loyaltyService.createSupplierPromotionAsAdmin({
        supplierId: selectedSupplier,
        title: promotionData.name,
        description: promotionData.description,
        type: promotionData.type || 'discount',
        
        // Benefits
        discountType: promotionData.discountType,
        discountValue: parseFloat(promotionData.discountValue) || 0,
        maxDiscount: promotionData.maxDiscount ? parseFloat(promotionData.maxDiscount) : null,
        freeDeliveryRadius: promotionData.freeDeliveryRadius ? parseFloat(promotionData.freeDeliveryRadius) : 0,
        coinsMultiplier: promotionData.coinsMultiplier ? parseFloat(promotionData.coinsMultiplier) : 1,
        
        // Targeting
        customerTypes: promotionData.customerTypes || [],
        membershipTiers: promotionData.membershipTiers || [],
        newCustomersOnly: promotionData.newCustomersOnly || false,
        returningCustomersOnly: promotionData.returningCustomersOnly || false,
        
        // Conditions
        minOrderAmount: promotionData.minOrderAmount ? parseFloat(promotionData.minOrderAmount) : 0,
        maxOrderValue: promotionData.maxOrderValue ? parseFloat(promotionData.maxOrderValue) : null,
        minQuantity: promotionData.minQuantity ? parseInt(promotionData.minQuantity) : 1,
        categories: promotionData.categories || [],
        
        // Usage limits
        totalLimit: promotionData.totalLimit ? parseInt(promotionData.totalLimit) : null,
        perUserLimit: promotionData.perUserLimit ? parseInt(promotionData.perUserLimit) : 1,
        dailyLimit: promotionData.dailyLimit ? parseInt(promotionData.dailyLimit) : null,
        
        // Validity
        validFrom: promotionData.validFrom,
        validUntil: promotionData.validUntil,
        
        // Budget
        totalBudget: promotionData.totalBudget ? parseFloat(promotionData.totalBudget) : 0,
      });
    }

    if (result) {
      const promotionTypeText = promotionType === "platform" ? "Platform" : "Supplier";
      toast.success(`${promotionTypeText} promotion created successfully`);
      setPromotionModal(false);

      // Reset form
      setPromotionData({
        name: "",
        description: "",
        type: "discount",
        customerType: "",
        discountType: "",
        discountValue: "",
        maxDiscount: "",
        freeDeliveryRadius: "",
        coinsMultiplier: "1",
        customerTypes: [],
        membershipTiers: [],
        newCustomersOnly: false,
        returningCustomersOnly: false,
        minOrderAmount: "",
        maxOrderValue: "",
        minQuantity: "1",
        categories: [],
        totalLimit: "",
        perUserLimit: "1",
        dailyLimit: "",
        validFrom: "",
        validUntil: "",
        totalBudget: ""
      });
      setPromotionType("platform");
      setSelectedSupplier("");

      // Refresh data
      await loadAllData();
    }
  } catch (error) {
    console.error("❌ Create promotion failed:", error);
    toast.error(`Failed to create promotion: ${error.message}`);
  } finally {
    setActionLoading(null);
  }
};

  // ...existing code...

  const handleConfigEdit = (config) => {
    setEditingConfig(config.tier);
    setConfigFormData({ ...config });
  };

  const handleConfigSave = async (tier) => {
    try {
      setActionLoading(`config-${tier}`);

      console.log("🔍 Saving config for tier:", tier);
      console.log(
        "🔍 Raw config data:",
        JSON.stringify(configFormData, null, 2)
      );

      // Clean the data - only send the fields that the backend expects
      const cleanedData = {
        requirements: {
          minOrders: Number(configFormData.requirements?.minOrders) || 0,
          minSpending: Number(configFormData.requirements?.minSpending) || 0,
        },
        benefits: {
          discountPercentage:
            Number(configFormData.benefits?.discountPercentage) || 0,
          freeDeliveryThreshold:
            Number(configFormData.benefits?.freeDeliveryThreshold) || 0,
          aggreCoinsMultiplier:
            Number(configFormData.benefits?.aggreCoinsMultiplier) || 1,
          prioritySupport: Boolean(configFormData.benefits?.prioritySupport),
          exclusiveDeals: Boolean(configFormData.benefits?.exclusiveDeals),
          earlyAccess: Boolean(configFormData.benefits?.earlyAccess),
        },
        milestoneRewards: {
          firstOrderReward:
            Number(configFormData.milestoneRewards?.firstOrderReward) || 100,
          tierUpgradeReward:
            Number(configFormData.milestoneRewards?.tierUpgradeReward) || 0,
        },
        isActive: configFormData.isActive !== false, // Default to true if not explicitly false
      };

      console.log(
        "🔍 Cleaned data being sent:",
        JSON.stringify(cleanedData, null, 2)
      );

      // Use loyaltyService instead of direct fetch
      const result = await loyaltyService.updateMembershipConfig(
        tier,
        cleanedData
      );

      console.log("✅ Update successful:", result);
      toast.success(
        `${tier.charAt(0).toUpperCase() + tier.slice(1)} tier configuration updated successfully`
      );
      setEditingConfig(null);

      // Refresh the configurations
      await loadMembershipConfigs();

      // Refresh stats if needed
      if (membershipStats) {
        await loadMembershipStats();
      }
    } catch (error) {
      console.error("❌ Error updating config:", error);

      // Handle different types of errors
      let errorMessage = "Error updating configuration";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (
        error.response?.data?.errors &&
        Array.isArray(error.response.data.errors)
      ) {
        // Handle validation errors from express-validator
        const validationErrors = error.response.data.errors
          .map((err) => err.msg)
          .join(", ");
        errorMessage = `Validation failed: ${validationErrors}`;
      } else if (error.message && error.message !== "Network Error") {
        errorMessage = error.message;
      }

      toast.error(errorMessage);

      // Log additional error details for debugging
      if (error.response) {
        console.error("Response error:", {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers,
        });
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfigCancel = () => {
    setEditingConfig(null);
    setConfigFormData({});
  };

  const handleResetDefaults = async () => {
    if (
      !confirm(
        "Are you sure you want to reset all membership configurations to defaults? This cannot be undone."
      )
    ) {
      return;
    }

    try {
      setActionLoading("reset-defaults");

      console.log("🔍 Resetting membership configs to defaults...");

      // Use loyaltyService instead of direct fetch
      const result = await loyaltyService.resetMembershipConfigsToDefaults();

      console.log("✅ Reset successful:", result);
      toast.success("Membership configurations reset to defaults successfully");

      // Refresh the data
      await loadMembershipConfigs();
      await loadMembershipStats();
    } catch (error) {
      console.error("❌ Error resetting configs:", error);

      let errorMessage = "Error resetting configurations";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading && !dashboardData) {
    return (
      <div className="admin-loyalty-loading">
        <div className="loading-spinner">
          <RefreshCw size={32} className="spin-icon" />
        </div>
        <p>Loading loyalty management dashboard...</p>
        <p className="loading-details">
          Please wait while we fetch your data from the server...
        </p>
      </div>
    );
  }

  if (error && !dashboardData) {
    return (
      <div className="admin-loyalty-error">
        <AlertTriangle size={48} />
        <h2>Failed to Load Dashboard</h2>
        <p>{error}</p>
        <button
          onClick={loadAllData}
          className="btn btn-primary"
          disabled={loading}
        >
          <RefreshCw size={16} />
          Retry
        </button>
      </div>
    );
  }

  const tabs = [
    { id: "overview", name: "Overview", icon: BarChart3 },
    { id: "programs", name: "Programs", icon: Gift },
    { id: "promotions", name: "Promotions", icon: Package }, // Add this line
    { id: "coupon-tracking", name: "Coupon Tracking", icon: Ticket }, // ADD THIS LINE
    { id: "user-frequency", name: "User Frequency", icon: Users }, // ADD THIS LINE
    { id: "customers", name: "Customers", icon: Users },
    { id: "referrals", name: "Referrals", icon: UserPlus },
    { id: "analytics", name: "Analytics", icon: Activity },
    { id: "tools", name: "Tools", icon: Crown },
    { id: "membership-config", name: "Membership Config", icon: Settings },
  ];

  return (
    <div className="admin-loyalty-management">
      {/* Header */}
      <div className="loyalty-headeru">
        <div className="header-content">
          <div className="header-info">
            <h1>Loyalty Management</h1>
            <p>Manage customer loyalty programs, rewards, and engagement</p>
          </div>
          <div className="header-actions">
            <button
              className="btn btn-primary"
              onClick={() => setBulkAwardModal(true)}
              disabled={actionLoading}
            >
              <Coins size={16} />
              Bulk Award
            </button>

            <button
              className="action-button individual-award-btn"
              onClick={() => setIndividualAwardModal(true)}
              disabled={loading}
            >
              <Users size={16} />
              Individual Awards
            </button>

            <button
              className="action-button coupon-btn"
              onClick={() => setCouponManagementModal(true)}
              disabled={loading}
            >
              <Gift size={16} />
              Create Coupon
            </button>
            <button
              className="btn btn-success"
              onClick={() => setPromotionModal(true)}
              disabled={actionLoading}
            >
              <Gift size={16} />
              Create Promotion
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="loyalty-tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const hasError = tabErrors[tab.id];

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`tab ${activeTab === tab.id ? "active" : ""} ${hasError ? "error" : ""}`}
                title={hasError ? `Error: ${hasError}` : undefined}
              >
                <Icon size={16} />
                <span>{tab.name}</span>
                {hasError && <AlertTriangle size={12} />}
              </button>
            );
          })}
        </div>
      </div>
      {/* Tab Content */}
      <div className="loyalty-content">
        {activeTab === "overview" && (
          <OverviewTab
            dashboardData={dashboardData}
            loading={loading}
            error={tabErrors.overview}
            onRetry={() => loadAllData()}
          />
        )}
        {activeTab === "programs" && (
          <ProgramsTab
            pendingPrograms={pendingPrograms}
            onProgramAction={handleProgramAction}
            loading={loading}
            error={tabErrors.programs}
            actionLoading={actionLoading}
          />
        )}
        {activeTab === "customers" && (
          <CustomersTab
            dashboardData={dashboardData}
            loading={loading}
            error={tabErrors.customers}
          />
        )}
        {activeTab === "user-frequency" && (
          <UserFrequencyTab
            frequencyData={userFrequencyData}
            userHistory={userCouponHistory}
            selectedUserId={selectedUserId}
            filters={frequencyFilters}
            loading={loading}
            error={tabErrors["user-frequency"]}
            actionLoading={actionLoading}
            onFiltersChange={setFrequencyFilters}
            onUserSelect={handleUserSelect}
            onExport={exportFrequencyData}
            onRetry={() => loadUserFrequencyData()}
          />
        )}
        {activeTab === "coupon-tracking" && (
          <CouponTrackingTab
            analytics={couponAnalytics}
            usageDetails={couponUsageDetails}
            usageSummary={couponUsageSummary}
            selectedCoupon={selectedCoupon}
            activeView={couponTrackingView}
            filters={couponFilters}
            loading={loading}
            error={tabErrors["coupon-tracking"]}
            actionLoading={actionLoading}
            onViewChange={handleCouponViewChange}
            onCouponSelect={handleCouponSelection}
            onFiltersChange={setCouponFilters}
            onLoadUsageDetails={loadCouponUsageDetails}
            onLoadUsageSummary={loadCouponUsageSummary}
            onExport={exportCouponAnalytics}
            onRetry={() => loadCouponAnalytics()}
          />
        )}

        {activeTab === "membership-config" && (
          <MembershipConfigTab
            configs={membershipConfigs}
            stats={membershipStats}
            onConfigEdit={handleConfigEdit}
            onConfigSave={handleConfigSave}
            onConfigCancel={handleConfigCancel}
            onResetDefaults={handleResetDefaults}
            editingConfig={editingConfig}
            configFormData={configFormData}
            setConfigFormData={setConfigFormData}
            actionLoading={actionLoading}
          />
        )}
        {activeTab === "referrals" && (
          <ReferralsTab
            referralStats={referralStats}
            loading={loading}
            error={tabErrors.referrals}
          />
        )}
        {activeTab === "analytics" && (
          <AnalyticsTab
            dashboardData={dashboardData}
            loading={loading}
            error={tabErrors.analytics}
          />
        )}
        {activeTab === "tools" && (
          <ToolsTab
            onBulkAward={() => setBulkAwardModal(true)}
            onCreatePromotion={() => setPromotionModal(true)}
          />
        )}
        {activeTab === "promotions" && (
          <PromotionsTab
            pendingPromotions={pendingPromotions}
            overview={promotionsOverview}
            loading={loading}
            error={tabErrors.promotions}
            onRetry={() => loadTabData("promotions")}
            onReviewPromotion={openPromotionReview}
          />
        )}
      </div>
      {/* Bulk Award Modal */}
      {bulkAwardModal && (
        <div className="modal-overlay">
          <div className="modal bulk-award-modal">
            <div className="modal-header">
              <h3>Bulk Award Coins</h3>
              <button
                className="modal-close"
                onClick={() => setBulkAwardModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Customer Type</label>
                <select
                  value={bulkCriteria.customerType}
                  onChange={(e) =>
                    setBulkCriteria((prev) => ({
                      ...prev,
                      customerType: e.target.value,
                    }))
                  }
                >
                  <option value="">All Types</option>
                  <option value="house_owner">House Owner</option>
                  <option value="mason">Mason</option>
                  <option value="builder_contractor">Builder/Contractor</option>
                  <option value="others">Others</option>
                </select>
              </div>

              <div className="form-group">
                <label>Membership Tier</label>
                <select
                  value={bulkCriteria.membershipTier}
                  onChange={(e) =>
                    setBulkCriteria((prev) => ({
                      ...prev,
                      membershipTier: e.target.value,
                    }))
                  }
                >
                  <option value="">All Tiers</option>
                  <option value="silver">Silver</option>
                  <option value="gold">Gold</option>
                  <option value="platinum">Platinum</option>
                </select>
              </div>

              <div className="form-group">
                <label>Min Order Value</label>
                <input
                  type="number"
                  value={bulkCriteria.minOrderValue}
                  onChange={(e) =>
                    setBulkCriteria((prev) => ({
                      ...prev,
                      minOrderValue: e.target.value,
                    }))
                  }
                  placeholder="Minimum order value"
                />
              </div>

              <div className="form-group">
                <label>Coins to Award *</label>
                <input
                  type="number"
                  value={bulkCoins}
                  onChange={(e) => setBulkCoins(e.target.value)}
                  placeholder="Enter coins amount"
                  min="1"
                  required
                />
              </div>

              <div className="form-group">
                <label>Reason *</label>
                <textarea
                  value={bulkReason}
                  onChange={(e) => setBulkReason(e.target.value)}
                  placeholder="Enter reason for awarding coins"
                  rows={3}
                  required
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setBulkAwardModal(false)}
                disabled={actionLoading === "bulk-award"}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleBulkAward}
                disabled={actionLoading === "bulk-award"}
              >
                {actionLoading === "bulk-award" ? (
                  <>
                    <RefreshCw size={16} className="spin-icon" />
                    Awarding...
                  </>
                ) : (
                  <>
                    <Coins size={16} />
                    Award Coins
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Individual Award Modal */}
      <IndividualAwardModal
        isOpen={individualAwardModal}
        onClose={() => setIndividualAwardModal(false)}
        onSuccess={() => {
          toast.success("Awards processed successfully");
          loadAllData(); // Refresh dashboard data
        }}
      />
      {/* Coupon Management Modal */}
      <CouponManagementModal
        isOpen={couponManagementModal}
        onClose={() => setCouponManagementModal(false)}
        onSuccess={(coupon) => {
          toast.success(
            `Coupon "${coupon.couponDetails.code}" created successfully`
          );
        }}
      />
      {/* Promotion Modal */}
      
      {/* Promotion Modal */}
      

{/* Enhanced Promotion Modal */}
{promotionModal && (
  <div className="modal-overlay">
    <div className="modal promotion-modal large-modal">
      <div className="modal-header">
        <h3>Create Promotion</h3>
        <button
          className="modal-close"
          onClick={() => setPromotionModal(false)}
        >
          ×
        </button>
      </div>
      <div className="modal-body">
        
        {/* Promotion Type Selection */}
        <div className="form-section">
          <h4>Promotion Type</h4>
          <div className="radio-group">
            <div className="radio-option">
              <input
                type="radio"
                id="platform-promotion"
                name="promotionType"
                value="platform"
                checked={promotionType === "platform"}
                onChange={(e) => {
                  setPromotionType(e.target.value);
                  setSelectedSupplier("");
                }}
              />
              <label htmlFor="platform-promotion">
                Platform-wide Promotion
              </label>
              <span className="radio-description">
                Available to all customers of selected type
              </span>
            </div>
            <div className="radio-option">
              <input
                type="radio"
                id="supplier-promotion"
                name="promotionType"
                value="supplier"
                checked={promotionType === "supplier"}
                onChange={(e) => {
                  setPromotionType(e.target.value);
                  if (suppliersList.length === 0) {
                    loadSuppliersList();
                  }
                }}
              />
              <label htmlFor="supplier-promotion">
                Supplier-specific Promotion
              </label>
              <span className="radio-description">
                Available only for selected supplier's customers
              </span>
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <div className="form-section">
          <h4>Basic Information</h4>
          <div className="form-row">
            <div className="form-group">
              <label>Promotion Name *</label>
              <input
                type="text"
                value={promotionData.name}
                onChange={(e) =>
                  setPromotionData(prev => ({ ...prev, name: e.target.value }))
                }
                placeholder="Enter promotion name"
                required
              />
            </div>
            <div className="form-group">
              <label>Promotion Type *</label>
              <select
                value={promotionData.type}
                onChange={(e) =>
                  setPromotionData(prev => ({ ...prev, type: e.target.value }))
                }
                required
              >
                <option value="">Select Type</option>
                <option value="discount">Discount</option>
                <option value="coupon">Coupon</option>
                <option value="free_delivery">Free Delivery</option>
                <option value="bulk_discount">Bulk Discount</option>
                <option value="seasonal">Seasonal</option>
                <option value="referral">Referral</option>
              </select>
            </div>
          </div>
          
          <div className="form-group">
            <label>Description *</label>
            <textarea
              value={promotionData.description}
              onChange={(e) =>
                setPromotionData(prev => ({ ...prev, description: e.target.value }))
              }
              placeholder="Enter promotion description"
              rows={3}
              required
            />
          </div>
        </div>

        {/* Supplier Selection (conditional) */}
        {promotionType === "supplier" && (
          <div className="form-section">
            <h4>Supplier Selection</h4>
            <div className="form-group">
              <label>Select Supplier *</label>
              <select
                className="form-select"
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
                required
              >
                <option value="">Choose a supplier...</option>
                {suppliersList.map((supplier) => (
                  <option key={supplier._id} value={supplier._id}>
                    {supplier.companyName || supplier.tradeOwnerName || "Unknown Supplier"}
                    {supplier.contactPersonName && ` - ${supplier.contactPersonName}`}
                  </option>
                ))}
              </select>
              {suppliersList.length === 0 && (
                <small className="form-note">Loading suppliers...</small>
              )}
            </div>
          </div>
        )}

        {/* Benefits Configuration */}
        <div className="form-section">
          <h4>Benefits Configuration</h4>
          <div className="form-row">
            <div className="form-group">
              <label>Discount Type *</label>
              <select
                value={promotionData.discountType}
                onChange={(e) =>
                  setPromotionData(prev => ({ ...prev, discountType: e.target.value }))
                }
                required
              >
                <option value="">Select Discount Type</option>
                <option value="percentage">Percentage</option>
                <option value="fixed_amount">Fixed Amount</option>
                <option value="free_delivery">Free Delivery</option>
                <option value="coins_multiplier">Coins Multiplier</option>
              </select>
            </div>
            <div className="form-group">
              <label>
                {promotionData.discountType === 'percentage' ? 'Discount Percentage (%)' : 
                 promotionData.discountType === 'fixed_amount' ? 'Fixed Amount (₹)' :
                 promotionData.discountType === 'coins_multiplier' ? 'Coins Multiplier (x)' :
                 'Discount Value'} *
              </label>
              <input
                type="number"
                value={promotionData.discountValue}
                onChange={(e) =>
                  setPromotionData(prev => ({ ...prev, discountValue: e.target.value }))
                }
                placeholder={
                  promotionData.discountType === 'percentage' ? 'e.g., 10 for 10%' :
                  promotionData.discountType === 'fixed_amount' ? 'e.g., 500 for ₹500' :
                  promotionData.discountType === 'coins_multiplier' ? 'e.g., 2 for 2x coins' :
                  'Enter value'
                }
                min="0"
                max={promotionData.discountType === 'percentage' ? '100' : undefined}
                required
              />
            </div>
          </div>
          
          {promotionData.discountType === 'percentage' && (
            <div className="form-group">
              <label>Maximum Discount Amount (₹)</label>
              <input
                type="number"
                value={promotionData.maxDiscount}
                onChange={(e) =>
                  setPromotionData(prev => ({ ...prev, maxDiscount: e.target.value }))
                }
                placeholder="e.g., 1000 (optional cap on percentage discount)"
                min="0"
              />
            </div>
          )}
          
          {promotionData.discountType === 'free_delivery' && (
            <div className="form-group">
              <label>Free Delivery Radius (km)</label>
              <input
                type="number"
                value={promotionData.freeDeliveryRadius}
                onChange={(e) =>
                  setPromotionData(prev => ({ ...prev, freeDeliveryRadius: e.target.value }))
                }
                placeholder="e.g., 50"
                min="0"
              />
            </div>
          )}
        </div>

        {/* Targeting Configuration */}
        <div className="form-section">
          <h4>Targeting Configuration</h4>
          <div className="form-row">
            <div className="form-group">
              <label>Customer Types</label>
              <div className="checkbox-group">
                {['house_owner', 'mason', 'builder_contractor', 'others'].map(type => (
                  <label key={type} className="checkbox-label">
                    <input
                      type="checkbox"
                      value={type}
                      checked={promotionData.customerTypes?.includes(type)}
                      onChange={(e) => {
                        const types = promotionData.customerTypes || [];
                        if (e.target.checked) {
                          setPromotionData(prev => ({
                            ...prev,
                            customerTypes: [...types, type]
                          }));
                        } else {
                          setPromotionData(prev => ({
                            ...prev,
                            customerTypes: types.filter(t => t !== type)
                          }));
                        }
                      }}
                    />
                    {type.replace('_', ' ').split(' ').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')}
                  </label>
                ))}
              </div>
              <small className="form-note">Leave empty to target all customer types</small>
            </div>
            <div className="form-group">
              <label>Membership Tiers</label>
              <div className="checkbox-group">
                {['silver', 'gold', 'platinum'].map(tier => (
                  <label key={tier} className="checkbox-label">
                    <input
                      type="checkbox"
                      value={tier}
                      checked={promotionData.membershipTiers?.includes(tier)}
                      onChange={(e) => {
                        const tiers = promotionData.membershipTiers || [];
                        if (e.target.checked) {
                          setPromotionData(prev => ({
                            ...prev,
                            membershipTiers: [...tiers, tier]
                          }));
                        } else {
                          setPromotionData(prev => ({
                            ...prev,
                            membershipTiers: tiers.filter(t => t !== tier)
                          }));
                        }
                      }}
                    />
                    {tier.charAt(0).toUpperCase() + tier.slice(1)}
                  </label>
                ))}
              </div>
              <small className="form-note">Leave empty to target all membership tiers</small>
            </div>
          </div>
        </div>

        {/* Conditions */}
        <div className="form-section">
          <h4>Promotion Conditions</h4>
          <div className="form-row">
            <div className="form-group">
              <label>Minimum Order Value (₹)</label>
              <input
                type="number"
                value={promotionData.minOrderAmount}
                onChange={(e) =>
                  setPromotionData(prev => ({ ...prev, minOrderAmount: e.target.value }))
                }
                placeholder="e.g., 1000"
                min="0"
              />
            </div>
            <div className="form-group">
              <label>Maximum Order Value (₹)</label>
              <input
                type="number"
                value={promotionData.maxOrderValue}
                onChange={(e) =>
                  setPromotionData(prev => ({ ...prev, maxOrderValue: e.target.value }))
                }
                placeholder="e.g., 50000 (optional)"
                min="0"
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Minimum Quantity</label>
              <input
                type="number"
                value={promotionData.minQuantity}
                onChange={(e) =>
                  setPromotionData(prev => ({ ...prev, minQuantity: e.target.value }))
                }
                placeholder="e.g., 1"
                min="1"
              />
            </div>
            <div className="form-group">
              <label>Product Categories</label>
              <select
                multiple
                value={promotionData.categories || []}
                onChange={(e) => {
                  const selectedCategories = Array.from(e.target.selectedOptions, option => option.value);
                  setPromotionData(prev => ({ ...prev, categories: selectedCategories }));
                }}
                className="multi-select"
              >
                <option value="aggregate">Aggregates</option>
                <option value="sand">Sand</option>
                <option value="tmt_steel">TMT Steel</option>
                <option value="bricks_blocks">Bricks & Blocks</option>
                <option value="cement">Cement</option>
              </select>
              <small className="form-note">Hold Ctrl/Cmd to select multiple. Leave empty for all categories.</small>
            </div>
          </div>
        </div>

        {/* Usage Limits */}
        <div className="form-section">
          <h4>Usage Limits</h4>
          <div className="form-row">
            <div className="form-group">
              <label>Total Usage Limit</label>
              <input
                type="number"
                value={promotionData.totalLimit}
                onChange={(e) =>
                  setPromotionData(prev => ({ ...prev, totalLimit: e.target.value }))
                }
                placeholder="e.g., 1000 (leave empty for unlimited)"
                min="1"
              />
            </div>
            <div className="form-group">
              <label>Per User Limit</label>
              <input
                type="number"
                value={promotionData.perUserLimit}
                onChange={(e) =>
                  setPromotionData(prev => ({ ...prev, perUserLimit: e.target.value }))
                }
                placeholder="e.g., 5"
                min="1"
                defaultValue="1"
              />
            </div>
          </div>
          <div className="form-group">
            <label>Daily Usage Limit</label>
            <input
              type="number"
              value={promotionData.dailyLimit}
              onChange={(e) =>
                setPromotionData(prev => ({ ...prev, dailyLimit: e.target.value }))
              }
              placeholder="e.g., 100 (leave empty for unlimited)"
              min="1"
            />
          </div>
        </div>

        {/* Validity Period */}
        <div className="form-section">
          <h4>Validity Period</h4>
          <div className="form-row">
            <div className="form-group">
              <label>Valid From *</label>
              <input
                type="datetime-local"
                value={promotionData.validFrom}
                onChange={(e) =>
                  setPromotionData(prev => ({ ...prev, validFrom: e.target.value }))
                }
                required
              />
            </div>
            <div className="form-group">
              <label>Valid Until *</label>
              <input
                type="datetime-local"
                value={promotionData.validUntil}
                onChange={(e) =>
                  setPromotionData(prev => ({ ...prev, validUntil: e.target.value }))
                }
                required
              />
            </div>
          </div>
        </div>

        {/* Budget Management */}
        <div className="form-section">
          <h4>Budget Management</h4>
          <div className="form-group">
            <label>Total Budget (₹)</label>
            <input
              type="number"
              value={promotionData.totalBudget}
              onChange={(e) =>
                setPromotionData(prev => ({ ...prev, totalBudget: e.target.value }))
              }
              placeholder="e.g., 50000 (optional budget limit)"
              min="0"
            />
            <small className="form-note">Leave empty for unlimited budget</small>
          </div>
        </div>

      </div>
      
      <div className="modal-footer">
        <button
          className="btn btn-secondary"
          onClick={() => setPromotionModal(false)}
          disabled={actionLoading === "create-promotion"}
        >
          Cancel
        </button>
        <button
          className="btn btn-primary"
          onClick={handleCreatePromotion}
          disabled={actionLoading === "create-promotion"}
        >
          {actionLoading === "create-promotion" ? (
            <>
              <RefreshCw size={16} className="spin-icon" />
              Creating...
            </>
          ) : (
            <>
              <Gift size={16} />
              Create Promotion
            </>
          )}
        </button>
      </div>
    </div>
  </div>
)}
      {promotionReviewModal && selectedPromotion && (
        <div
          className="modal-overlay"
          onClick={() => setPromotionReviewModal(false)}
        >
          <div
            className="modal-content large-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Review Promotion: {selectedPromotion.title}</h3>
              <button
                onClick={() => setPromotionReviewModal(false)}
                className="modal-close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              {/* Promotion Details */}
              <div className="promotion-review-grid">
                <div className="promotion-details">
                  <h4>Promotion Details</h4>
                  <div className="detail-group">
                    <label>Title:</label>
                    <p>{selectedPromotion.title}</p>
                  </div>
                  <div className="detail-group">
                    <label>Description:</label>
                    <p>{selectedPromotion.description}</p>
                  </div>
                  <div className="detail-group">
                    <label>Type:</label>
                    <span className={`badge badge-${selectedPromotion.type}`}>
                      {selectedPromotion.type.replace("_", " ").toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="supplier-details">
                  <h4>Supplier Information</h4>
                  <div className="detail-group">
                    <label>Company:</label>
                    <p>{selectedPromotion.supplier.name}</p>
                  </div>
                  <div className="detail-group">
                    <label>Email:</label>
                    <p>{selectedPromotion.supplier.email}</p>
                  </div>
                </div>
              </div>

              {/* Benefits & Conditions */}
              <div className="promotion-conditions">
                <h4>Benefits & Conditions</h4>
                <div className="conditions-grid">
                  <div className="condition-item">
                    <label>Discount:</label>
                    <p>
                      {selectedPromotion.benefits.discountType === "percentage"
                        ? `${selectedPromotion.benefits.discountValue}%`
                        : `₹${selectedPromotion.benefits.discountValue}`}{" "}
                      OFF
                    </p>
                  </div>
                  {selectedPromotion.conditions.minOrderValue > 0 && (
                    <div className="condition-item">
                      <label>Min Order:</label>
                      <p>₹{selectedPromotion.conditions.minOrderValue}</p>
                    </div>
                  )}
                  <div className="condition-item">
                    <label>Valid Period:</label>
                    <p>
                      {new Date(
                        selectedPromotion.validity.startDate
                      ).toLocaleDateString()}{" "}
                      -
                      {new Date(
                        selectedPromotion.validity.endDate
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Approval/Rejection Form */}
              <div className="review-actions">
                <div className="approval-section">
                  <label>Approval Notes (Optional):</label>
                  <textarea
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                    placeholder="Add any notes for the supplier..."
                    rows="3"
                    className="form-control"
                  />
                </div>

                <div className="rejection-section">
                  <label>Rejection Reason (Required if rejecting):</label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Please provide a clear reason for rejection..."
                    rows="3"
                    className="form-control"
                  />
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button
                onClick={() => handleRejectPromotion(selectedPromotion._id)}
                className="btn btn-danger"
                disabled={
                  actionLoading === `reject-${selectedPromotion._id}` ||
                  !rejectionReason.trim()
                }
              >
                <ThumbsDown size={16} />
                {actionLoading === `reject-${selectedPromotion._id}`
                  ? "Rejecting..."
                  : "Reject"}
              </button>

              <button
                onClick={() => handleApprovePromotion(selectedPromotion._id)}
                className="btn btn-success"
                disabled={actionLoading === `approve-${selectedPromotion._id}`}
              >
                <ThumbsUp size={16} />
                {actionLoading === `approve-${selectedPromotion._id}`
                  ? "Approving..."
                  : "Approve"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Tab Components
const OverviewTab = ({ dashboardData, loading, error, onRetry }) => {
  if (error) {
    return (
      <div className="error-state">
        <AlertTriangle size={48} />
        <h3>Failed to Load Overview</h3>
        <p>{error}</p>
        <button onClick={onRetry} className="btn btn-primary">
          <RefreshCw size={16} />
          Retry
        </button>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="loading-state">
        <RefreshCw size={32} className="spin-icon" />
        <p>Loading overview data...</p>
      </div>
    );
  }

  const overview = dashboardData.overview || {};

  const stats = [
    {
      name: "Total Members",
      value: overview.totalLoyaltyMembers?.toLocaleString() || "0",
      change: overview.memberGrowth || 0,
      icon: Users,
      color: "blue",
    },
    {
      name: "Coins in Circulation",
      value: overview.totalCoinsInCirculation?.toLocaleString() || "0",
      change: 15.2,
      icon: Coins,
      color: "yellow",
    },
    {
      name: "Active Programs",
      value: overview.activePrograms?.toString() || "0",
      change: overview.pendingPrograms || 0,
      icon: Gift,
      color: "green",
    },
    {
      name: "Engagement Rate",
      value: `${overview.engagementRate || 0}%`,
      change: overview.engagementChange || 0,
      icon: TrendingUp,
      color: "purple",
    },
  ];

  return (
    <div className="overview-tab">
      {/* Stats Grid */}
      <div className="stats-grid">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className={`stat-card ${stat.color}`}>
              <div className="stat-icon">
                <Icon size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-value">{stat.value}</div>
                <div className="stat-name">{stat.name}</div>
                <div
                  className={`stat-change ${stat.change >= 0 ? "positive" : "negative"}`}
                >
                  {stat.change >= 0 ? "+" : ""}
                  {stat.change}%
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Membership Tiers */}
      <div className="card">
        <div className="card-header">
          <h3>Membership Tier Distribution</h3>
        </div>
        <div className="card-body">
          <MembershipTierChart
            data={dashboardData.membershipTiers || {}}
            loading={loading}
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="card-header">
          <h3>Recent Activity</h3>
        </div>
        <div className="card-body">
          <RecentActivityList
            activities={dashboardData.recentActivity || []}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
};

const ProgramsTab = ({
  pendingPrograms,
  onProgramAction,
  loading,
  error,
  actionLoading,
}) => {
  if (error) {
    return (
      <div className="error-state">
        <AlertTriangle size={48} />
        <h3>Failed to Load Programs</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="programs-tab">
      <div className="card">
        <div className="card-header">
          <h3>Pending Programs ({pendingPrograms?.length || 0})</h3>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="loading-state">
              <RefreshCw size={24} className="spin-icon" />
              <p>Loading pending programs...</p>
            </div>
          ) : !pendingPrograms || pendingPrograms.length === 0 ? (
            <div className="empty-state">
              <Gift size={48} />
              <p>No pending programs</p>
              <p>All loyalty programs have been reviewed</p>
            </div>
          ) : (
            <div className="programs-list">
              {pendingPrograms.map((program) => (
                <div key={program._id} className="program-card">
                  <div className="program-info">
                    <h4>{program.name || program.title}</h4>
                    <p>{program.description}</p>
                    <div className="program-meta">
                      <span className="program-type">
                        {program.type || "loyalty"}
                      </span>
                      {program.supplier && (
                        <span className="program-supplier">
                          {program.supplier.businessName ||
                            program.supplier.companyName}
                        </span>
                      )}
                      <span className="program-rewards">
                        {program.rewards?.value} {program.rewards?.type}
                      </span>
                    </div>
                  </div>
                  <div className="program-actions">
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => onProgramAction(program._id, "approve")}
                      disabled={actionLoading === `${program._id}-approve`}
                    >
                      {actionLoading === `${program._id}-approve` ? (
                        <RefreshCw size={16} className="spin-icon" />
                      ) : (
                        <CheckCircle size={16} />
                      )}
                      Approve
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => onProgramAction(program._id, "reject")}
                      disabled={actionLoading === `${program._id}-reject`}
                    >
                      {actionLoading === `${program._id}-reject` ? (
                        <RefreshCw size={16} className="spin-icon" />
                      ) : (
                        <XCircle size={16} />
                      )}
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const CustomersTab = ({ dashboardData, loading, error }) => {
  if (error) {
    return (
      <div className="error-state">
        <AlertTriangle size={48} />
        <h3>Failed to Load Customer Data</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="customers-tab">
      <div className="card">
        <div className="card-header">
          <h3>Customer Type Analysis</h3>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="loading-state">
              <RefreshCw size={24} className="spin-icon" />
              <p>Loading customer analysis...</p>
            </div>
          ) : (
            <CustomerAnalysisChart
              data={dashboardData?.customerAnalysis || {}}
            />
          )}
        </div>
      </div>
    </div>
  );
};

const ReferralsTab = ({ referralStats, loading, error }) => {
  if (error) {
    return (
      <div className="error-state">
        <AlertTriangle size={48} />
        <h3>Failed to Load Referral Data</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="referrals-tab">
      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-icon">
            <UserPlus size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">
              {referralStats?.totalReferrals || 0}
            </div>
            <div className="stat-name">Total Referrals</div>
          </div>
        </div>

        <div className="stat-card green">
          <div className="stat-icon">
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">
              {referralStats?.successfulReferrals || 0}
            </div>
            <div className="stat-name">Successful Referrals</div>
          </div>
        </div>

        <div className="stat-card yellow">
          <div className="stat-icon">
            <Target size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">
              {referralStats?.conversionRate || 0}%
            </div>
            <div className="stat-name">Conversion Rate</div>
          </div>
        </div>

        <div className="stat-card purple">
          <div className="stat-icon">
            <Award size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">
              {referralStats?.totalRewardsDistributed || 0}
            </div>
            <div className="stat-name">Rewards Distributed</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Top Referrers</h3>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="loading-state">
              <RefreshCw size={24} className="spin-icon" />
              <p>Loading referral data...</p>
            </div>
          ) : (
            <TopReferrersList referrers={referralStats?.topReferrers || []} />
          )}
        </div>
      </div>
    </div>
  );
};

const AnalyticsTab = ({ dashboardData, loading, error }) => {
  if (error) {
    return (
      <div className="error-state">
        <AlertTriangle size={48} />
        <h3>Failed to Load Analytics</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="analytics-tab">
      <div className="card">
        <div className="card-header">
          <h3>Program Performance</h3>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="loading-state">
              <RefreshCw size={24} className="spin-icon" />
              <p>Loading analytics...</p>
            </div>
          ) : (
            <ProgramPerformanceChart
              data={dashboardData?.programsPerformance || []}
            />
          )}
        </div>
      </div>
    </div>
  );
};

const ToolsTab = ({ onBulkAward, onCreatePromotion }) => (
  <div className="tools-tab">
    <div className="tools-grid">
      <div className="tool-card" onClick={onBulkAward}>
        <div className="tool-icon">
          <Coins size={32} />
        </div>
        <h3>Bulk Award Coins</h3>
        <p>Award coins to multiple customers based on criteria</p>
      </div>

      <div className="tool-card" onClick={onCreatePromotion}>
        <div className="tool-icon">
          <Gift size={32} />
        </div>
        <h3>Create Promotion</h3>
        <p>Create targeted promotions for customer types</p>
      </div>
    </div>
  </div>
);

// Helper Components
const MembershipTierChart = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="loading-state">
        <RefreshCw size={24} className="spin-icon" />
        <p>Loading tier data...</p>
      </div>
    );
  }

  const tiers = ["silver", "gold", "platinum"];
  const tierData = tiers.map((tier) => ({
    tier,
    count: data[tier] || 0,
    percentage:
      data.total > 0 ? (((data[tier] || 0) / data.total) * 100).toFixed(1) : 0,
  }));

  return (
    <div className="tier-chart">
      {tierData.map((tier) => (
        <div key={tier.tier} className="tier-row">
          <div className="tier-info">
            <Crown size={16} />
            <span className="tier-name">{tier.tier}</span>
          </div>
          <div className="tier-stats">
            <span className="tier-count">{tier.count}</span>
            <span className="tier-percentage">({tier.percentage}%)</span>
          </div>
        </div>
      ))}
    </div>
  );
};

const RecentActivityList = ({ activities, loading }) => {
  if (loading) {
    return (
      <div className="loading-state">
        <RefreshCw size={24} className="spin-icon" />
        <p>Loading recent activity...</p>
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="empty-state">
        <Activity size={32} />
        <p>No recent activity</p>
      </div>
    );
  }

  return (
    <div className="activity-list">
      {activities.map((activity, index) => (
        <div key={index} className="activity-item">
          <div className="activity-icon">
            <Activity size={16} />
          </div>
          <div className="activity-content">
            <div className="activity-text">
              {activity.description || activity.type}
            </div>
            <div className="activity-time">
              {activity.createdAt
                ? new Date(activity.createdAt).toLocaleDateString()
                : "Recent"}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// ...existing imports and code...

// Enhanced CustomerAnalysisChart component
const CustomerAnalysisChart = ({ data }) => {
  const [selectedCustomerType, setSelectedCustomerType] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [individualCustomers, setIndividualCustomers] = useState([]);
  const [loading, setLoading] = useState(false);

  const customerTypes = [
    { key: "house_owner", label: "House Owner", icon: "🏠" },
    { key: "mason", label: "Mason", icon: "🔨" },
    { key: "builder_contractor", label: "Builder Contractor", icon: "🏗️" },
    { key: "others", label: "Others", icon: "👥" },
  ];

  // MODIFY: Fix the handleViewDetails function (around line 1225-1240)
  const handleViewDetails = async (customerType) => {
    setSelectedCustomerType(customerType);
    setLoading(true);
    setShowDetailsModal(true);

    try {
      const response = await loyaltyService.getCustomerAnalytics({
        customerType: customerType.key,
        limit: 50,
      });

      console.log("✅ Customer analytics response:", response);

      // Fix: response is already the extracted data object, not response.data
      setIndividualCustomers(response.customers || []);

      if (!response.customers || response.customers.length === 0) {
        toast.info(`No ${customerType.label} customers found`);
      } else {
        toast.success(
          `Found ${response.customers.length} ${customerType.label} customers`
        );
      }
    } catch (error) {
      console.error("Error fetching customer details:", error);
      toast.error(
        `Failed to load ${customerType.label} customers: ${error.message}`
      );
      setIndividualCustomers([]);
    } finally {
      setLoading(false);
    }
  };
  const calculateTotalCustomers = () => {
    return Object.values(data).reduce(
      (total, typeData) => total + (typeData?.count || 0),
      0
    );
  };

  const totalCustomers = calculateTotalCustomers();

  return (
    <div className="customer-analysis">
      <div className="customer-analysis-header">
        <h4>Customer Type Distribution</h4>
        <div className="total-customers">
          Total: <strong>{totalCustomers.toLocaleString()}</strong> customers
        </div>
      </div>

      <div className="customer-types-grid">
        {customerTypes.map((type) => {
          const typeData = data[type.key] || {
            count: 0,
            totalOrders: 0,
            totalSpent: 0,
            avgOrderValue: 0,
            engagementRate: 0,
            activeCustomers: 0,
          };

          const percentage =
            totalCustomers > 0
              ? ((typeData.count / totalCustomers) * 100).toFixed(1)
              : 0;

          return (
            <div key={type.key} className="customer-type-card">
              <div className="customer-type-header">
                <div className="type-icon">{type.icon}</div>
                <div className="type-info">
                  <h5>{type.label}</h5>
                  <div className="customer-count">
                    <span className="count">
                      {typeData.count.toLocaleString()}
                    </span>
                    <span className="percentage">({percentage}%)</span>
                  </div>
                </div>
              </div>

              <div className="customer-type-stats">
                <div className="stat-item">
                  <span className="stat-label">Total Orders</span>
                  <span className="stat-value">
                    {typeData.totalOrders?.toLocaleString() || 0}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Total Spent</span>
                  <span className="stat-value">
                    ₹{typeData.totalSpent?.toLocaleString() || 0}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Avg Order Value</span>
                  <span className="stat-value">
                    ₹{typeData.avgOrderValue?.toLocaleString() || 0}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Engagement Rate</span>
                  <span className="stat-value">
                    {typeData.engagementRate || 0}%
                  </span>
                </div>
              </div>

              <div className="customer-type-actions">
                <button
                  className="btn-view-details"
                  onClick={() => handleViewDetails(type)}
                  disabled={typeData.count === 0}
                >
                  <Users size={16} />
                  View Individual Customers
                </button>
              </div>

              {typeData.count > 0 && (
                <div className="engagement-bar">
                  <div
                    className="engagement-fill"
                    style={{
                      width: `${Math.min(typeData.engagementRate || 0, 100)}%`,
                    }}
                  ></div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Individual Customers Modal */}
      {showDetailsModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowDetailsModal(false)}
        >
          <div
            className="customer-details-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>
                {selectedCustomerType?.icon} {selectedCustomerType?.label}{" "}
                Customers
              </h3>
              <button
                className="close-button"
                onClick={() => setShowDetailsModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-content">
              {loading ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Loading customer details...</p>
                </div>
              ) : individualCustomers.length > 0 ? (
                <div className="customers-table">
                  <div className="table-header">
                    <div className="header-stats">
                      <span>
                        Showing {individualCustomers.length} customers
                      </span>
                    </div>
                  </div>

                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>Customer</th>
                          <th>Contact</th>
                          <th>Orders</th>
                          <th>Total Spent</th>
                          <th>Avg Order</th>
                          <th>Loyalty Coins</th>
                          <th>Membership</th>
                          <th>Value Segment</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {individualCustomers.map((customer) => (
                          <tr key={customer._id}>
                            <td>
                              <div className="customer-info">
                                <div className="customer-avatar">
                                  {customer.name?.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="customer-name">
                                    {customer.name}
                                  </div>
                                  <div className="customer-id">
                                    ID: {customer.customerId}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="contact-info">
                                <div>{customer.email}</div>
                                <div>{customer.phoneNumber}</div>
                              </div>
                            </td>
                            <td>
                              <div className="order-stats">
                                <div className="total-orders">
                                  {customer.totalOrders}
                                </div>
                                <div className="completed-orders">
                                  {customer.completedOrders} completed
                                </div>
                              </div>
                            </td>
                            <td className="amount">
                              ₹{customer.totalSpent?.toLocaleString()}
                            </td>
                            <td className="amount">
                              ₹{customer.avgOrderValue?.toLocaleString()}
                            </td>
                            <td>
                              <div className="loyalty-info">
                                <div className="coins">
                                  {customer.loyaltyCoins} coins
                                </div>
                                <div className="earned">
                                  {customer.totalCoinsEarned} earned
                                </div>
                              </div>
                            </td>
                            <td>
                              <span
                                className={`tier-badge ${customer.membershipTier}`}
                              >
                                {customer.membershipTier?.toUpperCase()}
                              </span>
                            </td>
                            <td>
                              <span
                                className={`value-badge ${customer.customerValue?.toLowerCase().replace(" ", "-")}`}
                              >
                                {customer.customerValue}
                              </span>
                            </td>
                            <td>
                              <div className="customer-actions">
                                <button
                                  className="btn-view-profile"
                                  onClick={() =>
                                    handleViewCustomerProfile(customer)
                                  }
                                  title="View Profile"
                                >
                                  <Eye size={14} />
                                </button>
                                <button
                                  className="btn-send-message"
                                  onClick={() => handleSendMessage(customer)}
                                  title="Send Message"
                                >
                                  <Mail size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="empty-state">
                  <Users size={48} />
                  <h4>No customers found</h4>
                  <p>
                    No customers of this type have been found in the system.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper functions for customer actions
const handleViewCustomerProfile = (customer) => {
  // Implement customer profile view functionality
  console.log("Viewing profile for:", customer.name);
  // You can navigate to a detailed customer profile page or open another modal
};

const handleSendMessage = (customer) => {
  // Implement messaging functionality
  console.log("Sending message to:", customer.name);
  // You can open a message compose modal or redirect to messaging system
};

// ...rest of existing code...
const TopReferrersList = ({ referrers }) => {
  if (!referrers || referrers.length === 0) {
    return (
      <div className="empty-state">
        <UserPlus size={32} />
        <p>No referrers found</p>
      </div>
    );
  }

  return (
    <div className="referrers-list">
      {referrers.map((referrer, index) => (
        <div key={referrer._id || index} className="referrer-item">
          <div className="referrer-rank">#{index + 1}</div>
          <div className="referrer-info">
            <div className="referrer-name">{referrer.name}</div>
            <div className="referrer-id">{referrer.customerId}</div>
          </div>
          <div className="referrer-stats">
            <div className="referrer-count">
              {referrer.referralCount} referrals
            </div>
            <div className="referrer-rewards">
              {referrer.referralRewards || 0} coins
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
// Replace the existing PromotionsTab component starting at line 1908
const PromotionsTab = ({
  pendingPromotions,
  overview,
  loading,
  error,
  onRetry,
  onReviewPromotion,
}) => {
  if (loading) {
    return (
      <div className="loading-container">
        <RefreshCw className="loading-spinner" size={24} />
        <span>Loading promotions data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <AlertTriangle size={48} />
        <h3>Failed to Load Promotions</h3>
        <p>{error}</p>
        <button onClick={onRetry} className="btn btn-primary">
          <RefreshCw size={16} />
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="promotions-tab">
      {/* Promotions Overview Stats */}
      {overview && (
        <div className="stats-grid">
          <div className="stat-card yellow">
            <div className="stat-content">
              <div className="stat-info">
                <h3>{overview.stats?.pending || 0}</h3>
                <p>Pending Approval</p>
              </div>
              <div className="stat-icon">
                <Clock size={24} />
              </div>
            </div>
          </div>

          <div className="stat-card green">
            <div className="stat-content">
              <div className="stat-info">
                <h3>{overview.stats?.active || 0}</h3>
                <p>Active Promotions</p>
              </div>
              <div className="stat-icon">
                <CheckCircle size={24} />
              </div>
            </div>
          </div>

          <div className="stat-card red">
            <div className="stat-content">
              <div className="stat-info">
                <h3>{overview.stats?.rejected || 0}</h3>
                <p>Rejected</p>
              </div>
              <div className="stat-icon">
                <XCircle size={24} />
              </div>
            </div>
          </div>

          <div className="stat-card blue">
            <div className="stat-content">
              <div className="stat-info">
                <h3>{(overview.stats?.totalReach || 0).toLocaleString()}</h3>
                <p>Total Estimated Reach</p>
              </div>
              <div className="stat-icon">
                <Target size={24} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pending Promotions Table */}
      <div className="section-card">
        <div className="section-header">
          <h2>
            <Clock size={20} />
            Pending Promotion Approvals ({pendingPromotions?.length || 0})
          </h2>
        </div>

        {pendingPromotions && pendingPromotions.length > 0 ? (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Promotion</th>
                  <th>Supplier</th>
                  <th>Type</th>
                  <th>Benefits</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingPromotions.map((promotion) => (
                  <tr key={promotion._id}>
                    <td>
                      <div className="promotion-info">
                        <strong>{promotion.title}</strong>
                        <p className="text-muted">{promotion.description}</p>
                      </div>
                    </td>
                    <td>
                      <div className="supplier-info">
                        <strong>{promotion.supplier.name}</strong>
                        <p className="text-muted">{promotion.supplier.email}</p>
                      </div>
                    </td>
                    <td>
                      <span className={`badge badge-${promotion.type}`}>
                        {promotion.type.replace("_", " ").toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <div className="benefits-info">
                        {promotion.benefits.discountType === "percentage" && (
                          <span className="discount-badge">
                            {promotion.benefits.discountValue}% OFF
                          </span>
                        )}
                        {promotion.benefits.discountType === "fixed_amount" && (
                          <span className="discount-badge">
                            ₹{promotion.benefits.discountValue} OFF
                          </span>
                        )}
                        {promotion.conditions.minOrderValue > 0 && (
                          <small className="text-muted">
                            Min: ₹{promotion.conditions.minOrderValue}
                          </small>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="date-info">
                        {new Date(promotion.submittedAt).toLocaleDateString()}
                        <br />
                        <small className="text-muted">
                          {new Date(promotion.submittedAt).toLocaleTimeString()}
                        </small>
                      </div>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => onReviewPromotion(promotion)}
                          title="Review Promotion"
                        >
                          <Eye size={14} />
                          Review
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <Package size={48} />
            <h3>No Pending Promotions</h3>
            <p>All supplier promotions are up to date.</p>
          </div>
        )}
      </div>
    </div>
  );
};
const ProgramPerformanceChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="empty-state">
        <BarChart3 size={32} />
        <p>No program performance data available</p>
      </div>
    );
  }

  return (
    <div className="performance-chart">
      {data.map((program, index) => (
        <div key={program._id || index} className="performance-item">
          <div className="program-info">
            <div className="program-name">{program.name}</div>
            <div className="program-type">{program.type}</div>
          </div>
          <div className="program-stats">
            <div className="stat-item">
              <span className="stat-label">Usage</span>
              <span className="stat-value">{program.usageCount || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Savings</span>
              <span className="stat-value">
                ₹{(program.totalSavings || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
// MembershipConfigTab Component
const MembershipConfigTab = ({
  configs,
  stats,
  onConfigEdit,
  onConfigSave,
  onConfigCancel,
  onResetDefaults,
  editingConfig,
  configFormData,
  setConfigFormData,
  actionLoading,
}) => {
  const tierOrder = ["silver", "gold", "platinum"];
  const sortedConfigs = configs.sort(
    (a, b) => tierOrder.indexOf(a.tier) - tierOrder.indexOf(b.tier)
  );

  const handleInputChange = (field, value, nestedField = null) => {
    if (nestedField) {
      setConfigFormData((prev) => ({
        ...prev,
        [field]: {
          ...prev[field],
          [nestedField]: value,
        },
      }));
    } else {
      setConfigFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  return (
    <div className="membership-config-tab">
      <div className="config-header">
        <div className="header-info">
          <h2>Membership Tier Configuration</h2>
          <p>Configure requirements and benefits for each membership tier</p>
        </div>
        <div className="header-actions">
          <button
            className="btn btn-secondary"
            onClick={onResetDefaults}
            disabled={actionLoading === "reset-defaults"}
          >
            <RotateCcw size={16} />
            {actionLoading === "reset-defaults"
              ? "Resetting..."
              : "Reset to Defaults"}
          </button>
        </div>
      </div>

      {/* Statistics Overview */}
      {stats && (
        <div className="membership-stats">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon silver">
                <Shield size={24} />
              </div>
              <div className="stat-content">
                <h3>{stats.tierDistribution?.silver || 0}</h3>
                <p>Silver Members</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon gold">
                <Crown size={24} />
              </div>
              <div className="stat-content">
                <h3>{stats.tierDistribution?.gold || 0}</h3>
                <p>Gold Members</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon platinum">
                <Award size={24} />
              </div>
              <div className="stat-content">
                <h3>{stats.tierDistribution?.platinum || 0}</h3>
                <p>Platinum Members</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Configuration Cards */}
      <div className="config-cards">
        {sortedConfigs.map((config) => (
          <div key={config.tier} className={`config-card ${config.tier}`}>
            <div className="card-header">
              <div className="tier-info">
                <h3 className="tier-name">
                  {config.tier.charAt(0).toUpperCase() + config.tier.slice(1)}{" "}
                  Tier
                </h3>
                {editingConfig !== config.tier && (
                  <button
                    className="edit-btn"
                    onClick={() => onConfigEdit(config)}
                  >
                    <Edit size={16} />
                  </button>
                )}
              </div>
            </div>

            <div className="card-content">
              {editingConfig === config.tier ? (
                // Edit Mode
                <div className="edit-form">
                  <div className="form-section">
                    <h4>Requirements</h4>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Minimum Orders</label>
                        <input
                          type="number"
                          value={configFormData.requirements?.minOrders || 0}
                          onChange={(e) =>
                            handleInputChange(
                              "requirements",
                              parseInt(e.target.value) || 0,
                              "minOrders"
                            )
                          }
                          min="0"
                        />
                      </div>
                      <div className="form-group">
                        <label>Minimum Spending (₹)</label>
                        <input
                          type="number"
                          value={configFormData.requirements?.minSpending || 0}
                          onChange={(e) =>
                            handleInputChange(
                              "requirements",
                              parseInt(e.target.value) || 0,
                              "minSpending"
                            )
                          }
                          min="0"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-section">
                    <h4>Benefits</h4>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Discount Percentage (%)</label>
                        <input
                          type="number"
                          value={
                            configFormData.benefits?.discountPercentage || 0
                          }
                          onChange={(e) =>
                            handleInputChange(
                              "benefits",
                              parseInt(e.target.value) || 0,
                              "discountPercentage"
                            )
                          }
                          min="0"
                          max="50"
                        />
                      </div>
                      <div className="form-group">
                        <label>Free Delivery Threshold (₹)</label>
                        <input
                          type="number"
                          value={
                            configFormData.benefits?.freeDeliveryThreshold || 0
                          }
                          onChange={(e) =>
                            handleInputChange(
                              "benefits",
                              parseInt(e.target.value) || 0,
                              "freeDeliveryThreshold"
                            )
                          }
                          min="0"
                        />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>AggreCoins Multiplier</label>
                        <input
                          type="number"
                          value={
                            configFormData.benefits?.aggreCoinsMultiplier || 1
                          }
                          onChange={(e) =>
                            handleInputChange(
                              "benefits",
                              parseFloat(e.target.value) || 1,
                              "aggreCoinsMultiplier"
                            )
                          }
                          min="1"
                          max="5"
                          step="0.1"
                        />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>
                          <input
                            type="checkbox"
                            checked={
                              configFormData.benefits?.prioritySupport || false
                            }
                            onChange={(e) =>
                              handleInputChange(
                                "benefits",
                                e.target.checked,
                                "prioritySupport"
                              )
                            }
                          />
                          Priority Support
                        </label>
                      </div>
                      <div className="form-group">
                        <label>
                          <input
                            type="checkbox"
                            checked={
                              configFormData.benefits?.exclusiveDeals || false
                            }
                            onChange={(e) =>
                              handleInputChange(
                                "benefits",
                                e.target.checked,
                                "exclusiveDeals"
                              )
                            }
                          />
                          Exclusive Deals
                        </label>
                      </div>
                      <div className="form-group">
                        <label>
                          <input
                            type="checkbox"
                            checked={
                              configFormData.benefits?.earlyAccess || false
                            }
                            onChange={(e) =>
                              handleInputChange(
                                "benefits",
                                e.target.checked,
                                "earlyAccess"
                              )
                            }
                          />
                          Early Access
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="form-actions">
                    <button
                      className="btn btn-success"
                      onClick={() => onConfigSave(config.tier)}
                      disabled={actionLoading === `config-${config.tier}`}
                    >
                      <Save size={16} />
                      {actionLoading === `config-${config.tier}`
                        ? "Saving..."
                        : "Save Changes"}
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={onConfigCancel}
                    >
                      <X size={16} />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // View Mode
                <div className="config-display">
                  <div className="config-section">
                    <h4>Requirements</h4>
                    <div className="config-items">
                      <div className="config-item">
                        <span className="label">Minimum Orders:</span>
                        <span className="value">
                          {config.requirements?.minOrders || 0}
                        </span>
                      </div>
                      <div className="config-item">
                        <span className="label">Minimum Spending:</span>
                        <span className="value">
                          ₹
                          {config.requirements?.minSpending?.toLocaleString() ||
                            0}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="config-section">
                    <h4>Benefits</h4>
                    <div className="config-items">
                      <div className="config-item">
                        <span className="label">Discount:</span>
                        <span className="value">
                          {config.benefits?.discountPercentage || 0}%
                        </span>
                      </div>
                      <div className="config-item">
                        <span className="label">Free Delivery:</span>
                        <span className="value">
                          ₹
                          {config.benefits?.freeDeliveryThreshold?.toLocaleString() ||
                            0}
                          +
                        </span>
                      </div>
                      <div className="config-item">
                        <span className="label">Coins Multiplier:</span>
                        <span className="value">
                          {config.benefits?.aggreCoinsMultiplier || 1}x
                        </span>
                      </div>
                    </div>
                    <div className="config-features">
                      {config.benefits?.prioritySupport && (
                        <span className="feature">Priority Support</span>
                      )}
                      {config.benefits?.exclusiveDeals && (
                        <span className="feature">Exclusive Deals</span>
                      )}
                      {config.benefits?.earlyAccess && (
                        <span className="feature">Early Access</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ADD THESE COMPONENTS BEFORE THE EXPORT STATEMENT (around line 2500)
const CouponTrackingTab = ({
  analytics,
  usageDetails,
  usageSummary,
  selectedCoupon,
  activeView,
  filters,
  loading,
  error,
  actionLoading,
  onViewChange,
  onCouponSelect,
  onFiltersChange,
  onLoadUsageDetails,
  onLoadUsageSummary,
  onExport,
  onRetry,
}) => {
  if (error) {
    return (
      <div className="error-state">
        <AlertTriangle size={48} />
        <h3>Failed to load coupon tracking data</h3>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={onRetry}>
          <RefreshCw size={16} />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="coupon-tracking-tab">
      <div className="tab-header">
        <h2>
          <Ticket size={24} />
          Coupon Tracking & Analytics
        </h2>
        <div className="tab-actions">
          <div className="view-selector">
            <button
              className={`btn btn-sm ${activeView === "overview" ? "btn-primary" : "btn-outline"}`}
              onClick={() => onViewChange("overview")}
            >
              <BarChart3 size={16} />
              Overview
            </button>
            <button
              className={`btn btn-sm ${activeView === "summary" ? "btn-primary" : "btn-outline"}`}
              onClick={() => onViewChange("summary")}
            >
              <Activity size={16} />
              Summary
            </button>
            {selectedCoupon && (
              <button
                className={`btn btn-sm ${activeView === "details" ? "btn-primary" : "btn-outline"}`}
                onClick={() => onViewChange("details")}
              >
                <FileText size={16} />
                Details
              </button>
            )}
          </div>
          <button
            className="btn btn-success btn-sm"
            onClick={onExport}
            disabled={actionLoading === "export-coupons"}
          >
            <Download size={16} />
            {actionLoading === "export-coupons" ? "Exporting..." : "Export"}
          </button>
        </div>
      </div>

      {/* Overview Tab */}
      {activeView === "overview" && (
        <CouponOverview
          analytics={analytics}
          loading={loading}
          onCouponSelect={onCouponSelect}
        />
      )}

      {/* Summary Tab */}
      {activeView === "summary" && (
        <CouponUsageSummary
          summary={usageSummary}
          filters={filters}
          loading={loading}
          onFiltersChange={onFiltersChange}
          onLoadData={onLoadUsageSummary}
        />
      )}

      {/* Details Tab */}
      {activeView === "details" && selectedCoupon && (
        <CouponUsageDetails
          coupon={selectedCoupon}
          usageDetails={usageDetails}
          loading={loading}
          onLoadData={onLoadUsageDetails}
        />
      )}
    </div>
  );
};

// Coupon Overview Component
const CouponOverview = ({ analytics, loading, onCouponSelect }) => {
  if (loading || !analytics) {
    return (
      <div className="loading-state">
        <RefreshCw size={24} className="spin" />
        <p>Loading coupon analytics...</p>
      </div>
    );
  }

  const { overallStats, coupons } = analytics;

  return (
    <div className="coupon-overview">
      {/* Overall Statistics */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <Ticket size={24} />
          </div>
          <div className="stat-content">
            <h3>{overallStats.totalCoupons}</h3>
            <p>Total Coupons</p>
            <small>{overallStats.activeCoupons} active</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Award size={24} />
          </div>
          <div className="stat-content">
            <h3>{overallStats.totalAwarded.toLocaleString()}</h3>
            <p>Coupons Awarded</p>
            <small>Total distributed</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <h3>{overallStats.totalUsed.toLocaleString()}</h3>
            <p>Coupons Used</p>
            <small>{overallStats.overallUsageRate}% usage rate</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Coins size={24} />
          </div>
          <div className="stat-content">
            <h3>₹{overallStats.totalSavings.toLocaleString()}</h3>
            <p>Total Savings</p>
            <small>Customer savings</small>
          </div>
        </div>
      </div>

      {/* Coupon List */}
      <div className="coupon-list-container">
        <h3>Coupon Performance</h3>
        <div className="coupon-list">
          {coupons.map((coupon) => (
            <div
              key={coupon._id}
              className="coupon-card"
              onClick={() => onCouponSelect(coupon)}
            >
              <div className="coupon-header">
                <h4>{coupon.name}</h4>
                <span
                  className={`status ${coupon.isActive ? "active" : "inactive"}`}
                >
                  {coupon.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="coupon-details">
                <p>
                  <strong>Code:</strong> {coupon.code}
                </p>
                <p>
                  <strong>Program ID:</strong> {coupon.programId}
                </p>
              </div>

              <div className="coupon-stats">
                <div className="stat">
                  <span className="value">{coupon.stats.totalAwarded}</span>
                  <span className="label">Awarded</span>
                </div>
                <div className="stat">
                  <span className="value">{coupon.stats.totalUsed}</span>
                  <span className="label">Used</span>
                </div>
                <div className="stat">
                  <span className="value">{coupon.stats.usageRate}%</span>
                  <span className="label">Usage Rate</span>
                </div>
                <div className="stat">
                  <span className="value">₹{coupon.stats.totalSavings}</span>
                  <span className="label">Savings</span>
                </div>
              </div>

              {coupon.stats.recentUsages.length > 0 && (
                <div className="recent-usage">
                  <h5>Recent Usage</h5>
                  {coupon.stats.recentUsages.slice(0, 3).map((usage, index) => (
                    <div key={index} className="usage-item">
                      <span className="user">{usage.userName}</span>
                      <span className="tier">{usage.membershipTier}</span>
                      <span className="amount">₹{usage.discountApplied}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="coupon-actions">
                <button className="btn btn-sm btn-primary">
                  View Details →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Coupon Usage Summary Component
const CouponUsageSummary = ({
  summary,
  filters,
  loading,
  onFiltersChange,
  onLoadData,
}) => {
  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    onFiltersChange(newFilters);
    onLoadData(newFilters.period, newFilters.groupBy);
  };

  return (
    <div className="coupon-usage-summary">
      <div className="summary-header">
        <h3>Usage Summary</h3>
        <div className="filters">
          <select
            value={filters.period}
            onChange={(e) => handleFilterChange("period", e.target.value)}
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last 1 year</option>
          </select>

          <select
            value={filters.sortBy}
            onChange={(e) => handleFilterChange("sortBy", e.target.value)}
          >
            <option value="totalUsage">Usage Frequency</option>
            <option value="uniqueCoupons">Unique Coupons</option>
            <option value="totalSavings">Total Savings</option>
            <option value="lastUsed">Last Usage</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <RefreshCw size={24} className="spin" />
          <p>Loading usage summary...</p>
        </div>
      ) : summary ? (
        <div className="summary-content">
          <div className="summary-stats">
            <p>
              <strong>Period:</strong> {filters.period}
            </p>
            <p>
              <strong>Grouped by:</strong> {filters.groupBy}
            </p>
            <p>
              <strong>Total entries:</strong> {summary.data.length}
            </p>
          </div>

          <div className="summary-table">
            <table>
              <thead>
                <tr>
                  <th>
                    {filters.groupBy === "time"
                      ? "Date"
                      : filters.groupBy.charAt(0).toUpperCase() +
                        filters.groupBy.slice(1)}
                  </th>
                  <th>Usage Count</th>
                  <th>Unique Users</th>
                  <th>Total Savings</th>
                  <th>Average Savings</th>
                </tr>
              </thead>
              <tbody>
                {summary.data.map((item, index) => (
                  <tr key={index}>
                    <td>
                      {filters.groupBy === "time" && item.date
                        ? new Date(item.date).toLocaleDateString()
                        : item._id || "Unknown"}
                    </td>
                    <td>{item.count}</td>
                    <td>{item.uniqueUserCount}</td>
                    <td>₹{item.totalSavings}</td>
                    <td>₹{item.avgSavings}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <Activity size={48} />
          <p>No usage data available</p>
        </div>
      )}
    </div>
  );
};

// Coupon Usage Details Component
const CouponUsageDetails = ({ usageDetails, loading, onLoadData }) => {
  if (loading || !usageDetails) {
    return (
      <div className="loading-state">
        <RefreshCw size={24} className="spin" />
        <p>Loading usage details...</p>
      </div>
    );
  }

  const {
    coupon: couponInfo,
    usageDetails: details,
    pagination,
  } = usageDetails;

  return (
    <div className="coupon-usage-details">
      <div className="details-header">
        <h3>Usage Details: {couponInfo.name}</h3>
        <div className="coupon-info">
          <span>
            <strong>Code:</strong> {couponInfo.code}
          </span>
          <span>
            <strong>Program ID:</strong> {couponInfo.programId}
          </span>
        </div>
      </div>

      <div className="details-table-container">
        <table className="usage-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Customer Type</th>
              <th>Membership Tier</th>
              <th>Status</th>
              <th>Used Date</th>
              <th>Discount Applied</th>
              <th>Order ID</th>
            </tr>
          </thead>
          <tbody>
            {details.map((detail, index) => (
              <tr key={index}>
                <td>
                  <div className="user-info">
                    <strong>{detail.user.name}</strong>
                    <small>{detail.user.email}</small>
                  </div>
                </td>
                <td>
                  <span className={`customer-type ${detail.user.customerType}`}>
                    {detail.user.customerType.replace("_", " ")}
                  </span>
                </td>
                <td>
                  <span className={`tier ${detail.user.membershipTier}`}>
                    {detail.user.membershipTier}
                  </span>
                </td>
                <td>
                  <span
                    className={`status ${detail.used ? "used" : "awarded"}`}
                  >
                    {detail.used ? "Used" : "Awarded"}
                  </span>
                </td>
                <td>
                  {detail.usedAt
                    ? new Date(detail.usedAt).toLocaleDateString()
                    : "Not used"}
                </td>
                <td>
                  {detail.discountApplied ? `₹${detail.discountApplied}` : "-"}
                </td>
                <td>{detail.order?.orderId || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() =>
              onLoadData(couponInfo._id, pagination.currentPage - 1)
            }
            disabled={pagination.currentPage === 1}
            className="btn btn-sm btn-outline"
          >
            Previous
          </button>
          <span>
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <button
            onClick={() =>
              onLoadData(couponInfo._id, pagination.currentPage + 1)
            }
            disabled={pagination.currentPage === pagination.totalPages}
            className="btn btn-sm btn-outline"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

// User Frequency Tracking Tab Component
const UserFrequencyTab = ({
  frequencyData,
  userHistory,
  filters,
  loading,
  error,
  actionLoading,
  onFiltersChange,
  onUserSelect,
  onExport,
  onRetry,
}) => {
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const handleFilterChange = (key, value) => {
    onFiltersChange((prev) => ({ ...prev, [key]: value }));
  };

  const getEngagementColor = (score) => {
    if (score >= 80) return "var(--success-color)";
    if (score >= 60) return "var(--warning-color)";
    if (score >= 40) return "var(--info-color)";
    return "var(--error-color)";
  };

  const getPatternBadgeClass = (pattern) => {
    switch (pattern) {
      case "Very Active":
        return "pattern-badge very-active";
      case "Active":
        return "pattern-badge active";
      case "Moderate":
        return "pattern-badge moderate";
      case "Low":
        return "pattern-badge low";
      default:
        return "pattern-badge inactive";
    }
  };

  if (loading && !frequencyData) {
    return (
      <div className="tab-loading">
        <RefreshCw className="loading-spinner" />
        <span>Loading user frequency data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state">
        <AlertTriangle size={48} />
        <h3>Error Loading Frequency Data</h3>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={onRetry}>
          <RefreshCw size={16} />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="user-frequency-tab">
      <div className="frequency-header">
        <div className="frequency-title">
          <Users size={24} />
          <div>
            <h2>User Coupon Frequency Analysis</h2>
            <p>
              Track how frequently users engage with coupons and identify usage
              patterns
            </p>
          </div>
        </div>

        <div className="frequency-actions">
          <button
            className="btn btn-outline"
            onClick={onExport}
            disabled={actionLoading === "export-frequency"}
          >
            {actionLoading === "export-frequency" ? (
              <RefreshCw size={16} className="loading-spinner" />
            ) : (
              <Download size={16} />
            )}
            Export Data
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="frequency-filters">
        <div className="filter-group">
          <label>Sort By</label>
          <select
            value={filters.sortBy}
            onChange={(e) => handleFilterChange("sortBy", e.target.value)}
          >
            <option value="usage_frequency">Usage Frequency</option>
            <option value="engagement_score">Engagement Score</option>
            <option value="total_savings">Total Savings</option>
            <option value="last_usage">Last Usage</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Order</label>
          <select
            value={filters.sortOrder}
            onChange={(e) => handleFilterChange("sortOrder", e.target.value)}
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Min Usage Count</label>
          <input
            type="number"
            placeholder="e.g., 5"
            value={filters.minUsage || ""}
            onChange={(e) =>
              handleFilterChange(
                "minUsage",
                e.target.value ? parseInt(e.target.value) : undefined
              )
            }
          />
        </div>

        <div className="filter-group">
          <label>State</label>
          <input
            type="text"
            placeholder="e.g., Karnataka"
            value={filters.state || ""}
            onChange={(e) =>
              handleFilterChange("state", e.target.value || undefined)
            }
          />
        </div>

        <div className="filter-group">
          <label>City</label>
          <input
            type="text"
            placeholder="e.g., Bangalore"
            value={filters.city || ""}
            onChange={(e) =>
              handleFilterChange("city", e.target.value || undefined)
            }
          />
        </div>
        <div className="filter-group">
          <label>Customer Type</label>
          <select
            value={filters.customerType || ""}
            onChange={(e) =>
              handleFilterChange("customerType", e.target.value || undefined)
            }
          >
            <option value="">All Types</option>
            <option value="house_owner">House Owner</option>
            <option value="mason">Mason</option>
            <option value="builder_contractor">Builder/Contractor</option>
            <option value="others">Others</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Membership Tier</label>
          <select
            value={filters.membershipTier || ""}
            onChange={(e) =>
              handleFilterChange("membershipTier", e.target.value || undefined)
            }
          >
            <option value="">All Tiers</option>
            <option value="silver">Silver</option>
            <option value="gold">Gold</option>
            <option value="platinum">Platinum</option>
          </select>
        </div>
      </div>

      {/* Summary Stats */}
      {frequencyData?.summary && (
        <div className="frequency-summary">
          <div className="summary-card">
            <div className="summary-content">
              <div className="summary-value">
                {frequencyData.summary.totalUsers}
              </div>
              <div className="summary-label">Total Users</div>
            </div>
            <Users size={24} className="summary-icon" />
          </div>

          <div className="summary-card">
            <div className="summary-content">
              <div className="summary-value">
                {frequencyData.summary.avgUsageFrequency?.toFixed(1) || 0}
              </div>
              <div className="summary-label">Avg Usage Frequency</div>
            </div>
            <Activity size={24} className="summary-icon" />
          </div>

          <div className="summary-card">
            <div className="summary-content">
              <div className="summary-value">
                {frequencyData.summary.avgEngagementScore?.toFixed(0) || 0}
              </div>
              <div className="summary-label">Avg Engagement Score</div>
            </div>
            <Target size={24} className="summary-icon" />
          </div>

          <div className="summary-card">
            <div className="summary-content">
              <div className="summary-value">
                ₹{frequencyData.summary.totalSavings?.toLocaleString() || 0}
              </div>
              <div className="summary-label">Total User Savings</div>
            </div>
            <Coins size={24} className="summary-icon" />
          </div>
        </div>
      )}

      {/* User Frequency Table */}
      {frequencyData?.users && (
        <div className="frequency-table-container">
          <div className="table-header">
            <h3>User Frequency Details</h3>
            <span className="result-count">
              {frequencyData.users.length} users found
            </span>
          </div>

          <div className="frequency-table">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Usage Frequency</th>
                  <th>Unique Coupons</th>
                  <th>Total Savings</th>
                  <th>Location</th> {/* ADD THIS LINE */}
                  <th>Engagement Score</th>
                  <th>Usage Pattern</th>
                  <th>Last Usage</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {frequencyData.users.map((user) => (
                  <tr key={user._id}>
                    <td>
                      <div className="user-info">
                        <div className="user-details">
                          <div className="user-name">{user.userName}</div>
                          <div className="user-email">{user.userEmail}</div>
                          <div className="user-meta">
                            <span className="user-type">
                              {user.customerType}
                            </span>
                            <span className="user-tier">
                              {user.membershipTier}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="location-info">
                        {user.location?.city && user.location?.state ? (
                          <>
                            <div className="city">{user.location.city}</div>
                            <div className="state">{user.location.state}</div>
                          </>
                        ) : (
                          <span className="no-location">-</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="usage-frequency">
                        <div className="frequency-number">
                          {user.totalCouponsUsed}
                        </div>
                        <div className="frequency-label">times</div>
                      </div>
                    </td>
                    <td>
                      <div className="unique-coupons">{user.uniqueCoupons}</div>
                    </td>
                    <td>
                      <div className="total-savings">
                        ₹{user.totalSavings?.toLocaleString() || 0}
                      </div>
                    </td>
                    <td>
                      <div className="engagement-score">
                        <div
                          className="score-bar"
                          style={{
                            width: `${user.engagementScore}%`,
                            backgroundColor: getEngagementColor(
                              user.engagementScore
                            ),
                          }}
                        >
                          <span className="score-text">
                            {user.engagementScore}%
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={getPatternBadgeClass(user.usagePattern)}>
                        {user.usagePattern}
                      </span>
                    </td>
                    <td>
                      <div className="last-usage">
                        {user.lastCouponUsed ? (
                          <>
                            <div>
                              {new Date(
                                user.lastCouponUsed
                              ).toLocaleDateString()}
                            </div>
                            <div className="time-ago">
                              {Math.floor(
                                (new Date() - new Date(user.lastCouponUsed)) /
                                  (1000 * 60 * 60 * 24)
                              )}{" "}
                              days ago
                            </div>
                          </>
                        ) : (
                          <span className="no-usage">Never</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => {
                          onUserSelect(user._id);
                          setShowHistoryModal(true);
                        }}
                        disabled={actionLoading === "history"}
                      >
                        <Eye size={14} />
                        View History
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User History Modal */}
      {showHistoryModal && userHistory && (
        <div
          className="modal-overlay"
          onClick={() => setShowHistoryModal(false)}
        >
          <div
            className="modal-content user-history-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Coupon Usage History</h3>
              <button
                className="modal-close"
                onClick={() => setShowHistoryModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              {/* User Summary */}
              <div className="history-summary">
                <div className="user-info">
                  <h4>{userHistory.user?.name}</h4>
                  <p>{userHistory.user?.email}</p>
                  <div className="user-badges">
                    <span className="badge">
                      {userHistory.user?.customerType}
                    </span>
                    <span className="badge">
                      {userHistory.user?.membershipTier}
                    </span>
                  </div>
                </div>

                <div className="history-stats">
                  <div className="stat">
                    <div className="stat-value">
                      {userHistory.summary?.totalUsage || 0}
                    </div>
                    <div className="stat-label">Total Usage</div>
                  </div>
                  <div className="stat">
                    <div className="stat-value">
                      ₹
                      {userHistory.summary?.totalSavings?.toLocaleString() || 0}
                    </div>
                    <div className="stat-label">Total Savings</div>
                  </div>
                  <div className="stat">
                    <div className="stat-value">
                      {userHistory.summary?.uniqueCoupons || 0}
                    </div>
                    <div className="stat-label">Unique Coupons</div>
                  </div>
                </div>
              </div>

              {/* Usage History */}
              <div className="usage-history">
                <h4>Usage Timeline</h4>
                {userHistory.history && userHistory.history.length > 0 ? (
                  <div className="history-timeline">
                    {userHistory.history.map((usage, index) => (
                      <div key={index} className="timeline-item">
                        <div className="timeline-date">
                          {new Date(usage.usedAt).toLocaleDateString()}
                        </div>
                        <div className="timeline-content">
                          <div className="coupon-name">{usage.couponCode}</div>
                          <div className="usage-details">
                            <span>Saved: ₹{usage.discountAmount}</span>
                            <span>Order: #{usage.orderId}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-history">
                    <Activity size={48} />
                    <p>No usage history found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {!frequencyData?.users?.length && !loading && (
        <div className="empty-state">
          <Users size={48} />
          <h3>No User Data Found</h3>
          <p>No users match the current filter criteria.</p>
        </div>
      )}
    </div>
  );
};
export default AdminLoyaltyManagement;
