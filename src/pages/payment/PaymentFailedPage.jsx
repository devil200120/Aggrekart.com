import React from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { XCircle, RefreshCw, ArrowLeft, HelpCircle, Phone, Mail } from 'lucide-react';
import PaymentStatus from '../../components/payment/PaymentStatus';
import './PaymentFailedPage.css';

const PaymentFailedPage = () => {
  const { orderId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const errorMessage = location.state?.error || 'Payment could not be processed';

  const handleRetryPayment = () => {
    navigate(`/payment/processing/${orderId}`);
  };

  const handleBackToOrder = () => {
    navigate(`/orders/${orderId}`);
  };

  const handleContactSupport = () => {
    // You can implement support modal or redirect to support page
    window.open('mailto:support@aggrekart.com?subject=Payment Failed - Order ' + orderId);
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const commonReasons = [
    {
      title: 'Insufficient Balance',
      description: 'Please check if you have sufficient balance in your account'
    },
    {
      title: 'Network Issues',
      description: 'Poor network connection can cause payment failures'
    },
    {
      title: 'Bank Restrictions',
      description: 'Your bank might have restrictions on online payments'
    },
    {
      title: 'Card Issues',
      description: 'Expired card, incorrect CVV, or card blocked by bank'
    },
    {
      title: 'Payment Limit',
      description: 'You might have exceeded daily/monthly payment limits'
    },
    {
      title: 'OTP Issues',
      description: 'Incorrect OTP or OTP timeout can cause failures'
    }
  ];

  const troubleshootingSteps = [
    'Check your internet connection and try again',
    'Verify your payment details are correct',
    'Try using a different payment method',
    'Contact your bank if the issue persists',
    'Clear browser cache and cookies',
    'Try payment from a different device/browser'
  ];

  return (
    <div className="payment-failed-page">
      {/* Failed Header */}
      <div className="failed-header">
        <div className="failed-icon-container">
          <XCircle className="failed-icon" size={80} />
        </div>
        <h1>Payment Failed</h1>
        <p>Unfortunately, we couldn't process your payment. Don't worry, you can try again.</p>
        <div className="error-message">
          <strong>Error:</strong> {errorMessage}
        </div>
      </div>

      {/* Payment Status Component */}
      <div className="payment-status-section">
        <PaymentStatus orderId={orderId} />
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>What would you like to do?</h2>
        <div className="action-grid">
          <button onClick={handleRetryPayment} className="action-card primary">
            <RefreshCw size={32} />
            <h3>Retry Payment</h3>
            <p>Try paying again with the same or different method</p>
          </button>
          
          <button onClick={handleBackToOrder} className="action-card secondary">
            <ArrowLeft size={32} />
            <h3>Back to Order</h3>
            <p>Review your order details and try later</p>
          </button>
          
          <button onClick={handleContactSupport} className="action-card support">
            <HelpCircle size={32} />
            <h3>Contact Support</h3>
            <p>Get help from our customer support team</p>
          </button>
        </div>
      </div>

      {/* Common Reasons */}
      <div className="common-reasons">
        <h2>Common Reasons for Payment Failure</h2>
        <div className="reasons-grid">
          {commonReasons.map((reason, index) => (
            <div key={index} className="reason-card">
              <h4>{reason.title}</h4>
              <p>{reason.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Troubleshooting */}
      <div className="troubleshooting">
        <h2>Troubleshooting Steps</h2>
        <div className="steps-list">
          {troubleshootingSteps.map((step, index) => (
            <div key={index} className="step-item">
              <div className="step-number">{index + 1}</div>
              <span>{step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Alternative Payment Methods */}
      <div className="alternative-methods">
        <h2>Try Alternative Payment Methods</h2>
        <div className="methods-suggestion">
          <div className="method-option">
            <h4>🏦 Net Banking</h4>
            <p>Direct bank transfer - most reliable option</p>
          </div>
          <div className="method-option">
            <h4>📱 UPI</h4>
            <p>Quick and secure UPI payments</p>
          </div>
          <div className="method-option">
            <h4>💳 Different Card</h4>
            <p>Try using a different debit/credit card</p>
          </div>
          <div className="method-option">
            <h4>💰 Digital Wallets</h4>
            <p>Use Paytm, PhonePe, or other wallets</p>
          </div>
        </div>
      </div>

      {/* Support Section */}
      <div className="support-section">
        <h2>Still Need Help?</h2>
        <p>Our support team is available 24/7 to help you complete your payment</p>
        
        <div className="support-options">
          <div className="support-option">
            <Phone size={24} />
            <div>
              <h4>Call Support</h4>
              <p>+91 98765 43210</p>
            </div>
          </div>
          
          <div className="support-option">
            <Mail size={24} />
            <div>
              <h4>Email Support</h4>
              <p>support@aggrekart.com</p>
            </div>
          </div>
          
          <div className="support-option">
            <HelpCircle size={24} />
            <div>
              <h4>Live Chat</h4>
              <p>Available 24/7</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="bottom-actions">
        <button onClick={handleRetryPayment} className="retry-button">
          <RefreshCw size={20} />
          Retry Payment
        </button>
        <button onClick={handleGoHome} className="home-button">
          Go to Home
        </button>
      </div>
    </div>
  );
};

export default PaymentFailedPage;