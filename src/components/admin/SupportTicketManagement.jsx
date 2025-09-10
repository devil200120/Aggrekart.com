import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { supportAPI } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import './SupportTicketManagement.css';

const SupportTicketManagement = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    category: '',
    search: '',
    page: 1
  });
  const [pagination, setPagination] = useState({});

  const statusColors = {
    open: '#dc3545',
    in_progress: '#ffc107',
    pending_customer: '#fd7e14',
    resolved: '#28a745',
    closed: '#6c757d'
  };

  const priorityColors = {
    low: '#28a745',
    medium: '#ffc107',
    high: '#fd7e14',
    urgent: '#dc3545'
  };

  const categoryLabels = {
    order_inquiry: 'Order Inquiry',
    payment_issue: 'Payment Issue',
    product_inquiry: 'Product Inquiry',
    delivery_issue: 'Delivery Issue',
    account_issue: 'Account Issue',
    technical_support: 'Technical Support',
    billing_inquiry: 'Billing Inquiry',
    complaint: 'Complaint',
    feature_request: 'Feature Request',
    other: 'Other'
  };

  useEffect(() => {
    fetchTickets();
  }, [filters]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔍 Fetching admin tickets with filters:', filters);
      
      // Try to use the admin API first
      try {
        const response = await supportAPI.admin.getTickets(filters);
        console.log('📋 Admin tickets response:', response);

        if (response && response.success && response.data) {
          setTickets(response.data.tickets || []);
          setPagination(response.data.pagination || {});
        } else {
          setTickets([]);
          setPagination({});
        }
      } catch (apiError) {
        console.error('❌ Admin API failed, trying direct API call:', apiError);
        
        // Fallback: try to check if there are any tickets at all using customer API
        try {
          const fallbackResponse = await supportAPI.getTickets({ limit: 1 });
          console.log('📋 Fallback response:', fallbackResponse);
          
          if (fallbackResponse && fallbackResponse.success) {
            // If customer API works, the issue is with admin authorization
            setError('Admin API access denied. Please check your admin permissions.');
          } else {
            setError('Support system is not available. Please try again later.');
          }
        } catch (fallbackError) {
          setError('Cannot connect to support system. Please check your network connection.');
        }
        
        setTickets([]);
        setPagination({});
      }
      
    } catch (error) {
      console.error('❌ Error fetching tickets:', error);
      setError('Failed to fetch support tickets. Please try again.');
      setTickets([]);
      setPagination({});
    } finally {
      setLoading(false);
    }
  };

  const handleTicketClick = async (ticket) => {
    try {
      console.log('🎫 Opening ticket details for:', ticket.ticketId);
      
      const response = await supportAPI.admin.getTicket(ticket.ticketId);
      
      if (response && response.success && response.data) {
        setSelectedTicket(response.data.ticket);
        setAdminNotes(response.data.ticket.adminNotes || '');
        setShowTicketModal(true);
      } else {
        toast.error('Failed to load ticket details');
      }
      
    } catch (error) {
      console.error('❌ Error fetching ticket details:', error);
      toast.error('Failed to load ticket details');
    }
  };

  const handleStatusUpdate = async (ticketId, newStatus, message = '') => {
    try {
      console.log('🔄 Updating ticket status:', { ticketId, newStatus, message });
      
      const response = await supportAPI.admin.updateStatus(ticketId, newStatus, message);
      
      if (response && response.success) {
        toast.success('Ticket status updated successfully');
        await fetchTickets();
        if (selectedTicket && selectedTicket.ticketId === ticketId) {
          handleTicketClick({ ticketId }); // Refresh ticket details
        }
      } else {
        toast.error('Failed to update ticket status');
      }
      
    } catch (error) {
      console.error('❌ Error updating ticket status:', error);
      toast.error('Failed to update ticket status');
    }
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    
    if (!replyMessage.trim()) {
      toast.error('Please enter a reply message');
      return;
    }

    try {
      console.log('💬 Sending admin reply:', { 
        ticketId: selectedTicket.ticketId, 
        message: replyMessage, 
        isInternal 
      });
      
      const response = await supportAPI.admin.replyToTicket(
        selectedTicket.ticketId, 
        replyMessage.trim(), 
        isInternal
      );
      
      if (response && response.success) {
        toast.success('Reply sent successfully');
        setReplyMessage('');
        setIsInternal(false);
        handleTicketClick({ ticketId: selectedTicket.ticketId }); // Refresh ticket details
      } else {
        toast.error('Failed to send reply');
      }
      
    } catch (error) {
      console.error('❌ Error sending reply:', error);
      toast.error('Failed to send reply');
    }
  };

  const handleNotesUpdate = async () => {
    try {
      console.log('📝 Updating admin notes:', { 
        ticketId: selectedTicket.ticketId, 
        notes: adminNotes 
      });
      
      const response = await supportAPI.admin.updateNotes(selectedTicket.ticketId, adminNotes);
      
      if (response && response.success) {
        toast.success('Admin notes updated successfully');
        setSelectedTicket(prev => ({ ...prev, adminNotes }));
      } else {
        toast.error('Failed to update admin notes');
      }
      
    } catch (error) {
      console.error('❌ Error updating notes:', error);
      toast.error('Failed to update admin notes');
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1
    }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const color = statusColors[status] || '#6c757d';
    return (
      <span 
        className="original-status-badge" 
        style={{ backgroundColor: color }}
      >
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const color = priorityColors[priority] || '#6c757d';
    return (
      <span 
        className="priority-badge-original" 
        style={{ backgroundColor: color }}
      >
        {priority.toUpperCase()}
      </span>
    );
  };
  // Add this function before the return statement (around line 240)

const renderTicket = (ticket) => {
  const customerInfo = ticket.customerInfo || {};
  const orderInfo = ticket.orderInfo || {};
  const supplierInfo = ticket.supplierInfo || {};

  return (
    <tr key={ticket._id} className={`ticket-row ${ticket.needsResponse ? 'needs-response' : ''}`}>
      <td>
        <button 
          className="ticket-id-link"
          onClick={() => handleTicketClick(ticket)}
        >
          #{ticket.ticketId}
        </button>
      </td>
      <td>
        <div className="customer-info-enhanced">
          <div className="customer-name">{customerInfo.name || ticket.user?.name || 'Unknown'}</div>
          <div className="customer-email">
            {customerInfo.email || ticket.user?.email || 'No email'}
          </div>
          {customerInfo.phone && (
            <div className="customer-phone">
              <a href={`tel:${customerInfo.phone}`} className="contact-link">
                📞 {customerInfo.phone}
              </a>
            </div>
          )}
          {ticket.daysSinceCreated > 3 && (
            <div className="customer-badge-original old-ticket-original">
              {ticket.daysSinceCreated}d old
            </div>
          )}
        </div>
      </td>
      <td className="subject-cell">
        <div className="subject-container">
          <div className="subject-text">{ticket.subject}</div>
          {orderInfo.orderId && (
            <div className="order-link">
              <small>Order: #{orderInfo.orderId}</small>
            </div>
          )}
          {supplierInfo.name && (
            <div className="supplier-badge">
              <small>Supplier: {supplierInfo.name}</small>
            </div>
          )}
        </div>
      </td>
      <td>{categoryLabels[ticket.category] || ticket.category}</td>
      <td>{getPriorityBadge(ticket.priority)}</td>
      <td>
        <div className="status-container">
          {getStatusBadge(ticket.status)}
          {ticket.needsResponse && (
            <div className="needs-response-indicator" title="Needs Admin Response">
              ⚠️
            </div>
          )}
        </div>
      </td>
      <td>{formatDate(ticket.createdAt)}</td>
      <td>{formatDate(ticket.lastActivityAt || ticket.updatedAt)}</td>
      <td>
        <div className="action-buttons">
          <select 
            onChange={(e) => {
              if (e.target.value) {
                handleStatusUpdate(ticket.ticketId, e.target.value);
                e.target.value = '';
              }
            }}
            className="status-select"
          >
            <option value="">Change Status</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="pending_customer">Pending Customer</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </td>
    </tr>
  );
};

// Then update the JSX around line 384 to use this function:
// Replace this line:
// {tickets.map((ticket) => (
// With:


  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="support-ticket-management">
        <div className="error-state">
          <h2>Error Loading Support Tickets</h2>
          <p>{error}</p>
          <button 
            className="btn btn-primary"
            onClick={() => {
              setError(null);
              fetchTickets();
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="support-ticket-management">
      <div className="management-header">
        <h2>Support Ticket Management</h2>
        <div className="ticket-stats">
          <div className="stat-item-original">
            <span className="stat-number">{tickets.length}</span>
            <span className="stat-label">Total Tickets</span>
          </div>
          <div className="stat-item-original">
            <span className="stat-number">
              {tickets.filter(t => t.status === 'open').length}
            </span>
            <span className="stat-label">Open</span>
          </div>
          <div className="stat-item-original">
            <span className="stat-number">
              {tickets.filter(t => t.status === 'in-progress').length}
            </span>
            <span className="stat-label">In Progress</span>
          </div>
          <div className="stat-item-original">
            <span className="stat-number">
              {tickets.filter(t => t.priority === 'urgent').length}
            </span>
            <span className="stat-label">Urgent</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filters-row">
          <div className="filter-group">
            <input
              type="text"
              placeholder="Search tickets..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="filter-group">
            <select 
              value={filters.status} 
              onChange={(e) => handleFilterChange('status', e.target.value)}
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
            <select 
              value={filters.priority} 
              onChange={(e) => handleFilterChange('priority', e.target.value)}
            >
              <option value="">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="filter-group">
            <select 
              value={filters.category} 
              onChange={(e) => handleFilterChange('category', e.target.value)}
            >
              <option value="">All Categories</option>
              {Object.entries(categoryLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {tickets.length === 0 ? (
        <div className="no-tickets">
          <h3>No Support Tickets Found</h3>
          <p>There are currently no support tickets in the system.</p>
          <p>Tickets will appear here when customers create support requests.</p>
        </div>
      ) : (
        <>
          {/* Tickets Table */}
          <div className="tickets-table-container">
            <table className="tickets-table">
              <thead>
                <tr>
                  <th>Ticket ID</th>
                  <th>Customer</th>
                  <th>Subject</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Last Activity</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => renderTicket(ticket))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button 
                onClick={() => handleFilterChange('page', pagination.currentPage - 1)}
                disabled={!pagination.hasPrevPage}
                className="btn btn-outline"
              >
                Previous
              </button>
              
              <span className="page-info">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              
              <button 
                onClick={() => handleFilterChange('page', pagination.currentPage + 1)}
                disabled={!pagination.hasNextPage}
                className="btn btn-outline"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Ticket Details Modal */}
      {showTicketModal && selectedTicket && (
        <div className="modal-overlay">
          <div className="ticket-modal">
            <div className="modal-header">
              <h3>#{selectedTicket.ticketId} - {selectedTicket.subject}</h3>
              <button 
                className="modal-close"
                onClick={() => setShowTicketModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
                            <div className="ticket-info-section">
                <div className="info-sections">
                  {/* Customer Information Section */}
                  <div className="info-section customer-section">
                    <h4>👤 Customer Information</h4>
                    <div className="info-grid">
                      <div className="info-item-original">
                        <label>Name:</label>
                        <span>{selectedTicket.customerInfo?.name || selectedTicket.user?.name || 'Unknown'}</span>
                      </div>
                      <div className="info-item">
                        <label>Email:</label>
                        <span>
                          <a href={`mailto:${selectedTicket.customerInfo?.email || selectedTicket.user?.email}`} className="contact-link">
                            {selectedTicket.customerInfo?.email || selectedTicket.user?.email || 'No email'}
                          </a>
                        </span>
                      </div>
                      {(selectedTicket.customerInfo?.phone || selectedTicket.user?.phoneNumber) && (
                        <div className="info-item">
                          <label>Phone:</label>
                          <span>
                            <a href={`tel:${selectedTicket.customerInfo?.phone || selectedTicket.user?.phoneNumber}`} className="contact-link">
                              📞 {selectedTicket.customerInfo?.phone || selectedTicket.user?.phoneNumber}
                            </a>
                          </span>
                        </div>
                      )}
                      <div className="info-item">
                        <label>Role:</label>
                        <span className="role-badge">{selectedTicket.customerInfo?.role || selectedTicket.user?.role || 'Customer'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Order Information Section */}
                  {selectedTicket.orderInfo && (
                    <div className="info-section order-section">
                      <h4>📦 Order Information</h4>
                      <div className="info-grid">
                        <div className="info-item">
                          <label>Order ID:</label>
                          <span className="order-id">#{selectedTicket.orderInfo.orderId}</span>
                        </div>
                        <div className="info-item-orignal">
                          <label>Order Status:</label>
                          <span className={`order-status-badge status-${selectedTicket.orderInfo.status}`}>
                            {selectedTicket.orderInfo.status}
                          </span>
                        </div>
                        {selectedTicket.orderInfo.amount && (
                          <div className="info-item">
                            <label>Order Amount:</label>
                            <span className="order-amount">₹{selectedTicket.orderInfo.amount.toLocaleString('en-IN')}</span>
                          </div>
                        )}
                        {selectedTicket.orderInfo.date && (
                          <div className="info-item">
                            <label>Order Date:</label>
                            <span>{formatDate(selectedTicket.orderInfo.date)}</span>
                          </div>
                        )}
                        {selectedTicket.orderInfo.supplierFromOrder && (
                          <div className="info-item">
                            <label>Order Supplier:</label>
                            <span>{selectedTicket.orderInfo.supplierFromOrder}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Supplier Information Section */}
                  {selectedTicket.supplierInfo && (
                    <div className="info-section supplier-section">
                      <h4>🏢 Supplier Information</h4>
                      <div className="info-grid">
                        <div className="info-item-original">
                          <label>Company:</label>
                          <span className="supplier-name">{selectedTicket.supplierInfo.name}</span>
                        </div>
                        {selectedTicket.supplierInfo.phone && selectedTicket.supplierInfo.phone !== 'Not available' && (
                          <div className="info-item">
                            <label>Phone:</label>
                            <span>
                              <a href={`tel:${selectedTicket.supplierInfo.phone}`} className="contact-link">
                                📞 {selectedTicket.supplierInfo.phone}
                              </a>
                            </span>
                          </div>
                        )}
                        {selectedTicket.supplierInfo.email && selectedTicket.supplierInfo.email !== 'Not available' && (
                          <div className="info-item">
                            <label>Email:</label>
                            <span>
                              <a href={`mailto:${selectedTicket.supplierInfo.email}`} className="contact-link">
                                {selectedTicket.supplierInfo.email}
                              </a>
                            </span>
                          </div>
                        )}
                        <div className="info-item">
                          <label>Location:</label>
                          <span>{selectedTicket.supplierInfo.location}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Basic Ticket Information Section */}
                  <div className="info-section ticket-section">
                    <h4>🎫 Ticket Information</h4>
                    <div className="info-grid">
                      <div className="info-item">
                        <label>Category:</label>
                        <span>{categoryLabels[selectedTicket.category]}</span>
                      </div>
                      <div className="info-item-original">
                        <label>Priority:</label>
                        {getPriorityBadge(selectedTicket.priority)}
                      </div>
                      <div className="info-item">
                        <label>Status:</label>
                        {getStatusBadge(selectedTicket.status)}
                      </div>
                      <div className="info-item">
                        <label>Created:</label>
                        <span>{formatDate(selectedTicket.createdAt)}</span>
                      </div>
                      {selectedTicket.handledBy && (
                        <div className="info-item">
                          <label>Handled By:</label>
                          <span>{selectedTicket.handledBy.name}</span>
                        </div>
                      )}
                      {selectedTicket.responseCount !== undefined && (
                        <div className="info-item">
                          <label>Admin Responses:</label>
                          <span className="response-count">{selectedTicket.responseCount}</span>
                        </div>
                      )}
                      {selectedTicket.needsResponse && (
                        <div className="info-item">
                          <label>Status:</label>
                          <span className="needs-response-badge">⚠️ Needs Response</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="messages-section">
                <h4>Conversation</h4>
                <div className="messages-list">
                  {selectedTicket.messages?.length > 0 ? (
                    selectedTicket.messages.map((message, index) => (
                      <div 
                        key={index} 
                        className={`message ${message.senderType === 'customer' ? 'customer-message' : 'admin-message'} ${message.isInternal ? 'internal-message' : ''}`}
                      >
                        <div className="message-header">
                          <span className="sender">
                            {message.senderType === 'customer' ? selectedTicket.user?.name : 'Support Team'}
                            {message.isInternal && <span className="internal-badge">Internal</span>}
                          </span>
                          <span className="timestamp">
                            {formatDate(message.timestamp)}
                          </span>
                        </div>
                        <div className="message-content">
                          {message.message}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-messages">
                      <p>No messages in this conversation yet.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="admin-actions">
                <div className="reply-section">
                  <h4>Send Reply</h4>
                  <form onSubmit={handleReplySubmit}>
                    <textarea
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      placeholder="Type your reply..."
                      rows={4}
                      required
                    />
                    <div className="reply-options">
                      <label>
                        <input
                          type="checkbox"
                          checked={isInternal}
                          onChange={(e) => setIsInternal(e.target.checked)}
                        />
                        Internal message (not visible to customer)
                      </label>
                    </div>
                    <button type="submit" className="btn btn-primary">
                      Send Reply
                    </button>
                  </form>
                </div>

                <div className="notes-section">
                  <h4>Admin Notes</h4>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Internal notes for this ticket..."
                    rows={3}
                  />
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={handleNotesUpdate}
                  >
                    Update Notes
                  </button>
                </div>

                <div className="status-actions">
                  <h4>Quick Actions</h4>
                  <div className="action-buttons">
                    <button 
                      className="btn btn-success"
                      onClick={() => handleStatusUpdate(selectedTicket.ticketId, 'resolved')}
                    >
                      Mark Resolved
                    </button>
                    <button 
                      className="btn btn-warning"
                      onClick={() => handleStatusUpdate(selectedTicket.ticketId, 'pending_customer')}
                    >
                      Pending Customer
                    </button>
                    <button 
                      className="btn btn-info"
                      onClick={() => handleStatusUpdate(selectedTicket.ticketId, 'in_progress')}
                    >
                      In Progress
                    </button>
                    <button 
                      className="btn btn-danger"
                      onClick={() => handleStatusUpdate(selectedTicket.ticketId, 'closed')}
                    >
                      Close Ticket
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportTicketManagement;