import React, { useState, useEffect } from "react";
import { X, Search, Users, Coins, Gift } from "lucide-react";
import loyaltyService from "../../services/loyaltyService";
import { toast } from "react-hot-toast";

const IndividualAwardModal = ({ isOpen, onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState("coins");
  const [customers, setCustomers] = useState([]);
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    customerType: "",
    membershipTier: "",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  // Award form data
  const [awardData, setAwardData] = useState({
    coins: "",
    reason: "",
    notifyCustomer: true,
  });

  // Coupon data
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [selectedCoupon, setSelectedCoupon] = useState("");
  const [couponReason, setCouponReason] = useState("");

  useEffect(() => {
    if (isOpen) {
      searchCustomers();
      if (activeTab === "coupons") {
        loadAvailableCoupons();
      }
    }
  }, [isOpen, pagination.page, filters, activeTab]);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (isOpen) {
        setPagination((prev) => ({ ...prev, page: 1 }));
        searchCustomers();
      }
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm]);

  const searchCustomers = async () => {
    try {
      setSearching(true);
      const result = await loyaltyService.searchCustomers(
        searchTerm,
        filters.customerType,
        filters.membershipTier,
        pagination.page,
        pagination.limit
      );

      setCustomers(result.customers);
      setPagination((prev) => ({ ...prev, ...result.pagination }));
    } catch (error) {
      console.error("Failed to search customers:", error);
      toast.error("Failed to load customers");
    } finally {
      setSearching(false);
    }
  };

  const loadAvailableCoupons = async () => {
    try {
      const coupons = await loyaltyService.getAvailableCoupons();
      setAvailableCoupons(coupons);
    } catch (error) {
      console.error("Failed to load coupons:", error);
      toast.error("Failed to load available coupons");
    }
  };

  const handleCustomerSelect = (customer, isSelected) => {
    if (isSelected) {
      setSelectedCustomers((prev) => [...prev, customer]);
    } else {
      setSelectedCustomers((prev) =>
        prev.filter((c) => c._id !== customer._id)
      );
    }
  };

  const handleSelectAll = () => {
    const allSelected = customers.every((customer) =>
      selectedCustomers.some((selected) => selected._id === customer._id)
    );

    if (allSelected) {
      // Deselect all current page customers
      setSelectedCustomers((prev) =>
        prev.filter(
          (selected) =>
            !customers.some((customer) => customer._id === selected._id)
        )
      );
    } else {
      // Select all current page customers
      const newSelections = customers.filter(
        (customer) =>
          !selectedCustomers.some((selected) => selected._id === customer._id)
      );
      setSelectedCustomers((prev) => [...prev, ...newSelections]);
    }
  };

  const handleAwardCoins = async () => {
    if (selectedCustomers.length === 0) {
      toast.error("Please select at least one customer");
      return;
    }

    if (!awardData.coins || awardData.coins <= 0) {
      toast.error("Please enter a valid coin amount");
      return;
    }

    if (!awardData.reason.trim()) {
      toast.error("Please provide a reason for the award");
      return;
    }

    try {
      setLoading(true);
      const customerIds = selectedCustomers.map((c) => c._id);

      const result = await loyaltyService.individualAwardCoins(
        customerIds,
        parseInt(awardData.coins),
        awardData.reason,
        awardData.notifyCustomer
      );

      toast.success(
        `Successfully awarded ${awardData.coins} coins to ${result.successfulAwards.length} customers`
      );

      if (result.failedAwards.length > 0) {
        toast.error(
          `Failed to award to ${result.failedAwards.length} customers`
        );
      }

      onSuccess?.(result);
      onClose();
    } catch (error) {
      console.error("Failed to award coins:", error);
      toast.error(`Failed to award coins: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAwardCoupons = async () => {
    if (selectedCustomers.length === 0) {
      toast.error("Please select at least one customer");
      return;
    }

    if (!selectedCoupon) {
      toast.error("Please select a coupon");
      return;
    }

    if (!couponReason.trim()) {
      toast.error("Please provide a reason for the coupon award");
      return;
    }

    try {
      setLoading(true);
      const customerIds = selectedCustomers.map((c) => c._id);

      const result = await loyaltyService.awardCoupons(
        customerIds,
        selectedCoupon,
        couponReason,
        awardData.notifyCustomer
      );

      toast.success(
        `Successfully awarded coupon to ${result.successfulAwards.length} customers`
      );

      if (result.failedAwards.length > 0) {
        toast.error(
          `Failed to award to ${result.failedAwards.length} customers`
        );
      }

      onSuccess?.(result);
      onClose();
    } catch (error) {
      console.error("Failed to award coupons:", error);
      toast.error(`Failed to award coupons: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal individual-award-modal">
        <div className="modal-header">
          <h3>Individual Customer Awards</h3>
          <button onClick={onClose} className="close-button">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Tab Navigation */}
          <div className="tab-navigation">
            <button
              className={`tab ${activeTab === "coins" ? "active" : ""}`}
              onClick={() => setActiveTab("coins")}
            >
              <Coins size={16} />
              Award Coins
            </button>
            <button
              className={`tab ${activeTab === "coupons" ? "active" : ""}`}
              onClick={() => setActiveTab("coupons")}
            >
              <Gift size={16} />
              Award Coupons
            </button>
          </div>

          {/* Customer Search and Selection */}
          <div className="customer-selection-section">
            <div className="search-filters">
              <div className="search-input">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search by name, email, customer ID, or phone"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="filter-controls">
                <select
                  value={filters.customerType}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      customerType: e.target.value,
                    }))
                  }
                >
                  <option value="">All Customer Types</option>
                  <option value="house_owner">House Owner</option>
                  <option value="mason">Mason</option>
                  <option value="builder_contractor">Builder/Contractor</option>
                  <option value="others">Others</option>
                </select>

                <select
                  value={filters.membershipTier}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      membershipTier: e.target.value,
                    }))
                  }
                >
                  <option value="">All Membership Tiers</option>
                  <option value="silver">Silver</option>
                  <option value="gold">Gold</option>
                  <option value="platinum">Platinum</option>
                </select>
              </div>
            </div>

            {/* Selected Customers Summary */}
            {selectedCustomers.length > 0 && (
              <div className="selected-summary">
                <Users size={16} />
                <span>{selectedCustomers.length} customers selected</span>
                <button
                  className="clear-selection"
                  onClick={() => setSelectedCustomers([])}
                >
                  Clear All
                </button>
              </div>
            )}

            {/* Customer List */}
            <div className="customer-list">
              <div className="list-header">
                <label>
                  <input
                    type="checkbox"
                    checked={
                      customers.length > 0 &&
                      customers.every((customer) =>
                        selectedCustomers.some(
                          (selected) => selected._id === customer._id
                        )
                      )
                    }
                    onChange={handleSelectAll}
                  />
                  Select All on Page
                </label>
              </div>

              {searching ? (
                <div className="loading-state">Loading customers...</div>
              ) : customers.length === 0 ? (
                <div className="empty-state">No customers found</div>
              ) : (
                <div className="customers-grid">
                  {customers.map((customer) => (
                    <div key={customer._id} className="customer-item">
                      <label>
                        <input
                          type="checkbox"
                          checked={selectedCustomers.some(
                            (selected) => selected._id === customer._id
                          )}
                          onChange={(e) =>
                            handleCustomerSelect(customer, e.target.checked)
                          }
                        />
                        <div className="customer-info">
                          <div className="customer-name">{customer.name}</div>
                          <div className="customer-details">
                            <span>ID: {customer.customerId}</span>
                            <span>Type: {customer.customerType}</span>
                            {customer.membershipTier && (
                              <span>Tier: {customer.membershipTier}</span>
                            )}
                          </div>
                          <div className="customer-contact">
                            <span>{customer.email}</span>
                            {customer.phone && <span>{customer.phone}</span>}
                          </div>
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="pagination">
                  <button
                    disabled={pagination.page <= 1}
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        page: prev.page - 1,
                      }))
                    }
                  >
                    Previous
                  </button>
                  <span>
                    {pagination.page} of {pagination.pages}
                  </span>
                  <button
                    disabled={pagination.page >= pagination.pages}
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        page: prev.page + 1,
                      }))
                    }
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Award Form */}
          <div className="award-form-section">
            {activeTab === "coins" ? (
              <div className="coin-award-form">
                <h4>Award Coins</h4>
                <div className="form-group">
                  <label>Number of Coins</label>
                  <input
                    type="number"
                    min="1"
                    value={awardData.coins}
                    onChange={(e) =>
                      setAwardData((prev) => ({
                        ...prev,
                        coins: e.target.value,
                      }))
                    }
                    placeholder="Enter coin amount"
                  />
                </div>

                <div className="form-group">
                  <label>Reason</label>
                  <textarea
                    value={awardData.reason}
                    onChange={(e) =>
                      setAwardData((prev) => ({
                        ...prev,
                        reason: e.target.value,
                      }))
                    }
                    placeholder="Enter reason for awarding coins"
                    rows="3"
                  />
                </div>

                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={awardData.notifyCustomer}
                      onChange={(e) =>
                        setAwardData((prev) => ({
                          ...prev,
                          notifyCustomer: e.target.checked,
                        }))
                      }
                    />
                    Notify customers via email/SMS
                  </label>
                </div>
              </div>
            ) : (
              <div className="coupon-award-form">
                <h4>Award Coupon</h4>
                <div className="form-group">
                  <label>Select Coupon</label>
                  <select
                    value={selectedCoupon}
                    onChange={(e) => setSelectedCoupon(e.target.value)}
                  >
                    <option value="">Choose a coupon</option>
                    {availableCoupons.map((coupon) => (
                      <option key={coupon._id} value={coupon._id}>
                        {coupon.couponDetails.code} - {coupon.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Reason</label>
                  <textarea
                    value={couponReason}
                    onChange={(e) => setCouponReason(e.target.value)}
                    placeholder="Enter reason for awarding coupon"
                    rows="3"
                  />
                </div>

                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={awardData.notifyCustomer}
                      onChange={(e) =>
                        setAwardData((prev) => ({
                          ...prev,
                          notifyCustomer: e.target.checked,
                        }))
                      }
                    />
                    Notify customers via email/SMS
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            className="primary"
            onClick={
              activeTab === "coins" ? handleAwardCoins : handleAwardCoupons
            }
            disabled={loading || selectedCustomers.length === 0}
          >
            {loading
              ? "Processing..."
              : `Award ${activeTab === "coins" ? "Coins" : "Coupon"}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default IndividualAwardModal;
