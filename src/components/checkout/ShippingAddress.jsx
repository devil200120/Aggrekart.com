import React, { useState } from 'react'
import LocationSelector from '../location/LocationSelector' // ADDED
import './ShippingAddress.css'

const ShippingAddress = ({ 
  register, 
  handleSubmit, 
  errors, 
  onSubmit, 
  watch,
  setValue,
  defaultData 
}) => {
  const [savedAddresses] = useState([
    // Mock saved addresses - in real app, fetch from API
    {
      id: 1,
      type: 'home',
      fullName: 'John Doe',
      address: '123 Main Street, Apartment 4B',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      phone: '+91 9876543210',
      isDefault: true
    },
    {
      id: 2,
      type: 'office',
      fullName: 'John Doe',
      address: '456 Business Park, Floor 5',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411001',
      phone: '+91 9876543210',
      isDefault: false
    }
  ])

  const [selectedAddressId, setSelectedAddressId] = useState(null)
  const [showNewAddressForm, setShowNewAddressForm] = useState(false)

  // ADDED: Handle location selection from LocationSelector
  const handleLocationSelect = (location) => {
    setValue('city', location.city)
    setValue('state', location.state)
    setValue('pincode', location.pincode || '')
    if (location.address) {
      setValue('address', location.address)
    }
  }

  const handleAddressSelect = (address) => {
    setSelectedAddressId(address.id)
    // Fill form with selected address
    setValue('fullName', address.fullName)
    setValue('address', address.address)
    setValue('city', address.city)
    setValue('state', address.state)
    setValue('pincode', address.pincode)
    setValue('phone', address.phone)
    setShowNewAddressForm(false)
  }

  const handleNewAddress = () => {
    setSelectedAddressId(null)
    setShowNewAddressForm(true)
    // Clear form
    setValue('fullName', defaultData?.fullName || '')
    setValue('address', '')
    setValue('city', '')
    setValue('state', '')
    setValue('pincode', '')
    setValue('phone', defaultData?.phone || '')
  }

  return (
    <div className="shipping-address">
      <div className="shipping-header">
        <h2 className="shipping-title">Delivery Address</h2>
        <p className="shipping-subtitle">Choose where you want your order delivered</p>
      </div>

      {/* Saved Addresses */}
      {savedAddresses.length > 0 && (
        <div className="saved-addresses">
          <h3 className="saved-addresses-title">Saved Addresses</h3>
          <div className="address-list">
            {savedAddresses.map((address) => (
              <div
                key={address.id}
                className={`address-card ${selectedAddressId === address.id ? 'selected' : ''}`}
                onClick={() => handleAddressSelect(address)}
              >
                <div className="address-header">
                  <div className="address-type">
                    <span className="address-type-icon">
                      {address.type === 'home' ? '🏠' : '🏢'}
                    </span>
                    <span className="address-type-text">
                      {address.type.charAt(0).toUpperCase() + address.type.slice(1)}
                    </span>
                    {address.isDefault && (
                      <span className="default-badge">Default</span>
                    )}
                  </div>
                  <div className="address-actions">
                    <button type="button" className="btn btn-text btn-sm">Edit</button>
                  </div>
                </div>
                
                <div className="address-details">
                  <p className="address-name">{address.fullName}</p>
                  <p className="address-text">{address.address}</p>
                  <p className="address-location">
                    {address.city}, {address.state} - {address.pincode}
                  </p>
                  <p className="address-phone">{address.phone}</p>
                </div>
              </div>
            ))}
          </div>
          
          <button
            type="button"
            className="btn btn-outline add-new-address-btn"
            onClick={handleNewAddress}
          >
            + Add New Address
          </button>
        </div>
      )}

      {/* New Address Form */}
      {(showNewAddressForm || savedAddresses.length === 0) && (
        <div className="new-address-form">
          <h3 className="new-address-title">
            {savedAddresses.length === 0 ? 'Delivery Address' : 'Add New Address'}
          </h3>
          
          <form onSubmit={handleSubmit(onSubmit)} className="address-form">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  className={`form-input ${errors.fullName ? 'error' : ''}`}
                  placeholder="Enter full name"
                  {...register('fullName', {
                    required: 'Full name is required',
                    minLength: {
                      value: 2,
                      message: 'Name must be at least 2 characters'
                    }
                  })}
                />
                {errors.fullName && (
                  <span className="error-message">{errors.fullName.message}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number *</label>
                <input
                  type="tel"
                  className={`form-input ${errors.phone ? 'error' : ''}`}
                  placeholder="Enter 10-digit mobile number"
                  {...register('phone', {
                    required: 'Phone number is required',
                    pattern: {
                      value: /^[0-9]{10}$/,
                      message: 'Please enter a valid 10-digit phone number'
                    }
                  })}
                />
                {errors.phone && (
                  <span className="error-message">{errors.phone.message}</span>
                )}
              </div>
            </div>

            {/* ADDED: Location Selector Integration */}
            <div className="form-group">
              <label className="form-label">Location *</label>
              <LocationSelector
                onLocationChange={handleLocationSelect}
                selectedLocation={{
                  city: watch('city'),
                  state: watch('state'),
                  pincode: watch('pincode')
                }}
                showServiceAreas={true}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Address *</label>
              <textarea
                className={`form-textarea ${errors.address ? 'error' : ''}`}
                placeholder="House/Flat no., Building name, Street name, Area"
                rows="3"
                {...register('address', {
                  required: 'Address is required',
                  minLength: {
                    value: 10,
                    message: 'Please enter a detailed address'
                  }
                })}
              />
              {errors.address && (
                <span className="error-message">{errors.address.message}</span>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">City *</label>
                <input
                  type="text"
                  className={`form-input ${errors.city ? 'error' : ''}`}
                  placeholder="City"
                  readOnly
                  {...register('city', {
                    required: 'City is required'
                  })}
                />
                {errors.city && (
                  <span className="error-message">{errors.city.message}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">State *</label>
                <input
                  type="text"
                  className={`form-input ${errors.state ? 'error' : ''}`}
                  placeholder="State"
                  readOnly
                  {...register('state', {
                    required: 'State is required'
                  })}
                />
                {errors.state && (
                  <span className="error-message">{errors.state.message}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">PIN Code *</label>
                <input
                  type="text"
                  className={`form-input ${errors.pincode ? 'error' : ''}`}
                  placeholder="PIN Code"
                  {...register('pincode', {
                    required: 'PIN code is required',
                    pattern: {
                      value: /^[0-9]{6}$/,
                      message: 'Please enter a valid 6-digit PIN code'
                    }
                  })}
                />
                {errors.pincode && (
                  <span className="error-message">{errors.pincode.message}</span>
                )}
              </div>
            </div>

            <div className="address-type-selection">
              <label className="form-label">Address Type</label>
              <div className="address-type-options">
                <label className="radio-option">
                  <input
                    type="radio"
                    value="home"
                    {...register('addressType')}
                    defaultChecked
                  />
                  <span className="radio-label">
                    <span className="radio-icon">🏠</span>
                    Home
                  </span>
                </label>
                
                <label className="radio-option">
                  <input
                    type="radio"
                    value="office"
                    {...register('addressType')}
                  />
                  <span className="radio-label">
                    <span className="radio-icon">🏢</span>
                    Office
                  </span>
                </label>
                
                <label className="radio-option">
                  <input
                    type="radio"
                    value="other"
                    {...register('addressType')}
                  />
                  <span className="radio-label">
                    <span className="radio-icon">📍</span>
                    Other
                  </span>
                </label>
              </div>
            </div>

            <div className="form-actions">
              {savedAddresses.length > 0 && (
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    setShowNewAddressForm(false)
                    setSelectedAddressId(savedAddresses[0].id)
                  }}
                >
                  Cancel
                </button>
              )}
              
              <button type="submit" className="btn btn-primary">
                Continue to Payment
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Continue with selected address */}
      {selectedAddressId && !showNewAddressForm && (
        <div className="continue-section">
          <button
            type="button"
            className="btn btn-primary btn-lg"
            onClick={handleSubmit(onSubmit)}
          >
            Continue to Payment
          </button>
        </div>
      )}
    </div>
  )
}

export default ShippingAddress