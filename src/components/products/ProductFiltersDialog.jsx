import React, { useState, useEffect } from "react";
import { X, Filter, CheckCircle, RotateCcw, MapPin, ChevronDown } from "lucide-react";
import "./ProductFiltersDialog.css";

const ProductFiltersDialog = ({
  isOpen,
  onClose,
  filters,
  onFilterChange,
  categories,
  brands,
  onApplyFilters,
  onResetFilters,
}) => {
  const [tempFilters, setTempFilters] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    location: false,
    category: false,
    subcategory: false,
    price: false,
    rating: false,
    availability: false,
  });

  const [locationState, setLocationState] = useState({
    enabled: false,
    detecting: false,
    detected: false,
    error: null,
    coordinates: null,
    maxDistance: "5",
  });

  // Initialize temp filters when dialog opens
  useEffect(() => {
    if (isOpen) {
      setTempFilters({ ...filters });
    }
  }, [isOpen, filters]);

  // Auto-expand sections when dialog opens with existing filters
  useEffect(() => {
    if (isOpen && filters.category) {
      setExpandedSections(prev => ({
        ...prev,
        category: true,
        subcategory: selectedCategorySubcategories.length > 0
      }));
    }
  }, [isOpen, filters.category]);

  // FIXED: Get subcategories for the selected category - matching ProductFilters.jsx logic
  const getSubcategoriesForCategory = (categoryId) => {
    if (!categoryId || !categories) return []
    
    const category = categories.find(cat => cat._id === categoryId)
    if (!category?.subcategories) return []
    
    // Convert subcategories object to array format
    return Object.entries(category.subcategories).map(([key, value]) => ({
      id: key,
      name: value
    }))
  }

  const selectedCategorySubcategories = getSubcategoriesForCategory(tempFilters.category)

  const handleTempFilterChange = (key, value) => {
    setTempFilters((prev) => {
      const newFilters = { ...prev, [key]: value };
      
      // Clear subcategory when category changes
      if (key === "category") {
        newFilters.subcategory = "";
      }
      
      setHasChanges(true);
      return newFilters;
    });
  };

  const handleApplyFilters = () => {
    onApplyFilters(tempFilters);
    onClose();
  };

  const handleResetFilters = () => {
    const resetFilters = {
      category: "",
      subcategory: "",
      search: "",
      minPrice: "",
      maxPrice: "",
      rating: "",
      availability: "",
      sortBy: "newest",
      brand: "",
      userLatitude: "",
      userLongitude: "",
      maxDistance: "",
    };
    setTempFilters(resetFilters);
    onResetFilters();
    setHasChanges(false);
    onClose();
  };

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const detectLocation = () => {
    setLocationState(prev => ({ ...prev, detecting: true, error: null }));
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setLocationState(prev => ({
            ...prev,
            detecting: false,
            detected: true,
            coordinates: coords,
          }));
          handleTempFilterChange("userLatitude", coords.latitude.toString());
          handleTempFilterChange("userLongitude", coords.longitude.toString());
          handleTempFilterChange("maxDistance", locationState.maxDistance);
        },
        (error) => {
          setLocationState(prev => ({
            ...prev,
            detecting: false,
            error: "Location access denied",
          }));
        }
      );
    } else {
      setLocationState(prev => ({
        ...prev,
        detecting: false,
        error: "Geolocation not supported",
      }));
    }
  };

  const handleDistanceChange = (distance) => {
    setLocationState(prev => ({ ...prev, maxDistance: distance }));
    if (locationState.coordinates) {
      handleTempFilterChange("maxDistance", distance);
    }
  };

  const toggleLocationFilter = (enabled) => {
    setLocationState(prev => ({ ...prev, enabled }));
    if (!enabled) {
      handleTempFilterChange("userLatitude", "");
      handleTempFilterChange("userLongitude", "");
      handleTempFilterChange("maxDistance", "");
      setLocationState(prev => ({
        ...prev,
        detected: false,
        coordinates: null,
        error: null
      }));
    }
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (tempFilters.category) count++;
    if (tempFilters.subcategory) count++;
    if (tempFilters.search) count++;
    if (tempFilters.minPrice || tempFilters.maxPrice) count++;
    if (tempFilters.rating) count++;
    if (tempFilters.availability) count++;
    if (tempFilters.brand) count++;
    if (tempFilters.userLatitude && tempFilters.userLongitude) count++;
    return count;
  };

  if (!isOpen) return null;

  return (
    <div className="dialog-modal-overlay" onClick={onClose}>
      <div className="dialog-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="dialog-modal-header">
          <div className="dialog-header-left">
            <h3 className="dialog-modal-title">
              <Filter size={20} />
              Filters
            </h3>
            {getActiveFilterCount() > 0 && (
              <span className="dialog-active-filters-badge">
                {getActiveFilterCount()}
              </span>
            )}
          </div>
          <button className="dialog-modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="dialog-modal-content">
          {/* Location Filter */}
          <div className="dialog-filter-section">
            <button
              className="dialog-filter-section-header"
              onClick={() => toggleSection("location")}
            >
              <span><MapPin size={16} /> Location</span>
              <ChevronDown
                className={`dialog-expand-icon ${
                  expandedSections.location ? "expanded" : ""
                }`}
                size={16}
              />
            </button>
            
            {expandedSections.location && (
              <div className="dialog-filter-section-content">
                <div className="dialog-location-filter">
                  <div className="dialog-location-toggle">
                    <label className="dialog-checkbox-label">
                      <input
                        type="checkbox"
                        checked={locationState.enabled}
                        onChange={(e) => toggleLocationFilter(e.target.checked)}
                      />
                      <span>Filter by location</span>
                    </label>
                  </div>

                  {locationState.enabled && (
                    <>
                      {locationState.detecting && (
                        <div className="dialog-location-status">
                          <span>🔍 Detecting your location...</span>
                        </div>
                      )}

                      {locationState.error && (
                        <div className="dialog-location-error">
                          <span>❌ {locationState.error}</span>
                        </div>
                      )}

                      {locationState.detected && (
                        <div className="dialog-location-detected">
                          <span>✅ Location detected</span>
                        </div>
                      )}

                      {locationState.detected && (
                        <div className="dialog-distance-selector">
                          <span>Max Distance:</span>
                          <div className="dialog-distance-options">
                            {["5", "10", "25", "50"].map((distance) => (
                              <button
                                key={distance}
                                className={`dialog-distance-btn ${
                                  locationState.maxDistance === distance ? "active" : ""
                                }`}
                                onClick={() => handleDistanceChange(distance)}
                              >
                                {distance}km
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {!locationState.detected && !locationState.detecting && (
                        <button onClick={detectLocation} className="dialog-detect-location-btn">
                          📍 Detect My Location
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Category Filter */}
          <div className="dialog-filter-section">
            <button
              className="dialog-filter-section-header"
              onClick={() => toggleSection("category")}
            >
              <span>Category</span>
              <ChevronDown
                className={`dialog-expand-icon ${
                  expandedSections.category ? "expanded" : ""
                }`}
                size={16}
              />
            </button>
            
            {expandedSections.category && (
              <div className="dialog-filter-section-content">
                <div className="dialog-filter-options">
                  <label className="dialog-filter-option">
                    <input
                      type="radio"
                      name="category"
                      value=""
                      checked={tempFilters.category === ""}
                      onChange={(e) => {
                        handleTempFilterChange("category", e.target.value);
                        handleTempFilterChange("subcategory", "");
                      }}
                    />
                    <span>All Categories</span>
                  </label>
                  {categories.map((category) => (
                    <label key={category._id} className="dialog-filter-option">
                      <input
                        type="radio"
                        name="category"
                        value={category._id}
                        checked={tempFilters.category === category._id}
                        onChange={(e) => {
                          handleTempFilterChange("category", e.target.value);
                          handleTempFilterChange("subcategory", "");
                          // Auto-expand subcategory section when category is selected
                          const newSubcategories = getSubcategoriesForCategory(e.target.value);
                          if (newSubcategories.length > 0) {
                            setExpandedSections(prev => ({ ...prev, subcategory: true }));
                          }
                        }}
                      />
                      <span>{category.name}</span>
                      {category.productCount > 0 && (
                        <span className="dialog-count">({category.productCount})</span>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Subcategory Filter - FIXED LOGIC */}
          {tempFilters.category && selectedCategorySubcategories.length > 0 && (
            <div className="dialog-filter-section">
              <button
                className="dialog-filter-section-header"
                onClick={() => toggleSection("subcategory")}
              >
                <span>Subcategory</span>
                <ChevronDown
                  className={`dialog-expand-icon ${
                    expandedSections.subcategory ? "expanded" : ""
                  }`}
                  size={16}
                />
              </button>
              
              {expandedSections.subcategory && (
                <div className="dialog-filter-section-content">
                  <div className="dialog-filter-options">
                    <label className="dialog-filter-option">
                      <input
                        type="radio"
                        name="subcategory"
                        value=""
                        checked={tempFilters.subcategory === ""}
                        onChange={(e) =>
                          handleTempFilterChange("subcategory", e.target.value)
                        }
                      />
                      <span>All Subcategories</span>
                    </label>
                    {selectedCategorySubcategories.map((subcategory) => (
                      <label key={subcategory.id} className="dialog-filter-option">
                        <input
                          type="radio"
                          name="subcategory"
                          value={subcategory.id}
                          checked={tempFilters.subcategory === subcategory.id}
                          onChange={(e) =>
                            handleTempFilterChange("subcategory", e.target.value)
                          }
                        />
                        <span>{subcategory.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Price Filter */}
          <div className="dialog-filter-section">
            <button
              className="dialog-filter-section-header"
              onClick={() => toggleSection("price")}
            >
              <span>Price Range</span>
              <ChevronDown
                className={`dialog-expand-icon ${
                  expandedSections.price ? "expanded" : ""
                }`}
                size={16}
              />
            </button>
            
            {expandedSections.price && (
              <div className="dialog-filter-section-content">
                <div className="dialog-price-inputs">
                  <input
                    type="number"
                    placeholder="Min Price"
                    value={tempFilters.minPrice}
                    onChange={(e) => handleTempFilterChange("minPrice", e.target.value)}
                    className="dialog-price-input"
                  />
                  <span>-</span>
                  <input
                    type="number"
                    placeholder="Max Price"
                    value={tempFilters.maxPrice}
                    onChange={(e) => handleTempFilterChange("maxPrice", e.target.value)}
                    className="dialog-price-input"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Rating Filter */}
          <div className="dialog-filter-section">
            <button
              className="dialog-filter-section-header"
              onClick={() => toggleSection("rating")}
            >
              <span>Rating</span>
              <ChevronDown
                className={`dialog-expand-icon ${
                  expandedSections.rating ? "expanded" : ""
                }`}
                size={16}
              />
            </button>
            
            {expandedSections.rating && (
              <div className="dialog-filter-section-content">
                <div className="dialog-filter-options">
                  <label className="dialog-filter-option">
                    <input
                      type="radio"
                      name="rating"
                      value=""
                      checked={tempFilters.rating === ""}
                      onChange={(e) => handleTempFilterChange("rating", e.target.value)}
                    />
                    <span>Any Rating</span>
                  </label>
                  {[
                    { label: "4★ & above", value: "4" },
                    { label: "3★ & above", value: "3" },
                    { label: "2★ & above", value: "2" },
                    { label: "1★ & above", value: "1" },
                  ].map((option) => (
                    <label key={option.value} className="dialog-filter-option">
                      <input
                        type="radio"
                        name="rating"
                        value={option.value}
                        checked={tempFilters.rating === option.value}
                        onChange={(e) => handleTempFilterChange("rating", e.target.value)}
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="dialog-modal-footer">
          <button onClick={handleResetFilters} className="dialog-btn dialog-btn-secondary">
            <RotateCcw size={16} />
            Reset All
          </button>
          <button onClick={handleApplyFilters} className="dialog-btn dialog-btn-primary">
            <CheckCircle size={16} />
            Apply Filters ({getActiveFilterCount()})
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductFiltersDialog;