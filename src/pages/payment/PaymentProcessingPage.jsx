import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import RazorpayPayment from '../../components/payment/RazorpayPayment';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { ordersAPI } from '../../services/api';
import toast from 'react-hot-toast';
import './PaymentProcessingPage.css';

const PaymentProcessingPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [paymentAttempted, setPaymentAttempted] = useState(false);

  // Fetch order details
  const { data: order, isLoading, error } = useQuery(
    ['order', orderId],
    () => ordersAPI.getOrder(orderId),
    {
      enabled: !!orderId,
      retry: 1,
      onError: (error) => {
        console.error('Failed to fetch order:', error);
        toast.error('Order not found');
        navigate('/orders');
      }
    }
  );

  useEffect(() => {
    // Auto-redirect if order is already paid
    if (order?.data?.payment?.status === 'paid') {
      navigate(`/payment/success/${orderId}`);
    }
  }, [order, orderId, navigate]);

  const handlePaymentSuccess = (paymentData) => {
    setPaymentAttempted(true);
    toast.success('Payment completed successfully!');
    
    // Redirect to success page
    navigate(`/payment/success/${orderId}`, {
      state: { paymentData }
    });
  };

  const handlePaymentError = (error) => {
    setPaymentAttempted(true);
    console.error('Payment failed:', error);
    toast.error('Payment failed. Please try again.');
    
    // Redirect to failed page
    navigate(`/payment/failed/${orderId}`, {
      state: { error: error.message }
    });
  };

  const handlePaymentCancel = () => {
    toast.info('Payment cancelled');
    navigate(`/orders/${orderId}`);
  };

  if (isLoading) {
    return (
      <div className="payment-processing-page">
        <div className="loading-container">
          <LoadingSpinner />
          <h2>Loading order details...</h2>
          <p>Please wait while we prepare your payment</p>
        </div>
      </div>
    );
  }

  if (error || !order?.data) {
    return (
      <div className="payment-processing-page">
        <div className="error-container">
          <h2>Order Not Found</h2>
          <p>We couldn't find the order you're trying to pay for.</p>
          <button onClick={() => navigate('/orders')} className="back-button">
            View My Orders
          </button>
        </div>
      </div>
    );
  }

  const orderData = order.data;

  // Check if order is in correct state for payment
  if (orderData.payment.status === 'paid') {
    navigate(`/payment/success/${orderId}`);
    return null;
  }

  if (orderData.status === 'cancelled') {
    return (
      <div className="payment-processing-page">
        <div className="error-container">
          <h2>Order Cancelled</h2>
          <p>This order has been cancelled and cannot be paid for.</p>
          <button onClick={() => navigate('/orders')} className="back-button">
            View My Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-processing-page">
      <div className="page-header">
        <h1>Complete Your Payment</h1>
        <p>Secure payment powered by Razorpay</p>
      </div>

      <div className="payment-container">
        <RazorpayPayment
          order={orderData}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
          onCancel={handlePaymentCancel}
        />
      </div>

      <div className="payment-help">
        <div className="help-section">
          <h3>Payment Help</h3>
          <div className="help-items">
            <div className="help-item">
              <strong>Secure Payment:</strong> Your payment is processed securely through Razorpay
            </div>
            <div className="help-item">
              <strong>Multiple Options:</strong> Pay using cards, UPI, net banking, or wallets
            </div>
            <div className="help-item">
              <strong>Instant Confirmation:</strong> Get immediate payment confirmation
            </div>
            <div className="help-item">
              <strong>Need Help?:</strong> Contact support if you face any issues
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentProcessingPage;