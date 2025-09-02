import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import MembershipCard from "../components/membership/MembershipCard";
import EnhancedCategoryCard from "../components/products/EnhancedCategoryCard";
import "./HomePage.css";
import AggregatesImg from "../Aggregates.JPG";
import TopRatedProducts from "../components/TopRatedProducts"; // Add this import
import { newsletterAPI } from "../services/api";
import CCBlocksImg from "../CC Blocks.JPG";
import TMTSteelImg from "../TMT Steel.webp";
import RedBricksImg from "../red_bricks.jpg";
import CementImg from "../Cement.jpg";
import DSC0200Img from "../DSC_0200.JPG";

import GoogleMapsLocationDetector from "../components/location/GoogleMapsLocationDetector";

import DSC0141Img from "../DSC_0141.JPG";
import DSC0158Img from "../DSC_0158.JPG";
import SandImg from "../Sand.JPG";
import Logo1Img from "../logo1.jpg";
import Logo2Img from "../Aggrebhai.png";
import AdvertisementImg from "../sponsor.jpg";
import CrusherImg from "../Home_page_image_crusher.jpg";
import ImagePng from "../image.png";
import Image20150619 from "../20150619_115730.jpg"; // Added this import
import UpiImg from "../upi.jpg";
import VisaImg from "../visa.jpg";
import MasterCardImg from "../master_card.jpg";
import RazorpayImg from "../razorpay.jpg";
import { productsAPI } from "../services/api";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import NewsletterForm from "../components/NewsletterForm";
import { toast } from "react-toastify"; // Make sure you have react-toastify installed
const HomePage = () => {
  const { user } = useAuth();
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);
  const [showAllCities, setShowAllCities] = useState(false);
  const citiesData = [
    "Bangalore",
    "Gurgaon",
    "Hyderabad",
    "Delhi",
    "Mumbai",
    "Pune",
    "Kolkata",
    "Chennai",
    "Ahmedabad",
    "Chandigarh",
    "Jaipur",
    "Lucknow",
    "Indore",
    "Bhopal",
    "Nagpur",
    "Surat",
    "Vadodara",
    "Rajkot",
    "Coimbatore",
    "Kochi",
    "Thiruvananthapuram",
    "Visakhapatnam",
    "Vijayawada",
    "Guntur",
    "Warangal",
    "Mysore",
    "Mangalore",
    "Hubli",
  ];
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentProductSlide, setCurrentProductSlide] = useState(0);
  const productScrollRef = useRef(null);
  const [currentImageSlide, setCurrentImageSlide] = useState(0); // Added for image slider
  const [showWhatsAppTooltip, setShowWhatsAppTooltip] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [userLocation, setUserLocation] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const navigate = useNavigate();
  const sliderImages = [
    { src: CrusherImg, alt: "Construction Site 2015" },
    { src: RedBricksImg, alt: "Red Bricks" },
    { src: SandImg, alt: "Sand" },
  ];
  useEffect(() => {
    const imageTimer = setInterval(() => {
      setCurrentImageSlide((prev) => (prev + 1) % sliderImages.length);
    }, 4000); // Change image every 4 seconds

    return () => clearInterval(imageTimer);
  }, [sliderImages.length]);
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await productsAPI.getProducts({
          limit: 8,
          featured: true,
        });
        setProducts(response.data.products || []);
      } catch (err) {
        console.error("Error fetching products:", err);
        setError("Failed to load products");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);
  useEffect(() => {
    if (products && products.length > 0) {
      const uniqueSuppliers = [];
      const supplierIds = new Set();

      products.forEach((product) => {
        if (product.supplier && !supplierIds.has(product.supplier._id)) {
          supplierIds.add(product.supplier._id);
          uniqueSuppliers.push(product.supplier);
        }
      });

      setSuppliers(uniqueSuppliers);
      console.log(`📍 Found ${uniqueSuppliers.length} suppliers on homepage`);
    }
  }, [products]);

  const productCategories = {
    aggregate: "aggregate",
    bricks: "bricks_blocks",
    cement: "cement",
    steel: "tmt_steel",
  };
  const heroSlides = [
    {
      title: "Build Your Dreams with",
      highlight: "Aggrekart",
      subtitle:
        "India's most trusted platform for construction materials. Connect with verified suppliers and get quality materials delivered directly to your construction site.",
      cta: "Start Building Today",
    },
    {
      title: "Premium Quality",
      highlight: "Materials",
      subtitle:
        "From cement to steel, bricks to tiles - we have everything you need for your construction project with guaranteed quality and competitive prices.",
      cta: "Explore Materials",
    },
    {
      title: "Trusted by",
      highlight: "50,000+ Builders",
      subtitle:
        "Join the community of successful contractors and builders who rely on Aggrekart for their construction material needs.",
      cta: "Join Community",
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  // Auto-slide functionality
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  const categories = [
    {
      id: 1,
      name: "Cement",
      icon: "🏗️",
      description: "Premium quality cement from trusted brands",
      image: "/images/cement.jpg",
      type: "cement",
      basePrice: 350,
      trending: true,
    },
    {
      id: 2,
      name: "TMT Steel",
      icon: "🔧",
      description: "High-grade TMT steel bars and rods",
      image: "/images/steel.jpg",
      type: "steel",
      basePrice: 65000,
      trending: true,
    },
    {
      id: 3,
      name: "Bricks",
      icon: "🧱",
      description: "Red bricks, fly ash bricks, and AAC blocks",
      image: "/images/bricks.jpg",
      type: "bricks",
      basePrice: 8,
    },
    {
      id: 4,
      name: "Sand",
      icon: "⏳",
      description: "River sand, M-sand, and construction sand",
      image: "/images/sand.jpg",
      type: "sand",
      basePrice: 1200,
    },
    {
      id: 5,
      name: "Gravel",
      icon: "🪨",
      description: "Crushed stone and aggregates for concrete",
      image: "/images/gravel.jpg",
      type: "aggregates",
      basePrice: 1500,
    },
    {
      id: 6,
      name: "Roofing",
      icon: "🏠",
      description: "Tiles, sheets, and roofing materials",
      image: "/images/roofing.jpg",
      type: "roofing",
      basePrice: 25,
    },
  ];

  const features = [
    {
      icon: "🛡️",
      title: "Verified Suppliers",
      description:
        "All suppliers are thoroughly verified with quality certifications and customer reviews",
      color: "#10B981",
    },
    {
      icon: "🚀",
      title: "Fast Delivery",
      description:
        "Quick delivery to your construction site with real-time tracking",
      color: "#3B82F6",
    },
    {
      icon: "💎",
      title: "Best Prices",
      description:
        "Competitive prices with transparent billing and bulk discounts",
      color: "#8B5CF6",
    },
    {
      icon: "📞",
      title: "24/7 Support",
      description: "Round-the-clock customer support with expert consultation",
      color: "#F59E0B",
    },
  ];
  const handleProductClick = (productId) => {
    navigate(`/products/${productId}`);
  };

  const testimonials = [
    {
      name: "Rajesh Kumar",
      role: "Civil Contractor",
      content:
        "Aggrekart has transformed how I source materials. Quality is consistent and delivery is always on time.",
      rating: 5,
      project: "50+ Projects Completed",
    },
    {
      name: "Priya Sharma",
      role: "Architect",
      content:
        "The variety and quality of materials available on Aggrekart is impressive. Highly recommended!",
      rating: 5,
      project: "200+ Designs Implemented",
    },
    {
      name: "Amit Patel",
      role: "Builder",
      content:
        "Best platform for construction materials. The support team is very helpful and responsive.",
      rating: 5,
      project: "100+ Houses Built",
    },
  ];
  // Add this test function after handleNewsletterSubmit
  const testNewsletterAPI = async () => {
    try {
      console.log("Testing newsletter API...");

      // Test 1: Check if backend is reachable
      const testResponse = await fetch(
        "http://localhost:5000/api/newsletter/test-email"
      );
      const testResult = await testResponse.json();

      console.log("Email test result:", testResult);

      if (testResult.success) {
        toast.success("Email configuration test passed! Check your email.");
      } else {
        toast.error("Email configuration test failed: " + testResult.error);
      }
    } catch (error) {
      console.error("Test failed:", error);
      toast.error("Backend connection failed: " + error.message);
    }
  };

  // Add this temporary button in your newsletter section (after the form)
  {
    process.env.NODE_ENV === "development" && (
      <button
        onClick={testNewsletterAPI}
        style={{
          marginTop: "10px",
          padding: "8px 16px",
          background: "#007bff",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        🧪 Test Email Config
      </button>
    );
  }

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();

    if (!newsletterEmail.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newsletterEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setNewsletterLoading(true);

    try {
      const response = await newsletterAPI.subscribe(
        newsletterEmail,
        "homepage"
      );

      if (response && response.success) {
        // Show success state
        setNewsletterSuccess(true);
        setNewsletterEmail("");

        // Hide success state after 3 seconds
        setTimeout(() => {
          setNewsletterSuccess(false);
        }, 3000);

        toast.success(
          response.message || "Successfully subscribed to newsletter!"
        );
      } else {
        toast.error(
          response?.message || "Failed to subscribe. Please try again."
        );
      }
    } catch (error) {
      console.error("Newsletter subscription error:", error);
      toast.error("Failed to subscribe. Please try again.");
    } finally {
      setNewsletterLoading(false);
    }
  };

  const handleWhatsAppClick = () => {
    const phoneNumber = "918837788388"; // Your phone number
    const message =
      "Hello! I'm interested in your construction materials. Can you help me?";
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };
  const getImageUrl = (product) => {
    // Method 1: Check for Cloudinary URL in images array
    if (product.images && product.images.length > 0) {
      const primaryImage = product.images.find((img) => img.isPrimary);
      const imageUrl = primaryImage ? primaryImage.url : product.images[0].url;
      if (imageUrl) return imageUrl;
    }

    // Method 2: Check for single image field (backend compatibility)
    if (product.image) {
      return product.image;
    }

    // Method 3: Fallback to placeholder
    return "/placeholder-product.jpg";
  };
  const handleLocationChange = (location) => {
    setUserLocation(location);
    console.log("📍 User location updated on homepage:", location);
  };
  const scrollToProduct = (direction) => {
    const container = productScrollRef.current;
    if (!container) return;

    const cardWidth = 300; // Width of each product card including margin
    const containerWidth = container.clientWidth;
    const visibleCards = Math.floor(containerWidth / cardWidth);
    const maxSlide = Math.max(0, 5 - visibleCards); // 5 is total number of products

    let newSlide;
    if (direction === "prev") {
      newSlide = Math.max(0, currentProductSlide - 1);
    } else {
      newSlide = Math.min(maxSlide, currentProductSlide + 1);
    }

    setCurrentProductSlide(newSlide);
    container.scrollTo({
      left: newSlide * cardWidth,
      behavior: "smooth",
    });
  };

  // Check if arrows should be enabled
  const canScrollLeft = currentProductSlide > 0;
  const canScrollRight = currentProductSlide < 2;

  return (
    <div className="home-page">
      <div
        className="whatsapp-float"
        onClick={handleWhatsAppClick}
        onMouseEnter={() => setShowWhatsAppTooltip(true)}
        onMouseLeave={() => setShowWhatsAppTooltip(false)}
      >
        <div className="whatsapp-icon">
          <i className="fab fa-whatsapp"></i>
        </div>
        {showWhatsAppTooltip && (
          <div className="whatsapp-tooltip">
            <span> Order on WhatsApp!</span>
          </div>
        )}
      </div>
      {/* Enhanced Hero Section with Slider */}
      <section className="aggregate-hero-section">
        {/* Image Slider Background */}
        <div className="aggregate-hero-background">
          {sliderImages.map((image, index) => (
            <div
              key={index}
              className={`hero-slide ${index === currentImageSlide ? "active" : ""}`}
            >
              <img src={image.src} alt={image.alt} className="hero-bg-image" />
            </div>
          ))}
          <div className="aggregate-hero-overlay"></div>
        </div>

        <div className="aggregate-container">
          <div className="aggregate-hero-content">
            <div className="aggregate-hero-text">
              <h1 className="aggregate-hero-title">
                Your Aggregate
                <br />
                <span className="aggregate-highlight">Supplier</span>
              </h1>

              <p className="aggregate-hero-subtitle">
                Connecting buyers with quarries
                <br />
                for high-quality aggregates.
              </p>

              <div className="aggregate-hero-actions">
                <Link to="/products" className="btn-learn-more">
                  LEARN MORE
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Slider Dots Navigation */}
        <div className="slider-dots">
          {sliderImages.map((_, index) => (
            <button
              key={index}
              className={`dot ${index === currentImageSlide ? "active" : ""}`}
              onClick={() => setCurrentImageSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </section>

      
      {/* Our Products Section */}
      {/* Our Products Section - Optimized Responsive */}
      <section className="product-showcase-section">
        <div className="showcase-container">
          <h2 className="showcase-title">Our Products</h2>
          <div className="product-showcase-grid">
            {/* Main Product - 40% space (left side) */}
            <Link
              to={`/products?category=${productCategories.aggregate}`}
              className="main-product-link"
            >
              <div className="main-product-card">
                <div className="main-product-image">
                  <img
                    src={AggregatesImg}
                    alt="Aggregate products"
                    className="main-product-img"
                  />
                </div>
                <div className="main-product-info">
                  <h3>Aggregate Products</h3>
                  <button className="main-product-cta">Click Here</button>
                </div>
              </div>
            </Link>

            {/* Secondary Products - 60% space (right side grid) */}
            <div className="secondary-products-grid">
              <Link
                to={`/products?category=${productCategories.bricks}`}
                className="secondary-product-link"
              >
                <div className="secondary-product-card">
                  <div className="secondary-product-image">
                    <img
                      src={SandImg}
                      alt="Sand"
                      className="secondary-product-img"
                    />
                  </div>
                  <div className="secondary-product-info">
                    <h4>Sand</h4>
                  </div>
                </div>
              </Link>

              <Link
                to={`/products?category=${productCategories.cement}`}
                className="secondary-product-link"
              >
                <div className="secondary-product-card">
                  <div className="secondary-product-image">
                    <img
                      src={CementImg}
                      alt="Cement"
                      className="secondary-product-img"
                    />
                  </div>
                  <div className="secondary-product-info">
                    <h4>Cement</h4>
                  </div>
                </div>
              </Link>

              <Link
                to={`/products?category=${productCategories.steel}`}
                className="secondary-product-link"
              >
                <div className="secondary-product-card">
                  <div className="secondary-product-image">
                    <img
                      src={TMTSteelImg}
                      alt="TMT Steel"
                      className="secondary-product-img"
                    />
                  </div>
                  <div className="secondary-product-info">
                    <h4>TMT Steel</h4>
                  </div>
                </div>
              </Link>

              <Link
                to={`/products?category=${productCategories.bricks}`}
                className="secondary-product-link"
              >
                <div className="secondary-product-card">
                  <div className="secondary-product-image">
                    <img
                      src={RedBricksImg}
                      alt="Clay Bricks"
                      className="secondary-product-img"
                    />
                  </div>
                  <div className="secondary-product-info">
                    <h4>
                      Bricks
                      <br />
                      (Concrete/Clay)
                    </h4>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="product-gallery-section">
        <div className="container">
          {/* Header with Title and Navigation Arrows */}
          <div className="gallery-header">
            <h2 className="gallery-title">
              Top Selling Products 
            </h2>
            <div className="gallery-navigation">
              <button
                className={`nav-arrow nav-arrow-left ${!canScrollLeft ? "disabled" : ""}`}
                onClick={() => scrollToProduct("prev")}
                disabled={!canScrollLeft}
                aria-label="Previous products"
              >
                <i className="fas fa-arrow-left"></i>
              </button>
              <button
                className={`nav-arrow nav-arrow-right ${!canScrollRight ? "disabled" : ""}`}
                onClick={() => scrollToProduct("next")}
                disabled={!canScrollRight}
                aria-label="Next products"
              >
                <i className="fas fa-arrow-right"></i>
              </button>
            </div>
          </div>

          <div className="product-scroll-container">
            <div className="product-scroll-wrapper" ref={productScrollRef}>
              {loading ? (
                // Loading skeleton
                [...Array(5)].map((_, index) => (
                  <div
                    key={index}
                    className="product-card-scroll loading-skeleton"
                  >
                    <div className="skeleton-badge"></div>
                    <div className="skeleton-image"></div>
                    <div className="skeleton-info">
                      <div className="skeleton-title"></div>
                      <div className="skeleton-price"></div>
                      <div className="skeleton-rating"></div>
                    </div>
                  </div>
                ))
              ) : error ? (
                // Error state
                <div className="error-state">
                  <p>Unable to load products. Please try again later.</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="retry-button"
                  >
                    Retry
                  </button>
                </div>
              ) : products.length > 0 ? (
                // Real products
                products.map((product) => {
                  const imageUrl = getImageUrl(product);
                  const hasDiscount =
                    product.pricing?.discount > 0 ||
                    (product.pricing?.originalPrice &&
                      product.pricing?.originalPrice >
                        product.pricing?.basePrice);
                  const currentPrice =
                    product.pricing?.basePrice || product.price || 0;
                  const originalPrice =
                    product.pricing?.originalPrice || product.originalPrice;

                  return (
                    <div
                      key={product._id}
                      className="product-card-scroll"
                      onClick={() => handleProductClick(product._id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleProductClick(product._id)
                      }
                    >
                      {hasDiscount && (
                        <div className="sale-badge">
                          {product.pricing?.discount
                            ? `${Math.round(product.pricing.discount)}% OFF`
                            : "SALE!"}
                        </div>
                      )}
                      <div className="product-image-scroll">
                        <img
                          src={imageUrl}
                          alt={product.name || "Product"}
                          loading="lazy"
                          onError={(e) => {
                            console.error("Image failed to load:", imageUrl);
                            e.target.src = "/placeholder-product.jpg";
                          }}
                        />
                      </div>
                      <div className="product-info-scroll">
                        <h4>{product.name || "Unnamed Product"}</h4>
                        <div className="price-scroll">
                          {hasDiscount && originalPrice && (
                            <span className="original-price">
                              ₹{originalPrice.toFixed(2)}
                            </span>
                          )}
                          <span className="sale-price">
                            ₹{currentPrice.toFixed(2)}
                          </span>
                        </div>
                        <div className="rating-scroll">
                          <span>
                            {"⭐".repeat(
                              Math.floor(
                                product.rating?.average ||
                                  product.averageRating ||
                                  5
                              )
                            )}
                          </span>
                          <span className="rating-count">
                            (
                            {product.rating?.count || product.totalReviews || 0}
                            )
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                // No products state
                <div className="no-products-state">
                  <p>No products available at the moment.</p>
                  <Link to="/products" className="browse-all-btn">
                    Browse All Products
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Scroll indicators */}
          <div className="scroll-indicators">
            <div
              className={`indicator ${currentProductSlide === 0 ? "active" : ""}`}
              onClick={() => setCurrentProductSlide(0)}
            ></div>
            <div
              className={`indicator ${currentProductSlide === 1 ? "active" : ""}`}
              onClick={() => setCurrentProductSlide(1)}
            ></div>
            <div
              className={`indicator ${currentProductSlide === 2 ? "active" : ""}`}
              onClick={() => setCurrentProductSlide(2)}
            ></div>
          </div>
        </div>
      </section>

      <section className="advertisement-section">
        <div className="advertisement-container">
          <div className="advertisement-content">
            <div className="advertisement-image-container">
              <img
                src={AdvertisementImg}
                alt="Aggrekart Special Offer - WhatsApp Booking Available"
                className="advertisement-image"
              />
            </div>
          </div>
        </div>
      </section>
      <TopRatedProducts />

      {/* New Testimonials Section */}
      <section className="testimonials-section">
        <div className="container">
          <div className="section-header">
            <div className="section-badge">
              <span>💬 Success Stories</span>
            </div>
            <h2 className="section-title">Trusted by Industry Leaders</h2>
            <p className="section-subtitle">
              See what our customers say about their experience with Aggrekart
            </p>
          </div>

          <div className="testimonials-grid">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="testimonial-card">
                <div className="testimonial-rating">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span key={i} className="star">
                      ⭐
                    </span>
                  ))}
                </div>
                <p className="testimonial-content">"{testimonial.content}"</p>
                <div className="testimonial-author">
                  <div className="author-avatar">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div className="author-info">
                    <h4 className="author-name">{testimonial.name}</h4>
                    <p className="author-role">{testimonial.role}</p>
                    <span className="author-project">
                      {testimonial.project}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced CTA Section */}
      {/* Replace the existing product-showcase-section with this Swiggy-style section */}
      <section className="swiggy-cta-section">
        <div className="swiggy-cta-container">
          <div className="swiggy-cta-content">
            <div className="swiggy-cta-visual">
              <div className="swiggy-rocket-icon">🚀</div>
              <div className="swiggy-gradient-bg"></div>
            </div>

            <div className="swiggy-cta-text">
              <h2 className="swiggy-cta-title">
                Ready to Transform Your Construction Process?
              </h2>
              <p className="swiggy-cta-subtitle">
                Join thousands of contractors, builders, and architects who
                trust Aggrekart for their construction material needs. Start
                your journey today!
              </p>

              <div className="swiggy-cta-actions">
                <Link to="/products" className="swiggy-primary-btn">
                  <span className="swiggy-btn-text">Explore Materials</span>
                  <span className="swiggy-btn-icon">→</span>
                </Link>

                <Link to="/suppliers" className="swiggy-secondary-btn">
                  <span className="swiggy-btn-text">Become a Supplier</span>
                  <span className="swiggy-btn-icon">🏢</span>
                </Link>
              </div>

              <div className="swiggy-trust-indicators">
                <div className="swiggy-trust-item">
                  <span className="swiggy-trust-icon">✅</span>
                  <span className="swiggy-trust-text">Verified Suppliers</span>
                </div>
                <div className="swiggy-trust-item">
                  <span className="swiggy-trust-icon">⚡</span>
                  <span className="swiggy-trust-text">Fast Delivery</span>
                </div>
                <div className="swiggy-trust-item">
                  <span className="swiggy-trust-icon">💯</span>
                  <span className="swiggy-trust-text">Quality Assured</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cities Service Delivery Section */}
      {/* <section className="cities-service-section">
        <div className="container">
          <div className="cities-header">
            <h2 className="cities-title">
              Cities with Construction Material Delivery
            </h2>
          </div>

          <div className="cities-grid">
            {citiesData
              .slice(0, showAllCities ? citiesData.length : 11)
              .map((city, index) => (
                <div
                  key={city}
                  className={`city-card ${index === 7 ? "highlighted" : ""}`}
                >
                  <span className="city-text">
                    Order materials online in <strong>{city}</strong>
                  </span>
                </div>
              ))}

            {!showAllCities && (
              <div
                className="city-card show-more-card"
                onClick={() => setShowAllCities(true)}
              >
                <span className="show-more-text">Show More ▼</span>
              </div>
            )}

            {showAllCities && (
              <div
                className="city-card show-less-card"
                onClick={() => setShowAllCities(false)}
              >
                <span className="show-less-text">Show Less ▲</span>
              </div>
            )}
          </div>
        </div>
      </section> */}
      {/* Enhanced Newsletter Section */}
      {/* Enhanced Newsletter Section */}
      {/* Enhanced Newsletter Section */}
      

{/* Swiggy-Style Newsletter Section */}

{/* Compact Swiggy-Style Newsletter Section */}
<section className="newsletter-compact-section">
  <div className="newsletter-compact-container">
    <div className="newsletter-compact-card">
      <div className="newsletter-compact-left">
        <div className="newsletter-compact-icon">📧</div>
        <div className="newsletter-compact-content">
          <h3 className="newsletter-compact-title">Stay Ahead of the Curve</h3>
          <p className="newsletter-compact-subtitle">
            Get exclusive updates on new materials, industry insights, and special offers
          </p>
        </div>
      </div>

      <div className="newsletter-compact-right">
        {/* Success State */}
        {newsletterSuccess ? (
          <div className="newsletter-compact-success">
            <div className="newsletter-compact-check">✓</div>
            <span className="newsletter-compact-success-text">Successfully Subscribed! 🎉</span>
          </div>
        ) : (
          /* Form */
          <form
            className="newsletter-compact-form"
            onSubmit={handleNewsletterSubmit}
          >
            <div className="newsletter-compact-input-wrapper">
              <input
                type="email"
                placeholder="Enter your email address"
                className="newsletter-compact-input"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                disabled={newsletterLoading}
                required
              />
              <button
                type="submit"
                className="newsletter-compact-btn"
                disabled={newsletterLoading || !newsletterEmail.trim()}
              >
                {newsletterLoading ? (
                  <>
                    <span className="newsletter-compact-spinner">⏳</span>
                    Subscribing...
                  </>
                ) : (
                  <>
                    Subscribe Now
                    <span className="newsletter-compact-arrow">→</span>
                  </>
                )}
              </button>
            </div>
            <p className="newsletter-compact-privacy">
              🔒 We respect your privacy. Unsubscribe at any time.
            </p>
          </form>
        )}
      </div>
    </div>
  </div>
</section>
      {/* Footer Section */}

      {/* Enhanced Mobile Responsive Footer Section */}
      <footer className="footer-section">
        <div className="container">
          <div className="footer-content">
            {/* Logo and Company Info */}
            <div className="footer-column main-column">
              <div className="footer-logo">
                <Link to="/" className="footer-logo-link">
                  <img
                    src={ImagePng}
                    alt="Aggrekart Logo"
                    className="footer-logo-image"
                    style={{
                      border: "none",
                      boxShadow: "none",
                      outline: "none",
                    }}
                  />
                </Link>
              </div>
              <p className="footer-description">
                India's most trusted platform for construction materials.
                Connect with verified suppliers and get quality materials
                delivered directly to your construction site.
              </p>
              <div className="social-links">
                <a href="https://www.facebook.com/profile.php?id=61578384710309" aria-label="Facebook" className="social-link">
                  <i className="fab fa-facebook-f"></i>
                </a>
                <a href="https://x.com/aggrekart_com" aria-label="Twitter" className="social-link">
            <svg className="x-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M160 96C124.7 96 96 124.7 96 160L96 480C96 515.3 124.7 544 160 544L480 544C515.3 544 544 515.3 544 480L544 160C544 124.7 515.3 96 480 96L160 96zM457.1 180L353.3 298.6L475.4 460L379.8 460L305 362.1L219.3 460L171.8 460L282.8 333.1L165.7 180L263.7 180L331.4 269.5L409.6 180L457.1 180zM419.3 431.6L249.4 206.9L221.1 206.9L392.9 431.6L419.3 431.6z"/></svg>
            </a>
                <a href="https://www.instagram.com/aggrekart_/" aria-label="Instagram" className="social-link">
                  <i className="fab fa-instagram"></i>
                </a>
                <a href="#" aria-label="LinkedIn" className="social-link">
                  <i className="fab fa-linkedin-in"></i>
                </a>
                <a href="#" aria-label="YouTube" className="social-link">
                  <i className="fab fa-youtube"></i>
                </a>
              </div>
            </div>
            {/* Quick Links */}
            <div className="footer-column">
              <h4 className="footer-title">Quick Links</h4>
              <ul className="footer-links">
                <li>
                  <Link to="/products">Products</Link>
                </li>
                <li>
                  <Link to="/track-order">Track Order</Link>
                </li>
                <li>
                  <Link to="/delivery-returns">Delivery & Returns</Link>
                </li>
                <li>
                  <Link to="/contact">Contact Us</Link>
                </li>
                <li>
                  <Link to="/flash-sale">Flash Sale</Link>
                </li>
                <li>
                  <Link to="/bulk-orders">Bulk Orders</Link>
                </li>
              </ul>
            </div>
            {/* Company */}
            <div className="footer-column">
              <h4 className="footer-title">Company</h4>
              <ul className="footer-links">
                <li>
                  <Link to="/about">About Us</Link>
                </li>
                <li>
                  <Link to="/careers">Careers</Link>
                </li>
                <li>
                  <Link to="/blog">Blog</Link>
                </li>
                <li>
                  <Link to="/press">Press</Link>
                </li>
                <li>
                  <Link to="/investor-relations">Investors</Link>
                </li>
                <li>
                  <Link to="/partnerships">Partnerships</Link>
                </li>
              </ul>
            </div>
            {/* Support */}
            <div className="footer-column">
              <h4 className="footer-title">Support</h4>
              <ul className="footer-links">
                <li>
                  <Link to="/support/tickets">Support Tickets</Link>{" "}
                  {/* 🔥 NEW: Add this line */}
                </li>
                <li>
                  <Link to="/help-center">Help Center</Link>
                </li>
                <li>
                  <Link to="/faq">FAQ</Link>
                </li>
                <li>
                  <Link to="/shipping-info">Shipping Info</Link>
                </li>
                <li>
                  <Link to="/returns">Returns</Link>
                </li>
                <li>
                  <Link to="/warranty">Warranty</Link>
                </li>
                <li>
                  <Link to="/feedback">Feedback</Link>
                </li>
              </ul>
            </div>
            {/* Contact Info */}
            <div className="footer-column contact-column">
              <h4 className="footer-title">Contact Info</h4>
              <div className="contact-infos">
                <div className="contact-items">
                  <div className="contact-icon">
                    <i className="fas fa-map-marker-alt"></i>
                  </div>

                  <div className="contact-text">
                    <strong>Address</strong>
                    <span>
                      1-58/81&82, Flat # 503, V Floor, Savithramma Plaza,
                      Madinaguda, Hyderabad, <br />Telangana - 500 050.
                    </span>
                  </div>
                </div>
                <div className="contact-items">
                  
                  <div className="contact-icon">
                    <i className="fas fa-phone"></i>
                  </div>
                  <div className="contact-text">
                    <strong>Phone</strong>
                    <span>+91 9989048899</span>

                  </div>
                </div>
                <div className="contact-items">
                  <div className="contact-icon">
                    <i className="fas fa-envelope"></i>
                  </div>
                  <div className="contact-text">
                    <strong>Email</strong>
                    <span>support@aggrekart.com</span>
                  </div>
                </div>
                
              </div>
            </div>
          </div>
                    
          {/* Footer Bottom */}
          <div className="footer-bottom">
            <div className="footer-bottom-content">
              <div className="footer-bottom-left">
                <p className="copyright">
                  © 2025 Aggrekart. All rights reserved.
                  <span className="separator">|</span>
                  <Link to="/privacy-policy">Privacy Policy</Link>
                  <span className="separator">|</span>
                  <Link to="/terms">Terms of Service</Link>
                </p>
              </div>

              <div className="footer-bottom-right">
                <div className="payment-methods">
                  <span className="payment-text">We Accept:</span>
                  <div className="payment-icons">
                    <img
                      src={UpiImg}
                      alt="UPI Payment"
                      className="payment-icon"
                    />
                    <img
                      src={VisaImg}
                      alt="Visa Card"
                      className="payment-icon"
                    />
                    <img
                      src={MasterCardImg}
                      alt="Mastercard"
                      className="payment-icon"
                    />
                    <img
                      src={RazorpayImg}
                      alt="Razorpay"
                      className="payment-icon"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
