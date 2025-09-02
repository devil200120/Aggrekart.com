import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supportAPI } from "../services/api";
import { ordersAPI } from "../services/api";
import { toast } from "react-toastify";
import LoadingSpinner from "../components/common/LoadingSpinner";
import "./CreateSupportTicketPage.css";

const CreateSupportTicketPage = () => {
  const [ordersLoading, setOrdersLoading] = useState(true); // Separate loading for orders

  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [formData, setFormData] = useState({
    subject: "",
    description: "",
    category: "other",
    priority: "medium",
    relatedOrderId: "",
  });

  const categories = {
    order_inquiry: "Order Inquiry",
    payment_issue: "Payment Issue",
    product_inquiry: "Product Inquiry",
    delivery_issue: "Delivery Issue",
    account_issue: "Account Issue",
    technical_support: "Technical Support",
    billing_inquiry: "Billing Inquiry",
    complaint: "Complaint",
    feature_request: "Feature Request",
    other: "Other",
  };

  const priorities = {
    low: "Low",
    medium: "Medium",
    high: "High",
    urgent: "Urgent",
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setOrdersLoading(true); // Set orders loading
      console.log("🔍 Fetching user orders for ticket creation...");

      const response = await ordersAPI.getOrders({
        limit: 20,
        page: 1,
      });

      console.log("📦 Orders API response:", response);

      if (
        response &&
        response.success &&
        response.data &&
        response.data.orders
      ) {
        setOrders(response.data.orders);
        console.log(
          `✅ Successfully loaded ${response.data.orders.length} orders`
        );
      } else {
        console.log("❌ No orders found or invalid response structure");
        setOrders([]);
      }
    } catch (error) {
      console.error("❌ Error fetching orders:", error);
      console.error("❌ Error details:", error.response?.data);
      setOrders([]);
    } finally {
      setOrdersLoading(false); // Always clear orders loading
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.subject.trim() || !formData.description.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);

      const ticketData = {
        subject: formData.subject.trim(),
        description: formData.description.trim(),
        category: formData.category,
        priority: formData.priority,
      };

      // Enhanced: Include order and supplier information
      if (formData.relatedOrderId) {
        const selectedOrder = orders.find(
          (order) => order._id === formData.relatedOrderId
        );

        ticketData.relatedOrderId = formData.relatedOrderId;

        // Add order details for better support
        if (selectedOrder) {
          ticketData.orderDetails = {
            orderId: selectedOrder.orderId,
            orderAmount: selectedOrder.pricing?.totalAmount,
            orderStatus: selectedOrder.status,
            supplierName: selectedOrder.supplier?.companyName,
            supplierContact: selectedOrder.supplier?.contactPersonNumber,
          };

          // Link to supplier if available
          if (selectedOrder.supplier?._id) {
            ticketData.relatedSupplierId = selectedOrder.supplier._id;
          }
        }
      }

      console.log("🎫 Creating ticket with data:", ticketData);

      const response = await supportAPI.createTicket(ticketData);

      if (response && response.success) {
        toast.success("Support ticket created successfully!");
        navigate("/support/tickets");
      } else {
        throw new Error("Failed to create ticket");
      }
    } catch (error) {
      console.error("❌ Error creating ticket:", error);
      toast.error(
        error.response?.data?.message || "Failed to create support ticket"
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="create-ticket-page">
      <div className="container">
        <div className="page-header">
          <h1>Create Support Ticket</h1>
          <p>
            Need help? Create a support ticket and our team will get back to you
            soon.
          </p>
        </div>

        <div className="ticket-form-container">
          <form onSubmit={handleSubmit} className="ticket-form">
            <div className="form-group">
              <label htmlFor="subject">Subject *</label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="Brief description of your issue"
                maxLength={200}
                required
              />
              <small className="char-count">
                {formData.subject.length}/200 characters
              </small>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="relatedOrderId">Related Order (Optional)</label>
                <select
                  id="relatedOrderId"
                  name="relatedOrderId"
                  value={formData.relatedOrderId}
                  onChange={handleChange}
                  disabled={ordersLoading}
                >
                  <option value="">
                    {ordersLoading
                      ? "Loading orders..."
                      : "Select an order (if applicable)"}
                  </option>
                  {!ordersLoading && orders.length > 0 ? (
                    orders.map((order) => (
                      <option key={order._id} value={order._id}>
                        #{order.orderId} - ₹
                        {order.pricing?.totalAmount?.toLocaleString("en-IN")}
                        {order.supplier?.companyName &&
                          ` | ${order.supplier.companyName}`}
                        ({new Date(order.createdAt).toLocaleDateString("en-IN")}
                        )
                      </option>
                    ))
                  ) : !ordersLoading && orders.length === 0 ? (
                    <option value="" disabled>
                      No orders found
                    </option>
                  ) : null}
                </select>

                {ordersLoading && (
                  <div className="orders-loading">
                    <LoadingSpinner size="small" />
                    <span>Loading your orders...</span>
                  </div>
                )}

                {!ordersLoading && orders.length === 0 && (
                  <small className="form-hint">
                    💡 You need to place an order first to link it to a support
                    ticket.
                  </small>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="category">Category *</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                >
                  {Object.entries(categories).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="priority">Priority</label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                >
                  {Object.entries(priorities).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Please provide detailed information about your issue..."
                rows={6}
                maxLength={2000}
                required
              />
              <small className="char-count">
                {formData.description.length}/2000 characters
              </small>
            </div>

            <div className="priority-info">
              <h4>Response Time Expectations:</h4>
              <ul>
                <li>
                  <strong>Urgent:</strong> Within 2 hours
                </li>
                <li>
                  <strong>High:</strong> Within 4 hours
                </li>
                <li>
                  <strong>Medium:</strong> Within 8 hours
                </li>
                <li>
                  <strong>Low:</strong> Within 24 hours
                </li>
              </ul>
            </div>

            <div className="form-actions">
              <button
                type="button"
                onClick={() => navigate("/support/tickets")}
                className="btn btn-secondary"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={
                  loading ||
                  !formData.subject.trim() ||
                  !formData.description.trim()
                }
              >
                {loading ? (
                  <div className="button-loading">
                    <LoadingSpinner size="small" color="light" />
                    <span>Creating...</span>
                  </div>
                ) : (
                  "Create Ticket"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateSupportTicketPage;
