import React, { useState, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "react-query";
import { suppliersAPI } from "../../services/api";
import useGoogleMapsLocation from "../../hooks/useGoogleMapsLocation";
import toast from "react-hot-toast";
import {
  FaTimes,
  FaMapMarkerAlt,
  FaBuilding,
  FaMapPin,
  FaLocationArrow,
  FaSave,
  FaSearch,
  FaSpinner,
  FaExclamationTriangle,
  FaEdit,
  FaCheck,
  FaWarehouse,
} from "react-icons/fa";
import "./SupplierAddressManager.css";

const SupplierAddressManager = ({ supplier, onSuccess, isEditing, setIsEditing }) => {
  const mapRef = useRef(null);
  const autocompleteRef = useRef(null);
  const dispatchAutocompleteRef = useRef(null);
  const markerRef = useRef(null);
  const dispatchMarkerRef = useRef(null);
  const autocompleteInstance = useRef(null);
  const dispatchAutocompleteInstance = useRef(null);

  const [map, setMap] = useState(null);
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [mapError, setMapError] = useState(null);

  const {
    currentLocation,
    isGoogleMapsLoaded,
    getCurrentLocation,
    isLocationAvailable,
    reverseGeocode,
    createMap,
    createAutocomplete,
    locationError,
    isDetecting, // This comes from the hook
  } = useGoogleMapsLocation();

  const queryClient = useQueryClient();

  // Form state
  const [formData, setFormData] = useState({
    companyAddress: "",
    city: "",
    state: "",
    pincode: "",
    dispatchLocation: {
      address: "",
    },
    coordinates: {
      latitude: null,
      longitude: null,
    },
  });

  // Initialize form with supplier data
  useEffect(() => {
    if (supplier) {
      setFormData({
        companyAddress: supplier.companyAddress || "",
        city: supplier.city || "",
        state: supplier.state || "",
        pincode: supplier.pincode || "",
        dispatchLocation: {
          address: supplier.dispatchLocation?.address || "",
        },
        coordinates: {
          latitude: supplier.dispatchLocation?.coordinates?.[1] || null,
          longitude: supplier.dispatchLocation?.coordinates?.[0] || null,
        },
      });
    }
  }, [supplier]);

  // Mutation for updating supplier profile
  const updateMutation = useMutation(
    (data) => suppliersAPI.updateProfile(data),
    {
      onSuccess: (response) => {
        console.log("✅ Supplier address updated successfully:", response);
        toast.success("Address updated successfully! Coordinates have been updated automatically.");
        setIsEditing(false);
        queryClient.invalidateQueries("supplierProfile");
        if (onSuccess) onSuccess(response);
      },
      onError: (error) => {
        console.error("❌ Supplier address update failed:", error);
        const errorMessage = error?.response?.data?.message || "Failed to update address";
        toast.error(errorMessage);
      },
    }
  );

  // Initialize Google Maps when loaded
  useEffect(() => {
    if (isGoogleMapsLoaded && mapRef.current && !map && isEditing) {
      initializeMap();
    }
  }, [isGoogleMapsLoaded, isEditing]);

  const initializeMap = async () => {
    try {
      setIsMapLoading(true);
      setMapError(null);

      if (!window.google || !window.google.maps) {
        throw new Error("Google Maps not loaded");
      }

      // Default to current location or Bhubaneswar
      let center = { lat: 20.2961, lng: 85.8245 }; // Bhubaneswar default

      // Use supplier's current coordinates if available
      if (formData.coordinates.latitude && formData.coordinates.longitude) {
        center = {
          lat: formData.coordinates.latitude,
          lng: formData.coordinates.longitude,
        };
      } else if (currentLocation) {
        center = currentLocation;
      }

      const mapInstance = new window.google.maps.Map(mapRef.current, {
        center,
        zoom: 13,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
        gestureHandling: "cooperative",
      });

      setMap(mapInstance);

      // Add click listener to map
      mapInstance.addListener("click", (event) => {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        updateMapMarker(lat, lng);
        reverseGeocodeLocation(lat, lng);
      });

      // Create autocomplete for company address
      if (autocompleteRef.current) {
        const autocomplete = new window.google.maps.places.Autocomplete(
          autocompleteRef.current,
          {
            componentRestrictions: { country: "IN" },
            fields: ["formatted_address", "geometry", "address_components"],
            types: ["establishment", "geocode"],
          }
        );

        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          if (place.geometry) {
            handlePlaceSelect(place, "company");
          }
        });

        autocompleteInstance.current = autocomplete;
      }

      // Create autocomplete for dispatch location
      if (dispatchAutocompleteRef.current) {
        const dispatchAutocomplete = new window.google.maps.places.Autocomplete(
          dispatchAutocompleteRef.current,
          {
            componentRestrictions: { country: "IN" },
            fields: ["formatted_address", "geometry", "address_components"],
            types: ["establishment", "geocode"],
          }
        );

        dispatchAutocomplete.addListener("place_changed", () => {
          const place = dispatchAutocomplete.getPlace();
          if (place.geometry) {
            handlePlaceSelect(place, "dispatch");
          }
        });

        dispatchAutocompleteInstance.current = dispatchAutocomplete;
      }

      // Add initial marker if coordinates exist
      if (formData.coordinates.latitude && formData.coordinates.longitude) {
        updateMapMarker(formData.coordinates.latitude, formData.coordinates.longitude);
      }

      setIsMapLoading(false);
    } catch (error) {
      console.error("Error initializing map:", error);
      setMapError("Failed to load map. Please check your internet connection.");
      setIsMapLoading(false);
    }
  };

  const handlePlaceSelect = (place, type) => {
    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();

    // Extract address components
    const addressComponents = {};
    place.address_components?.forEach((component) => {
      const types = component.types;
      if (types.includes("locality")) {
        addressComponents.city = component.long_name;
      } else if (types.includes("administrative_area_level_1")) {
        addressComponents.state = component.long_name;
      } else if (types.includes("postal_code")) {
        addressComponents.pincode = component.long_name;
      }
    });

    if (type === "company") {
      setFormData((prev) => ({
        ...prev,
        companyAddress: place.formatted_address || "",
        city: addressComponents.city || prev.city,
        state: addressComponents.state || prev.state,
        pincode: addressComponents.pincode || prev.pincode,
        coordinates: { latitude: lat, longitude: lng },
      }));
    } else if (type === "dispatch") {
      setFormData((prev) => ({
        ...prev,
        dispatchLocation: {
          address: place.formatted_address || "",
        },
        coordinates: { latitude: lat, longitude: lng },
      }));
    }

    // Update map
    if (map) {
      map.setCenter({ lat, lng });
      updateMapMarker(lat, lng);
    }
  };

  const updateMapMarker = (lat, lng) => {
    if (!map) return;

    // Remove existing marker
    if (markerRef.current) {
      markerRef.current.setMap(null);
    }

    // Create new marker
    const marker = new window.google.maps.Marker({
      position: { lat, lng },
      map: map,
      title: "Supplier Location",
      icon: {
        url: "data:image/svg+xml;charset=UTF-8,%3csvg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z' fill='%23f59e0b'/%3e%3ccircle cx='12' cy='9' r='2.5' fill='white'/%3e%3c/svg%3e",
        scaledSize: new window.google.maps.Size(32, 32),
      },
      draggable: true,
    });

    // Add drag listener
    marker.addListener("dragend", (event) => {
      const newLat = event.latLng.lat();
      const newLng = event.latLng.lng();
      reverseGeocodeLocation(newLat, newLng);
    });

    markerRef.current = marker;
  };

  const reverseGeocodeLocation = async (lat, lng) => {
    try {
      const result = await reverseGeocode(lat, lng);
      if (result) {
        // Extract address components from Google Maps result
        let city = "";
        let state = "";
        let pincode = "";
        
        result.address_components?.forEach((component) => {
          const types = component.types;
          if (types.includes("locality")) {
            city = component.long_name;
          } else if (types.includes("administrative_area_level_1")) {
            state = component.long_name;
          } else if (types.includes("postal_code")) {
            pincode = component.long_name;
          }
        });

        setFormData((prev) => ({
          ...prev,
          companyAddress: result.formatted_address || prev.companyAddress,
          city: city || prev.city,
          state: state || prev.state,
          pincode: pincode || prev.pincode,
          coordinates: { latitude: lat, longitude: lng },
        }));
      }
    } catch (error) {
      console.error("Reverse geocoding failed:", error);
      // Still update coordinates even if reverse geocoding fails
      setFormData((prev) => ({
        ...prev,
        coordinates: { latitude: lat, longitude: lng },
      }));
    }
  };

  const handleDetectLocation = async () => {
    try {
      console.log("🔍 Detecting current location...");
      
      // Check if geolocation is available
      if (!isLocationAvailable) {
        toast.error("Geolocation is not supported by your browser");
        return;
      }

      const location = await getCurrentLocation();
      
      if (location) {
        console.log("✅ Location detected:", location);
        
        setFormData((prev) => ({
          ...prev,
          coordinates: {
            latitude: location.lat,
            longitude: location.lng,
          },
        }));

        if (map) {
          map.setCenter(location);
          map.setZoom(16); // Zoom in when location is detected
          updateMapMarker(location.lat, location.lng);
        }

        // Reverse geocode to get address
        await reverseGeocodeLocation(location.lat, location.lng);
        
        toast.success("Current location detected successfully!");
      }
    } catch (error) {
      console.error("Location detection failed:", error);
      
      let errorMessage = "Failed to detect your location. Please select manually on the map.";
      
      if (error.message.includes("denied")) {
        errorMessage = "Location access denied. Please enable location permissions in your browser and try again.";
      } else if (error.message.includes("unavailable")) {
        errorMessage = "Location information is unavailable. Please try again or select manually.";
      } else if (error.message.includes("timeout")) {
        errorMessage = "Location request timed out. Please try again.";
      }
      
      toast.error(errorMessage);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('dispatchLocation.')) {
      const field = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        dispatchLocation: {
          ...prev.dispatchLocation,
          [field]: value
        }
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSave = () => {
    // Validate required fields
    if (!formData.companyAddress.trim()) {
      toast.error("Company address is required");
      return;
    }
    if (!formData.city.trim()) {
      toast.error("City is required");
      return;
    }
    if (!formData.state.trim()) {
      toast.error("State is required");
      return;
    }

    updateMutation.mutate(formData);
  };

  const handleCancel = () => {
    // Reset form to original supplier data
    setFormData({
      companyAddress: supplier?.companyAddress || "",
      city: supplier?.city || "",
      state: supplier?.state || "",
      pincode: supplier?.pincode || "",
      dispatchLocation: {
        address: supplier?.dispatchLocation?.address || "",
      },
      coordinates: {
        latitude: supplier?.dispatchLocation?.coordinates?.[1] || null,
        longitude: supplier?.dispatchLocation?.coordinates?.[0] || null,
      },
    });
    setIsEditing(false);
  };

  if (!isEditing) {
    // Display mode
    return (
      <div className="supplier-address-display">
        <div className="address-section">
          <div className="section-header">
            <h3>
              <FaBuilding />
              Company Address
            </h3>
            <button className="profile-edit-btn edit-btn-primary" onClick={() => setIsEditing(true)}>
              <FaEdit /> Edit Address
            </button>
          </div>
          
          <div className="address-details">
            <div className="address-item">
              <strong>Address:</strong>
              <p>{supplier?.companyAddress || "Not provided"}</p>
            </div>
            <div className="address-row">
              <div className="address-item">
                <strong>City:</strong>
                <p>{supplier?.city || "Not provided"}</p>
              </div>
              <div className="address-item">
                <strong>State:</strong>
                <p>{supplier?.state || "Not provided"}</p>
              </div>
              <div className="address-item">
                <strong>Pincode:</strong>
                <p>{supplier?.pincode || "Not provided"}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="address-section">
          <h3>
            <FaWarehouse />
            Dispatch Location
          </h3>
          <div className="address-details">
            <div className="address-item">
              <strong>Dispatch Address:</strong>
              <p>{supplier?.dispatchLocation?.address || "Not provided"}</p>
            </div>
            <div className="coordinates-info">
              <strong>Coordinates:</strong>
              {supplier?.dispatchLocation?.coordinates?.[0] !== 0 && supplier?.dispatchLocation?.coordinates?.[1] !== 0 ? (
                <p className="coordinates-valid">
                  <FaMapPin /> {supplier.dispatchLocation.coordinates[1]?.toFixed(6)}, {supplier.dispatchLocation.coordinates[0]?.toFixed(6)}
                  <span className="coordinates-status">✅ Valid coordinates for nearby supplier detection</span>
                </p>
              ) : (
                <p className="coordinates-invalid">
                  <FaExclamationTriangle /> Not available - Please update your address to enable nearby supplier features
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Edit mode
  return (
    <div className="supplier-address-manager">
      <div className="address-form-header">
        <h3>
          <FaMapMarkerAlt />
          Update Address & Location
        </h3>
        <p>Update your business address and dispatch location. Coordinates will be automatically geocoded for accurate nearby supplier detection.</p>
      </div>

      <div className="address-form-content">
        {/* Company Address Section */}
        <div className="address-section">
          <h4>
            <FaBuilding />
            Company Address
          </h4>
          
          <div className="form-group">
            <label className="form-label">Company Address *</label>
            <div className="address-input-container">
              <input
                ref={autocompleteRef}
                type="text"
                name="companyAddress"
                className="form-input"
                value={formData.companyAddress}
                onChange={handleInputChange}
                placeholder="Start typing your company address..."
              />
              <FaSearch className="search-icon" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">City *</label>
              <input
                type="text"
                name="city"
                className="form-input"
                value={formData.city}
                onChange={handleInputChange}
                placeholder="Enter city"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">State *</label>
              <input
                type="text"
                name="state"
                className="form-input"
                value={formData.state}
                onChange={handleInputChange}
                placeholder="Enter state"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Pincode</label>
              <input
                type="text"
                name="pincode"
                className="form-input"
                value={formData.pincode}
                onChange={handleInputChange}
                placeholder="Enter pincode"
              />
            </div>
          </div>
        </div>

        {/* Dispatch Location Section */}
        <div className="address-section">
          <h4>
            <FaWarehouse />
            Dispatch Location
          </h4>
          
          <div className="form-group">
            <label className="form-label">Dispatch Address</label>
            <div className="address-input-container">
              <input
                ref={dispatchAutocompleteRef}
                type="text"
                name="dispatchLocation.address"
                className="form-input"
                value={formData.dispatchLocation.address}
                onChange={handleInputChange}
                placeholder="Start typing your dispatch location..."
              />
              <FaSearch className="search-icon" />
            </div>
            <small className="form-help">
              This address will be used for calculating delivery distances to customers
            </small>
          </div>
        </div>

        {/* Google Maps Section */}
        {isGoogleMapsLoaded && (
          <div className="map-section">
            <div className="map-header">
              <h4>
                <FaMapPin />
                Select Location on Map
              </h4>
              <button
                type="button"
                className="btn btn-secondaries"
                onClick={handleDetectLocation}
                disabled={isDetecting || !isLocationAvailable}
              >
                {isDetecting ? (
                  <>
                    <FaSpinner className="spinning" />
                    Detecting...
                  </>
                ) : (
                  <>
                    <FaLocationArrow />
                    Use Current Location
                  </>
                )}
              </button>
            </div>

            <div className="map-container">
              {isMapLoading && (
                <div className="map-loading">
                  <FaSpinner className="spinning" />
                  <p>Loading map...</p>
                </div>
              )}
              
              {mapError && (
                <div className="map-error">
                  <FaExclamationTriangle />
                  <p>{mapError}</p>
                </div>
              )}

              <div
                ref={mapRef}
                className="google-map"
                style={{
                  height: "300px",
                  width: "100%",
                  borderRadius: "8px",
                  display: isMapLoading || mapError ? "none" : "block",
                }}
              />
            </div>

            {formData.coordinates.latitude && formData.coordinates.longitude && (
              <div className="coordinates-display">
                <FaMapPin />
                <span>
                  Selected Coordinates: {formData.coordinates.latitude.toFixed(6)}, {formData.coordinates.longitude.toFixed(6)}
                </span>
              </div>
            )}

            <div className="map-instructions">
              <p>💡 <strong>Instructions:</strong></p>
              <ul>
                <li>Search for your address using the search boxes above</li>
                <li>Or click on the map to select your exact location</li>
                <li>Drag the marker to fine-tune your position</li>
                <li>Use "Current Location" to detect your GPS position</li>
              </ul>
            </div>
          </div>
        )}

        {!isGoogleMapsLoaded && (
          <div className="map-unavailable">
            <FaExclamationTriangle />
            <p>Google Maps is loading... Please wait.</p>
          </div>
        )}

        {locationError && (
          <div className="location-error">
            <FaExclamationTriangle />
            <p>{locationError}</p>
          </div>
        )}

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleCancel}
            disabled={updateMutation.isLoading}
          >
            <FaTimes />
            Cancel
          </button>
          
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSave}
            disabled={updateMutation.isLoading}
          >
            {updateMutation.isLoading ? (
              <>
                <FaSpinner className="spinning" />
                Updating...
              </>
            ) : (
              <>
                <FaSave />
                Save Address
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SupplierAddressManager;
