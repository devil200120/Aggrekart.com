// Replace your TransportRatesPage.jsx with this corrected version:
import React from 'react';
import { useQuery } from 'react-query';
import { supplierAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import TransportRatesManager from '../../components/supplier/TransportRatesManager';
import { FaTruck, FaArrowLeft, FaSpinner } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import './TransportRatesPage.css';

const TransportRatesPage = () => {
  const { user } = useAuth();

  // Fetch supplier profile data
  const {
    data: profileResponse,
    isLoading,
    error,
    refetch
  } = useQuery(
    ['supplier', 'profile'],
    () => supplierAPI.getProfile(),
    {
      enabled: !!user,
      retry: 1,
      staleTime: 0,
      cacheTime: 0,
      onError: (err) => {
        console.error('Profile fetch error:', err);
      },
      onSuccess: (data) => {
        console.log('Profile API Response:', data);
        console.log('Supplier data:', data?.data?.supplier);
      }
    }
  );

  // Extract supplier from the correct data structure
  const supplier = profileResponse?.data?.supplier;

  // Debug logging
  console.log('TransportRatesPage - User:', user);
  console.log('TransportRatesPage - Loading:', isLoading);
  console.log('TransportRatesPage - Error:', error);
  console.log('TransportRatesPage - Full Response:', profileResponse);
  console.log('TransportRatesPage - Supplier:', supplier);

  if (isLoading) {
    return (
      <div className="transport-rates-page">
        <div className="transport-rates-loading-page">
          <FaSpinner className="animate-spin" />
          <p>Loading transport rates...</p>
          <p style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>
            Debug: User logged in: {user ? 'Yes' : 'No'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="transport-rates-page">
        <div className="transport-rates-error-page">
          <p>Failed to load supplier profile</p>
          <p style={{ fontSize: '14px', color: '#666' }}>
            Error: {error?.message || 'Unknown error'}
          </p>
          <button onClick={() => refetch()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="transport-rates-page">
      {/* Page Header */}
      <div className="trans-page-header">
        <div className="header-navigation">
          <Link to="/supplier/profile" className="back-link">
            <FaArrowLeft />
            Back to Profile
          </Link>
        </div>
        
        <div className="trans-header-content">
          <div className="trans-header-icon">
            <FaTruck />
          </div>
          <div className="header-text">
            <h1>Transport & Delivery Rates</h1>
            <p>Configure your delivery pricing for different distance zones</p>
          </div>
        </div>
      </div>

      {/* Debug Info */}
      <div style={{ 
        background: '#f3f4f6', 
        padding: '12px', 
        margin: '16px 0', 
        borderRadius: '6px',
        fontSize: '12px',
        color: '#666'
      }}>
        <strong>Debug Info:</strong><br />
        User: {user?.email || 'Not logged in'}<br />
        Profile loaded: {profileResponse ? 'Yes' : 'No'}<br />
        Supplier data: {supplier ? 'Available' : 'Missing'}<br />
        Transport rates: {supplier?.transportRates ? 'Available' : 'Missing'}<br />
        Supplier ID: {supplier?._id || 'N/A'}
      </div>

      {/* Transport Rates Manager */}
      <div className="page-content">
        <TransportRatesManager 
          supplier={supplier || { transportRates: null }}
          onSuccess={() => {
            console.log('Transport rates updated successfully');
            refetch();
          }}
        />
      </div>

      {/* Additional Information */}
      <div className="transport-info-cards">
        <div className="info-card">
          <h3>Benefits of Setting Transport Rates</h3>
          <ul>
            <li>Customers see accurate delivery costs upfront</li>
            <li>Reduced cart abandonment due to transparent pricing</li>
            <li>Better order management with distance-based zones</li>
            <li>Competitive advantage with optimized delivery pricing</li>
          </ul>
        </div>

        <div className="info-card">
          <h3>How Distance Zones Work</h3>
          <div className="zone-explanations">
            <div className="zone-item">
              <span className="zone-badge green">0-5 km</span>
              <span>Local deliveries - Same day delivery possible</span>
            </div>
            <div className="zone-item">
              <span className="zone-badge blue">5-10 km</span>
              <span>Near city deliveries - Next day delivery</span>
            </div>
            <div className="zone-item">
              <span className="zone-badge amber">10-20 km</span>
              <span>Extended area - 1-2 days delivery</span>
            </div>
            <div className="zone-item">
              <span className="zone-badge red">20+ km</span>
              <span>Long distance - 2+ days delivery</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransportRatesPage;