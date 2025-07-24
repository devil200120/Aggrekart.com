/* 
FILE: c:\Users\KIIT0001\Desktop\builder_website using mern\front-end\app\src\pages\admin\AdminDashboardPage.jsx
LINES: 1-200
PURPOSE: Main admin dashboard with overview statistics and quick access
*/

import React, { useState } from 'react'
import { useQuery } from 'react-query'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { adminAPI } from '../../services/api'
import AdminStats from '../../components/admin/AdminStats'
import UserManagement from '../../components/admin/UserManagement'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { 
  Users, 
  Store, 
  ShoppingBag, 
  Settings, 
  FileText, 
  AlertTriangle,
  TrendingUp,
  Activity
} from 'lucide-react'
import toast from 'react-hot-toast'
import './AdminDashboardPage.css'

const AdminDashboardPage = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')

  // Fetch admin dashboard data
  const { data: dashboardStats, isLoading: statsLoading } = useQuery(
    'admin-dashboard-stats',
    adminAPI.getDashboardStats,
    {
      enabled: !!user && user.role === 'admin',
      refetchInterval: 30000, // Refresh every 30 seconds
    }
  )

  // Fetch recent users
  const { data: recentUsers, isLoading: usersLoading } = useQuery(
    'admin-recent-users',
    () => adminAPI.getUsers({ limit: 10, sort: 'createdAt', order: 'desc' }),
    {
      enabled: !!user && user.role === 'admin',
    }
  )

  // Fetch pending approvals
  const { data: pendingApprovals, isLoading: approvalsLoading } = useQuery(
    'admin-pending-approvals',
    adminAPI.getPendingApprovals,
    {
      enabled: !!user && user.role === 'admin',
      refetchInterval: 60000, // Refresh every minute
    }
  )

  const handleUserAction = async (userId, action) => {
    try {
      await adminAPI.updateUser(userId, { action })
      toast.success(`User ${action} successfully`)
      // Refetch data
    } catch (error) {
      toast.error(`Failed to ${action} user`)
    }
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="admin-dashboard">
        <div className="access-denied">
          <AlertTriangle size={48} />
          <h2>Access Denied</h2>
          <p>You don't have permission to access the admin dashboard.</p>
          <Link to="/" className="btn btn-primary">Go Home</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-dashboard">
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Admin Dashboard</h1>
          <p>Welcome back, {user.name}! Here's what's happening on Aggrekart.</p>
        </div>
        <div className="header-actions">
          <Link to="/admin/settings" className="btn btn-outline">
            <Settings size={16} />
            Settings
          </Link>
          <Link to="/admin/reports" className="btn btn-primary">
            <FileText size={16} />
            Reports
          </Link>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="dashboard-tabs">
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <Activity size={16} />
          Overview
        </button>
        <button 
          className={`tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <Users size={16} />
          Users
        </button>
        <button 
          className={`tab ${activeTab === 'approvals' ? 'active' : ''}`}
          onClick={() => setActiveTab('approvals')}
        >
          <AlertTriangle size={16} />
          Approvals
          {pendingApprovals?.length > 0 && (
            <span className="tab-badge">{pendingApprovals.length}</span>
          )}
        </button>
      </div>

      {/* Tab Content */}
      <div className="dashboard-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            {/* Statistics Cards */}
            <AdminStats stats={dashboardStats} loading={statsLoading} />

            {/* Quick Actions Grid */}
            <div className="quick-actions-grid">
              <Link to="/admin/users" className="quick-action-card">
                <div className="action-icon users">
                  <Users size={24} />
                </div>
                <div className="action-content">
                  <h3>Manage Users</h3>
                  <p>View and manage all platform users</p>
                  <span className="action-count">
                    {dashboardStats?.totalUsers || 0} total users
                  </span>
                </div>
              </Link>

              <Link to="/admin/suppliers" className="quick-action-card">
                <div className="action-icon suppliers">
                  <Store size={24} />
                </div>
                <div className="action-content">
                  <h3>Supplier Management</h3>
                  <p>Approve and manage suppliers</p>
                  <span className="action-count">
                    {dashboardStats?.pendingSuppliers || 0} pending approval
                  </span>
                </div>
              </Link>

              <Link to="/admin/orders" className="quick-action-card">
                <div className="action-icon orders">
                  <ShoppingBag size={24} />
                </div>
                <div className="action-content">
                  <h3>Order Management</h3>
                  <p>Monitor all platform orders</p>
                  <span className="action-count">
                    {dashboardStats?.totalOrders || 0} total orders
                  </span>
                </div>
              </Link>

              <Link to="/admin/products" className="quick-action-card">
                <div className="action-icon products">
                  <TrendingUp size={24} />
                </div>
                <div className="action-content">
                  <h3>Product Moderation</h3>
                  <p>Review and approve products</p>
                  <span className="action-count">
                    {dashboardStats?.pendingProducts || 0} pending review
                  </span>
                </div>
              </Link>
            </div>

            {/* Recent Activity Section */}
            <div className="recent-activity">
              <div className="section-header">
                <h3>Recent Activity</h3>
                <Link to="/admin/activity" className="view-all-link">View All</Link>
              </div>
              
              <div className="activity-list">
                {dashboardStats?.recentActivity?.map((activity, index) => (
                  <div key={index} className="activity-item">
                    <div className={`activity-icon ${activity.type}`}>
                      {activity.type === 'user' && <Users size={16} />}
                      {activity.type === 'order' && <ShoppingBag size={16} />}
                      {activity.type === 'supplier' && <Store size={16} />}
                    </div>
                    <div className="activity-content">
                      <div className="activity-text">{activity.message}</div>
                      <div className="activity-time">{activity.timestamp}</div>
                    </div>
                  </div>
                )) || (
                  <div className="no-activity">
                    <p>No recent activity to display</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="users-tab">
            <UserManagement 
              users={recentUsers || []}
              loading={usersLoading}
              onUpdateUser={handleUserAction}
              onDeleteUser={handleUserAction}
            />
          </div>
        )}

        {activeTab === 'approvals' && (
          <div className="approvals-tab">
            <div className="approvals-section">
              <h3>Pending Approvals</h3>
              {approvalsLoading ? (
                <LoadingSpinner />
              ) : (
                <div className="approvals-list">
                  {pendingApprovals?.length > 0 ? (
                    pendingApprovals.map((approval) => (
                      <div key={approval._id} className="approval-card">
                        <div className="approval-info">
                          <h4>{approval.title}</h4>
                          <p>{approval.description}</p>
                          <span className="approval-type">{approval.type}</span>
                        </div>
                        <div className="approval-actions">
                          <button className="btn btn-success btn-sm">
                            Approve
                          </button>
                          <button className="btn btn-danger btn-sm">
                            Reject
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-approvals">
                      <AlertTriangle size={48} />
                      <h4>No Pending Approvals</h4>
                      <p>All items have been reviewed.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminDashboardPage