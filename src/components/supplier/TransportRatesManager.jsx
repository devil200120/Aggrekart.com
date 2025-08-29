import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "react-query";
import { supplierAPI } from "../../services/api";
import toast from "react-hot-toast";
import {
  FaTruck,
  FaRoute,
  FaClock,
  FaRupeeSign,
  FaSave,
  FaSpinner,
  FaInfoCircle,
  FaEdit,
  FaCheck,
  FaTimes,
  FaCalculator,
  FaMapMarkerAlt,
} from "react-icons/fa";
import "./TransportRatesManager.css";

const TransportRatesManager = ({ supplier, onSuccess }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [transportRates, setTransportRates] = useState({
    upTo5km: {
      costPerKm: 0,
      baseCost: 0,
      estimatedDeliveryTime: "2-4 hours",
      maxWeight: 1000,
    },
    upTo10km: {
      costPerKm: 0,
      baseCost: 0,
      estimatedDeliveryTime: "4-6 hours",
      maxWeight: 2000,
    },
    upTo20km: {
      costPerKm: 0,
      baseCost: 0,
      estimatedDeliveryTime: "6-8 hours",
      maxWeight: 3000,
    },
    above20km: {
      costPerKm: 0,
      baseCost: 0,
      estimatedDeliveryTime: "1-2 days",
      maxWeight: 5000,
    },
  });

  const [testDistance, setTestDistance] = useState("");
  const [testWeight, setTestWeight] = useState("");
  const [calculatedCost, setCalculatedCost] = useState(null);
  const [errors, setErrors] = useState({});

  const queryClient = useQueryClient();

  // Debug logging
  console.log("TransportRatesManager - Supplier:", supplier);
  console.log("TransportRatesManager - Transport Rates:", supplier?.transportRates);

  // Initialize transport rates from supplier data
  useEffect(() => {
    if (supplier?.transportRates) {
      console.log("Setting transport rates from supplier:", supplier.transportRates);
      setTransportRates(supplier.transportRates);
    } else {
      console.log("No transport rates found, using defaults");
    }
  }, [supplier]);

  // Update transport rates mutation
  const updateTransportRatesMutation = useMutation(
    (ratesData) => {
      console.log('Sending transport rates data:', ratesData);
      return supplierAPI.updateTransportRates(ratesData);
    },
    {
      onSuccess: (response) => {
        console.log('Transport rates update response:', response);
        toast.success('Transport rates updated successfully!');
        
        // Update the local state with the saved data
        if (response.data?.supplier?.transportRates) {
          setTransportRates(response.data.supplier.transportRates);
        }
        
        // Force a fresh fetch of the profile data
        queryClient.invalidateQueries(['supplier', 'profile']);
        
        setIsEditing(false);
        if (onSuccess) onSuccess(response);
      },
      onError: (error) => {
        console.error('Transport rates update error:', error);
        console.error('Error response:', error?.response?.data);
        const errorMessage = error?.response?.data?.message || 
                           error?.message || 
                           'Failed to update transport rates';
        toast.error(errorMessage);
      }
    }
  );

  const handleZoneChange = (zone, field, value) => {
    setTransportRates(prev => ({
      ...prev,
      [zone]: {
        ...prev[zone],
        [field]: field === 'estimatedDeliveryTime' ? value : parseFloat(value) || 0
      }
    }));

    // Clear errors for this field
    setErrors(prev => ({
      ...prev,
      [`${zone}_${field}`]: null
    }));
  };

  const validateRates = () => {
    const newErrors = {};
    
    Object.keys(transportRates).forEach(zone => {
      const rate = transportRates[zone];
      
      if (!rate || typeof rate !== 'object') {
        newErrors[`${zone}_general`] = 'Invalid rate data';
        return;
      }
      
      if (rate.costPerKm < 0) {
        newErrors[`${zone}_costPerKm`] = 'Cost per km cannot be negative';
      }
      if (rate.baseCost < 0) {
        newErrors[`${zone}_baseCost`] = 'Base cost cannot be negative';
      }
      if (rate.maxWeight <= 0) {
        newErrors[`${zone}_maxWeight`] = 'Max weight must be greater than 0';
      }
      if (!rate.estimatedDeliveryTime || !rate.estimatedDeliveryTime.toString().trim()) {
        newErrors[`${zone}_estimatedDeliveryTime`] = 'Estimated time is required';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateRates()) {
      toast.error('Please fix validation errors before saving');
      return;
    }

    // Ensure all values are properly formatted
    const dataToSend = {
      upTo5km: {
        costPerKm: parseFloat(transportRates.upTo5km.costPerKm) || 0,
        baseCost: parseFloat(transportRates.upTo5km.baseCost) || 0,
        estimatedDeliveryTime: transportRates.upTo5km.estimatedDeliveryTime || '2-4 hours',
        maxWeight: parseInt(transportRates.upTo5km.maxWeight) || 1000
      },
      upTo10km: {
        costPerKm: parseFloat(transportRates.upTo10km.costPerKm) || 0,
        baseCost: parseFloat(transportRates.upTo10km.baseCost) || 0,
        estimatedDeliveryTime: transportRates.upTo10km.estimatedDeliveryTime || '4-6 hours',
        maxWeight: parseInt(transportRates.upTo10km.maxWeight) || 2000
      },
      upTo20km: {
        costPerKm: parseFloat(transportRates.upTo20km.costPerKm) || 0,
        baseCost: parseFloat(transportRates.upTo20km.baseCost) || 0,
        estimatedDeliveryTime: transportRates.upTo20km.estimatedDeliveryTime || '6-8 hours',
        maxWeight: parseInt(transportRates.upTo20km.maxWeight) || 3000
      },
      above20km: {
        costPerKm: parseFloat(transportRates.above20km.costPerKm) || 0,
        baseCost: parseFloat(transportRates.above20km.baseCost) || 0,
        estimatedDeliveryTime: transportRates.above20km.estimatedDeliveryTime || '1-2 days',
        maxWeight: parseInt(transportRates.above20km.maxWeight) || 5000
      }
    };

    console.log('Formatted data for save:', dataToSend);
    updateTransportRatesMutation.mutate(dataToSend);
  };

  const calculateTestCost = () => {
    const distance = parseFloat(testDistance);
    const weight = parseFloat(testWeight);

    if (!distance || !weight) {
      toast.error('Please enter valid distance and weight');
      return;
    }

    let zone, rates;
    
    if (distance <= 5) {
      zone = 'upTo5km';
      rates = transportRates.upTo5km;
    } else if (distance <= 10) {
      zone = 'upTo10km';
      rates = transportRates.upTo10km;
    } else if (distance <= 20) {
      zone = 'upTo20km';
      rates = transportRates.upTo20km;
    } else {
      zone = 'above20km';
      rates = transportRates.above20km;
    }

    if (weight > rates.maxWeight) {
      toast.error(`Weight exceeds maximum limit of ${rates.maxWeight}kg for this zone`);
      return;
    }

    const cost = rates.baseCost + (distance * rates.costPerKm);
    setCalculatedCost({
      zone,
      zoneName: getZoneName(zone),
      distance,
      weight,
      cost,
      estimatedTime: rates.estimatedDeliveryTime
    });
  };

  const getZoneName = (zone) => {
    const zoneNames = {
      upTo5km: '0-5 km',
      upTo10km: '5-10 km',
      upTo20km: '10-20 km',
      above20km: '20+ km'
    };
    return zoneNames[zone];
  };

  const getZoneColor = (zone) => {
    const colors = {
      upTo5km: '#22c55e',
      upTo10km: '#3b82f6',
      upTo20km: '#f59e0b',
      above20km: '#ef4444'
    };
    return colors[zone];
  };

  const resetToOriginal = () => {
    setIsEditing(false);
    setErrors({});
    if (supplier?.transportRates) {
      setTransportRates(supplier.transportRates);
    } else {
      setTransportRates({
        upTo5km: {
          costPerKm: 0,
          baseCost: 0,
          estimatedDeliveryTime: "2-4 hours",
          maxWeight: 1000,
        },
        upTo10km: {
          costPerKm: 0,
          baseCost: 0,
          estimatedDeliveryTime: "4-6 hours",
          maxWeight: 2000,
        },
        upTo20km: {
          costPerKm: 0,
          baseCost: 0,
          estimatedDeliveryTime: "6-8 hours",
          maxWeight: 3000,
        },
        above20km: {
          costPerKm: 0,
          baseCost: 0,
          estimatedDeliveryTime: "1-2 days",
          maxWeight: 5000,
        },
      });
    }
  };

  return (
    <div className="transport-rates-manager">
      {/* Debug info */}
      {/* <div style={{ 
        background: '#fff3cd', 
        padding: '8px 12px', 
        margin: '0 0 16px 0',
        borderRadius: '4px',
        fontSize: '12px',
        color: '#856404',
        border: '1px solid #ffeaa7'
      }}>
        <strong>Component Debug:</strong> 
        Supplier loaded: {supplier ? 'Yes' : 'No'} | 
        Has transport rates: {supplier?.transportRates ? 'Yes' : 'No'} | 
        Company: {supplier?.companyName || 'Unknown'} | 
        Is Editing: {isEditing ? 'Yes' : 'No'}
      </div> */}

      <div className="transport-rates-header">
        <div className="header-info">
          <FaTruck className="header-icon" />
          <div>
            <h3>Transport & Delivery Rates</h3>
            <p>Configure your delivery pricing for different distance zones</p>
          </div>
        </div>
        
        <div className="header-actions">
          {!isEditing ? (
            <button
              className="btn btn-edit"
              onClick={() => setIsEditing(true)}
            >
              <FaEdit />
              Edit Rates
            </button>
          ) : (
            <div className="edit-actions">
              <button
                className="btn btn-save"
                onClick={handleSave}
                disabled={updateTransportRatesMutation.isLoading}
              >
                {updateTransportRatesMutation.isLoading ? (
                  <FaSpinner className="animate-spin" />
                ) : (
                  <FaSave />
                )}
                {updateTransportRatesMutation.isLoading ? 'Saving...' : 'Save'}
              </button>
              <button
                className="btn btn-cancel"
                onClick={resetToOriginal}
              >
                <FaTimes />
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="transport-rates-grid">
        {Object.entries(transportRates).map(([zone, rates]) => (
          <div 
            key={zone} 
            className="transport-zone-card"
            style={{ borderTopColor: getZoneColor(zone) }}
          >
            <div className="zone-header">
              <FaRoute style={{ color: getZoneColor(zone) }} />
              <h4>{getZoneName(zone)}</h4>
            </div>

            <div className="zone-fields">
              <div className="field-group">
                <label>
                  <FaRupeeSign />
                  Base Cost (₹)
                </label>
                <input
                  type="number"
                  value={rates?.baseCost || 0}
                  onChange={(e) => handleZoneChange(zone, 'baseCost', e.target.value)}
                  disabled={!isEditing}
                  className={errors[`${zone}_baseCost`] ? 'error' : ''}
                  min="0"
                  step="0.01"
                  placeholder="0"
                />
                {errors[`${zone}_baseCost`] && (
                  <span className="error-text">{errors[`${zone}_baseCost`]}</span>
                )}
              </div>

              <div className="field-group">
                <label>
                  <FaCalculator />
                  Cost per KM (₹)
                </label>
                <input
                  type="number"
                  value={rates?.costPerKm || 0}
                  onChange={(e) => handleZoneChange(zone, 'costPerKm', e.target.value)}
                  disabled={!isEditing}
                  className={errors[`${zone}_costPerKm`] ? 'error' : ''}
                  min="0"
                  step="0.01"
                  placeholder="0"
                />
                {errors[`${zone}_costPerKm`] && (
                  <span className="error-text">{errors[`${zone}_costPerKm`]}</span>
                )}
              </div>

              <div className="field-group">
                <label>
                  <FaClock />
                  Estimated Time
                </label>
                <input
                  type="text"
                  value={rates?.estimatedDeliveryTime || ''}
                  onChange={(e) => handleZoneChange(zone, 'estimatedDeliveryTime', e.target.value)}
                  disabled={!isEditing}
                  className={errors[`${zone}_estimatedDeliveryTime`] ? 'error' : ''}
                  placeholder="e.g., 2-4 hours"
                />
                {errors[`${zone}_estimatedDeliveryTime`] && (
                  <span className="error-text">{errors[`${zone}_estimatedDeliveryTime`]}</span>
                )}
              </div>

              <div className="field-group">
                <label>
                  <FaTruck />
                  Max Weight (kg)
                </label>
                <input
                  type="number"
                  value={rates?.maxWeight || 0}
                  onChange={(e) => handleZoneChange(zone, 'maxWeight', e.target.value)}
                  disabled={!isEditing}
                  className={errors[`${zone}_maxWeight`] ? 'error' : ''}
                  min="1"
                  placeholder="1000"
                />
                {errors[`${zone}_maxWeight`] && (
                  <span className="error-text">{errors[`${zone}_maxWeight`]}</span>
                )}
              </div>
            </div>

            <div className="zone-summary">
              <p>
                <strong>Formula:</strong> ₹{rates?.baseCost || 0} + (Distance × ₹{rates?.costPerKm || 0}/km)
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Cost Calculator */}
      <div className="cost-calculator-section">
        <h4>
          <FaCalculator />
          Delivery Cost Calculator
        </h4>
        <p>Test your transport rates with different distances and weights</p>

        <div className="calculator-inputs">
          <div className="calc-input-group">
            <label>Distance (km)</label>
            <input
              type="number"
              value={testDistance}
              onChange={(e) => setTestDistance(e.target.value)}
              placeholder="Enter distance"
              min="0"
              step="0.1"
            />
          </div>

          <div className="calc-input-group">
            <label>Weight (kg)</label>
            <input
              type="number"
              value={testWeight}
              onChange={(e) => setTestWeight(e.target.value)}
              placeholder="Enter weight"
              min="0"
              step="0.1"
            />
          </div>

          <button
            className="btn btn-calculate"
            onClick={calculateTestCost}
          >
            <FaCalculator />
            Calculate
          </button>
        </div>

        {calculatedCost && (
          <div className="calculation-result">
            <div className="result-header">
              <FaCheck className="success-icon" />
              <h5>Delivery Cost Calculation</h5>
            </div>
            <div className="result-details">
              <div className="result-item">
                <span>Zone:</span>
                <span className="zone-badge" style={{ backgroundColor: getZoneColor(calculatedCost.zone) }}>
                  {calculatedCost.zoneName}
                </span>
              </div>
              <div className="result-item">
                <span>Distance:</span>
                <span>{calculatedCost.distance} km</span>
              </div>
              <div className="result-item">
                <span>Weight:</span>
                <span>{calculatedCost.weight} kg</span>
              </div>
              <div className="result-item">
                <span>Estimated Time:</span>
                <span>{calculatedCost.estimatedTime}</span>
              </div>
              <div className="result-item total-cost">
                <span>Total Cost:</span>
                <span>₹{calculatedCost.cost.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Help & Tips */}
      <div className="transport-rates-help">
        <div className="help-header">
          <FaInfoCircle />
          <h4>Tips for Setting Transport Rates</h4>
        </div>
        <ul>
          <li>Set competitive base costs to attract nearby customers</li>
          <li>Consider fuel prices and vehicle maintenance in your per-km rates</li>
          <li>Be realistic with delivery time estimates</li>
          <li>Set appropriate weight limits based on your vehicle capacity</li>
          <li>Review and update rates regularly based on market conditions</li>
        </ul>
      </div>

      {/* Show loading state during updates */}
      {updateTransportRatesMutation.isLoading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <FaSpinner className="animate-spin" />
            <p>Saving transport rates...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransportRatesManager;