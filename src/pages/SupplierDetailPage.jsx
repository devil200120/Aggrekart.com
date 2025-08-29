import React, { useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "react-query";
import { suppliersAPI } from "../services/api";
import LoadingSpinner from "../components/common/LoadingSpinner";
import ProductCard from "../components/products/ProductCard";
import {
  FaArrowLeft,
  FaMapMarkerAlt,
  FaStar,
  FaBox,
  FaTruck,
  FaCalendarAlt,
  FaPhone,
  FaEnvelope,
  FaGlobe,
  FaAward,
  FaCertificate,
  FaUser,
  FaCheckCircle,
  FaCommentDots,
  FaFilter,
  FaThumbsUp,
} from "react-icons/fa";
import "./SupplierDetailPage.css";

const SupplierDetailPage = () => {
  const { supplierId } = useParams();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("all");
  const [reviewFilter, setReviewFilter] = useState("all"); // all, 5, 4, 3, 2, 1
  const [showAllReviews, setShowAllReviews] = useState(false);

  // Fetch supplier details
  const {
    data: response,
    isLoading,
    error,
  } = useQuery(
    ["supplier-details", supplierId],
    () => suppliersAPI.getSupplierDetails(supplierId),
    {
      enabled: !!supplierId,
      retry: 1,
      onError: (error) => {
        console.error("Failed to fetch supplier details:", error);
      },
    }
  );

  // Extract data with better error handling
  const supplier = response?.data?.supplier;
  const productsByCategory = response?.data?.products || {};
  const totalProducts = response?.data?.totalProducts || 0;
  const categories = response?.data?.categories || [];
  const reviewsData = response?.data?.reviews || {};

  // Debug logging
  React.useEffect(() => {
    if (response) {
      console.log("Supplier API Response:", response);
      console.log("Reviews Data:", reviewsData);
    }
  }, [response, reviewsData]);

  // Helper functions
  const formatDate = (dateString) => {
    if (!dateString) return "Not available";
    try {
      return new Date(dateString).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (error) {
      return "Invalid date";
    }
  };

  const formatRelativeTime = (dateString) => {
    if (!dateString) return "Unknown";
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const diffMonths = Math.floor(diffDays / 30);
      const diffYears = Math.floor(diffDays / 365);

      if (diffDays === 0) return "Today";
      if (diffDays === 1) return "1 day ago";
      if (diffDays < 30) return `${diffDays} days ago`;
      if (diffMonths === 1) return "1 month ago";
      if (diffMonths < 12) return `${diffMonths} months ago`;
      if (diffYears === 1) return "1 year ago";
      return `${diffYears} years ago`;
    } catch (error) {
      return "Unknown";
    }
  };

  // Get location string
  const getLocationString = (supplier) => {
    if (!supplier) return "Location not specified";

    const city =
      supplier.businessDetails?.address?.city || supplier.address?.city;
    const state =
      supplier.businessDetails?.address?.state || supplier.address?.state;

    if (city && state) {
      return `${city}, ${state}`;
    } else if (city) {
      return city;
    } else if (state) {
      return state;
    }

    return "Location not specified";
  };

  // Star rating component
  const renderStars = (rating, size = "normal") => {
    const stars = [];
    const numRating = Number(rating) || 0;
    const fullStars = Math.floor(numRating);
    const hasHalfStar = numRating % 1 !== 0;

    const starClass = size === "small" ? "star small" : "star";

    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={i} className={`${starClass} filled`} />);
    }

    if (hasHalfStar) {
      stars.push(<FaStar key="half" className={`${starClass} half`} />);
    }

    const remainingStars = 5 - Math.ceil(numRating);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(
        <FaStar key={`empty-${i}`} className={`${starClass} empty`} />
      );
    }

    return stars;
  };

  // Filter products based on active category
  const filteredProducts = useMemo(() => {
    if (!productsByCategory || typeof productsByCategory !== "object") {
      return [];
    }

    if (activeCategory === "all") {
      const allProducts = Object.values(productsByCategory)
        .flat()
        .filter(
          (product) => product && typeof product === "object" && product._id
        );
      return allProducts;
    }

    const categoryProducts = (productsByCategory[activeCategory] || []).filter(
      (product) => product && typeof product === "object" && product._id
    );
    return categoryProducts;
  }, [productsByCategory, activeCategory]);

  // Filter reviews based on rating filter
  const filteredReviews = useMemo(() => {
    if (!reviewsData.allReviews) return [];

    if (reviewFilter === "all") {
      return reviewsData.allReviews;
    }

    return reviewsData.allReviews.filter(
      (review) => review.rating === parseInt(reviewFilter)
    );
  }, [reviewsData.allReviews, reviewFilter]);

  // Get reviews to display (limited or all based on showAllReviews)
  const reviewsToDisplay = useMemo(() => {
    if (showAllReviews) {
      return filteredReviews;
    }
    return filteredReviews.slice(0, 6);
  }, [filteredReviews, showAllReviews]);

  // Loading state
  if (isLoading) {
    return (
      <div className="swiggy-supplier-detail">
        <div className="swiggy-container">
          <div className="swiggy-supplier-loading">
            <div className="loading-container">
              <LoadingSpinner />
              <h3>Loading supplier details...</h3>
              <p>Please wait while we fetch supplier information</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !supplier) {
    return (
      <div className="swiggy-supplier-detail">
        <div className="swiggy-container">
          <div className="swiggy-supplier-error">
            <div className="error-container">
              <div className="error-icon">🏪</div>
              <h2>Supplier Not Found</h2>
              <p>
                The supplier you're looking for might not be available or may
                have been removed.
              </p>
              <div className="error-actions">
                <button
                  onClick={() => navigate("/products")}
                  className="swiggy-btn swiggy-btn-primary"
                >
                  <FaArrowLeft />
                  Back to Products
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="swiggy-btn swiggy-btn-secondary"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="swiggy-supplier-detail">
      <div className="swiggy-container">
        {/* Breadcrumb */}
        <div className="swiggy-breadcrumb">
          <Link to="/" className="breadcrumb-item">
            Home
          </Link>
          <span className="breadcrumb-separator">/</span>
          <Link to="/products" className="breadcrumb-item">
            Products
          </Link>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-item active">
            {supplier?.name || "Supplier"}
          </span>
        </div>

        {/* Supplier Header Card */}
        <div className="swiggy-supplier-header">
          <button
            onClick={() => navigate(-1)}
            className="swiggy-back-btn"
            aria-label="Go back"
          >
            <FaArrowLeft />
          </button>

          <div className="supplier-header-content">
            <div className="supplier-basic-info">
              <div className="supplier-avatar">
                {supplier?.profileImage ? (
                  <img
                    src={supplier.profileImage}
                    alt={supplier.name}
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "flex";
                    }}
                  />
                ) : null}
                <div
                  className="supplier-avatar-fallback"
                  style={{
                    display: supplier?.profileImage ? "none" : "flex",
                  }}
                >
                  {supplier?.name?.charAt(0)?.toUpperCase() || "S"}
                </div>
              </div>

              <div className="supplier-info">
                <h1 className="supplier-name">
                  {supplier?.name || "Supplier"}
                </h1>
                <div className="supplier-location">
                  <FaMapMarkerAlt />
                  <span>{getLocationString(supplier)}</span>
                </div>
              </div>
            </div>

            <div className="supplier-stats-grid">
              <div className="supplier-badges">
                <div className="badge verified">
                  <FaCertificate />
                  Verified Supplier
                </div>
                <div className="badge featured">
                  <FaAward />
                  Quality Assured
                </div>
              </div>

              {/* Enhanced Rating Display */}
              <div className="supplier-rating-details">
                <div className="rating-summary">
                  <div className="rating-score">
                    <span className="score-number">
                      {(supplier?.rating || 0).toFixed(1)}
                    </span>
                    <div className="score-stars">
                      {renderStars(supplier?.rating || 0)}
                    </div>
                  </div>
                  <div className="rating-info">
                    <p className="rating-count">
                      {supplier?.ratingCount || 0} reviews
                    </p>
                    <p className="rating-source">Based on product reviews</p>
                  </div>
                </div>

                {supplier?.productStats && (
                  <div className="product-stats">
                    <div className="stat-item">
                      <span className="stat-number">
                        {supplier.productStats.totalProducts || 0}
                      </span>
                      <span className="stat-label">Products</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-number">
                        {supplier.totalOrders || 0}
                      </span>
                      <span className="stat-label">Orders</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Cards */}
        <div className="swiggy-quick-stats">
          <div className="stat-card">
            <div className="stat-icon">
              <FaBox />
            </div>
            <div className="stat-content">
              <div className="stat-number">{totalProducts}</div>
              <div className="stat-label">Total Products</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <FaCalendarAlt />
            </div>
            <div className="stat-content">
              <div className="stat-number">{supplier?.yearsInBusiness}</div>
              <div className="stat-label">Years in Business</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <FaCommentDots />
            </div>
            <div className="stat-content">
              <div className="stat-number">{reviewsData.totalReviews || 0}</div>
              <div className="stat-label">Customer Reviews</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <FaTruck />
            </div>
            <div className="stat-content">
              <div className="stat-number">
                {supplier?.transportRates?.length || 0}
              </div>
              <div className="stat-label">Delivery Zones</div>
            </div>
          </div>
        </div>

        {/* Customer Reviews Section */}
        {reviewsData.totalReviews > 0 && (
          <div className="swiggy-reviews-section">
            <div className="reviews-header">
              <h2>
                <FaCommentDots />
                Customer Reviews ({reviewsData.totalReviews})
              </h2>
              <p>See what customers say about products from {supplier?.name}</p>
            </div>

            {/* Rating Overview */}
            <div className="reviews-overview">
              <div className="overall-rating">
                <div className="rating-display">
                  <span className="overall-score">
                    {(reviewsData.averageRating || 0).toFixed(1)}
                  </span>
                  <div className="overall-stars">
                    {renderStars(reviewsData.averageRating || 0)}
                  </div>
                  <p className="total-reviews">
                    {reviewsData.totalReviews} reviews
                  </p>
                </div>
              </div>

              <div className="rating-breakdown">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = reviewsData.ratingBreakdown?.[rating] || 0;
                  const percentage =
                    reviewsData.totalReviews > 0
                      ? (count / reviewsData.totalReviews) * 100
                      : 0;

                  return (
                    <div key={rating} className="rating-bar">
                      <span className="rating-stars-small">
                        {rating} {renderStars(rating, "small")}
                      </span>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="rating-count">{count}</span>
                    </div>
                  );
                })}
              </div>

              <div className="verified-reviews">
                <div className="verified-badge">
                  <FaCheckCircle />
                  <span>
                    {reviewsData.verifiedReviews || 0} Verified Purchases
                  </span>
                </div>
              </div>
            </div>

            {/* Review Filters */}
            <div className="review-filters">
              <div className="filter-group">
                <FaFilter />
                <span className="filter-label">Filter by rating:</span>
                <div className="filter-buttons">
                  <button
                    className={`filter-btn ${reviewFilter === "all" ? "active" : ""}`}
                    onClick={() => setReviewFilter("all")}
                  >
                    All ({reviewsData.totalReviews})
                  </button>
                  {[5, 4, 3, 2, 1].map((rating) => {
                    const count = reviewsData.ratingBreakdown?.[rating] || 0;
                    if (count === 0) return null;

                    return (
                      <button
                        key={rating}
                        className={`filter-btn ${reviewFilter === rating.toString() ? "active" : ""}`}
                        onClick={() => setReviewFilter(rating.toString())}
                      >
                        {rating} ⭐ ({count})
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Reviews List */}
            {reviewsToDisplay.length > 0 ? (
              <div className="reviews-list">
                {reviewsToDisplay.map((review) => (
                  <div key={review._id} className="review-card">
                    <div className="review-header">
                      <div className="reviewer-info">
                        <div className="reviewer-avatar">
                          <FaUser />
                        </div>
                        <div className="reviewer-details">
                          <h4 className="reviewer-name">
                            {review.user?.name || "Anonymous"}
                          </h4>
                          <div className="reviewer-meta">
                            <span className="customer-type">
                              {review.user?.customerType === "business"
                                ? "Business"
                                : "Individual"}
                            </span>
                            {review.isVerifiedPurchase && (
                              <span className="verified-purchase">
                                <FaCheckCircle />
                                Verified Purchase
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="review-rating">
                        <div className="stars">
                          {renderStars(review.rating, "small")}
                        </div>
                        <span className="review-date">
                          {formatRelativeTime(review.createdAt)}
                        </span>
                      </div>
                    </div>

                    {review.comment && (
                      <div className="review-comment">
                        <p>"{review.comment}"</p>
                      </div>
                    )}

                    <div className="review-product">
                      <div className="product-info">
                        <div className="product-image">
                          {review.product?.image ? (
                            <img
                              src={review.product.image}
                              alt={review.product.name}
                              onError={(e) => {
                                e.target.src = "/placeholder-product.jpg";
                              }}
                            />
                          ) : (
                            <div className="image-placeholder">
                              <FaBox />
                            </div>
                          )}
                        </div>
                        <div className="product-details">
                          <h5>{review.product?.name || "Product"}</h5>
                          <span className="product-category">
                            {review.product?.category
                              ?.replace("_", " ")
                              .toUpperCase() || "Product"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Show More/Less Button */}
                {filteredReviews.length > 6 && (
                  <div className="reviews-show-more">
                    <button
                      className="show-more-btn"
                      onClick={() => setShowAllReviews(!showAllReviews)}
                    >
                      {showAllReviews
                        ? `Show Less Reviews`
                        : `Show All ${filteredReviews.length} Reviews`}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="no-reviews">
                <div className="no-reviews-content">
                  <FaCommentDots />
                  <h3>No reviews match your filter</h3>
                  <p>
                    Try selecting a different rating filter to see more reviews.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Products Section */}
        <div className="swiggy-products-section">
          <div className="products-header">
            <h2>Products by {supplier?.name}</h2>
            <p>
              Explore {totalProducts} high-quality products from this trusted
              supplier
            </p>
          </div>

          {/* Category Filter */}
          {categories.length > 0 && (
            <div className="swiggy-category-filter">
              <button
                className={`category-btn ${
                  activeCategory === "all" ? "active" : ""
                }`}
                onClick={() => setActiveCategory("all")}
              >
                All Products ({totalProducts})
              </button>
              {categories.map((category) => {
                const categoryCount = productsByCategory[category]?.length || 0;
                return (
                  <button
                    key={category}
                    className={`category-btn ${
                      activeCategory === category ? "active" : ""
                    }`}
                    onClick={() => setActiveCategory(category)}
                  >
                    {category.replace("_", " ").toUpperCase()} ({categoryCount})
                  </button>
                );
              })}
            </div>
          )}

          {/* Products Grid */}
          {filteredProducts.length > 0 ? (
            <div className="swiggy-products-grid">
              {filteredProducts.map((product) => {
                if (!product || !product._id) {
                  console.warn("Invalid product detected:", product);
                  return null;
                }

                return (
                  <ProductCard
                    key={product._id}
                    product={product}
                    showSupplierInfo={false}
                  />
                );
              })}
            </div>
          ) : (
            <div className="swiggy-no-products">
              <div className="no-products-content">
                <div className="no-products-icon">📦</div>
                <h3>No Products Available</h3>
                <p>
                  {activeCategory === "all"
                    ? "This supplier hasn't added any products yet."
                    : `No products available in the ${activeCategory} category.`}
                </p>
                {activeCategory !== "all" && (
                  <button
                    onClick={() => setActiveCategory("all")}
                    className="swiggy-btn swiggy-btn-primary"
                  >
                    View All Products
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Transport Rates Section */}
        {supplier?.transportRates && supplier.transportRates.length > 0 && (
          <div className="swiggy-transport-section">
            <h3>
              <FaTruck /> Transport Rates
            </h3>
            <div className="transport-rates-grid">
              {supplier.transportRates.map((rate, index) => (
                <div key={index} className="transport-rate-card">
                  <div className="rate-distance">
                    Up to {rate.maxDistance === 999 ? "20+" : rate.maxDistance}
                    km
                  </div>
                  <div className="rate-price">₹{rate.ratePerKm}/km</div>
                  <div className="rate-time">{rate.estimatedTime}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Business Information */}
        <div className="swiggy-business-info">
          <div className="business-card">
            <h3>Business Information</h3>
            <div className="business-details">
              <div className="detail-item">
                <strong>Business Type:</strong>
                <span>{supplier?.businessDetails?.businessType}</span>
              </div>
              <div className="detail-item">
                <strong>GST Number:</strong>
                <span>
                  {supplier?.businessDetails?.gstNumber || "Not provided"}
                </span>
              </div>
              <div className="detail-item">
                <strong>Established:</strong>
                <span>
                  {formatDate(supplier?.businessDetails?.establishedDate)}
                </span>
              </div>
              <div className="detail-item">
                <strong>Address:</strong>
                <span>
                  {supplier?.businessDetails?.address?.full ||
                    getLocationString(supplier)}
                </span>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="contact-card">
            <h3>Contact Information</h3>
            <div className="contact-details">
              {supplier?.contactInfo?.phone && (
                <div className="contact-item">
                  <FaPhone />
                  <span>{supplier.contactInfo.phone}</span>
                </div>
              )}
              {supplier?.contactInfo?.email && (
                <div className="contact-item">
                  <FaEnvelope />
                  <span>{supplier.contactInfo.email}</span>
                </div>
              )}
              {supplier?.contactInfo?.contactPerson && (
                <div className="contact-item">
                  <strong>Contact Person:</strong>
                  <span>{supplier.contactInfo.contactPerson}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplierDetailPage;
