import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Store,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  MessageSquare,
  Clock,
} from "lucide-react";
import "./AdminStats.css";

const AdminStats = ({ stats, loading }) => {
  const navigate = useNavigate();

  const formatCurrency = (amount) => {
    if (typeof amount !== "number" || isNaN(amount)) return "₹0";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (number) => {
    if (typeof number !== "number" || isNaN(number)) return "0";
    return new Intl.NumberFormat("en-IN").format(number);
  };

  const formatPercentage = (value) => {
    // Fix: Handle non-numeric values
    if (typeof value === "string") {
      // If it's already a formatted string like "High", "Normal", return as is
      if (isNaN(parseFloat(value))) {
        return value;
      }
      value = parseFloat(value);
    }

    if (typeof value !== "number" || isNaN(value)) {
      return "0%";
    }

    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(1)}%`;
  };

  const handleCardClick = (cardId) => {
    switch (cardId) {
      case "total-users":
        navigate("/admin/users");
        break;
      case "active-suppliers":
        navigate("/admin/suppliers");
        break;
      case "total-orders":
        navigate("/admin/orders");
        break;
      case "total-revenue":
        navigate("/admin/reports?tab=revenue");
        break;
      case "pending-approvals":
        navigate("/admin/approvals");
        break;
      case "monthly-revenue":
        navigate("/admin/reports?tab=monthly");
        break;
      case "active-products":
        navigate("/admin/products");
        break;
      case "platform-commission":
        navigate("/admin/reports?tab=commission");
        break;
      case "support-tickets":
        // This will be handled by the parent component setting activeTab
        if (window.setActiveTab) {
          window.setActiveTab("support");
        }
        break;
      default:
        console.log("No navigation defined for:", cardId);
    }
  };

  if (loading) {
    return (
      <div className="admin-stats">
        {[...Array(10)].map((_, index) => (
          <div key={index} className="stat-card loading">
            <div className="stat-icon loading-shimmer"></div>
            <div className="stat-content">
              <div className="stat-value loading-shimmer"></div>
              <div className="stat-label loading-shimmer"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      id: "total-users",
      title: "Total Users",
      value: stats?.totalUsers || 0,
      change: stats?.userGrowth || 0,
      icon: Users,
      color: "blue",
      format: "number",
      description: "Click to manage users",
    },
    {
      id: "active-suppliers",
      title: "Active Suppliers",
      value: stats?.activeSuppliers || 0,
      change: stats?.supplierGrowth || 0,
      icon: Store,
      color: "green",
      format: "number",
      description: "Click to view suppliers",
    },
    {
      id: "total-orders",
      title: "Total Orders",
      value: stats?.totalOrders || 0,
      change: stats?.orderGrowth || 0,
      icon: ShoppingBag,
      color: "purple",
      format: "number",
      description: "Click to view all orders",
    },
    {
      id: "total-revenue",
      title: "Total Revenue",
      value: stats?.totalRevenue || 0,
      change: stats?.revenueGrowth || 0,
      icon: DollarSign,
      color: "orange",
      format: "currency",
      description: "Click to view revenue reports",
    },
    {
      id: "support-tickets",
      title: "Support Tickets",
      value: stats?.totalSupportTickets || 0,
      change: stats?.openSupportTickets || 0,
      icon: MessageSquare,
      color: "indigo",
      format: "number",
      customChange: `${stats?.openSupportTickets || 0} open`,
      urgent: (stats?.openSupportTickets || 0) > 5,
      description: "Click to manage support tickets",
    },
    {
      id: "pending-approvals",
      title: "Pending Approvals",
      value: stats?.pendingApprovals || 0,
      change: stats?.approvalChange || 0,
      icon: AlertTriangle,
      color: "yellow",
      format: "number",
      urgent: (stats?.pendingApprovals || 0) > 10,
      description: "Click to review approvals",
    },
    {
      id: "monthly-revenue",
      title: "Monthly Revenue",
      value: stats?.monthlyRevenue || 0,
      change: stats?.monthlyGrowth || 0,
      icon: TrendingUp,
      color: "teal",
      format: "currency",
      description: "Click to view monthly reports",
    },
    {
      id: "active-products",
      title: "Active Products",
      value: stats?.activeProducts || 0,
      change: stats?.productGrowth || 0,
      icon: CheckCircle,
      color: "emerald",
      format: "number",
      description: "Click to view products",
    },
    {
      id: "avg-response-time",
      title: "Avg Response Time",
      value: stats?.avgResponseTime || "0h",
      change: "Target: <2h",
      icon: Clock,
      color: "cyan",
      format: "text",
      customChange:
        stats?.avgResponseTime && stats.avgResponseTime !== "0h"
          ? "Good"
          : "No data",
      description: "Support response metrics",
    },
    {
      id: "platform-commission",
      title: "Platform Commission",
      value: stats?.platformCommission || 0,
      change: stats?.commissionGrowth || 0,
      icon: DollarSign,
      color: "rose",
      format: "currency",
      description: "Click to view commission reports",
    },
  ];

  const formatValue = (value, format) => {
    switch (format) {
      case "currency":
        return formatCurrency(value);
      case "number":
        return formatNumber(value);
      case "text":
        return value || "0";
      default:
        return value || "0";
    }
  };

  const getChangeDisplay = (card) => {
    // If there's a custom change display, use it
    if (card.customChange) {
      return card.customChange;
    }

    // Otherwise format the change as percentage
    return formatPercentage(card.change);
  };

  const getChangeIcon = (change, urgent = false) => {
    if (urgent) return null;

    if (typeof change === "string") {
      return null; // No icon for text changes
    }

    if (typeof change !== "number" || isNaN(change)) {
      return null;
    }

    return change >= 0 ? TrendingUp : TrendingDown;
  };

  const getChangeColor = (change, urgent = false) => {
    if (urgent) return "text-red-600";

    if (typeof change === "string") {
      if (
        change.toLowerCase().includes("good") ||
        change.toLowerCase().includes("normal")
      ) {
        return "text-green-600";
      }
      if (
        change.toLowerCase().includes("high") ||
        change.toLowerCase().includes("urgent")
      ) {
        return "text-red-600";
      }
      return "text-gray-600";
    }

    if (typeof change !== "number" || isNaN(change)) {
      return "text-gray-600";
    }

    return change >= 0 ? "text-green-600" : "text-red-600";
  };

  return (
    <div className="admin-stats">
      {statCards.map((card) => {
        const IconComponent = card.icon;
        const ChangeIcon = getChangeIcon(card.change, card.urgent);

        return (
          <div
            key={card.id}
            className={`stat-card ${card.color} ${card.urgent ? "urgent" : ""}`}
            onClick={() => handleCardClick(card.id)}
            title={card.description}
          >
            <div className="stat-header">
              <div className={`stat-icon ${card.color}`}>
                <IconComponent size={24} />
              </div>
              {card.urgent && (
                <div className="urgent-indicator">
                  <AlertTriangle size={16} />
                </div>
              )}
            </div>

            <div className="stat-content">
              <div className="stat-value">
                {formatValue(card.value, card.format)}
              </div>
              <div className="stat-label">{card.title}</div>
              <div
                className={`stat-change ${getChangeColor(card.change, card.urgent)}`}
              >
                {ChangeIcon && <ChangeIcon size={14} />}
                <span>{getChangeDisplay(card)}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AdminStats;
