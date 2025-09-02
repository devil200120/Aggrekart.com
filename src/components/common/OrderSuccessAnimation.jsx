import React, { useState, useEffect } from "react";
import "./OrderSuccessAnimation.css";

const OrderSuccessAnimation = ({
  isVisible = true,
  size = "large",
  onAnimationComplete,
  showConfetti = true,
}) => {
  const [animationPhase, setAnimationPhase] = useState("hidden");

  useEffect(() => {
    if (isVisible) {
      // Enhanced animation sequence with longer durations like Swiggy/Flipkart
      const sequence = [
        { phase: "preparing", delay: 200 },      // Initial loading state
        { phase: "drawing", delay: 800 },        // Circle appears and checkmark draws
        { phase: "complete", delay: 2200 },      // Checkmark completion with bounce
        { phase: "celebrate", delay: 3000 },     // Long celebration phase
        { phase: "sustained", delay: 5000 },     // Sustained celebration
      ];

      sequence.forEach(({ phase, delay }) => {
        setTimeout(() => {
          setAnimationPhase(phase);
          if (phase === "sustained" && onAnimationComplete) {
            // Call completion callback after the full animation experience
            setTimeout(onAnimationComplete, 2000);
          }
        }, delay);
      });
    }
  }, [isVisible, onAnimationComplete]);

  const sizeClasses = {
    small: "order-success-small",
    medium: "order-success-medium",
    large: "order-success-large",
  };

  return (
    <div
      className={`order-success-container ${sizeClasses[size]} ${animationPhase}`}
    >
      {/* Enhanced Confetti Animation */}
      {showConfetti && (animationPhase === "celebrate" || animationPhase === "sustained") && (
        <div className="confetti-container">
          {[...Array(30)].map((_, i) => (
            <div key={i} className={`confetti confetti-${(i % 6) + 1}`} />
          ))}
        </div>
      )}

      {/* Celebration Burst Effect */}
      {(animationPhase === "celebrate" || animationPhase === "sustained") && (
        <div className="celebration-burst">
          {[...Array(12)].map((_, i) => (
            <div key={i} className={`burst-particle burst-${i + 1}`} />
          ))}
        </div>
      )}

      {/* Main Success Circle */}
      <div className="success-circle">
        {/* Animated Background Rings */}
        <div className="ring ring-1" />
        <div className="ring ring-2" />
        <div className="ring ring-3" />

        {/* Success Icon Container */}
        <div className="success-icon-container">
          {/* Checkmark SVG with animated path */}
          <svg
            className="success-checkmark"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Circle background */}
            <circle cx="50" cy="50" r="45" className="success-circle-bg" />

            {/* Animated checkmark path */}
            <path
              d="M25 50 L40 65 L75 30"
              className="success-checkmark-path"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Enhanced Pulse Effect */}
        <div className="pulse-effect" />
        <div className="pulse-effect-secondary" />
      </div>

      {/* Success Text with enhanced animation */}
      <div className="success-text">
        <h2 className="success-title">Order Placed!</h2>
        <p className="success-subtitle">Your order has been confirmed</p>
        
        {/* Celebration message that appears during celebrate phase */}
        {(animationPhase === "celebrate" || animationPhase === "sustained") && (
          <div className="celebration-message">
            <p className="celebration-text">🎉 Thank you for your order! 🎉</p>
          </div>
        )}
      </div>

      {/* Loading Dots for Preparing Phase */}
      {animationPhase === "preparing" && (
        <div className="loading-dots">
          <div className="dot dot-1" />
          <div className="dot dot-2" />
          <div className="dot dot-3" />
        </div>
      )}

      {/* Success Metrics Animation (like Swiggy shows delivery time, etc.) */}
      {(animationPhase === "celebrate" || animationPhase === "sustained") && (
        <div className="success-metrics">
          <div className="metric-item">
            <div className="metric-icon">🚚</div>
            <div className="metric-text">Fast Delivery</div>
          </div>
          <div className="metric-item">
            <div className="metric-icon">✅</div>
            <div className="metric-text">Confirmed</div>
          </div>
          <div className="metric-item">
            <div className="metric-icon">📱</div>
            <div className="metric-text">SMS Updates</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderSuccessAnimation;
