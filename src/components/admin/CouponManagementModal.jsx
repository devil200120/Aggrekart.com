import React, { useState } from "react";
import { X, Plus, Percent, DollarSign, Calendar, Users } from "lucide-react";
import loyaltyService from "../../services/loyaltyService";
import { toast } from "react-hot-toast";

const CouponManagementModal = ({ isOpen, onClose, onSuccess }) => {
  const [couponData, setCouponData] = useState({
    code: "",
    title: "",
    description: "",
    discountType: "percentage",
    discountValue: "",
    minOrderAmount: "",
    maxDiscount: "",
    validFrom: "",
    validUntil: "",
    usageLimit: "",
    customerTypes: [],
    isActive: true,
  });

  const [loading, setLoading] = useState(false);

  const handleCustomerTypeChange = (customerType, isSelected) => {
    setCouponData((prev) => ({
      ...prev,
      customerTypes: isSelected
        ? [...prev.customerTypes, customerType]
        : prev.customerTypes.filter((type) => type !== customerType),
    }));
  };

  const generateCouponCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCouponData((prev) => ({ ...prev, code }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!couponData.code.trim()) {
      toast.error("Coupon code is required");
      return;
    }

    if (!couponData.title.trim()) {
      toast.error("Coupon title is required");
      return;
    }

    if (!couponData.discountValue || couponData.discountValue <= 0) {
      toast.error("Discount value must be greater than 0");
      return;
    }

    if (
      couponData.discountType === "percentage" &&
      couponData.discountValue > 100
    ) {
      toast.error("Percentage discount cannot exceed 100%");
      return;
    }

    try {
      setLoading(true);

      const result = await loyaltyService.createCoupon({
        ...couponData,
        discountValue: parseFloat(couponData.discountValue),
        minOrderAmount: couponData.minOrderAmount
          ? parseFloat(couponData.minOrderAmount)
          : 0,
        maxDiscount: couponData.maxDiscount
          ? parseFloat(couponData.maxDiscount)
          : null,
        usageLimit: couponData.usageLimit
          ? parseInt(couponData.usageLimit)
          : null,
      });

      toast.success("Coupon created successfully");
      onSuccess?.(result);
      onClose();
    } catch (error) {
      console.error("Failed to create coupon:", error);
      toast.error(`Failed to create coupon: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal coupon-management-modal">
        <div className="modal-header">
          <h3>Create New Coupon</h3>
          <button onClick={onClose} className="close-button">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-section">
            <h4>Basic Information</h4>

            <div className="form-group">
              <label>Coupon Code</label>
              <div className="input-with-button">
                <input
                  type="text"
                  value={couponData.code}
                  onChange={(e) =>
                    setCouponData((prev) => ({
                      ...prev,
                      code: e.target.value.toUpperCase(),
                    }))
                  }
                  placeholder="Enter coupon code"
                  maxLength="20"
                />
                <button type="button" onClick={generateCouponCode}>
                  Generate
                </button>
              </div>
              <small>Must be unique and uppercase</small>
            </div>

            <div className="form-group">
              <label>Title</label>
              <input
                type="text"
                value={couponData.title}
                onChange={(e) =>
                  setCouponData((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="e.g., Summer Sale 20% Off"
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={couponData.description}
                onChange={(e) =>
                  setCouponData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Describe the coupon offer"
                rows="3"
              />
            </div>
          </div>

          <div className="form-section">
            <h4>Discount Details</h4>

            <div className="form-row">
              <div className="form-group">
                <label>Discount Type</label>
                <div className="radio-group">
                  <label>
                    <input
                      type="radio"
                      name="discountType"
                      value="percentage"
                      checked={couponData.discountType === "percentage"}
                      onChange={(e) =>
                        setCouponData((prev) => ({
                          ...prev,
                          discountType: e.target.value,
                        }))
                      }
                    />
                    <Percent size={16} />
                    Percentage
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="discountType"
                      value="fixed"
                      checked={couponData.discountType === "fixed"}
                      onChange={(e) =>
                        setCouponData((prev) => ({
                          ...prev,
                          discountType: e.target.value,
                        }))
                      }
                    />
                    <DollarSign size={16} />
                    Fixed Amount
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label>
                  {couponData.discountType === "percentage"
                    ? "Percentage (%)"
                    : "Amount (₹)"}
                </label>
                <input
                  type="number"
                  min="0"
                  max={
                    couponData.discountType === "percentage" ? "100" : undefined
                  }
                  step={couponData.discountType === "percentage" ? "0.1" : "1"}
                  value={couponData.discountValue}
                  onChange={(e) =>
                    setCouponData((prev) => ({
                      ...prev,
                      discountValue: e.target.value,
                    }))
                  }
                  placeholder={
                    couponData.discountType === "percentage" ? "10" : "100"
                  }
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Minimum Order Amount (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={couponData.minOrderAmount}
                  onChange={(e) =>
                    setCouponData((prev) => ({
                      ...prev,
                      minOrderAmount: e.target.value,
                    }))
                  }
                  placeholder="0"
                />
                <small>Leave empty for no minimum</small>
              </div>

              {couponData.discountType === "percentage" && (
                <div className="form-group">
                  <label>Maximum Discount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={couponData.maxDiscount}
                    onChange={(e) =>
                      setCouponData((prev) => ({
                        ...prev,
                        maxDiscount: e.target.value,
                      }))
                    }
                    placeholder="500"
                  />
                  <small>Cap for percentage discounts</small>
                </div>
              )}
            </div>
          </div>

          <div className="form-section">
            <h4>Validity & Usage</h4>

            <div className="form-row">
              <div className="form-group">
                <label>Valid From</label>
                <input
                  type="datetime-local"
                  value={couponData.validFrom}
                  onChange={(e) =>
                    setCouponData((prev) => ({
                      ...prev,
                      validFrom: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="form-group">
                <label>Valid Until</label>
                <input
                  type="datetime-local"
                  value={couponData.validUntil}
                  onChange={(e) =>
                    setCouponData((prev) => ({
                      ...prev,
                      validUntil: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="form-group">
              <label>Usage Limit</label>
              <input
                type="number"
                min="1"
                value={couponData.usageLimit}
                onChange={(e) =>
                  setCouponData((prev) => ({
                    ...prev,
                    usageLimit: e.target.value,
                  }))
                }
                placeholder="Leave empty for unlimited usage"
              />
              <small>Total number of times this coupon can be used</small>
            </div>
          </div>

          <div className="form-section">
            <h4>Target Audience</h4>

            <div className="form-group">
              <label>Eligible Customer Types</label>
              <div className="checkbox-group">
                {[
                  { value: "house_owner", label: "House Owner" },
                  { value: "mason", label: "Mason" },
                  { value: "builder_contractor", label: "Builder/Contractor" },
                  { value: "others", label: "Others" },
                ].map((type) => (
                  <label key={type.value}>
                    <input
                      type="checkbox"
                      checked={couponData.customerTypes.includes(type.value)}
                      onChange={(e) =>
                        handleCustomerTypeChange(type.value, e.target.checked)
                      }
                    />
                    {type.label}
                  </label>
                ))}
              </div>
              <small>Leave unchecked for all customer types</small>
            </div>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={couponData.isActive}
                  onChange={(e) =>
                    setCouponData((prev) => ({
                      ...prev,
                      isActive: e.target.checked,
                    }))
                  }
                />
                Active (coupon can be used immediately)
              </label>
            </div>
          </div>
        </form>

        <div className="modal-footer">
          <button type="button" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            type="button"
            className="primary"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Coupon"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CouponManagementModal;
