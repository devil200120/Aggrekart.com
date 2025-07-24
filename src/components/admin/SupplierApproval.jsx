/* 
FILE: c:\Users\KIIT0001\Desktop\builder_website using mern\front-end\app\src\components\admin\SupplierApproval.jsx
LINES: 1-200
PURPOSE: Component for reviewing and approving/rejecting supplier applications
*/

import React, { useState } from 'react'
import { useMutation, useQueryClient } from 'react-query'
import { 
  CheckCircle, 
  XCircle, 
  Eye, 
  FileText, 
  MapPin, 
  Phone, 
  Mail,
  Calendar,
  Building,
  Star,
  AlertTriangle
} from 'lucide-react'
import { adminAPI } from '../../services/api'
import toast from 'react-hot-toast'
import './SupplierApproval.css'

const SupplierApproval = ({ suppliers = [], loading }) => {
  const [selectedSupplier, setSelectedSupplier] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [actionType, setActionType] = useState(null)
  const [actionReason, setActionReason] = useState('')
  const queryClient = useQueryClient()

  // Approve supplier mutation
  const approveSupplierMutation = useMutation(
    ({ supplierId, data }) => adminAPI.approveSupplier(supplierId, data),
    {
      onSuccess: () => {
        toast.success('Supplier approved successfully!')
        queryClient.invalidateQueries('admin-pending-suppliers')
        setShowModal(false)
        setSelectedSupplier(null)
        setActionReason('')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to approve supplier')
      }
    }
  )

  // Reject supplier mutation
  const rejectSupplierMutation = useMutation(
    ({ supplierId, data }) => adminAPI.rejectSupplier(supplierId, data),
    {
      onSuccess: () => {
        toast.success('Supplier rejected successfully!')
        queryClient.invalidateQueries('admin-pending-suppliers')
        setShowModal(false)
        setSelectedSupplier(null)
        setActionReason('')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to reject supplier')
      }
    }
  )

  const handleAction = (supplier, action) => {
    setSelectedSupplier(supplier)
    setActionType(action)
    setShowModal(true)
  }

  const confirmAction = () => {
    if (!selectedSupplier || !actionType) return

    const data = {
      reason: actionReason,
      reviewedBy: 'admin', // This would come from auth context
      reviewedAt: new Date().toISOString()
    }

    if (actionType === 'approve') {
      approveSupplierMutation.mutate({ supplierId: selectedSupplier._id, data })
    } else if (actionType === 'reject') {
      rejectSupplierMutation.mutate({ supplierId: selectedSupplier._id, data })
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getStatusBadge = (status) => {
    const badges = {
      pending: { label: 'Pending Review', className: 'status-pending' },
      approved: { label: 'Approved', className: 'status-approved' },
      rejected: { label: 'Rejected', className: 'status-rejected' },
      suspended: { label: 'Suspended', className: 'status-suspended' }
    }
    
    const badge = badges[status] || badges.pending
    return <span className={`status-badge ${badge.className}`}>{badge.label}</span>
  }

  if (loading) {
    return (
      <div className="supplier-approval">
        <div className="supplier-approval-header">
          <h3>Supplier Applications</h3>
        </div>
        <div className="loading-suppliers">
          <div className="loading-spinner"></div>
          <p>Loading supplier applications...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="supplier-approval">
      <div className="supplier-approval-header">
        <h3>Supplier Applications</h3>
        <div className="approval-stats">
          <span className="stat-item">
            <span className="stat-value">{suppliers.filter(s => s.status === 'pending').length}</span>
            <span className="stat-label">Pending</span>
          </span>
          <span className="stat-item">
            <span className="stat-value">{suppliers.filter(s => s.status === 'approved').length}</span>
            <span className="stat-label">Approved</span>
          </span>
        </div>
      </div>

      <div className="suppliers-grid">
        {suppliers.map((supplier) => (
          <div key={supplier._id} className="supplier-card">
            <div className="supplier-card-header">
              <div className="supplier-info">
                <div className="supplier-avatar">
                  {supplier.logo ? (
                    <img src={supplier.logo} alt={supplier.businessName} />
                  ) : (
                    <div className="avatar-placeholder">
                      {supplier.businessName?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="supplier-details">
                  <h4>{supplier.businessName}</h4>
                  <p>{supplier.contactPerson}</p>
                  {getStatusBadge(supplier.status)}
                </div>
              </div>
              <div className="supplier-actions">
                <button 
                  className="btn btn-outline btn-sm"
                  onClick={() => setSelectedSupplier(supplier)}
                >
                  <Eye size={14} />
                  View
                </button>
              </div>
            </div>

            <div className="supplier-card-body">
              <div className="supplier-meta">
                <div className="meta-item">
                  <Building size={16} />
                  <span>{supplier.businessType}</span>
                </div>
                <div className="meta-item">
                  <MapPin size={16} />
                  <span>{supplier.city}, {supplier.state}</span>
                </div>
                <div className="meta-item">
                  <Calendar size={16} />
                  <span>Applied {formatDate(supplier.createdAt)}</span>
                </div>
              </div>

              <div className="supplier-contact">
                <div className="contact-item">
                  <Mail size={14} />
                  <span>{supplier.email}</span>
                </div>
                <div className="contact-item">
                  <Phone size={14} />
                  <span>{supplier.phone}</span>
                </div>
              </div>

              <div className="supplier-description">
                <p>{supplier.description}</p>
              </div>

              {supplier.documents && supplier.documents.length > 0 && (
                <div className="supplier-documents">
                  <h5>Documents</h5>
                  <div className="documents-list">
                    {supplier.documents.map((doc, index) => (
                      <div key={index} className="document-item">
                        <FileText size={14} />
                        <span>{doc.name}</span>
                        <a href={doc.url} target="_blank" rel="noopener noreferrer">
                          View
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {supplier.status === 'pending' && (
              <div className="supplier-card-footer">
                <button 
                  className="btn btn-success btn-sm"
                  onClick={() => handleAction(supplier, 'approve')}
                >
                  <CheckCircle size={14} />
                  Approve
                </button>
                <button 
                  className="btn btn-danger btn-sm"
                  onClick={() => handleAction(supplier, 'reject')}
                >
                  <XCircle size={14} />
                  Reject
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {suppliers.length === 0 && (
        <div className="no-suppliers">
          <div className="no-suppliers-icon">🏪</div>
          <h4>No Supplier Applications</h4>
          <p>There are no supplier applications to review at this time.</p>
        </div>
      )}

      {/* Action Confirmation Modal */}
      {showModal && selectedSupplier && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>
                {actionType === 'approve' ? 'Approve' : 'Reject'} Supplier
              </h3>
              <button 
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="supplier-summary">
                <h4>{selectedSupplier.businessName}</h4>
                <p>Contact: {selectedSupplier.contactPerson}</p>
                <p>Email: {selectedSupplier.email}</p>
              </div>

              <div className="action-reason">
                <label htmlFor="reason">
                  {actionType === 'approve' ? 'Approval Notes' : 'Rejection Reason'} *
                </label>
                <textarea
                  id="reason"
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder={
                    actionType === 'approve' 
                      ? 'Add any notes for the approval...'
                      : 'Please provide a reason for rejection...'
                  }
                  rows={4}
                  required
                />
              </div>

              {actionType === 'reject' && (
                <div className="warning-note">
                  <AlertTriangle size={16} />
                  <span>
                    This action will notify the supplier and they will need to reapply.
                  </span>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button 
                className="btn btn-outline"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button 
                className={`btn ${actionType === 'approve' ? 'btn-success' : 'btn-danger'}`}
                onClick={confirmAction}
                disabled={!actionReason.trim() || approveSupplierMutation.isLoading || rejectSupplierMutation.isLoading}
              >
                {approveSupplierMutation.isLoading || rejectSupplierMutation.isLoading ? (
                  'Processing...'
                ) : (
                  actionType === 'approve' ? 'Approve Supplier' : 'Reject Supplier'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SupplierApproval