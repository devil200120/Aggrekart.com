import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { adminAPI } from '../../services/api'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import toast from 'react-hot-toast'
import './AdminSupplierDetailPage.css'

const AdminSupplierDetailPage = () => {
  const { supplierId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showActionModal, setShowActionModal] = useState(false)
  const [actionType, setActionType] = useState('')
  const [actionReason, setActionReason] = useState('')

  // Fetch supplier details
  const { data: response, isLoading, error } = useQuery(
    ['admin-supplier-detail', supplierId],
    () => adminAPI.getSupplier(supplierId),
    {
      enabled: !!supplierId,
      retry: 2,
      onError: (error) => {
        console.error('Failed to fetch supplier details:', error)
        toast.error('Failed to load supplier details')
      }
    }
  )

  const supplier = response?.data?.supplier

  // Supplier actions
  const actionMutation = useMutation(
    ({ action, data }) => {
      switch (action) {
        case 'approve':
          return adminAPI.approveSupplier(supplierId, data)
        case 'reject':
          return adminAPI.rejectSupplier(supplierId, data)
        case 'suspend':
          return adminAPI.suspendSupplier(supplierId, { action: 'suspend', ...data })
        case 'unsuspend':
          return adminAPI.suspendSupplier(supplierId, { action: 'unsuspend', ...data })
        default:
          throw new Error('Unknown action')
      }
    },
    {
      onSuccess: () => {
        toast.success('Action completed successfully!')
        queryClient.invalidateQueries(['admin-supplier-detail', supplierId])
        setShowActionModal(false)
        setActionReason('')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Action failed')
      }
    }
  )

  const handleAction = (action) => {
    setActionType(action)
    setShowActionModal(true)
  }

  const executeAction = () => {
    if (!actionReason.trim() && (actionType === 'reject' || actionType === 'suspend')) {
      toast.error('Reason is required')
      return
    }

    actionMutation.mutate({
      action: actionType,
      data: { reason: actionReason.trim() }
    })
  }

  if (isLoading) {
    return (
      <div className="admin-supplier-detail-page">
        <div className="loading-container">
          <LoadingSpinner />
          <p>Loading supplier details...</p>
        </div>
      </div>
    )
  }

  if (error || !supplier) {
    return (
      <div className="admin-supplier-detail-page">
        <div className="error-container">
          <h2>Supplier Not Found</h2>
          <p>The supplier you're looking for could not be found.</p>
          <button onClick={() => navigate('/admin/suppliers')} className="btn btn-primary">
            Back to Suppliers
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-supplier-detail-page">
      <div className="page-header-admin">
        <button onClick={() => navigate('/admin/suppliers')} className="back-button">
          ← Back to Suppliers
        </button>
        <h1>Supplier Details</h1>
      </div>

      <div className="supplier-detail-container">
        {/* Basic Information */}
        <div className="detail-section">
          <h3>Company Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <label>Supplier ID:</label>
              <span>{supplier.supplierId}</span>
            </div>
            <div className="info-item">
              <label>Company Name:</label>
              <span>{supplier.companyName}</span>
            </div>
            <div className="info-item">
              <label>Trade Owner:</label>
              <span>{supplier.tradeOwnerName}</span>
            </div>
            <div className="info-item">
              <label>Contact Person:</label>
              <span>{supplier.contactPersonName}</span>
            </div>
            <div className="info-item">
              <label>Email:</label>
              <span>{supplier.user?.email || supplier.email}</span>
            </div>
            <div className="info-item">
              <label>Phone:</label>
              <span>{supplier.user?.phoneNumber || supplier.contactPersonNumber}</span>
            </div>
            <div className="info-item">
              <label>GST Number:</label>
              <span>{supplier.gstNumber}</span>
            </div>
            <div className="info-item">
              <label>PAN Number:</label>
              <span>{supplier.panNumber}</span>
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className="detail-section">
          <h3>Address Information</h3>
          <div className="info-grid">
            <div className="info-item full-width">
              <label>Company Address:</label>
              <span>{supplier.companyAddress}</span>
            </div>
            <div className="info-item">
              <label>City:</label>
              <span>{supplier.city}</span>
            </div>
            <div className="info-item">
              <label>State:</label>
              <span>{supplier.state}</span>
            </div>
            <div className="info-item">
              <label>Pincode:</label>
              <span>{supplier.pincode}</span>
            </div>
          </div>
        </div>

        {/* Status and Actions */}
        <div className="detail-section">
          <h3>Status & Actions</h3>
          <div className="status-info">
            <div className="status-item">
              <label>Approval Status:</label>
              <span className={`status ${supplier.isApproved ? 'approved' : supplier.rejectedAt ? 'rejected' : 'pending'}`}>
                {supplier.isApproved ? 'Approved' : supplier.rejectedAt ? 'Rejected' : 'Pending'}
              </span>
            </div>
            <div className="status-item">
              <label>Account Status:</label>
              <span className={`status ${supplier.isActive ? 'active' : 'suspended'}`}>
                {supplier.isActive ? 'Active' : 'Suspended'}
              </span>
            </div>
            <div className="status-item">
              <label>Registration Date:</label>
              <span>{new Date(supplier.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="action-buttons-admin">
            {!supplier.isApproved && !supplier.rejectedAt && (
              <>
                <button 
                  onClick={() => handleAction('approve')} 
                  className="button btn-success"
                  disabled={actionMutation.isLoading}
                >
                  Approve Supplier
                </button>
                <button 
                  onClick={() => handleAction('reject')} 
                  className="button btn-danger"
                  disabled={actionMutation.isLoading}
                >
                  Reject Supplier
                </button>
              </>
            )}
            {supplier.isApproved && (
              <button 
                onClick={() => handleAction(supplier.isActive ? 'suspend' : 'unsuspend')} 
                className={`button ${supplier.isActive ? 'btn-warning' : 'btn-success'}`}
                disabled={actionMutation.isLoading}
              >
                {supplier.isActive ? 'Suspend Supplier' : 'Unsuspend Supplier'}
              </button>
            )}
          </div>
        </div>

        {/* Statistics */}
        {supplier.stats && (
          <div className="detail-section">
            <h3>Statistics</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <label>Total Products:</label>
                <span>{supplier.productCount || 0}</span>
              </div>
              <div className="stat-item">
                <label>Total Orders:</label>
                <span>{supplier.stats.totalOrders || 0}</span>
              </div>
              <div className="stat-item">
                <label>Total Revenue:</label>
                <span>₹{(supplier.stats.totalRevenue || 0).toLocaleString()}</span>
              </div>
              <div className="stat-item">
                <label>Completed Orders:</label>
                <span>{supplier.stats.completedOrders || 0}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Modal */}
      {showActionModal && (
        <div className="modal-overlay" onClick={() => setShowActionModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>
              {actionType === 'approve' && 'Approve Supplier'}
              {actionType === 'reject' && 'Reject Supplier'}
              {actionType === 'suspend' && 'Suspend Supplier'}
              {actionType === 'unsuspend' && 'Unsuspend Supplier'}
            </h3>
            
            {(actionType === 'reject' || actionType === 'suspend') && (
              <div className="form-group">
                <label>Reason *</label>
                <textarea
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="Please provide a reason..."
                  required
                />
              </div>
            )}

            <div className="modal-actions">
              <button onClick={() => setShowActionModal(false)} className=" btn-secondary">
                Cancel
              </button>
              <button 
                onClick={executeAction} 
                className="button btn-primary"
                disabled={actionMutation.isLoading}
              >
                {actionMutation.isLoading ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminSupplierDetailPage