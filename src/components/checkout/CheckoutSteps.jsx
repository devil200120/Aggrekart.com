import React from 'react'
import './CheckoutSteps.css'

const CheckoutSteps = ({ steps, currentStep }) => {
  return (
    <div className="checkout-steps">
      <div className="steps-container">
        {steps.map((step, index) => (
          <div 
            key={step.number}
            className={`step ${currentStep >= step.number ? 'active' : ''} ${currentStep > step.number ? 'completed' : ''}`}
          >
            <div className="step-indicator">
              <div className="step-number">
                {currentStep > step.number ? '✓' : step.number}
              </div>
              {index < steps.length - 1 && (
                <div className={`step-line ${currentStep > step.number ? 'completed' : ''}`}></div>
              )}
            </div>
            
            <div className="step-content">
              <div className="step-title">{step.title}</div>
              <div className="step-description">{step.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default CheckoutSteps