import React, { useState, useEffect, useRef } from "react";
import { useMutation } from "react-query";
import { usersAPI } from "../../services/api";
import useGoogleMapsLocation from "../../hooks/useGoogleMapsLocation";
import toast from "react-hot-toast";
import {
  FaTimes,
  FaMapMarkerAlt,
  FaHome,
  FaBriefcase,
  FaMapPin,
  FaLocationArrow,
  FaSave,
  FaUser,
  FaPhone,
  FaSearch,
  FaSpinner,
  FaExclamationTriangle,
} from "react-icons/fa";
import "./AddressForm.css";

const AddressForm = ({ editingAddress, onSuccess, onCancel }) => {
  const mapRef = useRef(null);
  const autocompleteRef = useRef(null);
  const markerRef = useRef(null);
  const autocompleteInstance = useRef(null);

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
    isDetecting,
  } = useGoogleMapsLocation();

  // Form state - UPDATED to match backend schema
  const [formData, setFormData] = useState({
    type: "home",
    address: "", // Single address field as expected by backend
    city: "",
    state: "",
    pincode: "",
    coordinates: {
      latitude: null,
      longitude: null,
    },
    isDefault: false,
  });

  // Temporary fields for better UX (not sent to backend)
  const [tempFields, setTempFields] = useState({
    street: "",
    area: "",
    landmark: "",
  });

  // Initialize form with editing data
  useEffect(() => {
    if (editingAddress) {
      setFormData({
        type: editingAddress.type || "home",
        address: editingAddress.address || "",
        city: editingAddress.city || "",
        state: editingAddress.state || "",
        pincode: editingAddress.pincode || "",
        coordinates: editingAddress.coordinates || {
          latitude: null,
          longitude: null,
        },
        isDefault: editingAddress.isDefault || false,
      });

      // Try to parse the address into components for better UX
      const addressParts = editingAddress.address
        ? editingAddress.address.split(", ")
        : [];
      setTempFields({
        street: addressParts[0] || "",
        area: addressParts[1] || "",
        landmark: "",
      });
    }
  }, [editingAddress]);

  // Combine temp fields into address when they change
  useEffect(() => {
    const addressParts = [
      tempFields.street,
      tempFields.area,
      tempFields.landmark,
    ].filter((part) => part && part.trim());

    if (addressParts.length > 0) {
      setFormData((prev) => ({
        ...prev,
        address: addressParts.join(", "),
      }));
    }
  }, [tempFields]);

  // Mutation for adding/updating address - FIXED to send correct data
  const mutation = useMutation(
    (addressData) => {
      // Prepare data according to backend schema
      const backendData = {
        type: addressData.type,
        address: addressData.address,
        city: addressData.city,
        state: addressData.state,
        pincode: addressData.pincode,
        coordinates: addressData.coordinates,
        isDefault: addressData.isDefault,
      };

      console.log("Sending to backend:", backendData);

      if (editingAddress) {
        return usersAPI.updateAddress(editingAddress._id, backendData);
      } else {
        return usersAPI.addAddress(backendData);
      }
    },
    {
      onSuccess: (response) => {
        console.log("Address operation successful:", response);
        if (onSuccess) onSuccess(response);
      },
      onError: (error) => {
        console.error("Address operation error:", error);
        toast.error(
          editingAddress ? "Failed to update address" : "Failed to add address"
        );
      },
    }
  );

  // Initialize Google Maps when loaded
  useEffect(() => {
    if (isGoogleMapsLoaded && mapRef.current && !map) {
      initializeMap();
    }
  }, [isGoogleMapsLoaded]);

  // Set current location if available and no coordinates exist
  useEffect(() => {
    if (
      currentLocation &&
      map &&
      !formData.coordinates.latitude &&
      !editingAddress
    ) {
      updateMapLocation(currentLocation.lat, currentLocation.lng);
      handleReverseGeocode(currentLocation.lat, currentLocation.lng);
    }
  }, [currentLocation, map]);

  const initializeMap = async () => {
    if (!mapRef.current) {
      console.error("Map container not found");
      setMapError("Map container not available");
      setIsMapLoading(false);
      return;
    }

    try {
      setIsMapLoading(true);
      setMapError(null);

      const defaultCenter = formData.coordinates.latitude
        ? {
            lat: formData.coordinates.latitude,
            lng: formData.coordinates.longitude,
          }
        : { lat: 28.6139, lng: 77.209 }; // Default to Delhi

      const mapInstance = createMap(mapRef.current, {
        center: defaultCenter,
        zoom: 15,
      });

      if (!mapInstance) {
        throw new Error("Failed to create map instance");
      }

      // Create marker
      const marker = new window.google.maps.Marker({
        position: defaultCenter,
        map: mapInstance,
        draggable: true,
        animation: window.google.maps.Animation.DROP,
        title: "Drag to adjust location",
      });

      // Marker drag event
      marker.addListener("dragend", (event) => {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        console.log("Marker dragged to:", { lat, lng });
        handleReverseGeocode(lat, lng);
      });

      // Map click event
      mapInstance.addListener("click", (event) => {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        console.log("Map clicked at:", { lat, lng });
        updateMapLocation(lat, lng);
        handleReverseGeocode(lat, lng);
      });

      setMap(mapInstance);
      markerRef.current = marker;
      setIsMapLoading(false);

      console.log("Map initialized successfully");

      // Initialize autocomplete after map is ready
      initializeAutocomplete(mapInstance, marker);
    } catch (error) {
      console.error("Error initializing map:", error);
      setMapError(error.message);
      setIsMapLoading(false);
    }
  };

  const initializeAutocomplete = (mapInstance, marker) => {
    if (!autocompleteRef.current) {
      console.error("Autocomplete input not found");
      return;
    }

    try {
      const autocomplete = createAutocomplete(autocompleteRef.current);

      if (!autocomplete) {
        console.error("Failed to create autocomplete");
        return;
      }

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        console.log("Place selected:", place);

        if (!place.geometry) {
          toast.error("Please select a valid address from the dropdown");
          return;
        }

        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();

        updateMapLocation(lat, lng);
        parseAddressComponents(place);

        mapInstance.setCenter({ lat, lng });
        marker.setPosition({ lat, lng });
      });

      autocompleteInstance.current = autocomplete;
      console.log("Autocomplete initialized successfully");
    } catch (error) {
      console.error("Error initializing autocomplete:", error);
    }
  };

  const updateMapLocation = (lat, lng) => {
    console.log("Updating map location:", { lat, lng });

    setFormData((prev) => ({
      ...prev,
      coordinates: { latitude: lat, longitude: lng },
    }));

    if (markerRef.current) {
      markerRef.current.setPosition({ lat, lng });
    }
    if (map) {
      map.setCenter({ lat, lng });
    }
  };

  const handleReverseGeocode = async (lat, lng) => {
    try {
      console.log("Starting reverse geocoding for:", { lat, lng });
      const result = await reverseGeocode(lat, lng);
      parseAddressComponents(result);
      console.log("Reverse geocoding completed successfully");
    } catch (error) {
      console.error("Reverse geocoding failed:", error);
      toast.error("Failed to get address details for this location");
    }
  };

  const parseAddressComponents = (place) => {
    console.log("Parsing address components:", place);

    const components = place.address_components || [];
    const newTempFields = {
      street: "",
      area: "",
      landmark: "",
    };
    const newFormData = {
      city: "",
      state: "",
      pincode: "",
    };

    components.forEach((component) => {
      const types = component.types;

      if (types.includes("street_number") || types.includes("route")) {
        newTempFields.street += component.long_name + " ";
      } else if (
        types.includes("sublocality") ||
        types.includes("neighborhood") ||
        types.includes("sublocality_level_1")
      ) {
        newTempFields.area = component.long_name;
      } else if (types.includes("locality")) {
        newFormData.city = component.long_name;
      } else if (types.includes("administrative_area_level_1")) {
        newFormData.state = component.long_name;
      } else if (types.includes("postal_code")) {
        newFormData.pincode = component.long_name;
      }
    });

    console.log("Parsed address data:", { newTempFields, newFormData });

    setTempFields((prev) => ({
      ...prev,
      ...newTempFields,
      street: newTempFields.street.trim(),
    }));

    setFormData((prev) => ({
      ...prev,
      ...newFormData,
    }));
  };

  const detectCurrentLocation = async () => {
    try {
      console.log("Detecting current location...");
      const location = await getCurrentLocation();
      if (location) {
        updateMapLocation(location.lat, location.lng);
        handleReverseGeocode(location.lat, location.lng);
        toast.success("Location detected successfully!");
      }
    } catch (error) {
      console.error("Location detection failed:", error);
      toast.error(
        error.message || "Failed to detect location. Please try again."
      );
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Check if it's a temp field or form field
    if (["street", "area", "landmark"].includes(name)) {
      setTempFields((prev) => ({
        ...prev,
        [name]: value,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  const handleTypeChange = (type) => {
    setFormData((prev) => ({ ...prev, type }));
  };

  const validateForm = () => {
    const errors = [];

    if (!formData.address.trim()) {
      errors.push("Address is required");
    }
    if (!formData.city.trim()) {
      errors.push("City is required");
    }
    if (!formData.state.trim()) {
      errors.push("State is required");
    }
    if (!formData.pincode.trim()) {
      errors.push("Pincode is required");
    } else if (!/^\d{6}$/.test(formData.pincode)) {
      errors.push("Pincode must be 6 digits");
    }
    if (!formData.coordinates.latitude || !formData.coordinates.longitude) {
      errors.push("Please select location on map");
    }

    return errors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      validationErrors.forEach((error) => toast.error(error));
      return;
    }

    console.log("Submitting form data:", formData);
    mutation.mutate(formData);
  };

  const addressTypes = [
    { id: "home", label: "Home", icon: FaHome, color: "#10b981" },
    { id: "work", label: "Work", icon: FaBriefcase, color: "#3b82f6" },
    { id: "other", label: "Other", icon: FaMapPin, color: "#f59e0b" },
  ];

  if (!isGoogleMapsLoaded) {
    return (
      <div className="address-form">
        <div className="form-header">
          <h3>
            <FaMapMarkerAlt />
            Loading Google Maps...
          </h3>
          <button onClick={onCancel} className="close-btn">
            <FaTimes />
          </button>
        </div>
        <div className="loading-container">
          <FaSpinner className="loading-spinner spinning" />
          <p>Loading Google Maps API...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="address-form">
      <div className="form-header">
        <h3>
          <FaMapMarkerAlt />
          {editingAddress ? "Edit Address" : "Add New Address"}
        </h3>
        <button onClick={onCancel} className="close-btn">
          <FaTimes />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="form-body">
        {/* Map Section */}
        <div className="map-section">
          <div className="map-header">
            <div className="map-title">
              <FaMapMarkerAlt />
              <span>Select Location on Map</span>
            </div>
            <button
              type="button"
              onClick={detectCurrentLocation}
              className="detect-btn"
              disabled={isDetecting || !isLocationAvailable}
            >
              {isDetecting ? (
                <FaSpinner className="spinning" />
              ) : (
                <FaLocationArrow />
              )}
              {isDetecting ? "Detecting..." : "Use Current Location"}
            </button>
          </div>

          {locationError && (
            <div className="error-message">
              <FaExclamationTriangle />
              {locationError}
            </div>
          )}

          <div className="search-section">
            <div className="search-input-container">
              <FaSearch className="search-icon" />
              <input
                ref={autocompleteRef}
                type="text"
                placeholder="Search for your address..."
                className="search-input"
              />
            </div>
          </div>

          <div className="map-container">
            {mapError ? (
              <div className="map-error">
                <FaExclamationTriangle />
                <p>Error loading map: {mapError}</p>
                <button onClick={initializeMap} className="retry-btn">
                  Retry
                </button>
              </div>
            ) : (
              <>
                <div ref={mapRef} className="google-map" />
                {isMapLoading && (
                  <div className="map-loading">
                    <FaSpinner className="spinning" />
                    <p>Loading map...</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Form Fields */}
        <div className="form-section">
          {/* Address Type Selection */}
          <div className="type-selection">
            <label>Address Type</label>
            <div className="type-buttons">
              {addressTypes.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => handleTypeChange(type.id)}
                  className={`type-btn ${formData.type === type.id ? "active" : ""}`}
                  style={{
                    borderColor:
                      formData.type === type.id ? type.color : "#e5e7eb",
                    background:
                      formData.type === type.id
                        ? `${type.color}15`
                        : "transparent",
                  }}
                >
                  <type.icon style={{ color: type.color }} />
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Address Details - Using temp fields for better UX */}
          <div className="address-fields">
            <div className="field-row">
              <div className="form-group">
                <label htmlFor="street">House/Building/Street *</label>
                <input
                  type="text"
                  id="street"
                  name="street"
                  value={tempFields.street}
                  onChange={handleInputChange}
                  placeholder="House/Flat/Office No, Building Name, Street"
                  required
                />
              </div>
            </div>

            <div className="field-row">
              <div className="form-group">
                <label htmlFor="area">Area/Locality</label>
                <input
                  type="text"
                  id="area"
                  name="area"
                  value={tempFields.area}
                  onChange={handleInputChange}
                  placeholder="Area, Locality, Sector"
                />
              </div>
              <div className="form-group">
                <label htmlFor="landmark">Landmark</label>
                <input
                  type="text"
                  id="landmark"
                  name="landmark"
                  value={tempFields.landmark}
                  onChange={handleInputChange}
                  placeholder="Nearby landmark (optional)"
                />
              </div>
            </div>

            <div className="field-row three-cols">
              <div className="form-group">
                <label htmlFor="city">City *</label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="City"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="state">State *</label>
                <input
                  type="text"
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  placeholder="State"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="pincode">Pincode *</label>
                <input
                  type="text"
                  id="pincode"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleInputChange}
                  placeholder="Pincode"
                  pattern="[0-9]{6}"
                  maxLength="6"
                  required
                />
              </div>
            </div>
          </div>

          {/* Combined Address Preview */}
          {formData.address && (
            <div className="address-preview">
              <label>Complete Address:</label>
              <div className="preview-text">
                {formData.address}
                {formData.city && `, ${formData.city}`}
                {formData.state && `, ${formData.state}`}
                {formData.pincode && ` - ${formData.pincode}`}
              </div>
            </div>
          )}

          {/* Options */}
          <div className="form-options">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="isDefault"
                checked={formData.isDefault}
                onChange={handleInputChange}
              />
              <span className="checkmark"></span>
              Set as default address
            </label>
          </div>

          {/* Coordinates Display */}
          {formData.coordinates.latitude && formData.coordinates.longitude && (
            <div className="coordinates-display">
              <small>
                📍 Coordinates: {formData.coordinates.latitude.toFixed(6)},{" "}
                {formData.coordinates.longitude.toFixed(6)}
              </small>
            </div>
          )}

          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="button"
              onClick={onCancel}
              className="btn btn-secondary"
              disabled={mutation.isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={mutation.isLoading}
            >
              {mutation.isLoading ? (
                <FaSpinner className="spinning" />
              ) : (
                <FaSave />
              )}
              {mutation.isLoading
                ? "Saving..."
                : editingAddress
                  ? "Update Address"
                  : "Save Address"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddressForm;
