/* 
FILE: c:\Users\KIIT0001\Desktop\builder_website using mern\front-end\app\src\components\admin\UserManagement.jsx
LINES: 1-150
PURPOSE: User management table with search, filter, and actions
*/

import React, { useState, useMemo } from 'react'
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Ban, 
  CheckCircle, 
  Mail,
  Phone,
  Calendar,
  MapPin
} from 'lucide-react'
import './UserManagement.css'

const UserManagement = ({ users = [], loading, onUpdateUser, onDeleteUser }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterRole, setFilterRole] = useState('all')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState([])

  // Filtered and sorted users
  const filteredUsers = useMemo(() => {
    let filtered = users.filter(user => {
      const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.phone?.includes(searchTerm)
      
      const matchesStatus = filterStatus === 'all' || user.status === filterStatus
      const matchesRole = filterRole === 'all' || user.role === filterRole
      
      return matchesSearch && matchesStatus && matchesRole
    })

    // Sort users
    filtered.sort((a, b) => {
      let aValue = a[sortBy]
      let bValue = b[sortBy]
      
      if (sortBy === 'createdAt') {
        aValue = new Date(aValue)
        bValue = new Date(bValue)
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }, [users, searchTerm, filterStatus, filterRole, sortBy, sortOrder])

  const handleSelectUser = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(filteredUsers.map(user => user._id))
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      active: { label: 'Active', className: 'status-active' },
      inactive: { label: 'Inactive', className: 'status-inactive' },
      suspended: { label: 'Suspended', className: 'status-suspended' },
      pending: { label: 'Pending', className: 'status-pending' }
    }
    
    const badge = badges[status] || badges.pending
    return <span className={`status-badge ${badge.className}`}>{badge.label}</span>
  }

  const getRoleBadge = (role) => {
    const badges = {
      customer: { label: 'Customer', className: 'role-customer' },
      supplier: { label: 'Supplier', className: 'role-supplier' },
      admin: { label: 'Admin', className: 'role-admin' }
    }
    
    const badge = badges[role] || badges.customer
    return <span className={`role-badge ${badge.className}`}>{badge.label}</span>
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="user-management">
        <div className="user-management-header">
          <h3>User Management</h3>
        </div>
        <div className="loading-users">
          <div className="loading-spinner"></div>
          <p>Loading users...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="user-management">
      <div className="user-management-header">
        <h3>User Management</h3>
        <div className="user-actions">
          <button className="btn btn-primary">
            Add User
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="user-controls">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search users by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <button 
          className={`filter-toggle ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={20} />
          Filters
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="filter-panel">
          <div className="filter-group">
            <label>Status</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Role</label>
            <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
              <option value="all">All Roles</option>
              <option value="customer">Customer</option>
              <option value="supplier">Supplier</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Sort By</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="createdAt">Date Joined</option>
              <option value="name">Name</option>
              <option value="email">Email</option>
              <option value="lastLogin">Last Login</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Order</label>
            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                  onChange={handleSelectAll}
                />
              </th>
              <th>User</th>
              <th>Contact</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Last Login</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user._id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user._id)}
                    onChange={() => handleSelectUser(user._id)}
                  />
                </td>
                <td>
                  <div className="user-info">
                    <div className="user-avatar">
                      {user.profilePicture ? (
                        <img src={user.profilePicture} alt={user.name} />
                      ) : (
                        <div className="avatar-placeholder">
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="user-details">
                      <div className="user-name">{user.name}</div>
                      <div className="user-id">ID: {user._id}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="contact-info">
                    <div className="contact-item">
                      <Mail size={14} />
                      <span>{user.email}</span>
                    </div>
                    {user.phone && (
                      <div className="contact-item">
                        <Phone size={14} />
                        <span>{user.phone}</span>
                      </div>
                    )}
                  </div>
                </td>
                <td>{getRoleBadge(user.role)}</td>
                <td>{getStatusBadge(user.status)}</td>
                <td>
                  <div className="date-info">
                    <Calendar size={14} />
                    <span>{formatDate(user.createdAt)}</span>
                  </div>
                </td>
                <td>
                  <div className="date-info">
                    {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                  </div>
                </td>
                <td>
                  <div className="user-actions-dropdown">
                    <button className="action-trigger">
                      <MoreVertical size={16} />
                    </button>
                    <div className="action-menu">
                      <button onClick={() => onUpdateUser(user._id, 'edit')}>
                        <Edit size={14} />
                        Edit User
                      </button>
                      <button onClick={() => onUpdateUser(user._id, 'suspend')}>
                        <Ban size={14} />
                        Suspend
                      </button>
                      <button onClick={() => onUpdateUser(user._id, 'activate')}>
                        <CheckCircle size={14} />
                        Activate
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredUsers.length === 0 && (
        <div className="no-users">
          <div className="no-users-icon">👥</div>
          <h4>No users found</h4>
          <p>Try adjusting your search or filter criteria.</p>
        </div>
      )}
    </div>
  )
}

export default UserManagement