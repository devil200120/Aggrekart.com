import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { suppliersAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import SupplierAddressManager from "../../components/supplier/SupplierAddressManager";
import ProfileToggle from "../../components/supplier/ProfileToggle"; // ADD THIS LINE

import toast from "react-hot-toast";
import {
  FaUser,
  FaMapMarkerAlt,
  FaEdit,
  FaSave,
  FaTimes,
  FaPhone,
  FaEnvelope,
  FaBuilding,
  FaMapPin,
  FaCog,
  FaFileInvoiceDollar,
  FaUserTie,
  FaBell,
  FaEye,
} from "react-icons/fa";
import "./SupplierProfilePage.css";

const SupplierProfilePage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [isAddressEditing, setIsAddressEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    contactPersonName: "",
    contactPersonNumber: "",
    businessNumber: "",
    email: "",
    bankDetails: {
      bankName: "",
      accountNumber: "",
      ifscCode: "",
      branchName: "",
      upiId: "",
    },
  });

  const queryClient = useQueryClient();

  // Fetch supplier profile data
  const {
    data: supplierProfile,
    isLoading,
    refetch,
  } = useQuery("supplierProfile", suppliersAPI.getProfile, {
    onSuccess: (data) => {
      if (data?.data?.supplier) {
        const supplierData = data.data.supplier;
        setProfileData({
          contactPersonName: supplierData.contactPersonName || "",
          contactPersonNumber: supplierData.contactPersonNumber || "",
          businessNumber: supplierData.businessNumber || "",
          email: supplierData.email || "",
          bankDetails: {
            bankName: supplierData.bankDetails?.bankName || "",
            accountNumber: supplierData.bankDetails?.accountNumber || "",
            ifscCode: supplierData.bankDetails?.ifscCode || "",
            branchName: supplierData.bankDetails?.branchName || "",
            upiId: supplierData.bankDetails?.upiId || "",
          },
        });
      }
    },
    onError: (error) => {
      console.error("Supplier profile fetch error:", error);
      toast.error("Failed to load profile data");
    },
  });

  const updateProfileMutation = useMutation(
    (data) => suppliersAPI.updateProfile(data),
    {
      onSuccess: (response) => {
        console.log("✅ Profile updated successfully:", response);
        toast.success("Profile updated successfully!");
        setIsEditing(false);
        refetch();
      },
      onError: (error) => {
        console.error("❌ Profile update failed:", error);
        const errorMessage =
          error?.response?.data?.message || "Failed to update profile";
        toast.error(errorMessage);
      },
    }
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith("bankDetails.")) {
      const bankField = name.split(".")[1];
      setProfileData((prev) => ({
        ...prev,
        bankDetails: {
          ...prev.bankDetails,
          [bankField]: value,
        },
      }));
    } else {
      setProfileData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSaveProfile = async () => {
    try {
      await updateProfileMutation.mutateAsync(profileData);
    } catch (error) {
      console.error("Profile update error:", error);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset to original data
    if (supplierProfile?.data?.supplier) {
      const supplierData = supplierProfile.data.supplier;
      setProfileData({
        contactPersonName: supplierData.contactPersonName || "",
        contactPersonNumber: supplierData.contactPersonNumber || "",
        businessNumber: supplierData.businessNumber || "",
        email: supplierData.email || "",
        bankDetails: {
          bankName: supplierData.bankDetails?.bankName || "",
          accountNumber: supplierData.bankDetails?.accountNumber || "",
          ifscCode: supplierData.bankDetails?.ifscCode || "",
          branchName: supplierData.bankDetails?.branchName || "",
          upiId: supplierData.bankDetails?.upiId || "",
        },
      });
    }
  };

  if (isLoading) {
    return (
      <div className="supplier-profile-loading">
        <div className="loading-spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  const supplier = supplierProfile?.data?.supplier;

  return (
    <div className="supplier-profile-page">
      <div className="profile-container">
        {/* Header */}
        <div className="profile-header">
          <div className="profile-header-content">
            <div className="profile-avatar">
              <FaBuilding size={60} />
            </div>
            <div className="profile-info">
              <h1>{supplier?.companyName || "Company Name"}</h1>
              <p className="profile-subtitle">
                {supplier?.supplierId} •{" "}
                {supplier?.categories?.join(", ") || "No categories"}
              </p>
              <div className="profile-status">
                <span
                  className={`status-badge ${
                    supplier?.isApproved ? "approved" : "pending"
                  }`}
                >
                  {supplier?.isApproved ? "Approved" : "Pending Approval"}
                </span>
                <span
                  className={`status-badge ${
                    supplier?.isActive ? "active" : "inactive"
                  }`}
                >
                  {supplier?.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="nav-content">
          {/* Navigation Tabs */}
          <div className="profile-nav">
            <button
              className={`nav-tab ${activeTab === "profile" ? "active" : ""}`}
              onClick={() => setActiveTab("profile")}
            >
              <FaUser />
              Profile Details
            </button>
            <button
              className={`nav-tab ${activeTab === "address" ? "active" : ""}`}
              onClick={() => setActiveTab("address")}
            >
              <FaMapMarkerAlt />
              Address & Location
            </button>
            <button
              className={`nav-tab ${activeTab === "bank" ? "active" : ""}`}
              onClick={() => setActiveTab("bank")}
            >
              <FaFileInvoiceDollar />
              Bank Details
            </button>
            <button
              className={`nav-tab ${activeTab === "settings" ? "active" : ""}`}
              onClick={() => setActiveTab("settings")}
            >
              <FaCog />
              Settings
            </button>
          </div>

          {/* Tab Content */}
          <div className="profile-content">
            {activeTab === "profile" && (
              <div className="profile-tab">
                <div className="tab-header">
                  <h2>
                    <FaUserTie />
                    Contact Information
                  </h2>
                  <button
                    className={`profile-edit-btn ${
                      isEditing ? "edit-btn-secondary" : "edit-btn-primary"
                    }`}
                    onClick={() => {
                      if (isEditing) {
                        handleCancelEdit();
                      } else {
                        setIsEditing(true);
                      }
                    }}
                  >
                    {isEditing ? (
                      <>
                        <FaTimes /> Cancel
                      </>
                    ) : (
                      <>
                        <FaEdit /> Edit Profile
                      </>
                    )}
                  </button>
                </div>

                <div className="profile-form">
                  <div className="profile-form-grid">
                    <div className="form-group">
                      <label className="form-label">
                        <FaUserTie />
                        Contact Person Name
                      </label>
                      <input
                        type="text"
                        name="contactPersonName"
                        className="form-input"
                        value={profileData.contactPersonName}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        placeholder="Enter contact person name"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        <FaPhone />
                        Contact Number
                      </label>
                      <input
                        type="tel"
                        name="contactPersonNumber"
                        className="form-input"
                        value={profileData.contactPersonNumber}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        placeholder="Enter contact number"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        <FaPhone />
                        Business Number
                      </label>
                      <input
                        type="tel"
                        name="businessNumber"
                        className="form-input"
                        value={profileData.businessNumber}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        placeholder="Enter business number"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        <FaEnvelope />
                        Email Address
                      </label>
                      <input
                        type="email"
                        name="email"
                        className="form-input"
                        value={profileData.email}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        placeholder="Enter email address"
                      />
                    </div>
                  </div>

                  {isEditing && (
                    <div className="form-actions">
                      <button
                        className="btn btn-primary"
                        onClick={handleSaveProfile}
                        disabled={updateProfileMutation.isLoading}
                      >
                        <FaSave />
                        {updateProfileMutation.isLoading
                          ? "Saving..."
                          : "Save Changes"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "address" && (
              <div className="address-tab">
                <div className="address-tab-header">
                  <h2>
                    <FaMapPin />
                    Address & Dispatch Location
                  </h2>
                  <p>
                    Update your business address and dispatch location with
                    Google Maps integration. Coordinates will be automatically
                    updated for nearby supplier detection.
                  </p>
                </div>

                <SupplierAddressManager
                  supplier={supplier}
                  onSuccess={refetch}
                  isEditing={isAddressEditing}
                  setIsEditing={setIsAddressEditing}
                />
              </div>
            )}

            {activeTab === "bank" && (
              <div className="bank-tab">
                <div className="tab-header">
                  <h2>
                    <FaFileInvoiceDollar />
                    Bank Account Details
                  </h2>
                  <p>Manage your bank account information for payments</p>
                </div>

                <div className="bank-form">
                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">Bank Name</label>
                      <input
                        type="text"
                        name="bankDetails.bankName"
                        className="form-input"
                        value={profileData.bankDetails.bankName}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        placeholder="Enter bank name"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Account Number</label>
                      <input
                        type="text"
                        name="bankDetails.accountNumber"
                        className="form-input"
                        value={profileData.bankDetails.accountNumber}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        placeholder="Enter account number"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">IFSC Code</label>
                      <input
                        type="text"
                        name="bankDetails.ifscCode"
                        className="form-input"
                        value={profileData.bankDetails.ifscCode}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        placeholder="Enter IFSC code"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Branch Name</label>
                      <input
                        type="text"
                        name="bankDetails.branchName"
                        className="form-input"
                        value={profileData.bankDetails.branchName}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        placeholder="Enter branch name"
                      />
                    </div>

                    <div className="form-group col-span-2">
                      <label className="form-label">UPI ID (Optional)</label>
                      <input
                        type="text"
                        name="bankDetails.upiId"
                        className="form-input"
                        value={profileData.bankDetails.upiId}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        placeholder="Enter UPI ID"
                      />
                    </div>
                  </div>

                  {isEditing && (
                    <div className="form-actions">
                      <button
                        className="btn btn-primary"
                        onClick={handleSaveProfile}
                        disabled={updateProfileMutation.isLoading}
                      >
                        <FaSave />
                        {updateProfileMutation.isLoading
                          ? "Updating..."
                          : "Update Bank Details"}
                      </button>
                    </div>
                  )}
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
                  <p>Manage your account preferences and notifications</p>
                </div>

                <div className="ac-settings-content">
                  <div className="setting-group">
                    <h3>
                      <FaBell />
                      Notifications
                    </h3>
                    <div className="ac-setting-item">
                        <input type="checkbox" disabled />
                      <label className="setting-label">
                        Email notifications for new orders
                      </label>
                    </div>
                    <div className="ac-setting-item">
                        <input type="checkbox" disabled />
                      <label className="setting-label">
                        SMS notifications for urgent updates
                      </label>
                    </div>
                  </div>

                  <div className="setting-group">
                    <h3>Account Information</h3>
                    <div className="info-grid">
                      <div className="info-item">
                        <strong>Supplier ID:</strong> {supplier?.supplierId}
                      </div>
                      <div className="info-item">
                        <strong>GST Number:</strong> {supplier?.gstNumber}
                      </div>
                      <div className="info-item">
                        <strong>Member Since:</strong>{" "}
                        {supplier?.createdAt
                          ? new Date(supplier.createdAt).toLocaleDateString()
                          : "N/A"}
                      </div>
                      <div className="info-item">
                        <strong>Status:</strong>{" "}
                        {supplier?.isApproved ? "Approved" : "Pending Approval"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ADD THIS NEW SECTION AFTER LINE 510 */}
            {activeTab === "visibility" && (
              <div className="tab-content">
                <div className="tab-header">
                  <h2>
                    <FaEye />
                    Profile Visibility Control
                  </h2>
                  <p>
                    Manage when customers can see your products and business
                    profile
                  </p>
                </div>
                <ProfileToggle />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplierProfilePage;
