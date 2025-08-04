import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { usersAPI } from "../../services/api";
import AddressForm from "./AddressForm";
import toast from "react-hot-toast";
import {
  FaPlus,
  FaHome,
  FaBriefcase,
  FaMapMarkerAlt,
  FaEdit,
  FaTrash,
  FaStar,
  FaCheck,
  FaMapPin,
  FaPhone,
  FaUser,
  FaSpinner,
  FaExclamationTriangle,
  FaLocationArrow,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import "./AddressManager.css";

const AddressManager = () => {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [selectedAddresses, setSelectedAddresses] = useState([]);
  const [viewMode, setViewMode] = useState("grid"); // grid or list
  const [filterType, setFilterType] = useState("all"); // all, home, work, other
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch user addresses
  const {
    data: addressesResponse,
    isLoading,
    error,
    refetch,
  } = useQuery("userAddresses", usersAPI.getAddresses, {
    retry: 3,
    refetchOnWindowFocus: false,
    onError: (error) => {
      console.error("Error fetching addresses:", error);
      toast.error("Failed to load addresses");
    },
  });

  // Delete address mutation
  const deleteAddressMutation = useMutation(
    (addressId) => usersAPI.deleteAddress(addressId),
    {
      onSuccess: () => {
        toast.success("Address deleted successfully!");
        queryClient.invalidateQueries("userAddresses");
      },
      onError: (error) => {
        console.error("Error deleting address:", error);
        toast.error("Failed to delete address");
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
        console.error("Error updating default address:", error);
        toast.error("Failed to update default address");
      },
    }
  );

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation(
    async (addressIds) => {
      const promises = addressIds.map((id) => usersAPI.deleteAddress(id));
      return Promise.all(promises);
    },
    {
      onSuccess: () => {
        toast.success("Selected addresses deleted successfully!");
        setSelectedAddresses([]);
        queryClient.invalidateQueries("userAddresses");
      },
      onError: (error) => {
        console.error("Error deleting addresses:", error);
        toast.error("Failed to delete selected addresses");
      },
    }
  );

  // Extract addresses from response
  const addresses = addressesResponse?.data?.addresses || [];

  // Filter and search addresses
  const filteredAddresses = addresses.filter((address) => {
    const matchesType = filterType === "all" || address.type === filterType;
    const matchesSearch =
      searchQuery === "" ||
      address.street.toLowerCase().includes(searchQuery.toLowerCase()) ||
      address.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      address.area.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesType && matchesSearch;
  });

  // Get address statistics
  const getAddressStats = () => {
    return {
      total: addresses.length,
      home: addresses.filter((addr) => addr.type === "home").length,
      work: addresses.filter((addr) => addr.type === "work").length,
      other: addresses.filter((addr) => addr.type === "other").length,
      default: addresses.filter((addr) => addr.isDefault).length,
    };
  };

  const stats = getAddressStats();

  const handleAddAddress = () => {
    setEditingAddress(null);
    setShowAddForm(true);
  };

  const handleEditAddress = (address) => {
    setEditingAddress(address);
    setShowAddForm(true);
  };

  const handleDeleteAddress = (addressId, addressType) => {
    const message = `Are you sure you want to delete this ${addressType} address?`;
    if (window.confirm(message)) {
      deleteAddressMutation.mutate(addressId);
    }
  };

  const handleBulkDelete = () => {
    if (selectedAddresses.length === 0) {
      toast.error("Please select addresses to delete");
      return;
    }

    const message = `Are you sure you want to delete ${selectedAddresses.length} selected address${selectedAddresses.length > 1 ? "es" : ""}?`;
    if (window.confirm(message)) {
      bulkDeleteMutation.mutate(selectedAddresses);
    }
  };

  const handleSetDefault = (addressId) => {
    setDefaultMutation.mutate(addressId);
  };

  const handleSelectAddress = (addressId) => {
    setSelectedAddresses((prev) => {
      if (prev.includes(addressId)) {
        return prev.filter((id) => id !== addressId);
      } else {
        return [...prev, addressId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedAddresses.length === filteredAddresses.length) {
      setSelectedAddresses([]);
    } else {
      setSelectedAddresses(filteredAddresses.map((addr) => addr._id));
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
        return "#10b981";
      case "work":
        return "#3b82f6";
      default:
        return "#f59e0b";
    }
  };

  const formatAddress = (address) => {
    const parts = [
      address.street,
      address.area,
      address.city,
      address.state,
      address.pincode,
    ].filter(Boolean);
    return parts.join(", ");
  };

  if (isLoading) {
    return (
      <div className="address-manager">
        <div className="loading-container">
          <FaSpinner className="loading-spinner spinning" />
          <p>Loading addresses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="address-manager">
        <div className="error-container">
          <FaExclamationTriangle className="error-icon" />
          <h3>Failed to load addresses</h3>
          <p>There was an error loading your addresses. Please try again.</p>
          <button onClick={() => refetch()} className="btn btn-primary">
            <FaLocationArrow />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="address-manager">
      {showAddForm ? (
        <AddressForm
          editingAddress={editingAddress}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      ) : (
        <>
          {/* Address Manager Header */}
          <div className="address-manager-header">
            <div className="header-stats">
              <div className="stat-card">
                <span className="stat-number">{stats.total}</span>
                <span className="stat-label">Total</span>
              </div>
              <div className="stat-card">
                <span className="stat-number">{stats.home}</span>
                <span className="stat-label">Home</span>
              </div>
              <div className="stat-card">
                <span className="stat-number">{stats.work}</span>
                <span className="stat-label">Work</span>
              </div>
              <div className="stat-card">
                <span className="stat-number">{stats.other}</span>
                <span className="stat-label">Other</span>
              </div>
            </div>

            <button onClick={handleAddAddress} className="add-address-btn">
              <FaPlus />
              Add New Address
            </button>
          </div>

          {/* Filters and Search */}
          <div className="address-controls">
            <div className="search-container">
              <input
                type="text"
                placeholder="Search addresses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="filter-controls">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Types</option>
                <option value="home">Home</option>
                <option value="work">Work</option>
                <option value="other">Other</option>
              </select>

              <div className="view-toggle">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`view-btn ${viewMode === "grid" ? "active" : ""}`}
                  title="Grid View"
                >
                  <FaMapPin />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`view-btn ${viewMode === "list" ? "active" : ""}`}
                  title="List View"
                >
                  <FaMapMarkerAlt />
                </button>
              </div>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedAddresses.length > 0 && (
            <div className="bulk-actions">
              <div className="bulk-info">
                <span>
                  {selectedAddresses.length} address
                  {selectedAddresses.length > 1 ? "es" : ""} selected
                </span>
              </div>
              <div className="bulk-buttons">
                <button
                  onClick={() => setSelectedAddresses([])}
                  className="btn btn-secondary"
                >
                  Clear Selection
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="btn btn-danger"
                  disabled={bulkDeleteMutation.isLoading}
                >
                  {bulkDeleteMutation.isLoading ? (
                    <FaSpinner className="spinning" />
                  ) : (
                    <FaTrash />
                  )}
                  Delete Selected
                </button>
              </div>
            </div>
          )}

          {/* Addresses List */}
          {filteredAddresses.length === 0 ? (
            <div className="no-addresses">
              <FaMapPin className="no-addresses-icon" />
              <h3>
                {searchQuery || filterType !== "all"
                  ? "No addresses match your filters"
                  : "No addresses found"}
              </h3>
              <p>
                {searchQuery || filterType !== "all"
                  ? "Try adjusting your search or filter criteria"
                  : "Add your first address to get started with faster deliveries"}
              </p>
              {!searchQuery && filterType === "all" && (
                <button onClick={handleAddAddress} className="btn btn-primary">
                  <FaPlus />
                  Add Your First Address
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Select All */}
              <div className="select-all-container">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={
                      selectedAddresses.length === filteredAddresses.length
                    }
                    onChange={handleSelectAll}
                  />
                  <span className="checkmark"></span>
                  Select All ({filteredAddresses.length})
                </label>
              </div>

              <div className={`addresses-container ${viewMode}`}>
                {filteredAddresses.map((address) => (
                  <div
                    key={address._id}
                    className={`address-card ${address.isDefault ? "default" : ""} ${selectedAddresses.includes(address._id) ? "selected" : ""}`}
                  >
                    {/* Selection Checkbox */}
                    <div className="address-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedAddresses.includes(address._id)}
                        onChange={() => handleSelectAddress(address._id)}
                      />
                    </div>

                    {/* Default Badge */}
                    {address.isDefault && (
                      <div className="default-badge">
                        <FaStar />
                        Default
                      </div>
                    )}

                    {/* Address Header */}
                    <div className="address-header">
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
                          onClick={() =>
                            handleDeleteAddress(address._id, address.type)
                          }
                          className="action-btn delete-btn"
                          title="Delete Address"
                          disabled={deleteAddressMutation.isLoading}
                        >
                          {deleteAddressMutation.isLoading ? (
                            <FaSpinner className="spinning" />
                          ) : (
                            <FaTrash />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Address Details */}
                    <div className="address-details">
                      <div className="address-text">
                        <div className="street-address">
                          {address.street}
                          {address.area && `, ${address.area}`}
                        </div>
                        <div className="city-details">
                          {address.city}, {address.state} {address.pincode}
                        </div>
                        {address.landmark && (
                          <div className="landmark">
                            <FaLocationArrow />
                            Near {address.landmark}
                          </div>
                        )}
                        <div className="full-address">
                          {formatAddress(address)}
                        </div>
                      </div>
                    </div>

                    {/* Contact Info */}
                    {(address.contactName || address.contactPhone) && (
                      <div className="contact-info">
                        {address.contactName && (
                          <div className="contact-item">
                            <FaUser />
                            <span>{address.contactName}</span>
                          </div>
                        )}
                        {address.contactPhone && (
                          <div className="contact-item">
                            <FaPhone />
                            <span>{address.contactPhone}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Coordinates Info */}
                    {address.coordinates && (
                      <div className="coordinates-info">
                        <small>
                          📍 {address.coordinates.latitude?.toFixed(4)},{" "}
                          {address.coordinates.longitude?.toFixed(4)}
                        </small>
                      </div>
                    )}

                    {/* Set Default Button */}
                    {!address.isDefault && (
                      <div className="set-default-section">
                        <button
                          onClick={() => handleSetDefault(address._id)}
                          className="set-default-btn"
                          disabled={setDefaultMutation.isLoading}
                        >
                          {setDefaultMutation.isLoading ? (
                            <FaSpinner className="spinning" />
                          ) : (
                            <FaCheck />
                          )}
                          Set as Default
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default AddressManager;
