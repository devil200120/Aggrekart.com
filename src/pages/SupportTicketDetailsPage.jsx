import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supportAPI } from '../services/api';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/common/LoadingSpinner';
import './SupportTicketDetailsPage.css';

const SupportTicketDetailsPage = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyLoading, setReplyLoading] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingFeedback, setRatingFeedback] = useState('');

  const statusColors = {
    open: '#28a745',
    in_progress: '#ffc107',
    pending_customer: '#fd7e14',
    resolved: '#17a2b8',
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
    fetchTicketDetails();
  }, [ticketId]);

  const fetchTicketDetails = async () => {
    try {
      setLoading(true);
      console.log('🎫 Fetching ticket details for ID:', ticketId);
      
      const response = await supportAPI.getTicket(ticketId);
      console.log('📋 Ticket details response:', response);
      
      // Fix: Use correct response structure
      if (response.success && response.data) {
        setTicket(response.data.ticket);
        console.log('✅ Ticket details loaded:', response.data.ticket);
      } else {
        console.error('❌ Unexpected response structure:', response);
        throw new Error('Invalid response structure');
      }
    } catch (error) {
      console.error('❌ Error fetching ticket details:', error);
      console.error('❌ Error response:', error.response?.data);
      
      const errorMessage = error.response?.data?.message || 'Failed to fetch ticket details';
      toast.error(errorMessage);
      navigate('/support/tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    
    if (!replyMessage.trim()) {
      toast.error('Please enter a reply message');
      return;
    }

    try {
      setReplyLoading(true);
      console.log('💬 Sending reply to ticket:', ticketId, replyMessage.trim());
      
      await supportAPI.replyToTicket(ticketId, replyMessage.trim());
      setReplyMessage('');
      await fetchTicketDetails(); // Refresh ticket data
      toast.success('Reply sent successfully');
    } catch (error) {
      console.error('❌ Error sending reply:', error);
      console.error('❌ Reply error response:', error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to send reply');
    } finally {
      setReplyLoading(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!window.confirm('Are you sure you want to close this ticket?')) {
      return;
    }

    try {
      console.log('🔒 Closing ticket:', ticketId);
      await supportAPI.closeTicket(ticketId);
      await fetchTicketDetails();
      toast.success('Ticket closed successfully');
      setShowRatingModal(true);
    } catch (error) {
      console.error('❌ Error closing ticket:', error);
      toast.error('Failed to close ticket');
    }
  };

  const handleRatingSubmit = async () => {
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    try {
      console.log('⭐ Submitting rating:', { rating, feedback: ratingFeedback });
      
      await supportAPI.rateTicket(ticketId, {
        rating,
        feedback: ratingFeedback.trim()
      });
      
      await fetchTicketDetails();
      setShowRatingModal(false);
      setRating(0);
      setRatingFeedback('');
      toast.success('Thank you for your feedback!');
    } catch (error) {
      console.error('❌ Error submitting rating:', error);
      toast.error('Failed to submit rating');
    }
  };

  const formatDate = (dateString) => {
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
        className="status-badge" 
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
        className="priority-badge" 
        style={{ backgroundColor: color }}
      >
        {priority.toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!ticket) {
    return (
      <div className="ticket-details-page">
        <div className="container">
          <div className="error-message">
            <h2>Ticket Not Found</h2>
            <p>The ticket you're looking for doesn't exist or you don't have access to it.</p>
            <button 
              className="btn btn-primary"
              onClick={() => navigate('/support/tickets')}
            >
              Back to Support Tickets
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ticket-details-page">
      <div className="container">
        <div className="ticket-header">
          <div className="header-left">
            <h1>#{ticket.ticketId}</h1>
            <h2>{ticket.subject}</h2>
            <div className="ticket-meta">
              <span className="category">{categoryLabels[ticket.category]}</span>
              {getStatusBadge(ticket.status)}
              {getPriorityBadge(ticket.priority)}
            </div>
          </div>
          <div className="header-right">
            <div className="ticket-info">
              <p><strong>Created:</strong> {formatDate(ticket.createdAt)}</p>
              <p><strong>Last Updated:</strong> {formatDate(ticket.updatedAt)}</p>
              {ticket.relatedOrder && (
                <p><strong>Related Order:</strong> #{ticket.relatedOrder.orderId}</p>
              )}
            </div>
          </div>
        </div>

        <div className="ticket-content">
          <div className="messages-section">
            <h3>Conversation</h3>
            <div className="messages-list">
              {ticket.messages && ticket.messages.length > 0 ? (
                ticket.messages.map((message, index) => (
                  <div 
                    key={index} 
                    className={`message ${message.senderType === 'customer' ? 'customer-message' : 'admin-message'}`}
                  >
                    <div className="message-header">
                      <span className="sender">
                        {message.senderType === 'customer' ? 'You' : 'Support Team'}
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
                  <p>No messages yet.</p>
                </div>
              )}
            </div>
          </div>

          {ticket.status !== 'closed' && ticket.status !== 'resolved' && (
            <div className="reply-section">
              <h3>Send Reply</h3>
              <form onSubmit={handleReplySubmit} className="reply-form">
                <div className="form-group">
                  <textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Type your reply here..."
                    rows={4}
                    maxLength={2000}
                    required
                  />
                  <small className="char-count">{replyMessage.length}/2000</small>
                </div>
                <div className="form-actions">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={replyLoading}
                  >
                    {replyLoading ? 'Sending...' : 'Send Reply'}
                  </button>
                  
                  {ticket.status === 'open' && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleCloseTicket}
                    >
                      Close Ticket
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

          {ticket.status === 'resolved' && !ticket.rating && (
            <div className="rating-section">
              <h3>Rate This Support Experience</h3>
              <p>How satisfied are you with the support you received?</p>
              <button 
                className="btn btn-primary"
                onClick={() => setShowRatingModal(true)}
              >
                Rate Support
              </button>
            </div>
          )}

          {ticket.rating && (
            <div className="existing-rating">
              <h3>Your Rating</h3>
              <div className="rating-display">
                <span className="stars">
                  {'⭐'.repeat(ticket.rating.rating)}
                </span>
                <span className="rating-number">({ticket.rating.rating}/5)</span>
              </div>
              {ticket.rating.feedback && (
                <p className="rating-feedback">{ticket.rating.feedback}</p>
              )}
            </div>
          )}
        </div>

        {/* Rating Modal */}
        {showRatingModal && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3>Rate Support Experience</h3>
                <button 
                  className="modal-close"
                  onClick={() => setShowRatingModal(false)}
                >
                  ×
                </button>
              </div>
              <div className="modal-body">
                <div className="rating-input">
                  <label>Rating (1-5 stars):</label>
                  <div className="stars-input">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        className={`star ${rating >= star ? 'active' : ''}`}
                        onClick={() => setRating(star)}
                      >
                        ⭐
                      </button>
                    ))}
                  </div>
                </div>
                <div className="feedback-input">
                  <label>Feedback (optional):</label>
                  <textarea
                    value={ratingFeedback}
                    onChange={(e) => setRatingFeedback(e.target.value)}
                    placeholder="Tell us about your experience..."
                    rows={3}
                    maxLength={500}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  className="btn btn-secondary"
                  onClick={() => setShowRatingModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={handleRatingSubmit}
                >
                  Submit Rating
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupportTicketDetailsPage;