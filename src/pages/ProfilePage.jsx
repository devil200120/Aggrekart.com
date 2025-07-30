import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { usersAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import LoadingSpinner from '../components/common/LoadingSpinner'
import MembershipTab from '../components/membership/MembershipTab'
import './ProfilePage.css'
import UserAnalytics from '../components/analytics/UserAnalytics'

const ProfilePage = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  
  // Get tab from URL params or default to 'personal'
  const urlParams = new URLSearchParams(window.location.search)
  const initialTab = urlParams.get('tab') || 'personal'
  
  const [activeTab, setActiveTab] = useState(initialTab)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    customerType: '',
    gstNumber: ''
  })
  const [addressForm, setAddressForm] = useState({
    address: '',
    city: '',
    state: '',
    pincode: '',
    isDefault: false
  })
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [editingAddress, setEditingAddress] = useState(null) // Fix: Added editing address state
  const [showEditAddressForm, setShowEditAddressForm] = useState(false) // Fix: Added edit form state

  // Update URL when tab changes
  useEffect(() => {
    const url = new URL(window.location)
    if (activeTab !== 'personal') {
      url.searchParams.set('tab', activeTab)
    } else {
      url.searchParams.delete('tab')
    }
    window.history.replaceState({}, '', url)
  }, [activeTab])

  // Fetch user profile
  const { data: profileData, isLoading: profileLoading } = useQuery(
    'userProfile',
    usersAPI.getProfile,
    {
      onSuccess: (data) => {
        if (data?.data?.user) {
          const userData = data.data.user
          setFormData({
            name: userData.name || '',
            email: userData.email || '',
            phoneNumber: userData.phoneNumber || '',
            customerType: userData.customerType || '',
            gstNumber: userData.gstNumber || ''
          })
        }
      }
    }
  )

  // Fetch user addresses
  const { data: addressesData, isLoading: addressesLoading } = useQuery(
    'userAddresses',
    usersAPI.getAddresses
  )

  // Update profile mutation
  const updateProfileMutation = useMutation(
    (data) => usersAPI.updateProfile(data),
    {
      onSuccess: (response) => {
        toast.success('Profile updated successfully!')
        setIsEditing(false)
        queryClient.invalidateQueries('userProfile')
        queryClient.invalidateQueries('auth')
      },
      onError: (error) => {
        toast.error(error?.response?.data?.message || 'Failed to update profile')
      }
    }
  )

  // Add address mutation
  const addAddressMutation = useMutation(
    (data) => usersAPI.addAddress(data),
    {
      onSuccess: () => {
        toast.success('Address added successfully!')
        setShowAddressForm(false)
        setAddressForm({
          address: '',
          city: '',
          state: '',
          pincode: '',
          isDefault: false
        })
        queryClient.invalidateQueries('userAddresses')
      },
      onError: (error) => {
        toast.error(error?.response?.data?.message || 'Failed to add address')
      }
    }
  )

  // Fix: Added update address mutation
  const updateAddressMutation = useMutation(
    ({ addressId, data }) => usersAPI.updateAddress(addressId, data),
    {
      onSuccess: () => {
        toast.success('Address updated successfully!')
        setShowEditAddressForm(false)
        setEditingAddress(null)
        setAddressForm({
          address: '',
          city: '',
          state: '',
          pincode: '',
          isDefault: false
        })
        queryClient.invalidateQueries('userAddresses')
      },
      onError: (error) => {
        toast.error(error?.response?.data?.message || 'Failed to update address')
      }
    }
  )

  // Delete address mutation
  const deleteAddressMutation = useMutation(
    (addressId) => usersAPI.deleteAddress(addressId),
    {
      onSuccess: () => {
        toast.success('Address deleted successfully!')
        queryClient.invalidateQueries('userAddresses')
      },
      onError: (error) => {
        toast.error(error?.response?.data?.message || 'Failed to delete address')
      }
    }
  )

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleAddressChange = (e) => {
    const { name, value, type, checked } = e.target
    setAddressForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleProfileSubmit = (e) => {
    e.preventDefault()
    updateProfileMutation.mutate(formData)
  }

  const handleAddressSubmit = (e) => {
    e.preventDefault()
    addAddressMutation.mutate(addressForm)
  }

  // Fix: Added edit address submit handler
  const handleEditAddressSubmit = (e) => {
    e.preventDefault()
    if (editingAddress) {
      updateAddressMutation.mutate({
        addressId: editingAddress._id,
        data: addressForm
      })
    }
  }

  // Fix: Added edit address handler
  const handleEditAddress = (address) => {
    setEditingAddress(address)
    setAddressForm({
      address: address.address,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      isDefault: address.isDefault || false
    })
    setShowEditAddressForm(true)
  }

  // Fix: Added cancel edit handler
  const handleCancelEdit = () => {
    setShowEditAddressForm(false)
    setEditingAddress(null)
    setAddressForm({
      address: '',
      city: '',
      state: '',
      pincode: '',
      isDefault: false
    })
  }

  const handleDeleteAddress = (addressId) => {
    if (window.confirm('Are you sure you want to delete this address?')) {
      deleteAddressMutation.mutate(addressId)
    }
  }

  const userData = profileData?.data?.user || user
  const addresses = addressesData?.data?.addresses || []

  if (profileLoading) {
    return (
      <div className="profile-page">
        <div className="container">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  return (
    <div className="profile-page">
      <div className="container">
        {/* Page Header */}
        <div className="profile-header">
          <div className="profile-header-content">
            <div className="profile-avatar">
              <div className="avatar-placeholder">
                {userData?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            </div>
            <div className="profile-info">
              <h1>My Profile</h1>
              <p>Manage your account information and preferences</p>
            </div>
          </div>
        </div>

        {/* Profile Content */}
        <div className="profile-content">
          {/* Sidebar Navigation */}
          <div className="profile-sidebar">
            <nav className="profile-nav">
              <button
                className={`nav-item ${activeTab === 'personal' ? 'active' : ''}`}
                onClick={() => setActiveTab('personal')}
              >
                👤 Personal Information
              </button>
              <button
                className={`nav-item ${activeTab === 'membership' ? 'active' : ''}`}
                onClick={() => setActiveTab('membership')}
              >
                💎 Membership & Rewards
              </button>
              <button
                className={`nav-item ${activeTab === 'addresses' ? 'active' : ''}`}
                onClick={() => setActiveTab('addresses')}
              >
                📍 Addresses
              </button>
              <button
                className={`nav-item ${activeTab === 'preferences' ? 'active' : ''}`}
                onClick={() => setActiveTab('preferences')}
              >
                ⚙️ Preferences
              </button>
              <button
                className={`nav-item ${activeTab === 'security' ? 'active' : ''}`}
                onClick={() => setActiveTab('security')}
              >
                🔒 Security
              </button>
            </nav>
          </div>

          {/* Main Content */}
          <div className="profile-main">
            {/* Membership Tab */}
            {activeTab === 'membership' && (
              <div className="profile-section">
                <div className="section-header">
                  <h2>Membership & Rewards</h2>
                  <p>Manage your membership tier, AggreCoins, and referrals</p>
                </div>
                <MembershipTab user={userData} />
              </div>
            )}

            {/* Personal Information Tab */}
            {activeTab === 'personal' && (
              <div className="profile-section">
                <div className="section-header">
                  <h2>Personal Information</h2>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="btn btn-outline"
                  >
                    {isEditing ? 'Cancel' : 'Edit Profile'}
                  </button>
                </div>

                <form onSubmit={handleProfileSubmit} className="profile-form">
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Full Name</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Email Address</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Phone Number</label>
                      <input
                        type="tel"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Customer Type</label>
                      <select
                        name="customerType"
                        value={formData.customerType}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        required
                      >
                        <option value="">Select Type</option>
                        <option value="house_owner">House Owner</option>
                        <option value="mason">Mason</option>
                        <option value="builder_contractor">Builder/Contractor</option>
                        <option value="others">Others</option>
                      </select>
                    </div>

                    <div className="form-group full-width">
                      <label>GST Number (Optional)</label>
                      <input
                        type="text"
                        name="gstNumber"
                        value={formData.gstNumber}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        placeholder="Enter GST number if applicable"
                      />
                    </div>
                  </div>

                  {isEditing && (
                    <div className="form-actions">
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={updateProfileMutation.isLoading}
                      >
                        {updateProfileMutation.isLoading ? (
                          <>
                            <span className="spinner-small"></span>
                            Saving...
                          </>
                        ) : (
                          'Save Changes'
                        )}
                      </button>
                    </div>
                  )}
                </form>
              </div>
            )}

            {/* Addresses Tab */}
            {activeTab === 'addresses' && (
              <div className="profile-section">
                <div className="section-header">
                  <h2>Delivery Addresses</h2>
                  <button
                    onClick={() => setShowAddressForm(true)}
                    className="btn btn-primary"
                  >
                    + Add New Address
                  </button>
                </div>

                {addressesLoading ? (
                  <LoadingSpinner size="small" />
                ) : (
                  <div className="addresses-list">
                    {addresses.length === 0 ? (
                      <div className="empty-state">
                        <p>No addresses added yet</p>
                        <button
                          onClick={() => setShowAddressForm(true)}
                          className="btn btn-primary"
                        >
                          Add Your First Address
                        </button>
                      </div>
                    ) : (
                      addresses.map((address) => (
                        <div key={address._id} className="address-card">
                          <div className="address-info">
                            <div className="address-text">
                              <p className="address-line">{address.address}</p>
                              <p className="address-details">
                                {address.city}, {address.state} - {address.pincode}
                              </p>
                            </div>
                            {address.isDefault && (
                              <span className="default-badge">Default</span>
                            )}
                          </div>
                          <div className="address-actions">
                            {/* Fix: Added onClick handler for Edit button */}
                            <button 
                              className="btn btn-outline btn-sm"
                              onClick={() => handleEditAddress(address)}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteAddress(address._id)}
                              className="btn btn-outline btn-sm btn-danger"
                              disabled={deleteAddressMutation.isLoading}
                            >
                              {deleteAddressMutation.isLoading ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Add Address Form */}
                {showAddressForm && (
                  <div className="modal-overlay">
                    <div className="modal">
                      <div className="modal-header">
                        <h3>Add New Address</h3>
                        <button
                          onClick={() => setShowAddressForm(false)}
                          className="modal-close"
                        >
                          ✕
                        </button>
                      </div>
                      <form onSubmit={handleAddressSubmit} className="modal-form">
                        <div className="form-group">
                          <label>Address</label>
                          <textarea
                            name="address"
                            value={addressForm.address}
                            onChange={handleAddressChange}
                            rows="3"
                            required
                          />
                        </div>
                        <div className="form-row">
                          <div className="form-group">
                            <label>City</label>
                            <input
                              type="text"
                              name="city"
                              value={addressForm.city}
                              onChange={handleAddressChange}
                              required
                            />
                          </div>
                          <div className="form-group">
                            <label>State</label>
                            <input
                              type="text"
                              name="state"
                              value={addressForm.state}
                              onChange={handleAddressChange}
                              required
                            />
                          </div>
                          <div className="form-group">
                            <label>Pincode</label>
                            <input
                              type="text"
                              name="pincode"
                              value={addressForm.pincode}
                              onChange={handleAddressChange}
                              pattern="[0-9]{6}"
                              required
                            />
                          </div>
                        </div>
                        <div className="form-group">
                          <label className="checkbox-label">
                            <input
                              type="checkbox"
                              name="isDefault"
                              checked={addressForm.isDefault}
                              onChange={handleAddressChange}
                            />
                            Set as default address
                          </label>
                        </div>
                        <div className="modal-actions">
                          <button
                            type="button"
                            onClick={() => setShowAddressForm(false)}
                            className="btn btn-outline"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={addAddressMutation.isLoading}
                          >
                            {addAddressMutation.isLoading ? 'Adding...' : 'Add Address'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* Fix: Added Edit Address Form */}
                {showEditAddressForm && (
                  <div className="modal-overlay">
                    <div className="modal">
                      <div className="modal-header">
                        <h3>Edit Address</h3>
                        <button
                          onClick={handleCancelEdit}
                          className="modal-close"
                        >
                          ✕
                        </button>
                      </div>
                      <form onSubmit={handleEditAddressSubmit} className="modal-form">
                        <div className="form-group">
                          <label>Address</label>
                          <textarea
                            name="address"
                            value={addressForm.address}
                            onChange={handleAddressChange}
                            rows="3"
                            required
                          />
                        </div>
                        <div className="form-row">
                          <div className="form-group">
                            <label>City</label>
                            <input
                              type="text"
                              name="city"
                              value={addressForm.city}
                              onChange={handleAddressChange}
                              required
                            />
                          </div>
                          <div className="form-group">
                            <label>State</label>
                            <input
                              type="text"
                              name="state"
                              value={addressForm.state}
                              onChange={handleAddressChange}
                              required
                            />
                          </div>
                          <div className="form-group">
                            <label>Pincode</label>
                            <input
                              type="text"
                              name="pincode"
                              value={addressForm.pincode}
                              onChange={handleAddressChange}
                              pattern="[0-9]{6}"
                              required
                            />
                          </div>
                        </div>
                        <div className="form-group">
                          <label className="checkbox-label">
                            <input
                              type="checkbox"
                              name="isDefault"
                              checked={addressForm.isDefault}
                              onChange={handleAddressChange}
                            />
                            Set as default address
                          </label>
                        </div>
                        <div className="modal-actions">
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="btn btn-outline"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={updateAddressMutation.isLoading}
                          >
                            {updateAddressMutation.isLoading ? 'Updating...' : 'Update Address'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div className="profile-section">
                <div className="section-header">
                  <h2>Preferences</h2>
                </div>
                <div className="preferences-content">
                  <div className="preference-item">
                    <div>
                      <h4>Email Notifications</h4>
                      <p>Receive updates about orders, promotions, and news</p>
                    </div>
                    <label className="toggle">
                      <input type="checkbox" defaultChecked />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                  <div className="preference-item">
                    <div>
                      <h4>SMS Notifications</h4>
                      <p>Get order updates and delivery notifications via SMS</p>
                    </div>
                    <label className="toggle">
                      <input type="checkbox" defaultChecked />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                  <div className="preference-item">
                    <div>
                      <h4>Promotional Offers</h4>
                      <p>Receive information about special deals and discounts</p>
                    </div>
                    <label className="toggle">
                      <input type="checkbox" defaultChecked />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="profile-section">
                <div className="section-header">
                  <h2>Security Settings</h2>
                </div>
                <div className="security-content">
                  <div className="security-item">
                    <div>
                      <h4>Change Password</h4>
                      <p>Update your account password</p>
                    </div>
                    <button className="btn btn-outline">Change Password</button>
                  </div>
                  <div className="security-item">
                    <div>
                      <h4>Two-Factor Authentication</h4>
                      <p>Add an extra layer of security to your account</p>
                    </div>
                    <button className="btn btn-outline">Enable 2FA</button>
                  </div>
                  <div className="security-item">
                    <div>
                      <h4>Login History</h4>
                      <p>View recent login activity</p>
                    </div>
                    <button className="btn btn-outline">View History</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage