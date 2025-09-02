import React, { useState, useEffect } from "react";
import {
  Truck,
  MapPin,
  Clock,
  DollarSign,
  Award,
  Package,
  ArrowRight,
} from "lucide-react";
import { useDistancePricing } from "../../hooks/useDistancePricing";

const OptimalSuppliers = ({ cartItems, onSupplierSelect }) => {
  const [suppliers, setSuppliers] = useState([]);
  const [consolidationOption, setConsolidationOption] = useState(null);
  const [selectedSuppliers, setSelectedSuppliers] = useState([]);

  const {
    loading,
    error,
    userLocation,
    getCurrentLocation,
    calculateCartDelivery,
  } = useDistancePricing();

  useEffect(() => {
    if (cartItems && cartItems.length > 0 && userLocation) {
      handleCalculateSuppliers();
    }
  }, [cartItems, userLocation]);

  const handleCalculateSuppliers = async () => {
    if (!userLocation) {
      try {
        await getCurrentLocation();
      } catch (error) {
        console.error("Failed to get location:", error);
        return;
      }
    }

    try {
      const result = await calculateCartDelivery(cartItems, userLocation);
      setSuppliers(result.suppliers);
      setConsolidationOption(result.consolidation);
    } catch (error) {
      console.error("Failed to calculate suppliers:", error);
    }
  };

  const handleSupplierToggle = (supplierId) => {
    setSelectedSuppliers((prev) =>
      prev.includes(supplierId)
        ? prev.filter((id) => id !== supplierId)
        : [...prev, supplierId]
    );
  };

  const handleConfirmSelection = () => {
    const selectedSuppliersData = suppliers.filter((s) =>
      selectedSuppliers.includes(s.supplierId)
    );

    if (onSupplierSelect) {
      onSupplierSelect(selectedSuppliersData, consolidationOption);
    }
  };

  const formatDeliveryTime = (estimate) => {
    return `${estimate.min}-${estimate.max} hours`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Finding optimal suppliers...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
        <button
          onClick={handleCalculateSuppliers}
          className="mt-2 text-red-600 hover:text-red-700 text-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="optimal-suppliers">
      <div className="flex items-center gap-2 mb-6">
        <Award className="w-6 h-6 text-green-600" />
        <h2 className="text-xl font-bold text-gray-800">Optimal Suppliers</h2>
      </div>

      {/* Consolidation Recommendation */}
      {consolidationOption?.recommendConsolidation && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Package className="w-5 h-5 text-green-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-green-800 mb-1">
                Consolidation Recommended
              </h3>
              <p className="text-sm text-green-700 mb-2">
                Save ₹{consolidationOption.savings} by consolidating deliveries
                from multiple suppliers.
              </p>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-green-600">
                  Individual Cost: ₹
                  {consolidationOption.totalCost + consolidationOption.savings}
                </span>
                <ArrowRight className="w-4 h-4 text-green-600" />
                <span className="font-semibold text-green-800">
                  Consolidated: ₹{consolidationOption.totalCost}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Suppliers List */}
      <div className="space-y-4">
        {suppliers.map((supplier, index) => (
          <div
            key={supplier.supplierId}
            className={`border rounded-lg p-4 transition-all duration-200 ${
              index === 0
                ? "border-green-300 bg-green-50"
                : selectedSuppliers.includes(supplier.supplierId)
                  ? "border-blue-300 bg-blue-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            {/* Best Supplier Badge */}
            {index === 0 && (
              <div className="flex items-center gap-1 mb-3">
                <Award className="w-4 h-4 text-green-600" />
                <span className="text-sm font-semibold text-green-800">
                  Best Option
                </span>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              {/* Supplier Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {supplier.supplierName}
                </h3>

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{supplier.distance.toFixed(1)} km away</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>
                      {formatDeliveryTime(supplier.deliveryEstimate)} delivery
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    <span>{supplier.items.length} item(s)</span>
                  </div>
                </div>

                {/* Items List */}
                <div className="mt-3">
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    Items:
                  </p>
                  <div className="space-y-1">
                    {supplier.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="text-xs text-gray-600 flex justify-between"
                      >
                        <span>{item.productName}</span>
                        <span>Qty: {item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Pricing Info */}
              <div>
                <div className="bg-white rounded-lg p-3 border border-gray-100">
                  <h4 className="text-sm font-semibold text-gray-800 mb-3">
                    Cost Breakdown
                  </h4>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Product Value:</span>
                      <span className="font-medium">
                        ₹{supplier.totalProductValue}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600">Transport Cost:</span>
                      <span className="font-medium">
                        ₹{supplier.transportCost}
                      </span>
                    </div>

                    <div className="flex justify-between text-gray-500">
                      <span>Zone: {supplier.zone}</span>
                      <span>₹{supplier.costPerKm}/km</span>
                    </div>

                    <div className="border-t pt-2 flex justify-between font-semibold">
                      <span className="text-gray-800">Total Cost:</span>
                      <span className="text-gray-900">
                        ₹{supplier.totalCostWithTransport}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Selection Controls */}
                <div className="mt-3 flex gap-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedSuppliers.includes(supplier.supplierId)}
                      onChange={() => handleSupplierToggle(supplier.supplierId)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-gray-700">Select this supplier</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      {suppliers.length > 0 && (
        <div className="mt-6 flex gap-4">
          <button
            onClick={handleConfirmSelection}
            disabled={selectedSuppliers.length === 0}
            className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            Continue with {selectedSuppliers.length} Supplier
            {selectedSuppliers.length !== 1 ? "s" : ""}
          </button>

          <button
            onClick={() => setSelectedSuppliers([suppliers[0].supplierId])}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Use Best Option
          </button>
        </div>
      )}
    </div>
  );
};

export default OptimalSuppliers;
