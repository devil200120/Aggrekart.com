import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supplierAPI } from "../../services/api";
import GSTAutoFill from "../../components/supplier/GSTAutoFill";
import toast from "react-hot-toast";
import "./SupplierRegisterPage.css";

const SupplierRegisterPage = () => {
  const navigate = useNavigate();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    // Business Information
    businessName: "",
    businessType: "manufacturer",
    gstNumber: "",
    panNumber: "",
    businessRegistrationNumber: "",

    // Contact Information
    contactPersonName: "",
    email: "",
    phoneNumber: "",
    alternatePhone: "",

    // Business Address
    businessAddress: "",
    city: "",
    state: "",
    pincode: "",

    // Account Information
    password: "",
    confirmPassword: "",

    // Product Categories
    productCategories: [],

    // Business Details
    yearEstablished: "",
    numberOfEmployees: "",
    annualTurnover: "",

    // Banking Information
    bankAccountNumber: "",
    bankName: "",
    ifscCode: "",
    accountHolderName: "",

    // Agreements
    agreeToTerms: false,
    agreeToCommission: false,
  });
  const [errors, setErrors] = useState({});

  const businessTypes = [
    { value: "manufacturer", label: "Manufacturer" },
    { value: "distributor", label: "Distributor" },
    { value: "wholesaler", label: "Wholesaler" },
    { value: "retailer", label: "Retailer" },
    { value: "contractor", label: "Contractor" },
    { value: "supplier", label: "Supplier" },
  ];

  const productCategoriesOptions = [
    { value: "aggregate", label: "Aggregate (Stone, Metal, Dust)" },
    { value: "sand", label: "Sand (River Sand, M.Sand)" },
    { value: "tmt_steel", label: "TMT Steel & Reinforcement" },
    { value: "bricks_blocks", label: "Bricks & Blocks" },
    { value: "cement", label: "Cement" },
  ];

  const employeeRanges = [
    { value: "1-10", label: "1-10 employees" },
    { value: "11-50", label: "11-50 employees" },
    { value: "51-200", label: "51-200 employees" },
    { value: "201-500", label: "201-500 employees" },
    { value: "500+", label: "500+ employees" },
  ];

  const turnoverRanges = [
    { value: "under-1cr", label: "Under ₹1 Crore" },
    { value: "1-5cr", label: "₹1-5 Crores" },
    { value: "5-10cr", label: "₹5-10 Crores" },
    { value: "10-25cr", label: "₹10-25 Crores" },
    { value: "25cr+", label: "₹25+ Crores" },
  ];

  const indianStates = [
    { code: "01", name: "Jammu and Kashmir", gstCode: "01" },
    { code: "02", name: "Himachal Pradesh", gstCode: "02" },
    { code: "03", name: "Punjab", gstCode: "03" },
    { code: "04", name: "Chandigarh", gstCode: "04" },
    { code: "05", name: "Uttarakhand", gstCode: "05" },
    { code: "06", name: "Haryana", gstCode: "06" },
    { code: "07", name: "Delhi", gstCode: "07" },
    { code: "08", name: "Rajasthan", gstCode: "08" },
    { code: "09", name: "Uttar Pradesh", gstCode: "09" },
    { code: "10", name: "Bihar", gstCode: "10" },
    { code: "11", name: "Sikkim", gstCode: "11" },
    { code: "12", name: "Arunachal Pradesh", gstCode: "12" },
    { code: "13", name: "Nagaland", gstCode: "13" },
    { code: "14", name: "Manipur", gstCode: "14" },
    { code: "15", name: "Mizoram", gstCode: "15" },
    { code: "16", name: "Tripura", gstCode: "16" },
    { code: "17", name: "Meghalaya", gstCode: "17" },
    { code: "18", name: "Assam", gstCode: "18" },
    { code: "19", name: "West Bengal", gstCode: "19" },
    { code: "20", name: "Jharkhand", gstCode: "20" },
    { code: "21", name: "Odisha", gstCode: "21" },
    { code: "22", name: "Chhattisgarh", gstCode: "22" },
    { code: "23", name: "Madhya Pradesh", gstCode: "23" },
    { code: "24", name: "Gujarat", gstCode: "24" },
    { code: "25", name: "Daman and Diu", gstCode: "25" },
    { code: "26", name: "Dadra and Nagar Haveli", gstCode: "26" },
    { code: "27", name: "Maharashtra", gstCode: "27" },
    { code: "28", name: "Andhra Pradesh", gstCode: "28" },
    { code: "29", name: "Karnataka", gstCode: "29" },
    { code: "30", name: "Goa", gstCode: "30" },
    { code: "31", name: "Lakshadweep", gstCode: "31" },
    { code: "32", name: "Kerala", gstCode: "32" },
    { code: "33", name: "Tamil Nadu", gstCode: "33" },
    { code: "34", name: "Puducherry", gstCode: "34" },
    { code: "35", name: "Andaman and Nicobar Islands", gstCode: "35" },
    { code: "36", name: "Telangana", gstCode: "36" },
    { code: "37", name: "Andhra Pradesh (New)", gstCode: "37" },
    { code: "38", name: "Ladakh", gstCode: "38" },
  ];

  // Handle GST auto-fill data - FIXED FUNCTION NAME AND LOGIC
  // Replace the handleGSTAutoFill function (around line 131) with this enhanced version:

  // Handle GST auto-fill data - ENHANCED WITH DETAILED LOGGING
  const handleGSTAutoFill = (autoFillData) => {
    console.log("🔄 GST Auto-fill triggered");
    console.log("📥 Received auto-fill data:", autoFillData);
    console.log("📝 Current form data before auto-fill:", formData);

    setFormData((prev) => {
      const updatedData = {
        ...prev,
        // Core GST data
        gstNumber: autoFillData.gstNumber || prev.gstNumber,

        // FIXED: Correct field mapping
        businessName:
          autoFillData.businessName ||
          autoFillData.legalName ||
          prev.businessName,
        panNumber: autoFillData.panNumber || prev.panNumber,
        // Address data - FIXED
        businessAddress:
          autoFillData.businessAddress ||
          autoFillData.address ||
          prev.businessAddress,
        city: autoFillData.city || prev.city,
        state: autoFillData.state || prev.state,
        pincode: autoFillData.pincode || prev.pincode,

        // Optional fields - only fill if empty to avoid overwriting user input
        contactPersonName:
          prev.contactPersonName || autoFillData.legalName || "",
        accountHolderName:
          prev.accountHolderName || autoFillData.legalName || "",

        // Additional business info
        ...(autoFillData.businessType && {
          businessType: autoFillData.businessType,
        }),
        ...(autoFillData.businessNature && {
          businessNature: autoFillData.businessNature,
        }),
      };

      console.log("✅ Updated form data after auto-fill:", updatedData);
      return updatedData;
    });

    // Clear related validation errors
    setErrors((prev) => {
      const newErrors = { ...prev };

      // Clear errors for fields that were auto-filled
      if (autoFillData.gstNumber) delete newErrors.gstNumber;
      if (autoFillData.businessName || autoFillData.legalName)
        delete newErrors.businessName;
      if (autoFillData.businessAddress || autoFillData.address)
        delete newErrors.businessAddress;
      if (autoFillData.city) delete newErrors.city;
      if (autoFillData.state) delete newErrors.state;
      if (autoFillData.pincode) delete newErrors.pincode;

      console.log(
        "🧹 Cleared validation errors:",
        Object.keys(prev).filter((key) => !newErrors[key])
      );
      return newErrors;
    });

    // Show success message
    toast.success(
      "✅ Business details automatically filled from verified GST records!"
    );
    console.log("🎉 GST auto-fill completed successfully!");
  };
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Handle product categories selection
  const handleCategoryChange = (categoryValue) => {
    setFormData((prev) => ({
      ...prev,
      productCategories: prev.productCategories.includes(categoryValue)
        ? prev.productCategories.filter((cat) => cat !== categoryValue)
        : [...prev.productCategories, categoryValue],
    }));
    if (errors.productCategories) {
      setErrors((prev) => ({
        ...prev,
        productCategories: "",
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    // Business Information
    if (!formData.businessName.trim()) {
      newErrors.businessName = "Business name is required";
    }

    if (!formData.gstNumber.trim()) {
      newErrors.gstNumber = "GST number is required";
    } else if (
      !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(
        formData.gstNumber.replace(/[^A-Z0-9]/g, "")
      )
    ) {
      newErrors.gstNumber = "Please enter a valid GST number";
    }

    // Contact Information
    if (!formData.contactPersonName.trim()) {
      newErrors.contactPersonName = "Contact person name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone number is required";
    } else if (!/^[6-9]\d{9}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = "Please enter a valid 10-digit phone number";
    }

    // Business Address
    if (!formData.businessAddress.trim()) {
      newErrors.businessAddress = "Business address is required";
    }

    if (!formData.city.trim()) {
      newErrors.city = "City is required";
    }

    if (!formData.state.trim()) {
      newErrors.state = "State is required";
    }

    if (!formData.pincode) {
      newErrors.pincode = "Pincode is required";
    } else if (!/^[1-9][0-9]{5}$/.test(formData.pincode)) {
      newErrors.pincode = "Please enter a valid 6-digit pincode";
    }

    // Password
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    // Product Categories
    if (formData.productCategories.length === 0) {
      newErrors.productCategories =
        "Please select at least one product category";
    }

    // Banking Information
    if (!formData.bankAccountNumber.trim()) {
      newErrors.bankAccountNumber = "Bank account number is required";
    }

    if (!formData.bankName.trim()) {
      newErrors.bankName = "Bank name is required";
    }

    if (!formData.ifscCode.trim()) {
      newErrors.ifscCode = "IFSC code is required";
    } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.ifscCode)) {
      newErrors.ifscCode = "Please enter a valid IFSC code";
    }

    if (!formData.accountHolderName.trim()) {
      newErrors.accountHolderName = "Account holder name is required";
    }

    // Agreements
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = "You must agree to the terms and conditions";
    }

    if (!formData.agreeToCommission) {
      newErrors.agreeToCommission = "You must agree to the commission terms";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare data for API
      const submissionData = {
        // User fields
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        password: formData.password,
        contactPersonName: formData.contactPersonName,

        // Supplier fields
        businessName: formData.businessName,
        gstNumber: formData.gstNumber.replace(/[^A-Z0-9]/g, ""),
        panNumber: formData.panNumber,
        businessAddress: formData.businessAddress,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,

        // Bank details
        bankDetails: {
          bankName: formData.bankName,
          accountNumber: formData.bankAccountNumber,
          ifscCode: formData.ifscCode,
          accountHolderName: formData.accountHolderName,
        },

        // Additional info
        productCategories: formData.productCategories,
        yearEstablished: formData.yearEstablished,
        numberOfEmployees: formData.numberOfEmployees,
        annualTurnover: formData.annualTurnover,
      };

      console.log("📤 Submitting supplier registration:", submissionData);

      const response = await supplierAPI.register(submissionData);

      if (response.success) {
        toast.success(
          "🎉 Registration successful! Please check your email and phone for verification."
        );
        navigate("/auth/verify-phone", {
          state: {
            phoneNumber: formData.phoneNumber,
            email: formData.email,
            userType: "supplier",
          },
        });
      }
    } catch (error) {
      console.error("❌ Registration error:", error);
      toast.error(
        error.response?.data?.message ||
          "Registration failed. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="auth-card">
              <div className="auth-header">
                <h2>🏢 Supplier Registration</h2>
                <p>
                  Join Aggrekart as a supplier partner and grow your business
                  with us
                </p>
              </div>

              <form onSubmit={handleSubmit} className="auth-form">
                {/* GST Auto-fill Section - FIXED PROPS */}
                <div className="form-section">
                  <div className="section-header">
                    <h4>
                      <i className="fas fa-file-invoice me-2"></i>
                      GST Verification & Auto-Fill
                    </h4>
                    <p className="text-muted">
                      Enter your GST number to automatically verify and fill
                      business details
                    </p>
                  </div>

                  <GSTAutoFill
                    onDataFill={handleGSTAutoFill}
                    formData={formData}
                  />
                </div>

                {/* Business Information */}
                <div className="form-section">
                  <div className="section-header">
                    <h4>
                      <i className="fas fa-building me-2"></i>
                      Business Information
                    </h4>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="form-label required">
                          Business Name
                        </label>
                        <input
                          type="text"
                          name="businessName"
                          className={`form-control ${errors.businessName ? "is-invalid" : ""}`}
                          value={formData.businessName}
                          onChange={handleInputChange}
                          placeholder="Enter your business name"
                        />
                        {errors.businessName && (
                          <div className="invalid-feedback">
                            {errors.businessName}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="form-label required">
                          Business Type
                        </label>
                        <select
                          name="businessType"
                          className="form-control"
                          value={formData.businessType}
                          onChange={handleInputChange}
                        >
                          {businessTypes.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* GST Number Display (Read-only if auto-filled) */}
                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="form-label required">
                          GST Number
                        </label>
                        <input
                          type="text"
                          name="gstNumber"
                          className={`form-control ${errors.gstNumber ? "is-invalid" : ""}`}
                          value={formData.gstNumber}
                          onChange={handleInputChange}
                          placeholder="GST Number (auto-filled from verification)"
                          maxLength="15"
                        />
                        {errors.gstNumber && (
                          <div className="invalid-feedback">
                            {errors.gstNumber}
                          </div>
                        )}
                        {formData.gstNumber && (
                          <small className="text-muted">
                            ✅ This GST number was verified and auto-filled
                          </small>
                        )}
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="form-label">PAN Number</label>
                        <input
                          type="text"
                          name="panNumber"
                          className="form-control"
                          value={formData.panNumber}
                          onChange={handleInputChange}
                          placeholder="ABCDE1234F"
                          maxLength="10"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-12">
                      <div className="form-group">
                        <label className="form-label">
                          Business Registration Number
                        </label>
                        <input
                          type="text"
                          name="businessRegistrationNumber"
                          className="form-control"
                          value={formData.businessRegistrationNumber}
                          onChange={handleInputChange}
                          placeholder="Enter business registration number"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="form-section">
                  <div className="section-header">
                    <h4>
                      <i className="fas fa-user me-2"></i>
                      Contact Information
                    </h4>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="form-label required">
                          Contact Person Name
                        </label>
                        <input
                          type="text"
                          name="contactPersonName"
                          className={`form-control ${errors.contactPersonName ? "is-invalid" : ""}`}
                          value={formData.contactPersonName}
                          onChange={handleInputChange}
                          placeholder="Enter contact person name"
                        />
                        {errors.contactPersonName && (
                          <div className="invalid-feedback">
                            {errors.contactPersonName}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="form-label required">
                          Email Address
                        </label>
                        <input
                          type="email"
                          name="email"
                          className={`form-control ${errors.email ? "is-invalid" : ""}`}
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="Enter email address"
                        />
                        {errors.email && (
                          <div className="invalid-feedback">{errors.email}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="form-label required">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          name="phoneNumber"
                          className={`form-control ${errors.phoneNumber ? "is-invalid" : ""}`}
                          value={formData.phoneNumber}
                          onChange={handleInputChange}
                          placeholder="10-digit phone number"
                          maxLength="10"
                        />
                        {errors.phoneNumber && (
                          <div className="invalid-feedback">
                            {errors.phoneNumber}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="form-label">Alternate Phone</label>
                        <input
                          type="tel"
                          name="alternatePhone"
                          className="form-control"
                          value={formData.alternatePhone}
                          onChange={handleInputChange}
                          placeholder="Alternate phone number"
                          maxLength="10"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Business Address */}
                <div className="form-section">
                  <div className="section-header">
                    <h4>
                      <i className="fas fa-map-marker-alt me-2"></i>
                      Business Address
                    </h4>
                  </div>

                  <div className="form-group">
                    <label className="form-label required">
                      Business Address
                    </label>
                    <textarea
                      name="businessAddress"
                      className={`form-control ${errors.businessAddress ? "is-invalid" : ""}`}
                      value={formData.businessAddress}
                      onChange={handleInputChange}
                      placeholder="Enter complete business address"
                      rows={3}
                    />
                    {errors.businessAddress && (
                      <div className="invalid-feedback">
                        {errors.businessAddress}
                      </div>
                    )}
                    {formData.businessAddress && formData.gstNumber && (
                      <small className="text-muted">
                        ✅ Address auto-filled from GST records
                      </small>
                    )}
                  </div>

                  <div className="row">
                    <div className="col-md-4">
                      <div className="form-group">
                        <label className="form-label required">City</label>
                        <input
                          type="text"
                          name="city"
                          className={`form-control ${errors.city ? "is-invalid" : ""}`}
                          value={formData.city}
                          onChange={handleInputChange}
                          placeholder="Enter city"
                        />
                        {errors.city && (
                          <div className="invalid-feedback">{errors.city}</div>
                        )}
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="form-group">
                        <label className="form-label required">State</label>
                        <select
                          name="state"
                          className={`form-control ${errors.state ? "is-invalid" : ""}`}
                          value={formData.state}
                          onChange={handleInputChange}
                        >
                          <option value="">Select State</option>
                          {indianStates.map((state) => (
                            <option key={state.code} value={state.name}>
                              {state.name} (GST: {state.gstCode})
                            </option>
                          ))}
                        </select>
                        {errors.state && (
                          <div className="invalid-feedback">{errors.state}</div>
                        )}
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="form-group">
                        <label className="form-label required">Pincode</label>
                        <input
                          type="text"
                          name="pincode"
                          className={`form-control ${errors.pincode ? "is-invalid" : ""}`}
                          value={formData.pincode}
                          onChange={handleInputChange}
                          placeholder="6-digit pincode"
                          maxLength="6"
                        />
                        {errors.pincode && (
                          <div className="invalid-feedback">
                            {errors.pincode}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Account Information */}
                <div className="form-section">
                  <div className="section-header">
                    <h4>
                      <i className="fas fa-lock me-2"></i>
                      Account Information
                    </h4>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="form-label required">Password</label>
                        <input
                          type="password"
                          name="password"
                          className={`form-control ${errors.password ? "is-invalid" : ""}`}
                          value={formData.password}
                          onChange={handleInputChange}
                          placeholder="Enter password (min 6 characters)"
                        />
                        {errors.password && (
                          <div className="invalid-feedback">
                            {errors.password}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="form-label required">
                          Confirm Password
                        </label>
                        <input
                          type="password"
                          name="confirmPassword"
                          className={`form-control ${errors.confirmPassword ? "is-invalid" : ""}`}
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          placeholder="Confirm your password"
                        />
                        {errors.confirmPassword && (
                          <div className="invalid-feedback">
                            {errors.confirmPassword}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Product Categories */}
                <div className="form-section">
                  <div className="section-header">
                    <h4>
                      <i className="fas fa-boxes me-2"></i>
                      Product Categories
                    </h4>
                    <p className="text-muted">
                      Select the product categories you will supply
                    </p>
                  </div>

                  <div className="checkbox-grid">
                    {productCategoriesOptions.map((category) => (
                      <div key={category.value} className="form-check">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id={category.value}
                          checked={formData.productCategories.includes(
                            category.value
                          )}
                          onChange={() => handleCategoryChange(category.value)}
                        />
                        <label
                          className="form-check-label"
                          htmlFor={category.value}
                        >
                          {category.label}
                        </label>
                      </div>
                    ))}
                  </div>
                  {errors.productCategories && (
                    <div className="text-danger small mt-2">
                      {errors.productCategories}
                    </div>
                  )}
                </div>

                {/* Business Details */}
                <div className="form-section">
                  <div className="section-header">
                    <h4>
                      <i className="fas fa-chart-line me-2"></i>
                      Business Details
                    </h4>
                  </div>

                  <div className="row">
                    <div className="col-md-4">
                      <div className="form-group">
                        <label className="form-label">Year Established</label>
                        <input
                          type="number"
                          name="yearEstablished"
                          className="form-control"
                          value={formData.yearEstablished}
                          onChange={handleInputChange}
                          placeholder="e.g., 2015"
                          min="1900"
                          max={new Date().getFullYear()}
                        />
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="form-group">
                        <label className="form-label">
                          Number of Employees
                        </label>
                        <select
                          name="numberOfEmployees"
                          className="form-control"
                          value={formData.numberOfEmployees}
                          onChange={handleInputChange}
                        >
                          <option value="">Select Range</option>
                          {employeeRanges.map((range) => (
                            <option key={range.value} value={range.value}>
                              {range.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="form-group">
                        <label className="form-label">Annual Turnover</label>
                        <select
                          name="annualTurnover"
                          className="form-control"
                          value={formData.annualTurnover}
                          onChange={handleInputChange}
                        >
                          <option value="">Select Range</option>
                          {turnoverRanges.map((range) => (
                            <option key={range.value} value={range.value}>
                              {range.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Banking Information */}
                <div className="form-section">
                  <div className="section-header">
                    <h4>
                      <i className="fas fa-university me-2"></i>
                      Banking Information
                    </h4>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="form-label required">
                          Bank Account Number
                        </label>
                        <input
                          type="text"
                          name="bankAccountNumber"
                          className={`form-control ${errors.bankAccountNumber ? "is-invalid" : ""}`}
                          value={formData.bankAccountNumber}
                          onChange={handleInputChange}
                          placeholder="Enter bank account number"
                        />
                        {errors.bankAccountNumber && (
                          <div className="invalid-feedback">
                            {errors.bankAccountNumber}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="form-label required">Bank Name</label>
                        <input
                          type="text"
                          name="bankName"
                          className={`form-control ${errors.bankName ? "is-invalid" : ""}`}
                          value={formData.bankName}
                          onChange={handleInputChange}
                          placeholder="Enter bank name"
                        />
                        {errors.bankName && (
                          <div className="invalid-feedback">
                            {errors.bankName}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="form-label required">IFSC Code</label>
                        <input
                          type="text"
                          name="ifscCode"
                          className={`form-control ${errors.ifscCode ? "is-invalid" : ""}`}
                          value={formData.ifscCode}
                          onChange={handleInputChange}
                          placeholder="ABCD0123456"
                          maxLength="11"
                        />
                        {errors.ifscCode && (
                          <div className="invalid-feedback">
                            {errors.ifscCode}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="form-label required">
                          Account Holder Name
                        </label>
                        <input
                          type="text"
                          name="accountHolderName"
                          className={`form-control ${errors.accountHolderName ? "is-invalid" : ""}`}
                          value={formData.accountHolderName}
                          onChange={handleInputChange}
                          placeholder="Enter account holder name"
                        />
                        {errors.accountHolderName && (
                          <div className="invalid-feedback">
                            {errors.accountHolderName}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Terms and Agreements */}
                <div className="form-section terms-agreements-section">
                  <div className="section-header">
                    <h4>
                      <i className="fas fa-handshake me-2"></i>
                      Terms and Agreements
                    </h4>
                  </div>

                  <div className="form-check mb-3">
                    <input
                      type="checkbox"
                      className={`form-check-input ${errors.agreeToTerms ? "is-invalid" : ""}`}
                      id="agreeToTerms"
                      name="agreeToTerms"
                      checked={formData.agreeToTerms}
                      onChange={handleInputChange}
                    />
                    <label className="form-check-label" htmlFor="agreeToTerms">
                      I agree to the{" "}
                      <Link
                        to="/terms"
                        target="_blank"
                        className="text-primary"
                      >
                        Terms and Conditions
                      </Link>{" "}
                      and{" "}
                      <Link
                        to="/privacy"
                        target="_blank"
                        className="text-primary"
                      >
                        Privacy Policy
                      </Link>
                    </label>
                    {errors.agreeToTerms && (
                      <div className="invalid-feedback d-block">
                        {errors.agreeToTerms}
                      </div>
                    )}
                  </div>

                  <div className="form-check mb-3">
                    <input
                      type="checkbox"
                      className={`form-check-input ${errors.agreeToCommission ? "is-invalid" : ""}`}
                      id="agreeToCommission"
                      name="agreeToCommission"
                      checked={formData.agreeToCommission}
                      onChange={handleInputChange}
                    />
                    <label
                      className="form-check-label"
                      htmlFor="agreeToCommission"
                    >
                      I agree to the commission structure and payment terms as
                      outlined in the supplier agreement
                    </label>
                    {errors.agreeToCommission && (
                      <div className="invalid-feedback d-block">
                        {errors.agreeToCommission}
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="form-section">
                  <div className="d-flex justify-content-between align-items-center">
                    <Link to="/auth/login" className="text-primary">
                      Already have an account? Login here
                    </Link>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn btn-primary btn-lg px-5"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Registering...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-user-plus me-2"></i>
                          Register as Supplier
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplierRegisterPage;
