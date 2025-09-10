import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { supplierAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { toast } from "react-hot-toast";
import {
  Clock,
  CheckCircle,
  Package,
  Truck,
  Star,
  Phone,
  Mail,
  MapPin,
  Eye,
  Filter,
  Search,
  RefreshCw,
  TrendingUp,
  Calendar,
  IndianRupee,
  User,
  Package2,
} from "lucide-react";
import "./SupplierOrdersPage.css";

const SupplierOrdersPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    status: "",
    page: 1,
    limit: 10,
    search: "",
  });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  console.log("SupplierOrdersPage - Current user:", user);

  // Fetch orders
  const {
    data: ordersData,
    isLoading,
    error,
    refetch,
  } = useQuery(
    ["supplier-orders", user?.id, filters],
    async () => {
      const cleanFilters = {};
      if (filters.status && filters.status !== "")
        cleanFilters.status = filters.status;
      if (filters.page) cleanFilters.page = filters.page;
      if (filters.limit) cleanFilters.limit = filters.limit;
      if (filters.search && filters.search !== "")
        cleanFilters.search = filters.search;

      const response = await supplierAPI.getOrders(cleanFilters);
      return response;
    },
    {
      enabled: !!user && user.role === "supplier",
      keepPreviousData: true,
      onError: (error) => {
        const errorMessage = error?.response?.data?.message || error.message;
        toast.error(`Failed to load orders: ${errorMessage}`);
      },
    }
  );

  // Update order status mutation
  const updateStatusMutation = useMutation(
    ({ orderId, status }) => {
      return supplierAPI.updateOrderStatus(orderId, { status });
    },
    {
      onSuccess: (data) => {
        toast.success(`Order status updated successfully!`);
        queryClient.invalidateQueries("supplier-orders");
      },
      onError: (error) => {
        const errorMessage =
          error?.response?.data?.message || "Failed to update order status";
        toast.error(errorMessage);
      },
    }
  );

  // Helper functions
  const formatCurrency = (amount) => {
    const numAmount = Number(amount);
    if (isNaN(numAmount)) return "₹0";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numAmount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "Invalid Date";
    }
  };

  // Get total amount from order (handle different data structures)
  // Replace lines 118-120:

const getOrderTotal = (order) => {
  // Calculate items total first
  const itemsTotal = order.items?.reduce((sum, item) => {
    return sum + (item.totalPrice || (item.unitPrice * item.quantity) || 0);
  }, 0) || 0;

  // Get individual pricing components
  const transportCost = order.pricing?.transportCost || 0;
  const gstAmount = order.pricing?.gstAmount || 0;
  const commission = order.pricing?.commission || 0;
  const paymentGatewayCharges = order.pricing?.paymentGatewayCharges || 0;

  // Calculate total manually to ensure accuracy
  const calculatedTotal = itemsTotal + transportCost + gstAmount + commission + paymentGatewayCharges;
  
  // Use stored total if it seems reasonable, otherwise use calculated
  const storedTotal = order.pricing?.totalAmount || order.totalAmount || 0;
  
  // If stored total is suspiciously low (like in your case), use calculated
  if (storedTotal < calculatedTotal * 0.5) {
    console.log('⚠️ Using calculated total instead of stored:', calculatedTotal);
    return calculatedTotal;
  }
  
  return storedTotal;
};

  // Get item price (handle different data structures)
  const getItemPrice = (item) => {
    return (
      item.totalPrice ||
      item.unitPrice * item.quantity ||
      item.price * item.quantity ||
      0
    );
  };

  // Get delivery address (handle different field names)
  const getDeliveryAddress = (order) => {
    return order.deliveryAddress || order.shippingAddress || {};
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      pending: {
        label: "Pending",
        color: "#FF6B35",
        bgColor: "#FFF3F0",
        icon: Clock,
        action: "Confirm Order",
      },
      confirmed: {
        label: "Confirmed",
        color: "#2E8B57",
        bgColor: "#F0FFF4",
        icon: CheckCircle,
        action: "Start Preparing",
      },
      preparing: {
        label: "Preparing",
        color: "#4169E1",
        bgColor: "#F0F4FF",
        icon: Package,
        action: "Load Materials",
      },
      material_loading: {
        label: "Loading Materials",
        color: "#FF8C00",
        bgColor: "#FFF8F0",
        icon: Truck,
        action: "Mark Processing",
      },
      processing: {
        label: "Processing",
        color: "#8A2BE2",
        bgColor: "#F8F0FF",
        icon: Package,
        action: "Mark Dispatched",
      },
      dispatched: {
        label: "Dispatched",
        color: "#FF8C00",
        bgColor: "#FFF8F0",
        icon: Truck,
        action: "Mark Delivered",
      },
      delivered: {
        label: "Delivered",
        color: "#32CD32",
        bgColor: "#F0FFF0",
        icon: CheckCircle,
        action: null,
      },
      cancelled: {
        label: "Cancelled",
        color: "#DC143C",
        bgColor: "#FFF0F0",
        icon: Clock,
        action: null,
      },
    };
    return statusMap[status] || statusMap.pending;
  };

  const getNextStatus = (currentStatus) => {
    const statusFlow = {
      pending: "confirmed",
      confirmed: "preparing",
      preparing: "material_loading",
      material_loading: "processing",
      processing: "dispatched",
      dispatched: "delivered",
    };
    return statusFlow[currentStatus];
  };

  const handleStatusUpdate = (orderId, newStatus) => {
    updateStatusMutation.mutate({ orderId, status: newStatus });
  };

  // Verify this function is at line 215 (should already be correct):

const handleFilterChange = (key, value) => {
  setFilters((prev) => ({
    ...prev,
    [key]: value,
    ...(key !== 'page' && { page: 1 }), // Reset to first page only when other filters change
  }));
};
  const getStats = () => {
    if (!ordersData?.data?.orders)
      return {
        total: 0,
        pending: 0,
        confirmed: 0,
        preparing: 0,
        material_loading: 0,
        processing: 0,
        dispatched: 0,
        delivered: 0,
        cancelled: 0,
      };

    const orders = ordersData.data.orders;
    return orders.reduce(
      (acc, order) => {
        acc.total++;
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      },
      {
        total: 0,
        pending: 0,
        confirmed: 0,
        preparing: 0,
        material_loading: 0,
        processing: 0,
        dispatched: 0,
        delivered: 0,
        cancelled: 0,
      }
    );
  };

  // Data processing
  const orders = ordersData?.data?.orders || [];
  const pagination = ordersData?.data?.pagination || {};
  const stats = getStats();

  console.log("Orders data:", { orders, pagination, stats });

  if (!user || user.role !== "supplier") {
    return (
      <div className="supplier-orders-page">
        <div className="container">
          <div className="access-denied">
            <h2>Access Denied</h2>
            <p>This page is only accessible to suppliers.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="supplier-orders-page">
      <div className="container">
        {/* Header */}
        <div className="supplier-page-header">
          <div className="supplier-header-content">
            <div className="supplier-header-text">
              <h1>Supplier Orders</h1>
              <p>Manage and track all your customer orders</p>
            </div>
            <button
              onClick={refetch}
              disabled={isLoading}
              className="supplier-refresh-btn"
            >
              <RefreshCw size={20} className={isLoading ? "spinning" : ""} />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card total">
            <div className="stat-content">
              <Package className="stat-icon" />
              <div className="stat-label">Total Orders</div>
              <div className="stat-value">{stats.total}</div>
            </div>
          </div>

          <div className="stat-card pending">
            <div className="stat-content">
              <Clock className="stat-icon" />
              <div className="stat-label">Pending</div>
              <div className="stat-value">{stats.pending || 0}</div>
            </div>
          </div>

          <div className="stat-card processing">
            <div className="stat-content">
              <TrendingUp className="stat-icon" />
              <div className="stat-label">In Progress</div>
              <div className="stat-value">
                {(stats.confirmed || 0) +
                  (stats.preparing || 0) +
                  (stats.material_loading || 0) +
                  (stats.processing || 0)}
              </div>
            </div>
          </div>

          <div className="stat-card delivered">
            <div className="stat-content">
              <CheckCircle className="stat-icon" />
              <div className="stat-label">Delivered</div>
              <div className="stat-value">{stats.delivered || 0}</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="order-filters-section">
          <div className="search-filter">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search orders by ID, customer name..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="order-search-input"
            />
          </div>

          <div className="status-filter">
            <Filter size={20} />
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="supplier-status-select"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="preparing">Preparing</option>
              <option value="material_loading">Loading Materials</option>
              <option value="processing">Processing</option>
              <option value="dispatched">Dispatched</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="loading-container">
            <LoadingSpinner size="large" text="Loading orders..." />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="error-container">
            <div className="error-content">
              <h3>Failed to load orders</h3>
              <p>{error?.response?.data?.message || error.message}</p>
              <button onClick={refetch} className="retry-btn">
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Orders List */}
        <div className="orders-container">
          {orders.length === 0 ? (
            <div className="no-orders">
              <div className="no-orders-icon">📦</div>
              <h3>No Orders Found</h3>
              <p>
                {filters.status
                  ? `No orders found with status "${filters.status}"`
                  : "You haven't received any orders yet."}
              </p>
            </div>
          ) : (
            <div className="orders-list">
              {orders.map((order) => {
                const statusInfo = getStatusInfo(order.status);
                const nextStatus = getNextStatus(order.status);
                const StatusIcon = statusInfo.icon;
                const orderTotal = getOrderTotal(order);
                const deliveryAddress = getDeliveryAddress(order);

                return (
                  <div key={order._id} className="order-card">
                    <div className="order-header">
                      <div className="order-id-show">
                        <strong style={{color: '#6b7280'}}>#{order.orderId}</strong>
                        <span className="order-date">
                          {formatDate(order.createdAt)}
                        </span>
                      </div>
                      <div
                        className="order-status-show"
                        style={{
                          backgroundColor: statusInfo.bgColor,
                          color: statusInfo.color,
                        }}
                      >
                        <StatusIcon size={16} />
                        {statusInfo.label}
                      </div>
                    </div>

                    <div className="customer-order-content">
                      <div className="customer-order-details">
                        <div className="customer-pricing">
                          {/* Customer Info */}
                          <div className="customer-section">
                            <h4>
                              <User size={20} /> Customer Details
                            </h4>
                            <div className="customer-info-sec">
                              <div className="customer-detail">
                                <span className="label">Name:&nbsp;</span>
                                <span>{order.customer?.name || "N/A"}</span>
                              </div>
                              <div className="customer-detail">
                                <Phone size={14} />
                                &nbsp;&nbsp;
                                <span>
                                  {order.customer?.phoneNumber || "N/A"}
                                </span>
                              </div>
                              <div className="customer-detail">
                                <Mail size={14} />
                                &nbsp;&nbsp;
                                <span>{order.customer?.email || "N/A"}</span>
                              </div>
                            </div>
                          </div>

                          {/* Pricing Details */}
                          {order.pricing && (
                            <div className="pricing-section">
                              <h4>
                                <IndianRupee size={20} /> Pricing Details
                              </h4>
                              <div className="pricing-breakdown">
                                <div className="pricing-row">
                                  <span>Subtotal: </span>
                                  <span>
                                    {formatCurrency(
                                      order.pricing.subtotal || 0
                                    )}
                                  </span>
                                </div>
                                {order.pricing.transportCost > 0 && (
                                  <div className="pricing-row">
                                    <span>Transport Cost: </span>
                                    <span>
                                      {formatCurrency(
                                        order.pricing.transportCost
                                      )}
                                    </span>
                                  </div>
                                )}
                                {order.pricing.commission > 0 && (
                                  <div className="pricing-row">
                                    <span>Platform Commission: </span>
                                    <span>
                                      {formatCurrency(order.pricing.commission)}
                                    </span>
                                  </div>
                                )}
                                {order.pricing.gstAmount > 0 && (
                                  <div className="pricing-row">
                                    <span>GST: </span>
                                    <span>
                                      {formatCurrency(order.pricing.gstAmount)}
                                    </span>
                                  </div>
                                )}
                                <div className="pricing-row total">
                                  <span>Total Amount: </span>
                                  <span>{formatCurrency(orderTotal)}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Delivery Address */}
                        <div className="customer-address-section">
                          <h4>
                            <MapPin size={16} /> Delivery Address
                          </h4>
                          <div className="address-info">
                            <div className="address-text">
                              {deliveryAddress.address && (
                                <div>{deliveryAddress.address}</div>
                              )}
                              {(deliveryAddress.city ||
                                deliveryAddress.state ||
                                deliveryAddress.pincode) && (
                                <div>
                                  {deliveryAddress.city &&
                                    `${deliveryAddress.city}, `}
                                  {deliveryAddress.state &&
                                    `${deliveryAddress.state}`}
                                  {deliveryAddress.pincode &&
                                    ` - ${deliveryAddress.pincode}`}
                                </div>
                              )}
                              {!deliveryAddress.address &&
                                !deliveryAddress.city && (
                                  <div className="no-address">
                                    Address information not available
                                  </div>
                                )}
                            </div>
                          </div>
                        </div>

                        {/* Order Items */}
                        <div className="items-section">
                          <h4>
                            <Package2 size={16} /> Order Items (
                            {order.items?.length || 0})
                          </h4>
                          <div className="items-list">
                            {order.items?.map((item, index) => (
                              <div key={index} className="order-item">
                                <div className="item-details">
                                  <span className="item-name">
                                    {item.productSnapshot?.name ||
                                      item.product?.name ||
                                      "Unknown Product"}
                                  </span>
                                  <span className="item-quantity">
                                    Qty: {item.quantity}{" "}
                                    {item.productSnapshot?.unit || ""}
                                  </span>
                                  <span className="item-unit-price">
                                    Unit Price:{" "}
                                    {formatCurrency(
                                      item.unitPrice || item.price || 0
                                    )}
                                  </span>
                                </div>
                                <div className="item-total-section">
                                  <span className="item-price">
                                    {formatCurrency(getItemPrice(item))}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="order-pay-details">
                        {/* Payment Details */}
                        {order.payment && (
                          <div className="payment-section">
                            <h4>💳 Payment Details</h4>
                            <div className="payment-info">
                              <div className="payment-detail">
                                <span className="label">Method:</span>
                                <span className="payment-method">
                                  {order.payment.method === "cod"
                                    ? "💰 Cash on Delivery"
                                    : order.payment.method === "card"
                                    ? "💳 Card Payment"
                                    : order.payment.method === "upi"
                                    ? "📱 UPI Payment"
                                    : order.payment.method}
                                </span>
                              </div>
                              <div className="payment-detail">
                                <span className="label">Status:</span>
                                <span
                                  className={`payment-status ${order.payment.status}`}
                                >
                                  {order.payment.status === "paid"
                                    ? "✅ Paid"
                                    : order.payment.status === "pending"
                                    ? "⏳ Pending"
                                    : order.payment.method === "cod"
                                    ? "💰 Pay on Delivery"
                                    : "⏳ Pending"}
                                </span>
                              </div>
                              {order.payment.advanceAmount && (
                                <div className="payment-detail">
                                  <span className="label">Advance Paid:</span>
                                  <span>
                                    {formatCurrency(
                                      order.payment.advanceAmount
                                    )}
                                  </span>
                                </div>
                              )}
                              {order.payment.remainingAmount && (
                                <div className="payment-detail">
                                  <span className="label">Remaining:</span>
                                  <span>
                                    {formatCurrency(
                                      order.payment.remainingAmount
                                    )}
                                  </span>
                                </div>
                              )}
                              <hr />
                              <div className="order-total">
                                <span className="total-label">
                                  Total Amount:
                                </span>
                                <span className="total-amount">
                                  {formatCurrency(orderTotal)}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                        <hr className="order-page-hr" />

                    <div className="order-footer">
                      <div className="order-actions">
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowOrderModal(true);
                          }}
                          className="btn order-view-btn"
                        >
                          <Eye size={20} />
                          View Details
                        </button>

                        {nextStatus && statusInfo.action && (
                          <button
                            onClick={() =>
                              handleStatusUpdate(order._id, nextStatus)
                            }
                            disabled={updateStatusMutation.isLoading}
                            className="mark-btn"
                          >
                            {updateStatusMutation.isLoading
                              ? "Updating..."
                              : statusInfo.action}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="pagination">
            <button
              onClick={() =>
                handleFilterChange("page", Math.max(1, filters.page - 1))
              }
              disabled={filters.page <= 1}
              className="pagination-btn"
            >
              Previous
            </button>

            <span className="pagination-info">
              Page {filters.page} of {pagination.totalPages}
            </span>

            <button
              onClick={() =>
                handleFilterChange(
                  "page",
                  Math.min(pagination.totalPages, filters.page + 1)
                )
              }
              disabled={filters.page >= pagination.totalPages}
              className="pagination-btn"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Enhanced Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowOrderModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Order Details - #{selectedOrder.orderId}</h2>
              <button
                className="modal-close"
                onClick={() => setShowOrderModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              {/* Customer Information */}
              <div className="order-detail-section">
                <h3>
                  <User size={18} /> Customer Information
                </h3>
                <div className="detail-grid">
                  <div>
                    <strong>Name:</strong>{" "}
                    {selectedOrder.customer?.name || "N/A"}
                  </div>
                  <div>
                    <strong>Phone:</strong>{" "}
                    {selectedOrder.customer?.phoneNumber || "N/A"}
                  </div>
                  <div>
                    <strong>Email:</strong>{" "}
                    {selectedOrder.customer?.email || "N/A"}
                  </div>
                </div>
              </div>

              {/* Order Items Details */}
              <div className="order-detail-section">
                <h3>
                  <Package2 size={18} /> Order Items
                </h3>
                <div className="detailed-items">
                  {selectedOrder.items?.map((item, index) => (
                    <div key={index} className="detailed-item">
                      <div className="item-info">
                        <strong>
                          {item.productSnapshot?.name ||
                            item.product?.name ||
                            "Unknown Product"}
                        </strong>
                        <div className="item-specs">
                          <span>
                            Quantity: {item.quantity}{" "}
                            {item.productSnapshot?.unit || ""}
                          </span>
                          <span>
                            Unit Price:{" "}
                            {formatCurrency(item.unitPrice || item.price || 0)}
                          </span>
                          <span>
                            Total: {formatCurrency(getItemPrice(item))}
                          </span>
                        </div>
                        {item.specifications?.customRequirements && (
                          <div className="custom-requirements">
                            <strong>Custom Requirements:</strong>{" "}
                            {item.specifications.customRequirements}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing Breakdown */}
              {selectedOrder.pricing && (
                <div className="order-detail-section">
                  <h3>
                    <IndianRupee size={18} /> Pricing Breakdown
                  </h3>
                  <div className="pricing-details">
                    <div className="pricing-row">
                      <span>Subtotal:</span>
                      <span>
                        {formatCurrency(selectedOrder.pricing.subtotal || 0)}
                      </span>
                    </div>
                    {selectedOrder.pricing.transportCost > 0 && (
                      <div className="pricing-row">
                        <span>Transport Cost:</span>
                        <span>
                          {formatCurrency(selectedOrder.pricing.transportCost)}
                        </span>
                      </div>
                    )}
                    {selectedOrder.pricing.gstAmount > 0 && (
                      <div className="pricing-row">
                        <span>GST Amount:</span>
                        <span>
                          {formatCurrency(selectedOrder.pricing.gstAmount)}
                        </span>
                      </div>
                    )}
                    {selectedOrder.pricing.commission > 0 && (
                      <div className="pricing-row">
                        <span>Platform Commission:</span>
                        <span>
                          {formatCurrency(selectedOrder.pricing.commission)}
                        </span>
                      </div>
                    )}
                    <div className="pricing-row total">
                      <strong>Total Amount:</strong>
                      <strong>
                        {formatCurrency(getOrderTotal(selectedOrder))}
                      </strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Details */}
              {selectedOrder.payment && (
                <div className="order-detail-section">
                  <h3>💳 Payment Information</h3>
                  <div className="detail-grid">
                    <div>
                      <strong>Method:</strong>{" "}
                      {selectedOrder.payment.method?.toUpperCase() || "N/A"}
                    </div>
                    <div>
                      <strong>Status:</strong>{" "}
                      {selectedOrder.payment.status?.toUpperCase() || "N/A"}
                    </div>
                    {selectedOrder.payment.advancePercentage && (
                      <div>
                        <strong>Advance %:</strong>{" "}
                        {selectedOrder.payment.advancePercentage}%
                      </div>
                    )}
                    {selectedOrder.payment.transactionId && (
                      <div>
                        <strong>Transaction ID:</strong>{" "}
                        {selectedOrder.payment.transactionId}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Delivery Address */}
              <div className="order-detail-section">
                <h3>
                  <MapPin size={18} /> Delivery Address
                </h3>
                <div className="address-details">
                  {(() => {
                    const addr = getDeliveryAddress(selectedOrder);
                    return (
                      <div>
                        {addr.address && <div>{addr.address}</div>}
                        {(addr.city || addr.state || addr.pincode) && (
                          <div>
                            {addr.city && `${addr.city}, `}
                            {addr.state && `${addr.state}`}
                            {addr.pincode && ` - ${addr.pincode}`}
                          </div>
                        )}
                        {!addr.address && !addr.city && (
                          <div>Address information not available</div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Order Timeline */}
              {selectedOrder.timeline && selectedOrder.timeline.length > 0 && (
                <div className="order-detail-section">
                  <h3>
                    <Calendar size={18} /> Order Timeline
                  </h3>
                  <div className="timeline">
                    {selectedOrder.timeline.map((timeline, index) => (
                      <div key={index} className="timeline-item">
                        <div className="timeline-status">{timeline.status}</div>
                        <div className="timeline-date">
                          {formatDate(timeline.timestamp)}
                        </div>
                        {timeline.note && (
                          <div className="timeline-note">{timeline.note}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-outline"
                onClick={() => setShowOrderModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierOrdersPage;
