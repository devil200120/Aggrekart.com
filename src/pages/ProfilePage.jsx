import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { usersAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import AddressManager from "../components/address/AddressManager";
import OrdersPage from "./OrdersPage";
import WishlistPage from "./WishlistPage";
import SettingsPage from "./SettingsPage";
import toast from "react-hot-toast";
import {
  FaUser,
  FaMapMarkerAlt,
  FaShoppingBag,
  FaCog,
  FaEdit,
  FaSave,
  FaTimes,
  FaPhone,
  FaEnvelope,
  FaCalendar,
  FaMapPin,
  FaBox,
  FaBell,
  FaLock,
  FaHeart,
  FaHistory,
} from "react-icons/fa";
import "./ProfilePage.css";

const ProfilePage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    dateOfBirth: "",
  });
  const [editingAddress, setEditingAddress] = useState(null);

  const queryClient = useQueryClient();

  // Fetch user profile data
  const {
    data: userProfile,
    isLoading,
    refetch,
  } = useQuery("userProfile", usersAPI.getProfile, {
    onSuccess: (data) => {
      if (data?.data?.user) {
        const userData = data.data.user;
        setProfileData({
          name: userData.name || "",
          email: userData.email || "",
          phone: userData.phone || "",
          dateOfBirth: userData.dateOfBirth
            ? new Date(userData.dateOfBirth).toISOString().split("T")[0]
            : "",
        });
      }
    },
    onError: (error) => {
      console.error("Profile fetch error:", error);
      toast.error("Failed to load profile data");
    },
  });

  const updateAddressMutation = useMutation(
    ({ addressId, data }) => {
      console.log("🔄 Updating address:", { addressId, data });
      return usersAPI.updateAddress(addressId, data);
    },
    {
      onSuccess: (response) => {
        console.log("✅ Address updated successfully:", response);
        toast.success("Address updated successfully!");
        // Close any edit modals and refresh data
        setEditingAddress(null);
        queryClient.invalidateQueries(["userProfile"]);
        queryClient.invalidateQueries(["userAddresses"]);
      },
      onError: (error) => {
        console.error("❌ Address update failed:", error);

        const errorData = error?.response?.data;
        let errorMessage = "Failed to update address";

        if (errorData?.debug?.availableAddresses) {
          console.log(
            "📍 Available addresses:",
            errorData.debug.availableAddresses
          );
          errorMessage = `Address not found. Please refresh the page and try again.`;
        } else if (errorData?.message) {
          errorMessage = errorData.message;
        }

        toast.error(errorMessage);
      },
    }
  );

  // Add this function to handle address updates
  const handleUpdateAddress = (addressId, formData) => {
    console.log("📝 Updating address:", { addressId, formData });

    if (!addressId) {
      toast.error("Invalid address ID");
      return;
    }

    updateAddressMutation.mutate({
      addressId,
      data: formData,
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveProfile = async () => {
    try {
      await usersAPI.updateProfile(profileData);
      toast.success("Profile updated successfully!");
      setIsEditing(false);
      refetch();
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error("Failed to update profile");
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset to original data
    if (userProfile?.data?.user) {
      const userData = userProfile.data.user;
      setProfileData({
        name: userData.name || "",
        email: userData.email || "",
        phone: userData.phone || "",
        dateOfBirth: userData.dateOfBirth
          ? new Date(userData.dateOfBirth).toISOString().split("T")[0]
          : "",
      });
    }
  };

  const tabs = [
    {
      id: "profile",
      label: "Profile Info",
      icon: FaUser,
      description: "Personal information and account details",
    },
    {
      id: "addresses",
      label: "Addresses",
      icon: FaMapMarkerAlt,
      description: "Manage delivery addresses",
    },
    {
      id: "orders",
      label: "Orders",
      icon: FaShoppingBag,
      description: "Order history and tracking",
    },
    {
      id: "wishlist",
      label: "Wishlist",
      icon: FaHeart,
      description: "Saved items and favorites",
    },
    {
      id: "settings",
      label: "Settings",
      icon: FaCog,
      description: "Account preferences and security",
    },
  ];

  if (isLoading) {
    return (
      <div className="profile-page">
        <div className="profile-container">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        {/* Profile Header */}
        <div className="profile-header">
          <div className="profile-avatar">
            <div className="avatar-circle">
              <FaUser />
            </div>
            <div className="avatar-status">
              <div className="status-dot online"></div>
            </div>
          </div>
          <div className="profile-info">
            <h1>{userProfile?.data?.user?.name || "User"}</h1>
            <p className="profile-email">
              <FaEnvelope />
              {userProfile?.data?.user?.email}
            </p>
            <p className="member-since">
              <FaCalendar />
              Member since{" "}
              {new Date(
                userProfile?.data?.user?.createdAt
              ).toLocaleDateString()}
            </p>
            <div className="profile-stats">
              <div className="stat-item">
                <span className="stat-number">0</span>
                <span className="stat-label">Orders</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">0</span>
                <span className="stat-label">Addresses</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">0</span>
                <span className="stat-label">Wishlist</span>
              </div>
            </div>
          </div>
          <div className="profile-actions">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="btn btn-primary"
              >
                <FaEdit />
                Edit Profile
              </button>
            ) : (
              <div className="edit-actions">
                <button onClick={handleSaveProfile} className="btn btn-success">
                  <FaSave />
                  Save
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="btn btn-secondary"
                >
                  <FaTimes />
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="profile-navigation">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`nav-tab ${activeTab === tab.id ? "active" : ""}`}
              title={tab.description}
            >
              <tab.icon />
              <span className="nav-label">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="profile-content">
          {activeTab === "profile" && (
            <div className="profile-tab">
              <div className="tab-header">
                <h2>Personal Information</h2>
                <p>Manage your personal details and account settings</p>
              </div>

              <div className="profile-form">
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="name">Full Name</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={profileData.name}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">Email Address</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={profileData.email}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="Enter your email"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="phone">Phone Number</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={profileData.phone}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="Enter your phone number"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="dateOfBirth">Date of Birth</label>
                    <input
                      type="date"
                      id="dateOfBirth"
                      name="dateOfBirth"
                      value={profileData.dateOfBirth}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "addresses" && (
            <div className="addresses-tab">
              <div className="tab-header">
                <h2>
                  <FaMapPin />
                  Saved Addresses
                </h2>
                <p>
                  Manage your delivery addresses with Google Maps integration
                </p>
              </div>

              {/* Using existing AddressManager component */}
              <AddressManager
                onUpdateAddress={handleUpdateAddress}
                setEditingAddress={setEditingAddress}
                editingAddress={editingAddress}
              />
            </div>
          )}

          {activeTab === "orders" && (
            <div className="orders-tab">
              <div className="tab-header">
                <h2>
                  <FaShoppingBag />
                  Order History
                </h2>
                <p>View and track your past orders</p>
              </div>

              {/* Using existing OrdersPage component */}
              <div className="embedded-page">
                <OrdersPage />
              </div>
            </div>
          )}

          {activeTab === "wishlist" && (
            <div className="wishlist-tab">
              <div className="tab-header">
                <h2>
                  <FaHeart />
                  My Wishlist
                </h2>
                <p>Items you've saved for later</p>
              </div>

              {/* Using existing WishlistPage component */}
              <div className="embedded-page">
                <WishlistPage />
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="settings-tab">
              <div className="tab-header">
                <h2>
                  <FaCog />
                  Account Settings
                </h2>
                <p>Manage your account preferences and security settings</p>
              </div>

              {/* Using existing SettingsPage component */}
              <div className="embedded-page">
                <SettingsPage />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
