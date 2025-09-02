import React, { useState, useEffect } from "react";
import {
  Eye,
  Users,
  TrendingUp,
  Gift,
  Calendar,
  Search,
  Filter,
  Download,
  RefreshCw,
  ChevronRight,
  User,
  MapPin,
  Crown,
  Tag,
  DollarSign,
  Clock,
  ShoppingCart,
} from "lucide-react";
import { toast } from "react-hot-toast";
import loyaltyService from "../../services/loyaltyService";
import "./CouponTracking.css";

const CouponTracking = () => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [usageDetails, setUsageDetails] = useState(null);
  const [usageSummary, setSummary] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Filters and view states
  const [activeView, setActiveView] = useState("overview"); // overview, details, summary
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // all, active, expired
  const [summaryPeriod, setSummaryPeriod] = useState("30d");
  const [summaryGroupBy, setSummaryGroupBy] = useState("tier");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);

  useEffect(() => {
    loadCouponAnalytics();
  }, []);

  useEffect(() => {
    if (activeView === "summary") {
      loadUsageSummary();
    }
  }, [activeView, summaryPeriod, summaryGroupBy]);

  const loadCouponAnalytics = async () => {
    try {
      setLoading(true);
      const data = await loyaltyService.getCouponAnalytics();
      setAnalytics(data);
      console.log("📊 Coupon Analytics loaded:", data);
    } catch (error) {
      console.error("❌ Failed to load coupon analytics:", error);
      toast.error("Failed to load coupon analytics");
    } finally {
      setLoading(false);
    }
  };

  const loadCouponUsageDetails = async (couponId, page = 1) => {
    try {
      setDetailsLoading(true);
      const data = await loyaltyService.getCouponUsageDetails(
        couponId,
        page,
        pageSize
      );
      setUsageDetails(data);
      setCurrentPage(page);
      console.log("📊 Coupon usage details loaded:", data);
    } catch (error) {
      console.error("❌ Failed to load coupon usage details:", error);
      toast.error("Failed to load coupon usage details");
    } finally {
      setDetailsLoading(false);
    }
  };

  const loadUsageSummary = async () => {
    try {
      const data = await loyaltyService.getCouponUsageSummary(
        summaryPeriod,
        summaryGroupBy
      );
      setSummary(data);
      console.log("📊 Usage summary loaded:", data);
    } catch (error) {
      console.error("❌ Failed to load usage summary:", error);
      toast.error("Failed to load usage summary");
    }
  };

  const handleViewCouponDetails = (coupon) => {
    setSelectedCoupon(coupon);
    setActiveView("details");
    loadCouponUsageDetails(coupon._id, 1);
  };

  const handleBackToOverview = () => {
    setActiveView("overview");
    setSelectedCoupon(null);
    setUsageDetails(null);
  };

  const filteredCoupons =
    analytics?.coupons?.filter((coupon) => {
      const matchesSearch =
        searchTerm === "" ||
        coupon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        coupon.code?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "active" && coupon.isActive) ||
        (filterStatus === "expired" && !coupon.isActive);

      return matchesSearch && matchesStatus;
    }) || [];

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getMembershipTierColor = (tier) => {
    const colors = {
      silver: "#C0C0C0",
      gold: "#FFD700",
      platinum: "#E5E4E2",
    };
    return colors[tier] || colors.silver;
  };

  const getCustomerTypeIcon = (type) => {
    const icons = {
      house_owner: "🏠",
      mason: "🔨",
      builder_contractor: "🏗️",
      others: "👤",
    };
    return icons[type] || icons.others;
  };

  if (loading) {
    return (
      <div className="coupon-tracking-loading">
        <RefreshCw className="loading-spinner" />
        <p>Loading coupon tracking data...</p>
      </div>
    );
  }

  return (
    <div className="coupon-tracking">
      {/* Header */}
      <div className="tracking-header">
        <div className="header-content">
          <div className="header-left">
            <Gift className="header-icon" />
            <div>
              <h2>Coupon Tracking & Analytics</h2>
              <p>Monitor coupon usage, user engagement, and effectiveness</p>
            </div>
          </div>
          <div className="header-actions">
            <button
              className="btn btn-secondary"
              onClick={loadCouponAnalytics}
              disabled={loading}
            >
              <RefreshCw
                className={`btn-icon ${loading ? "loading-spinner" : ""}`}
              />
              Refresh
            </button>
            <button className="btn btn-outline">
              <Download className="btn-icon" />
              Export Report
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="tracking-tabs">
          <button
            className={`tab ${activeView === "overview" ? "active" : ""}`}
            onClick={() => setActiveView("overview")}
          >
            <Eye className="tab-icon" />
            Overview
          </button>
          <button
            className={`tab ${activeView === "summary" ? "active" : ""}`}
            onClick={() => setActiveView("summary")}
          >
            <BarChart3 className="tab-icon" />
            Usage Summary
          </button>
        </div>
      </div>

      {/* Overview Tab */}
      {activeView === "overview" && (
        <>
          {/* Statistics Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">
                <Gift />
              </div>
              <div className="stat-content">
                <h3>{analytics?.overallStats?.totalCoupons || 0}</h3>
                <p>Total Coupons</p>
                <span className="stat-subtitle">
                  {analytics?.overallStats?.activeCoupons || 0} active
                </span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <Users />
              </div>
              <div className="stat-content">
                <h3>{analytics?.overallStats?.totalAwarded || 0}</h3>
                <p>Coupons Awarded</p>
                <span className="stat-subtitle">
                  Total distributed to users
                </span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <TrendingUp />
              </div>
              <div className="stat-content">
                <h3>{analytics?.overallStats?.totalUsed || 0}</h3>
                <p>Coupons Used</p>
                <span className="stat-subtitle">
                  {analytics?.overallStats?.overallUsageRate || 0}% usage rate
                </span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <DollarSign />
              </div>
              <div className="stat-content">
                <h3>
                  ₹
                  {(
                    analytics?.overallStats?.totalSavings || 0
                  ).toLocaleString()}
                </h3>
                <p>Total Savings</p>
                <span className="stat-subtitle">Customer discount amount</span>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="tracking-filters">
            <div className="search-box">
              <Search className="search-icon" />
              <input
                type="text"
                placeholder="Search coupons by name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="filter-group">
              <Filter className="filter-icon" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="expired">Expired Only</option>
              </select>
            </div>
          </div>

          {/* Coupons List */}
          <div className="coupons-list">
            <h3>Coupon Performance</h3>

            {filteredCoupons.length === 0 ? (
              <div className="empty-state">
                <Gift className="empty-icon" />
                <h4>No Coupons Found</h4>
                <p>No coupons match your current filters</p>
              </div>
            ) : (
              <div className="coupons-grid">
                {filteredCoupons.map((coupon) => (
                  <div key={coupon._id} className="coupon-card">
                    <div className="coupon-header">
                      <div className="coupon-info">
                        <div className="coupon-name">{coupon.name}</div>
                        <div className="coupon-code">
                          <Tag className="code-icon" />
                          {coupon.code}
                        </div>
                      </div>
                      <div
                        className={`coupon-status ${coupon.isActive ? "active" : "inactive"}`}
                      >
                        {coupon.isActive ? "Active" : "Inactive"}
                      </div>
                    </div>

                    <div className="coupon-stats">
                      <div className="stat-row">
                        <span className="stat-label">Awarded:</span>
                        <span className="stat-value">
                          {coupon.stats.totalAwarded}
                        </span>
                      </div>
                      <div className="stat-row">
                        <span className="stat-label">Used:</span>
                        <span className="stat-value">
                          {coupon.stats.totalUsed}
                        </span>
                      </div>
                      <div className="stat-row">
                        <span className="stat-label">Usage Rate:</span>
                        <span className="stat-value">
                          {coupon.stats.usageRate}%
                        </span>
                      </div>
                      <div className="stat-row">
                        <span className="stat-label">Total Savings:</span>
                        <span className="stat-value">
                          ₹{coupon.stats.totalSavings.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {coupon.stats.recentUsages.length > 0 && (
                      <div className="recent-usage">
                        <h5>Recent Usage</h5>
                        <div className="usage-list">
                          {coupon.stats.recentUsages
                            .slice(0, 3)
                            .map((usage, index) => (
                              <div key={index} className="usage-item">
                                <div className="user-info">
                                  <span className="user-icon">
                                    {getCustomerTypeIcon(usage.customerType)}
                                  </span>
                                  <span className="user-name">
                                    {usage.userName}
                                  </span>
                                  <span
                                    className="user-tier"
                                    style={{
                                      color: getMembershipTierColor(
                                        usage.membershipTier
                                      ),
                                    }}
                                  >
                                    <Crown className="tier-icon" />
                                    {usage.membershipTier}
                                  </span>
                                </div>
                                <div className="usage-details">
                                  <span className="discount">
                                    ₹{usage.discountApplied}
                                  </span>
                                  <span className="date">
                                    {formatDate(usage.usedAt)}
                                  </span>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    <button
                      className="view-details-btn"
                      onClick={() => handleViewCouponDetails(coupon)}
                    >
                      View Detailed Usage
                      <ChevronRight className="btn-icon" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Details Tab */}
      {activeView === "details" && selectedCoupon && (
        <div className="coupon-details">
          <div className="details-header">
            <button className="back-btn" onClick={handleBackToOverview}>
              <ChevronLeft className="btn-icon" />
              Back to Overview
            </button>
            <div className="details-title">
              <h3>{selectedCoupon.name}</h3>
              <span className="coupon-code-large">{selectedCoupon.code}</span>
            </div>
          </div>

          {detailsLoading ? (
            <div className="details-loading">
              <RefreshCw className="loading-spinner" />
              <p>Loading usage details...</p>
            </div>
          ) : usageDetails ? (
            <>
              <div className="usage-table">
                <div className="table-header">
                  <h4>Usage Details</h4>
                  <div className="table-info">
                    Showing {usageDetails.usageDetails.length} of{" "}
                    {usageDetails.pagination.totalItems} entries
                  </div>
                </div>

                <div className="table-container">
                  <table className="usage-data-table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Customer Type</th>
                        <th>Membership Tier</th>
                        <th>Used Date</th>
                        <th>Discount Applied</th>
                        <th>Order</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usageDetails.usageDetails.map((detail) => (
                        <tr key={detail.couponId}>
                          <td>
                            <div className="user-cell">
                              <User className="user-icon-small" />
                              <div>
                                <div className="user-name">
                                  {detail.user.name}
                                </div>
                                <div className="user-email">
                                  {detail.user.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="customer-type">
                              <span className="type-icon">
                                {getCustomerTypeIcon(detail.user.customerType)}
                              </span>
                              {detail.user.customerType.replace("_", " ")}
                            </div>
                          </td>
                          <td>
                            <div
                              className="membership-tier"
                              style={{
                                color: getMembershipTierColor(
                                  detail.user.membershipTier
                                ),
                              }}
                            >
                              <Crown className="tier-icon-small" />
                              {detail.user.membershipTier}
                            </div>
                          </td>
                          <td>
                            <div className="date-cell">
                              {detail.used ? (
                                <>
                                  <Calendar className="date-icon" />
                                  {formatDate(detail.usedAt)}
                                </>
                              ) : (
                                <span className="not-used">Not used</span>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="discount-cell">
                              {detail.used ? (
                                <>
                                  <DollarSign className="currency-icon" />₹
                                  {detail.discountApplied}
                                </>
                              ) : (
                                <span className="no-discount">-</span>
                              )}
                            </div>
                          </td>
                          <td>
                            {detail.order ? (
                              <div className="order-cell">
                                <ShoppingCart className="order-icon" />
                                <div>
                                  <div className="order-id">
                                    {detail.order.orderId}
                                  </div>
                                  <div className="order-amount">
                                    ₹{detail.order.totalAmount}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <span className="no-order">-</span>
                            )}
                          </td>
                          <td>
                            <span
                              className={`status-badge ${detail.used ? "used" : "awarded"}`}
                            >
                              {detail.used ? "Used" : "Awarded"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {usageDetails.pagination.totalPages > 1 && (
                  <div className="pagination">
                    <button
                      disabled={currentPage === 1}
                      onClick={() =>
                        loadCouponUsageDetails(
                          selectedCoupon._id,
                          currentPage - 1
                        )
                      }
                    >
                      Previous
                    </button>
                    <span>
                      Page {currentPage} of {usageDetails.pagination.totalPages}
                    </span>
                    <button
                      disabled={
                        currentPage === usageDetails.pagination.totalPages
                      }
                      onClick={() =>
                        loadCouponUsageDetails(
                          selectedCoupon._id,
                          currentPage + 1
                        )
                      }
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="no-data">
              <p>No usage details available</p>
            </div>
          )}
        </div>
      )}

      {/* Summary Tab */}
      {activeView === "summary" && (
        <div className="usage-summary">
          <div className="summary-controls">
            <div className="control-group">
              <label>Time Period:</label>
              <select
                value={summaryPeriod}
                onChange={(e) => setSummaryPeriod(e.target.value)}
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
            </div>

            <div className="control-group">
              <label>Group By:</label>
              <select
                value={summaryGroupBy}
                onChange={(e) => setSummaryGroupBy(e.target.value)}
              >
                <option value="tier">Membership Tier</option>
                <option value="customerType">Customer Type</option>
                <option value="location">Location</option>
                <option value="time">Time</option>
              </select>
            </div>
          </div>

          {usageSummary && (
            <div className="summary-results">
              <h4>
                Usage Summary - {summaryGroupBy.replace("_", " ")} breakdown
              </h4>

              <div className="summary-grid">
                {usageSummary.data.map((item) => (
                  <div key={item._id} className="summary-card">
                    <div className="summary-header">
                      <span className="summary-title">
                        {typeof item._id === "object"
                          ? `${item._id.year}-${String(item._id.month).padStart(2, "0")}-${String(item._id.day).padStart(2, "0")}`
                          : item._id}
                      </span>
                    </div>
                    <div className="summary-stats">
                      <div className="summary-stat">
                        <span className="stat-value">{item.count}</span>
                        <span className="stat-label">Uses</span>
                      </div>
                      <div className="summary-stat">
                        <span className="stat-value">
                          {item.uniqueUserCount}
                        </span>
                        <span className="stat-label">Users</span>
                      </div>
                      <div className="summary-stat">
                        <span className="stat-value">
                          ₹{item.totalSavings.toLocaleString()}
                        </span>
                        <span className="stat-label">Total Savings</span>
                      </div>
                      <div className="summary-stat">
                        <span className="stat-value">₹{item.avgSavings}</span>
                        <span className="stat-label">Avg Savings</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CouponTracking;
