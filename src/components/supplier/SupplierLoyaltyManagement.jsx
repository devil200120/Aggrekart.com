import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit3,
  Trash2,
  Eye,
  ToggleLeft,
  ToggleRight,
  TrendingUp,
  Users,
  Target,
  Calendar,
  DollarSign,
  Gift,
  Tag,
  MapPin,
  Clock,
  BarChart3,
  Settings,
  CheckCircle,
  AlertCircle,
  XCircle,
  Award,
  Percent,
  Filter,
  Search,
  RefreshCw,
} from "lucide-react";
import { toast } from "react-hot-toast";
import loyaltyService from "../../services/loyaltyService";
import CreatePromotionModal from "./CreatePromotionModal";
import EditPromotionModal from "./EditPromotionModal";
import PromotionAnalyticsModal from "./PromotionAnalyticsModal";
import "./SupplierLoyaltyManagement.css";

const SupplierLoyaltyManagement = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [promotions, setPromotions] = useState([]);
  const [promotionFilters, setPromotionFilters] = useState({
    status: "",
    type: "",
    page: 1,
    limit: 10,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState(null);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [selectedPromotionAnalytics, setSelectedPromotionAnalytics] =
    useState(null);

  // Load dashboard data on component mount
  useEffect(() => {
    loadDashboardData();
  }, []);

  // Load promotions when filters change or tab switches to promotions
  useEffect(() => {
    if (activeTab === "promotions") {
      loadPromotions();
    }
  }, [activeTab, promotionFilters]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await loyaltyService.getSupplierLoyaltyDashboard();
      setDashboardData(data);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      toast.error("Failed to load loyalty dashboard");
    } finally {
      setLoading(false);
    }
  };

  const loadPromotions = async () => {
    try {
      const data = await loyaltyService.getSupplierPromotions(promotionFilters);
      setPromotions(data.promotions || []);
    } catch (error) {
      console.error("Failed to load promotions:", error);
      toast.error("Failed to load promotions");
    }
  };

  const handleTogglePromotion = async (promotionId, currentStatus) => {
    try {
      await loyaltyService.toggleSupplierPromotionStatus(
        promotionId,
        !currentStatus
      );
      toast.success(
        `Promotion ${!currentStatus ? "activated" : "deactivated"} successfully`
      );
      loadPromotions();
      if (activeTab === "dashboard") {
        loadDashboardData();
      }
    } catch (error) {
      toast.error("Failed to update promotion status");
    }
  };

  const handleDeletePromotion = async (promotionId) => {
    if (
      !confirm(
        "Are you sure you want to delete this promotion? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await loyaltyService.deleteSupplierPromotion(promotionId);
      toast.success("Promotion deleted successfully");
      loadPromotions();
      if (activeTab === "dashboard") {
        loadDashboardData();
      }
    } catch (error) {
      toast.error("Failed to delete promotion");
    }
  };

  const handleViewAnalytics = async (promotion) => {
    try {
      const analytics = await loyaltyService.getSupplierPromotionAnalytics(
        promotion.id
      );
      setSelectedPromotionAnalytics({ ...promotion, analytics });
      setShowAnalyticsModal(true);
    } catch (error) {
      toast.error("Failed to load promotion analytics");
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "active":
        return <CheckCircle className="text-green-500" size={16} />;
      case "pending_approval":
        return <Clock className="text-yellow-500" size={16} />;
      case "rejected":
        return <XCircle className="text-red-500" size={16} />;
      case "paused":
        return <AlertCircle className="text-gray-500" size={16} />;
      case "expired":
        return <XCircle className="text-gray-400" size={16} />;
      default:
        return <AlertCircle className="text-gray-400" size={16} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "status-active";
      case "pending_approval":
        return "status-pending";
      case "rejected":
        return "status-rejected";
      case "paused":
        return "status-paused";
      case "expired":
        return "status-expired";
      default:
        return "status-draft";
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const filteredPromotions = promotions.filter(
    (promotion) =>
      promotion.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      promotion.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="supplier-loyalty-loading">
        <div className="loyalty-spinner">
          <RefreshCw className="animate-spin" size={32} />
        </div>
        <h3>Loading Loyalty Management...</h3>
        <p>Please wait while we fetch your promotion data...</p>
      </div>
    );
  }

  return (
    <div className="supplier-loyalty-management">
      {/* Header */}
      <div className="loyalty-header">
        <div className="loyalty-header-content">
          <h1>
            <Gift className="header-icon" />
            Loyalty & Promotions
          </h1>
          <p>Create and manage customer promotions to boost your sales</p>
        </div>
        <button
          className="create-promotion-btn primary"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus size={20} />
          Create Promotion
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="loyalty-nav">
        <button
          className={`nav-tab ${activeTab === "dashboard" ? "active" : ""}`}
          onClick={() => setActiveTab("dashboard")}
        >
          <BarChart3 size={20} />
          Dashboard
        </button>
        <button
          className={`nav-tab ${activeTab === "promotions" ? "active" : ""}`}
          onClick={() => setActiveTab("promotions")}
        >
          <Gift size={20} />
          My Promotions
        </button>
        <button
          className={`nav-tab ${activeTab === "analytics" ? "active" : ""}`}
          onClick={() => setActiveTab("analytics")}
        >
          <TrendingUp size={20} />
          Analytics
        </button>
      </div>

      {/* Dashboard Tab */}
      {activeTab === "dashboard" && dashboardData && (
        <div className="loyalty-dashboard">
          {/* Overview Cards */}
          <div className="dashboard-cards">
            <div className="loyalty-card">
              <div className="card-icon bg-blue">
                <Gift size={24} />
              </div>
              <div className="card-content">
                <h3>{dashboardData.overview.activePromotions}</h3>
                <p>Active Promotions</p>
                <span className="card-trend">
                  {dashboardData.overview.pendingApproval > 0 &&
                    `+${dashboardData.overview.pendingApproval} pending`}
                </span>
              </div>
            </div>

            <div className="loyalty-card">
              <div className="card-icon bg-green">
                <Users size={24} />
              </div>
              <div className="card-content">
                <h3>{dashboardData.overview.totalCustomers}</h3>
                <p>Total Customers</p>
                <span className="card-trend">This month</span>
              </div>
            </div>

            <div className="loyalty-card">
              <div className="card-icon bg-purple">
                <TrendingUp size={24} />
              </div>
              <div className="card-content">
                <h3>{dashboardData.promotionAnalytics.conversionRate}%</h3>
                <p>Conversion Rate</p>
                <span className="card-trend">
                  {dashboardData.promotionAnalytics.totalConversions}{" "}
                  conversions
                </span>
              </div>
            </div>

            <div className="loyalty-card">
              <div className="card-icon bg-orange">
                <DollarSign size={24} />
              </div>
              <div className="card-content">
                <h3>
                  {formatCurrency(
                    dashboardData.promotionAnalytics.totalSavings
                  )}
                </h3>
                <p>Customer Savings</p>
                <span className="card-trend">Total provided</span>
              </div>
            </div>
          </div>

          {/* Customer Distribution */}
          <div className="dashboard-section">
            <h3>Customer Distribution by Type</h3>
            <div className="customer-distribution">
              {dashboardData.customerDistribution.map((customer, index) => (
                <div key={index} className="distribution-item">
                  <div className="distribution-info">
                    <div className="customer-type-badge">
                      <Users size={16} />
                      <h4>
                        {customer.customerType.replace("_", " ").toUpperCase()}
                      </h4>
                    </div>
                    <p>{customer.count} customers</p>
                  </div>
                  <div className="distribution-stats">
                    <span className="total-value">
                      {formatCurrency(customer.totalValue)}
                    </span>
                    <span className="avg-value">
                      Avg: {formatCurrency(customer.avgOrderValue)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Performing Promotions */}
          {dashboardData.topPromotions &&
            dashboardData.topPromotions.length > 0 && (
              <div className="dashboard-section">
                <h3>Top Performing Promotions</h3>
                <div className="top-promotions">
                  {dashboardData.topPromotions.map((promo, index) => (
                    <div key={index} className="promotion-item">
                      <div className="promotion-rank">
                        <Award size={16} />#{index + 1}
                      </div>
                      <div className="promotion-info">
                        <h4>{promo.title}</h4>
                        <span className="promotion-type">
                          {promo.type.replace("_", " ")}
                        </span>
                      </div>
                      <div className="promotion-stats">
                        <span className="conversions">
                          {promo.conversions} uses
                        </span>
                        <span className="savings">
                          {formatCurrency(promo.savings)} saved
                        </span>
                        <span className="rate">
                          {promo.conversionRate}% rate
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>
      )}

      {/* Promotions Tab */}
      {activeTab === "promotions" && (
        <div className="promotions-section">
          {/* Filters and Search */}
          <div className="promotions-controls">
            <div className="promotions-filters">
              <div className="filter-group">
                <Filter size={16} />
                <select
                  value={promotionFilters.status}
                  onChange={(e) =>
                    setPromotionFilters((prev) => ({
                      ...prev,
                      status: e.target.value,
                      page: 1,
                    }))
                  }
                >
                  <option value="">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="pending_approval">Pending Approval</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="expired">Expired</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div className="filter-group">
                <Tag size={16} />
                <select
                  value={promotionFilters.type}
                  onChange={(e) =>
                    setPromotionFilters((prev) => ({
                      ...prev,
                      type: e.target.value,
                      page: 1,
                    }))
                  }
                >
                  <option value="">All Types</option>
                  <option value="discount">Discount</option>
                  <option value="coupon">Coupon</option>
                  <option value="free_delivery">Free Delivery</option>
                  <option value="bulk_discount">Bulk Discount</option>
                  <option value="seasonal">Seasonal</option>
                  <option value="referral">Referral</option>
                </select>
              </div>
            </div>

            <div className="search-group">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search promotions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>

          {/* Promotions List */}
          <div className="promotions-list">
            {filteredPromotions.length === 0 ? (
              <div className="empty-state">
                <Gift size={48} />
                <h3>No Promotions Yet</h3>
                <p>
                  Create your first promotion to start attracting customers and
                  boost your sales
                </p>
                <button
                  className="create-promotion-btn primary"
                  onClick={() => setShowCreateModal(true)}
                >
                  <Plus size={20} />
                  Create Promotion
                </button>
              </div>
            ) : (
              filteredPromotions.map((promotion) => (
                <div key={promotion.id} className="promotion-card">
                  <div className="promotion-header">
                    <div className="promotion-title-section">
                      <h4>{promotion.title}</h4>
                      <div className="promotion-meta">
                        <span
                          className={`status-badge ${getStatusColor(promotion.status)}`}
                        >
                          {getStatusIcon(promotion.status)}
                          {promotion.status.replace("_", " ")}
                        </span>
                        <span className="promotion-type">
                          {promotion.type.replace("_", " ")}
                        </span>
                        {promotion.couponCode && (
                          <span className="coupon-code">
                            <Tag size={14} />
                            {promotion.couponCode}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="promotion-actions">
                      <button
                        className="action-btn analytics"
                        onClick={() => handleViewAnalytics(promotion)}
                        title="View Analytics"
                      >
                        <BarChart3 size={16} />
                      </button>
                      <button
                        className="action-btn toggle"
                        onClick={() =>
                          handleTogglePromotion(
                            promotion.id,
                            promotion.isActive
                          )
                        }
                        title={promotion.isActive ? "Deactivate" : "Activate"}
                      >
                        {promotion.isActive ? (
                          <ToggleRight size={20} />
                        ) : (
                          <ToggleLeft size={20} />
                        )}
                      </button>
                      <button
                        className="action-btn edit"
                        onClick={() => setEditingPromotion(promotion)}
                        title="Edit"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        className="action-btn danger"
                        onClick={() => handleDeletePromotion(promotion.id)}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="promotion-content">
                    <p className="promotion-description">
                      {promotion.description}
                    </p>

                    <div className="promotion-details">
                      <div className="detail-item">
                        <DollarSign size={14} />
                        <span>
                          {promotion.benefits?.discountType === "percentage"
                            ? `${promotion.benefits?.discountValue}% off`
                            : `₹${promotion.benefits?.discountValue} off`}
                          {promotion.conditions?.minOrderValue > 0 &&
                            ` (Min order: ₹${promotion.conditions?.minOrderValue})`}
                        </span>
                      </div>

                      <div className="detail-item">
                        <Calendar size={14} />
                        <span>
                          {new Date(
                            promotion.validity?.startDate
                          ).toLocaleDateString()}{" "}
                          -
                          {new Date(
                            promotion.validity?.endDate
                          ).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="detail-item">
                        <Target size={14} />
                        <span>
                          {promotion.targeting?.customerTypes?.length > 0
                            ? `${promotion.targeting.customerTypes.join(", ")}`
                            : "All customers"}
                        </span>
                      </div>

                      {promotion.analytics && (
                        <div className="promotion-performance">
                          <div className="performance-item">
                            <Eye size={14} />
                            <span>{promotion.analytics.views} views</span>
                          </div>
                          <div className="performance-item">
                            <Users size={14} />
                            <span>{promotion.analytics.conversions} uses</span>
                          </div>
                          <div className="performance-item">
                            <Percent size={14} />
                            <span>
                              {promotion.analytics.conversionRate || 0}% rate
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === "analytics" && (
        <div className="analytics-section">
          <h3>Promotion Analytics Coming Soon...</h3>
          <p>Detailed analytics and insights will be available here.</p>
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreatePromotionModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadPromotions();
            loadDashboardData();
            toast.success("Promotion created successfully!");
          }}
        />
      )}

      {editingPromotion && (
        <EditPromotionModal
          promotion={editingPromotion}
          onClose={() => setEditingPromotion(null)}
          onSuccess={() => {
            setEditingPromotion(null);
            loadPromotions();
            loadDashboardData();
            toast.success("Promotion updated successfully!");
          }}
        />
      )}

      {showAnalyticsModal && selectedPromotionAnalytics && (
        <PromotionAnalyticsModal
          promotion={selectedPromotionAnalytics}
          onClose={() => {
            setShowAnalyticsModal(false);
            setSelectedPromotionAnalytics(null);
          }}
        />
      )}
    </div>
  );
};

export default SupplierLoyaltyManagement;
