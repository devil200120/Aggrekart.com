import React, { useState, useEffect } from 'react';
import OrderSuccessAnimation from './OrderSuccessAnimation';
import './OrderPlacementOverlay.css';

const OrderPlacementOverlay = ({ 
  isVisible, 
  onClose, 
  orderDetails,
  showProcessingSteps = true 
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  const processingSteps = [
    { text: "Processing your order...", duration: 1000 },
    { text: "Verifying payment details...", duration: 800 },
    { text: "Confirming with suppliers...", duration: 1200 },
    { text: "Order confirmed!", duration: 500 }
  ];

  useEffect(() => {
    if (isVisible && showProcessingSteps) {
      let stepIndex = 0;
      
      const showNextStep = () => {
        if (stepIndex < processingSteps.length) {
          setCurrentStep(stepIndex);
          stepIndex++;
          
          if (stepIndex < processingSteps.length) {
            setTimeout(showNextStep, processingSteps[stepIndex - 1].duration);
          } else {
            setTimeout(() => setShowSuccess(true), processingSteps[stepIndex - 1].duration);
          }
        }
      };
      
      showNextStep();
    } else if (isVisible) {
      setShowSuccess(true);
    }
  }, [isVisible, showProcessingSteps]);

  const handleAnimationComplete = () => {
    setTimeout(() => {
      if (onClose) onClose();
    }, 2000);
  };

  if (!isVisible) return null;

  return (
    <div className="order-placement-overlay">
      <div className="overlay-backdrop" onClick={onClose} />
      
      <div className="overlay-content">
        {!showSuccess ? (
          /* Processing Steps */
          <div className="processing-container">
            <div className="processing-animation">
              <div className="processing-spinner">
                <div className="spinner-ring"></div>
                <div className="spinner-ring"></div>
                <div className="spinner-ring"></div>
              </div>
            </div>
            
            <div className="processing-steps">
              {processingSteps.map((step, index) => (
                <div 
                  key={index}
                  className={`processing-step ${index <= currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
                >
                  <div className="step-indicator">
                    {index < currentStep ? '✓' : index === currentStep ? '⏳' : '○'}
                  </div>
                  <span className="step-text">{step.text}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Success Animation */
          <div className="success-container">
            <OrderSuccessAnimation 
              isVisible={showSuccess}
              size="large"
              onAnimationComplete={handleAnimationComplete}
              showConfetti={true}
            />
            
            {orderDetails && (
              <div className="order-details-summary">
                <h3>Order #{orderDetails.orderNumber}</h3>
                <p>Total: ₹{orderDetails.totalAmount}</p>
                <p className="delivery-info">
                  🚚 Estimated delivery: {orderDetails.estimatedDelivery || '2-3 business days'}
                </p>
              </div>
            )}
            
            <div className="overlay-actions">
              <button className="btn btn-primary" onClick={onClose}>
                View Order Details
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderPlacementOverlay;