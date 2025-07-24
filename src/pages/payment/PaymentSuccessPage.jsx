import React, { useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import PaymentStatus from '../../components/payment/PaymentStatus';
import { CheckCircle, ArrowRight, Download, Share2 } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import toast from 'react-hot-toast';
import './PaymentSuccessPage.css';

const PaymentSuccessPage = () => {
  const { orderId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const paymentData = location.state?.paymentData;

  useEffect(() => {
    // Clear cart on successful payment
    clearCart();
    
    // Show success toast
    toast.success('Payment completed successfully!', {
      duration: 5000,
      icon: '🎉'
    });
  }, [clearCart]);

  const handleViewOrder = () => {
    navigate(`/orders/${orderId}`);
  };

  const handleContinueShopping = () => {
    navigate('/products');
  };

  const handleDownloadReceipt = () => {
    // Implement receipt download
    toast.success('Receipt download will be available soon');
  };

  const handleShareOrder = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Order Placed Successfully',
        text: `I just placed an order on Aggrekart! Order ID: ${orderId}`,
        url: window.location.href
      });
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success('Order link copied to clipboard!');
    }
  };

  return (
    <div className="payment-success-page">
      {/* Success Header */}
      <div className="success-header">
        <div className="success-icon-container">
          <CheckCircle className="success-icon" size={80} />
        </div>
        <h1>Payment Successful! 🎉</h1>
        <p>Thank you for your order. We've received your payment and your order is being processed.</p>
      </div>

      {/* Payment Status Component */}
      <div className="payment-status-section">
        <PaymentStatus orderId={orderId} />
      </div>

      {/* Next Steps */}
      <div className="next-steps">
        <h2>What happens next?</h2>
        <div className="steps-grid">
          <div className="step-item">
            <div className="step-number">1</div>
            <h3>Order Confirmation</h3>
            <p>You'll receive an email confirmation with order details</p>
          </div>
          <div className="step-item">
            <div className="step-number">2</div>
            <h3>Supplier Notification</h3>
            <p>Your supplier has been notified and will prepare your order</p>
          </div>
          <div className="step-item">
            <div className="step-number">3</div>
            <h3>Order Preparation</h3>
            <p>Your order will be prepared and ready for dispatch</p>
          </div>
          <div className="step-item">
            <div className="step-number">4</div>
            <h3>Delivery</h3>
            <p>You'll receive delivery updates and tracking information</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="action-buttons">
        <button onClick={handleViewOrder} className="primary-button">
          <ArrowRight size={20} />
          View Order Details
        </button>
        <button onClick={handleDownloadReceipt} className="secondary-button">
          <Download size={20} />
          Download Receipt
        </button>
        <button onClick={handleShareOrder} className="secondary-button">
          <Share2 size={20} />
          Share Order
        </button>
        <button onClick={handleContinueShopping} className="outline-button">
          Continue Shopping
        </button>
      </div>

      {/* Order Summary Card */}
      {paymentData && (
        <div className="order-summary-card">
          <h3>Payment Summary</h3>
          <div className="summary-details">
            <div className="summary-row">
              <span>Order ID:</span>
              <span>{orderId}</span>
            </div>
            <div className="summary-row">
              <span>Transaction ID:</span>
              <span>{paymentData.transactionId}</span>
            </div>
            <div className="summary-row">
              <span>Amount Paid:</span>
              <span>₹{paymentData.amount?.toLocaleString()}</span>
            </div>
            <div className="summary-row">
              <span>Payment Time:</span>
              <span>{new Date(paymentData.paidAt).toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Support Information */}
      <div className="support-info">
        <h3>Need Help?</h3>
        <p>If you have any questions about your order, our support team is here to help.</p>
        <div className="support-contacts">
          <span>📧 support@aggrekart.com</span>
          <span>📞 +91 98765 43210</span>
          <span>💬 Live Chat Available</span>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;