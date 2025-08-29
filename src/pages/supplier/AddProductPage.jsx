import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
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

  // Product categories that match backend
  const productCategories = {
  aggregate: {
    name: 'Aggregate',
    subcategories: {
      dust: 'Dust',
      '10_mm_metal': '10 MM Metal',
      '20_mm_metal': '20 MM Metal',
      '40_mm_metal': '40 MM Metal',
      gsb: 'GSB',
      wmm: 'WMM',
      'm_sand': 'M.sand'
    }
  },
  sand: {
    name: 'Sand',
    subcategories: {
      river_sand_plastering: 'River sand (Plastering)',
      river_sand: 'River sand'
    }
  },
  tmt_steel: {
    name: 'TMT Steel',
    subcategories: {
      fe_415: 'FE-415',
      fe_500: 'FE-500',
      fe_550: 'FE-550',
      fe_600: 'FE-600'
    }
  },
  bricks_blocks: {
    name: 'Bricks & Blocks',
    subcategories: {
      red_bricks: 'Red Bricks',
      fly_ash_bricks: 'Fly Ash Bricks',
      concrete_blocks: 'Concrete Blocks',
      aac_blocks: 'AAC Blocks'
    }
  },
  cement: {
    name: 'Cement',
    subcategories: {
      opc: 'OPC',
      ppc: 'PPC'
    }
  }
}

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      category: '',
      subcategory: '',
      description: '',
      basePrice: '',
      minimumQuantity: '1',
      available: '',
      brand: '',
      deliveryTime: '3-5 days'
    }
  })

  const selectedCategory = watch('category')

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

  try {
    // Build specifications object based on category
    const specifications = {}
    
    // Only include specifications that are relevant to the category
    if (data.category === 'bricks_blocks' && data.size) {
      specifications.size = data.size
    }
    
    if (data.category === 'tmt_steel') {
      if (data.grade) specifications.grade = data.grade
      if (data.diameter) specifications.diameter = data.diameter
    }
    
    if (data.category === 'cement') {
      if (data.cementGrade) specifications.cementGrade = data.cementGrade
      if (data.cementType) specifications.cementType = data.cementType
    }
    
    // Only include general specifications if provided
    if (data.weight) specifications.weight = parseFloat(data.weight)
    if (data.length || data.width || data.height) {
      specifications.dimensions = {
        length: data.length ? parseFloat(data.length) : undefined,
        width: data.width ? parseFloat(data.width) : undefined,
        height: data.height ? parseFloat(data.height) : undefined
      }
    }

    // Step 1: Create the product
    const productData = {
      name: data.name,
      description: data.description,
      category: data.category,
      subcategory: data.subcategory,
      brand: data.brand || '',
      basePrice: parseFloat(data.basePrice),
      minimumQuantity: parseFloat(data.minimumQuantity),
      available: parseInt(data.available),
      deliveryTime: data.deliveryTime,
      specifications: Object.keys(specifications).length > 0 ? specifications : {}, // Send empty object instead of string
      tags: data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : []
    }

    console.log('Creating product with data:', productData)
    
    const createResponse = await supplierAPI.addProduct(productData)
    
    if (createResponse.success && createResponse.data?.product?._id) {
      const productId = createResponse.data.product._id
      console.log('Product created with ID:', productId)

      // Step 2: Upload images if product creation was successful
      if (imageFiles.length > 0) {
        console.log('Uploading images for product:', productId)
        
        const formData = new FormData()
        imageFiles.forEach((file) => {
          formData.append('images', file)
        })

        try {
          const uploadResponse = await supplierAPI.uploadProductImages(productId, formData)
          console.log('Images uploaded successfully:', uploadResponse)
          
          toast.success('Product and images added successfully!')
          navigate('/supplier/products')
        } catch (uploadError) {
          console.error('Image upload failed:', uploadError)
          const uploadErrorMsg = uploadError.response?.data?.message || uploadError.message
          toast.error(`Product created but image upload failed: ${uploadErrorMsg}`)
          navigate('/supplier/products')
        }
      } else {
        toast.success('Product created successfully!')
        navigate('/supplier/products')
      }
    } else {
      console.error('Invalid response structure:', createResponse)
      toast.error('Failed to create product - invalid response')
    }

  } catch (error) {
    console.error('Product creation error:', error)
    const errorMessage = error.response?.data?.message || error.message || 'Failed to create product'
    toast.error(errorMessage)
  } finally {
    setIsSubmitting(false)
  }
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
                    minLength: { value: 2, message: 'Name must be at least 2 characters' }
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
                    {Object.keys(productCategories).map(key => (
                      <option key={key} value={key}>
                        {productCategories[key].name}
                      </option>
                    ))}
                  </select>
                  {errors.category && <span className="error-message">{errors.category.message}</span>}
                </div>

                <div className="form-group">
                  <label>Subcategory *</label>
                  <select
                    {...register('subcategory', { required: 'Subcategory is required' })}
                    className={errors.subcategory ? 'error' : ''}
                    disabled={!selectedCategory}
                  >
                    <option value="">Select Subcategory</option>
                    {selectedCategory && productCategories[selectedCategory]?.subcategories && 
                      Object.keys(productCategories[selectedCategory].subcategories).map(key => (
                        <option key={key} value={key}>
                          {productCategories[selectedCategory].subcategories[key]}
                        </option>
                      ))
                    }
                  </select>
                  {errors.subcategory && <span className="error-message">{errors.subcategory.message}</span>}
                </div>
              </div>

              <div className="form-group">
                <label>Brand</label>
                <input
                  type="text"
                  {...register('brand')}
                  placeholder="Enter brand name"
                />
              </div>
                            {/* ===== ADD THESE CATEGORY-SPECIFIC FIELDS HERE ===== */}
              
              {/* Bricks & Blocks Specifications */}
              {selectedCategory === 'bricks_blocks' && (
                <div className="form-group">
                  <label>Size *</label>
                  <input
                    type="text"
                    {...register('size', { 
                      required: selectedCategory === 'bricks_blocks' ? 'Size is required for bricks & blocks' : false 
                    })}
                    className={errors.size ? 'error' : ''}
                    placeholder="e.g., 230x110x75mm"
                  />
                  {errors.size && <span className="error-message">{errors.size.message}</span>}
                </div>
              )}

              {/* TMT Steel Specifications */}
              {selectedCategory === 'tmt_steel' && (
                <div className="form-row">
                  <div className="form-group">
                    <label>Grade</label>
                    <select {...register('grade')}>
                      <option value="">Select Grade</option>
                      <option value="FE-415">FE-415</option>
                      <option value="FE-500">FE-500</option>
                      <option value="FE-550">FE-550</option>
                      <option value="FE-600">FE-600</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Diameter</label>
                    <select {...register('diameter')}>
                      <option value="">Select Diameter</option>
                      <option value="6mm">6mm</option>
                      <option value="8mm">8mm</option>
                      <option value="10mm">10mm</option>
                      <option value="12mm">12mm</option>
                      <option value="16mm">16mm</option>
                      <option value="20mm">20mm</option>
                      <option value="25mm">25mm</option>
                      <option value="32mm">32mm</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Cement Specifications */}
              {selectedCategory === 'cement' && (
                <div className="form-row">
                  <div className="form-group">
                    <label>Cement Grade</label>
                    <select {...register('cementGrade')}>
                      <option value="">Select Grade</option>
                      <option value="33_grade">33 Grade</option>
                      <option value="43_grade">43 Grade</option>
                      <option value="53_grade">53 Grade</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Cement Type</label>
                    <select {...register('cementType')}>
                      <option value="">Select Type</option>
                      <option value="OPC">OPC</option>
                      <option value="PPC">PPC</option>
                    </select>
                  </div>
                </div>
              )}

              {/* General Specifications - Optional for all categories */}
              <div className="form-group">
                <label>Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  {...register('weight')}
                  placeholder="Weight in kg (optional)"
                />
              </div>

              <div className="form-group">
                <label>Dimensions (mm)</label>
                <div className="form-row">
                  <input
                    type="number"
                    {...register('length')}
                    placeholder="Length (mm)"
                  />
                  <input
                    type="number"
                    {...register('width')}
                    placeholder="Width (mm)"
                  />
                  <input
                    type="number"
                    {...register('height')}
                    placeholder="Height (mm)"
                  />
                </div>
              </div>

              {/* ===== END OF CATEGORY-SPECIFIC FIELDS ===== */}

              <div className="form-group">
                <label>Description *</label>
                <textarea
                  {...register('description', { 
                    required: 'Description is required',
                    minLength: { value: 10, message: 'Description must be at least 10 characters' }
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
                  <label>Base Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('basePrice', { 
                      required: 'Base price is required',
                      min: { value: 0.01, message: 'Price must be greater than 0' }
                    })}
                    className={errors.basePrice ? 'error' : ''}
                    placeholder="Enter base price"
                  />
                  {errors.basePrice && <span className="error-message">{errors.basePrice.message}</span>}
                </div>

                <div className="form-group">
                  <label>Minimum Quantity *</label>
                  <input
                    type="number"
                    step="0.1"
                    {...register('minimumQuantity', { 
                      required: 'Minimum quantity is required',
                      min: { value: 0.1, message: 'Minimum quantity must be at least 0.1' }
                    })}
                    className={errors.minimumQuantity ? 'error' : ''}
                    placeholder="Minimum order quantity"
                  />
                  {errors.minimumQuantity && <span className="error-message">{errors.minimumQuantity.message}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Available Stock *</label>
                  <input
                    type="number"
                    {...register('available', { 
                      required: 'Available stock is required',
                      min: { value: 0, message: 'Stock cannot be negative' }
                    })}
                    className={errors.available ? 'error' : ''}
                    placeholder="Available quantity"
                  />
                  {errors.available && <span className="error-message">{errors.available.message}</span>}
                </div>

                <div className="form-group">
                  <label>Delivery Time *</label>
                  <input
                    type="text"
                    {...register('deliveryTime', { 
                      required: 'Delivery time is required'
                    })}
                    className={errors.deliveryTime ? 'error' : ''}
                    placeholder="e.g., 3-5 days"
                  />
                  {errors.deliveryTime && <span className="error-message">{errors.deliveryTime.message}</span>}
                </div>
              </div>
            </div>

            {/* Additional Details */}
            <div className="form-section">
              <h2>Additional Details</h2>
              
              <div className="form-group">
                <label>Specifications</label>
                <textarea
                  {...register('specifications')}
                  placeholder="Technical specifications, dimensions, etc."
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Tags (comma-separated)</label>
                <input
                  type="text"
                  {...register('tags')}
                  placeholder="e.g., premium, durable, certified"
                />
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
                        className="remove-image-btn"
                      >
                        ✕
                      </button>
                      {index === 0 && <div className="primary-badge">Primary</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/supplier/products')}
              className="btn btn-secondary"
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