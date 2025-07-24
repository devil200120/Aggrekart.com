import React, { useState } from 'react';

const ImageWithFallback = ({ 
  src, 
  alt, 
  className, 
  fallbackType = 'product',
  ...props 
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Generate a placeholder based on type
  const getPlaceholder = (type) => {
    const placeholders = {
      product: (
        <div className={`image-placeholder ${className || ''}`} {...props}>
          <svg viewBox="0 0 24 24" fill="currentColor" className="placeholder-icon">
            <path d="M21,19V5c0-1.1-0.9-2-2-2H5c-1.1,0-2,0.9-2,2v14c0,1.1,0.9,2,2,2h14C20.1,21,21,20.1,21,19z M8.5,13.5l2.5,3.01 L14.5,12l4.5,6H5L8.5,13.5z"/>
          </svg>
          <span className="placeholder-text">No Image</span>
        </div>
      ),
      user: (
        <div className={`image-placeholder ${className || ''}`} {...props}>
          <svg viewBox="0 0 24 24" fill="currentColor" className="placeholder-icon">
            <path d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z"/>
          </svg>
          <span className="placeholder-text">No Photo</span>
        </div>
      ),
      company: (
        <div className={`image-placeholder ${className || ''}`} {...props}>
          <svg viewBox="0 0 24 24" fill="currentColor" className="placeholder-icon">
            <path d="M12,7V3H2V21H22V7H12M6,19H4V17H6V19M6,15H4V13H6V15M6,11H4V9H6V11M6,7H4V5H6V7M10,19H8V17H10V19M10,15H8V13H10V15M10,11H8V9H10V11M10,7H8V5H10V7M20,19H12V17H14V15H12V13H14V11H12V9H20V19M18,11H16V13H18V11M18,15H16V17H18V15Z"/>
          </svg>
          <span className="placeholder-text">No Logo</span>
        </div>
      )
    };
    return placeholders[type] || placeholders.product;
  };

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  // If there's no src or it has errored, show placeholder
  if (!src || hasError) {
    return getPlaceholder(fallbackType);
  }

  return (
    <>
      {isLoading && (
        <div className={`image-placeholder loading ${className || ''}`} {...props}>
          <div className="loading-spinner"></div>
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`${className || ''} ${isLoading ? 'loading' : ''}`}
        onLoad={handleImageLoad}
        onError={handleImageError}
        style={{ display: isLoading ? 'none' : 'block' }}
        {...props}
      />
    </>
  );
};

export default ImageWithFallback;