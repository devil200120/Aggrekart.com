import React, { useState } from "react";
import { useQuery } from "react-query";
import { useNavigate } from "react-router-dom";
import { productsAPI } from "../services/api";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-hot-toast";
import LoadingSpinner from "./common/LoadingSpinner";
import "./TopRatedProducts.css";

const TopRatedProducts = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [loadingProductId, setLoadingProductId] = useState(null);

  // Fetch products and limit to 6 for grid display
  const {
    data: productsData,
    isLoading,
    error,
  } = useQuery(
    "top-rated-products",
    () =>
      productsAPI.getProducts({
        limit: 20,
        sort: "rating",
        page: 1,
      }),
    {
      retry: 2,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
      onError: (error) => {
        console.error("Failed to fetch products:", error);
      },
    }
  );

  // Sort products by rating and take first 6
  const allProducts = (productsData?.data?.products || []).sort((a, b) => {
    const ratingA = a.averageRating || 0;
    const ratingB = b.averageRating || 0;

    if (ratingB !== ratingA) {
      return ratingB - ratingA;
    }

    const reviewsA = a.totalReviews || 0;
    const reviewsB = b.totalReviews || 0;

    if (reviewsB !== reviewsA) {
      return reviewsB - reviewsA;
    }

    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const products = allProducts.slice(0, 6);

  const formatPrice = (price) => {
    const numPrice = parseFloat(price) || 0;
    return `₹${numPrice.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
  };

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating || 0);
    const hasHalfStar = (rating || 0) % 1 >= 0.5;
    const stars = [];

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push("★");
      } else if (i === fullStars && hasHalfStar) {
        stars.push("⭐");
      } else {
        stars.push("☆");
      }
    }
    return stars.join("");
  };

  const getRatingBadgeColor = (rating) => {
    if (rating >= 4) return "#48c479";
    if (rating >= 3) return "#ffc107";
    if (rating >= 2) return "#ff8f00";
    if (rating >= 1) return "#ff6b35";
    return "#93959f";
  };

  const getRatingText = (rating, reviews) => {
    if (rating === 0 || !reviews) return "NEW";
    return rating.toFixed(1);
  };

  // Helper function to get minimum quantity for a product
  const getMinimumQuantity = (product) => {
    const minQty =
      parseInt(product.pricing?.minimumQuantity) ||
      parseInt(product.minimumQuantity) ||
      1;
    return isNaN(minQty) ? 1 : minQty;
  };

  // Helper function to format minimum quantity display
  const formatMinimumQuantity = (minQty, unit) => {
    if (minQty <= 1) return null;
    return `Min: ${minQty} ${unit || "units"}`;
  };

  const handleAddToCart = async (product) => {
    if (!user) {
      toast.error("Please login to add items to cart");
      navigate("/auth/login");
      return;
    }

    // Validate product data
    if (!product || !product._id) {
      toast.error("Invalid product data");
      return;
    }

    // Check if product has valid pricing
    const productPrice = product.price || product.pricing?.basePrice;
    if (!productPrice || productPrice <= 0) {
      toast.error("Product price not available");
      return;
    }

    // Get minimum quantity for this product
    const minimumQuantity = getMinimumQuantity(product);

    // Validate minimum quantity
    if (minimumQuantity > 1) {
      toast.success(
        `Adding ${minimumQuantity} ${product.pricing?.unit || product.unit || "units"} to cart (minimum order quantity)`
      );
    }

    setLoadingProductId(product._id);

    try {
      // Format product data according to CartContext expectations
      const productData = {
        _id: product._id,
        name: product.name,
        price: productPrice,
        pricing: {
          basePrice: productPrice,
          unit: product.pricing?.unit || product.unit || "MT",
          minimumQuantity: minimumQuantity,
        },
        images: product.images,
        supplier: product.supplier,
        category: product.category,
        inStock: product.inStock !== false,
      };

      console.log("Adding to cart:", {
        productId: product._id,
        quantity: minimumQuantity,
        product: productData,
      });

      // Call addToCart with THREE separate parameters as expected by CartContext
      const result = await addToCart(product._id, minimumQuantity, productData);

      console.log("Add to cart result:", result);
    } catch (error) {
      console.error("Add to cart error:", error);

      // More specific error messages
      if (error.response?.status === 400) {
        toast.error("Product not available or invalid quantity");
      } else if (error.response?.status === 401) {
        toast.error("Please login to add items to cart");
        navigate("/auth/login");
      } else if (error.response?.status === 404) {
        toast.error("Product not found");
      } else {
        // Don't show error toast here as CartContext will handle it
        console.error("Cart operation failed:", error);
      }
    } finally {
      setLoadingProductId(null);
    }
  };

  const handleProductClick = (productId) => {
    if (productId) {
      navigate(`/products/${productId}`);
    }
  };

  const handleViewAll = () => {
    navigate("/products?sort=rating");
  };

  if (isLoading) {
    return (
      <section className="top-rated-products-section">
        <div className="feature-container">
          <div className="section-heading">
            <div className="header-contents">
              <h2 className="section-titles">⭐ Featured Products</h2>
              <p className="section-subtitle">
                Quality construction materials from verified suppliers
              </p>
            </div>
          </div>
          <div className="loading-container">
            <LoadingSpinner />
            <p>Loading products...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="top-rated-products-section">
        <div className="container">
          <div className="section-header">
            <div className="header-content">
              <h2 className="section-title">⭐ Featured Products</h2>
              <span className="section-subtitle">
                Quality construction materials from verified suppliers
              </span>
            </div>
          </div>
          <div className="error-container">
            <p>Failed to load products. Please try again later.</p>
            <button
              onClick={() => window.location.reload()}
              className="retry-btn"
            >
              Try Again
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return (
      <section className="top-rated-products-section">
        <div className="container">
          <div className="section-header">
            <div className="header-content">
              <h2 className="section-title">⭐ Featured Products</h2>
              <p className="section-subtitle">
                Quality construction materials from verified suppliers
              </p>
            </div>
          </div>
          <div className="no-products-container">
            <div className="empty-state">
              <span className="empty-icon">📦</span>
              <h3>No Products Available</h3>
              <p>Check back later for construction materials!</p>
              <button
                onClick={() => navigate("/products")}
                className="browse-btn"
              >
                Browse All Products
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="top-rated-products-section">
      <div className="container">
        {/* Header */}
        <div className="section-header">
          <div className="header-contents">
            <h2 className="section-title">⭐ Featured Products</h2>
            <p className="section-subtitle">
              Quality construction materials from verified suppliers
            </p>
          </div>
          <button className="view-all-btn-header" onClick={handleViewAll}>
            View All
          </button>
        </div>

        {/* Products Grid (2 rows x 3 columns) */}
        <div className="productss-grid">
          {products.map((product) => {
            // Ensure product has required fields
            if (!product || !product._id) {
              return null;
            }

            const productPrice =
              product.price || product.pricing?.basePrice || 0;
            const isValidProduct = productPrice > 0;
            const minimumQuantity = getMinimumQuantity(product);
            const unit = product.pricing?.unit || product.unit || "MT";

            return (
              <div key={product._id} className="product-card-grid">
                {/* Product Image */}
                <div
                  className="product-image-grid"
                  onClick={() => handleProductClick(product._id)}
                >
                  <img
                    src={
                      product.image ||
                      product.images?.[0]?.url ||
                      "/placeholder-product.jpg"
                    }
                    alt={product.name || "Product"}
                    onError={(e) => {
                      e.target.src = "/placeholder-product.jpg";
                    }}
                  />

                  {/* Rating Badge */}
                  <div
                    className="rating-badge-grid"
                    style={{
                      backgroundColor: getRatingBadgeColor(
                        product.averageRating || 0
                      ),
                    }}
                  >
                    <span className="rating-star">
                      {(product.averageRating || 0) > 0 ? "★" : "✨"}
                    </span>
                    <span className="rating-value">
                      {getRatingText(
                        product.averageRating || 0,
                        product.totalReviews
                      )}
                    </span>
                  </div>

                  {/* Discount Badge */}
                  {product.originalPrice &&
                    product.originalPrice > productPrice && (
                      <div className="discount-badge">
                        {Math.round(
                          ((product.originalPrice - productPrice) /
                            product.originalPrice) *
                            100
                        )}
                        % OFF
                      </div>
                    )}

                  {/* Minimum Quantity Badge */}
                  {minimumQuantity > 1 && (
                    <div className="minimum-quantity-badge">
                      Min: {minimumQuantity} {unit}
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="product-info-grid">
                  <h3
                    className="product-name-grid"
                    onClick={() => handleProductClick(product._id)}
                    title={product.name || "Product"}
                  >
                    {product.name || "Unnamed Product"}
                  </h3>

                  <div className="supplier-info-grid">
                    <span className="supplier-name-grid">
                      {product.supplier?.companyName ||
                        product.supplierName ||
                        "Verified Supplier"}
                    </span>
                  </div>

                  <div className="price-rating-section">
                    <div className="price-info-grid">
                      <span className="current-price-grid">
                        {formatPrice(productPrice)}
                      </span>
                      <span className="price-unit-grid">/{unit}</span>
                    </div>

                    <div className="rating-display">
                      <span className="stars-grid">
                        {renderStars(product.averageRating)}
                      </span>
                      <span className="review-count-grid">
                        ({product.totalReviews || 0})
                      </span>
                    </div>
                  </div>

                  {/* Minimum Quantity Info */}
                  {minimumQuantity > 1 && (
                    <div className="minimum-quantity-info">
                      <span className="min-qty-text">
                        {formatMinimumQuantity(minimumQuantity, unit)}
                      </span>
                    </div>
                  )}

                  {/* Add to Cart Button */}
                  <button
                    className={`add-to-cart-btn-grid ${loadingProductId === product._id ? "loading" : ""} ${!isValidProduct ? "disabled" : ""}`}
                    onClick={() => handleAddToCart(product)}
                    disabled={
                      loadingProductId === product._id || !isValidProduct
                    }
                    title={
                      !isValidProduct
                        ? "Price not available"
                        : minimumQuantity > 1
                          ? `Add To Cart :${minimumQuantity} ${unit} to cart (minimum order)`
                          : "Add to cart"
                    }
                  >
                    {loadingProductId === product._id ? (
                      <>
                        <span className="btn-spinner">⏳</span>
                        Adding...
                      </>
                    ) : !isValidProduct ? (
                      <>
                        <span className="btn-icon">⚠️</span>
                        Price N/A
                      </>
                    ) : minimumQuantity > 1 ? (
                      <>
                        <span className="btn-icon">+</span>
                        ADD To Cart: {minimumQuantity}
                      </>
                    ) : (
                      <>
                        <span className="btn-icon">+</span>
                        ADD
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* View All Button */}
        <div className="view-all-section">
          <button className="view-all-btn-main" onClick={handleViewAll}>
            View All Products ({allProducts.length})
          </button>
        </div>
      </div>
    </section>
  );
};

export default TopRatedProducts;
