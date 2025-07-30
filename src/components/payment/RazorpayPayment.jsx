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
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    loadPaymentMethods();
    loadRazorpayScript();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      const response = await paymentsAPI.getPaymentMethods();
      if (response?.data?.methods) {
        setPaymentMethods(response.data.methods);
      }
    } catch (error) {
      console.error('Failed to load payment methods:', error);
      // Continue with default methods if API fails
      setPaymentMethods([
        { id: 'card', name: 'Credit/Debit Card', enabled: true },
        { id: 'upi', name: 'UPI', enabled: true },
        { id: 'netbanking', name: 'Net Banking', enabled: true },
        { id: 'wallet', name: 'Digital Wallet', enabled: true }
      ]);
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      // Check if script is already loaded
      if (window.Razorpay) {
        setScriptLoaded(true);
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        setScriptLoaded(true);
        resolve(true);
      };
      script.onerror = () => {
        setScriptLoaded(false);
        resolve(false);
      };
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    if (!order) {
      toast.error('Order information is missing');
      return;
    }

    if (!scriptLoaded) {
      toast.error('Payment gateway is not ready. Please try again.');
      return;
    }

    try {
      setIsProcessing(true);
      setPaymentStatus('processing');

      // Create payment order
      const paymentOrderResponse = await paymentsAPI.createPaymentOrder({
        orderId: order.orderId,
        amount: order.payment?.advanceAmount || order.pricing?.totalAmount,
        currency: 'INR'
      });

      if (!paymentOrderResponse?.success) {
        throw new Error(paymentOrderResponse?.message || 'Failed to create payment order');
      }

      const { razorpayOrderId, amount, currency, key } = paymentOrderResponse.data;

      if (!razorpayOrderId || !key) {
        throw new Error('Invalid payment order response');
      }

      // Razorpay payment options
      const options = {
        key: key,
        amount: amount,
        currency: currency,
        name: 'Aggrekart',
        description: `Payment for Order ${order.orderId}`,
        order_id: razorpayOrderId,
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phoneNumber || ''
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
            console.log('Payment successful, verifying...', response);
            
            // Verify payment
            const verificationResponse = await paymentsAPI.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId: order.orderId
            });

            if (verificationResponse?.success) {
              setPaymentStatus('success');
              toast.success('Payment completed successfully!');
              
              if (onSuccess) {
                onSuccess(verificationResponse.data);
              }
            } else {
              throw new Error(verificationResponse?.message || 'Payment verification failed');
            }
          } catch (verificationError) {
            console.error('Payment verification failed:', verificationError);
            setPaymentStatus('failed');
            const errorMessage = verificationError?.response?.data?.message || 
                               verificationError?.message || 
                               'Payment verification failed';
            toast.error(errorMessage);
            
            if (onError) {
              onError(verificationError);
            }
          }
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
            setPaymentStatus('idle');
            toast.info('Payment cancelled');
            
            if (onCancel) {
              onCancel();
            }
          }
        }
      };

      // Create Razorpay instance and open payment modal
      const razorpay = new window.Razorpay(options);
      
      razorpay.on('payment.failed', (response) => {
        console.error('Payment failed:', response);
        setIsProcessing(false);
        setPaymentStatus('failed');
        
        const errorMessage = response?.error?.description || 
                             response?.error?.reason || 
                             'Payment failed';
        toast.error(errorMessage);
        
        if (onError) {
          onError(response.error);
        }
      });

      razorpay.open();

    } catch (error) {
      console.error('Payment initiation failed:', error);
      setIsProcessing(false);
      setPaymentStatus('failed');
      
      const errorMessage = error?.response?.data?.message || 
                           error?.message || 
                           'Failed to initiate payment';
      toast.error(errorMessage);
      
      if (onError) {
        onError(error);
      }
    }
  };

  const getPaymentMethodIcon = (method) => {
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

  if (!order) {
    return (
      <div className="payment-error">
        <XCircle className="error-icon" />
        <h3>Order Information Missing</h3>
        <p>Unable to process payment. Order details are required.</p>
        <button onClick={onCancel} className="btn btn-secondary">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="razorpay-payment">
      <div className="payment-container">
        <div className="payment-header">
          <h2>Complete Your Payment</h2>
          <div className="order-details">
            <p><strong>Order ID:</strong> {order.orderId}</p>
            <p><strong>Amount:</strong> ₹{(order.payment?.advanceAmount || order.pricing?.totalAmount || 0).toLocaleString()}</p>
          </div>
        </div>

        {!scriptLoaded && (
          <div className="payment-loading">
            <Loader2 className="loading-icon" />
            <p>Loading payment gateway...</p>
          </div>
        )}

        {scriptLoaded && (
          <>
            <div className="payment-methods">
              <h3>Select Payment Method</h3>
              <div className="method-grid">
                {paymentMethods.map((method) => (
                  <div
                    key={method.id}
                    className={`payment-method ${selectedMethod === method.id ? 'selected' : ''} ${!method.enabled ? 'disabled' : ''}`}
                    onClick={() => method.enabled && setSelectedMethod(method.id)}
                  >
                    {getPaymentMethodIcon(method.id)}
                    <span>{method.name}</span>
                    {!method.enabled && <span className="disabled-badge">Coming Soon</span>}
                  </div>
                ))}
              </div>
            </div>

            <div className="payment-info">
              <div className="security-info">
                <CheckCircle className="security-icon" />
                <div>
                  <h4>Secure Payment</h4>
                  <p>Your payment information is encrypted and secure. We use industry-standard security measures to protect your data.</p>
                </div>
              </div>

              {order.payment?.advanceAmount && order.payment?.remainingAmount > 0 && (
                <div className="payment-breakdown">
                  <h4>Payment Breakdown</h4>
                  <div className="breakdown-item">
                    <span>Advance Payment (25%)</span>
                    <span>₹{order.payment.advanceAmount.toLocaleString()}</span>
                  </div>
                  <div className="breakdown-item">
                    <span>Remaining (On Delivery)</span>
                    <span>₹{order.payment.remainingAmount.toLocaleString()}</span>
                  </div>
                  <div className="breakdown-total">
                    <span>Total Order Value</span>
                    <span>₹{(order.payment.advanceAmount + order.payment.remainingAmount).toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="payment-actions">
              <button
                onClick={handlePayment}
                disabled={isProcessing || !scriptLoaded}
                className="btn btn-primary btn-lg pay-now-btn"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="loading-spinner" />
                    Processing Payment...
                  </>
                ) : (
                  `Pay ₹${(order.payment?.advanceAmount || order.pricing?.totalAmount || 0).toLocaleString()}`
                )}
              </button>

              <button
                onClick={onCancel}
                disabled={isProcessing}
                className="btn btn-secondary cancel-btn"
              >
                Cancel Payment
              </button>
            </div>

            {paymentStatus === 'failed' && (
              <div className="payment-status failed">
                <XCircle className="status-icon" />
                <p>Payment failed. Please try again or contact support.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default RazorpayPayment;