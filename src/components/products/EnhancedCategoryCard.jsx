import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./EnhancedCategoryCard.css";
import KnowMoreModal from "../common/KnowMoreModal";
import { FaInfoCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const EnhancedCategoryCard = ({ category, userTier = "silver" }) => {
  const [selectedTonnage, setSelectedTonnage] = useState("");
  const [showQuickOrder, setShowQuickOrder] = useState(false);
  const navigate = useNavigate();

  const [showKnowMoreModal, setShowKnowMoreModal] = useState(false); // ADD THIS LINE
  const getTierDiscount = (tier) => {
    switch (tier) {
      case "platinum":
        return 15;
      case "gold":
        return 10;
      case "silver":
      default:
        return 5;
    }
  };

  const tonnageOptions = {
    cement: [
      {
        value: "1-10",
        label: "1-10 bags",
        icon: "📦",
        description: "Perfect for small repairs",
      },
      {
        value: "11-50",
        label: "11-50 bags",
        icon: "🏠",
        description: "Ideal for room construction",
      },
      {
        value: "51-100",
        label: "51-100 bags",
        icon: "🏢",
        description: "For floor construction",
      },
      {
        value: "100+",
        label: "100+ bags",
        icon: "🏗️",
        description: "Large projects & buildings",
      },
    ],
    "tmt steel": [
      {
        value: "1-5",
        label: "1-5 tons",
        icon: "🔧",
        description: "Small construction work",
      },
      {
        value: "6-15",
        label: "6-15 tons",
        icon: "🏠",
        description: "House construction",
      },
      {
        value: "16-50",
        label: "16-50 tons",
        icon: "🏢",
        description: "Commercial buildings",
      },
      {
        value: "50+",
        label: "50+ tons",
        icon: "🏗️",
        description: "Large infrastructure",
      },
    ],
    bricks: [
      {
        value: "1000-5000",
        label: "1K-5K pieces",
        icon: "🧱",
        description: "Small wall construction",
      },
      {
        value: "5000-15000",
        label: "5K-15K pieces",
        icon: "🏠",
        description: "Room construction",
      },
      {
        value: "15000-50000",
        label: "15K-50K pieces",
        icon: "🏢",
        description: "Complete house",
      },
      {
        value: "50000+",
        label: "50K+ pieces",
        icon: "🏗️",
        description: "Large projects",
      },
    ],
    "sand & aggregates": [
      {
        value: "1-10",
        label: "1-10 tons",
        icon: "⛏️",
        description: "Small projects",
      },
      {
        value: "11-25",
        label: "11-25 tons",
        icon: "🏠",
        description: "House construction",
      },
      {
        value: "26-100",
        label: "26-100 tons",
        icon: "🏢",
        description: "Commercial projects",
      },
      {
        value: "100+",
        label: "100+ tons",
        icon: "🏗️",
        description: "Large infrastructure",
      },
    ],
    "ready mix concrete": [
      {
        value: "1-5",
        label: "1-5 cubic meters",
        icon: "🚛",
        description: "Small foundations",
      },
      {
        value: "6-20",
        label: "6-20 cubic meters",
        icon: "🏠",
        description: "House construction",
      },
      {
        value: "21-100",
        label: "21-100 cubic meters",
        icon: "🏢",
        description: "Commercial buildings",
      },
      {
        value: "100+",
        label: "100+ cubic meters",
        icon: "🏗️",
        description: "Large projects",
      },
    ],
  };

  const categoryKey = category.name.toLowerCase();
  const tonnages = tonnageOptions[categoryKey] || tonnageOptions["cement"];
  const discount = getTierDiscount(userTier);

  const handleQuickOrder = () => {
    if (!selectedTonnage) {
      alert("Please select quantity range first");
      return;
    }
    // Navigate to products page with filters
    const searchParams = new URLSearchParams({
      category: categoryKey,
      tonnage: selectedTonnage,
      quickOrder: "true",
    });
    window.location.href = `/products?${searchParams.toString()}`;
  };

  return (
    <div className="enhanced-category-card">
      <div className="category-header">
        <div className="category-icon-large">{category.icon}</div>
        <div className="category-info">
          <h3 className="category-name">{category.name}</h3>
          <p className="category-description">{category.description}</p>
          <div className="category-discount">
            <span className="discount-badge">{discount}% OFF</span>
            <span className="discount-text">for {userTier} members</span>
          </div>
        </div>
      </div>

      <div className="tonnage-selector">
        <h4>Select Quantity Range:</h4>
        <div className="tonnage-grid">
          {tonnages.map((tonnage) => (
            <button
              key={tonnage.value}
              className={`tonnage-option ${selectedTonnage === tonnage.value ? "selected" : ""}`}
              onClick={() => setSelectedTonnage(tonnage.value)}
            >
              <div className="tonnage-icon">{tonnage.icon}</div>
              <div className="tonnage-label">{tonnage.label}</div>
              <div className="tonnage-desc">{tonnage.description}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="category-actions">
        <Link
          to={`/products?category=${categoryKey}`}
          className="btn btn-outline"
        >
          Browse All
        </Link>
        <button
          onClick={handleQuickOrder}
          className={`btn btn-primary ${!selectedTonnage ? "disabled" : ""}`}
          disabled={!selectedTonnage}
        >
          Quick Order
        </button>
        <button
          onClick={() => setShowKnowMoreModal(true)}
          className="btn btn-info know-more-category-btn"
          title="Learn more about this category"
        >
          <FaInfoCircle size={14} />
          Know More
        </button>
      </div>
      <div className="category-features">
        <div className="feature-item">
          <span className="feature-icon">🚚</span>
          <span>Direct delivery</span>
        </div>
        <div className="feature-item">
          <span className="feature-icon">💰</span>
          <span>Best prices</span>
        </div>
        <div className="feature-item">
          <span className="feature-icon">📞</span>
          <span>Expert support</span>
        </div>
      </div>
      {/* <KnowMoreModal
        isOpen={showKnowMoreModal}
        onClose={() => setShowKnowMoreModal(false)}
        category={categoryKey}
        subcategory={categoryKey}
        title={`${category.name} - Complete Guide`}
      /> */}
    </div>
  );
};

export default EnhancedCategoryCard;
