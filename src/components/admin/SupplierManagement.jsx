import React, { useState } from 'react'
import './SupplierManagement.css'

const SupplierManagement = ({ 
  suppliers = [], 
  pagination = {}, 
  filters = {}, 
  onFilterChange, 
  onPageChange, 
  onSupplierAction, 
  onRefresh 
}) => {
  const [selectedSupplier, setSelectedSupplier] = useState(null)
  const [actionModalOpen, setActionModalOpen] = useState(false)
  const [actionType, setActionType] = useState('')
  const [actionData, setActionData] = useState({ reason: '', commissionRate: '' })

  const handleFilterChange = (key, value) => {
    onFilterChange({ ...filters, [key]: value })
  }

  const openActionModal = (supplier, action) => {
    setSelectedSupplier(supplier)
    setActionType(action)
    setActionModalOpen(true)
    setActionData({ reason: '', commissionRate: supplier.commissionRate || 5 })
  }

  const handleAction = async () => {
    if (!selectedSupplier) return

    const data = {}
    if (actionType === 'approve' && actionData.commissionRate) {
      data.commissionRate = parseFloat(actionData.commissionRate)
    }
    if (actionData.reason) {
      data.reason = actionData.reason
    }

    await onSupplierAction(actionType, selectedSupplier._id, data)
    setActionModalOpen(false)
    setSelectedSupplier(null)
    setActionData({ reason: '', commissionRate: '' })
  }

  // Fixed status determination logic
  const getStatusBadge = (supplier) => {
    console.log('Supplier status check:', {
      supplierId: supplier.supplierId,
      isApproved: supplier.isApproved,
      isActive: supplier.isActive,
      rejectedAt: supplier.rejectedAt,
      suspendedAt: supplier.suspendedAt
    })

    // Check rejection first
    if (supplier.rejectedAt) {
      return <span className="status-badge-admin rejected">Rejected</span>
    }
    
    // Check if not approved yet
    if (!supplier.isApproved) {
      return <span className="status-badge-admin pending">Pending</span>
    }
    
    // Check if suspended (approved but not active)
    if (supplier.isApproved && !supplier.isActive) {
      return <span className="status-badge suspended">Suspended</span>
    }
    
    // Active and approved
    if (supplier.isApproved && supplier.isActive) {
      return <span className="status-badge-admin approved">Active</span>
    }

    // Default fallback
    return <span className="status-badge-admin pending">Unknown</span>
  }

  return (
    <div className="supplier-management">
      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Status:</label>
          <select 
            value={filters.status || 'all'} 
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="all">All Suppliers</option>
            <option value="approved">Active</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        <div className="filter-group">
          <label>State:</label>
          <input
            type="text"
            placeholder="Filter by state"
            value={filters.state || ''}
            onChange={(e) => handleFilterChange('state', e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>Category:</label>
          <select 
            value={filters.category || ''} 
            onChange={(e) => handleFilterChange('category', e.target.value)}
          >
            <option value="">All Categories</option>
            <option value="aggregate">Aggregate</option>
            <option value="sand">Sand</option>
            <option value="tmt_steel">TMT Steel</option>
            <option value="bricks_blocks">Bricks & Blocks</option>
            <option value="cement">Cement</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Search:</label>
          <input
            type="text"
            placeholder="Search suppliers..."
            value={filters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
        </div>

        <button onClick={onRefresh} className="refresh-btn">
          Refresh
        </button>
      </div>

      {/* Suppliers Table */}
      <div className="table-container">
        <table className="suppliers-table">
          <thead>
            <tr>
              <th>Supplier ID</th>
              <th>Company Name</th>
              <th>Contact Person</th>
              <th>Phone</th>
              <th>State</th>
              <th>Status</th>
              <th>Products</th>
              <th>Orders</th>
              <th>Revenue</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.length === 0 ? (
              <tr>
                <td colSpan="10" className="no-data">No suppliers found</td>
              </tr>
            ) : (
              suppliers.map((supplier) => (
                <tr key={supplier._id}>
                  <td>{supplier.supplierId}</td>
                  <td>
                    <div className="company-info">
                      <strong>{supplier.companyName}</strong>
                      <small>{supplier.user?.email}</small>
                    </div>
                  </td>
                  <td>{supplier.contactPersonName || supplier.tradeOwnerName}</td>
                  <td>{supplier.user?.phoneNumber || supplier.contactPersonNumber}</td>
                  <td>{supplier.state}</td>
                  <td>{getStatusBadge(supplier)}</td>
                  <td>{supplier.productCount || 0}</td>
                  <td>{supplier.stats?.totalOrders || 0}</td>
                  <td>₹{(supplier.stats?.totalRevenue || 0).toLocaleString()}</td>
                  <td>
                    <div className="action-buttons">
                      {!supplier.isApproved && !supplier.rejectedAt && (
                        <>
                          <button 
                            onClick={() => openActionModal(supplier, 'approve')}
                            className="btn-approve"
                          >
                            Approve
                          </button>
                          <button 
                            onClick={() => openActionModal(supplier, 'reject')}
                            className="btn-reject"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {supplier.isApproved && !supplier.rejectedAt && (
                        <button 
                          onClick={() => openActionModal(supplier, supplier.isActive ? 'suspend' : 'unsuspend')}
                          className={supplier.isActive ? "btn-suspend" : "btn-activate"}
                        >
                          {supplier.isActive ? 'Suspend' : 'Activate'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="pagination">
          <button 
            onClick={() => onPageChange(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 1}
          >
            Previous
          </button>
          
          <span>
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          
          <button 
            onClick={() => onPageChange(pagination.currentPage + 1)}
            disabled={pagination.currentPage === pagination.totalPages}
          >
            Next
          </button>
        </div>
      )}

      {/* Action Modal */}
      {actionModalOpen && (
        <div className="modal-overlay" onClick={() => setActionModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>
              {actionType === 'approve' && 'Approve Supplier'}
              {actionType === 'reject' && 'Reject Supplier'}
              {actionType === 'suspend' && 'Suspend Supplier'}
              {actionType === 'unsuspend' && 'Activate Supplier'}
            </h3>
            
            <div className="modal-body">
              <p><strong>Company:</strong> {selectedSupplier?.companyName}</p>
              <p><strong>Supplier ID:</strong> {selectedSupplier?.supplierId}</p>
              <p><strong>Current Status:</strong> {selectedSupplier && getStatusBadge(selectedSupplier)}</p>
              
              {actionType === 'approve' && (
                <div className="form-group">
                  <label>Commission Rate (%):</label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    step="0.1"
                    value={actionData.commissionRate}
                    onChange={(e) => setActionData({...actionData, commissionRate: e.target.value})}
                  />
                </div>
              )}
              
              {(actionType === 'reject' || actionType === 'suspend') && (
                <div className="form-group">
                  <label>Reason * (minimum 5 characters):</label>
                  <textarea
                    value={actionData.reason}
                    onChange={(e) => setActionData({...actionData, reason: e.target.value})}
                    placeholder="Please provide a reason (minimum 5 characters)..."
                    required
                    minLength={5}
                  />
                  {actionData.reason.length > 0 && actionData.reason.length < 5 && (
                    <small style={{color: 'red'}}>Reason must be at least 5 characters</small>
                  )}
                </div>
              )}

              {actionType === 'unsuspend' && (
                <div className="form-group">
                  <label>Activation Reason (optional):</label>
                  <textarea
                    value={actionData.reason}
                    onChange={(e) => setActionData({...actionData, reason: e.target.value})}
                    placeholder="Optional reason for reactivation..."
                  />
                </div>
              )}
            </div>
            
            <div className="modal-actions">
              <button onClick={() => setActionModalOpen(false)} className="btn-cancel">
                Cancel
              </button>
              <button 
                onClick={handleAction} 
                className={`btn-confirm ${actionType}`}
                disabled={
                  (actionType === 'reject' || actionType === 'suspend') && 
                  (!actionData.reason.trim() || actionData.reason.trim().length < 5)
                }
              >
                {actionType === 'approve' && 'Approve Supplier'}
                {actionType === 'reject' && 'Reject Supplier'}
                {actionType === 'suspend' && 'Suspend Supplier'}
                {actionType === 'unsuspend' && 'Activate Supplier'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SupplierManagement