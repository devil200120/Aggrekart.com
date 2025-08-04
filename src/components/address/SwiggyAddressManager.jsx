import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { usersAPI } from "../../services/api";
import GoogleMapsAddressForm from "./GoogleMapsAddressForm";
import toast from "react-hot-toast";
import {
  FaPlus,
  FaMapMarkerAlt,
  FaHome,
  FaBriefcase,
  FaMapPin,
  FaEdit,
  FaTrash,
  FaStar,
  FaCheck,
} from "react-icons/fa";
import "./SwiggyAddressManager.css";

const SwiggyAddressManager = () => {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [selectedAddressType, setSelectedAddressType] = useState("home");

  // Fetch addresses
  const { data: addressesData, isLoading } = useQuery(
    "userAddresses",
    usersAPI.getAddresses,
    {
      onError: (error) => {
        toast.error("Failed to load addresses");
        console.error("Error fetching addresses:", error);
      },
    }
  );

  // Delete address mutation
  const deleteAddressMutation = useMutation(
    (addressId) => usersAPI.deleteAddress(addressId),
    {
      onSuccess: () => {
        toast.success("Address deleted successfully!");
        queryClient.invalidateQueries("userAddresses");
      },
      onError: (error) => {
        toast.error("Failed to delete address");
        console.error("Error deleting address:", error);
      },
    }
  );

  // Set default address mutation
  const setDefaultMutation = useMutation(
    (addressId) => usersAPI.updateAddress(addressId, { isDefault: true }),
    {
      onSuccess: () => {
        toast.success("Default address updated!");
        queryClient.invalidateQueries("userAddresses");
      },
      onError: (error) => {
        toast.error("Failed to update default address");
        console.error("Error updating default address:", error);
      },
    }
  );

  // FIX: Correctly extract addresses from the API response
  const addresses = addressesData?.data?.addresses || [];

  const handleAddAddress = () => {
    setEditingAddress(null);
    setShowAddForm(true);
  };

  const handleEditAddress = (address) => {
    setEditingAddress(address);
    setShowAddForm(true);
  };

  const handleDeleteAddress = (addressId) => {
    if (window.confirm("Are you sure you want to delete this address?")) {
      deleteAddressMutation.mutate(addressId);
    }
  };

  const handleSetDefault = (addressId) => {
    setDefaultMutation.mutate(addressId);
  };

  const getAddressIcon = (type) => {
    switch (type) {
      case "home":
        return <FaHome />;
      case "work":
        return <FaBriefcase />;
      default:
        return <FaMapMarkerAlt />;
    }
  };

  const getAddressTypeColor = (type) => {
    switch (type) {
      case "home":
        return "#4CAF50";
      case "work":
        return "#2196F3";
      default:
        return "#FF9800";
    }
  };

  const handleFormSuccess = () => {
    setShowAddForm(false);
    setEditingAddress(null);
    queryClient.invalidateQueries("userAddresses");
    toast.success(
      editingAddress
        ? "Address updated successfully!"
        : "Address added successfully!"
    );
  };

  const handleFormCancel = () => {
    setShowAddForm(false);
    setEditingAddress(null);
  };

  if (isLoading) {
    return (
      <div className="swiggy-address-manager">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading addresses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="swiggy-address-manager">
      <div className="address-header">
        <h2>Saved Addresses</h2>
        <p className="address-subtitle">
          Manage your delivery addresses for faster checkout
        </p>
      </div>

      {showAddForm ? (
        <div className="address-form-container">
          <GoogleMapsAddressForm
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
            editingAddress={editingAddress}
            selectedType={selectedAddressType}
            onTypeChange={setSelectedAddressType}
          />
        </div>
      ) : (
        <>
          <div className="add-address-section">
            <button onClick={handleAddAddress} className="add-address-btn">
              <FaPlus />
              Add New Address
            </button>
          </div>

          {/* Debug information (remove in production) */}
          <div style={{ display: "none" }}>
            <pre>{JSON.stringify({ addressesData, addresses }, null, 2)}</pre>
          </div>

          {!addresses || addresses.length === 0 ? (
            <div className="no-addresses">
              <FaMapPin className="no-addresses-icon" />
              <h3>No addresses found</h3>
              <p>
                Add your first address to get started with faster deliveries
              </p>
              <button onClick={handleAddAddress} className="btn btn-primary">
                <FaPlus />
                Add Your First Address
              </button>
            </div>
          ) : (
            <div className="addresses-grid">
              {addresses.map((address) => (
                <div
                  key={address._id}
                  className={`address-card ${address.isDefault ? "default" : ""}`}
                >
                  {address.isDefault && (
                    <div className="default-badge">
                      <FaStar />
                      Default
                    </div>
                  )}

                  <div className="address-header-card">
                    <div className="address-type">
                      <div
                        className="type-icon"
                        style={{ color: getAddressTypeColor(address.type) }}
                      >
                        {getAddressIcon(address.type)}
                      </div>
                      <span className="type-label">
                        {address.type.charAt(0).toUpperCase() +
                          address.type.slice(1)}
                      </span>
                    </div>

                    <div className="address-actions">
                      <button
                        onClick={() => handleEditAddress(address)}
                        className="action-btn edit-btn"
                        title="Edit Address"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDeleteAddress(address._id)}
                        className="action-btn delete-btn"
                        title="Delete Address"
                        disabled={deleteAddressMutation.isLoading}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>

                  <div className="address-details">
                    <div className="address-text">
                      <div className="street-address">
                        {address.street}, {address.area}
                      </div>
                      <div className="city-details">
                        {address.city}, {address.state} {address.pincode}
                      </div>
                      {address.landmark && (
                        <div className="landmark">Near {address.landmark}</div>
                      )}
                    </div>
                  </div>

                  {!address.isDefault && (
                    <div className="set-default-section">
                      <button
                        onClick={() => handleSetDefault(address._id)}
                        className="set-default-btn"
                        disabled={setDefaultMutation.isLoading}
                      >
                        <FaCheck />
                        Set as Default
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SwiggyAddressManager;
