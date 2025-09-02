import React, { useState } from 'react';
import { supplierAPI } from '../../services/api';
import toast from 'react-hot-toast';

const SupplierProductPricing = ({ baseProduct, onPricingSet }) => {
  const [pricing, setPricing] = useState({
    basePrice: '',
    unit: baseProduct.pricing?.unit || 'MT',
    minimumQuantity: '',
    deliveryTime: '',
    includesGST: false,
    transportCost: {
      included: true,
      costPerKm: 0
    }
  });
  const [stock, setStock] = useState({
    available: '',
    lowStockThreshold: 10
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await supplierAPI.setProductPricing(baseProduct._id, {
        pricing,
        stock,
        deliveryTime: pricing.deliveryTime
      });
      
      toast.success('Pricing and delivery time set successfully');
      onPricingSet(result.data);
    } catch (error) {
      toast.error('Failed to set pricing');
    }
  };

  return (
    <div className="supplier-product-pricing">
      <div className="base-product-info">
        <h4>{baseProduct.name}</h4>
        <p>{baseProduct.description}</p>
        <div className="product-images">
          {baseProduct.images?.map((img, idx) => (
            <img key={idx} src={img.url} alt={img.alt} className="product-thumbnail" />
          ))}
        </div>
        <p className="admin-note">
          ⚠️ Product images uploaded by admin. You can only set pricing and delivery time.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="pricing-form">
        <div className="form-group">
          <label>Base Price per {pricing.unit} *</label>
          <input
            type="number"
            value={pricing.basePrice}
            onChange={(e) => setPricing({...pricing, basePrice: e.target.value})}
            placeholder="Enter price"
            required
          />
        </div>
            <div className="form-group">
          <label>Unit of Measurement *</label>
          <select
            value={pricing.unit}
            onChange={(e) => setPricing({...pricing, unit: e.target.value})}
            required
            className="unit-select"
          >
            <option value="MT">Metric Tons (MT)</option>
            <option value="bags">Bags</option>
            <option value="numbers">Numbers/Pieces</option>
            <option value="Kg">Kg</option>
          </select>
        </div>
        <div className="form-group">
          <label>Minimum Quantity *</label>
          <input
            type="number"
            value={pricing.minimumQuantity}
            onChange={(e) => setPricing({...pricing, minimumQuantity: e.target.value})}
            placeholder="Minimum order quantity"
            required
          />
        </div>

        <div className="form-group">
          <label>Delivery Time *</label>
          <select
            value={pricing.deliveryTime}
            onChange={(e) => setPricing({...pricing, deliveryTime: e.target.value})}
            required
          >
            <option value="">Select delivery time</option>
            <option value="same_day">Same Day</option>
            <option value="next_day">Next Day</option>
            <option value="2_3_days">2-3 Days</option>
            <option value="3_7_days">3-7 Days</option>
            <option value="1_2_weeks">1-2 Weeks</option>
          </select>
        </div>

        <div className="form-group">
          <label>Available Stock *</label>
          <input
            type="number"
            value={stock.available}
            onChange={(e) => setStock({...stock, available: e.target.value})}
            placeholder="Available quantity"
            required
          />
        </div>

        <div className="form-group checkbox">
          <label>
            <input
              type="checkbox"
              checked={pricing.includesGST}
              onChange={(e) => setPricing({...pricing, includesGST: e.target.checked})}
            />
            Price includes GST
          </label>
        </div>

        <button type="submit" className="btn btn-primary">
          Set Pricing & Delivery Time
        </button>
      </form>
    </div>
  );
};

export default SupplierProductPricing;