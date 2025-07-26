// Create this new file:

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery } from 'react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { supplierAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { toast } from 'react-hot-toast'
import LoadingSpinner from '../../components/common/LoadingSpinner'

const EditProductPage = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { productId } = useParams()

  // Product categories that match backend
  const productCategories = {
    aggregate: {
      name: 'Aggregate',
      subcategories: {
        dust: 'Dust',
        '10mm_metal': '10 MM Metal',
        '20mm_metal': '20 MM Metal',
        '40mm_metal': '40 MM Metal',
        gsb: 'GSB',
        wmm: 'WMM',
        m_sand: 'M.sand'
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

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm()

  // Fetch product details
  const { data: productData, isLoading: isLoadingProduct } = useQuery(
    ['product', productId],
    () => supplierAPI.getProduct(productId),
    {
      enabled: !!productId,
      onSuccess: (data) => {
        const product = data.data;
        setValue('name', product.name)
        setValue('category', product.category)
        setValue('subcategory', product.subcategory)
        setValue('description', product.description)
        setValue('basePrice', product.pricing?.basePrice || '')
        setValue('minimumQuantity', product.pricing?.minimumQuantity || 1)
        setValue('available', product.stock?.available || '')
        setValue('brand', product.brand || '')
        setValue('deliveryTime', product.deliveryTime || '3-5 days')
      }
    }
  )

  const selectedCategory = watch('category')

  const updateProductMutation = useMutation(
    (productData) => supplierAPI.updateProduct(productId, productData),
    {
      onSuccess: () => {
        toast.success('Product updated successfully!')
        navigate('/supplier/products')
      },
      onError: (error) => {
        console.error('Update product error:', error.response?.data)
        toast.error(error.response?.data?.message || 'Failed to update product')
      }
    }
  )

  const onSubmit = (data) => {
    console.log('Submitting product update:', data)
    updateProductMutation.mutate(data)
  }

  if (!user || user.role !== 'supplier') {
    return (
      <div className="add-product-page">
        <div className="container">
          <div className="access-denied">
            <h2>Access Denied</h2>
            <p>Only suppliers can access this page</p>
          </div>
        </div>
      </div>
    )
  }

  if (isLoadingProduct) {
    return (
      <div className="add-product-page">
        <div className="container">
          <LoadingSpinner size="large" text="Loading product..." />
        </div>
      </div>
    )
  }

  return (
    <div className="add-product-page">
      <div className="container">
        <div className="page-header">
          <h1>Edit Product</h1>
          <p>Update your product information</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="product-form">
          {/* Basic Information */}
          <div className="form-section">
            <h3>Basic Information</h3>
            
            <div className="form-group">
              <label htmlFor="name">Product Name *</label>
              <input
                id="name"
                type="text"
                {...register('name', { required: 'Product name is required' })}
                className={errors.name ? 'error' : ''}
              />
              {errors.name && <span className="error-message">{errors.name.message}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="category">Category *</label>
                <select
                  id="category"
                  {...register('category', { required: 'Category is required' })}
                  className={errors.category ? 'error' : ''}
                >
                  <option value="">Select Category</option>
                  {Object.entries(productCategories).map(([key, category]) => (
                    <option key={key} value={key}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {errors.category && <span className="error-message">{errors.category.message}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="subcategory">Subcategory *</label>
                <select
                  id="subcategory"
                  {...register('subcategory', { required: 'Subcategory is required' })}
                  className={errors.subcategory ? 'error' : ''}
                  disabled={!selectedCategory}
                >
                  <option value="">Select Subcategory</option>
                  {selectedCategory && productCategories[selectedCategory] && 
                    Object.entries(productCategories[selectedCategory].subcategories).map(([key, name]) => (
                      <option key={key} value={key}>
                        {name}
                      </option>
                    ))
                  }
                </select>
                {errors.subcategory && <span className="error-message">{errors.subcategory.message}</span>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                rows="4"
                {...register('description', { required: 'Description is required' })}
                className={errors.description ? 'error' : ''}
                placeholder="Describe your product in detail..."
              />
              {errors.description && <span className="error-message">{errors.description.message}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="brand">Brand</label>
              <input
                id="brand"
                type="text"
                {...register('brand')}
                placeholder="Brand name (if applicable)"
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="form-section">
            <h3>Pricing & Stock</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="basePrice">Base Price (₹) *</label>
                <input
                  id="basePrice"
                  type="number"
                  step="0.01"
                  {...register('basePrice', { 
                    required: 'Base price is required',
                    min: { value: 0.01, message: 'Price must be greater than 0' }
                  })}
                  className={errors.basePrice ? 'error' : ''}
                />
                {errors.basePrice && <span className="error-message">{errors.basePrice.message}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="minimumQuantity">Minimum Quantity *</label>
                <input
                  id="minimumQuantity"
                  type="number"
                  step="0.1"
                  {...register('minimumQuantity', { 
                    required: 'Minimum quantity is required',
                    min: { value: 0.1, message: 'Minimum quantity must be at least 0.1' }
                  })}
                  className={errors.minimumQuantity ? 'error' : ''}
                />
                {errors.minimumQuantity && <span className="error-message">{errors.minimumQuantity.message}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="available">Available Stock *</label>
                <input
                  id="available"
                  type="number"
                  {...register('available', { 
                    required: 'Available stock is required',
                    min: { value: 0, message: 'Stock cannot be negative' }
                  })}
                  className={errors.available ? 'error' : ''}
                />
                {errors.available && <span className="error-message">{errors.available.message}</span>}
              </div>
            </div>
          </div>

          {/* Delivery */}
          <div className="form-section">
            <h3>Delivery Information</h3>
            
            <div className="form-group">
              <label htmlFor="deliveryTime">Delivery Time *</label>
              <select
                id="deliveryTime"
                {...register('deliveryTime', { required: 'Delivery time is required' })}
                className={errors.deliveryTime ? 'error' : ''}
              >
                <option value="same_day">Same Day</option>
                <option value="1-2_days">1-2 Days</option>
                <option value="3-5_days">3-5 Days</option>
                <option value="1_week">1 Week</option>
                <option value="2_weeks">2 Weeks</option>
              </select>
              {errors.deliveryTime && <span className="error-message">{errors.deliveryTime.message}</span>}
            </div>
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              onClick={() => navigate('/supplier/products')}
              className="btn btn-outline"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={updateProductMutation.isLoading}
              className="btn btn-primary"
            >
              {updateProductMutation.isLoading ? 'Updating...' : 'Update Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditProductPage
