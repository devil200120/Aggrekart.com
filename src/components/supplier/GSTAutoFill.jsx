import React, { useState, useCallback } from 'react';
import { Search, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import axios from 'axios';

const GSTAutoFill = ({ onDataFill, onGSTDataFilled, formData, setFormData }) => {
  const [gstNumber, setGstNumber] = useState(formData?.gstNumber || '');
  const [loading, setLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [error, setError] = useState(null);
  const [validationMessage, setValidationMessage] = useState('');

  // Get API base URL
  const getAPIBaseURL = () => {
    if (window.location.hostname.includes('onrender.com')) {
      return 'https://aggrekart-com-backend.onrender.com/api';
    }
    return 'http://localhost:5000/api';
  };

  // Format GST number as user types
  const formatGSTNumber = (value) => {
    const cleaned = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    if (cleaned.length <= 15) {
      return cleaned;
    }
    return cleaned.slice(0, 15);
  };

  // Validate GST format in real-time
  const validateGSTFormat = (gst) => {
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstRegex.test(gst);
  };

  // Handle GST input change
  const handleGSTChange = (e) => {
    const value = e.target.value;
    const formatted = formatGSTNumber(value);
    setGstNumber(formatted);
    
    // Update form data
    if (setFormData) {
      setFormData(prev => ({ ...prev, gstNumber: formatted }));
    }
    
    // Real-time validation
    if (formatted.length === 15) {
      if (validateGSTFormat(formatted)) {
        setValidationMessage('✓ Valid GST format');
        setError(null);
      } else {
        setValidationMessage('✗ Invalid GST format');
        setError('Please enter a valid GST number');
      }
    } else if (formatted.length > 0) {
      setValidationMessage(`${formatted.length}/15 characters`);
      setError(null);
    } else {
      setValidationMessage('');
      setError(null);
    }
    
    // Reset verification status when user changes GST
    if (verificationStatus) {
      setVerificationStatus(null);
    }
  };

  // Verify GST and auto-fill details
  const verifyGST = useCallback(async () => {
    if (!gstNumber || gstNumber.length !== 15) {
      setError('Please enter a complete 15-digit GST number');
      return;
    }

    if (!validateGSTFormat(gstNumber)) {
      setError('Please enter a valid GST number format');
      return;
    }

    setLoading(true);
    setError(null);
    setVerificationStatus(null);

    try {
      console.log('🔍 Verifying GST:', gstNumber);
      
      const response = await axios.post(`${getAPIBaseURL()}/gst/verify`, 
        { gstNumber },
        {
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ GST verification response:', response.data);

      if (response.data.success && response.data.data) {
        const gstData = response.data.data;
        
        setVerificationStatus('verified');
        setValidationMessage('✓ GST verified successfully');
        
        // FIXED: Map the API response to the correct form fields
        const autoFillData = {
          // Core GST data
          gstNumber: gstData.gstNumber,
          
          // FIXED: Map to correct field names for supplier registration
          businessName: gstData.legalName || gstData.companyName, // Form expects 'businessName'
          tradeName: gstData.tradeName || gstData.legalName,
          panNumber: gstData.panNumber,
          // FIXED: Map address correctly
          businessAddress: gstData.address, // Form expects 'businessAddress'
          city: gstData.city,
          state: gstData.state,
          pincode: gstData.pincode,
          
          // Additional business info
          businessType: gstData.taxpayerType,
          businessNature: gstData.businessNature,
          registrationDate: gstData.registrationDate,
          gstStatus: gstData.gstStatus,
          
          // Extra fields from API
          stateJurisdiction: gstData.stateJurisdiction,
          constitutionOfBusiness: gstData.constitutionOfBusiness,
          legalName: gstData.legalName // Keep original for reference
        };

        console.log('📝 Prepared auto-fill data:', autoFillData);

        // Update form data if setFormData is provided
        if (setFormData) {
          setFormData(prev => ({
            ...prev,
            ...autoFillData
          }));
          console.log('✅ Updated form data via setFormData');
        }

        // FIXED: Support both callback names for backward compatibility
        if (onDataFill) {
          onDataFill(autoFillData);
          console.log('✅ Called onDataFill callback');
        }
        
        if (onGSTDataFilled) {
          onGSTDataFilled(autoFillData);
          console.log('✅ Called onGSTDataFilled callback');
        }

        console.log('🎉 Auto-fill completed successfully!');
        
      } else {
        throw new Error(response.data.message || 'GST verification failed');
      }

    } catch (error) {
      console.error('❌ GST verification error:', error);
      
      setVerificationStatus('failed');
      
      if (error.response?.status === 404) {
        setError('GST number not found in the government registry. Please check the number and try again.');
      } else if (error.response?.status === 400) {
        setError('Invalid GST number format. Please enter a valid 15-digit GST number.');
      } else if (error.response?.status === 401) {
        setError('GST verification service is temporarily unavailable. Please try again later.');
      } else if (error.code === 'ECONNABORTED') {
        setError('Verification request timed out. Please try again.');
      } else {
        setError(error.response?.data?.message || 'Failed to verify GST number. Please try again.');
      }
      
      setValidationMessage('✗ Verification failed');
    } finally {
      setLoading(false);
    }
  }, [gstNumber, onDataFill, onGSTDataFilled, setFormData]);

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      verifyGST();
    }
  };

  // Get status icon
  const getStatusIcon = () => {
    if (loading) return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
    if (verificationStatus === 'verified') return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (verificationStatus === 'failed') return <XCircle className="w-5 h-5 text-red-500" />;
    if (error) return <AlertCircle className="w-5 h-5 text-red-500" />;
    return <Search className="w-5 h-5 text-gray-400" />;
  };

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="gstNumber" className="block text-sm font-medium text-gray-700 mb-2">
          GST Number *
        </label>
        
        <div className="relative">
          <input
            type="text"
            id="gstNumber"
            value={gstNumber}
            onChange={handleGSTChange}
            onKeyPress={handleKeyPress}
            placeholder="Enter 15-digit GST number (e.g., 21AAGCL2673M1ZD)"
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-12 ${
              error ? 'border-red-300' : 
              verificationStatus === 'verified' ? 'border-green-300' : 
              'border-gray-300'
            }`}
            maxLength={15}
            disabled={loading}
          />
          
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {getStatusIcon()}
          </div>
        </div>

        {/* Validation message */}
        {validationMessage && (
          <p className={`mt-1 text-sm ${
            validationMessage.includes('✓') ? 'text-green-600' : 
            validationMessage.includes('✗') ? 'text-red-600' : 
            'text-gray-500'
          }`}>
            {validationMessage}
          </p>
        )}

        {/* Error message */}
        {error && (
          <p className="mt-1 text-sm text-red-600">
            {error}
          </p>
        )}
      </div>

      {/* Verify button */}
      <button
        type="button"
        onClick={verifyGST}
        disabled={!gstNumber || gstNumber.length !== 15 || loading || !validateGSTFormat(gstNumber)}
        className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
          !gstNumber || gstNumber.length !== 15 || loading || !validateGSTFormat(gstNumber)
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500'
        }`}
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Verifying GST...
          </span>
        ) : (
          'Verify GST & Auto-Fill Details'
        )}
      </button>

      {/* Success message */}
      {verificationStatus === 'verified' && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
            <span className="text-green-800 font-medium">GST Verified Successfully!</span>
          </div>
          <p className="text-green-700 text-sm mt-1">
            Business details have been automatically filled from government records.
          </p>
        </div>
      )}
    </div>
  );
};

export default GSTAutoFill;