// Replace the entire file with this updated version:

import React, { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';
import './BaseProductCreator.css';

const BaseProductCreator = () => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    subcategory: '',
    hsnCode: '',
    specifications: {},
    images: [],
    pricing: {
      unit: ''
    }
  });
  const [isUploading, setIsUploading] = useState(false);

const [isSubmitting, setIsSubmitting] = useState(false); // Add this line
  const categories = [
    { value: 'aggregate', label: 'Aggregate (Stone, Metal, Dust)' },
    { value: 'sand', label: 'Sand (River Sand, M.Sand)' },
    { value: 'tmt_steel', label: 'TMT Steel & Reinforcement' },
    { value: 'bricks_blocks', label: 'Bricks & Blocks' },
    { value: 'cement', label: 'Cement' }
  ];

  const subcategories = {
    aggregate: ['Stone Aggregate', 'Metal Aggregate', 'Stone Dust'],
    sand: ['River Sand', 'M Sand', 'P Sand'],
    tmt_steel: ['FE-415', 'FE-500', 'FE-550'],
    bricks_blocks: ['Red Bricks', 'Fly Ash Bricks', 'AAC Blocks'],
    cement: ['OPC Cement', 'PPC Cement', 'PSC Cement']
  };

  const getDefaultUnit = (category) => {
    switch(category) {
      case 'aggregate':
      case 'sand':
        return 'MT';
      case 'cement':
        return 'bags';
      case 'tmt_steel':
        return 'MT';
      case 'bricks_blocks':
        return 'numbers';
      default:
        return 'MT';
    }
  };

  // Create base product mutation
  const createProductMutation = useMutation(
    (productData) => adminAPI.createBaseProduct(productData),
    {
      onSuccess: () => {
        toast.success('Base product created successfully!');
        setFormData({
          name: '',
          description: '',
          category: '',
          subcategory: '',
          hsnCode: '',
          specifications: {},
          images: [],
          pricing: {
            unit: ''
          }
        });
        queryClient.invalidateQueries('admin-products');
      },
      onError: (error) => {
        console.error('Create product error:', error);
        const message = error.response?.data?.message || 'Failed to create product';
        const errors = error.response?.data?.errors;
        if (errors) {
          errors.forEach(err => toast.error(err.msg));
        } else {
          toast.error(message);
        }
      }
    }
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'category' && { 
        subcategory: '',
        pricing: {
          ...prev.pricing,
          unit: getDefaultUnit(value)
        }
      })
    }));
  };

  const handleImageUpload = async (e) => {
  const files = Array.from(e.target.files);
  if (files.length === 0) return;

  setIsUploading(true);
  try {
    // Create preview URLs for immediate display
    const previewImages = files.map((file, index) => ({
      url: URL.createObjectURL(file),
      alt: `${formData.name} image ${index + 1}`,
      isPrimary: formData.images.length === 0 && index === 0,
      file: file // Store the actual file for upload
    }));

    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...previewImages]
    }));

    toast.success('Images added successfully');
  } catch (error) {
    console.error('Error adding images:', error);
    toast.error('Failed to add images');
  } finally {
    setIsUploading(false);
  }
};

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (formData.images.length === 0) {
    toast.error('Please upload at least one product image');
    return;
  }

  if (!formData.pricing.unit) {
    toast.error('Please select a pricing unit');
    return;
  }

  setIsSubmitting(true);
  
  try {
    // Create FormData for file upload
    const submitData = new FormData();
    
    // Add text fields
    submitData.append('name', formData.name);
    submitData.append('description', formData.description);
    submitData.append('category', formData.category);
    submitData.append('subcategory', formData.subcategory);
    submitData.append('hsnCode', formData.hsnCode);
    submitData.append('specifications', JSON.stringify(formData.specifications));
submitData.append('pricingUnit', formData.pricing.unit);    
    // Add image files
    formData.images.forEach((image, index) => {
      if (image.file) {
        submitData.append('images', image.file);
      }
    });

    console.log('Submitting base product with images...');
    await adminAPI.createBaseProduct(submitData);
    
    toast.success('Base product created successfully!');
    
    // Reset form
    setFormData({
      name: '',
      description: '',
      category: 'aggregate',
      subcategory: '',
      specifications: {},
      hsnCode: '',
      images: [],
      pricing: { unit: '' }
    });
    
    // Refresh the base products list
    queryClient.invalidateQueries(['admin-base-products']);
    
  } catch (error) {
    console.error('Error creating base product:', error);
    toast.error(error.response?.data?.message || 'Failed to create base product');
  } finally {
    setIsSubmitting(false);
  }
};

  return (
    <div className="base-product-creator">
      <div className="creator-header">
        <h2>🛠️ Create Base Product</h2>
        <p>Create base products that suppliers can add pricing to. Only admins can upload product images.</p>
      </div>

      <form onSubmit={handleSubmit} className="creator-form">
        {/* Basic Information */}
        <div className="form-section">
          <h3>📋 Basic Information</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label>Product Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter product name"
                required
              />
            </div>

            <div className="form-group">
              <label>HSN Code (Optional)</label>
              <input
                type="text"
                name="hsnCode"
                value={formData.hsnCode}
                onChange={handleInputChange}
                placeholder="Enter HSN code (e.g., 2517)"
                minLength="4"
                maxLength="8"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Enter detailed product description (min 10 characters)"
              rows={4}
              required
              minLength="10"
            />
          </div>
        </div>

        {/* Category Selection */}
        <div className="form-section">
          <h3>🏷️ Category & Classification</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label>Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Subcategory (Optional)</label>
              <select
                name="subcategory"
                value={formData.subcategory}
                onChange={handleInputChange}
                disabled={!formData.category}
              >
                <option value="">Select Subcategory (Optional)</option>
                {formData.category && subcategories[formData.category]?.map(sub => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {formData.category && (
            <div className="form-group">
              <label>Pricing Unit</label>
              <input
                type="text"
                value={formData.pricing.unit}
                disabled
                placeholder="Auto-set based on category"
              />
              <small>Unit is automatically set based on selected category</small>
            </div>
          )}
        </div>

        {/* Image Upload */}
        <div className="form-section">
          <h3>📸 Product Images (Admin Only)</h3>
          <p className="upload-note">
            ⚠️ Only admins can upload product images. Suppliers will only be able to set pricing and delivery time.
          </p>
          
          <div className="image-upload">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              disabled={isUploading}
              id="image-upload"
              style={{ display: 'none' }}
            />
            <label htmlFor="image-upload" className="upload-btn">
              {isUploading ? '⏳ Uploading...' : '📁 Upload Images'}
            </label>
          </div>

          {formData.images.length > 0 && (
            <div className="image-preview">
              {formData.images.map((image, index) => (
                <div key={index} className="image-item">
                  <img src={image.url} alt={image.alt} />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="remove-btn"
                  >
                    ❌
                  </button>
                  {image.isPrimary && <span className="primary-badge">Primary</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={createProductMutation.isLoading || isUploading}
          >
            {createProductMutation.isLoading ? '⏳ Creating...' : '✅ Create Base Product'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BaseProductCreator;