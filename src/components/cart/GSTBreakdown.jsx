import React, { useState, useEffect } from 'react';
import { cartAPI } from '../../services/api';

const GSTBreakdown = ({ customerState, items, onGSTUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [gstData, setGstData] = useState(null);

  useEffect(() => {
    const fetchGSTBreakdown = async () => {
      if (!customerState || !items || !Array.isArray(items) || items.length === 0) {
        console.log('❌ GST Breakdown: Missing required data', {
          customerState,
          itemsLength: items?.length || 0
        });
        setError('Missing required data for GST calculation');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        console.log('🔄 Fetching GST breakdown for state:', customerState);
        const response = await cartAPI.getGSTBreakdown(customerState);
        
        console.log('📥 GST API Response:', response);
        
        // FIX: Correct the data access path
        if (response && response.data) {
          const gstBreakdownData = response.data; // Direct access to data // Access data.data instead of just data
          
          console.log('📊 GST Breakdown Data:', gstBreakdownData);
          
          setGstData(gstBreakdownData);
          
          // Call the update callback with the GST data
          if (onGSTUpdate && typeof onGSTUpdate === 'function') {
            onGSTUpdate(gstBreakdownData);
          }
        } else {
          console.error('❌ Invalid API response structure:', response);
          setError('Invalid response from GST calculation service');
        }
      } catch (err) {
        console.error('❌ Error fetching GST breakdown:', err);
        setError(err.message || 'Failed to calculate GST breakdown');
      } finally {
        setLoading(false);
      }
    };

    fetchGSTBreakdown();
  },  [customerState, items]);

  // Loading state
  if (loading) {
    return (
      <div className="gst-breakdown loading">
        <div className="loading-spinner"></div>
        <p>Calculating GST breakdown...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="gst-breakdown error">
        <div className="error-message">
          <h4>❌ GST Calculation Failed</h4>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  // No data state
  if (!gstData || !gstData.gstBreakdown || gstData.gstBreakdown.length === 0) {
    return (
      <div className="gst-breakdown no-data">
        <p>No GST calculation available</p>
      </div>
    );
  }

  // Render GST breakdown
  return (
    <div className="gst-breakdown">
      <h4>📊 GST Breakdown by Supplier</h4>
      
      {gstData.gstBreakdown.map((supplier, index) => (
        <div key={supplier.supplierId || index} className="supplier-gst-section">
          <h5>{supplier.supplierName}</h5>
          <div className="gst-details">
            <div className="gst-row">
              <span>Supplier State:</span>
              <span>{supplier.supplierState}</span>
            </div>
            <div className="gst-row">
              <span>Customer State:</span>
              <span>{supplier.customerState}</span>
            </div>
            <div className="gst-row">
              <span>Subtotal:</span>
              <span>₹{supplier.subtotal?.toLocaleString()}</span>
            </div>
            
            {/* CGST */}
            {supplier.cgst && (
              <div className="gst-row">
                <span>CGST ({supplier.cgst.rate}%):</span>
                <span>₹{supplier.cgst.amount?.toLocaleString()}</span>
              </div>
            )}
            
            {/* SGST */}
            {supplier.sgst && (
              <div className="gst-row">
                <span>SGST ({supplier.sgst.rate}%):</span>
                <span>₹{supplier.sgst.amount?.toLocaleString()}</span>
              </div>
            )}
            
            {/* IGST */}
            {supplier.igst && (
              <div className="gst-row">
                <span>IGST ({supplier.igst.rate}%):</span>
                <span>₹{supplier.igst.amount?.toLocaleString()}</span>
              </div>
            )}
            
            <div className="gst-row total">
              <span><strong>Total GST:</strong></span>
              <span><strong>₹{supplier.totalGstAmount?.toLocaleString()}</strong></span>
            </div>
          </div>
        </div>
      ))}
      
      {/* Overall Summary */}
      {gstData.summary && (
        <div className="gst-summary">
          <h5>📋 GST Summary</h5>
          <div className="summary-details">
            <div className="gst-row">
              <span>Total CGST:</span>
              <span>₹{gstData.summary.totalCGST?.toLocaleString()}</span>
            </div>
            <div className="gst-row">
              <span>Total SGST:</span>
              <span>₹{gstData.summary.totalSGST?.toLocaleString()}</span>
            </div>
            <div className="gst-row">
              <span>Total IGST:</span>
              <span>₹{gstData.summary.totalIGST?.toLocaleString()}</span>
            </div>
            <div className="gst-row total">
              <span><strong>Grand Total GST:</strong></span>
              <span><strong>₹{gstData.totalGSTAmount?.toLocaleString()}</strong></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GSTBreakdown;