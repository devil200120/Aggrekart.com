import React, { useState, useEffect } from 'react';
import { suppliersAPI } from '../../services/api'; // Changed from supplierAPI to suppliersAPI
import './GSTAutoFill.css'

const GSTAutoFill = ({ 
  onDataFilled, 
  initialGST = '', 
  formData = {}, 
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
    const limited = cleaned.substring(0, 15);
    
    if (limited.length <= 2) return limited;
    if (limited.length <= 7) return `${limited.substring(0, 2)}${limited.substring(2)}`;
    if (limited.length <= 11) return `${limited.substring(0, 2)}${limited.substring(2, 7)}${limited.substring(7)}`;
    if (limited.length <= 12) return `${limited.substring(0, 2)}${limited.substring(2, 7)}${limited.substring(7, 11)}${limited.substring(11)}`;
    return limited;
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
    
    if (verificationStatus) {
      setVerificationStatus(null);
      setAutoFillData(null);
      setShowPreview(false);
      setValidationIssues([]);
    }
  };

  // Verify GST number
  const verifyGST = async () => {
    const cleanedGST = gstNumber.replace(/[^A-Z0-9]/g, '');
    
    if (!isValidGSTFormat(cleanedGST)) {
      setVerificationStatus({
        success: false,
        message: 'Invalid GST number format'
      });
      return;
    }

    setIsVerifying(true);
    setVerificationStatus(null);

    try {
      console.log('🔍 Verifying GST:', cleanedGST);
      
      // Use suppliersAPI instead of supplierAPI
      const response = await suppliersAPI.verifyGST({
        gstNumber: cleanedGST
      });

      console.log('✅ GST Verification Response:', response);

      if (response.success) {
        setVerificationStatus({
          success: true,
          message: response.message || 'GST verified successfully'
        });
        setAutoFillData(response.data);
        setShowPreview(true);
        
        if (Object.keys(formData).length > 0) {
          validateConsistency(response.data, formData);
        }
      } else {
        setVerificationStatus({
          success: false,
          message: response.message || 'GST verification failed'
        });
      }
    } catch (error) {
      console.error('❌ GST Verification Error:', error);
      
      let errorMessage = 'Failed to verify GST number';
      let isRegistered = false;

      if (error.response) {
        errorMessage = error.response.data?.message || errorMessage;
        isRegistered = error.response.data?.isRegistered || false;
        
        console.error('Server Error:', {
          status: error.response.status,
          data: error.response.data
        });
      } else if (error.request) {
        console.error('Network Error:', error.request);
        errorMessage = 'Network error. Please check your connection and try again.';
      } else {
        console.error('Error:', error.message);
        errorMessage = error.message;
      }

      setVerificationStatus({
        success: false,
        message: errorMessage,
        isRegistered
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // Validate consistency between GST data and form data
  const validateConsistency = (gstData, currentFormData) => {
    const issues = [];
    
    if (gstData.state && currentFormData.state && 
        gstData.state.toLowerCase() !== currentFormData.state.toLowerCase()) {
      issues.push({
        field: 'state',
        type: 'warning',
        message: `GST records show state as "${gstData.state}" but form shows "${currentFormData.state}"`
      });
    }
    
    if (gstData.pincode && currentFormData.pincode && 
        gstData.pincode !== currentFormData.pincode) {
      issues.push({
        field: 'pincode',
        type: 'warning',
        message: `GST records show pincode as "${gstData.pincode}" but form shows "${currentFormData.pincode}"`
      });
    }
    
    if (gstData.companyName && currentFormData.businessName) {
      const gstName = gstData.companyName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const formName = currentFormData.businessName.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      if (!gstName.includes(formName) && !formName.includes(gstName)) {
        issues.push({
          field: 'businessName',
          type: 'error',
          message: `Business name doesn't match GST records. GST: "${gstData.companyName}"`
        });
      }
    }
    
    setValidationIssues(issues);
    onValidationChange(issues);
  };

  // Apply auto-fill data
  const applyAutoFill = () => {
    if (autoFillData && onDataFilled) {
      const fillData = {
        gstNumber: autoFillData.gstNumber,
        businessName: autoFillData.companyName || autoFillData.businessName,
        businessAddress: autoFillData.businessAddress,
        city: autoFillData.city,
        state: autoFillData.state,
        pincode: autoFillData.pincode,
        contactPersonName: autoFillData.suggestions?.contactPersonName || '',
        email: autoFillData.suggestions?.email || '',
        accountHolderName: autoFillData.suggestions?.accountHolderName || ''
      };
      
      console.log('🔄 Applying auto-fill data:', fillData);
      onDataFilled(fillData);
      setShowPreview(false);
    }
  };

  // Auto-verify when GST number is complete
  useEffect(() => {
    const cleanedGST = gstNumber.replace(/[^A-Z0-9]/g, '');
    if (cleanedGST.length === 15 && isValidGSTFormat(cleanedGST)) {
      const timer = setTimeout(() => {
        verifyGST();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [gstNumber]);

  return (
    <div className="gst-auto-fill mb-3">
      <div className="form-group">
        <label htmlFor="gstNumber" className="form-label required">
          <i className="fas fa-file-invoice me-2"></i>
          GST Number
        </label>
        <div className="input-group">
          <input
            type="text"
            id="gstNumber"
            className={`form-control ${verificationStatus?.success === false ? 'is-invalid' : 
                      verificationStatus?.success === true ? 'is-valid' : ''}`}
            value={gstNumber}
            onChange={handleGSTChange}
            placeholder="00XXXXX0000X0X0X0"
            maxLength={15}
          />
          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={verifyGST}
            disabled={isVerifying || !isValidGSTFormat(gstNumber.replace(/[^A-Z0-9]/g, ''))}
          >
            {isVerifying ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Verifying...
              </>
            ) : (
              <>
                <i className="fas fa-search me-2"></i>
                Verify GST
              </>
            )}
          </button>
        </div>
        
        {/* Verification Status */}
        {verificationStatus && (
          <div className={`mt-2 alert ${verificationStatus.success ? 'alert-success' : 'alert-danger'} py-2`}>
            <i className={`fas ${verificationStatus.success ? 'fa-check-circle' : 'fa-exclamation-circle'} me-2`} />
            {verificationStatus.message}
            {verificationStatus.isRegistered && (
              <div className="mt-1">
                <small>This GST number is already registered with another supplier account.</small>
              </div>
            )}
          </div>
        )}

        {/* Validation Issues */}
        {validationIssues.length > 0 && (
          <div className="mt-2">
            {validationIssues.map((issue, index) => (
              <div
                key={index}
                className={`alert ${issue.type === 'error' ? 'alert-danger' : 'alert-warning'} py-2`}
              >
                <i className={`fas ${issue.type === 'error' ? 'fa-exclamation-triangle' : 'fa-info-circle'} me-2`} />
                <small>{issue.message}</small>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Auto-fill Preview */}
      {showPreview && autoFillData && (
        <div className="auto-fill-preview mt-3">
          <div className="card border-primary">
            <div className="card-header bg-primary text-white">
              <h6 className="mb-0">
                <i className="fas fa-magic me-2" />
                Auto-fill Business Details
              </h6>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <h6 className="text-primary">Company Information</h6>
                  <ul className="list-unstyled">
                    <li><strong>Legal Name:</strong> {autoFillData.companyName || autoFillData.businessName}</li>
                    {autoFillData.tradeName && (
                      <li><strong>Trade Name:</strong> {autoFillData.tradeName}</li>
                    )}
                    <li><strong>GST Status:</strong> 
                      <span className={`badge ms-2 ${autoFillData.gstStatus === 'Active' ? 'bg-success' : 'bg-warning'}`}>
                        {autoFillData.gstStatus || 'Active'}
                      </span>
                    </li>
                    {autoFillData.taxpayerType && (
                      <li><strong>Taxpayer Type:</strong> {autoFillData.taxpayerType}</li>
                    )}
                  </ul>
                </div>
                <div className="col-md-6">
                  <h6 className="text-primary">Address Information</h6>
                  <ul className="list-unstyled">
                    <li><strong>Address:</strong> {autoFillData.businessAddress}</li>
                    <li><strong>City:</strong> {autoFillData.city}</li>
                    <li><strong>State:</strong> {autoFillData.state}</li>
                    <li><strong>Pincode:</strong> {autoFillData.pincode}</li>
                  </ul>
                </div>
              </div>
              
              {autoFillData.suggestions && (
                <div className="mt-3">
                  <h6 className="text-primary">Suggested Contact Details</h6>
                  <div className="row">
                    <div className="col-md-4">
                      <small className="text-muted">Contact Person</small>
                      <div className="fw-bold">{autoFillData.suggestions.contactPersonName || 'Not available'}</div>
                    </div>
                    <div className="col-md-4">
                      <small className="text-muted">Email</small>
                      <div className="fw-bold">{autoFillData.suggestions.email || 'Not available'}</div>
                    </div>
                    <div className="col-md-4">
                      <small className="text-muted">Account Holder</small>
                      <div className="fw-bold">{autoFillData.suggestions.accountHolderName || 'Not available'}</div>
                    </div>
                  </div>
                </div>
              )}
              
              {autoFillData.registrationDate && (
                <div className="mt-3">
                  <h6 className="text-primary">Registration Information</h6>
                  <p><strong>Registration Date:</strong> {new Date(autoFillData.registrationDate).toLocaleDateString()}</p>
                </div>
              )}
              
              <div className="mt-3 d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={applyAutoFill}
                >
                  <i className="fas fa-check me-2" />
                  Use These Details
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowPreview(false)}
                >
                  <i className="fas fa-times me-2" />
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GSTAutoFill;