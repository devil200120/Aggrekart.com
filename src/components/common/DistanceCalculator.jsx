import React, { useState, useEffect } from "react";
import {
  MapPin,
  Truck,
  Clock,
  Calculator,
  Target,
  AlertCircle,
} from "lucide-react";
import { useDistancePricing } from "../../hooks/useDistancePricing";

const DistanceCalculator = ({
  supplierLocation,
  totalWeight = 1,
  onCalculated,
  showDetailed = false,
}) => {
  const [customerLocation, setCustomerLocation] = useState(null);
  const [distanceInfo, setDistanceInfo] = useState(null);
  const [showLocationPrompt, setShowLocationPrompt] = useState(true);

  const {
    loading,
    error,
    userLocation,
    getCurrentLocation,
    calculateDistance,
    clearError,
  } = useDistancePricing();

  // Auto-calculate when locations are available
  useEffect(() => {
    if (supplierLocation && customerLocation && !distanceInfo) {
      handleCalculateDistance();
    }
  }, [supplierLocation, customerLocation]);

  // Use user location when available
  useEffect(() => {
    if (userLocation && !customerLocation) {
      setCustomerLocation(userLocation);
      setShowLocationPrompt(false);
    }
  }, [userLocation, customerLocation]);

  const handleGetLocation = async () => {
    try {
      const location = await getCurrentLocation();
      setCustomerLocation(location);
      setShowLocationPrompt(false);
    } catch (error) {
      console.error("Failed to get location:", error);
    }
  };

  const handleCalculateDistance = async () => {
    if (!supplierLocation || !customerLocation) return;

    try {
      console.log("Starting distance calculation...", {
        supplierLocation,
        customerLocation,
        totalWeight,
      });

      const result = await calculateDistance(
        supplierLocation,
        customerLocation,
        totalWeight
      );

      console.log("Distance calculation result:", result);

      // Handle the result properly
      if (result && (result.distance || result.pricing)) {
        setDistanceInfo(result);

        if (onCalculated) {
          onCalculated(result);
        }
      } else {
        console.error("Invalid response structure:", result);
        setDistanceInfo(null);
      }
    } catch (error) {
      console.error("Distance calculation failed:", error);
      setDistanceInfo(null);
    }
  };

  const formatDeliveryTime = (estimate) => {
    if (!estimate) return "N/A";
    if (estimate.min === estimate.max) {
      return `${estimate.min} hour${estimate.min > 1 ? "s" : ""}`;
    }
    return `${estimate.min}-${estimate.max} hours`;
  };

  return (
    <div className="distance-calculator bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Calculator className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-800">
          Delivery Calculator
        </h3>
      </div>

      {/* Location Prompt */}
      {showLocationPrompt && !customerLocation && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-blue-800 mb-2">
                Get accurate delivery estimates by sharing your location
              </p>
              <button
                onClick={handleGetLocation}
                disabled={loading}
                className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Getting Location..." : "Use My Location"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-800">{error}</p>
              <button
                onClick={clearError}
                className="text-sm text-red-600 hover:text-red-700 mt-1"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Distance Information */}
      {distanceInfo && (
        <div className="space-y-4">
          {/* Quick Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  Distance
                </span>
              </div>
              <p className="text-lg font-bold text-green-900">
                {distanceInfo.distance?.value || "N/A"} km
              </p>
              <p className="text-xs text-green-700">
                {distanceInfo.distance?.source === "google"
                  ? "GPS Route"
                  : "Direct Distance"}
              </p>
            </div>

            <div className="bg-blue-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Truck className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  Delivery Cost
                </span>
              </div>
              <p className="text-lg font-bold text-blue-900">
                ₹{distanceInfo.pricing?.transportCost || 0}
              </p>
              <p className="text-xs text-blue-700">
                Zone: {distanceInfo.pricing?.zone || "N/A"}
              </p>
            </div>
          </div>

          {/* Delivery Time */}
          <div className="bg-orange-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-800">
                Estimated Delivery
              </span>
            </div>
            <p className="text-base font-semibold text-orange-900">
              {formatDeliveryTime(distanceInfo.delivery?.estimatedHours)}
            </p>
          </div>

          {/* Detailed Information */}
          {showDetailed && (
            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-sm font-medium text-gray-800 mb-3">
                Delivery Details
              </h4>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Travel Time:</span>
                  <span>
                    {distanceInfo.distance?.duration || "N/A"} minutes
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total Weight:</span>
                  <span>
                    {distanceInfo.pricing?.totalWeight || totalWeight} kg
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Zone:</span>
                  <span className="capitalize">
                    {distanceInfo.delivery?.zone || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Route Source:</span>
                  <span className="capitalize">
                    {distanceInfo.distance?.source || "N/A"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Loading State */}
      {loading && !distanceInfo && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">
            Calculating delivery cost...
          </span>
        </div>
      )}

      {/* Manual Calculation Button */}
      {customerLocation && supplierLocation && !loading && (
        <button
          onClick={handleCalculateDistance}
          className="w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Recalculate Delivery Cost
        </button>
      )}
    </div>
  );
};

export default DistanceCalculator;
