import React, { useState, useEffect } from "react";
import {
  FaLocationArrow,
  FaMapMarkerAlt,
  FaClock,
  FaSync,
  FaExclamationTriangle,
} from "react-icons/fa";
import useGoogleMapsLocation from "../../hooks/useGoogleMapsLocation";
import useDynamicDistance from "../../hooks/useDynamicDistance";
import "./GoogleMapsLocationDetector.css";

const GoogleMapsLocationDetector = ({
  onLocationChange,
  showDeliveryInfo = true,
  suppliers = [],
  className = "",
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const {
    currentLocation,
    isGoogleMapsLoaded,
    getCurrentLocation,
    startWatchingLocation,
    isLocationAvailable,
  } = useGoogleMapsLocation();

  const {
    getDeliveryStats,
    getSortedSuppliersByDistance,
    refreshDistances,
    isCalculating,
  } = useDynamicDistance(suppliers, true);

  const deliveryStats = getDeliveryStats();
  const nearestSuppliers = getSortedSuppliersByDistance().slice(0, 3);

  // Notify parent of location changes
  useEffect(() => {
    if (currentLocation.coordinates && onLocationChange) {
      onLocationChange({
        coordinates: currentLocation.coordinates,
        address: currentLocation.address,
        city: currentLocation.city,
        state: currentLocation.state,
      });
    }
  }, [currentLocation, onLocationChange]);

  const handleLocationRequest = () => {
    getCurrentLocation();
    startWatchingLocation();
  };

  const handleRefresh = () => {
    getCurrentLocation();
    refreshDistances(true);
  };

  const formatLocationText = () => {
    if (currentLocation.city && currentLocation.state) {
      return `${currentLocation.city}, ${currentLocation.state}`;
    } else if (currentLocation.address) {
      return currentLocation.address.split(",").slice(0, 2).join(",");
    }
    return "Unknown location";
  };

  const getLoadingStatus = () => {
    if (!isGoogleMapsLoaded) return "Loading Maps...";
    if (currentLocation.isLoading) return "Detecting location...";
    if (isCalculating) return "Calculating distances...";
    return null;
  };

  return (
    <div className={`location-detector ${className}`}>
      {/* Location Status Bar */}
      <div className="location-status-bar">
        {!isLocationAvailable ? (
          <button
            className="location-request-btn"
            onClick={handleLocationRequest}
            disabled={currentLocation.isLoading || !isGoogleMapsLoaded}
          >
            <FaLocationArrow
              className={currentLocation.isLoading ? "spinning" : ""}
            />
            {getLoadingStatus() ||
              (isGoogleMapsLoaded ? "Detect Location" : "Loading Maps...")}
          </button>
        ) : (
          <div className="location-display">
            <div className="location-info">
              <FaMapMarkerAlt className="location-icon" />
              <div className="location-text">
                <span className="location-primary">{formatLocationText()}</span>
                {deliveryStats && !isCalculating && (
                  <span className="delivery-quick-info">
                    Nearest delivery: {deliveryStats.nearestDistance.toFixed(1)}
                    km
                  </span>
                )}
                {isCalculating && (
                  <span className="delivery-quick-info">
                    Calculating distances...
                  </span>
                )}
              </div>
            </div>

            <div className="location-actions">
              <button
                className="refresh-btn"
                onClick={handleRefresh}
                title="Refresh location & distances"
                disabled={isCalculating}
              >
                <FaSync className={isCalculating ? "spinning" : ""} />
              </button>

              {showDeliveryInfo && deliveryStats && (
                <button
                  className="expand-btn"
                  onClick={() => setIsExpanded(!isExpanded)}
                  title="View delivery details"
                >
                  <FaClock />
                  {deliveryStats.sameDayAvailable > 0 && (
                    <span className="quick-delivery-badge">
                      {deliveryStats.sameDayAvailable}
                    </span>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {currentLocation.error && (
        <div className="location-error">
          <FaExclamationTriangle />
          <span>{currentLocation.error}</span>
          <button onClick={handleLocationRequest} className="retry-btn">
            Retry
          </button>
        </div>
      )}

      {/* Expanded Delivery Information */}
      {isExpanded && isLocationAvailable && deliveryStats && (
        <div className="delivery-details">
          <div className="delivery-stats">
            <div className="stat-item">
              <span className="stat-label">Nearest supplier:</span>
              <span className="stat-value">
                {deliveryStats.nearestDistance.toFixed(1)} km
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Average distance:</span>
              <span className="stat-value">
                {deliveryStats.averageDistance.toFixed(1)} km
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Same day available:</span>
              <span className="stat-value same-day">
                {deliveryStats.sameDayAvailable} suppliers
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Next day available:</span>
              <span className="stat-value next-day">
                {deliveryStats.nextDayAvailable} suppliers
              </span>
            </div>
          </div>

          {nearestSuppliers.length > 0 && (
            <div className="nearest-suppliers">
              <h4>Nearest Suppliers:</h4>
              <div className="supplier-list">
                {nearestSuppliers.map((supplier) => {
                  const distance =
                    supplier.distance || supplier.fallbackDistance?.distance;
                  const deliveryTime =
                    supplier.deliveryTime ||
                    supplier.fallbackDistance?.deliveryTime;

                  return (
                    <div key={supplier.supplierId} className="supplier-item">
                      <div className="supplier-info">
                        <span className="supplier-name">
                          {supplier.supplierName}
                        </span>
                        {supplier.isFallback && (
                          <span className="fallback-indicator">Estimated</span>
                        )}
                      </div>
                      <div className="supplier-delivery">
                        <span className="distance">
                          {distance?.text || "N/A"}
                        </span>
                        <span
                          className={`delivery-time ${deliveryTime?.hours <= 4 ? "same-day" : "next-day"}`}
                        >
                          {deliveryTime?.text || "N/A"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Google Maps Status */}
      {isLocationAvailable && (
        <div className="location-accuracy">
          <small>
            📍 Location: {currentLocation.address ? "Accurate" : "Approximate"}
            {deliveryStats && <> • {deliveryStats.total} suppliers in range</>}
            {nearestSuppliers.filter((s) => s.hasTrafficData).length > 0 && (
              <>
                {" "}
                • {nearestSuppliers.filter((s) => s.hasTrafficData).length} with
                live traffic
              </>
            )}
          </small>
        </div>
      )}
    </div>
  );
};

export default GoogleMapsLocationDetector;
