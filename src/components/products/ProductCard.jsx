import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "react-query";
import { cartAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-hot-toast";
import ImageWithFallback from "../common/ImageWithFallback";
import "./ProductCard.css";
import { useNavigate } from "react-router-dom";
import useDynamicDistance from "../../hooks/useDynamicDistance";
import { FaTruck, FaClock, FaMapMarkerAlt } from "react-icons/fa";
import { Heart, Star, ShoppingCart, MapPin, Truck, Zap } from "lucide-react";
import { useDistancePricing } from "../../hooks/useDistancePricing";
// Add this line around line 16, after the existing imports
import KnowMoreModal from "../common/KnowMoreModal";
import { FaInfoCircle } from "react-icons/fa";

const ProductCard = ({ product, viewMode = "grid", showDistance = false }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showKnowMoreModal, setShowKnowMoreModal] = useState(false);
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);
  const [showQuantityInput, setShowQuantityInput] = useState(false);
  // const [isWishlisted, setIsWishlisted] = useState(false);
  const [showDistanceCalculator, setShowDistanceCalculator] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState(null);

  const { userLocation, getCurrentLocation, calculateDistance, loading } =
    useDistancePricing();

  // Safe rendering functions to handle undefined/null values
  const safeRender = (value, fallback = "") => {
    if (value === null || value === undefined) return fallback;
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  };

  const safeNumber = (value, fallback = 0) => {
    if (value === null || value === undefined || isNaN(value)) return fallback;
    return Number(value);
  };

const inferSubcategoryFromName = (productName) => {
    if (!productName) return null;
    
    const name = productName.toLowerCase();
    
    // Map product names to subcategories
    if (name.includes('20mm') || name.includes('20 mm')) return '20_mm_metal';
    if (name.includes('10mm') || name.includes('10 mm')) return '10mm_metal';
    if (name.includes('40mm') || name.includes('40 mm')) return '40mm_metal';
    if (name.includes('dust')) return 'dust';
    if (name.includes('gsb')) return 'gsb';
    if (name.includes('wmm')) return 'wmm';
    if (name.includes('m sand') || name.includes('m.sand')) return 'm_sand';
    if (name.includes('river sand')) return 'river_sand';
    if (name.includes('fe-415') || name.includes('fe 415')) return 'fe_415';
    if (name.includes('fe-500') || name.includes('fe 500')) return 'fe_500';
    if (name.includes('opc 53') || name.includes('53 grade')) return 'opc_53';
    if (name.includes('opc 43') || name.includes('43 grade')) return 'opc_43';
    if (name.includes('ppc')) return 'ppc';
    
    return null;
  };

  // Extract product data with enhanced quantity controls
  const productData = {
    _id: product._id || "",
    name: safeRender(product.name, "Construction Material"),
    description: safeRender(
      product.description,
      "High quality construction material"
    ),

    // Images
    images: product.images || [],
    primaryImage:
      product.primaryImage ||
      product.image ||
      product.images?.[0]?.url ||
      "/placeholder-product.jpg",

    // Price from pricing.basePrice
    price: safeNumber(product.pricing?.basePrice || product.price, 999),
    originalPrice: safeNumber(
      product.pricing?.originalPrice || product.originalPrice
    ),
    unit: safeRender(product.pricing?.unit || product.unit, "unit"),

    // Stock info
    inStock: product.stock?.available > 0 || product.inStock !== false,
    stockQuantity: safeNumber(
      product.stock?.available || product.stockQuantity,
      100
    ),

    // Quantity constraints
    minOrderQuantity: safeNumber(
      product.pricing?.minimumQuantity || product.minOrderQuantity,
      1
    ),
    maxOrderQuantity: safeNumber(
      product.stock?.available || product.stockQuantity,
      100
    ),

    // Ratings
    averageRating: safeNumber(
      product.ratings?.average || product.averageRating || product.rating,
      4.2
    ),
    reviewCount: safeNumber(
      product.ratings?.totalReviews ||
        product.reviewCount ||
        product.totalReviews ||
        product.reviews,
      25
    ),

    // Supplier info
    supplier: {
      _id: product.supplier?._id || "",
      businessName: safeRender(
        product.supplier?.companyName ||
          product.supplierName ||
          product.supplier?.businessName ||
          product.supplier?.name,
        "Verified Supplier"
      ),
      location: {
        city: safeRender(product.supplier?.location?.city, ""),
        state: safeRender(product.supplier?.location?.state, ""),
      },
    },

    category: safeRender(product.category, "Construction"),
    badge: product.badge,
  };

  // Set initial quantity to minimum order quantity
  useEffect(() => {
    setQuantity(productData.minOrderQuantity);
  }, [productData.minOrderQuantity]);

  // Regular Add to Cart mutation (adds to cart and stays on current page)
  const addToCartMutation = useMutation((data) => cartAPI.addToCart(data), {
    onSuccess: () => {
      toast.success(
        `Added ${quantity} ${productData.unit}${
          quantity > 1 ? "s" : ""
        } to cart!`
      );
      queryClient.invalidateQueries("cart");
      // Reset quantity to minimum after successful add
      setQuantity(productData.minOrderQuantity);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to add to cart");
    },
    onSettled: () => {
      setIsAddingToCart(false);
    },
  });

  // Buy Now mutation (adds to cart and redirects to checkout)
  const buyNowMutation = useMutation((data) => cartAPI.addToCart(data), {
    onSuccess: () => {
      toast.success("Redirecting to checkout...");
      queryClient.invalidateQueries("cart");

      // Redirect to checkout page
      setTimeout(() => {
        navigate("/checkout");
      }, 1000);
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to proceed to checkout"
      );
    },
    onSettled: () => {
      setIsBuyingNow(false);
    },
  });

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error("Please login to add items to cart");
      navigate("/auth/login");
      return;
    }

    if (user.role === "supplier") {
      toast.error("Suppliers cannot purchase products");
      return;
    }
    if (user.role === "admin") {
      toast.error("Admin cannot purchase products");
      return;
    }

    // Validate quantity
    if (quantity < productData.minOrderQuantity) {
      toast.error(
        `Minimum order quantity is ${productData.minOrderQuantity} ${
          productData.unit
        }${productData.minOrderQuantity > 1 ? "s" : ""}`
      );
      return;
    }

    if (quantity > productData.maxOrderQuantity) {
      toast.error(
        `Maximum available quantity is ${productData.maxOrderQuantity} ${
          productData.unit
        }${productData.maxOrderQuantity > 1 ? "s" : ""}`
      );
      return;
    }

    setIsAddingToCart(true);
    addToCartMutation.mutate({
      productId: product._id,
      quantity,
    });
  };

  // New Buy Now handler
  const handleBuyNow = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error("Please login to purchase");
      navigate("/auth/login");
      return;
    }

    if (user.role === "supplier") {
      toast.error("Suppliers cannot purchase products");
      return;
    }

    // Validate quantity
    if (quantity < productData.minOrderQuantity) {
      toast.error(
        `Minimum order quantity is ${productData.minOrderQuantity} ${
          productData.unit
        }${productData.minOrderQuantity > 1 ? "s" : ""}`
      );
      return;
    }

    if (quantity > productData.maxOrderQuantity) {
      toast.error(
        `Maximum available quantity is ${productData.maxOrderQuantity} ${
          productData.unit
        }${productData.maxOrderQuantity > 1 ? "s" : ""}`
      );
      return;
    }

    setIsBuyingNow(true);
    buyNowMutation.mutate({
      productId: product._id,
      quantity,
    });
  };

  const handleQuantityChange = (e, action) => {
    e.preventDefault();
    e.stopPropagation();

    let newQuantity = quantity;

    if (action === "decrease") {
      newQuantity = Math.max(productData.minOrderQuantity, quantity - 1);
    } else if (action === "increase") {
      newQuantity = Math.min(productData.maxOrderQuantity, quantity + 1);
    }

    setQuantity(newQuantity);
  };

  const handleDirectQuantityInput = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const value = parseInt(e.target.value) || productData.minOrderQuantity;
    const clampedValue = Math.max(
      productData.minOrderQuantity,
      Math.min(productData.maxOrderQuantity, value)
    );
    setQuantity(clampedValue);
  };

  const handleQuantityKeyPress = (e) => {
    if (e.key === "Enter") {
      setShowQuantityInput(false);
    }
  };

  // // const getQuantitySteps = () => {
  // //   // Quick quantity options based on product type
  // //   const steps = [productData.minOrderQuantity];
  // //   const max = Math.min(productData.maxOrderQuantity, 50);

  // //   if (productData.unit === "MT" || productData.unit === "bags") {
  // //     // For bulk items like cement/steel
  // //     steps.push(5, 10, 25, 50);
  // //   } else if (productData.unit === "numbers") {
  // //     // For bricks/blocks
  // //     steps.push(100, 500, 1000, 5000);
  // //   } else {
  // //     // Default steps
  // //     steps.push(5, 10, 20, 50);
  // //   }

  //   return [...new Set(steps)]
  //     .filter((step) => step <= max && step >= productData.minOrderQuantity)
  //     .sort((a, b) => a - b);
  // };

  const formatPrice = (price) => {
    const numPrice = safeNumber(price);
    if (numPrice === 0) return "₹999";

    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(numPrice);
  };

  const getTotalPrice = () => {
    return formatPrice(productData.price * quantity);
  };

  const renderStars = (rating) => {
    const stars = [];
    const numRating = safeNumber(rating);
    const fullStars = Math.floor(numRating);
    const hasHalfStar = numRating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <span key={i} className="star filled">
          ★
        </span>
      );
    }

    if (hasHalfStar) {
      stars.push(
        <span key="half" className="star half">
          ★
        </span>
      );
    }

    const remainingStars = 5 - Math.ceil(numRating);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(
        <span key={`empty-${i}`} className="star empty">
          ★
        </span>
      );
    }

    return stars;
  };

  // Enhanced Quantity Controls Component
  const QuantityControls = () => (
    <div className="quantity-section">
      <div className="quantity-controls">
        <button
          onClick={(e) => handleQuantityChange(e, "decrease")}
          className="quantity-btn decrease"
          disabled={quantity <= productData.minOrderQuantity}
          title="Decrease quantity"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <path
              d="M2 6h8"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>

        {showQuantityInput ? (
          <input
            type="number"
            value={quantity}
            onChange={handleDirectQuantityInput}
            onKeyPress={handleQuantityKeyPress}
            onBlur={() => setShowQuantityInput(false)}
            className="quantity-input"
            min={productData.minOrderQuantity}
            max={productData.maxOrderQuantity}
            autoFocus
          />
        ) : (
          <span
            className="quantity-display"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowQuantityInput(true);
            }}
            title="Click to edit quantity"
          >
            {quantity}
          </span>
        )}

        <button
          onClick={(e) => handleQuantityChange(e, "increase")}
          className="quantity-btn increase"
          disabled={quantity >= productData.maxOrderQuantity}
          title="Increase quantity"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <path
              d="M6 2v8M2 6h8"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {productData.minOrderQuantity > 1 && (
        <div className="quantity-infos">
          <span className="min-orders">
            Min: {productData.minOrderQuantity}
          </span>
        </div>
      )}
    </div>
  );

  const [supplierInfo] = useState(() => {
    if (product.supplier) {
      return [
        {
          _id: product.supplier._id,
          businessName: productData.supplier.businessName,
          name: productData.supplier.businessName,
          location: product.supplier.location,
        },
      ];
    }
    return [];
  });

  const { getSupplierDistance, isLocationAvailable } = useDynamicDistance(
    supplierInfo,
    true
  );

  const renderDistanceInfo = () => {
    if (!isLocationAvailable || !supplierInfo.length) return null;

    const distance = getSupplierDistance(product.supplier?._id);
    if (!distance) return null;

    const distanceData =
      distance.distance || distance.fallbackDistance?.distance;
    const deliveryTime =
      distance.deliveryTime || distance.fallbackDistance?.deliveryTime;

    if (!distanceData || !deliveryTime) return null;

    return (
      <div className="distance-info">
        <div className="distance-item">
          <FaMapMarkerAlt className="distance-icon" />
          <span className="distance-text">{distanceData.text}</span>
        </div>
        <div className="delivery-item">
          <FaTruck
            className={`delivery-icon ${
              deliveryTime.hours <= 4 ? "same-day" : "next-day"
            }`}
          />
          <span
            className={`delivery-text ${
              deliveryTime.hours <= 4 ? "same-day" : "next-day"
            }`}
          >
            {deliveryTime.text}
          </span>
        </div>
        {distance.hasTrafficData && (
          <div className="traffic-info">
            <FaClock className="traffic-icon" />
            <span className="traffic-text">Live traffic</span>
          </div>
        )}
        {distance.isFallback && (
          <div className="fallback-info">
            <span className="fallback-text">Estimated</span>
          </div>
        )}
      </div>
    );
  };

  // Enhanced Action Buttons Component
  const ActionButtons = ({ variant = "grid" }) => {
    const isOutOfStock = product.stock?.available <= 0 || !productData.inStock;
    return (
      <div className="action-buttons-container">
        <div className="buy-cart">
          <button
            onClick={handleAddToCart}
            disabled={isAddingToCart || isOutOfStock}
            className={`add-to-cart-btn ${isOutOfStock ? "out-of-stock" : ""}`}
          >
            <ShoppingCart size={16} />
            {isOutOfStock
              ? "Out of Stock"
              : isAddingToCart
                ? "Adding..."
                : "Add to Cart"}
          </button>

          {!isOutOfStock && (
            <button
              onClick={handleBuyNow}
              disabled={isBuyingNow}
              className="buy-now-btn"
            >
              <Zap size={16} />
              {isBuyingNow ? "Processing..." : "Buy Now"}
            </button>
          )}
        </div>

        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            
            setShowKnowMoreModal(true);
          }}
          className="know-more-btn-grid"
          title="View detailed information"
        >
          <FaInfoCircle size={14} />
          Know More
        </button>
      </div>
    );
  };

  // Delivery Information Component
  const DeliveryInfo = () => {
    const handleCalculateDelivery = async () => {
      if (!userLocation) {
        try {
          await getCurrentLocation();
        } catch (error) {
          console.error("Failed to get location:", error);
          return;
        }
      }

      if (product.supplier?.coordinates) {
        try {
          const result = await calculateDistance(
            product.supplier.coordinates,
            userLocation,
            product.specifications?.weight || 1
          );
          setDeliveryInfo(result);
        } catch (error) {
          console.error("Failed to calculate delivery:", error);
        }
      }
    };

    return (
      <div className="mb-4">
        {!showDistanceCalculator ? (
          <button
            onClick={() => setShowDistanceCalculator(true)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
          >
            <Calculator className="w-4 h-4" />
            Calculate Delivery Cost
          </button>
        ) : (
          <div className="bg-gray-50 rounded-lg p-3">
            {!deliveryInfo ? (
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  Get delivery cost and time estimate
                </p>
                <button
                  onClick={handleCalculateDelivery}
                  disabled={loading}
                  className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? "Calculating..." : "Calculate"}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-3 h-3" />
                    <span>{deliveryInfo.distance.value} km away</span>
                  </div>
                  <div className="flex items-center gap-2 text-green-600">
                    <Truck className="w-3 h-3" />
                    <span className="font-medium">
                      ₹{deliveryInfo.pricing.transportCost}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-orange-600">
                  <Clock className="w-3 h-3" />
                  <span>
                    {deliveryInfo.delivery.estimatedHours.min}-
                    {deliveryInfo.delivery.estimatedHours.max} hours
                  </span>
                </div>

                <button
                  onClick={() => setShowDistanceCalculator(false)}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Hide details
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // List view
  if (viewMode === "list") {
    return (
      <div className="product-card list-view">
        <Link to={`/products/${productData._id}`} className="product-link">
          <div className="product-image-container">
            <ImageWithFallback
              src={productData.primaryImage}
              alt={productData.name}
              className="product-image"
              fallbackType="product"
            />
            {productData.badge && (
              <span className={`product-badge ${productData.badge.type}`}>
                {productData.badge.text}
              </span>
            )}
          </div>
        </Link>

        <div className="product-info">
          <div className="product-details">
            <Link to={`/products/${productData._id}`} className="product-link">
              <h3 className="product-name">{productData.name}</h3>
            </Link>

            <div className="product-categorys">
              <span className="category-badges">{productData.category}</span>
            </div>

            <p className="product-description">{productData.description}</p>

            <div className="product-meta">
              <div className="product-supplier">
                <span className="supplier-label">By:</span>
                <Link
                  to={`/suppliers/${productData.supplier._id}`}
                  className="supplier-name"
                >
                  {productData.supplier.businessName}
                </Link>
              </div>

              {productData.supplier.location.city && (
                <div className="product-location">
                  📍 {productData.supplier.location.city}
                  {productData.supplier.location.state &&
                    `, ${productData.supplier.location.state}`}
                </div>
              )}
            </div>

            <div className="product-rating">
              <div className="stars">
                {renderStars(productData.averageRating)}
              </div>
              <span className="rating-counts">
                ({productData.reviewCount} reviews)
              </span>
            </div>

            <div className="stock-info">
              <span
                className={`stock-status ${
                  productData.inStock ? "in-stock" : "out-of-stock"
                }`}
              >
                {productData.inStock
                  ? `${productData.stockQuantity} available`
                  : "Out of stock"}
              </span>
            </div>
          </div>

          <div className="product-actions">
            <div className="product-pricing">
              <div className="price-info">
                <div className="price-main">
                  {formatPrice(productData.price)}
                  <span className="price-unit">/{productData.unit}</span>
                </div>
                {quantity > 1 && (
                  <div className="total-price">Total: {getTotalPrice()}</div>
                )}
                {productData.originalPrice &&
                  productData.originalPrice > productData.price && (
                    <div className="price-original">
                      {formatPrice(productData.originalPrice)}
                    </div>
                  )}
              </div>
            </div>

            <QuantityControls />

            <ActionButtons variant="list" />
          </div>
        </div>
      </div>
    );
  }

  // Grid view (default) - FIXED VERSION
  return (
    <div className="prod-card grid-view">
      <Link to={`/products/${productData._id}`} className="prod-link">
        <div className="product-image-container">
          <ImageWithFallback
            src={productData.primaryImage}
            alt={productData.name}
            className="product-image"
            fallbackType="product"
          />
          {productData.badge && (
            <span className={`product-badge ${productData.badge.type}`}>
              {productData.badge.text}
            </span>
          )}
        </div>
      </Link>
      <div className="prod-info">
        <Link
          style={{ textDecoration: "none" }}
          to={`/products/${productData._id}`}
          className="prod-info-header"
        >
          <h3 className="prod-name">{productData.name}</h3>
          <div className="prod-ratings">
            <div className="all-stars">
              {renderStars(productData.averageRating)}
            </div>
            <span className="rating-count">({productData.reviewCount})</span>
          </div>
        </Link>

        <div className="prod-category">
          <span className="prod-category-badge">{productData.category}</span>
        </div>

        <div className="prod-supplier">
          <span className="supplier-label">By </span>
          <Link
            to={`/suppliers/${productData.supplier._id}`}
            className="supplier-name"
          >
            {productData.supplier.businessName}
          </Link>
        </div>

        <div className="prod-pricing">
          <div className="prod-price-info">
            <div className="prod-price-main">
              {formatPrice(productData.price)}
              <span className="price-unit">/{productData.unit}</span>
            </div>
            {quantity > 1 && (
              <div className="total-price">Total: {getTotalPrice()}</div>
            )}
            {/* {productData.originalPrice &&
              productData.originalPrice > productData.price && (
                <div className="price-original">
                  {formatPrice(productData.originalPrice)}
                </div>
              )} */}
          </div>
        </div>

        <div className="stocks-select">
          <div className="prod-stock-info">
            <span
              className={`stock-text ${
                productData.inStock ? "in-stock" : "out-of-stock"
              }`}
            >
              {productData.inStock
                ? `${productData.stockQuantity} available`
                : "Out of stock"}
            </span>
          </div>
          <QuantityControls />
        </div>

        {/* Stock Badge */}
        {product.stock?.available <= 0 && (
          <div className="stock-badge out-of-stock">Out of Stock</div>
        )}

        {product.stock?.available > 0 &&
          product.stock?.available <=
            (product.stock?.lowStockThreshold || 10) && (
            <div className="stock-badge low-stock">Low Stock</div>
          )}

        <div className="product-actions-btns">
          {/* ADD THE MISSING QUANTITY CONTROLS */}
          <ActionButtons />
        </div>
      </div>

      <KnowMoreModal
        isOpen={showKnowMoreModal}
        onClose={() => setShowKnowMoreModal(false)}
        productId={productData._id}
        category={product.category}
        subcategory={product.subcategory || inferSubcategoryFromName(productData.name)}
        title={productData.name}
      />

      {/* Distance and Delivery Info */}
      {showDistance && renderDistanceInfo()}
    </div>
  );
};

export default ProductCard;
