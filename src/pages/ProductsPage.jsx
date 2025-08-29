import React, { useState, useEffect, useMemo,useRef } from "react";
import { useQuery } from "react-query";
import { useSearchParams, Link } from "react-router-dom";
import { productsAPI } from "../services/api";
import ProductCard from "../components/products/ProductCard";
import ProductFilters from "../components/products/ProductFilters";
import LoadingSpinner from "../components/common/LoadingSpinner";
import ProductFiltersDialog from "../components/products/ProductFiltersDialog";
import "./ProductsPage.css";

const ProductsPage = () => {
  const hasAutoOpenedDialog = useRef(false);

  const [suppliers, setSuppliers] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    category: searchParams.get("category") || "",
    subcategory: searchParams.get("subcategory") || "",
    search: searchParams.get("search") || "",
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
    rating: searchParams.get("rating") || "",
    availability: searchParams.get("availability") || "",
    sortBy: searchParams.get("sortBy") || "newest",
    brand: searchParams.get("brand") || "",
    // Location parameters
    userLatitude: searchParams.get("userLatitude") || "",
    userLongitude: searchParams.get("userLongitude") || "",
    maxDistance: searchParams.get("maxDistance") || "",
  });

  const [viewMode, setViewMode] = useState("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showFiltersDialog, setShowFiltersDialog] = useState(false); // ADD THIS LINE

  // Handle window resize for mobile detection
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) {
        setShowFilters(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  // Set default view mode based on device
  useEffect(() => {
    if (isMobile && viewMode === "grid") {
      setViewMode("list");
    }
  }, [isMobile]);

  useEffect(() => {
  const categoryFromUrl = searchParams.get("category");
  const subcategoryFromUrl = searchParams.get("subcategory");
  
  // Simple check: if mobile and has category/subcategory params, show dialog once
  if (isMobile && (categoryFromUrl || subcategoryFromUrl)) {
    // Use a small delay to ensure the page is fully loaded
    const timer = setTimeout(() => {
      setShowFiltersDialog(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }
}, []); // Empty dependency array - runs only once on mount
  // Map frontend sort values to backend expected values
  const mapSortValue = (sortBy) => {
    const sortMapping = {
      featured: "popular",
      price_low: "price_low",
      price_high: "price_high",
      rating: "rating",
      newest: "newest",
      name: "newest",
      distance: "distance",
    };
    return sortMapping[sortBy] || "newest";
  };

  // Prepare API parameters
  const apiParams = useMemo(() => {
    const params = {
      page: currentPage,
      limit: isMobile ? 8 : 12,
      sort: mapSortValue(filters.sortBy),
    };

    // Add only non-empty filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== "newest" && key !== "sortBy") {
        if (
          key === "minPrice" ||
          key === "maxPrice" ||
          key === "rating" ||
          key === "userLatitude" ||
          key === "userLongitude" ||
          key === "maxDistance"
        ) {
          params[key] = parseFloat(value);
        } else {
          params[key] = value;
        }
      }
    });

    console.log("📡 API parameters:", params);
    return params;
  }, [filters, currentPage, isMobile]);

  // Fetch products with better error handling
  const { data, isLoading, error, refetch } = useQuery(
    ["products", apiParams],
    () => productsAPI.getProducts(apiParams),
    {
      keepPreviousData: true,
      staleTime: 30000,
      retry: 2,
      onSuccess: (data) => {
        console.log("✅ Products loaded:", data?.data?.products?.length);
      },
      onError: (error) => {
        console.error("❌ Products API error:", error);
      },
    }
  );

  // Fetch categories for filters
  const { data: categoriesData, error: categoriesError } = useQuery(
    "categories",
    () => productsAPI.getCategories(),
    {
      staleTime: 300000,
      retry: 3,
      onError: (error) => {
        console.error("❌ Categories API error:", error);
      },
    }
  );

  // Fallback categories if API fails
  const fallbackCategories = [
    {
      _id: "cement",
      name: "Cement",
      productCount: 0,
      subcategories: {
        "OPC Cement": "OPC Cement",
        opc: "OPC",
      },
    },
    {
      _id: "tmt_steel",
      name: "TMT Steel",
      productCount: 0,
      subcategories: {
        "FE-415": "FE-415",
        "FE-500": "FE-500",
        fe_500: "FE-500",
      },
    },
    {
      _id: "bricks_blocks",
      name: "Bricks & Blocks",
      productCount: 0,
      subcategories: {
        "Fly Ash Bricks": "Fly Ash Bricks",
      },
    },
    {
      _id: "sand",
      name: "Sand",
      productCount: 0,
      subcategories: {
        "M Sand": "M Sand",
        "River Sand": "River Sand",
        river_sand_plastering: "River Sand (Plastering)",
      },
    },
    {
      _id: "aggregate",
      name: "Aggregate",
      productCount: 0,
      subcategories: {
        "Metal Aggregate": "Metal Aggregate",
        "Stone Aggregate": "Stone Aggregate",
        dust: "Dust",
      },
    },
  ];

  // Transform categories
  const categories = useMemo(() => {
    console.log("🏷️ Processing categories...", {
      categoriesData,
      categoriesError,
    });

    if (categoriesError || !categoriesData?.data?.categories) {
      console.log("🏷️ Using fallback categories due to error or missing data");
      return fallbackCategories;
    }

    const categoriesObj = categoriesData.data.categories;
    console.log("🏷️ Raw categories from API:", categoriesObj);

    const transformedCategories = Object.entries(categoriesObj).map(
      ([key, category]) => ({
        _id: key,
        name: category.name,
        productCount: 0,
        subcategories: category.subcategories || {},
      })
    );

    console.log("🏷️ Transformed categories:", transformedCategories);
    return transformedCategories;
  }, [categoriesData, categoriesError]);

  useEffect(() => {
    if (data?.data?.products) {
      const uniqueSuppliers = [];
      const supplierIds = new Set();

      data.data.products.forEach((product) => {
        if (product.supplier && !supplierIds.has(product.supplier._id)) {
          supplierIds.add(product.supplier._id);
          uniqueSuppliers.push(product.supplier);
        }
      });

      setSuppliers(uniqueSuppliers);
      console.log(
        `📍 Found ${uniqueSuppliers.length} suppliers on products page`
      );
    }
  }, [data]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    console.log(`🔧 Filter change: ${key} = ${value}`);

    setFilters((prev) => {
      const newFilters = { ...prev, [key]: value };

      // Reset subcategory if category changes
      if (key === "category") {
        newFilters.subcategory = "";
      }

      return newFilters;
    });

    setCurrentPage(1);

    // Update URL params
    const newSearchParams = new URLSearchParams(searchParams);
    if (value) {
      newSearchParams.set(key, value);
    } else {
      newSearchParams.delete(key);
    }
    setSearchParams(newSearchParams);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setFilters({
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
    });
    setCurrentPage(1);
    setSearchParams({});
  };

  const handleApplyFilters = (newFilters) => {
  console.log('🔧 Bulk filter update:', newFilters)
  setFilters(newFilters)
  setCurrentPage(1)
  
  // Update URL params
  const newSearchParams = new URLSearchParams()
  Object.entries(newFilters).forEach(([key, value]) => {
    if (value && key !== 'sortBy') {
      newSearchParams.set(key, value)
    }
  })
  setSearchParams(newSearchParams)
  setShowFiltersDialog(false)
};

  const handleResetFilters = () => {
    clearAllFilters();
    setShowFiltersDialog(false);
  };

  // Get active filter count

  // Get active filter count
  const getActiveFilterCount = () => {
    let count = 0;

    if (filters.category) count++;
    if (filters.subcategory) count++;
    if (filters.search) count++;
    if (filters.minPrice || filters.maxPrice) count++;
    if (filters.rating) count++;
    if (filters.availability) count++;
    if (filters.brand) count++;
    if (filters.userLatitude && filters.userLongitude) count++;

    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  // Handle pagination
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const sortOptions = [
    { value: "newest", label: "Newest First" },
    { value: "featured", label: "Featured" },
    { value: "price_low", label: "Price: Low to High" },
    { value: "price_high", label: "Price: High to Low" },
    { value: "rating", label: "Highest Rated" },
    // Add distance option only when location is available
    ...(filters.userLatitude && filters.userLongitude
      ? [{ value: "distance", label: "📍 Nearest First" }]
      : []),
  ];

  // Loading and error states
  if (isLoading && currentPage === 1) {
    return (
      <div className="products-page">
        <div className="loading-container">
          <LoadingSpinner />
          <p>Loading products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="products-page">
        <div className="error-container">
          <h3>Something went wrong</h3>
          <p>
            {error?.response?.data?.message ||
              error.message ||
              "Failed to load products"}
          </p>
          <button onClick={() => refetch()} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const products = data?.data?.products || [];
  const totalProducts = data?.data?.pagination?.totalItems || 0;
  const totalPages = data?.data?.pagination?.totalPages || 1;

  return (
    <div className="products-page">
      <div className="products-page-container">
        {/* Header */}
        <div className="products-page-header">
          <div className="page-title-section">
            <h1>Products</h1>
            <p>
              {totalProducts > 0 ? (
                <>
                  Showing {products.length} of {totalProducts} products
                  {filters.userLatitude && filters.userLongitude && (
                    <span className="location-info">
                      📍 within {filters.maxDistance}km of your location
                    </span>
                  )}
                </>
              ) : (
                "No products found"
              )}
            </p>
          </div>

          <div className="page-controls">
            {/* View Mode Toggle */}
            <div className="view-mode-toggle">
              <button
                className={`view-mode-btn ${viewMode === "grid" ? "active" : ""}`}
                onClick={() => setViewMode("grid")}
                title="Grid View"
              >
                ⊞
              </button>
              <button
                className={`view-mode-btn ${viewMode === "list" ? "active" : ""}`}
                onClick={() => setViewMode("list")}
                title="List View"
              >
                ☰
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="sort-dropdown">
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange("sortBy", e.target.value)}
                className="sort-select"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Mobile Filters Toggle */}
            {/* Mobile Filters Toggle */}
            {isMobile && (
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  className="mobile-filters-toggle"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  Filter{" "}
                  {activeFilterCount > 0 && (
                    <span className="filter-count">({activeFilterCount})</span>
                  )}
                </button>
                
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="products-page-content">
          {/* Filters Sidebar */}
          <div
            className={`filters-sidebar ${isMobile ? (showFilters ? "mobile-open" : "mobile-closed") : ""}`}
          >
            <div className="filters-header">
              <h3>Filters</h3>
              {activeFilterCount > 0 && (
                <button onClick={clearAllFilters} className="clear-filters-btn">
                  Clear All ({activeFilterCount})
                </button>
              )}
              {isMobile && (
                <button
                  className="close-filters-btn"
                  onClick={() => setShowFilters(false)}
                >
                  ×
                </button>
              )}
            </div>

            <ProductFilters
              filters={filters}
              categories={categories}
              onFilterChange={handleFilterChange}
            />
          </div>

          {/* Products Grid */}

          {/* Products Grid */}
          <div className="products-main">
            {products.length > 0 ? (
              <>
                {/* Pagination at the top */}
                {totalPages > 1 && (
                  <div className="pagination pagination-top">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="pagination-btn"
                    >
                      Previous
                    </button>

                    <div className="pagination-numbers">
                      {Array.from(
                        { length: totalPages },
                        (_, index) => index + 1
                      ).map((page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`pagination-number ${currentPage === page ? "active" : ""}`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="pagination-btn"
                    >
                      Next
                    </button>
                  </div>
                )}

                {/* Products Grid */}
                <div className={`products-grid ${viewMode}`}>
                  {products.map((product) => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>

                {/* Pagination at the bottom (optional - you can remove this if you only want it at top) */}
                {totalPages > 1 && (
                  <div className="pagination pagination-bottom">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="pagination-btn"
                    >
                      Previous
                    </button>

                    <div className="pagination-numbers">
                      {Array.from(
                        { length: totalPages },
                        (_, index) => index + 1
                      ).map((page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`pagination-number ${currentPage === page ? "active" : ""}`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="pagination-btn"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="no-products">
                <h3>No products found</h3>
                <p>
                  {filters.userLatitude && filters.userLongitude
                    ? "No products found from nearby suppliers. Try increasing the distance range or adjusting your filters."
                    : "Try adjusting your filters or search terms."}
                </p>
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="reset-filters-btn"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filters Overlay */}
      {isMobile && showFilters && (
        <div
          className="mobile-filters-overlay"
          onClick={() => setShowFilters(false)}
        />
      )}
      {showFiltersDialog && (
        <ProductFiltersDialog
          isOpen={showFiltersDialog}
          onClose={() => setShowFiltersDialog(false)}
          filters={filters}
          onFilterChange={handleFilterChange}
          categories={categories}
          brands={[]} // Add this if your component needs it
          onApplyFilters={handleApplyFilters}
          onResetFilters={clearAllFilters}
        />
      )}
    </div>
  );
};

export default ProductsPage;
