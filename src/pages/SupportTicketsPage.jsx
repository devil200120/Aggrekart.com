import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supportAPI } from "../services/api";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { toast } from "react-toastify";
import "./SupportTicketsPage.css";

const SupportTicketsPage = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "",
    category: "",
    page: 1,
  });
  const [pagination, setPagination] = useState({});

  const statusColors = {
    open: "#28a745",
    in_progress: "#ffc107",
    pending_customer: "#fd7e14",
    resolved: "#17a2b8",
    closed: "#6c757d",
  };

  const priorityColors = {
    low: "#28a745",
    medium: "#ffc107",
    high: "#fd7e14",
    urgent: "#dc3545",
  };

  const categoryLabels = {
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

  useEffect(() => {
    fetchTickets();
  }, [filters]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await supportAPI.getTickets(filters);

      if (response.success && response.data) {
        setTickets(response.data.tickets || []);
        setPagination(response.data.pagination || {});
      } else {
        setTickets([]);
        setPagination({});
      }
    } catch (error) {
      console.error("❌ Error fetching tickets:", error);
      toast.error("Failed to fetch support tickets");
      setTickets([]);
      setPagination({});
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1,
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status) => {
    return (
      <span className={`status-badge ${status.replace("_", "-")}`}>
        {status.replace("_", " ").toUpperCase()}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    return (
      <span className={`priority-badge ${priority}`}>
        {priority.toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="support-tickets-page">
        <div className="container">
          <div className="loading-spinner">
            <LoadingSpinner />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="support-tickets-page">
      <div className="containeru">
        {/* Header */}
        <div className="page-headery">
          <div className="header-conteni">
            <h1 className="page-title">My Support Tickets</h1>
            <div className="header-actions">
              <Link to="/support/create" className="create-ticket-btn">
                <span>📝</span>
                Create New Ticket
              </Link>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <div className="filters-row">
            <div className="filter-group">
              <label className="filter-label">Status</label>
              <select
                className="filter-select"
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
              >
                <option value="">All Status</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="pending_customer">Pending Customer</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Category</label>
              <select
                className="filter-select"
                value={filters.category}
                onChange={(e) => handleFilterChange("category", e.target.value)}
              >
                <option value="">All Categories</option>
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <button
                className="btn btn-secondary clear-filters-btn"
                onClick={() =>
                  setFilters({ status: "", category: "", page: 1 })
                }
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Summary */}
          <div className="tickets-summary">
            <div className="summary-item">
              <span className="summary-label">Total Tickets:</span>
              <span className="summary-value">
                {pagination.total || tickets.length || 0}
              </span>
            </div>
            {(pagination.total > 0 || tickets.length > 0) && (
              <div className="summary-item">
                <span className="summary-label">Showing:</span>
                <span className="summary-value">
                  {(pagination.page - 1) * (pagination.limit || 10) + 1} -{" "}
                  {Math.min(
                    pagination.page * (pagination.limit || 10),
                    pagination.total || tickets.length
                  )}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="tickets-section">
          {tickets.length === 0 ? (
            <div className="no-tickets">
              <div className="no-tickets-icon">🎫</div>
              <h3>No support tickets found</h3>
              <p>
                {filters.status || filters.category
                  ? "No tickets match your current filters. Try adjusting your search criteria."
                  : "You haven't created any support tickets yet."}
              </p>
              <div className="no-tickets-actions">
                <Link to="/support/create" className="btn btn-primary">
                  <span>📝</span>
                  Create Your First Ticket
                </Link>
                {(filters.status || filters.category) && (
                  <button
                    className="btn btn-secondary"
                    onClick={() =>
                      setFilters({ status: "", category: "", page: 1 })
                    }
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Tickets Grid */}
              <div className="tickets-grid">
                {tickets.map((ticket) => (
                  // REPLACE THE EXISTING TICKET CARD WITH THIS ENHANCED VERSION:
<div key={ticket._id} className="ticket-card">
  <div className="ticket-header">
    <div className="ticket-left">
      <div className="ticket-id">
        <Link to={`/support/tickets/${ticket.ticketId}`} className="ticket-link">
          #{ticket.ticketId}
        </Link>
      </div>
      <div className="ticket-date">
        Created {formatDate(ticket.createdAt)}
      </div>
    </div>
    <div className="ticket-right">
      {getStatusBadge(ticket.status)}
      {getPriorityBadge(ticket.priority)}
    </div>
  </div>
  
  <div className="ticket-content">
    <h3 className="ticket-subject">
      <Link to={`/support/tickets/${ticket.ticketId}`}>
        {ticket.subject}
      </Link>
    </h3>
    
    {/* ENHANCED META SECTION WITH CONTACT & SUPPLIER INFO */}
    <div className="ticket-meta">
      <span className="ticket-category">
        📁 {categoryLabels[ticket.category]}
      </span>
      
      {/* ENHANCED ORDER INFORMATION */}
      {ticket.relatedOrder && (
        <span className="related-order">
          📦 Order #{ticket.relatedOrder.orderId}
          {ticket.relatedOrder.pricing?.totalAmount && (
            <span className="order-amount">
              - ₹{ticket.relatedOrder.pricing.totalAmount.toLocaleString('en-IN')}
            </span>
          )}
        </span>
      )}
      
      {/* NEW: SUPPLIER INFORMATION */}
      {(ticket.relatedSupplier?.companyName || ticket.orderDetails?.supplierName) && (
        <span className="supplier-info">
          🏢 {ticket.relatedSupplier?.companyName || ticket.orderDetails?.supplierName}
          {ticket.relatedSupplier?.contactPersonNumber && (
            <span className="supplier-contact">
              📞 {ticket.relatedSupplier.contactPersonNumber}
            </span>
          )}
        </span>
      )}
      
      {/* NEW: CUSTOMER CONTACT INFO */}
      {(ticket.customerContactInfo?.phone || ticket.user?.phoneNumber) && (
        <span className="customer-contact">
          📞 {ticket.customerContactInfo?.phone || ticket.user?.phoneNumber}
        </span>
      )}
    </div>
    
    {ticket.description && (
      <div className="ticket-preview">
        {ticket.description.length > 150 
          ? `${ticket.description.substring(0, 150)}...`
          : ticket.description
        }
      </div>
    )}
  </div>
  
  <div className="ticket-footer">
    <div className="ticket-meta-left">
      <span className="message-count">
        💬 {ticket.messages?.length || 0} messages
      </span>
      {ticket.updatedAt !== ticket.createdAt && (
        <span className="last-updated">
          🔄 Updated {formatDate(ticket.updatedAt)}
        </span>
      )}
    </div>
    
    <div className="ticket-meta-right">
      {ticket.hasUnreadMessages && (
        <div className="unread-indicator">
          New messages
        </div>
      )}
      <Link 
        to={`/support/tickets/${ticket.ticketId}`} 
        className="btn btn-primary view-details-btn"
      >
        View Details →
      </Link>
    </div>
  </div>

                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="pagination-container">
                  <div className="pagination">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                      className="btn btn-outline pagination-btn"
                    >
                      ← Previous
                    </button>

                    <div className="page-numbers">
                      {Array.from(
                        { length: Math.min(5, pagination.pages) },
                        (_, i) => {
                          let pageNum;
                          if (pagination.pages <= 5) {
                            pageNum = i + 1;
                          } else if (pagination.page <= 3) {
                            pageNum = i + 1;
                          } else if (pagination.page >= pagination.pages - 2) {
                            pageNum = pagination.pages - 4 + i;
                          } else {
                            pageNum = pagination.page - 2 + i;
                          }

                          return (
                            <button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              className={`page-number ${pagination.page === pageNum ? "active" : ""}`}
                            >
                              {pageNum}
                            </button>
                          );
                        }
                      )}
                    </div>

                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page >= pagination.pages}
                      className="btn btn-outline pagination-btn"
                    >
                      Next →
                    </button>
                  </div>

                  <div className="pagination-info">
                    <span>
                      Page {pagination.page} of {pagination.pages}(
                      {pagination.total} total tickets)
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupportTicketsPage;
