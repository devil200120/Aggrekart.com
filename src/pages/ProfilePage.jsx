import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { usersAPI } from "../services/api";
import loyaltyService from "../services/loyaltyService";
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
  FaHeart,
  FaGift,
  FaWallet,
  FaChevronRight,
  FaStar,
  FaCrown,
  FaPlus,
  FaMedal,
  FaTrophy,
} from "react-icons/fa";
import { MdVerified, MdLocationOn } from "react-icons/md";
import { HiOutlineHeart } from "react-icons/hi";
import { BiWallet, BiCoin } from "react-icons/bi";
import "./ProfilePage.css";

const ProfilePage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("addresses");
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

  // Fetch loyalty dashboard data with real-time calculations using loyaltyService
  const {
    data: loyaltyData,
    isLoading: loyaltyLoading,
    refetch: refetchLoyalty,
  } = useQuery("loyaltyDashboard", loyaltyService.getUserLoyaltyDashboard, {
    staleTime: 1 * 60 * 1000, // 1 minute - frequent updates for dynamic data
    refetchInterval: 2 * 60 * 1000, // Auto-refresh every 2 minutes
  });

  // Fetch membership progress data using loyaltyService
  const { data: progressData, isLoading: progressLoading } = useQuery(
    "membershipProgress",
    loyaltyService.getUserMembershipProgress,
    {
      staleTime: 1 * 60 * 1000,
      refetchInterval: 2 * 60 * 1000,
    }
  );

  const updateAddressMutation = useMutation(
    ({ addressId, data }) => {
      return usersAPI.updateAddress(addressId, data);
    },
    {
      onSuccess: (response) => {
        toast.success("Address updated successfully!");
        setEditingAddress(null);
        queryClient.invalidateQueries(["userProfile"]);
        queryClient.invalidateQueries(["userAddresses"]);
      },
      onError: (error) => {
        const errorData = error?.response?.data;
        let errorMessage = "Failed to update address";
        if (errorData?.message) {
          errorMessage = errorData.message;
        }
        toast.error(errorMessage);
      },
    }
  );

  // Dynamic Membership Tier Logic with Real Loyalty Data
  const getMembershipInfo = (userData) => {
    // Use loyalty data first, then fallback to user data
    const currentTier =
      loyaltyData?.data?.membership?.currentTier ||
      progressData?.data?.currentTier ||
      userData?.membershipTier ||
      "silver";

    const orderCount =
      loyaltyData?.data?.customerMetrics?.totalOrders ||
      progressData?.data?.userStats?.totalOrders ||
      userData?.orderCount ||
      0;

    const totalOrderValue =
      loyaltyData?.customerMetrics?.totalSpent || // ✅ Remove .data wrapper
      progressData?.customerMetrics?.totalSpent || // ✅ Remove .data wrapper
      userData?.totalOrderValue ||
      0;

    const aggreCoins =
      loyaltyData?.aggreCoins?.balance || // ✅ Remove .data wrapper
      progressData?.aggreCoins?.balance || // ✅ Remove .data wrapper
      userData?.aggreCoins ||
      0;

    // Define membership tiers with requirements (matching backend logic)
    const tierInfo = {
      silver: {
        displayName: "Silver",
        icon: FaMedal,
        color: "#c0c0c0",
        bgColor: "linear-gradient(135deg, #c0c0c0, #a8a8a8)",
        benefits: [
          "1x AggreCoins multiplier",
          "Basic customer support",
          "Standard delivery speed",
          "Access to regular promotions",
        ],
        nextTier: "gold",
        requirements: { orders: 0, spending: 0 },
      },
      gold: {
        displayName: "Gold",
        icon: FaCrown,
        color: "#ffd700",
        bgColor: "linear-gradient(135deg, #ffd700, #ffb300)",
        benefits: [
          "1.5x AggreCoins multiplier",
          "Priority customer support",
          "Faster delivery speed",
          "Exclusive gold member deals",
          "Free delivery on orders above ₹1500",
        ],
        nextTier: "platinum",
        requirements: { orders: 20, spending: 50000 },
      },
      platinum: {
        displayName: "Platinum",
        icon: FaTrophy,
        color: "#e5e4e2",
        bgColor: "linear-gradient(135deg, #e5e4e2, #c9c9c9)",
        benefits: [
          "2x AggreCoins multiplier",
          "24/7 VIP customer support",
          "Express delivery",
          "Platinum exclusive deals",
          "Free delivery on all orders",
          "Early access to new products",
        ],
        nextTier: null,
        requirements: { orders: 50, spending: 200000 },
      },
    };

    const currentTierInfo = tierInfo[currentTier];

    // Get progress data from membership/progress endpoint
    // Lines 196-199 - Fix progress data access
    const progress =
      progressData?.progress || // ✅ Remove .data wrapper
      loyaltyData?.membership?.tierProgress; // ✅ Remove .data wrapper

    let progressPercentage = 100;
    let nextTierRequirements = null;

    if (currentTierInfo.nextTier && !progress?.isMaxTier) {
      // Use real progress data from backend
      // Lines 206-208 - Fix nested progress access
      const ordersProgress = progress?.ordersProgress || 0; // ✅ Remove extra .progress
      const spendingProgress = progress?.spendingProgress || 0; // ✅ Remove extra .progress
      progressPercentage = Math.max(ordersProgress, spendingProgress);

      // Lines 211-214 - Fix requirements access
      nextTierRequirements = {
        ordersNeeded: progress?.ordersNeeded || 0, // ✅ Remove extra .progress
        spendingNeeded: progress?.spendingNeeded || 0, // ✅ Remove extra .progress
        nextTierName:
          currentTierInfo.nextTier.charAt(0).toUpperCase() +
          currentTierInfo.nextTier.slice(1),
      };
    } else if (progress?.isMaxTier || currentTier === "platinum") {
      progressPercentage = 100;
      nextTierRequirements = null;
    }

    return {
      ...currentTierInfo,
      tier: currentTier,
      progress: progressPercentage,
      nextTierRequirements,
      currentStats: {
        orders: orderCount,
        spending: totalOrderValue,
        coins: aggreCoins,
      },
    };
  };

  const handleUpdateAddress = (addressId, formData) => {
    if (!addressId) {
      toast.error("Invalid address ID");
      return;
    }
    updateAddressMutation.mutate({ addressId, data: formData });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    try {
      await usersAPI.updateProfile(profileData);
      toast.success("Profile updated successfully!");
      setIsEditing(false);
      refetch();
    } catch (error) {
      toast.error("Failed to update profile");
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
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

  // Manual refresh function for loyalty data
  const handleRefresh = () => {
    refetchLoyalty();
  };

  if (isLoading || loyaltyLoading || progressLoading) {
    return (
      <div className="mobile-profile-app">
        <div className="mobile-container">
          <div className="mobile-loading">
            <div className="loading-spinner-mobile">
              <div className="dot-one"></div>
              <div className="dot-two"></div>
              <div className="dot-three"></div>
            </div>
            <p className="loading-text-mobile">Loading your profile...</p>
          </div>
        </div>
      </div>
    );
  }

  const userData = userProfile?.data?.user;
  const membershipInfo = getMembershipInfo(userData);
  const MembershipIcon = membershipInfo.icon;

  return (
    <div className="mobile-profile-app">
      <div className="mobile-container">
        {/* Mobile Profile Header */}
        <div className="mobile-profile-header">
          <div className="mobile-avatar-section">
            <div className="mobile-avatar-circle">
              <FaUser className="mobile-avatar-icon" />
              <div className="mobile-online-indicator"></div>
            </div>
          </div>

          <div className="mobile-user-info">
            <div className="mobile-name-section">
              <h1 className="mobile-username">
                {userData?.name || loyaltyData?.data?.user?.name || "User"}
                <MdVerified className="mobile-verified" />
              </h1>
              <div
                className="mobile-member-badge dynamic-member-badge"
                style={{ background: membershipInfo.bgColor }}
              >
                <MembershipIcon />
                <span>{membershipInfo.displayName} Member</span>
              </div>
            </div>

            <div className="mobile-contact-details">
              <div className="mobile-contact-row">
                <FaEnvelope className="mobile-contact-icon" />
                <span>{userData?.email || loyaltyData?.data?.user?.email}</span>
              </div>
              {profileData.phone && (
                <div className="mobile-contact-row">
                  <FaPhone className="mobile-contact-icon" />
                  <span>{profileData.phone}</span>
                </div>
              )}
              <div className="mobile-contact-row">
                <FaCalendar className="mobile-contact-icon" />
                <span>
                  Joined{" "}
                  {new Date(userData?.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>

            {/* Dynamic Membership Progress */}
            {membershipInfo.nextTierRequirements && (
              <div className="mobile-membership-progress">
                <div className="progress-header">
                  <span className="progress-label">
                    Progress to{" "}
                    {membershipInfo.nextTierRequirements.nextTierName}
                  </span>
                  <span className="progress-percentage">
                    {Math.floor(membershipInfo.progress)}%
                  </span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${membershipInfo.progress}%` }}
                  ></div>
                </div>
                <div className="progress-requirements">
                  {membershipInfo.nextTierRequirements.ordersNeeded > 0 && (
                    <span>
                      {membershipInfo.nextTierRequirements.ordersNeeded} more
                      orders
                    </span>
                  )}
                  {membershipInfo.nextTierRequirements.spendingNeeded > 0 && (
                    <span>
                      {membershipInfo.nextTierRequirements.ordersNeeded > 0 &&
                        " • "}
                      ₹
                      {membershipInfo.nextTierRequirements.spendingNeeded.toLocaleString()}{" "}
                      more spending
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Max Tier Message */}
            {!membershipInfo.nextTierRequirements &&
              membershipInfo.tier === "platinum" && (
                <div className="mobile-max-tier-message">
                  <FaTrophy className="trophy-icon" />
                  <span>You've reached the highest tier!</span>
                </div>
              )}
          </div>

          <div className="mobile-edit-section">
            {!isEditing ? (
              <div className="mobile-edit-actions">
                <button
                  onClick={() => setIsEditing(true)}
                  className="mobile-edit-btn"
                >
                  <FaEdit />
                  <span>Edit</span>
                </button>
                <button
                  onClick={handleRefresh}
                  className="mobile-refresh-btn"
                  title="Refresh loyalty data"
                >
                  <FaGift />
                  <span>Refresh</span>
                </button>
              </div>
            ) : (
              <div className="mobile-edit-actions">
                <button onClick={handleSaveProfile} className="mobile-save-btn">
                  <FaSave />
                  <span>Save</span>
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="mobile-cancel-btn"
                >
                  <FaTimes />
                  <span>Cancel</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Stats Grid - Now showing real dynamic data */}
        <div className="mobile-stats-grid">
          <div className="mobile-stat-card">
            <div className="mobile-stat-icon orders-bg">
              <FaShoppingBag />
            </div>
            <div className="mobile-stat-content">
              <span className="mobile-stat-number">
                {membershipInfo.currentStats.orders}
              </span>
              <span className="mobile-stat-label">Orders</span>
            </div>
          </div>

          <div className="mobile-stat-card">
            <div className="mobile-stat-icon addresses-bg">
              <MdLocationOn />
            </div>
            <div className="mobile-stat-content">
              <span className="mobile-stat-number">
                {userData?.addresses?.length || 0}
              </span>
              <span className="mobile-stat-label">Addresses</span>
            </div>
          </div>

          <div className="mobile-stat-card">
            <div className="mobile-stat-icon favourites-bg">
              <HiOutlineHeart />
            </div>
            <div className="mobile-stat-content">
              <span className="mobile-stat-number">0</span>
              <span className="mobile-stat-label">Favourites</span>
            </div>
          </div>

          <div className="mobile-stat-card">
            <div className="mobile-stat-icon coins-bg">
              <BiCoin />
            </div>
            <div className="mobile-stat-content">
              <span className="mobile-stat-number">
                {membershipInfo.currentStats.coins}
              </span>
              <span className="mobile-stat-label">AggreCoins</span>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="mobile-nav-tabs">
          <button
            onClick={() => setActiveTab("profile")}
            className={`mobile-nav-btn ${activeTab === "profile" ? "nav-active" : ""}`}
          >
            <FaUser />
            <span>Account</span>
          </button>
          <button
            onClick={() => setActiveTab("addresses")}
            className={`mobile-nav-btn ${activeTab === "addresses" ? "nav-active" : ""}`}
          >
            <MdLocationOn />
            <span>Addresses</span>
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`mobile-nav-btn ${activeTab === "orders" ? "nav-active" : ""}`}
          >
            <FaShoppingBag />
            <span>Orders</span>
          </button>
          <button
            onClick={() => setActiveTab("wishlist")}
            className={`mobile-nav-btn ${activeTab === "wishlist" ? "nav-active" : ""}`}
          >
            <FaHeart />
            <span>Favourites</span>
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`mobile-nav-btn ${activeTab === "settings" ? "nav-active" : ""}`}
          >
            <FaCog />
            <span>Settings</span>
          </button>
        </div>

        {/* Mobile Content Area */}
        <div className="mobile-content-area">
          {activeTab === "profile" && (
            <div className="mobile-profile-content">
              <div className="mobile-section-header">
                <h3>Account Information</h3>
                <p>Manage your personal information</p>
              </div>

              <div className="mobile-form-section">
                <div className="mobile-input-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={profileData.name}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="mobile-input"
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="mobile-input-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={profileData.email}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="mobile-input"
                    placeholder="Enter your email"
                  />
                </div>

                <div className="mobile-input-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="mobile-input"
                    placeholder="Enter your phone number"
                  />
                </div>

                <div className="mobile-input-group">
                  <label>Date of Birth</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={profileData.dateOfBirth}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="mobile-input"
                  />
                </div>
              </div>

              {/* Dynamic Benefits Section with Real Data */}
              <div className="mobile-benefits-section">
                <h4>Your {membershipInfo.displayName} Benefits</h4>
                <div className="mobile-benefit-cards">
                  <div className="mobile-benefit-card membership-benefits">
                    <div
                      className="mobile-benefit-icon"
                      style={{ background: membershipInfo.bgColor }}
                    >
                      <MembershipIcon />
                    </div>
                    <div className="mobile-benefit-info">
                      <h5>{membershipInfo.displayName} Membership</h5>
                      <ul className="benefits-list">
                        {membershipInfo.benefits.map((benefit, index) => (
                          <li key={index}>{benefit}</li>
                        ))}
                      </ul>
                      <div className="mobile-benefit-status membership-status">
                        <span>{membershipInfo.displayName} Member</span>
                      </div>
                    </div>
                  </div>

                  <div className="mobile-benefit-card">
                    <div className="mobile-benefit-icon coins-bg">
                      <BiCoin />
                    </div>
                    <div className="mobile-benefit-info">
                      <h5>AggreCoins Program</h5>
                      <p>
                        Earn coins on every purchase and redeem for discounts
                      </p>
                      <div className="mobile-benefit-status active">
                        <span>Active</span>
                        <span className="points">
                          {membershipInfo.currentStats.coins} coins
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Real-time Stats Display */}
                <div className="mobile-loyalty-stats">
                  <h4>Your Loyalty Stats</h4>
                  <div className="mobile-stats-cards">
                    <div className="mobile-stats-card">
                      <span className="stats-number">
                        {membershipInfo.currentStats.orders}
                      </span>
                      <span className="stats-label">Total Orders</span>
                    </div>
                    <div className="mobile-stats-card">
                      <span className="stats-number">
                        ₹{membershipInfo.currentStats.spending.toLocaleString()}
                      </span>
                      <span className="stats-label">Total Spent</span>
                    </div>
                    <div className="mobile-stats-card">
                      <span className="stats-number">
                        {loyaltyData?.aggreCoins?.totalEarned || 0}
                      </span>
                      <span className="stats-label">Coins Earned</span>
                    </div>
                    <div className="mobile-stats-card">
                      <span className="stats-number">
                        {loyaltyData?.aggreCoins?.totalRedeemed || 0}
                      </span>
                      <span className="stats-label">Coins Redeemed</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "addresses" && (
            <div className="mobile-addresses-content">
              <div className="mobile-section-header">
                <h3>Manage Addresses</h3>
                <p>Add and edit your delivery addresses</p>
              </div>

              <div className="mobile-address-summary">
                <div className="mobile-summary-item">
                  <span className="summary-number">
                    {userData?.addresses?.length || 0}
                  </span>
                  <span className="summary-text">Total</span>
                </div>
                <div className="mobile-summary-item">
                  <span className="summary-number">
                    {userData?.addresses?.filter((addr) => addr.type === "home")
                      .length || 0}
                  </span>
                  <span className="summary-text">Home</span>
                </div>
                <div className="mobile-summary-item">
                  <span className="summary-number">
                    {userData?.addresses?.filter((addr) => addr.type === "work")
                      .length || 0}
                  </span>
                  <span className="summary-text">Work</span>
                </div>
                <div className="mobile-summary-item">
                  <span className="summary-number">
                    {userData?.addresses?.filter(
                      (addr) => addr.type === "other"
                    ).length || 0}
                  </span>
                  <span className="summary-text">Other</span>
                </div>
              </div>

              <div className="mobile-add-address">
                <button className="mobile-add-btn">
                  <FaPlus />
                  <span>Add New Address</span>
                </button>
              </div>

              <div className="mobile-address-list">
                <AddressManager
                  onUpdateAddress={handleUpdateAddress}
                  setEditingAddress={setEditingAddress}
                  editingAddress={editingAddress}
                />
              </div>
            </div>
          )}

          {activeTab === "orders" && (
            <div className="mobile-orders-content">
              <div className="mobile-section-header">
                <h3>Your Orders</h3>
                <p>Track and reorder your favorite items</p>
              </div>
              <div className="mobile-orders-wrapper">
                <OrdersPage />
              </div>
            </div>
          )}

          {activeTab === "wishlist" && (
            <div className="mobile-wishlist-content">
              <div className="mobile-section-header">
                <h3>Your Favourites</h3>
                <p>Items you love and want to order again</p>
              </div>
              <div className="mobile-wishlist-wrapper">
                <WishlistPage />
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="mobile-settings-content">
              <div className="mobile-section-header">
                <h3>App Settings</h3>
                <p>Customize your app experience</p>
              </div>
              <div className="mobile-settings-wrapper">
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
