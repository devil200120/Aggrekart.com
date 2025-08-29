import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import UserManagement from "../../components/admin/UserManagement";
import AddUserModal from "../../components/admin/AddUserModal";
import { adminAPI } from "../../services/api";
import { Plus } from "lucide-react";
import toast from "react-hot-toast";
import "./AdminUsersPage.css";

const AdminUsersPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  });
  const [filters, setFilters] = useState({
    role: "all",
    status: "all",
    search: "",
  });

  // DEBUG: Log navigation source
  useEffect(() => {
    console.log("🚀 AdminUsersPage mounted");
    console.log("📍 Current location:", location.pathname);
    console.log("🔗 Navigation state:", location.state);
    console.log("📱 Location key:", location.key);
    console.log("🌐 Full location object:", location);

    // Check if navigated from dashboard
    const fromDashboard =
      location.state?.from === "dashboard" ||
      location.pathname.includes("dashboard") ||
      document.referrer.includes("/admin/dashboard");

    console.log("🎯 Navigation source analysis:", {
      fromDashboard,
      referrer: document.referrer,
      state: location.state,
    });
  }, [location]);

  const fetchUsers = async (page = 1, newFilters = filters) => {
    try {
      console.log("🔄 fetchUsers called with:", { page, newFilters });
      console.log("🌐 Current URL:", window.location.href);
      console.log("📱 API function check:", typeof adminAPI.getUsers);

      setLoading(true);
      setError(null);

      const params = {
        page: page.toString(),
        limit: "10",
        ...newFilters,
      };

      // Remove empty string values
      Object.keys(params).forEach((key) => {
        if (params[key] === "" || params[key] === "all") {
          delete params[key];
        }
      });

      console.log("📤 API Request params:", params);
      console.log(
        "🔗 API Base URL:",
        adminAPI.defaults?.baseURL || "No base URL"
      );

      // Make the API call
      const response = await adminAPI.getUsers(params);

      console.log("📥 Raw API Response:", response);
      console.log("✅ Response status:", response?.status);
      console.log("📊 Response data:", response?.data);

      if (response && response.success) {
        console.log(
          "🎉 Success - Users received:",
          response.data.users?.length || 0
        );
        setUsers(response.data.users || []);
        setPagination(response.data.pagination || pagination);
        setError(null);
      } else {
        console.log("❌ API returned success: false");
        console.log("💬 Error message:", response?.message);
        setError(response?.message || "Failed to fetch users");
        setUsers([]);
      }
    } catch (err) {
      console.error("💥 API Error in fetchUsers:", err);
      console.error("🔍 Error details:", {
        message: err.message,
        response: err.response,
        status: err.response?.status,
        data: err.response?.data,
        config: err.config,
      });

      const errorMessage =
        err.response?.data?.message || err.message || "Failed to fetch users";
      setError(errorMessage);
      setUsers([]);

      // Show different error toasts based on error type
      if (err.response?.status === 401) {
        toast.error("Authentication failed. Please login again.");
        navigate("/auth/login");
      } else if (err.response?.status === 403) {
        toast.error("Access denied. Admin permissions required.");
      } else {
        toast.error(`Failed to load users: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
      console.log("✅ fetchUsers completed");
    }
  };

  // Initial load effect with detailed logging
  useEffect(() => {
    console.log("🎬 Initial useEffect triggered");
    console.log("⏰ Timestamp:", new Date().toISOString());

    // Add delay for debugging dashboard navigation
    const timeoutId = setTimeout(() => {
      console.log("🚀 Starting initial fetchUsers call");
      fetchUsers();
    }, 100);

    return () => {
      console.log("🧹 Cleanup: clearing timeout");
      clearTimeout(timeoutId);
    };
  }, []); // Empty dependency array for initial load only

  const handleFilterChange = (newFilters) => {
    console.log("🔄 Filter change triggered:", newFilters);
    setFilters(newFilters);
    fetchUsers(1, newFilters);
  };

  const handlePageChange = (page) => {
    console.log("📄 Page change triggered:", page);
    fetchUsers(page);
  };

  const handleUserAction = async (userId, action, data = {}) => {
    try {
      console.log("👤 User action triggered:", { userId, action, data });
      setActionLoading(true);

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
        case "verify":
          response = await adminAPI.updateUser(userId, {
            isVerified: true,
            ...data,
          });
          break;
        case "suspend":
          response = await adminAPI.suspendUser(
            userId,
            data.reason || "Suspended by admin"
          );
          break;
        case "delete":
          if (
            window.confirm(
              "Are you sure you want to delete this user? This action cannot be undone."
            )
          ) {
            response = await adminAPI.deleteUser(userId);
          } else {
            return;
          }
          break;
        default:
          throw new Error(`Unknown action: ${action}`);
      }

      if (response?.success) {
        toast.success(`User ${action}d successfully`);
        await fetchUsers(pagination.currentPage); // Refresh current page
      } else {
        throw new Error(response?.message || `Failed to ${action} user`);
      }
    } catch (err) {
      console.error(`Error ${action}ing user:`, err);
      toast.error(
        err.response?.data?.message || err.message || `Failed to ${action} user`
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleUserCreated = (newUser) => {
    console.log("🆕 New user created:", newUser);
    setShowAddUserModal(false);
    // Refresh the users list to show the new user
    fetchUsers(pagination.currentPage);
    toast.success(`User "${newUser.name}" has been added successfully! 🎉`);
  };

  // Debug render logging
  console.log("🎨 Rendering AdminUsersPage with state:", {
    loading,
    error,
    usersCount: users.length,
    pagination,
    filters,
  });

  if (loading) {
    return (
      <div className="admin-users-page">
        <div className="admin-page-containerk">
          <div className="admin-page-header">
            <h1>User Management</h1>
            <p>
              Manage all registered users, view profiles, and handle
              user-related activities
            </p>
          </div>
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading users...</p>
            <p style={{ fontSize: "12px", color: "#666" }}>
              Debug: From {location.state?.from || "direct"} navigation
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-users-page">
        <div className="admin-page-containerk">
          <div className="admin-page-header">
            <h1>User Management</h1>
            <p>
              Manage all registered users, view profiles, and handle
              user-related activities
            </p>
          </div>
          <div className="error-container">
            <div className="error-message">
              <h3>Error Loading Users</h3>
              <p>{error}</p>
              <div
                style={{
                  marginTop: "1rem",
                  padding: "1rem",
                  backgroundColor: "#f8f9fa",
                  borderRadius: "4px",
                }}
              >
                <strong>Debug Information:</strong>
                <ul style={{ margin: "0.5rem 0", fontSize: "12px" }}>
                  <li>Navigation: {location.state?.from || "direct"}</li>
                  <li>URL: {window.location.href}</li>
                  <li>Referrer: {document.referrer || "none"}</li>
                  <li>Timestamp: {new Date().toISOString()}</li>
                </ul>
              </div>
              <button onClick={() => fetchUsers()} className="retry-button">
                Try Again
              </button>
              <button
                onClick={() => {
                  console.log("🔄 Force refresh page");
                  window.location.reload();
                }}
                className="retry-button"
                style={{ marginLeft: "1rem" }}
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-users-page">
      <div className="admin-page-container">
        <div className="admin-page-header">
          <div className="header-contentu">
            <h1>User Management</h1>
            <p>
              Manage all registered users, view profiles, and handle
              user-related activities
            </p>
            {/* Debug info in development */}
            {process.env.NODE_ENV === "development" && (
              <small style={{ color: "#666", fontSize: "11px" }}>
                Debug: {users.length} users loaded | Navigation:{" "}
                {location.state?.from || "direct"}
              </small>
            )}
          </div>
          <div className="header-actions">
            <button
              className="btn btn-primary add-user-btn"
              onClick={() => setShowAddUserModal(true)}
              disabled={loading || actionLoading}
            >
              <Plus size={20} />
              Add User
            </button>
          </div>
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

      {/* Add User Modal */}
      <AddUserModal
        isOpen={showAddUserModal}
        onClose={() => setShowAddUserModal(false)}
        onUserCreated={handleUserCreated}
      />
    </div>
  );
};

export default AdminUsersPage;
