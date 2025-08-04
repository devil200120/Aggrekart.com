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
} from "react-icons/fa";
import "./GoogleMapsAddressForm.css";

const GoogleMapsAddressForm = ({
  address,
  onClose,
  onSuccess,
  onCancel,
  editingAddress,
  selectedType,
  onTypeChange,
  isModal = true, // NEW: Add prop to control modal vs inline rendering
}) => {
  const mapRef = useRef(null);
  const autocompleteRef = useRef(null);
  const markerRef = useRef(null);
  const [map, setMap] = useState(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  const {
    currentLocation,
    isGoogleMapsLoaded,
    getCurrentLocation,
    isLocationAvailable,
  } = useGoogleMapsLocation();

  // Form state
  const [formData, setFormData] = useState({
    type: selectedType || address?.type || "home",
    street: address?.street || "",
    area: address?.area || "",
    city: address?.city || "",
    state: address?.state || "",
    pincode: address?.pincode || "",
    landmark: address?.landmark || "",
    contactName: address?.contactName || "",
    contactPhone: address?.contactPhone || "",
    isDefault: address?.isDefault || false,
    coordinates: address?.coordinates || {
      latitude: null,
      longitude: null,
    },
  });

  // Update form when editing address changes
  useEffect(() => {
    if (editingAddress) {
      setFormData({
        type: editingAddress.type || "home",
        street: editingAddress.street || "",
        area: editingAddress.area || "",
        city: editingAddress.city || "",
        state: editingAddress.state || "",
        pincode: editingAddress.pincode || "",
        landmark: editingAddress.landmark || "",
        contactName: editingAddress.contactName || "",
        contactPhone: editingAddress.contactPhone || "",
        isDefault: editingAddress.isDefault || false,
        coordinates: editingAddress.coordinates || {
          latitude: null,
          longitude: null,
        },
      });
    }
  }, [editingAddress]);

  // Update type when selectedType changes
  useEffect(() => {
    if (selectedType && onTypeChange) {
      setFormData((prev) => ({ ...prev, type: selectedType }));
    }
  }, [selectedType, onTypeChange]);

  // Mutation for adding/updating address
  const mutation = useMutation(
    (addressData) => {
      if (editingAddress) {
        return usersAPI.updateAddress(editingAddress._id, addressData);
      } else {
        return usersAPI.addAddress(addressData);
      }
    },
    {
      onSuccess: (response) => {
        toast.success(
          editingAddress
            ? "Address updated successfully!"
            : "Address added successfully!"
        );
        if (onSuccess) onSuccess(response);
        if (onClose) onClose();
      },
      onError: (error) => {
        console.error("Address operation error:", error);
        toast.error(
          editingAddress ? "Failed to update address" : "Failed to add address"
        );
      },
    }
  );

  // Initialize Google Maps
  useEffect(() => {
    if (isGoogleMapsLoaded && mapRef.current && !map) {
      initializeMap();
    }
  }, [isGoogleMapsLoaded, map]);

  // Set current location if available
  useEffect(() => {
    if (currentLocation && map && !formData.coordinates.latitude) {
      updateMapLocation(currentLocation.lat, currentLocation.lng);
      reverseGeocode(currentLocation.lat, currentLocation.lng);
    }
  }, [currentLocation, map]);

  const initializeMap = () => {
    if (!window.google || !mapRef.current) return;

    const defaultCenter = formData.coordinates.latitude
      ? {
          lat: formData.coordinates.latitude,
          lng: formData.coordinates.longitude,
        }
      : { lat: 28.6139, lng: 77.209 }; // Default to Delhi

    const newMap = new window.google.maps.Map(mapRef.current, {
      center: defaultCenter,
      zoom: 15,
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }],
        },
      ],
    });

    const marker = new window.google.maps.Marker({
      position: defaultCenter,
      map: newMap,
      draggable: true,
      animation: window.google.maps.Animation.DROP,
    });

    marker.addListener("dragend", (event) => {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      reverseGeocode(lat, lng);
    });

    newMap.addListener("click", (event) => {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      updateMapLocation(lat, lng);
      reverseGeocode(lat, lng);
    });

    setMap(newMap);
    markerRef.current = marker;

    // Initialize autocomplete
    initializeAutocomplete(newMap, marker);
  };

  const initializeAutocomplete = (mapInstance, marker) => {
    if (!window.google || !autocompleteRef.current) return;

    const autocomplete = new window.google.maps.places.Autocomplete(
      autocompleteRef.current,
      {
        types: ["address"],
        componentRestrictions: { country: "IN" },
      }
    );

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (!place.geometry) return;

      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();

      updateMapLocation(lat, lng);
      parseAddressComponents(place);

      mapInstance.setCenter({ lat, lng });
      marker.setPosition({ lat, lng });
    });
  };

  const updateMapLocation = (lat, lng) => {
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

  const reverseGeocode = async (lat, lng) => {
    if (!window.google) return;

    const geocoder = new window.google.maps.Geocoder();
    try {
      const response = await new Promise((resolve, reject) => {
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
          if (status === "OK" && results[0]) {
            resolve(results[0]);
          } else {
            reject(new Error("Geocoding failed"));
          }
        });
      });

      parseAddressComponents(response);
    } catch (error) {
      console.error("Reverse geocoding error:", error);
    }
  };

  const parseAddressComponents = (place) => {
    const components = place.address_components || [];
    const newAddressData = {
      street: "",
      area: "",
      city: "",
      state: "",
      pincode: "",
    };

    components.forEach((component) => {
      const types = component.types;

      if (types.includes("street_number") || types.includes("route")) {
        newAddressData.street += component.long_name + " ";
      } else if (
        types.includes("sublocality") ||
        types.includes("neighborhood")
      ) {
        newAddressData.area = component.long_name;
      } else if (types.includes("locality")) {
        newAddressData.city = component.long_name;
      } else if (types.includes("administrative_area_level_1")) {
        newAddressData.state = component.long_name;
      } else if (types.includes("postal_code")) {
        newAddressData.pincode = component.long_name;
      }
    });

    setFormData((prev) => ({
      ...prev,
      ...newAddressData,
      street: newAddressData.street.trim(),
    }));
  };

  const detectCurrentLocation = async () => {
    setIsDetectingLocation(true);
    try {
      const location = await getCurrentLocation();
      if (location) {
        updateMapLocation(location.lat, location.lng);
        reverseGeocode(location.lat, location.lng);
        toast.success("Location detected successfully!");
      }
    } catch (error) {
      toast.error("Failed to detect location. Please try again.");
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleTypeChange = (type) => {
    setFormData((prev) => ({ ...prev, type }));
    if (onTypeChange) {
      onTypeChange(type);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation
    if (!formData.street.trim()) {
      toast.error("Please enter street address");
      return;
    }
    if (!formData.city.trim()) {
      toast.error("Please enter city");
      return;
    }
    if (!formData.pincode.trim()) {
      toast.error("Please enter pincode");
      return;
    }
    if (!formData.coordinates.latitude || !formData.coordinates.longitude) {
      toast.error("Please select location on map");
      return;
    }

    mutation.mutate(formData);
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else if (onClose) {
      onClose();
    }
  };

  const addressTypes = [
    { id: "home", label: "Home", icon: FaHome, color: "#4CAF50" },
    { id: "work", label: "Work", icon: FaBriefcase, color: "#2196F3" },
    { id: "other", label: "Other", icon: FaMapPin, color: "#FF9800" },
  ];

  // NEW: Conditional rendering based on isModal prop
  const formContent = (
    <>
      <div className="modal-header">
        <h3>
          <FaMapMarkerAlt />
          {editingAddress ? "Edit Address" : "Add New Address"}
        </h3>
        <button onClick={handleCancel} className="close-btn">
          <FaTimes />
        </button>
      </div>

      <div className="modal-body">
        {/* Map Section */}
        <div className="map-section">
          <div className="map-header">
            <span>📍 Select Location on Map</span>
            <button
              type="button"
              onClick={detectCurrentLocation}
              className="detect-btn"
              disabled={isDetectingLocation || !isLocationAvailable}
            >
              <FaLocationArrow />
              {isDetectingLocation ? "Detecting..." : "Use Current Location"}
            </button>
          </div>
          <div className="map-container">
            <div ref={mapRef} className="google-map" />
            {!isGoogleMapsLoaded && (
              <div className="map-loading">
                <div className="loading-spinner"></div>
                <p>Loading Google Maps...</p>
              </div>
            )}
          </div>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="address-form">
          {/* Search Input */}
          <div className="search-section">
            <div className="form-group">
              <label htmlFor="search">🔍 Search Address</label>
              <input
                ref={autocompleteRef}
                type="text"
                placeholder="Search for your address..."
                className="search-input"
              />
            </div>
          </div>

          {/* Address Type Selection */}
          <div className="type-selection">
            <label>Address Type</label>
            <div className="type-buttons">
              {addressTypes.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => handleTypeChange(type.id)}
                  className={`type-btn ${
                    formData.type === type.id ? "active" : ""
                  }`}
                  style={{
                    borderColor:
                      formData.type === type.id ? type.color : "#e2e8f0",
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

          {/* Address Details */}
          <div className="address-details">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="street">Street Address *</label>
                <input
                  type="text"
                  id="street"
                  name="street"
                  value={formData.street}
                  onChange={handleInputChange}
                  placeholder="House/Flat/Office No, Building Name"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="area">Area/Locality</label>
                <input
                  type="text"
                  id="area"
                  name="area"
                  value={formData.area}
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
                  value={formData.landmark}
                  onChange={handleInputChange}
                  placeholder="Nearby landmark (optional)"
                />
              </div>
            </div>

            <div className="form-row">
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
                <label htmlFor="state">State</label>
                <input
                  type="text"
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  placeholder="State"
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
                  required
                />
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="contact-details">
            <h4>
              <FaUser /> Contact Details
            </h4>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="contactName">Contact Name</label>
                <input
                  type="text"
                  id="contactName"
                  name="contactName"
                  value={formData.contactName}
                  onChange={handleInputChange}
                  placeholder="Recipient name"
                />
              </div>
              <div className="form-group">
                <label htmlFor="contactPhone">Contact Phone</label>
                <input
                  type="tel"
                  id="contactPhone"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleInputChange}
                  placeholder="Contact phone number"
                  pattern="[0-9]{10}"
                />
              </div>
            </div>
          </div>

          {/* Default Address Checkbox */}
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

          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="button"
              onClick={handleCancel}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={mutation.isLoading}
            >
              <FaSave />
              {mutation.isLoading
                ? "Saving..."
                : editingAddress
                  ? "Update Address"
                  : "Save Address"}
            </button>
          </div>
        </form>
      </div>
    </>
  );

  // NEW: Return different wrappers based on isModal prop
  if (isModal) {
    return (
      <div className="address-form-modal">
        <div className="modal-overlay" onClick={handleCancel} />
        <div className="modal-content">{formContent}</div>
      </div>
    );
  } else {
    return (
      <div className="address-form-inline">
        <div className="inline-content">{formContent}</div>
      </div>
    );
  }
};

export default GoogleMapsAddressForm;
