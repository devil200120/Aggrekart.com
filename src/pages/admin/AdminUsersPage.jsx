// Replace the ENTIRE file content with this (remove the comment at the top):

import React, { useState, useEffect } from 'react'
import UserManagement from '../../components/admin/UserManagement'
import { adminAPI } from '../../services/api'
import './AdminUsersPage.css'

const AdminUsersPage = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  })
  const [filters, setFilters] = useState({
    role: 'all',
    status: 'all',
    search: ''
  })

  const fetchUsers = async (page = 1, newFilters = filters) => {
    try {
      setLoading(true)
      setError(null)
      
      const params = {
        page: page.toString(),
        limit: '10',
        ...newFilters
      }

      // Remove empty string values
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === 'all') {
          delete params[key]
        }
      })

      const response = await adminAPI.getUsers(params)
      
      if (response.success) {
        setUsers(response.data.users)
        setPagination(response.data.pagination)
      } else {
        setError('Failed to fetch users')
      }
    } catch (err) {
      console.error('Error fetching users:', err)
      setError(err.response?.data?.message || 'Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  // Handle user actions (edit, suspend, activate)
  const handleUserAction = async (userId, action, data = {}) => {
    try {
      setActionLoading(true)
      let response
      
      console.log(`Performing ${action} on user:`, userId)

      switch (action) {
        case 'edit': {
          // Create a simple edit modal
          const newName = prompt('Enter new name:', users.find(u => u._id === userId)?.name || '')
          if (newName && newName.trim()) {
            response = await adminAPI.updateUser(userId, { name: newName.trim() })
          } else {
            setActionLoading(false)
            return
          }
          break
        }

        case 'suspend': {
          const reason = prompt('Enter suspension reason (optional):')
          if (window.confirm('Are you sure you want to suspend this user?')) {
            response = await adminAPI.suspendUser(userId, reason || 'Suspended by admin')
            console.log('Suspend response:', response)
          } else {
            setActionLoading(false)
            return
          }
          break
        }

        case 'activate': {
          if (window.confirm('Are you sure you want to activate this user?')) {
            response = await adminAPI.activateUser(userId)
            console.log('Activate response:', response)
          } else {
            setActionLoading(false)
            return
          }
          break
        }

        default:
          throw new Error('Invalid action')
      }

      if (response && response.success) {
        // Show success message
        alert(response.message || `User ${action}ed successfully!`)
        
        // Update the specific user in the state immediately
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user._id === userId 
              ? { ...user, ...response.data.user }
              : user
          )
        )
        
        // Also refresh the entire list to be sure
        setTimeout(() => {
          fetchUsers(pagination.currentPage)
        }, 500)
        
      } else {
        throw new Error(response?.message || 'Action failed')
      }

    } catch (error) {
      console.error(`Error performing ${action}:`, error)
      alert(error.response?.data?.message || error.message || `Failed to ${action} user`)
    } finally {
      setActionLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters)
    fetchUsers(1, newFilters)
  }

  const handlePageChange = (page) => {
    fetchUsers(page)
  }

  if (loading) {
    return (
      <div className="admin-users-page">
        <div className="admin-page-container">
          <div className="admin-page-header">
            <h1>User Management</h1>
            <p>Manage all registered users, view profiles, and handle user-related activities</p>
          </div>
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading users...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="admin-users-page">
        <div className="admin-page-container">
          <div className="admin-page-header">
            <h1>User Management</h1>
            <p>Manage all registered users, view profiles, and handle user-related activities</p>
          </div>
          <div className="error-container">
            <div className="error-message">
              <h3>Error Loading Users</h3>
              <p>{error}</p>
              <button onClick={() => fetchUsers()} className="retry-button">
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-users-page">
      <div className="admin-page-container">
        <div className="admin-page-header">
          <h1>User Management</h1>
          <p>Manage all registered users, view profiles, and handle user-related activities</p>
        </div>
        
        <div className="admin-page-content">
          <UserManagement 
            users={users}
            pagination={pagination}
            filters={filters}
            loading={actionLoading}
            onFilterChange={handleFilterChange}
            onPageChange={handlePageChange}
            onRefresh={() => fetchUsers(pagination.currentPage)}
            onUpdateUser={handleUserAction}
          />
        </div>
      </div>
    </div>
  )
}

export default AdminUsersPage