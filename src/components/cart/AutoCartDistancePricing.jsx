import React, { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "react-hot-toast";
import { usersAPI } from "../../services/api"; // ADDED: Import the API service
import "./AutoCartDistancePricing.css";

const AutoCartDistancePricing = ({ cartItems, onCostsCalculated }) => {
  const [userLocation, setUserLocation] = useState(null);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [locationMethod, setLocationMethod] = useState("current");
  const [supplierCosts, setSupplierCosts] = useState({});
  const [isCalculating, setIsCalculating] = useState(false);
  const [hasCalculated, setHasCalculated] = useState(false);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);

  // FIXED: Use the proper API service instead of raw fetch
  const fetchSavedAddresses = useCallback(async () => {
    setIsLoadingAddresses(true);
    try {
      console.log("🚀 Fetching saved addresses using API service...");

      const response = await usersAPI.getAddresses(); // FIXED: Use API service
      console.log("📧 API Response:", response);

      if (response.success) {
        const addresses = response.data?.addresses || [];
        console.log("✅ Found addresses:", addresses.length);

        setSavedAddresses(addresses);

        // Auto-select default address if available with coordinates
        const defaultAddress = addresses.find(
          (addr) =>
            addr.isDefault &&
            addr.coordinates?.latitude &&
            addr.coordinates?.longitude
        );

        if (defaultAddress) {
          console.log("🏠 Auto-selecting default address:", defaultAddress._id);
          setSelectedAddress(defaultAddress);
        }

        if (addresses.length > 0) {
          toast.success(`✅ Loaded ${addresses.length} saved address(es)`);
        } else {
          console.log("ℹ️ No addresses found in user profile");
        }
      } else {
        console.error("❌ API returned success: false");
        toast.error(response.message || "Failed to load addresses");
        setSavedAddresses([]);
      }
    } catch (error) {
      console.error("❌ Error fetching addresses:", error);

      if (error.response?.status === 401) {
        toast.error("Please log in again");
      } else if (error.message?.includes("Network Error")) {
        toast.error(
          "Cannot connect to server. Please check if backend is running."
        );
      } else {
        toast.error("Failed to load saved addresses");
      }
      setSavedAddresses([]);
    } finally {
      setIsLoadingAddresses(false);
    }
  }, []);

  useEffect(() => {
    fetchSavedAddresses();
  }, [fetchSavedAddresses]);

  // Calculate delivery details
  const calculateDeliveryDetails = useCallback((distance, transportRates) => {
    let zone, rates;

    if (distance <= 5) {
      zone = "upTo5km";
      rates = transportRates.upTo5km;
    } else if (distance <= 10) {
      zone = "upTo10km";
      rates = transportRates.upTo10km;
    } else if (distance <= 20) {
      zone = "upTo20km";
      rates = transportRates.upTo20km;
    } else {
      zone = "above20km";
      rates = transportRates.above20km;
    }

    const cost = (rates?.baseCost || 0) + distance * (rates?.costPerKm || 0);
    const deliveryTime = rates?.estimatedDeliveryTime || "Contact supplier";

    return { deliveryTime, cost, zone, distance };
  }, []);

  // Haversine distance calculation
  const calculateHaversineDistance = useCallback((lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  // Group cart items by supplier
  const supplierGroups = useMemo(() => {
    if (!cartItems || cartItems.length === 0) return {};

    const groups = {};
    cartItems.forEach((item) => {
      const supplier = item.product?.supplier;
      if (!supplier) return;

      const supplierId = supplier._id;
      if (!groups[supplierId]) {
        groups[supplierId] = {
          supplier: supplier,
          items: [],
          totalQuantity: 0,
          totalWeight: 0,
        };
      }

      groups[supplierId].items.push(item);
      groups[supplierId].totalQuantity += item.quantity;
      groups[supplierId].totalWeight +=
        (item.product?.specifications?.weight || 1) * item.quantity;
    });

    return groups;
  }, [cartItems]);

  // Calculate costs using selected coordinates
  const calculateCosts = useCallback(
    (latitude, longitude) => {
      console.log(
        `📍 Calculating costs for location: ${latitude}, ${longitude}`
      );

      const newSupplierCosts = {};
      let totalValidCost = 0;
      let hasValidCosts = false;

      // Process each supplier group
      for (const [supplierId, supplierData] of Object.entries(supplierGroups)) {
        const supplier = supplierData.supplier;

        console.log(`\n🏪 Processing supplier: ${supplier.companyName}`);

        // Supplier location validation
        const supplierLocation = supplier.location || supplier.dispatchLocation;

        if (
          !supplierLocation ||
          !supplierLocation.coordinates ||
          !Array.isArray(supplierLocation.coordinates) ||
          supplierLocation.coordinates.length !== 2
        ) {
          console.log(
            "❌ Location validation failed - missing or invalid coordinates"
          );
          newSupplierCosts[supplierId] = {
            supplier: supplier,
            items: supplierData.items,
            error: "Supplier location data is invalid",
            totalCost: 0,
            itemCount: supplierData.items.length,
          };
          continue;
        }

        // Check for zero coordinates
        const [lng, lat] = supplierLocation.coordinates;
        if (lng === 0 && lat === 0) {
          console.log("❌ Location validation failed - zero coordinates");
          newSupplierCosts[supplierId] = {
            supplier: supplier,
            items: supplierData.items,
            error: "Supplier location is not properly set",
            totalCost: 0,
            itemCount: supplierData.items.length,
          };
          continue;
        }

        // Transport rates validation
        if (
          !supplier.transportRates ||
          Object.keys(supplier.transportRates).length === 0 ||
          !supplier.transportRates.upTo5km
        ) {
          console.log("❌ Transport rates validation failed");
          newSupplierCosts[supplierId] = {
            supplier: supplier,
            items: supplierData.items,
            error: "Transport rates not configured for this supplier",
            totalCost: 0,
            itemCount: supplierData.items.length,
            showContactSupplier: true,
          };
          continue;
        }

        // Calculate distance
        const supplierLng = supplierLocation.coordinates[0];
        const supplierLat = supplierLocation.coordinates[1];

        const distance = calculateHaversineDistance(
          latitude,
          longitude,
          supplierLat,
          supplierLng
        );

        console.log(
          `📏 Distance to ${supplier.companyName}: ${distance.toFixed(2)} km`
        );

        // Calculate delivery details
        const deliveryDetails = calculateDeliveryDetails(
          distance,
          supplier.transportRates
        );

        console.log(
          `💰 Delivery cost for ${supplier.companyName}: ₹${deliveryDetails.cost}`
        );

        newSupplierCosts[supplierId] = {
          supplier: supplier,
          items: supplierData.items,
          distance: distance,
          deliveryTime: deliveryDetails.deliveryTime,
          totalCost: deliveryDetails.cost,
          zone: deliveryDetails.zone,
          itemCount: supplierData.items.length,
          totalQuantity: supplierData.totalQuantity,
          totalWeight: supplierData.totalWeight,
        };

        totalValidCost += deliveryDetails.cost;
        hasValidCosts = true;
      }

      console.log(`💰 Total delivery cost: ₹${totalValidCost}`);
      setSupplierCosts(newSupplierCosts);

      // Call the parent callback with the calculated costs
      if (onCostsCalculated) {
        onCostsCalculated({
          supplierCosts: newSupplierCosts,
          totalCost: totalValidCost,
          hasValidCosts: hasValidCosts,
        });
      }
    },
    [
      supplierGroups,
      calculateHaversineDistance,
      calculateDeliveryDetails,
      onCostsCalculated,
    ]
  );

  // Get current location
  const getCurrentLocation = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by this browser"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          console.log("📍 Current location obtained:", location);
          resolve(location);
        },
        (error) => {
          console.error("❌ Geolocation error:", error);
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 300000, // 5 minutes
        }
      );
    });
  }, []);

  // Main calculation handler
  const handleCalculate = async () => {
    setIsCalculating(true);

    try {
      let latitude, longitude;

      if (locationMethod === "current") {
        console.log("📍 Using current location");
        const location = await getCurrentLocation();
        latitude = location.latitude;
        longitude = location.longitude;
        setUserLocation(location);
      } else if (locationMethod === "saved") {
        console.log("🏠 Using saved address");
        if (!selectedAddress) {
          toast.error("Please select a saved address");
          return;
        }

        if (
          !selectedAddress.coordinates?.latitude ||
          !selectedAddress.coordinates?.longitude
        ) {
          toast.error("Selected address doesn't have valid coordinates");
          return;
        }

        latitude = selectedAddress.coordinates.latitude;
        longitude = selectedAddress.coordinates.longitude;
      }

      console.log(`📍 Final coordinates: ${latitude}, ${longitude}`);
      calculateCosts(latitude, longitude);
      setHasCalculated(true);
    } catch (error) {
      console.error("❌ Calculation error:", error);
      if (error.code === error.PERMISSION_DENIED) {
        toast.error(
          "Location access denied. Please enable location services or use a saved address."
        );
      } else if (error.code === error.POSITION_UNAVAILABLE) {
        toast.error(
          "Location information unavailable. Please try using a saved address."
        );
      } else if (error.code === error.TIMEOUT) {
        toast.error(
          "Location request timed out. Please try again or use a saved address."
        );
      } else {
        toast.error("Failed to calculate delivery costs: " + error.message);
      }
    } finally {
      setIsCalculating(false);
    }
  };

  const handleReset = () => {
    setSupplierCosts({});
    setHasCalculated(false);
    setUserLocation(null);
    if (onCostsCalculated) {
      onCostsCalculated({
        supplierCosts: {},
        totalCost: 0,
        hasValidCosts: false,
      });
    }
  };

  const handleAddressChange = (e) => {
    const addressId = e.target.value;
    console.log("🏠 Address selection changed:", addressId);

    if (addressId) {
      const address = savedAddresses.find((addr) => addr._id === addressId);
      console.log("🏠 Selected address object:", address);
      setSelectedAddress(address);
    } else {
      setSelectedAddress(null);
    }

    // Reset calculations when address changes
    setSupplierCosts({});
    setHasCalculated(false);
  };

  return (
    <div className="auto-cart-distance-pricing">
      <div className="pricing-header">
        <h3>🚚 Delivery Cost Calculator</h3>
        <p>Calculate delivery costs using your location or saved addresses</p>
      </div>

      {/* Location Method Selection */}
      <div className="location-selection">
        <div className="location-method-selector">
          <label>
            <input
              type="radio"
              name="locationMethod"
              value="current"
              checked={locationMethod === "current"}
              onChange={(e) => {
                setLocationMethod(e.target.value);
                setSelectedAddress(null);
                setSupplierCosts({});
                setHasCalculated(false);
              }}
            />
            📍 Use Current Location
          </label>

          <label>
            <input
              type="radio"
              name="locationMethod"
              value="saved"
              checked={locationMethod === "saved"}
              onChange={(e) => {
                setLocationMethod(e.target.value);
                setSupplierCosts({});
                setHasCalculated(false);
              }}
            />
            🏠 Use Saved Address ({savedAddresses.length} available)
          </label>
        </div>

        {/* Saved Address Dropdown */}
        {locationMethod === "saved" && (
          <div className="saved-address-selector">
            <select
              value={selectedAddress?._id || ""}
              onChange={handleAddressChange}
              disabled={isLoadingAddresses}
            >
              <option value="">
                {isLoadingAddresses
                  ? "Loading addresses..."
                  : savedAddresses.length === 0
                    ? "No addresses available"
                    : "Select an address"}
              </option>
              {savedAddresses.map((address) => (
                <option key={address._id} value={address._id}>
                  {address.type?.toUpperCase()}: {address.address},{" "}
                  {address.city}, {address.state} - {address.pincode}
                  {address.isDefault ? " (Default)" : ""}
                </option>
              ))}
            </select>

            {savedAddresses.length === 0 && !isLoadingAddresses && (
              <p className="no-addresses">
                No saved addresses found. <a href="/profile">Add addresses</a>{" "}
                to use this feature.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Calculate Button */}
      <div className="action-buttons">
        <button
          onClick={handleCalculate}
          disabled={
            isCalculating ||
            (locationMethod === "saved" && !selectedAddress) ||
            (locationMethod === "saved" && savedAddresses.length === 0)
          }
          className="calculate-btn"
        >
          {isCalculating ? (
            <>
              <div className="spinner"></div>
              Calculating...
            </>
          ) : (
            <>🧮 Calculate Delivery Costs</>
          )}
        </button>

        {hasCalculated && (
          <button onClick={handleReset} className="reset-btn">
            🔄 Reset
          </button>
        )}
      </div>

      {/* Results Display */}
      {hasCalculated && Object.keys(supplierCosts).length > 0 && (
        <div className="delivery-results">
          <h4>📦 Delivery Cost Breakdown</h4>

          {Object.entries(supplierCosts).map(([supplierId, cost]) => (
            <div key={supplierId} className="supplier-cost-card">
              <div className="supplier-info">
                <h5>🏪 {cost.supplier.companyName}</h5>
                <p className="supplier-location">
                  📍 {cost.supplier.businessAddress?.city},{" "}
                  {cost.supplier.businessAddress?.state}
                </p>
              </div>

              {cost.error ? (
                <div className="cost-error">
                  <p className="error-message">❌ {cost.error}</p>
                  {cost.showContactSupplier && (
                    <p className="contact-suggestion">
                      💬 Please contact the supplier directly for delivery
                      information.
                    </p>
                  )}
                </div>
              ) : (
                <div className="cost-details">
                  <div className="cost-summary">
                    <div className="cost-main">
                      <span className="cost-label">Delivery Cost:</span>
                      <span className="cost-value">
                        ₹{cost.totalCost?.toFixed(2) || "0.00"}
                      </span>
                    </div>
                    <div className="cost-info">
                      <span>
                        📏 Distance: {cost.distance?.toFixed(2) || "0"} km
                      </span>
                      <span>⏱️ {cost.deliveryTime}</span>
                    </div>
                  </div>

                  <div className="items-summary">
                    <p>
                      📦 {cost.itemCount} product(s), {cost.totalQuantity} items
                    </p>
                    <div className="items-list">
                      {cost.items?.map((item, index) => (
                        <div key={index} className="cart-item">
                          <span>{item.product?.name}</span>
                          <span>Qty: {item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Total Cost Summary */}
          <div className="total-cost-summary">
            <div className="total-cost">
              <span>🚚 Total Delivery Cost:</span>
              <span className="total-amount">
                ₹
                {Object.values(supplierCosts)
                  .reduce((sum, cost) => sum + (cost.totalCost || 0), 0)
                  .toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutoCartDistancePricing;
