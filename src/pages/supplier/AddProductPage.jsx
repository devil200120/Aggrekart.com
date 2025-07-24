import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation } from 'react-query'
import { useNavigate } from 'react-router-dom'
import { supplierAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { toast } from 'react-hot-toast'
import './AddProductPage.css'

const AddProductPage = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [images, setImages] = useState([])
  const [imageFiles, setImageFiles] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      category: '',
      description: '',
      price: '',
      unit: '',
      minOrderQuantity: '1',
      stockQuantity: '',
      specifications: '',
      brand: '',
      model: '',
      weight: '',
      dimensions: '',
      deliveryTime: '3-5',
      returnPolicy: '7',
      warranty: '',
      certifications: '',
      keywords: ''
    }
  })

  const addProductMutation = useMutation(
    (productData) => supplierAPI.addProduct(productData),
    {
      onSuccess: (data) => {
        toast.success('Product added successfully!')
        console.log(data)
        navigate('/supplier/products')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to add product')
      },
      onSettled: () => {
        setIsSubmitting(false)
      }
    }
  )

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files)
    
    if (images.length + files.length > 5) {
      toast.error('Maximum 5 images allowed')
      return
    }

    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error(`${file.name} is too large. Maximum size is 5MB`)
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        setImages(prev => [...prev, e.target.result])
        setImageFiles(prev => [...prev, file])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index))
    setImageFiles(prev => prev.filter((_, i) => i !== index))
  }

  const onSubmit = async (data) => {
    if (images.length === 0) {
      toast.error('Please add at least one product image')
      return
    }

    setIsSubmitting(true)

    // Create FormData for file upload
    const formData = new FormData()
    
    // Add product data
    Object.keys(data).forEach(key => {
      if (data[key]) {
        formData.append(key, data[key])
      }
    })

    // Add images
    imageFiles.forEach((file, index) => {
        console.log(index)
      formData.append('images', file)
    })

    addProductMutation.mutate(formData)
  }

  if (!user || user.role !== 'supplier') {
    return (
      <div className="add-product-page">
        <div className="container">
          <div className="access-denied">
            <h2>Access Denied</h2>
            <p>Only suppliers can add products</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="add-product-page">
      <div className="container">
        {/* Page Header */}
        <div className="page-header">
          <h1>Add New Product</h1>
          <p>Add a new product to your catalog</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="add-product-form">
          <div className="form-grid">
            {/* Basic Information */}
            <div className="form-section">
              <h2>Basic Information</h2>
              
              <div className="form-group">
                <label>Product Name *</label>
                <input
                  type="text"
                  {...register('name', { 
                    required: 'Product name is required',
                    minLength: { value: 3, message: 'Name must be at least 3 characters' }
                  })}
                  className={errors.name ? 'error' : ''}
                  placeholder="Enter product name"
                />
                {errors.name && <span className="error-message">{errors.name.message}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Category *</label>
                  <select
                    {...register('category', { required: 'Category is required' })}
                    className={errors.category ? 'error' : ''}
                  >
                    <option value="">Select Category</option>
                    <option value="cement">Cement</option>
                    <option value="steel">TMT Steel</option>
                    <option value="bricks">Bricks & Blocks</option>
                    <option value="sand">Sand</option>
                    <option value="aggregates">Aggregates</option>
                    <option value="concrete">Ready Mix Concrete</option>
                    <option value="roofing">Roofing Materials</option>
                    <option value="pipes">Pipes & Fittings</option>
                    <option value="electrical">Electrical</option>
                    <option value="hardware">Hardware</option>
                  </select>
                  {errors.category && <span className="error-message">{errors.category.message}</span>}
                </div>

                <div className="form-group">
                  <label>Brand</label>
                  <input
                    type="text"
                    {...register('brand')}
                    placeholder="Enter brand name"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea
                  {...register('description', { 
                    required: 'Description is required',
                    minLength: { value: 20, message: 'Description must be at least 20 characters' }
                  })}
                  className={errors.description ? 'error' : ''}
                  placeholder="Describe your product in detail"
                  rows="4"
                />
                {errors.description && <span className="error-message">{errors.description.message}</span>}
              </div>
            </div>

            {/* Pricing & Inventory */}
            <div className="form-section">
              <h2>Pricing & Inventory</h2>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('price', { 
                      required: 'Price is required',
                      min: { value: 0.01, message: 'Price must be greater than 0' }
                    })}
                    className={errors.price ? 'error' : ''}
                    placeholder="Enter price"
                  />
                  {errors.price && <span className="error-message">{errors.price.message}</span>}
                </div>

                <div className="form-group">
                  <label>Unit *</label>
                  <select
                    {...register('unit', { required: 'Unit is required' })}
                    className={errors.unit ? 'error' : ''}
                  >
                    <option value="">Select Unit</option>
                    <option value="kg">Kilogram (kg)</option>
                    <option value="ton">Ton</option>
                    <option value="piece">Piece</option>
                    <option value="bag">Bag</option>
                    <option value="cubic meter">Cubic Meter</option>
                    <option value="square meter">Square Meter</option>
                    <option value="feet">Feet</option>
                    <option value="meter">Meter</option>
                  </select>
                  {errors.unit && <span className="error-message">{errors.unit.message}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Stock Quantity *</label>
                  <input
                    type="number"
                    {...register('stockQuantity', { 
                      required: 'Stock quantity is required',
                      min: { value: 0, message: 'Stock cannot be negative' }
                    })}
                    className={errors.stockQuantity ? 'error' : ''}
                    placeholder="Available quantity"
                  />
                  {errors.stockQuantity && <span className="error-message">{errors.stockQuantity.message}</span>}
                </div>

                <div className="form-group">
                  <label>Minimum Order Quantity</label>
                  <input
                    type="number"
                    {...register('minOrderQuantity')}
                    placeholder="Minimum order quantity"
                  />
                </div>
              </div>
            </div>

            {/* Product Images */}
            <div className="form-section">
              <h2>Product Images</h2>
              
              <div className="image-upload-area">
                <input
                  type="file"
                  id="images"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="image-input"
                />
                <label htmlFor="images" className="image-upload-label">
                  <div className="upload-content">
                    <div className="upload-icon">📸</div>
                    <div className="upload-text">
                      <strong>Click to upload images</strong>
                      <span>or drag and drop</span>
                    </div>
                    <div className="upload-note">
                      PNG, JPG up to 5MB each (max 5 images)
                    </div>
                  </div>
                </label>
              </div>

              {images.length > 0 && (
                <div className="image-preview-grid">
                  {images.map((image, index) => (
                    <div key={index} className="image-preview">
                      <img src={image} alt={`Preview ${index + 1}`} />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="remove-image"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Additional Details */}
            <div className="form-section">
              <h2>Additional Details</h2>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Model/Grade</label>
                  <input
                    type="text"
                    {...register('model')}
                    placeholder="Model or grade"
                  />
                </div>

                <div className="form-group">
                  <label>Weight</label>
                  <input
                    type="text"
                    {...register('weight')}
                    placeholder="Product weight"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Dimensions</label>
                <input
                  type="text"
                  {...register('dimensions')}
                  placeholder="Length x Width x Height"
                />
              </div>

              <div className="form-group">
                <label>Specifications</label>
                <textarea
                  {...register('specifications')}
                  placeholder="Technical specifications, features, etc."
                  rows="3"
                />
              </div>
            </div>

            {/* Business Terms */}
            <div className="form-section">
              <h2>Business Terms</h2>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Delivery Time</label>
                  <select {...register('deliveryTime')}>
                    <option value="1-2">1-2 days</option>
                    <option value="3-5">3-5 days</option>
                    <option value="1-2 weeks">1-2 weeks</option>
                    <option value="2-4 weeks">2-4 weeks</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Return Policy</label>
                  <select {...register('returnPolicy')}>
                    <option value="7">7 days</option>
                    <option value="15">15 days</option>
                    <option value="30">30 days</option>
                    <option value="no-return">No returns</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Warranty</label>
                  <input
                    type="text"
                    {...register('warranty')}
                    placeholder="Warranty period"
                  />
                </div>

                <div className="form-group">
                  <label>Certifications</label>
                  <input
                    type="text"
                    {...register('certifications')}
                    placeholder="ISI, BIS, etc."
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Keywords</label>
                <input
                  type="text"
                  {...register('keywords')}
                  placeholder="Search keywords (comma separated)"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button 
              type="button"
              onClick={() => navigate('/supplier/products')}
              className="btn btn-outline"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            
            <button 
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Adding Product...' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddProductPage