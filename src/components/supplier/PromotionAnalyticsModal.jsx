import React, { useState, useEffect } from "react";
import {
  X,
  BarChart3,
  Eye,
  Users,
  TrendingUp,
  Calendar,
  DollarSign,
  Percent,
  RefreshCw,
} from "lucide-react";
import loyaltyService from "../../services/loyaltyService";
import "./PromotionAnalyticsModal.css";

const PromotionAnalyticsModal = ({ promotion, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [dateRange, setDateRange] = useState("30");

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await loyaltyService.getSupplierPromotionAnalytics(
        promotion.id,
        dateRange
      );
      setAnalytics(data);
    } catch (error) {
      console.error("Failed to load analytics:", error);
    } finally {
      setLoading(false);
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

  const formatPercentage = (value) => {
    return `${parseFloat(value || 0).toFixed(1)}%`;
  };

  return (
    <div className="modal-overlay">
      <div className="analytics-modal">
        <div className="modal-header">
          <div className="modal-title">
            <BarChart3 size={24} />
            <div>
              <h2>Promotion Analytics</h2>
              <p>{promotion.title}</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-content">
          {/* Date Range Filter */}
          <div className="analytics-controls">
            <div className="date-range-selector">
              <label>Time Period:</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last year</option>
              </select>
            </div>
            <button
              className="refresh-btn"
              onClick={loadAnalytics}
              disabled={loading}
            >
              <RefreshCw size={16} className={loading ? "spinning" : ""} />
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="analytics-loading">
              <RefreshCw size={32} className="spinning" />
              <p>Loading analytics...</p>
            </div>
          ) : analytics ? (
            <div className="analytics-content">
              {/* Overview Cards */}
              <div className="analytics-cards">
                <div className="analytics-card">
                  <div className="card-icon bg-blue">
                    <Eye size={24} />
                  </div>
                  <div className="card-content">
                    <h3>{analytics.views || 0}</h3>
                    <p>Total Views</p>
                    <span className="card-trend">
                      {analytics.viewsGrowth
                        ? `+${formatPercentage(analytics.viewsGrowth)}`
                        : "No change"}
                    </span>
                  </div>
                </div>

                <div className="analytics-card">
                  <div className="card-icon bg-green">
                    <Users size={24} />
                  </div>
                  <div className="card-content">
                    <h3>{analytics.conversions || 0}</h3>
                    <p>Total Uses</p>
                    <span className="card-trend">
                      {analytics.conversionsGrowth
                        ? `+${formatPercentage(analytics.conversionsGrowth)}`
                        : "No change"}
                    </span>
                  </div>
                </div>

                <div className="analytics-card">
                  <div className="card-icon bg-purple">
                    <Percent size={24} />
                  </div>
                  <div className="card-content">
                    <h3>{formatPercentage(analytics.conversionRate)}</h3>
                    <p>Conversion Rate</p>
                    <span className="card-trend">
                      {analytics.views > 0 ? "Active" : "No traffic"}
                    </span>
                  </div>
                </div>

                <div className="analytics-card">
                  <div className="card-icon bg-orange">
                    <DollarSign size={24} />
                  </div>
                  <div className="card-content">
                    <h3>{formatCurrency(analytics.totalSavings || 0)}</h3>
                    <p>Customer Savings</p>
                    <span className="card-trend">Total provided</span>
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="analytics-section">
                <h3>Performance Metrics</h3>
                <div className="metrics-grid">
                  <div className="metric-item">
                    <label>Average Discount per Use</label>
                    <value>
                      {analytics.conversions > 0
                        ? formatCurrency(
                            (analytics.totalSavings || 0) /
                              analytics.conversions
                          )
                        : "₹0"}
                    </value>
                  </div>

                  <div className="metric-item">
                    <label>Unique Customers</label>
                    <value>{analytics.uniqueCustomers || 0}</value>
                  </div>

                  <div className="metric-item">
                    <label>Repeat Usage</label>
                    <value>
                      {analytics.conversions && analytics.uniqueCustomers
                        ? `${(((analytics.conversions - analytics.uniqueCustomers) / analytics.conversions) * 100).toFixed(1)}%`
                        : "0%"}
                    </value>
                  </div>

                  <div className="metric-item">
                    <label>Remaining Uses</label>
                    <value>
                      {promotion.conditions?.totalUsageLimit
                        ? `${promotion.conditions.totalUsageLimit - (analytics.conversions || 0)}`
                        : "Unlimited"}
                    </value>
                  </div>
                </div>
              </div>

              {/* Customer Breakdown */}
              {analytics.customerBreakdown &&
                analytics.customerBreakdown.length > 0 && (
                  <div className="analytics-section">
                    <h3>Customer Type Breakdown</h3>
                    <div className="customer-breakdown">
                      {analytics.customerBreakdown.map((item, index) => (
                        <div key={index} className="breakdown-item">
                          <div className="breakdown-info">
                            <h4>
                              {item.customerType
                                .replace("_", " ")
                                .toUpperCase()}
                            </h4>
                            <p>{item.count} customers</p>
                          </div>
                          <div className="breakdown-stats">
                            <span className="usage-count">
                              {item.totalUses} uses
                            </span>
                            <span className="savings">
                              {formatCurrency(item.totalSavings)} saved
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Usage Timeline */}
              {analytics.dailyUsage && analytics.dailyUsage.length > 0 && (
                <div className="analytics-section">
                  <h3>Usage Timeline (Last {dateRange} days)</h3>
                  <div className="usage-timeline">
                    {analytics.dailyUsage.map((day, index) => (
                      <div key={index} className="timeline-item">
                        <div className="timeline-date">
                          {new Date(day.date).toLocaleDateString()}
                        </div>
                        <div className="timeline-stats">
                          <span className="views">{day.views} views</span>
                          <span className="uses">{day.uses} uses</span>
                        </div>
                        <div className="timeline-bar">
                          <div
                            className="usage-bar"
                            style={{
                              width: `${day.uses > 0 ? Math.max((day.uses / Math.max(...analytics.dailyUsage.map((d) => d.uses))) * 100, 5) : 0}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Promotion Details */}
              <div className="analytics-section">
                <h3>Promotion Details</h3>
                <div className="promotion-details">
                  <div className="detail-row">
                    <label>Status:</label>
                    <span className={`status-badge status-${promotion.status}`}>
                      {promotion.status.replace("_", " ")}
                    </span>
                  </div>

                  <div className="detail-row">
                    <label>Type:</label>
                    <span>{promotion.type.replace("_", " ")}</span>
                  </div>

                  <div className="detail-row">
                    <label>Discount:</label>
                    <span>
                      {promotion.benefits?.discountType === "percentage"
                        ? `${promotion.benefits?.discountValue}%`
                        : `₹${promotion.benefits?.discountValue}`}
                    </span>
                  </div>

                  <div className="detail-row">
                    <label>Valid Until:</label>
                    <span>
                      {new Date(
                        promotion.validity?.endDate
                      ).toLocaleDateString()}
                    </span>
                  </div>

                  {promotion.conditions?.minOrderValue > 0 && (
                    <div className="detail-row">
                      <label>Min Order Value:</label>
                      <span>₹{promotion.conditions.minOrderValue}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="analytics-error">
              <BarChart3 size={48} />
              <h3>No Analytics Data Available</h3>
              <p>
                Analytics data will appear once customers start viewing and
                using this promotion.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PromotionAnalyticsModal;
