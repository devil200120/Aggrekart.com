import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "react-query";
import { knowMoreAPI } from "../../services/api";
import {
  X,
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  FileText,
  Info,
} from "lucide-react";
import "./KnowMoreModal.css";

const KnowMoreModal = ({
  isOpen,
  onClose,
  productId,
  category,
  subcategory,
  title,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Normalize subcategory for consistent lookup
  const normalizeSubcategory = (subcategory, productName) => {
    console.log("🔧 Normalizing subcategory:", { subcategory, productName });

    if (!subcategory && productName) {
      // Infer from product name
      if (
        productName.toLowerCase().includes("20mm") ||
        productName.toLowerCase().includes("20 mm")
      ) {
        return "20mm_metal";
      }
      if (
        productName.toLowerCase().includes("10mm") ||
        productName.toLowerCase().includes("10 mm")
      ) {
        return "10mm_metal";
      }
      if (
        productName.toLowerCase().includes("40mm") ||
        productName.toLowerCase().includes("40 mm")
      ) {
        return "40mm_metal";
      }
      return subcategory;
    }

    if (!subcategory) return null;

    // Normalize display names to database format
    const normalizationMap = {
      // Aggregate subcategories - match database format
      "20 MM Metal": "20mm_metal",
      "20MM Metal": "20mm_metal",
      "20mm metal": "20mm_metal",
      "20 mm metal": "20mm_metal",
      "20_mm_metal": "20mm_metal", // Handle both formats

      "10 MM Metal": "10mm_metal",
      "10MM Metal": "10mm_metal",
      "10mm metal": "10mm_metal",
      "10 mm metal": "10mm_metal",
      "10_mm_metal": "10mm_metal",

      "40 MM Metal": "40mm_metal",
      "40MM Metal": "40mm_metal",
      "40mm metal": "40mm_metal",
      "40 mm metal": "40mm_metal",
      "40_mm_metal": "40mm_metal",

      "Stone Aggregate": "stone_aggregate",
      Dust: "dust",
      GSB: "gsb",
      WMM: "wmm",
      "M Sand": "m_sand",
      "M.sand": "m_sand",
    };

    const normalized =
      normalizationMap[subcategory] ||
      subcategory.toLowerCase().replace(/\s+/g, "_");
    console.log("🎯 Normalized result:", normalized);
    return normalized;
  };

  const normalizedSubcategory = normalizeSubcategory(subcategory);

  // Primary query - try product-specific content first
  const {
    data: productContentData,
    isLoading: isLoadingProduct,
    isError: isProductError,
  } = useQuery(
    ["know-more", "product", productId],
    async () => {
      console.log("🎯 Fetching product know-more for productId:", productId);
      return await knowMoreAPI.getProductKnowMore(productId);
    },
    {
      enabled: isOpen && !!productId,
      retry: false,
      staleTime: 5 * 60 * 1000,
    }
  );

  // Fallback query - try subcategory-based content
  const {
    data: subcategoryContentData,
    isLoading: isLoadingSubcategory,
    isError: isSubcategoryError,
  } = useQuery(
    ["know-more", "subcategory", category, normalizedSubcategory],
    async () => {
      console.log("🎯 Fetching subcategory know-more for:", {
        category,
        subcategory: normalizedSubcategory,
      });
      return await knowMoreAPI.getSubcategoryKnowMore(
        category,
        normalizedSubcategory
      );
    },
    {
      enabled:
        isOpen &&
        !!category &&
        !!normalizedSubcategory &&
        (isProductError || !productContentData?.data?.content),
      retry: false,
      staleTime: 5 * 60 * 1000,
    }
  );

  // Determine which content to use
  const hasProductContent = productContentData?.data?.content;
  const hasSubcategoryContent = subcategoryContentData?.data?.content;
  const content = hasProductContent
    ? productContentData.data.content
    : hasSubcategoryContent
      ? subcategoryContentData.data.content
      : null;
  const isLoading = isLoadingProduct || isLoadingSubcategory;
  const isError = isProductError && isSubcategoryError;
  const contentFound = hasProductContent || hasSubcategoryContent;

  // Debug logging
  useEffect(() => {
    if (isOpen) {
      console.log("🔍 KnowMoreModal Debug:", {
        productId,
        category,
        subcategory,
        normalizedSubcategory,
        hasProductContent: !!hasProductContent,
        hasSubcategoryContent: !!hasSubcategoryContent,
        contentFound,
        isLoading,
        isError,
        contentStructure: content ? Object.keys(content) : null,
        content: content,
      });
    }
  }, [
    isOpen,
    productId,
    category,
    subcategory,
    normalizedSubcategory,
    hasProductContent,
    hasSubcategoryContent,
    contentFound,
    isLoading,
    isError,
    content,
  ]);

  // Track content view
  useEffect(() => {
    if (isOpen && content?.contentId) {
      knowMoreAPI.trackClick(content.contentId).catch(console.error);
    }
  }, [isOpen, content?.contentId]);

  // Handle body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!isOpen) return;

      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft" && content?.images?.length > 1) {
        setCurrentImageIndex((prev) =>
          prev === 0 ? content.images.length - 1 : prev - 1
        );
      } else if (e.key === "ArrowRight" && content?.images?.length > 1) {
        setCurrentImageIndex((prev) =>
          prev === content.images.length - 1 ? 0 : prev + 1
        );
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [isOpen, content?.images?.length, onClose]);

  if (!isOpen) return null;

  // Modal Content Component
  const ModalContent = () => {
    // Loading state - show fullscreen loading
    if (isLoading) {
      return (
        <div
          className="know-more-modal-overlay"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <div className="know-more-modal">
            <div className="modal-header">
              <button className="back-btn" onClick={onClose}>
                <ArrowLeft size={20} />
                Back
              </button>
              <div className="modal-title">
                <h2>{title || "Loading..."}</h2>
              </div>
              <button className="close-btn" onClick={onClose}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-content">
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Loading content...</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Error state or no content - show fullscreen no content
    if (isError || !contentFound || !content) {
      return (
        <div
          className="know-more-modal-overlay"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <div className="know-more-modal">
            <div className="modal-header">
              <button className="back-btn" onClick={onClose}>
                <ArrowLeft size={20} />
                Back
              </button>
              <div className="modal-title">
                <h2>{title || "Know More"}</h2>
              </div>
              <button className="close-btn" onClick={onClose}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-content">
              <div className="no-content-state">
                <div className="no-content-icon">
                  <Info size={64} />
                </div>
                <h3>No Content Available</h3>
                <p>
                  We don't have detailed information for this item yet. Please
                  check back later.
                </p>
                <div
                  className="debug-info"
                  style={{
                    marginTop: "20px",
                    fontSize: "12px",
                    color: "#666",
                  }}
                >
                  <p>
                    <strong>Debug Info:</strong>
                  </p>
                  <p>Product ID: {productId}</p>
                  <p>Category: {category}</p>
                  <p>Subcategory: {subcategory}</p>
                  <p>Normalized: {normalizedSubcategory}</p>
                  <p>Product Content: {hasProductContent ? "✅" : "❌"}</p>
                  <p>
                    Subcategory Content: {hasSubcategoryContent ? "✅" : "❌"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Content loaded - show fullscreen content
    return (
      <div
        className="know-more-modal-overlay"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="know-more-modal">
          {/* Fixed Header */}
          <div className="modal-header">
            <button className="back-btn" onClick={onClose}>
              <ArrowLeft size={20} />
              Back
            </button>
            <div className="modal-title">
              <h2>{content.title || title || "Know More"}</h2>
            </div>
            <button className="close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="modal-content">
            {/* Images Section */}
            {content.images && content.images.length > 0 && (
              <div className="images-section">
                <div className="main-image-container">
                  <img
                    src={content.images[currentImageIndex]?.url}
                    alt={
                      content.images[currentImageIndex]?.caption ||
                      "Content image"
                    }
                    className="main-image"
                    onError={(e) => {
                      e.target.src = "/placeholder-product.jpg";
                    }}
                  />

                  {/* Image Navigation */}
                  {content.images.length > 1 && (
                    <>
                      <button
                        className="image-nav prev"
                        onClick={() =>
                          setCurrentImageIndex((prev) =>
                            prev === 0 ? content.images.length - 1 : prev - 1
                          )
                        }
                      >
                        <ChevronLeft size={24} />
                      </button>
                      <button
                        className="image-nav next"
                        onClick={() =>
                          setCurrentImageIndex((prev) =>
                            prev === content.images.length - 1 ? 0 : prev + 1
                          )
                        }
                      >
                        <ChevronRight size={24} />
                      </button>

                      {/* Image Counter */}
                      <div className="image-counter">
                        {currentImageIndex + 1} of {content.images.length}
                      </div>
                    </>
                  )}
                </div>

                {/* Thumbnail Images */}
                {content.images.length > 1 && (
                  <div className="thumbnail-container">
                    {content.images.map((image, index) => (
                      <button
                        key={index}
                        className={`thumbnail ${
                          currentImageIndex === index ? "active" : ""
                        }`}
                        onClick={() => setCurrentImageIndex(index)}
                      >
                        <img
                          src={image.url}
                          alt={image.caption || `Thumbnail ${index + 1}`}
                          onError={(e) => {
                            e.target.src = "/placeholder-product.jpg";
                          }}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Content Text */}
            <div className="text-content">
              {/* Overview Section - Check both sections and root content */}
              {(content.sections?.[0]?.content ||
                (content.sections && content.sections.length > 0)) && (
                <div className="description">
                  <h3>📖 Overview</h3>
                  <div className="description-text">
                    {content.sections?.map((section, index) => (
                      <div key={index}>
                        {section.heading && <h4>{section.heading}</h4>}
                        <div
                          dangerouslySetInnerHTML={{
                            __html: section.content,
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Root level specifications (from model) */}
              {content.specifications && content.specifications.length > 0 && (
                <div className="specifications">
                  <h3>Specifications</h3>
                  <div className="spec-grid">
                    {content.specifications.map((spec, index) => (
                      <div key={index} className="spec-item">
                        <strong>{spec.name}:</strong>{" "}
                        {/* Changed from spec.key to spec.name */}
                        <span>{spec.value}</span>
                        {spec.unit && <small>({spec.unit})</small>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Fallback: Section-based specifications (from sections) */}
              {!content.specifications &&
                content.sections?.[0]?.specifications &&
                content.sections[0].specifications.length > 0 && (
                  <div className="specifications-enhanced">
                    <h3>📋 Technical Specifications</h3>
                    <div className="spec-grid-enhanced">
                      {content.sections[0].specifications.map((spec, index) => (
                        <div key={index} className="spec-card">
                          <div className="spec-icon">📊</div>
                          <div className="spec-details">
                            <strong>{spec.name}</strong>
                            <span>{spec.value}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Root level highlights (from model) */}
              {content.highlights && content.highlights.length > 0 && (
                <div className="highlights">
                  <h3>Key Highlights</h3>
                  <div className="highlights-grid">
                    {content.highlights.map((highlight, index) => (
                      <div key={index} className="highlight-item">
                        <span className="highlight-icon">{highlight.icon}</span>
                        <div className="highlight-content">
                          <h4>{highlight.title}</h4>
                          <p>{highlight.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Root level videos (from model) */}
              {content.videos && content.videos.length > 0 && (
                <div className="videos">
                  <h3>Videos</h3>
                  <div className="videos-grid">
                    {content.videos.map((video, index) => (
                      <div key={index} className="video-item">
                        <div className="video-thumbnail">
                          <img src={video.thumbnail} alt={video.title} />
                          <button className="play-button">▶</button>
                        </div>
                        <h4>{video.title}</h4>
                        {video.duration && (
                          <span>
                            {Math.floor(video.duration / 60)}:
                            {video.duration % 60}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Root level FAQs (from model) */}
              {content.faqs && content.faqs.length > 0 && (
                <div className="faqs-enhanced">
                  <h3>❓ Frequently Asked Questions</h3>
                  <div className="faqs-container">
                    {content.faqs.map((faq, index) => (
                      <details key={index} className="faq-item">
                        <summary className="faq-question">
                          <span>{faq.question}</span>
                          <ChevronDown className="faq-icon" size={20} />
                        </summary>
                        <div className="faq-answer">
                          <p>{faq.answer}</p>
                        </div>
                      </details>
                    ))}
                  </div>
                </div>
              )}

              {/* Call to Action */}
              {content.cta?.enabled && (
                <div className="cta-section">
                  <div className="cta-card">
                    <h3>Ready to get started?</h3>
                    <p>
                      Contact us for quotes, technical support, or more
                      information
                    </p>
                    <div className="cta-buttons">
                      <button className="cta-primary">
                        {content.cta.text || "Get Quote"}
                      </button>
                      {content.cta.phoneNumber && (
                        <button className="cta-secondary">
                          📞 {content.cta.phoneNumber}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Fallback content if no structured data exists */}
              {!content.sections &&
                !content.specifications &&
                !content.highlights &&
                !content.videos &&
                !content.faqs && (
                  <div className="simple-content">
                    <div className="description">
                      <h3>📖 Overview</h3>
                      <div className="description-text">
                        <p>
                          {content.subtitle ||
                            "More information about this product will be available soon."}
                        </p>
                        {content.features && content.features.length > 0 && (
                          <div className="features">
                            <h4>Features:</h4>
                            <ul className="features-list">
                              {content.features.map((feature, index) => (
                                <li key={index}>{feature}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {content.usageInstructions && (
                          <div className="usage-instructions">
                            <h4>Usage Instructions:</h4>
                            <div
                              dangerouslySetInnerHTML={{
                                __html: content.usageInstructions,
                              }}
                            />
                          </div>
                        )}
                        {content.contentBlocks && content.contentBlocks.length > 0 && (
              <div className="content-blocks-section">
                <h3>Content</h3>
                <div className="content-blocks-container">
                  {content.contentBlocks
                    .sort((a, b) => a.position - b.position)
                    .map((block, index) => (
                      <div key={block.id || index} className={`content-block block-${block.type}`}>
                        {block.type === 'text' && (
                          <div 
                            className="block-text-content"
                            dangerouslySetInnerHTML={{ __html: block.content }}
                          />
                        )}

                        {block.type === 'image' && (
                          <div className="block-image-container">
                            <img
                              src={block.content.url}
                              alt={block.content.alt || 'Content image'}
                              className="block-image"
                              onError={(e) => {
                                e.target.src = "/placeholder-product.jpg";
                              }}
                            />
                            {block.content.caption && (
                              <p className="block-image-caption">{block.content.caption}</p>
                            )}
                          </div>
                        )}

                        {block.type === 'imageText' && (
                          <div className={`block-image-text layout-${block.content.layout || 'left'}`}>
                            <div className="block-image-section">
                              {block.content.image?.url && (
                                <img
                                  src={block.content.image.url}
                                  alt={block.content.image.alt || 'Content image'}
                                  className="block-inline-image"
                                  onError={(e) => {
                                    e.target.src = "/placeholder-product.jpg";
                                  }}
                                />
                              )}
                              {block.content.image?.caption && (
                                <p className="block-image-caption">{block.content.image.caption}</p>
                              )}
                            </div>
                            <div className="block-text-section">
                              <div 
                                className="block-text-content"
                                dangerouslySetInnerHTML={{ __html: block.content.text }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}

                      </div>
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Use createPortal to render the modal at document.body level
  return createPortal(<ModalContent />, document.body);
};

export default KnowMoreModal;
