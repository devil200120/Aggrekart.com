import React, { useState, useEffect } from "react";
import {
  X,
  Edit3,
  Calendar,
  Target,
  DollarSign,
  Tag,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { toast } from "react-hot-toast";
import loyaltyService from "../../services/loyaltyService";
import "./CreatePromotionModal.css"; // Reuse the same styles

const EditPromotionModal = ({ promotion, onClose, onSuccess }) => {
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
    isActive: true,
  });
  const [errors, setErrors] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadTargetingOptions();
    populateFormData();
  }, [promotion]);

  const loadTargetingOptions = async () => {
    try {
      const options = await loyaltyService.getTargetingOptions();
      setTargetingOptions(options);
    } catch (error) {
      console.error("Failed to load targeting options:", error);
      toast.error("Failed to load targeting options");
    }
  };

  const populateFormData = () => {
    if (!promotion) return;

    const formatDate = (dateString) => {
      if (!dateString) return "";
      return new Date(dateString).toISOString().split("T")[0];
    };

    setFormData({
      title: promotion.title || "",
      description: promotion.description || "",
      type: promotion.type || "discount",
      benefits: {
        discountType: promotion.benefits?.discountType || "percentage",
        discountValue: promotion.benefits?.discountValue?.toString() || "",
        maxDiscountAmount:
          promotion.benefits?.maxDiscountAmount?.toString() || "",
        freeDeliveryThreshold:
          promotion.benefits?.freeDeliveryThreshold?.toString() || "",
      },
      conditions: {
        minOrderValue: promotion.conditions?.minOrderValue?.toString() || "",
        maxUsesPerCustomer: promotion.conditions?.maxUsesPerCustomer || 1,
        totalUsageLimit:
          promotion.conditions?.totalUsageLimit?.toString() || "",
      },
      validity: {
        startDate: formatDate(promotion.validity?.startDate),
        endDate: formatDate(promotion.validity?.endDate),
      },
      targeting: {
        customerTypes: promotion.targeting?.customerTypes || [],
        states: promotion.targeting?.states || [],
        cities: promotion.targeting?.cities || [],
        membershipTiers: promotion.targeting?.membershipTiers || [],
      },
      couponCode: promotion.couponCode || "",
      isActive: promotion.isActive !== false,
    });
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

    setHasChanges(true);

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

    setHasChanges(true);
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

    if (formData.type === "coupon" && !formData.couponCode.trim()) {
      newErrors.couponCode = "Coupon code is required";
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

    if (!hasChanges) {
      toast.info("No changes detected");
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

      await loyaltyService.updateSupplierPromotion(
        promotion.id,
        submissionData
      );
      onSuccess();
    } catch (error) {
      console.error("Failed to update promotion:", error);
      toast.error(error.message || "Failed to update promotion");
    } finally {
      setLoading(false);
    }
  };

  const canEditPromotion = () => {
    // Allow editing if promotion is in draft, pending_approval, or active status
    return ["draft", "pending_approval", "active", "paused"].includes(
      promotion?.status
    );
  };

  if (!canEditPromotion()) {
    return (
      <div className="modal-overlay">
        <div className="create-promotion-modal">
          <div className="modal-header">
            <div className="modal-title">
              <AlertTriangle size={24} />
              <h2>Cannot Edit Promotion</h2>
            </div>
            <button className="modal-close" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
          <div className="modal-content">
            <div style={{ textAlign: "center", padding: "2rem" }}>
              <p>
                This promotion cannot be edited because its status is "
                {promotion?.status}".
              </p>
              <p>
                Only promotions with status "draft", "pending approval",
                "active", or "paused" can be edited.
              </p>
              <button className="btn-primary" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="create-promotion-modal">
        <div className="modal-header">
          <div className="modal-title">
            <Edit3 size={24} />
            <h2>Edit Promotion</h2>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-content">
          {/* Status Warning */}
          {promotion?.status === "active" && (
            <div
              style={{
                padding: "1rem",
                background: "#fef3c7",
                border: "1px solid #f59e0b",
                borderRadius: "8px",
                color: "#92400e",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "1rem",
              }}
            >
              <AlertTriangle size={16} />
              <span>
                This promotion is currently active. Changes will take effect
                immediately.
              </span>
            </div>
          )}

          {/* Basic Information */}
          <div className="form-section">
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

            <div className="form-row">
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

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) =>
                      handleInputChange("isActive", e.target.checked)
                    }
                  />
                  <span>Active</span>
                </label>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="form-section">
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
              </div>
            )}
          </div>

          {/* Conditions */}
          <div className="form-section">
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
            </div>
          </div>

          {/* Validity Period */}
          <div className="form-section">
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
                  min={formData.validity.startDate}
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
          <div className="form-section">
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
            <div className="form-section">
              <h3>
                <Tag size={20} />
                Coupon Code
              </h3>

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
                <small>
                  Note: Changing the coupon code will affect all existing usage
                </small>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading || !hasChanges}
            >
              {loading ? (
                <>
                  <div className="spinner" />
                  Updating...
                </>
              ) : (
                <>
                  <CheckCircle size={18} />
                  Update Promotion
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPromotionModal;
