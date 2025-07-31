import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import './GSTAutoFill.css';

const GSTAutoFill = ({ 
  onDataFilled, 
  initialGST = '', 
  onValidationChange = () => {} 
}) => {
  const [gstNumber, setGstNumber] = useState(initialGST);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [autoFillData, setAutoFillData] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [validationIssues, setValidationIssues] = useState([]);

  // Format GST number as user types
  const formatGSTNumber = (value) => {
    const cleaned = value.replace(/[^A-Z0-9]/g, '').toUpperCase();
    return cleaned.substring(0, 15);
  };

  // Validate GST format
  const isValidGSTFormat = (gst) => {
    const cleaned = gst.replace(/[^A-Z0-9]/g, '');
    return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(cleaned);
  };

  // Handle GST input change
  const handleGSTChange = (e) => {
    const formatted = formatGSTNumber(e.target.value);
    setGstNumber(formatted);
    
    // Reset states when input changes
    if (verificationStatus) {
      setVerificationStatus(null);
      setAutoFillData(null);
      setShowPreview(false);
      setValidationIssues([]);
    }

    // Auto-verify when 15 characters are entered
    if (formatted.length === 15 && isValidGSTFormat(formatted)) {
      setTimeout(() => verifyGST(formatted), 500);
    }
  };

  // Simplified GST verification
  const verifyGST = async (gstNum = gstNumber) => {
    if (!gstNum || !isValidGSTFormat(gstNum)) {
      setVerificationStatus('error');
      setValidationIssues(['Invalid GST number format. Please enter a valid 15-digit GST number.']);
      onValidationChange(false);
      return;
    }

    setIsVerifying(true);
    setVerificationStatus(null);
    setValidationIssues([]);

    try {
      console.log('🔍 Starting GST verification for:', gstNum);

      const response = await fetch('/api/gst/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gstNumber: gstNum })
      });

      // Handle response
      let result;
      if (response.ok) {
        const textResponse = await response.text();
        try {
          result = JSON.parse(textResponse);
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          throw new Error('Invalid server response format');
        }
      } else {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      console.log('📡 GST Verification Response:', result);

      if (result.success && result.data?.gstDetails) {
        const details = result.data.gstDetails;
        
        setVerificationStatus('fallback');
        setValidationIssues([
          'Sample data provided based on GST format',
          'Please review and update the details below'
        ]);

        // Extract auto-fill data
        const extractedData = {
          gstNumber: details.gstNumber || '',
          businessName: details.businessName || details.legalName || '',
          businessAddress: details.businessAddress?.fullAddress || '',
          city: details.businessAddress?.city || details.businessAddress?.location || '',
          state: details.businessAddress?.state || '',
          pincode: details.businessAddress?.pincode || '',
          tradeName: details.tradeName || '',
          legalName: details.legalName || '',
          businessType: details.businessType || '',
          accountHolderName: details.legalName || details.businessName || ''
        };

        setAutoFillData(extractedData);
        setShowPreview(true);
        onValidationChange(true);

        toast('GST format verified! Sample data provided for review', { 
          icon: '⚠️',
          duration: 4000 
        });

      } else {
        throw new Error(result.message || 'GST verification failed');
      }

    } catch (error) {
      console.error('❌ GST Verification Error:', error);
      
      setVerificationStatus('error');
      setValidationIssues(['Failed to verify GST number. Please try again.']);
      onValidationChange(false);
      
      toast.error('Failed to verify GST number. Please try again.', { duration: 5000 });

    } finally {
      setIsVerifying(false);
    }
  };

  // Apply auto-fill data
  const applyAutoFill = () => {
    if (autoFillData && onDataFilled) {
      console.log('✅ Applying auto-fill data:', autoFillData);
      onDataFilled(autoFillData);
      setShowPreview(false);
      
      toast.success('Sample data applied! Please review and update as needed', { duration: 5000 });
    }
  };

  // Get status display
  const getStatusDisplay = () => {
    switch (verificationStatus) {
      case 'fallback':
        return { 
          icon: '⚠️', 
          color: '#f59e0b', 
          text: 'Sample Data Mode',
          bgColor: '#fefbf0',
          borderColor: '#f59e0b'
        };
      case 'error':
        return { 
          icon: '❌', 
          color: '#ef4444', 
          text: 'Verification Failed',
          bgColor: '#fef2f2',
          borderColor: '#ef4444'
        };
      default:
        return null;
    }
  };

  const statusDisplay = getStatusDisplay();

  // Update GST number if initialGST changes
  useEffect(() => {
    if (initialGST !== gstNumber) {
      setGstNumber(initialGST);
    }
  }, [initialGST, gstNumber]);

  return (
    <div className="gst-autofill">
      <div className="gst-input-section">
        <div className="input-header">
          <label htmlFor="gst-number" className="gst-label">
            GST Number <span className="required">*</span>
            <span className="help-icon" title="Enter your 15-digit GST number for automatic business verification">
              ?
            </span>
          </label>
          <p className="gst-description">
            Enter your GST number to auto-fill business details
          </p>
        </div>

        <div className="gst-input-wrapper">
          <input
            id="gst-number"
            type="text"
            value={gstNumber}
            onChange={handleGSTChange}
            placeholder="e.g., 27AAACA3918N1ZX"
            className={`gst-input ${verificationStatus ? `status-${verificationStatus}` : ''}`}
            maxLength={15}
            disabled={isVerifying}
          />
          
          {isVerifying && (
            <div className="verification-spinner">
              <div className="spinner"></div>
            </div>
          )}
        </div>

        {/* Verification Status */}
        {statusDisplay && (
          <div 
            className="verification-status"
            style={{
              backgroundColor: statusDisplay.bgColor,
              borderColor: statusDisplay.borderColor,
              color: statusDisplay.color
            }}
          >
            <span className="status-icon">{statusDisplay.icon}</span>
            <span className="status-text">{statusDisplay.text}</span>
          </div>
        )}

        {/* Validation Issues */}
        {validationIssues.length > 0 && (
          <div className="validation-issues">
            {validationIssues.map((issue, index) => (
              <div key={index} className="validation-issue">
                <span className="issue-icon">
                  {verificationStatus === 'error' ? '❌' : '⚠️'}
                </span>
                <span className="issue-text">{issue}</span>
              </div>
            ))}
          </div>
        )}

        {/* Manual Verify Button */}
        {gstNumber.length === 15 && isValidGSTFormat(gstNumber) && !isVerifying && !verificationStatus && (
          <button
            onClick={() => verifyGST()}
            className="verify-button"
            disabled={isVerifying}
          >
            <span className="button-icon">🔍</span>
            VERIFY GST NUMBER
          </button>
        )}
      </div>

      {/* Auto-fill Preview */}
      {showPreview && autoFillData && (
        <div className="autofill-preview">
          <div className="preview-header">
            <h4>
              <span className="preview-icon">📋</span>
              Sample Business Details
              <span className="fallback-badge">Sample Data</span>
            </h4>
            <p className="preview-description">
              Review the sample data below and click "Apply Auto-fill" to populate your form
            </p>
          </div>

          <div className="preview-content">
            <div className="preview-grid">
              <div className="preview-item">
                <label>Business Name:</label>
                <span>{autoFillData.businessName || 'Not available'}</span>
              </div>
              
              <div className="preview-item">
                <label>Business Address:</label>
                <span>{autoFillData.businessAddress || 'Not available'}</span>
              </div>
              
              <div className="preview-item">
                <label>City:</label>
                <span>{autoFillData.city || 'Not available'}</span>
              </div>
              
              <div className="preview-item">
                <label>State:</label>
                <span>{autoFillData.state || 'Not available'}</span>
              </div>
              
              <div className="preview-item">
                <label>Pincode:</label>
                <span>{autoFillData.pincode || 'Not available'}</span>
              </div>

              {autoFillData.businessType && (
                <div className="preview-item">
                  <label>Business Type:</label>
                  <span>{autoFillData.businessType}</span>
                </div>
              )}
            </div>

            <div className="fallback-notice">
              <span className="notice-icon">⚠️</span>
              <div className="notice-content">
                <strong>Please Note:</strong> This is sample data generated based on your GST number format. 
                Please verify and update the business details as needed after applying the auto-fill.
              </div>
            </div>
          </div>

          <div className="preview-actions">
            <button
              onClick={() => setShowPreview(false)}
              className="cancel-button"
            >
              Cancel
            </button>
            <button
              onClick={applyAutoFill}
              className="apply-button"
            >
              <span className="button-icon">✨</span>
              Apply Auto-fill
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GSTAutoFill;