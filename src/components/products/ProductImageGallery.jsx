import React from 'react'
import './ProductImageGallery.css'

const ProductImageGallery = ({ 
  images, 
  productName, 
  selectedImage, 
  onImageSelect, 
  onImageClick 
}) => {
  const hasImages = images && images.length > 0

  if (!hasImages) {
    return (
      <div className="image-gallery">
        <div className="main-image">
          <div className="no-image-placeholder">
            <span>📦</span>
            <span>No Image Available</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="image-gallery">
      <div className="main-image" onClick={onImageClick}>
        <img 
          src={images[selectedImage]?.url || images[0]?.url} 
          alt={productName}
          className="main-image-img"
          loading="lazy"
        />
        <div className="zoom-hint">🔍 Click to zoom</div>
      </div>
      
      {images.length > 1 && (
        <div className="image-thumbnails">
          {images.map((image, index) => (
            <button
              key={index}
              className={`thumbnail ${selectedImage === index ? 'active' : ''}`}
              onClick={() => onImageSelect(index)}
              aria-label={`View image ${index + 1} of ${images.length}`}
            >
              <img 
                src={image.url} 
                alt={`${productName} ${index + 1}`}
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default ProductImageGallery