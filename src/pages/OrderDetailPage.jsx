import React, { useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { ordersAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import LoadingSpinner from "../components/common/LoadingSpinner";
import CoolingPeriodManager from "../components/orders/CoolingPeriodManager";
import ImageWithFallback from "../components/common/ImageWithFallback";
import {
  FaArrowLeft,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaEnvelope,
  FaClock,
  FaTruck,
  FaBox,
  FaCheckCircle,
  FaTimesCircle,
  FaDownload,
  FaEye,
  FaPrint,
  FaUser,
  FaStore,
  FaCreditCard,
  FaCalendarAlt,
  FaShippingFast,
} from "react-icons/fa";
import "./OrderDetailPage.css";

const OrderDetailPage = () => {
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const coolingCompleteShown = useRef(false);

  // Fetch order details
  const {
    data: orderData,
    isLoading,
    error,
  } = useQuery(["order", orderId], () => ordersAPI.getOrder(orderId), {
    enabled: !!orderId,
    refetchInterval: 120000,
    refetchIntervalInBackground: false,
    staleTime: 60000,
    cacheTime: 300000,
    onError: (error) => {
      if (error?.response?.status === 404) {
        toast.error("Order not found");
        navigate("/orders");
      }
    },
  });

  // Track order mutation
  const trackOrderMutation = useMutation(() => ordersAPI.trackOrder(orderId), {
    onSuccess: (response) => {
      toast.success("Tracking information updated!");
      queryClient.invalidateQueries(["order", orderId]);
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.message || "Failed to get tracking info"
      );
    },
  });

  // Cancel order mutation
  const cancelOrderMutation = useMutation(
    (data) => ordersAPI.cancelOrder(orderId, data),
    {
      onSuccess: () => {
        toast.success("Order cancelled successfully!");
        queryClient.invalidateQueries(["order", orderId]);
        queryClient.invalidateQueries("orders");
      },
      onError: (error) => {
        toast.error(error?.response?.data?.message || "Failed to cancel order");
      },
    }
  );

  const order = orderData?.data?.order;

  // Enhanced status configuration
  const getStatusInfo = (status) => {
    const statusConfig = {
      pending: {
        icon: "⏳",
        color: "#ff9500",
        bgColor: "#fff5e6",
        text: "Order Placed",
        description: "Your order is waiting for supplier confirmation",
        progress: 10,
      },
      confirmed: {
        icon: "✅",
        color: "#28a745",
        bgColor: "#e8f5e8",
        text: "Order Confirmed",
        description: "Supplier has confirmed your order",
        progress: 25,
      },
      preparing: {
        icon: "🔧",
        color: "#17a2b8",
        bgColor: "#e6f7ff",
        text: "Preparing",
        description: "Supplier is preparing your order",
        progress: 40,
      },
      material_loading: {
        icon: "📦",
        color: "#2196f3",
        bgColor: "#e3f2fd",
        text: "Loading Materials",
        description: "Materials are being loaded for delivery",
        progress: 60,
      },
      processing: {
        icon: "⚙️",
        color: "#673ab7",
        bgColor: "#f3e5f5",
        text: "Processing",
        description: "Your order is being processed",
        progress: 70,
      },
      dispatched: {
        icon: "🚚",
        color: "#fd7e14",
        bgColor: "#fff3e0",
        text: "Dispatched",
        description: "Your order is on the way",
        progress: 85,
      },
      delivered: {
        icon: "✅",
        color: "#28a745",
        bgColor: "#e8f5e8",
        text: "Delivered",
        description: "Order has been delivered successfully",
        progress: 100,
      },
      cancelled: {
        icon: "❌",
        color: "#dc3545",
        bgColor: "#ffebee",
        text: "Cancelled",
        description: "This order has been cancelled",
        progress: 0,
      },
    };
    return statusConfig[status] || statusConfig["pending"];
  };

  // Utility functions
  const formatDate = (dateString) => {
    if (!dateString) return "Not available";
    try {
      return new Date(dateString).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "Invalid date";
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price || 0);
  };

  const getPaymentStatusInfo = (status) => {
    const paymentConfig = {
      paid: { icon: "✅", color: "#28a745", text: "Paid" },
      pending: { icon: "⏳", color: "#ffc107", text: "Pending" },
      failed: { icon: "❌", color: "#dc3545", text: "Failed" },
      refunded: { icon: "↩️", color: "#6c757d", text: "Refunded" },
    };
    return paymentConfig[status] || paymentConfig["pending"];
  };

  // Download invoice handler
  const handleDownloadInvoice = async () => {
    try {
      setDownloadingInvoice(true);
      const response = await ordersAPI.downloadInvoice(orderId);

      // Create blob and download
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-${order.orderId || orderId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Invoice downloaded successfully!");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download invoice");
    } finally {
      setDownloadingInvoice(false);
    }
  };

  // Contact supplier handler
  const handleContactSupplier = () => {
    if (order.supplier?.contact?.phone) {
      window.open(`tel:${order.supplier.contact.phone}`);
    } else {
      toast.error("Supplier contact information not available");
    }
  };

  // Track order handler
  const handleTrackOrder = () => {
    trackOrderMutation.mutate();
  };

  // Cooling period completion handler
  const handleCoolingComplete = () => {
    if (!coolingCompleteShown.current) {
      toast.success("Order confirmed! Processing will begin soon.");
      coolingCompleteShown.current = true;
      queryClient.invalidateQueries(["order", orderId]);
    }
  };

  // Reset notification flag when order status changes
  React.useEffect(() => {
    if (order?.status !== "pending" && order?.status !== "preparing") {
      coolingCompleteShown.current = false;
    }
  }, [order?.status]);

  if (!user) {
    return (
      <div className="aggre-order-detail-container">
        <div className="aggre-order-wrapper">
          <div className="aggre-order-access-denied">
            <div className="aggre-access-denied-icon">🔒</div>
            <h2>Access Denied</h2>
            <p>Please login to view order details</p>
            <Link to="/auth/login" className="aggre-auth-btn aggre-btn-primary">
              Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="aggre-order-detail-container">
        <div className="aggre-order-wrapper">
          <div className="aggre-order-loading-state">
            <LoadingSpinner size="large" />
            <h3>Loading order details...</h3>
            <p>Please wait while we fetch your order information</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="aggre-order-detail-container">
        <div className="aggre-order-wrapper">
          <div className="aggre-order-error-state">
            <div className="aggre-error-icon">📦</div>
            <h2>Order Not Found</h2>
            <p>
              The order you're looking for might not exist or has been removed.
            </p>
            <div className="aggre-error-actions">
              <button
                onClick={() => navigate("/orders")}
                className="aggre-error-btn aggre-btn-primary"
              >
                <FaArrowLeft />
                Back to Orders
              </button>
              <button
                onClick={() => window.location.reload()}
                className="aggre-error-btn aggre-btn-secondary"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(order.status);
  const paymentInfo = getPaymentStatusInfo(order.payment?.status);

  return (
    <div className="aggre-order-detail-container">
      <div className="aggre-order-wrapper">
        {/* Breadcrumb Navigation */}
        <div className="aggre-order-breadcrumb">
          <Link to="/" className="aggre-breadcrumb-link">
            Home
          </Link>
          <span className="aggre-breadcrumb-separator">/</span>
          <Link to="/orders" className="aggre-breadcrumb-link">
            My Orders
          </Link>
          <span className="aggre-breadcrumb-separator">/</span>
          <span className="aggre-breadcrumb-current">Order Details</span>
        </div>

        {/* Order Header Card */}
        <div className="aggre-order-header-card">
          <div className="aggre-order-header-content">
            <button
              onClick={() => navigate(-1)}
              className="aggre-back-button"
              aria-label="Go back"
            >
              <FaArrowLeft />
            </button>

            <div className="aggre-order-basic-info">
              <div className="aggre-order-title-section">
                <h1 className="aggre-order-title">
                  Order #{order.orderId || order._id.slice(-8).toUpperCase()}
                </h1>
                <p className="aggre-order-date">
                  <FaCalendarAlt />
                  Placed on {formatDate(order.createdAt)}
                </p>
              </div>

              <div className="aggre-order-status-badge-container">
                <div
                  className="aggre-order-status-badge"
                  style={{
                    backgroundColor: statusInfo.bgColor,
                    color: statusInfo.color,
                    border: `1px solid ${statusInfo.color}`,
                  }}
                >
                  <span className="aggre-status-icon">{statusInfo.icon}</span>
                  <span className="aggre-status-text">{statusInfo.text}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Status Progress Bar */}
          <div className="aggre-status-progress-section">
            <div className="aggre-progress-info">
              <h3>{statusInfo.text}</h3>
              <p>{statusInfo.description}</p>
            </div>
            <div className="aggre-progress-bar-container">
              <div
                className="aggre-progress-bar-fill"
                style={{
                  width: `${statusInfo.progress}%`,
                  backgroundColor: statusInfo.color,
                }}
              ></div>
            </div>
            <div className="aggre-progress-percentage">
              {statusInfo.progress}% Complete
            </div>
          </div>
        </div>

        {/* Order Timeline */}
        <div className="aggre-order-timeline-card">
          <h3 className="aggre-timeline-title">
            <FaTruck />
            Order Timeline
          </h3>
          <div className="aggre-order-timeline">
            {[
              "pending",
              "confirmed",
              "preparing",
              "material_loading",
              "processing",
              "dispatched",
              "delivered",
            ].map((status, index) => {
              const currentStatusIndex = [
                "pending",
                "confirmed",
                "preparing",
                "material_loading",
                "processing",
                "dispatched",
                "delivered",
              ].indexOf(order.status);
              const isCompleted = currentStatusIndex >= index;
              const isCurrent = currentStatusIndex === index;
              const timelineStatus = getStatusInfo(status);

              return (
                <div
                  key={status}
                  className={`aggre-timeline-item ${
                    isCompleted ? "aggre-timeline-completed" : ""
                  } ${isCurrent ? "aggre-timeline-current" : ""}`}
                >
                  <div className="aggre-timeline-marker">
                    <div className="aggre-timeline-dot"></div>
                  </div>
                  <div className="aggre-timeline-content">
                    <div className="aggre-timeline-status-name">
                      {timelineStatus.icon} {timelineStatus.text}
                    </div>
                    {isCompleted && (
                      <div className="aggre-timeline-timestamp">
                        {status === "pending" && formatDate(order.createdAt)}
                        {status === "confirmed" &&
                          order.confirmedAt &&
                          formatDate(order.confirmedAt)}
                        {status === "dispatched" &&
                          order.dispatchedAt &&
                          formatDate(order.dispatchedAt)}
                        {status === "delivered" &&
                          order.deliveredAt &&
                          formatDate(order.deliveredAt)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cooling Period Manager */}
        {["pending", "preparing"].includes(order.status) && (
          <CoolingPeriodManager
            orderId={orderId}
            onCoolingComplete={handleCoolingComplete}
          />
        )}

        {/* Main Content Grid */}
        <div className="aggre-order-main-grid">
          {/* Left Column - Order Items */}
          <div className="aggre-order-main-content">
            {/* Order Items Section */}
            <div className="aggre-order-items-card">
              <h3 className="aggre-section-title">
                <FaBox />
                Order Items ({order.items?.length || 0})
              </h3>
              <div className="aggre-order-items-list">
                {order.items?.map((item, index) => {
                  const productName =
                    item.productSnapshot?.name ||
                    item.product?.name ||
                    "Unknown Product";
                  const productImage =
                    item.productSnapshot?.images?.[0] ||
                    item.product?.images?.[0] ||
                    "/placeholder-product.jpg";

                  return (
                    <div key={index} className="aggre-order-item">
                      <div className="aggre-item-image-container">
                        <ImageWithFallback
                          src={productImage}
                          alt={productName}
                          className="aggre-item-image"
                          fallbackType="product"
                        />
                      </div>

                      <div className="aggre-item-details">
                        <h4 className="aggre-item-name">{productName}</h4>
                        <div className="aggre-item-specs">
                          <span className="aggre-item-quantity">
                            Quantity: {item.quantity}
                          </span>
                          <span className="aggre-item-unit-price">
                            Unit Price: {formatPrice(item.unitPrice)}
                          </span>
                          {item.productSnapshot?.category && (
                            <span className="aggre-item-category">
                              Category:{" "}
                              {item.productSnapshot.category
                                .replace("_", " ")
                                .toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="aggre-item-total-price">
                        {formatPrice(
                          item.totalPrice || item.unitPrice * item.quantity
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Delivery Information */}
            <div className="aggre-delivery-info-card">
              <h3 className="aggre-section-title">
                <FaMapMarkerAlt />
                Delivery Information
              </h3>
              <div className="aggre-delivery-details">
                <div className="aggre-delivery-address">
                  <h4 className="aggre-address-title">Delivery Address</h4>
                  <div className="aggre-address-content">
                    {order.deliveryAddress ? (
                      <>
                        <div className="aggre-address-name">
                          <FaUser />
                          {order.deliveryAddress.fullName ||
                            order.deliveryAddress.name ||
                            "Name not provided"}
                        </div>
                        <div className="aggre-address-line">
                          <FaMapMarkerAlt />
                          {order.deliveryAddress.address ||
                            "Address not provided"}
                        </div>
                        <div className="aggre-address-location">
                          {order.deliveryAddress.city &&
                            `${order.deliveryAddress.city}, `}
                          {order.deliveryAddress.state &&
                            `${order.deliveryAddress.state}`}
                          {order.deliveryAddress.pincode &&
                            ` - ${order.deliveryAddress.pincode}`}
                        </div>
                        {order.deliveryAddress.phone && (
                          <div className="aggre-address-phone">
                            <FaPhoneAlt />
                            {order.deliveryAddress.phone}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="aggre-address-unavailable">
                        Address information not available
                      </div>
                    )}
                  </div>
                </div>

                {order.delivery?.expectedDate && (
                  <div className="aggre-expected-delivery">
                    <h4 className="aggre-delivery-title">Expected Delivery</h4>
                    <div className="aggre-delivery-date">
                      <FaClock />
                      {formatDate(order.delivery.expectedDate)}
                    </div>
                  </div>
                )}

                {order.delivery?.trackingNumber && (
                  <div className="aggre-tracking-info">
                    <h4 className="aggre-tracking-title">
                      Tracking Information
                    </h4>
                    <div className="aggre-tracking-number">
                      <FaShippingFast />
                      {order.delivery.trackingNumber}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Supplier Information */}
            {order.supplier && (
              <div className="aggre-supplier-info-card">
                <h3 className="aggre-section-title">
                  <FaStore />
                  Supplier Information
                </h3>
                <div className="aggre-supplier-details">
                  <div className="aggre-supplier-name">
                    <strong>
                      {order.supplier.businessName || order.supplier.name}
                    </strong>
                  </div>

                  {order.supplier.location && (
                    <div className="aggre-supplier-location">
                      <FaMapMarkerAlt />
                      {order.supplier.location.city},{" "}
                      {order.supplier.location.state}
                    </div>
                  )}

                  {order.supplier.contact?.phone && (
                    <div className="aggre-supplier-contact">
                      <FaPhoneAlt />
                      {order.supplier.contact.phone}
                    </div>
                  )}

                  {order.supplier.contact?.email && (
                    <div className="aggre-supplier-email">
                      <FaEnvelope />
                      {order.supplier.contact.email}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Order Summary & Actions */}
          <div className="aggre-order-sidebar">
            {/* Order Summary */}
            <div className="aggre-order-summary-card">
              <h3 className="aggre-section-title">Order Summary</h3>
              <div className="aggre-summary-details">
                <div className="aggre-summary-row">
                  <span>Items ({order.items?.length || 0})</span>
                  <span>
                    {formatPrice(
                      order.items?.reduce(
                        (sum, item) =>
                          sum +
                          (item.totalPrice || item.unitPrice * item.quantity),
                        0
                      ) || 0
                    )}
                  </span>
                </div>

                {order.pricing?.transportCost > 0 && (
                  <div className="aggre-summary-row">
                    <span>Delivery charges</span>
                    <span>{formatPrice(order.pricing.transportCost)}</span>
                  </div>
                )}

                {order.pricing?.gstAmount > 0 && (
                  <div className="aggre-summary-row">
                    <span>GST (18%)</span>
                    <span>{formatPrice(order.pricing.gstAmount)}</span>
                  </div>
                )}

                {order.pricing?.commission > 0 && (
                  <div className="aggre-summary-row">
                    <span>Platform fee</span>
                    <span>{formatPrice(order.pricing.commission)}</span>
                  </div>
                )}

                <div className="aggre-summary-divider"></div>

                <div className="aggre-summary-row aggre-summary-total">
                  <span>Total Amount</span>
                  <span>
                    {formatPrice(
                      order.pricing?.totalAmount || order.totalAmount
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="aggre-payment-info-card">
              <h3 className="aggre-section-title">
                <FaCreditCard />
                Payment Details
              </h3>
              <div className="aggre-payment-details">
                <div className="aggre-payment-method">
                  <span className="aggre-payment-label">Payment Method:</span>
                  <span className="aggre-payment-value">
                    {order.payment?.method === "cod"
                      ? "💰 Cash on Delivery"
                      : order.payment?.method === "card"
                        ? "💳 Card Payment"
                        : order.payment?.method === "upi"
                          ? "📱 UPI Payment"
                          : order.payment?.method || "Not specified"}
                  </span>
                </div>

                <div className="aggre-payment-status-row">
                  <span className="aggre-payment-label">Payment Status:</span>
                  <div
                    className="aggre-payment-status-badge"
                    style={{ color: paymentInfo.color }}
                  >
                    <span>{paymentInfo.icon}</span>
                    <span>{paymentInfo.text}</span>
                  </div>
                </div>

                {order.payment?.advanceAmount && (
                  <div className="aggre-advance-payment">
                    <span className="aggre-payment-label">Advance Paid:</span>
                    <span className="aggre-payment-value">
                      {formatPrice(order.payment.advanceAmount)}
                    </span>
                  </div>
                )}

                {order.payment?.remainingAmount && (
                  <div className="aggre-remaining-payment">
                    <span className="aggre-payment-label">
                      Pay on Delivery:
                    </span>
                    <span className="aggre-payment-value">
                      {formatPrice(order.payment.remainingAmount)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Order Actions */}
            <div className="aggre-order-actions-card">
              <h3 className="aggre-section-title">Order Actions</h3>
              <div className="aggre-action-buttons">
                {["shipped", "dispatched"].includes(order.status) && (
                  <button
                    onClick={handleTrackOrder}
                    className="aggre-action-btn aggre-btn-primary"
                    disabled={trackOrderMutation.isLoading}
                  >
                    <FaEye />
                    {trackOrderMutation.isLoading
                      ? "Tracking..."
                      : "Track Order"}
                  </button>
                )}

                <button
                  onClick={handleDownloadInvoice}
                  disabled={downloadingInvoice}
                  className="aggre-action-btn aggre-btn-secondary"
                >
                  {downloadingInvoice ? (
                    <>
                      <div className="aggre-spinner"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <FaDownload />
                      Download Invoice
                    </>
                  )}
                </button>

                <button
                  onClick={handleContactSupplier}
                  className="aggre-action-btn aggre-btn-outline"
                >
                  <FaPhoneAlt />
                  Contact Supplier
                </button>

                {order.status === "delivered" && (
                  <button className="aggre-action-btn aggre-btn-primary">
                    <FaEye />
                    Write Review
                  </button>
                )}

                <button
                  onClick={() => window.print()}
                  className="aggre-action-btn aggre-btn-outline"
                >
                  <FaPrint />
                  Print Order
                </button>
              </div>
            </div>

            {/* Help & Support */}
            <div className="aggre-help-support-card">
              <h3 className="aggre-section-title">Need Help?</h3>
              <div className="aggre-support-content">
                <p>Having issues with your order? We're here to help!</p>
                <div className="aggre-support-buttons">
                  <Link to="/support" className="aggre-support-btn">
                    Contact Support
                  </Link>
                  <Link
                    to="/faq"
                    className="aggre-support-btn aggre-btn-outline"
                  >
                    View FAQ
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
