import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, RefreshCw, ArrowRight, Download } from 'lucide-react';
import { paymentsAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import './PaymentStatus.css';

const PaymentStatus = ({ orderId }) => {
  const [paymentData, setPaymentData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (orderId) {
      fetchPaymentStatus();
    }
  }, [orderId]);

  const fetchPaymentStatus = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await paymentsAPI.getPaymentStatus(orderId);
      setPaymentData(response.data);
    } catch (error) {
      console.error('Failed to fetch payment status:', error);
      setError('Failed to load payment status');
      toast.error('Failed to load payment status');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="status-icon success" size={48} />;
      case 'failed':
        return <XCircle className="status-icon failed" size={48} />;
      case 'pending':
        return <Clock className="status-icon pending" size={48} />;
      case 'refunded':
      case 'partial_refund':
        return <RefreshCw className="status-icon refunded" size={48} />;
      default:
        return <Clock className="status-icon pending" size={48} />;
    }
  };

  const getStatusMessage = (status) => {
    switch (status) {
      case 'paid':
        return {
          title: 'Payment Successful!',
          description: 'Your payment has been processed successfully. Your order is now being prepared.',
          color: 'success'
        };
      case 'failed':
        return {
          title: 'Payment Failed',
          description: 'Unfortunately, your payment could not be processed. Please try again.',
          color: 'failed'
        };
      case 'pending':
        return {
          title: 'Payment Pending',
          description: 'Your payment is being processed. This may take a few minutes.',
          color: 'pending'
        };
      case 'refunded':
        return {
          title: 'Payment Refunded',
          description: 'Your payment has been refunded successfully.',
          color: 'refunded'
        };
      case 'partial_refund':
        return {
          title: 'Partial Refund Processed',
          description: 'A partial refund has been processed for your payment.',
          color: 'refunded'
        };
      default:
        return {
          title: 'Unknown Status',
          description: 'We are checking your payment status.',
          color: 'pending'
        };
    }
  };

  const handleRetry = () => {
    navigate(`/checkout/${orderId}`);
  };

  const handleViewOrder = () => {
    navigate(`/orders/${orderId}`);
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleDownloadReceipt = () => {
    // Implement receipt download functionality
    toast.success('Receipt download will be available soon');
  };

  if (isLoading) {
    return (
      <div className="payment-status-container">
        <div className="payment-status-card">
          <div className="status-loading">
            <RefreshCw className="loading-icon" size={48} />
            <h2>Checking Payment Status...</h2>
            <p>Please wait while we verify your payment</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="payment-status-container">
        <div className="payment-status-card">
          <div className="status-error">
            <XCircle className="status-icon failed" size={48} />
            <h2>Error Loading Payment Status</h2>
            <p>{error}</p>
            <div className="error-actions">
              <button onClick={fetchPaymentStatus} className="retry-button">
                <RefreshCw size={20} />
                Retry
              </button>
              <button onClick={handleGoHome} className="home-button">
                Go Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!paymentData) {
    return (
      <div className="payment-status-container">
        <div className="payment-status-card">
          <div className="status-error">
            <XCircle className="status-icon failed" size={48} />
            <h2>Payment Status Not Found</h2>
            <p>We couldn't find payment information for this order.</p>
            <div className="error-actions">
              <button onClick={handleGoHome} className="home-button">
                Go Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusMessage(paymentData.paymentStatus);

  return (
    <div className="payment-status-container">
      <div className="payment-status-card">
        <div className={`status-content ${statusInfo.color}`}>
          {getStatusIcon(paymentData.paymentStatus)}
          
          <div className="status-info">
            <h2>{statusInfo.title}</h2>
            <p>{statusInfo.description}</p>
          </div>

          <div className="payment-details">
            <h3>Payment Details</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Order ID:</span>
                <span className="detail-value">{paymentData.orderId}</span>
              </div>
              
              {paymentData.transactionId && (
                <div className="detail-item">
                  <span className="detail-label">Transaction ID:</span>
                  <span className="detail-value">{paymentData.transactionId}</span>
                </div>
              )}
              
              <div className="detail-item">
                <span className="detail-label">Amount:</span>
                <span className="detail-value">₹{paymentData.amount?.toLocaleString()}</span>
              </div>
              
              {paymentData.method && (
                <div className="detail-item">
                  <span className="detail-label">Payment Method:</span>
                  <span className="detail-value">{paymentData.method.toUpperCase()}</span>
                </div>
              )}
              
              {paymentData.paidAt && (
                <div className="detail-item">
                  <span className="detail-label">Paid At:</span>
                  <span className="detail-value">
                    {new Date(paymentData.paidAt).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {paymentData.refundDetails && (
            <div className="refund-details">
              <h3>Refund Details</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Refund Amount:</span>
                  <span className="detail-value">₹{paymentData.refundDetails.amount?.toLocaleString()}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Processed At:</span>
                  <span className="detail-value">
                    {new Date(paymentData.refundDetails.processedAt).toLocaleString()}
                  </span>
                </div>
                {paymentData.refundDetails.reason && (
                  <div className="detail-item">
                    <span className="detail-label">Reason:</span>
                    <span className="detail-value">{paymentData.refundDetails.reason}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="status-actions">
            {paymentData.paymentStatus === 'paid' && (
              <>
                <button onClick={handleViewOrder} className="primary-button">
                  <ArrowRight size={20} />
                  View Order Details
                </button>
                <button onClick={handleDownloadReceipt} className="secondary-button">
                  <Download size={20} />
                  Download Receipt
                </button>
              </>
            )}
            
            {paymentData.paymentStatus === 'failed' && (
              <>
                <button onClick={handleRetry} className="primary-button">
                  <RefreshCw size={20} />
                  Retry Payment
                </button>
                <button onClick={handleGoHome} className="secondary-button">
                  Go Home
                </button>
              </>
            )}
            
            {paymentData.paymentStatus === 'pending' && (
              <>
                <button onClick={fetchPaymentStatus} className="primary-button">
                  <RefreshCw size={20} />
                  Refresh Status
                </button>
                <button onClick={handleGoHome} className="secondary-button">
                  Go Home
                </button>
              </>
            )}
            
            {(paymentData.paymentStatus === 'refunded' || paymentData.paymentStatus === 'partial_refund') && (
              <button onClick={handleGoHome} className="primary-button">
                Go Home
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentStatus;