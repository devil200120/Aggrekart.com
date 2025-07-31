import React, { useState } from 'react';
import { toast } from 'react-toastify';
import './GSTAutoFill.css';

const GSTAutoFill = ({ onDataFill, formData }) => {
  const [gstNumber, setGstNumber] = useState(formData?.gstNumber || '');
  const [isLoading, setIsLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [gstData, setGstData] = useState(null);

  // Validate GST number format
  const validateGSTFormat = (gst) => {
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstRegex.test(gst.replace(/\s/g, '').toUpperCase());
  };

  // Format GST number with spaces
  const formatGSTNumber = (value) => {
    const cleaned = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    if (cleaned.length <= 15) {
      return cleaned.replace(/(.{2})(.{5})(.{4})(.{1})(.{1})(.{1})(.{1})/, '$1 $2 $3 $4 $5 $6 $7').trim();
    }
    return cleaned.substring(0, 15);
  };

  // Handle GST number input
  const handleGSTInput = (e) => {
    const formatted = formatGSTNumber(e.target.value);
    setGstNumber(formatted);
    setVerificationStatus(null);
    setGstData(null);
  };

  // Verify GST number with enhanced error handling
  const verifyGST = async () => {
    if (!gstNumber.trim()) {
      toast.error('Please enter a GST number');
      return;
    }

    const cleanGST = gstNumber.replace(/\s/g, '');
    
    if (!validateGSTFormat(cleanGST)) {
      toast.error('Please enter a valid GST number format');
      setVerificationStatus('invalid');
      return;
    }

    setIsLoading(true);
    setVerificationStatus('verifying');

    try {
      console.log('🔍 Verifying GST:', cleanGST);
      
      const response = await fetch('/api/gst/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gstNumber: cleanGST }),
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

      // Check if response is ok
      if (!response.ok) {
        console.error('❌ HTTP Error:', response.status, response.statusText);
        setVerificationStatus('error');
        setGstData(null);
        
        if (response.status === 404) {
          toast.error('GST number not found in government registry.');
        } else if (response.status === 503) {
          toast.error('GST verification service is temporarily unavailable.');
        } else if (response.status >= 500) {
          toast.error('Server error occurred. Please try again later.');
        } else {
          toast.error(`HTTP Error: ${response.status}. Please try again.`);
        }
        return;
      }

      // Get response text first to check if it's valid JSON
      const responseText = await response.text();
      console.log('📡 Raw response:', responseText);

      if (!responseText || responseText.trim() === '') {
        console.error('❌ Empty response from server');
        setVerificationStatus('error');
        setGstData(null);
        toast.error('Server returned empty response. Please try again.');
        return;
      }

      // Try to parse JSON
      let result;
      try {
        result = JSON.parse(responseText);
        console.log('📊 Parsed result:', result);
      } catch (parseError) {
        console.error('❌ JSON Parse Error:', parseError);
        console.error('❌ Response text:', responseText);
        setVerificationStatus('error');
        setGstData(null);
        toast.error('Invalid response from server. Please try again.');
        return;
      }

      // Handle successful response
      if (result.success && result.data && result.data.gstDetails) {
        console.log('✅ GST verification successful');
        setVerificationStatus('verified');
        setGstData(result.data.gstDetails);
        toast.success('GST number verified successfully!');
      } else {
        // Handle different error types
        console.log('❌ GST verification failed:', result);
        setVerificationStatus('error');
        setGstData(null);
        
        if (result.error === 'GST_NOT_FOUND') {
          toast.error('GST number not found in government registry. Please verify the number and try again.');
        } else if (result.error === 'INVALID_GST_FORMAT') {
          toast.error('Invalid GST number format. Please check and try again.');
        } else if (result.error === 'API_AUTHENTICATION_FAILED') {
          toast.error('GST verification service is temporarily unavailable. Please try again later.');
        } else if (result.error === 'NETWORK_ERROR') {
          toast.error('Network error. Please check your connection and try again.');
        } else {
          toast.error(result.message || 'GST verification failed. Please try again.');
        }
      }

    } catch (error) {
      console.error('❌ GST verification error:', error);
      setVerificationStatus('error');
      setGstData(null);
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        toast.error('Network error: Unable to connect to server. Please check if the backend is running.');
      } else if (error.name === 'SyntaxError' && error.message.includes('JSON')) {
        toast.error('Server returned invalid data. Please try again.');
      } else {
        toast.error('Failed to verify GST number. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Apply GST data to form
  const applyGSTData = () => {
    if (!gstData) return;

    const mappedData = {
      gstNumber: gstData.gstNumber,
      businessName: gstData.businessName,
      legalName: gstData.legalName,
      businessType: gstData.businessType,
      businessAddress: gstData.businessAddress.fullAddress,
      city: gstData.businessAddress.city,
      state: gstData.businessAddress.state,
      pincode: gstData.businessAddress.pincode,
      registrationDate: gstData.registrationDate,
    };

    onDataFill(mappedData);
    toast.success('Business details filled successfully!');
  };

  // Clear GST data
  const clearGSTData = () => {
    setGstNumber('');
    setVerificationStatus(null);
    setGstData(null);
  };

  return (
    <div className="gst-auto-fill">
      <div className="gst-input-section">
        <h3>🔍 GST Verification & Auto-Fill</h3>
        <p>Enter your GST number to automatically verify and fill business details</p>
        
        <div className="gst-input-group">
          <input
            type="text"
            value={gstNumber}
            onChange={handleGSTInput}
            placeholder="Enter GST Number (e.g., 27 AABCU 9603 R1ZX)"
            className={`gst-input ${verificationStatus === 'invalid' ? 'invalid' : ''}`}
            maxLength={20}
          />
          
          <button
            onClick={verifyGST}
            disabled={isLoading || !gstNumber.trim()}
            className={`verify-btn ${verificationStatus}`}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                Verifying...
              </>
            ) : (
              <>
                <span className="icon">🔍</span>
                Verify GST
              </>
            )}
          </button>
        </div>

        {/* Status Indicator */}
        {verificationStatus && (
          <div className={`status-indicator ${verificationStatus}`}>
            {verificationStatus === 'verifying' && (
              <span>🔄 Verifying GST number...</span>
            )}
            {verificationStatus === 'verified' && (
              <span>✅ GST number verified successfully</span>
            )}
            {verificationStatus === 'error' && (
              <span>❌ Verification failed</span>
            )}
            {verificationStatus === 'invalid' && (
              <span>⚠️ Invalid GST number format</span>
            )}
          </div>
        )}
      </div>

      {/* GST Data Preview */}
      {gstData && (
        <div className="gst-data-preview">
          <h4>📋 Verified Business Details</h4>
          <div className="data-grid">
            <div className="data-item">
              <label>GST Number:</label>
              <span>{gstData.gstNumber}</span>
            </div>
            <div className="data-item">
              <label>Business Name:</label>
              <span>{gstData.businessName}</span>
            </div>
            <div className="data-item">
              <label>Legal Name:</label>
              <span>{gstData.legalName}</span>
            </div>
            <div className="data-item">
              <label>Business Type:</label>
              <span>{gstData.businessType}</span>
            </div>
            <div className="data-item">
              <label>Status:</label>
              <span className={`status ${gstData.isActive ? 'active' : 'inactive'}`}>
                {gstData.status}
              </span>
            </div>
            <div className="data-item full-width">
              <label>Business Address:</label>
              <span>{gstData.businessAddress.fullAddress}</span>
            </div>
            <div className="data-item">
              <label>City:</label>
              <span>{gstData.businessAddress.city}</span>
            </div>
            <div className="data-item">
              <label>State:</label>
              <span>{gstData.businessAddress.state}</span>
            </div>
            <div className="data-item">
              <label>Pincode:</label>
              <span>{gstData.businessAddress.pincode}</span>
            </div>
          </div>

          <div className="action-buttons">
            <button onClick={applyGSTData} className="apply-btn">
              ✅ Apply Details to Form
            </button>
            <button onClick={clearGSTData} className="clear-btn">
              🗑️ Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GSTAutoFill;