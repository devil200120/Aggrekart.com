/* 
FILE: c:\Users\KIIT0001\Desktop\builder_website using mern\front-end\app\src\pages\admin\AdminDashboardPage.jsx
LINES: 1-200
PURPOSE: Main admin dashboard with overview statistics and quick access
*/

import React, { useState } from "react";
import { useQuery, useQueryClient } from "react-query";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { adminAPI } from "../../services/api";
import AdminStats from "../../components/admin/AdminStats";
import UserManagement from "../../components/admin/UserManagement";
import SupportTicketManagement from "../../components/admin/SupportTicketManagement";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import {
  Users,
  Store,
  ShoppingBag,
  Settings,
  FileText,
  AlertTriangle,
  TrendingUp,
  Activity,
  MessageSquare,
} from "lucide-react";
import toast from "react-hot-toast";
import "./AdminDashboardPage.css";

const AdminDashboardPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const queryClient = useQueryClient();

  // Fetch admin dashboard data
  const {
    data: dashboardData,
    isLoading: statsLoading,
    error: statsError,
  } = useQuery("admin-dashboard-stats", adminAPI.getDashboardStats, {
    enabled: !!user && user.role === "admin",
    refetchInterval: 30000,
    onSuccess: (data) => {
      console.log("📊 Dashboard data received:", data);
    },
    onError: (error) => {
      console.error("❌ Dashboard stats error:", error);
      toast.error("Failed to load dashboard statistics");
    },
  });

  // Fetch recent users for users tab
  const {
    data: recentUsersData,
    isLoading: usersLoading,
    error: usersError,
  } = useQuery(
    "admin-recent-users",
    () => adminAPI.getUsers({ limit: 10, sort: "createdAt", order: "desc" }),
    {
      enabled: !!user && user.role === "admin" && activeTab === "users",
      onError: (error) => {
        console.error("❌ Users fetch error:", error);
      },
    }
  );

  // Fetch pending approvals with error handling
  const {
    data: pendingApprovalsData,
    isLoading: approvalsLoading,
    error: approvalsError,
  } = useQuery(
    "admin-pending-approvals",
    async () => {
      try {
        // Try to get pending approvals, fallback to empty array if not implemented
        return await adminAPI.getPendingApprovals();
      } catch (error) {
        console.warn("getPendingApprovals not implemented, using fallback");
        return { data: [] };
      }
    },
    {
      enabled: !!user && user.role === "admin",
      refetchInterval: 60000,
      onError: (error) => {
        console.error("❌ Pending approvals error:", error);
      },
    }
  );

  // Enhanced stats processing
  const dashboardStats = React.useMemo(() => {
    if (!dashboardData?.data) return null;

    const stats = dashboardData.data;

    return {
      totalUsers: stats.totalUsers || 0,
      userGrowth: stats.userGrowth || 0,
      totalSuppliers: stats.totalSuppliers || 0,
      activeSuppliers: stats.activeSuppliers || 0,
      supplierGrowth: stats.supplierGrowth || 0,
      totalOrders: stats.totalOrders || 0,
      orderGrowth: stats.orderGrowth || 0,
      totalRevenue: stats.totalRevenue || 0,
      revenueGrowth: stats.revenueGrowth || 0,
      pendingSuppliers: stats.pendingSuppliers || 0,
      pendingProducts: stats.pendingProducts || 0,
      pendingApprovals: stats.pendingApprovals || 0,
      monthlyRevenue: stats.monthlyRevenue || 0,
      monthlyGrowth: stats.monthlyGrowth || 0,
      activeProducts: stats.activeProducts || 0,
      productGrowth: stats.productGrowth || 0,
      platformCommission: stats.platformCommission || 0,
      commissionGrowth: stats.commissionGrowth || 0,
      newUsersToday: stats.newUsersToday || 0,
      ordersToday: stats.ordersToday || 0,
      revenueToday: stats.revenueToday || 0,
      // Support ticket stats (with defaults if not available)
      totalSupportTickets: stats.totalSupportTickets || 0,
      openSupportTickets: stats.openSupportTickets || 0,
      urgentSupportTickets: stats.urgentSupportTickets || 0,
      avgResponseTime: stats.avgResponseTime || "0h",
      recentActivity: stats.recentActivity || [],
    };
  }, [dashboardData]);

  // Extract data for components
  const recentUsers = recentUsersData?.data?.users || [];
  const pendingApprovals = pendingApprovalsData?.data?.approvals || [];
  const approvalsCount = pendingApprovalsData?.data?.counts || {
    total: 0,
    suppliers: 0,
    products: 0,
  };
  // ADD THIS FUNCTION:
const handleApproval = async (approvalId, type, action) => {
  try {
    const confirmMessage = `Are you sure you want to ${action} this ${type}?`;
    if (!window.confirm(confirmMessage)) return;

    const loadingToast = toast.loading(`${action === 'approve' ? 'Approving' : 'Rejecting'} ${type}...`);

    let result;
    if (type === 'supplier') {
      result = action === 'approve' 
        ? await adminAPI.approveSupplier(approvalId, { notes: 'Approved from dashboard' })
        : await adminAPI.rejectSupplier(approvalId, { reason: 'Rejected from dashboard' });
    } else if (type === 'product') {
      result = action === 'approve'
        ? await adminAPI.approveProduct(approvalId, { reason: 'Approved from dashboard' })
        : await adminAPI.rejectProduct(approvalId, { reason: 'Rejected from dashboard' });
    }else if (type === 'pilot') {
      // Add pilot handling
      result = action === 'approve'
        ? await adminAPI.approvePilot(approvalId, { notes: 'Approved from dashboard' })
        : await adminAPI.rejectPilot(approvalId, { reason: 'Rejected from dashboard' });
    }

    toast.dismiss(loadingToast);
    toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} ${action}d successfully!`);
    
    // Refresh data
    queryClient.invalidateQueries('admin-pending-approvals');
    queryClient.invalidateQueries('admin-dashboard-stats');

  } catch (error) {
    console.error(`❌ Failed to ${action} ${type}:`, error);
    toast.error(`Failed to ${action} ${type}. Please try again.`);
  }
};
  // Handle user actions
  const handleUserAction = async (userId, action, data = {}) => {
    try {
      let response;
      switch (action) {
        case "activate":
          response = await adminAPI.updateUser(userId, {
            isActive: true,
            ...data,
          });
          break;
        case "deactivate":
          response = await adminAPI.updateUser(userId, {
            isActive: false,
            ...data,
          });
          break;
        case "suspend":
          response = await adminAPI.suspendUser(
            userId,
            data.reason || "Suspended by admin"
          );
          break;
        default:
          throw new Error(`Unknown action: ${action}`);
      }

      if (response?.success) {
        toast.success(`User ${action}d successfully`);
        queryClient.invalidateQueries("admin-recent-users");
      } else {
        throw new Error(response?.message || `Failed to ${action} user`);
      }
    } catch (error) {
      console.error(`Error ${action}ing user:`, error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          `Failed to ${action} user`
      );
    }
  };

  if (!user || user.role !== "admin") {
    return (
      <div className="admin-dashboard">
        <div className="access-denied">
          <AlertTriangle size={48} />
          <h2>Access Denied</h2>
          <p>You don't have permission to access the admin dashboard.</p>
          <Link to="/" className="btn btn-primary">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  if (statsLoading) {
    return (
      <div className="admin-dashboard">
        <LoadingSpinner />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (statsError) {
    return (
      <div className="admin-dashboard">
        <div className="error-state">
          <AlertTriangle size={48} />
          <h2>Error Loading Dashboard</h2>
          <p>Failed to load dashboard data. Please try refreshing the page.</p>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-primary"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Header Section */}
      <div className="dashboard-header">
  
        <div className="header-contents">
          <h1>Admin Dashboard</h1>
          <p>
            Welcome back, {user?.name}! Here's what's happening on Aggrekart
            today.
          </p>
        </div>

        <div className="header-actionss">
          <Link to="/admin/settings" className="settings-button btn-outline">
            <Settings size={14} />
            Settings
          </Link>
          <Link to="/admin/reports" className="button btn-primary">
            <FileText size={16} />
            Reports
          </Link>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="dashboard-tabs">
        <button
          className={`tab ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          <Activity size={16} />
          Overview
        </button>
        <button
          className={`tab ${activeTab === "users" ? "active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          <Users size={16} />
          Recent Users
        </button>
        <button
          className={`tab ${activeTab === "support" ? "active" : ""}`}
          onClick={() => setActiveTab("support")}
        >
          <MessageSquare size={16} />
          Support Tickets
          {dashboardStats?.openSupportTickets > 0 && (
            <span className="tab-badge">
              {dashboardStats.openSupportTickets}
            </span>
          )}
        </button>
        <button
          className={`tab ${activeTab === "approvals" ? "active" : ""}`}
          onClick={() => setActiveTab("approvals")}
        >
          <AlertTriangle size={16} />
          Approvals
          {approvalsCount?.total > 0 && (
  <span className="tab-badge">{approvalsCount.total}</span>
)}
        </button>
      </div>

      {/* Tab Content */}
      <div className="dashboard-content">
        {activeTab === "overview" && (
          <div className="overview-tab">
            {/* Statistics Cards */}
            <AdminStats stats={dashboardStats} loading={statsLoading} />

            {/* Quick Actions Grid */}
            <div className="quick-actions-grid">
              <Link
                to="/admin/users"
                className="quick-action-card"
                state={{ from: "dashboard" }} // Add navigation state
              >
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

              <div
                className="quick-action-card support-card"
                onClick={() => setActiveTab("support")}
                style={{ cursor: "pointer" }}
              >
                <div className="action-icon support">
                  <MessageSquare size={24} />
                </div>
                <div className="action-content">
                  <h3>Support Tickets</h3>
                  <p>Manage customer support requests</p>
                  <span className="action-count">
                    {dashboardStats?.openSupportTickets || 0} open tickets
                  </span>
                  {dashboardStats?.urgentSupportTickets > 0 && (
                    <span className="urgent-indicator">
                      {dashboardStats.urgentSupportTickets} urgent
                    </span>
                  )}
                </div>
              </div>

              <Link to="/admin/orders" className="quick-action-card">
                <div className="action-icon orders">
                  <ShoppingBag size={24} />
                </div>
                <div className="action-content">
                  <h3>Order Management</h3>
                  <p>View and manage customer orders</p>
                  <span className="action-count">
                    {dashboardStats?.totalOrders || 0} total orders
                  </span>
                </div>
              </Link>

              <Link to="/admin/reports" className="quick-action-card">
                <div className="action-icon analytics">
                  <TrendingUp size={24} />
                </div>
                <div className="action-content">
                  <h3>Analytics & Reports</h3>
                  <p>View detailed platform analytics</p>
                  <span className="action-count">
                    Revenue: ₹
                    {(dashboardStats?.totalRevenue || 0).toLocaleString(
                      "en-IN"
                    )}
                  </span>
                </div>
              </Link>

              <Link to="/admin/products" className="quick-action-card">
                <div className="action-icon products">
                  <FileText size={24} />
                </div>
                <div className="action-content">
                  <h3>Product Management</h3>
                  <p>Manage and approve products</p>
                  <span className="action-count">
                    {dashboardStats?.activeProducts || 0} active products
                  </span>
                </div>
              </Link>
            </div>

            {/* Recent Activity Section */}
            <div className="recent-activity">
              <h3>Recent Activity</h3>
              <div className="activity-summary">
                <div className="activity-item">
                  <span className="activity-label">New Users Today:</span>
                  <span className="activity-value">
                    {dashboardStats?.newUsersToday || 0}
                  </span>
                </div>
                <div className="activity-item">
                  <span className="activity-label">Orders Today:</span>
                  <span className="activity-value">
                    {dashboardStats?.ordersToday || 0}
                  </span>
                </div>
                <div className="activity-item">
                  <span className="activity-label">Revenue Today:</span>
                  <span className="activity-value">
                    ₹
                    {(dashboardStats?.revenueToday || 0).toLocaleString(
                      "en-IN"
                    )}
                  </span>
                </div>
                <div className="activity-item">
                  <span className="activity-label">Support Response Time:</span>
                  <span className="activity-value">
                    {dashboardStats?.avgResponseTime || "0h"}
                  </span>
                </div>
              </div>

              {/* Recent Activity List */}
              {dashboardStats?.recentActivity &&
                dashboardStats.recentActivity.length > 0 && (
                  <div className="activity-list">
                    <h4>Latest Updates</h4>
                    {dashboardStats.recentActivity
                      .slice(0, 5)
                      .map((activity, index) => (
                        <div key={index} className="activity-entry">
                          <div className={`activity-icon ${activity.type}`}>
                            {activity.type === "user" && <Users size={16} />}
                            {activity.type === "order" && (
                              <ShoppingBag size={16} />
                            )}
                            {activity.type === "supplier" && (
                              <Store size={16} />
                            )}
                          </div>
                          <div className="activity-content">
                            <div className="activity-text">
                              {activity.message}
                            </div>
                            <div className="activity-time">
                              {activity.timestamp}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div className="users-tab">
            <div className="tab-header">
              <h3>Recent Users</h3>
              <Link to="/admin/users" className="buttons_primary btn-primary">
                View All Users
              </Link>
            </div>

            {usersLoading ? (
              <LoadingSpinner />
            ) : usersError ? (
              <div className="error-message">
                <p>Failed to load users. Please try again.</p>
                <button
                  onClick={() =>
                    queryClient.invalidateQueries("admin-recent-users")
                  }
                >
                  Retry
                </button>
              </div>
            ) : (
              <UserManagement
                users={recentUsers}
                loading={false}
                onUpdateUser={handleUserAction}
                pagination={{
                  currentPage: 1,
                  totalPages: 1,
                  totalItems: recentUsers.length,
                }}
                filters={{ role: "all", status: "all", search: "" }}
                onFilterChange={() => {}} // Disabled for recent users view
                onPageChange={() => {}} // Disabled for recent users view
                onRefresh={() =>
                  queryClient.invalidateQueries("admin-recent-users")
                }
                showPagination={false} // Hide pagination for recent users
                showFilters={false} // Hide filters for recent users
              />
            )}
          </div>
        )}

        {activeTab === "support" && (
          <div className="support-tab">
            <SupportTicketManagement />
          </div>
        )}

        {activeTab === "approvals" && (
          <div className="approvals-tab">
            <div className="tab-header">
              <h3>Pending Approvals</h3>
              <div className="approvals-summary">
                <span className="approval-count">
                  {pendingApprovals?.length || 0} pending
                </span>
              </div>
            </div>

            {approvalsLoading ? (
              <LoadingSpinner />
            ) : approvalsError ? (
              <div className="error-message">
                <p>Failed to load approvals. Please try again.</p>
                <button
                  onClick={() =>
                    queryClient.invalidateQueries("admin-pending-approvals")
                  }
                >
                  Retry
                </button>
              </div>
            ) : pendingApprovals && pendingApprovals.length > 0 ? (
              <div className="approvals-list">
                {pendingApprovals.map((approval) => (
                  <div key={approval._id} className="approval-card">
                    <div className="approval-info">
                      <h4>{approval.title}</h4>
<p>{approval.description}</p>
<span className="approval-type">{approval.type}</span>
                      <span className="approval-date">
                        Submitted:{" "}
                        {new Date(approval.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="approval-actions">
  <button 
    className="button btn-success-approval btn-sm"
    onClick={() => handleApproval(approval._id, approval.type, 'approve')}
  >
    ✅ Approve
  </button>
  <button 
    className="btn btn-danger btn-sm"
    onClick={() => handleApproval(approval._id, approval.type, 'reject')}
  >
    ❌ Reject
  </button>
  <Link 
    to={`/admin/${approval.type === 'supplier' ? 'suppliers' : 'products'}/${approval._id}`}
    className="button btn-outline btn-sm"
  >
    📄 View Details
  </Link>
</div>
                  </div>
                ))}
              </div>
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
  );
};

export default AdminDashboardPage;
