import React, { useState, useEffect } from "react";
import {
  X,
  Gift,
  Calendar,
  Target,
  DollarSign,
  MapPin,
  Users,
  Tag,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { toast } from "react-hot-toast";
import loyaltyService from "../../services/loyaltyService";
import "./CreatePromotionModal.css";

const CreatePromotionModal = ({ onClose, onSuccess ,isOpen}) => {
  const [loading, setLoading] = useState(false);
  const [targetingOptions, setTargetingOptions] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "discount",
    benefits: {
      discountType: "percentage",
      discountValue: "",
      maxDiscountAmount: "",
      freeDeliveryThreshold: "",
    },
    conditions: {
      minOrderValue: "",
      maxUsesPerCustomer: 1,
      totalUsageLimit: "",
    },
    validity: {
      startDate: "",
      endDate: "",
    },
    targeting: {
      customerTypes: [],
      states: [],
      cities: [],
      membershipTiers: [],
    },
    couponCode: "",
    autoGenerateCoupon: false,
  });
  const [errors, setErrors] = useState({});
  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setFormData(prev => ({
        ...prev,
        benefits: {
          ...prev.benefits,
          discountType: "percentage" // Ensure it starts with percentage
        }
      }));
    }
  }, [isOpen]);

  useEffect(() => {
    loadTargetingOptions();

    // Set default start date to today
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    setFormData((prev) => ({
      ...prev,
      validity: {
        startDate: today.toISOString().split("T")[0],
        endDate: tomorrow.toISOString().split("T")[0],
      },
    }));
  }, []);

  const loadTargetingOptions = async () => {
    try {
      const options = await loyaltyService.getTargetingOptions();
      setTargetingOptions(options);
    } catch (error) {
      console.error("Failed to load targeting options:", error);
      toast.error("Failed to load targeting options");
    }
  };

  const handleInputChange = (path, value) => {
    setFormData((prev) => {
      const keys = path.split(".");
      const newData = { ...prev };
      let current = newData;

      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = value;
      return newData;
    });

    // Clear error when user starts typing
    if (errors[path]) {
      setErrors((prev) => ({ ...prev, [path]: "" }));
    }
  };

  const handleArrayChange = (path, value, checked) => {
    setFormData((prev) => {
      const keys = path.split(".");
      const newData = { ...prev };
      let current = newData;

      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }

      const array = [...(current[keys[keys.length - 1]] || [])];
      if (checked) {
        if (!array.includes(value)) {
          array.push(value);
        }
      } else {
        const index = array.indexOf(value);
        if (index > -1) {
          array.splice(index, 1);
        }
      }

      current[keys[keys.length - 1]] = array;
      return newData;
    });
  };

  const generateCouponCode = () => {
    const prefix = "PROMO";
    const randomString = Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();
    return `${prefix}${randomString}`;
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    if (!formData.benefits.discountValue) {
      newErrors["benefits.discountValue"] = "Discount value is required";
    } else {
      const value = parseFloat(formData.benefits.discountValue);
      if (value <= 0) {
        newErrors["benefits.discountValue"] =
          "Discount value must be greater than 0";
      }
      if (formData.benefits.discountType === "percentage" && value > 100) {
        newErrors["benefits.discountValue"] =
          "Percentage discount cannot exceed 100%";
      }
    }

    if (!formData.validity.startDate) {
      newErrors["validity.startDate"] = "Start date is required";
    }

    if (!formData.validity.endDate) {
      newErrors["validity.endDate"] = "End date is required";
    }

    if (formData.validity.startDate && formData.validity.endDate) {
      if (
        new Date(formData.validity.startDate) >=
        new Date(formData.validity.endDate)
      ) {
        newErrors["validity.endDate"] = "End date must be after start date";
      }
    }

    if (formData.type === "coupon") {
      if (!formData.autoGenerateCoupon && !formData.couponCode.trim()) {
        newErrors.couponCode = "Coupon code is required";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setLoading(true);

    try {
      // Prepare submission data
      const submissionData = {
        ...formData,
        benefits: {
          ...formData.benefits,
          discountValue: parseFloat(formData.benefits.discountValue),
          maxDiscountAmount: formData.benefits.maxDiscountAmount
            ? parseFloat(formData.benefits.maxDiscountAmount)
            : undefined,
          freeDeliveryThreshold: formData.benefits.freeDeliveryThreshold
            ? parseFloat(formData.benefits.freeDeliveryThreshold)
            : undefined,
        },
        conditions: {
          ...formData.conditions,
          minOrderValue: formData.conditions.minOrderValue
            ? parseFloat(formData.conditions.minOrderValue)
            : 0,
          maxUsesPerCustomer: parseInt(formData.conditions.maxUsesPerCustomer),
          totalUsageLimit: formData.conditions.totalUsageLimit
            ? parseInt(formData.conditions.totalUsageLimit)
            : undefined,
        },
      };

      // Generate coupon code if needed
      if (formData.type === "coupon" && formData.autoGenerateCoupon) {
        submissionData.couponCode = generateCouponCode();
      }
     // Add this before the loyaltyService call in CreatePromotionModal.jsx around line 229
console.log('Submitting promotion data:', JSON.stringify(submissionData, null, 2));

      await loyaltyService.createSupplierPromotion(submissionData);
      onSuccess();
    } catch (error) {
      console.error("Failed to create promotion:", error);
      toast.error(error.message || "Failed to create promotion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="create-promotion-modal">
        <div className="modal-header">
          <div className="modal-title">
            <Gift size={24} />
            <h2>Create New Promotion</h2>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-content">
          {/* Basic Information */}
          <div className="create-form-section">
            <h3>Basic Information</h3>

            <div className="form-group">
              <label>Promotion Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="e.g., Summer Sale - 20% Off"
                className={errors.title ? "error" : ""}
              />
              {errors.title && (
                <span className="error-message">{errors.title}</span>
              )}
            </div>

            <div className="form-group">
              <label>Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder="Describe your promotion..."
                rows="3"
                className={errors.description ? "error" : ""}
              />
              {errors.description && (
                <span className="error-message">{errors.description}</span>
              )}
            </div>

            <div className="form-group">
              <label>Promotion Type</label>
              <select
                value={formData.type}
                onChange={(e) => handleInputChange("type", e.target.value)}
              >
                <option value="discount">Discount</option>
                <option value="coupon">Coupon</option>
                <option value="free_delivery">Free Delivery</option>
                <option value="bulk_discount">Bulk Discount</option>
                <option value="seasonal">Seasonal</option>
                <option value="referral">Referral</option>
              </select>
            </div>
          </div>

          {/* Benefits */}
          <div className="create-form-section">
            <h3>
              <DollarSign size={20} />
              Benefits
            </h3>

            <div className="form-row">
              <div className="form-group">
                <label>Discount Type</label>
                <select
                  value={formData.benefits.discountType}
                  onChange={(e) =>
                    handleInputChange("benefits.discountType", e.target.value)
                  }
                >
                  <option value="percentage">Percentage</option>
                  
                    <option value="fixed_amount">Fixed Amount</option>
                </select>
              </div>

              <div className="form-group">
                <label>
                  Discount Value *
                  {formData.benefits.discountType === "percentage"
                    ? "(%)"
                    : "(₹)"}
                </label>
                <input
                  type="number"
                  value={formData.benefits.discountValue}
                  onChange={(e) =>
                    handleInputChange("benefits.discountValue", e.target.value)
                  }
                  placeholder={
                    formData.benefits.discountType === "percentage"
                      ? "20"
                      : "1000"
                  }
                  min="0"
                  max={
                    formData.benefits.discountType === "percentage"
                      ? "100"
                      : undefined
                  }
                  className={errors["benefits.discountValue"] ? "error" : ""}
                />
                {errors["benefits.discountValue"] && (
                  <span className="error-message">
                    {errors["benefits.discountValue"]}
                  </span>
                )}
              </div>
            </div>

            {formData.benefits.discountType === "percentage" && (
              <div className="form-group">
                <label>Maximum Discount Amount (₹)</label>
                <input
                  type="number"
                  value={formData.benefits.maxDiscountAmount}
                  onChange={(e) =>
                    handleInputChange(
                      "benefits.maxDiscountAmount",
                      e.target.value
                    )
                  }
                  placeholder="5000"
                  min="0"
                />
                <small>Optional: Cap the maximum discount amount</small>
              </div>
            )}
          </div>

          {/* Conditions */}
          <div className="create-form-section">
            <h3>Conditions</h3>

            <div className="form-row">
              <div className="form-group">
                <label>Minimum Order Value (₹)</label>
                <input
                  type="number"
                  value={formData.conditions.minOrderValue}
                  onChange={(e) =>
                    handleInputChange(
                      "conditions.minOrderValue",
                      e.target.value
                    )
                  }
                  placeholder="1000"
                  min="0"
                />
              </div>

              <div className="form-group">
                <label>Max Uses Per Customer</label>
                <input
                  type="number"
                  value={formData.conditions.maxUsesPerCustomer}
                  onChange={(e) =>
                    handleInputChange(
                      "conditions.maxUsesPerCustomer",
                      e.target.value
                    )
                  }
                  min="1"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Total Usage Limit</label>
              <input
                type="number"
                value={formData.conditions.totalUsageLimit}
                onChange={(e) =>
                  handleInputChange(
                    "conditions.totalUsageLimit",
                    e.target.value
                  )
                }
                placeholder="100"
                min="1"
              />
              <small>
                Optional: Total number of times this promotion can be used
              </small>
            </div>
          </div>

          {/* Validity Period */}
          <div className="create-form-section">
            <h3>
              <Calendar size={20} />
              Validity Period
            </h3>

            <div className="form-row">
              <div className="form-group">
                <label>Start Date *</label>
                <input
                  type="date"
                  value={formData.validity.startDate}
                  onChange={(e) =>
                    handleInputChange("validity.startDate", e.target.value)
                  }
                  min={new Date().toISOString().split("T")[0]}
                  className={errors["validity.startDate"] ? "error" : ""}
                />
                {errors["validity.startDate"] && (
                  <span className="error-message">
                    {errors["validity.startDate"]}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label>End Date *</label>
                <input
                  type="date"
                  value={formData.validity.endDate}
                  onChange={(e) =>
                    handleInputChange("validity.endDate", e.target.value)
                  }
                  min={
                    formData.validity.startDate ||
                    new Date().toISOString().split("T")[0]
                  }
                  className={errors["validity.endDate"] ? "error" : ""}
                />
                {errors["validity.endDate"] && (
                  <span className="error-message">
                    {errors["validity.endDate"]}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Targeting */}
          <div className="create-form-section">
            <h3>
              <Target size={20} />
              Targeting (Optional)
            </h3>

            {targetingOptions && (
              <>
                {/* Customer Types */}
                {targetingOptions.customerTypes.length > 0 && (
                  <div className="form-group">
                    <label>Customer Types</label>
                    <div className="checkbox-group">
                      {targetingOptions.customerTypes.map((type) => (
                        <label key={type.value} className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={formData.targeting.customerTypes.includes(
                              type.value
                            )}
                            onChange={(e) =>
                              handleArrayChange(
                                "targeting.customerTypes",
                                type.value,
                                e.target.checked
                              )
                            }
                          />
                          <span>
                            {type.label} ({type.orderCount} orders)
                          </span>
                        </label>
                      ))}
                    </div>
                    <small>Leave empty to target all customer types</small>
                  </div>
                )}

                {/* Membership Tiers */}
                <div className="form-group">
                  <label>Membership Tiers</label>
                  <div className="checkbox-group">
                    {targetingOptions.membershipTiers.map((tier) => (
                      <label key={tier.value} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={formData.targeting.membershipTiers.includes(
                            tier.value
                          )}
                          onChange={(e) =>
                            handleArrayChange(
                              "targeting.membershipTiers",
                              tier.value,
                              e.target.checked
                            )
                          }
                        />
                        <span>
                          {tier.label} ({tier.customerCount} customers)
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Coupon Code */}
          {formData.type === "coupon" && (
            <div className="create-form-section">
              <h3>
                <Tag size={20} />
                Coupon Code
              </h3>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.autoGenerateCoupon}
                    onChange={(e) =>
                      handleInputChange("autoGenerateCoupon", e.target.checked)
                    }
                  />
                  <span>Auto-generate coupon code</span>
                </label>
              </div>

              {!formData.autoGenerateCoupon && (
                <div className="form-group">
                  <label>Coupon Code *</label>
                  <input
                    type="text"
                    value={formData.couponCode}
                    onChange={(e) =>
                      handleInputChange(
                        "couponCode",
                        e.target.value.toUpperCase()
                      )
                    }
                    placeholder="SUMMER20"
                    className={errors.couponCode ? "error" : ""}
                  />
                  {errors.couponCode && (
                    <span className="error-message">{errors.couponCode}</span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Form Actions */}
          <div className="create-form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <div className="spinner" />
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircle size={18} />
                  Create Promotion
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePromotionModal;
