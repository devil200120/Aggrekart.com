import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import MembershipCard from '../components/membership/MembershipCard'
import EnhancedCategoryCard from '../components/products/EnhancedCategoryCard'
import './HomePage.css'

const HomePage = () => {
  const { user } = useAuth()
  const [currentSlide, setCurrentSlide] = useState(0)

  const heroSlides = [
    {
      title: "Build Your Dreams with",
      highlight: "Aggrekart",
      subtitle: "India's most trusted platform for construction materials. Connect with verified suppliers and get quality materials delivered directly to your construction site.",
      cta: "Start Building Today"
    },
    {
      title: "Premium Quality",
      highlight: "Materials",
      subtitle: "From cement to steel, bricks to tiles - we have everything you need for your construction project with guaranteed quality and competitive prices.",
      cta: "Explore Materials"
    },
    {
      title: "Trusted by",
      highlight: "50,000+ Builders",
      subtitle: "Join the community of successful contractors and builders who rely on Aggrekart for their construction material needs.",
      cta: "Join Community"
    }
  ]

  // Auto-slide functionality
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [heroSlides.length])

  const categories = [
    {
      id: 1,
      name: 'Cement',
      icon: '🏗️',
      description: 'Premium quality cement from trusted brands',
      image: '/images/cement.jpg',
      type: 'cement',
      basePrice: 350,
      trending: true
    },
    {
      id: 2,
      name: 'TMT Steel',
      icon: '🔧',
      description: 'High-grade TMT steel bars and rods',
      image: '/images/steel.jpg',
      type: 'steel',
      basePrice: 65000,
      trending: true
    },
    {
      id: 3,
      name: 'Bricks',
      icon: '🧱',
      description: 'Red bricks, fly ash bricks, and AAC blocks',
      image: '/images/bricks.jpg',
      type: 'bricks',
      basePrice: 8
    },
    {
      id: 4,
      name: 'Sand',
      icon: '⏳',
      description: 'River sand, M-sand, and construction sand',
      image: '/images/sand.jpg',
      type: 'sand',
      basePrice: 1200
    },
    {
      id: 5,
      name: 'Gravel',
      icon: '🪨',
      description: 'Crushed stone and aggregates for concrete',
      image: '/images/gravel.jpg',
      type: 'aggregates',
      basePrice: 1500
    },
    {
      id: 6,
      name: 'Roofing',
      icon: '🏠',
      description: 'Tiles, sheets, and roofing materials',
      image: '/images/roofing.jpg',
      type: 'roofing',
      basePrice: 25
    }
  ]

  const features = [
    {
      icon: '🛡️',
      title: 'Verified Suppliers',
      description: 'All suppliers are thoroughly verified with quality certifications and customer reviews',
      color: '#10B981'
    },
    {
      icon: '🚀',
      title: 'Fast Delivery',
      description: 'Quick delivery to your construction site with real-time tracking',
      color: '#3B82F6'
    },
    {
      icon: '💎',
      title: 'Best Prices',
      description: 'Competitive prices with transparent billing and bulk discounts',
      color: '#8B5CF6'
    },
    {
      icon: '📞',
      title: '24/7 Support',
      description: 'Round-the-clock customer support with expert consultation',
      color: '#F59E0B'
    }
  ]

  const testimonials = [
    {
      name: "Rajesh Kumar",
      role: "Civil Contractor",
      content: "Aggrekart has transformed how I source materials. Quality is consistent and delivery is always on time.",
      rating: 5,
      project: "50+ Projects Completed"
    },
    {
      name: "Priya Sharma",
      role: "Architect",
      content: "The variety and quality of materials available on Aggrekart is impressive. Highly recommended!",
      rating: 5,
      project: "200+ Designs Implemented"
    },
    {
      name: "Amit Patel",
      role: "Builder",
      content: "Best platform for construction materials. The support team is very helpful and responsive.",
      rating: 5,
      project: "100+ Houses Built"
    }
  ]

  return (
    <div className="home-page">
      {/* Enhanced Hero Section with Slider */}
      <section className="hero-section">
        <div className="hero-background">
          <div className="hero-overlay"></div>
          <div className="hero-particles"></div>
        </div>
        
        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <div className="hero-badge">
                <span className="badge-icon">⭐</span>
                <span>India's #1 Construction Materials Platform</span>
              </div>
              
              <h1 className="hero-title">
                {heroSlides[currentSlide].title}
                <span className="hero-title-highlight">
                  {heroSlides[currentSlide].highlight}
                </span>
              </h1>
              
              <p className="hero-subtitle">
                {heroSlides[currentSlide].subtitle}
              </p>
              
              <div className="hero-actions">
                <Link to="/products" className="btn btn-primary btn-hero">
                  <span className="btn-icon">🏗️</span>
                  {heroSlides[currentSlide].cta}
                </Link>
                
                {!user && (
                  <div className="hero-register-options">
                    <Link to="/auth/whatsapp-register" className="btn btn-success btn-hero">
                      <span className="btn-icon">📱</span>
                      Quick Join
                    </Link>
                  </div>
                )}
              </div>
              
              {/* Enhanced Stats */}
              <div className="hero-stats">
                {[
                  { number: '1000+', label: 'Verified Suppliers', icon: '🏪' },
                  { number: '50K+', label: 'Happy Customers', icon: '😊' },
                  { number: '100+', label: 'Cities Covered', icon: '🌍' },
                  { number: '24/7', label: 'Support Available', icon: '☎️' }
                ].map((stat, index) => (
                  <div key={index} className="hero-stat">
                    <div className="hero-stat-icon">{stat.icon}</div>
                    <div className="hero-stat-number">{stat.number}</div>
                    <div className="hero-stat-label">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Slide Indicators */}
        <div className="slide-indicators">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              className={`slide-indicator ${index === currentSlide ? 'active' : ''}`}
              onClick={() => setCurrentSlide(index)}
            />
          ))}
        </div>
      </section>

      {/* Membership Card Section */}
      {user && (
        <section className="membership-section">
          <div className="container">
            <MembershipCard user={user} />
          </div>
        </section>
      )}

      {/* Enhanced Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <div className="section-badge">
              <span>✨ Why Choose Us</span>
            </div>
            <h2 className="section-title">Built for Modern Construction</h2>
            <p className="section-subtitle">
              We leverage technology to make construction material procurement simple, reliable, and cost-effective
            </p>
          </div>
          
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card modern-card">
                <div className="feature-icon-container" style={{ backgroundColor: `${feature.color}20` }}>
                  <div className="feature-icon" style={{ color: feature.color }}>
                    {feature.icon}
                  </div>
                </div>
                <div className="feature-content">
                  <h3 className="feature-title">{feature.title}</h3>
                  <p className="feature-description">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Categories Section */}
      <section className="categories-section">
        <div className="container">
          <div className="section-header">
            <div className="section-badge">
              <span>🏗️ Popular Categories</span>
            </div>
            <h2 className="section-title">Everything You Need to Build</h2>
            <p className="section-subtitle">
              From foundation to finishing - find all construction materials with smart quantity selection
            </p>
          </div>
          
          <div className="categories-grid">
            {categories.map((category) => (
              <div key={category.id} className="category-wrapper">
                {category.trending && <div className="trending-badge">🔥 Trending</div>}
                <EnhancedCategoryCard 
                  category={category}
                  userTier={user?.membershipTier || 'silver'}
                />
              </div>
            ))}
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
                    <span key={i} className="star">⭐</span>
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
                    <span className="author-project">{testimonial.project}</span>
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
              <h2 className="cta-title">Ready to Transform Your Construction Process?</h2>
              <p className="cta-subtitle">
                Join thousands of contractors, builders, and architects who trust Aggrekart 
                for their construction material needs. Start your journey today!
              </p>
              <div className="cta-actions">
                <Link to="/products" className="btn btn-primary btn-lg">
                  <span className="btn-icon">🛍️</span>
                  Start Shopping Now →
                </Link>
                {!user && (
                  <Link to="/auth/whatsapp-register" className="btn btn-success btn-lg">
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
              Get exclusive updates on new materials, industry insights, price alerts, and special offers
            </p>
            <form className="newsletter-form">
              <div className="form-group">
                <input 
                  type="email" 
                  placeholder="Enter your email address"
                  className="newsletter-input"
                  required
                />
                <button type="submit" className="btn btn-primary newsletter-btn">
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
    </div>
  )
}

export default HomePage