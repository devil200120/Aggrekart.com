import React, { useState, useEffect } from 'react'
import SupplierManagement from '../../components/admin/SupplierManagement'
import { adminAPI } from '../../services/api'
import './AdminSuppliersPage.css'

const AdminSuppliersPage = () => {
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  })
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    state: '',
    category: ''
  })

  // Replace the fetchSuppliers function with this corrected version:

  const fetchSuppliers = async (page = 1, newFilters = filters) => {
    try {
      setLoading(true)
      setError(null)
      
      // Create params object instead of query string
      const params = {
        page: page.toString(),
        limit: '10',
        ...newFilters
      }

      // Remove empty string values and 'all' values
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === 'all') {
          delete params[key]
        }
      })

      const response = await adminAPI.getSuppliers(params)
      
      if (response.success) {
        setSuppliers(response.data.suppliers)
        setPagination(response.data.pagination)
      } else {
        setError('Failed to fetch suppliers')
      }
    } catch (err) {
      console.error('Error fetching suppliers:', err)
      setError(err.response?.data?.message || 'Failed to fetch suppliers')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    fetchSuppliers()
  }, [])

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters)
    fetchSuppliers(1, newFilters)
  }

  const handlePageChange = (page) => {
    fetchSuppliers(page)
  }

  // ...existing code...
  const handleSupplierAction = async (action, supplierId, data = {}) => {
    try {
      let response
      switch (action) {
        case 'approve':
          response = await adminAPI.approveSupplier(supplierId, data)
          break
        case 'reject':
          response = await adminAPI.rejectSupplier(supplierId, data)
          break
        case 'suspend':
          response = await adminAPI.suspendSupplier(supplierId, { 
            action: 'suspend', 
            reason: data.reason 
          })
          break
        case 'unsuspend':
          response = await adminAPI.suspendSupplier(supplierId, { 
            action: 'unsuspend', 
            reason: data.reason || 'Supplier reactivated by admin' 
          })
          break
        default:
          return
      }

      if (response.success) {
        // Refresh the current page
        fetchSuppliers(pagination.currentPage)
      }
    } catch (err) {
      console.error(`Error performing ${action} on supplier:`, err)
      setError(err.response?.data?.message || `Failed to ${action} supplier`)
    }
  }
// ...existing code...

  if (loading) {
    return (
      <div className="admin-suppliers-page">
        <div className="admin-page-container">
          <div className="admin-page-header">
            <h1>Supplier Management</h1>
            <p>Manage supplier registrations, approvals, and business relationships</p>
          </div>
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading suppliers...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="admin-suppliers-page">
        <div className="admin-page-container">
          <div className="admin-page-header">
            <h1>Supplier Management</h1>
            <p>Manage supplier registrations, approvals, and business relationships</p>
          </div>
          <div className="error-container">
            <div className="error-message">
              <h3>Error Loading Suppliers</h3>
              <p>{error}</p>
              <button onClick={() => fetchSuppliers()} className="retry-button">
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-suppliers-page">
      <div className="admin-page-container">
        <div className="admin-page-header">
          <h1>Supplier Management</h1>
          <p>Manage supplier registrations, approvals, and business relationships</p>
        </div>
        
        <div className="admin-page-content">
          <SupplierManagement 
            suppliers={suppliers}
            pagination={pagination}
            filters={filters}
            onFilterChange={handleFilterChange}
            onPageChange={handlePageChange}
            onSupplierAction={handleSupplierAction}
            onRefresh={() => fetchSuppliers(pagination.currentPage)}
          />
        </div>
      </div>
    </div>
  )
}

export default AdminSuppliersPage