import React, { useState, useEffect } from 'react';
import { CreditCard, Smartphone, Building, Wallet, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { paymentsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './RazorpayPayment.css';

const RazorpayPayment = ({ order, onSuccess, onError, onCancel }) => {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('idle'); // idle, processing, success, failed
  const { user } = useAuth();

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      const response = await paymentsAPI.getPaymentMethods();
      setPaymentMethods(response.data.methods);
    } catch (error) {
      console.error('Failed to load payment methods:', error);
      toast.error('Failed to load payment methods');
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    try {
      setIsProcessing(true);
      setPaymentStatus('processing');

      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load Razorpay SDK');
      }

      // Create payment order
      const paymentOrderResponse = await paymentsAPI.createPaymentOrder({
        orderId: order.orderId,
        amount: order.payment.advanceAmount,
        currency: 'INR'
      });

      const { razorpayOrderId, amount, currency, key } = paymentOrderResponse.data;

      // Razorpay payment options
      const options = {
        key: key,
        amount: amount,
        currency: currency,
        name: 'Aggrekart',
        description: `Payment for Order ${order.orderId}`,
        order_id: razorpayOrderId,
        prefill: {
          name: user.name,
          email: user.email,
          contact: user.phoneNumber
        },
        theme: {
          color: '#667eea'
        },
        method: {
          card: selectedMethod === 'card',
          upi: selectedMethod === 'upi',
          netbanking: selectedMethod === 'netbanking',
          wallet: selectedMethod === 'wallet'
        },
        handler: async (response) => {
          try {
            // Verify payment
            const verificationResponse = await paymentsAPI.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId: order.orderId
            });

            setPaymentStatus('success');
            toast.success('Payment completed successfully!');
            
            if (onSuccess) {
              onSuccess(verificationResponse.data);
            }
          } catch (verificationError) {
            console.error('Payment verification failed:', verificationError);
            setPaymentStatus('failed');
            toast.error('Payment verification failed');
            
            if (onError) {
              onError(verificationError);
            }
          }
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
            setPaymentStatus('idle');
            
            if (onCancel) {
              onCancel();
            }
          }
        }
      };

      // Open Razorpay checkout
      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (error) {
      console.error('Payment initiation failed:', error);
      setPaymentStatus('failed');
      setIsProcessing(false);
      toast.error('Failed to initiate payment');
      
      if (onError) {
        onError(error);
      }
    }
  };

  const getMethodIcon = (method) => {
    switch (method) {
      case 'card':
        return <CreditCard className="payment-method-icon" />;
      case 'upi':
        return <Smartphone className="payment-method-icon" />;
      case 'netbanking':
        return <Building className="payment-method-icon" />;
      case 'wallet':
        return <Wallet className="payment-method-icon" />;
      default:
        return <CreditCard className="payment-method-icon" />;
    }
  };

  const getStatusIcon = () => {
    switch (paymentStatus) {
      case 'processing':
        return <Loader2 className="status-icon processing" />;
      case 'success':
        return <CheckCircle className="status-icon success" />;
      case 'failed':
        return <XCircle className="status-icon failed" />;
      default:
        return null;
    }
  };

  const getStatusMessage = () => {
    switch (paymentStatus) {
      case 'processing':
        return 'Processing your payment...';
      case 'success':
        return 'Payment completed successfully!';
      case 'failed':
        return 'Payment failed. Please try again.';
      default:
        return '';
    }
  };

  return (
    <div className="razorpay-payment">
      <div className="payment-header">
        <h3>Complete Your Payment</h3>
        <div className="payment-amount">
          <span className="amount-label">Amount to Pay:</span>
          <span className="amount-value">₹{order.payment.advanceAmount?.toLocaleString()}</span>
        </div>
      </div>

      <div className="order-summary">
        <h4>Order Summary</h4>
        <div className="order-details">
          <div className="order-detail">
            <span>Order ID:</span>
            <span>{order.orderId}</span>
          </div>
          <div className="order-detail">
            <span>Advance Payment ({order.payment.advancePercentage}%):</span>
            <span>₹{order.payment.advanceAmount?.toLocaleString()}</span>
          </div>
          <div className="order-detail">
            <span>Remaining Amount:</span>
            <span>₹{order.payment.remainingAmount?.toLocaleString()}</span>
          </div>
          <div className="order-detail total">
            <span>Total Order Value:</span>
            <span>₹{order.pricing.totalAmount?.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="payment-methods">
        <h4>Select Payment Method</h4>
        <div className="methods-grid">
          {paymentMethods.map((method) => (
            <div
              key={method.id}
              className={`payment-method ${selectedMethod === method.id ? 'selected' : ''} ${!method.enabled ? 'disabled' : ''}`}
              onClick={() => method.enabled && setSelectedMethod(method.id)}
            >
              {getMethodIcon(method.id)}
              <div className="method-info">
                <span className="method-name">{method.name}</span>
                <span className="method-description">{method.description}</span>
              </div>
              {selectedMethod === method.id && (
                <div className="method-selected">
                  <CheckCircle size={20} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {paymentStatus !== 'idle' && (
        <div className={`payment-status ${paymentStatus}`}>
          {getStatusIcon()}
          <span>{getStatusMessage()}</span>
        </div>
      )}

      <div className="payment-actions">
        <button
          className="pay-button"
          onClick={handlePayment}
          disabled={isProcessing || paymentStatus === 'success'}
        >
          {isProcessing ? (
            <>
              <Loader2 className="button-icon processing" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="button-icon" />
              Pay ₹{order.payment.advanceAmount?.toLocaleString()}
            </>
          )}
        </button>
      </div>

      <div className="payment-security">
        <div className="security-badges">
          <div className="security-badge">
            <span>🔒 256-bit SSL Encrypted</span>
          </div>
          <div className="security-badge">
            <span>🛡️ PCI DSS Compliant</span>
          </div>
          <div className="security-badge">
            <span>⚡ Powered by Razorpay</span>
          </div>
        </div>
        <p className="security-note">
          Your payment information is secure and encrypted. We don't store your card details.
        </p>
      </div>
    </div>
  );
};

export default RazorpayPayment;