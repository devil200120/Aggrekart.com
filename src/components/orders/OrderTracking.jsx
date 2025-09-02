import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "react-query";
import { ordersAPI } from "../../services/api";
import LoadingSpinner from "../common/LoadingSpinner";
import ImageWithFallback from "../common/ImageWithFallback";
import "./OrderTracking.css";

const OrderTracking = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();

  // Fetch order details with real-time updates
  const {
    data: orderResponse,
    isLoading,
    error,
    refetch,
  } = useQuery(["order", orderId], () => ordersAPI.getOrder(orderId), {
    enabled: !!orderId,
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
    refetchIntervalInBackground: true,
    staleTime: 0, // Always fetch fresh data
  });

  const order = orderResponse?.data?.order;

  // Enhanced status configuration matching your backend status flow
  const getStatusInfo = (status) => {
    const statusConfig = {
      pending_payment: {
        text: "Payment Pending",
        color: "#ff9500",
        bgColor: "#fff5e6",
        icon: "💳",
        step: 0,
        description: "Complete payment to confirm your order",
        estimatedTime: "Payment required",
      },
      pending: {
        text: "Order Placed",
        color: "#ff9500",
        bgColor: "#fff5e6",
        icon: "📋",
        step: 1,
        description: "Your order has been placed successfully",
        estimatedTime: "Processing within 2 hours",
      },
      confirmed: {
        text: "Order Confirmed",
        color: "#34a853",
        bgColor: "#e8f5e8",
        icon: "✅",
        step: 2,
        description: "Supplier has confirmed your order",
        estimatedTime: "Materials being prepared",
      },
      preparing: {
        text: "Preparing",
        color: "#ff6d00",
        bgColor: "#fff3e0",
        icon: "👨‍🔧",
        step: 3,
        description: "Materials are being prepared for dispatch",
        estimatedTime: "Ready for loading soon",
      },
      material_loading: {
        text: "Loading Materials",
        color: "#2196f3",
        bgColor: "#e3f2fd",
        icon: "📦",
        step: 4,
        description: "Materials are being loaded onto transport vehicle",
        estimatedTime: "Will be dispatched shortly",
      },
      processing: {
        text: "Processing",
        color: "#673ab7",
        bgColor: "#f3e5f5",
        icon: "⚙️",
        step: 4,
        description: "Order is being processed for dispatch",
        estimatedTime: "Loading will begin shortly",
      },
      dispatched: {
        text: "Dispatched",
        color: "#1976d2",
        bgColor: "#e1f5fe",
        icon: "🚚",
        step: 5,
        description: "Your order is on the way to delivery location",
        estimatedTime: "Expected delivery today",
      },
      delivered: {
        text: "Delivered",
        color: "#388e3c",
        bgColor: "#e8f5e8",
        icon: "✨",
        step: 6,
        description: "Order delivered successfully",
        estimatedTime: "Completed",
      },
      cancelled: {
        text: "Cancelled",
        color: "#d32f2f",
        bgColor: "#ffebee",
        icon: "❌",
        step: 0,
        description: "Order has been cancelled",
        estimatedTime: "Refund will be processed",
      },
    };
    return (
      statusConfig[status] || {
        text: status,
        color: "#616161",
        bgColor: "#f5f5f5",
        icon: "❓",
        step: 0,
        description: "Status information not available",
        estimatedTime: "Please contact support",
      }
    );
  };

  // Define tracking steps matching your order flow
  const trackingSteps = [
    {
      step: 1,
      title: "Order Placed",
      icon: "📋",
      description: "Order received",
    },
    {
      step: 2,
      title: "Confirmed",
      icon: "✅",
      description: "Supplier confirmed",
    },
    { step: 3, title: "Preparing", icon: "👨‍🔧", description: "Materials ready" },
    {
      step: 4,
      title: "Loading/Processing",
      icon: "📦",
      description: "Loading vehicle",
    },
    {
      step: 5,
      title: "Dispatched",
      icon: "🚚",
      description: "Out for delivery",
    },
    { step: 6, title: "Delivered", icon: "✨", description: "Order completed" },
  ];

  // Format date helper matching your existing pattern
  const formatDate = (dateString) => {
    if (!dateString) return "Not available";
    try {
      return new Date(dateString).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "Invalid date";
    }
  };

  // Format price helper matching your existing pattern
  const formatPrice = (price) => {
    const numPrice = Number(price) || 0;
    if (numPrice === 0) return "₹0";

    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(numPrice);
  };

  // Get delivery address helper matching your existing pattern
  const getDeliveryAddress = (order) => {
    const addr = order?.deliveryAddress;
    if (!addr) return "Address not available";

    return `${addr.address || ""}, ${addr.city || ""}, ${addr.state || ""} - ${addr.pincode || ""}`.replace(
      /^,\s*|,\s*$/,
      ""
    );
  };

  // Get product image helper matching your existing pattern
  const getProductImage = (item) => {
    if (!item) return null;

    // Try productSnapshot first (most reliable for orders)
    if (
      item.productSnapshot?.imageUrl &&
      typeof item.productSnapshot.imageUrl === "string" &&
      item.productSnapshot.imageUrl.trim() !== "" &&
      !["null", "undefined"].includes(item.productSnapshot.imageUrl)
    ) {
      return item.productSnapshot.imageUrl;
    }

    // Try images array in productSnapshot
    if (item.productSnapshot?.images?.length > 0) {
      const primaryImage = item.productSnapshot.images.find(
        (img) => img?.isPrimary && img?.url
      );
      if (primaryImage) return primaryImage.url;

      const firstImage = item.productSnapshot.images.find((img) => img?.url);
      if (firstImage) return firstImage.url;
    }

    // Try product data (populated reference)
    if (item.product?.images?.length > 0) {
      const primaryImage = item.product.images.find(
        (img) => img?.isPrimary && img?.url
      );
      if (primaryImage) return primaryImage.url;

      const firstImage = item.product.images.find((img) => img?.url);
      if (firstImage) return firstImage.url;
    }

    return null; // Return null to trigger ImageWithFallback placeholder
  };

  // Get product name helper matching your existing pattern
  const getProductName = (item) => {
    return (
      item?.productSnapshot?.name ||
      item?.product?.name ||
      "Construction Material"
    );
  };

  // Get order total matching your existing pattern
  const getOrderTotal = (order) => {
    return (
      order?.pricing?.totalAmount ||
      order?.totalAmount ||
      order?.finalAmount ||
      0
    );
  };

  // Calculate items total
  const calculateItemsTotal = (items) => {
    if (!items || !Array.isArray(items)) return 0;
    return items.reduce((sum, item) => {
      const itemTotal = item.totalPrice || item.unitPrice * item.quantity || 0;
      return sum + itemTotal;
    }, 0);
  };

  // Check if order can be cancelled (matching your existing logic)
  const canCancelOrder = (order) => {
    if (!order) return false;
    const cancelableStatuses = ["pending", "confirmed", "preparing"];
    return (
      cancelableStatuses.includes(order.status) &&
      order.coolingPeriod?.isActive &&
      new Date() < new Date(order.coolingPeriod?.endTime)
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="aggre-tracking-wrapper">
        <div className="aggre-tracking-loading-state">
          <LoadingSpinner size="large" />
          <h3>Loading order tracking...</h3>
          <p>Please wait while we fetch your order details</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !order) {
    return (
      <div className="aggre-tracking-wrapper">
        <div className="aggre-tracking-error-state">
          <div className="aggre-error-icon-display">⚠️</div>
          <h2>Order Not Found</h2>
          <p>We couldn't find the tracking information for this order.</p>
          <div className="aggre-error-button-group">
            <button
              onClick={refetch}
              className="aggre-action-btn aggre-primary-btn"
            >
              Try Again
            </button>
            <Link to="/orders" className="aggre-action-btn aggre-secondary-btn">
              Back to Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentStatus = getStatusInfo(order.status);
  const orderTotal = getOrderTotal(order);
  const canCancel = canCancelOrder(order);

  return (
    <div className="aggre-tracking-main">
      <div className="aggre-tracking-wrapper">
        {/* Header */}
        <div className="aggre-tracking-header-section">
          <button
            onClick={() => navigate(-1)}
            className="aggre-back-navigation"
          >
            ← Back
          </button>
          <div className="aggre-header-info-group">
            <h1>Track Your Order</h1>
            <p className="aggre-order-reference">
              Order #{(order.orderId || order._id).slice(-8).toUpperCase()}
            </p>
          </div>
        </div>

        {/* Current Status Hero Card */}
        <div className="aggre-status-highlight-card">
          <div
            className="aggre-status-icon-container"
            style={{ backgroundColor: currentStatus.bgColor }}
          >
            <span
              className="aggre-status-emoji"
              style={{ color: currentStatus.color }}
            >
              {currentStatus.icon}
            </span>
          </div>
          <div className="aggre-status-text-content">
            <h2
              className="aggre-current-status-title"
              style={{ color: currentStatus.color }}
            >
              {currentStatus.text}
            </h2>
            <p className="aggre-status-description">
              {currentStatus.description}
            </p>
            <p className="aggre-time-estimate">{currentStatus.estimatedTime}</p>
          </div>
        </div>

        {/* Order Items Preview */}
        <div className="aggre-items-showcase-section">
          <h3 className="aggre-content-section-title">
            Your Items ({order.items?.length || 0})
          </h3>
          <div className="aggre-items-display-list">
            {order.items?.slice(0, 3).map((item, index) => (
              <div key={index} className="aggre-single-item-card">
                <div className="aggre-item-thumbnail-container">
                  <ImageWithFallback
                    src={getProductImage(item)}
                    alt={getProductName(item)}
                    className="aggre-product-thumbnail"
                    fallbackType="product"
                  />
                </div>
                <div className="aggre-item-details-section">
                  <h4 className="aggre-item-product-name">
                    {getProductName(item)}
                  </h4>
                  <p className="aggre-item-specifications">
                    Qty: {item.quantity} • {formatPrice(item.unitPrice)}/unit
                  </p>
                </div>
                <div className="aggre-item-price-display">
                  {formatPrice(
                    item.totalPrice || item.unitPrice * item.quantity
                  )}
                </div>
              </div>
            ))}
            {order.items?.length > 3 && (
              <div className="aggre-additional-items-indicator">
                +{order.items.length - 3} more items
              </div>
            )}
          </div>
        </div>

        {/* Progress Timeline */}
        <div className="aggre-progress-timeline-section">
          <h3 className="aggre-content-section-title">Order Progress</h3>
          <div className="aggre-timeline-flow">
            {trackingSteps.map((step, index) => {
              const isCompleted =
                step.step <= currentStatus.step && currentStatus.step > 0;
              const isCurrent =
                step.step === currentStatus.step &&
                order.status !== "cancelled";

              return (
                <div
                  key={step.step}
                  className={`aggre-timeline-step ${isCompleted ? "aggre-step-completed" : ""} ${isCurrent ? "aggre-step-active" : ""}`}
                >
                  <div className="aggre-step-marker-container">
                    <div className="aggre-step-icon-circle">{step.icon}</div>
                    {index < trackingSteps.length - 1 && (
                      <div
                        className={`aggre-connector-line ${isCompleted ? "aggre-line-completed" : ""}`}
                      ></div>
                    )}
                  </div>
                  <div className="aggre-step-content-block">
                    <h4 className="aggre-step-heading">{step.title}</h4>
                    <p className="aggre-step-description">{step.description}</p>
                    {isCurrent && (
                      <div className="aggre-active-indicator">
                        <span className="aggre-pulse-animation"></span>
                        Current Status
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Summary */}
        <div className="aggre-order-summary-section">
          <h3 className="aggre-content-section-title">Order Summary</h3>

          <div className="aggre-summary-cards-grid">
            <div className="aggre-info-summary-card">
              <div className="aggre-summary-card-label">Order Value</div>
              <div className="aggre-summary-card-value">
                {formatPrice(orderTotal)}
              </div>
            </div>

            <div className="aggre-info-summary-card">
              <div className="aggre-summary-card-label">Order Date</div>
              <div className="aggre-summary-card-value">
                {formatDate(order.createdAt)}
              </div>
            </div>

            <div className="aggre-info-summary-card">
              <div className="aggre-summary-card-label">Payment</div>
              <div className="aggre-summary-card-value">
                <span className="aggre-payment-method-tag">
                  {order.payment?.method?.toUpperCase() || "COD"}
                </span>
                <span
                  className={`aggre-payment-status-tag ${order.payment?.status || "pending"}`}
                >
                  {order.payment?.status === "paid" ? "Paid" : "Pending"}
                </span>
              </div>
            </div>

            <div className="aggre-info-summary-card">
              <div className="aggre-summary-card-label">Items</div>
              <div className="aggre-summary-card-value">
                {order.items?.length || 0} items
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="aggre-delivery-address-card">
            <h4 className="aggre-info-card-title">📍 Delivery Address</h4>
            <p className="aggre-address-content">{getDeliveryAddress(order)}</p>
          </div>

          {/* Supplier Info */}
          {order.supplier && (
            <div className="aggre-supplier-info-card">
              <h4 className="aggre-info-card-title">🏪 Supplier</h4>
              <p className="aggre-supplier-name-display">
                {order.supplier.companyName ||
                  order.supplier.businessName ||
                  order.supplier.name}
              </p>
              {order.supplier.contactPersonNumber && (
                <p className="aggre-supplier-contact-info">
                  📞 {order.supplier.contactPersonNumber}
                </p>
              )}
            </div>
          )}

          {/* Bill Breakdown */}
          {(order.pricing?.transportCost > 0 ||
            order.pricing?.gstAmount > 0) && (
            <div className="aggre-bill-breakdown-section">
              <h4 className="aggre-info-card-title">💰 Bill Details</h4>
              <div className="aggre-bill-calculation-rows">
                <div className="aggre-bill-calculation-row">
                  <span>Item total</span>
                  <span>{formatPrice(calculateItemsTotal(order.items))}</span>
                </div>

                {order.pricing?.transportCost > 0 && (
                  <div className="aggre-bill-calculation-row">
                    <span>Delivery charges</span>
                    <span>{formatPrice(order.pricing.transportCost)}</span>
                  </div>
                )}

                {order.pricing?.gstAmount > 0 && (
                  <div className="aggre-bill-calculation-row">
                    <span>Taxes & fees</span>
                    <span>{formatPrice(order.pricing.gstAmount)}</span>
                  </div>
                )}

                <div className="aggre-bill-calculation-row aggre-bill-final-total">
                  <span>Total Paid</span>
                  <span>{formatPrice(orderTotal)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="aggre-actions-button-container">
          <Link
            to={`/orders/${order._id}`}
            className="aggre-action-btn aggre-secondary-btn"
          >
            📋 View Full Details
          </Link>

          {order.status === "delivered" && (
            <button className="aggre-action-btn aggre-primary-btn">
              🛒 Buy Again
            </button>
          )}

          {canCancel && (
            <button className="aggre-action-btn aggre-danger-btn">
              ❌ Cancel Order
            </button>
          )}

          <Link
            to="/support/create"
            className="aggre-action-btn aggre-outline-btn"
          >
            🎫 Need Help?
          </Link>
        </div>

        {/* Live Updates Notice */}
        <div className="aggre-live-updates-notification">
          <div className="aggre-live-status-indicator">
            <span className="aggre-live-pulse-dot"></span>
            Live Updates
          </div>
          <p>
            This page automatically updates every 30 seconds with the latest
            information.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;
