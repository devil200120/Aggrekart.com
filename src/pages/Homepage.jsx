import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import MembershipCard from "../components/membership/MembershipCard";
import EnhancedCategoryCard from "../components/products/EnhancedCategoryCard";
import "./HomePage.css";
import AggregatesImg from "../Aggregates.JPG";
import CCBlocksImg from "../CC Blocks.JPG";
import TMTSteelImg from "../TMT Steel.webp";
import RedBricksImg from "../Red Bricks.JPG";
import CementImg from "../Cement.jpg";
import DSC0200Img from "../DSC_0200.JPG";
import DSC0141Img from "../DSC_0141.JPG";
import DSC0158Img from "../DSC_0158.JPG";
import SandImg from "../Sand.JPG";
import Logo1Img from "../logo1.jpg";
import Logo2Img from "../Aggrebhai.png";
import AdvertisementImg from "../Advertisement.jpg";
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
import { toast } from "react-toastify"; // Make sure you have react-toastify installed
const HomePage = () => {
  const { user } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentProductSlide, setCurrentProductSlide] = useState(0);
  const productScrollRef = useRef(null);
  const [currentImageSlide, setCurrentImageSlide] = useState(0); // Added for image slider
  const [showWhatsAppTooltip, setShowWhatsAppTooltip] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
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

        <div className="container">
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

      {/* Membership Card Section */}

      {/* Enhanced Features Section */}
      {/* Our Products Section */}
      {/* Our Products Section */}
      <section className="our-products-section">
        <div className="container">
          <h2 className="section-title">Our Products</h2>
          <div className="products-grid">
            {/* Aggregates - 40% space (left side) */}
            <Link
              to={`/products?category=${productCategories.aggregate}`}
              className="aggregate-card-link"
            >
              <div className="aggregate-card">
                <div className="product-image-container">
                  <img
                    src={AggregatesImg}
                    alt="Aggregate products"
                    className="product-image"
                  />
                </div>
                <div className="product-content">
                  <h3>Aggregate products</h3>
                  <button className="product-btn">CLICK HERE</button>
                </div>
              </div>
            </Link>

            {/* Other Products - 60% space (right side grid) */}
            <div className="other-products-grid">
              <Link
                to={`/products?category=${productCategories.bricks}`}
                className="small-product-card-link"
              >
                <div className="small-product-card">
                  <div className="small-product-image-container">
                    <img
                      src={CCBlocksImg}
                      alt="Concrete Bricks"
                      className="small-product-image"
                    />
                  </div>
                  <div className="small-product-title">
                    <h4>Concrete Bricks</h4>
                  </div>
                </div>
              </Link>

              <Link
                to={`/products?category=${productCategories.cement}`}
                className="small-product-card-link"
              >
                <div className="small-product-card">
                  <div className="small-product-image-container">
                    <img
                      src={CementImg}
                      alt="Cement"
                      className="small-product-image"
                    />
                  </div>
                  <div className="small-product-title">
                    <h4>Cement</h4>
                  </div>
                </div>
              </Link>

              <Link
                to={`/products?category=${productCategories.steel}`}
                className="small-product-card-link"
              >
                <div className="small-product-card">
                  <div className="small-product-image-container">
                    <img
                      src={TMTSteelImg}
                      alt="TMT Steel"
                      className="small-product-image"
                    />
                  </div>
                  <div className="small-product-title">
                    <h4>TMT STEEL</h4>
                  </div>
                </div>
              </Link>

              <Link
                to={`/products?category=${productCategories.bricks}`}
                className="small-product-card-link"
              >
                <div className="small-product-card">
                  <div className="small-product-image-container">
                    <img
                      src={RedBricksImg}
                      alt="Clay Bricks"
                      className="small-product-image"
                    />
                  </div>
                  <div className="small-product-title">
                    <h4>Clay Bricks</h4>
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
              Shop Premium Construction Materials
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
        <div className="container">
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
      <section className="top-rated-products-section">
        <div className="container">
          <h2 className="section-title">Top Rated Products</h2>

          <div className="top-rated-grid">
            {/* Row 1 */}
            <div className="product-card-rated">
              <div className="product-image-rated">
                <img src={DSC0200Img} alt="Premium Cement" />
              </div>
              <div className="product-info-rated">
                <div className="rating-stars">
                  <span>⭐⭐⭐⭐⭐</span>
                </div>
                <h3>53 Grade OPC Cement Premium Quality</h3>
                <div className="price-info">
                  <span className="current-price">₹750.00</span>
                  <span className="original-price">₹950.00</span>
                </div>
                <button className="add-to-cart-btn">
                  <span className="btn-icon">+</span>
                  Add To Cart
                </button>
              </div>
            </div>

            <div className="product-card-rated">
              <div className="product-image-rated">
                <img src={TMTSteelImg} alt="TMT Steel Bars" />
              </div>
              <div className="product-info-rated">
                <div className="rating-stars">
                  <span>⭐⭐⭐⭐⭐</span>
                </div>
                <h3>TMT Steel Bars High Grade Fe500</h3>
                <div className="price-info">
                  <span className="current-price">₹65,000</span>
                  <span className="original-price">₹70,000</span>
                </div>
                <button className="add-to-cart-btn">
                  <span className="btn-icon">+</span>
                  Add To Cart
                </button>
              </div>
            </div>

            <div className="product-card-rated">
              <div className="product-image-rated">
                <img src={RedBricksImg} alt="Red Clay Bricks" />
              </div>
              <div className="product-info-rated">
                <div className="rating-stars">
                  <span>⭐⭐⭐⭐⭐</span>
                </div>
                <h3>Red Clay Bricks Traditional Quality</h3>
                <div className="price-info">
                  <span className="current-price">₹8.50</span>
                  <span className="original-price">₹10.00</span>
                </div>
                <button className="add-to-cart-btn">
                  <span className="btn-icon">+</span>
                  Add To Cart
                </button>
              </div>
            </div>

            {/* Row 2 */}
            <div className="product-card-rated">
              <div className="product-image-rated">
                <img src={DSC0141Img} alt="Construction Sand" />
              </div>
              <div className="product-info-rated">
                <div className="rating-stars">
                  <span>⭐⭐⭐⭐⭐</span>
                </div>
                <h3>River Sand Premium Construction Grade</h3>
                <div className="price-info">
                  <span className="current-price">₹1,200</span>
                  <span className="original-price">₹1,400</span>
                </div>
                <button className="add-to-cart-btn">
                  <span className="btn-icon">+</span>
                  Add To Cart
                </button>
              </div>
            </div>

            <div className="product-card-rated">
              <div className="product-image-rated">
                <img src={AggregatesImg} alt="Stone Aggregates" />
              </div>
              <div className="product-info-rated">
                <div className="rating-stars">
                  <span>⭐⭐⭐⭐⭐</span>
                </div>
                <h3>Stone Aggregates Mixed Size 20mm</h3>
                <div className="price-info">
                  <span className="current-price">₹2,800</span>
                  <span className="original-price">₹3,200</span>
                </div>
                <button className="add-to-cart-btn">
                  <span className="btn-icon">+</span>
                  Add To Cart
                </button>
              </div>
            </div>

            <div className="product-card-rated">
              <div className="product-image-rated">
                <img src={CCBlocksImg} alt="Concrete Blocks" />
              </div>
              <div className="product-info-rated">
                <div className="rating-stars">
                  <span>⭐⭐⭐⭐⭐</span>
                </div>
                <h3>Concrete Blocks AAC Lightweight</h3>
                <div className="price-info">
                  <span className="current-price">₹45.00</span>
                  <span className="original-price">₹55.00</span>
                </div>
                <button className="add-to-cart-btn">
                  <span className="btn-icon">+</span>
                  Add To Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

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
      <section className="cta-section">
        <div className="container">
          <div className="cta-card">
            <div className="cta-content">
              <div className="cta-icon">🚀</div>
              <h2 className="cta-title">
                Ready to Transform Your Construction Process?
              </h2>
              <p className="cta-subtitle">
                Join thousands of contractors, builders, and architects who
                trust Aggrekart for their construction material needs. Start
                your journey today!
              </p>
              <div className="cta-actions">
                <Link to="/products" className="btn btn-primary btn-lg">
                  <span className="btn-icon">🛍️</span>
                  Start Shopping Now →
                </Link>
                {!user && (
                  <Link
                    to="/auth/whatsapp-register"
                    className="btn btn-success btn-lg"
                  >
                    <span className="btn-icon">📱</span>
                    Quick Register →
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Newsletter Section */}
      <section className="newsletter-section">
        <div className="container">
          <div className="newsletter-card">
            <div className="newsletter-icon">📧</div>
            <h3 className="newsletter-title">Stay Ahead of the Curve</h3>
            <p className="newsletter-subtitle">
              Get exclusive updates on new materials, industry insights, price
              alerts, and special offers
            </p>
            <form className="newsletter-form">
              <div className="form-group">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  className="newsletter-input"
                  required
                />
                <button
                  type="submit"
                  className="btn btn-primary newsletter-btn"
                >
                  Subscribe Now
                </button>
              </div>
            </form>
            <p className="newsletter-privacy">
              🔒 We respect your privacy. Unsubscribe at any time.
            </p>
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
          border: 'none',
          boxShadow: 'none',
          outline: 'none'
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
    <a href="#" aria-label="Facebook" className="social-link">
      <i className="fab fa-facebook-f"></i>
    </a>
    <a href="#" aria-label="Twitter" className="social-link">
      <i className="fab fa-twitter"></i>
    </a>
    <a href="#" aria-label="Instagram" className="social-link">
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
              <div className="contact-info">
                <div className="contact-item">
                  <div className="contact-icon">
                    <i className="fas fa-map-marker-alt"></i>
                  </div>
                  <div className="contact-text">
                    <strong>Address</strong>
                    <span>
                      1-58/81&82, Flat # 503, V Floor, Savithramma Plaza,
                      Madinaguda, Hyderabad, Telangana - 500 050.
                    </span>
                  </div>
                </div>
                <div className="contact-item">
                  <div className="contact-icon">
                    <i className="fas fa-phone"></i>
                  </div>
                  <div className="contact-text">
                    <strong>Phone</strong>
                    <span>+91 9989048899</span>
                    <br />
                  </div>
                </div>
                <div className="contact-item">
                  <div className="contact-icon">
                    <i className="fas fa-envelope"></i>
                  </div>
                  <div className="contact-text">
                    <strong>Email</strong>
                    <span>support@aggrekart.com</span>
                  </div>
                </div>
                <div className="contact-item">
                  <div className="contact-icon">
                    <i className="fas fa-clock"></i>
                  </div>
                  <div className="contact-text">
                    <strong>Working Hours</strong>
                    <span>Mon - Sat: 9:00 AM - 7:00 PM</span>
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
