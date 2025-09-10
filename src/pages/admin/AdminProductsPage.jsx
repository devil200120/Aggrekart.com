import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { adminAPI } from "../../services/api";
import BaseProductCreator from "../../components/admin/BaseProductCreator";
import toast from "react-hot-toast";
import "./AdminProductsPage.css";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
const AdminProductsPage = () => {
  const [activeTab, setActiveTab] = useState("products");
  const [filters, setFilters] = useState({
    category: "",
    status: "",
    search: "",
  });
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [moderationAction, setModerationAction] = useState(null); // For moderation modal
  const [moderationReason, setModerationReason] = useState("");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Function to clean filters
  const getCleanFilters = (filters) => {
    const cleanFilters = {};
    Object.keys(filters).forEach((key) => {
      if (filters[key] && filters[key].trim() !== "") {
        cleanFilters[key] = filters[key];
      }
    });
    return cleanFilters;
  };

  // Fetch all products
  const {
    data: productsResponse,
    isLoading: productsLoading,
    error: productsError,
    refetch: refetchProducts,
  } = useQuery(
    ["admin-products", filters],
    () => adminAPI.getAllProducts(getCleanFilters(filters)),
    {
      staleTime: 5 * 60 * 1000,
      retry: 2,
      onError: (error) => {
        console.error("Failed to fetch products:", error);
        toast.error("Failed to load products");
      },
    }
  );

  // Fetch pending products for moderation
  const {
    data: pendingProductsResponse,
    isLoading: pendingLoading,
    refetch: refetchPending,
  } = useQuery(
    ["admin-pending-products"],
    () => adminAPI.getAllProducts({ status: "pending" }),
    {
      staleTime: 2 * 60 * 1000,
      retry: 2,
      onError: (error) => {
        console.error("Failed to fetch pending products:", error);
      },
    }
  );

  // Fetch analytics
  const { data: analyticsResponse, isLoading: analyticsLoading } = useQuery(
    ["admin-products-analytics"],
    () => adminAPI.getAnalytics({ period: "30" }),
    {
      staleTime: 10 * 60 * 1000,
      retry: 2,
    }
  );
  // Add this after the existing analytics query
  const { data: productAnalyticsResponse, isLoading: productAnalyticsLoading } =
    useQuery(
      ["admin-product-analytics"],
      () => adminAPI.getProductAnalytics({ period: "30" }),
      {
        staleTime: 10 * 60 * 1000,
        retry: 2,
      }
    );

  // Extract data from responses
  const products = productsResponse?.data?.products || [];
  const pendingProducts = pendingProductsResponse?.data?.products || [];
  const analytics = analyticsResponse?.data || {};
  // Add this after the existing analytics extraction
  const productAnalytics = productAnalyticsResponse?.data || {};
  // Product approval mutation
  const approveProductMutation = useMutation(
    ({ productId, reason }) => adminAPI.approveProduct(productId, { reason }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["admin-products"]);
        queryClient.invalidateQueries(["admin-pending-products"]);
        toast.success("Product approved successfully");
        setModerationAction(null);
        setModerationReason("");
      },
      onError: (error) => {
        console.error("Failed to approve product:", error);
        toast.error("Failed to approve product");
      },
    }
  );

  // Product rejection mutation
  const rejectProductMutation = useMutation(
    ({ productId, reason }) => adminAPI.rejectProduct(productId, { reason }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["admin-products"]);
        queryClient.invalidateQueries(["admin-pending-products"]);
        toast.success("Product rejected successfully");
        setModerationAction(null);
        setModerationReason("");
      },
      onError: (error) => {
        console.error("Failed to reject product:", error);
        toast.error("Failed to reject product");
      },
    }
  );

  // Delete product mutation
  const deleteProductMutation = useMutation(
    ({ productId, data }) => adminAPI.deleteProduct(productId, data),
    {
      onSuccess: (response) => {
        queryClient.invalidateQueries(["admin-products"]);
        queryClient.invalidateQueries(["admin-pending-products"]);
        setSelectedProducts([]);

        // Show success message with email status
        const emailSent = response?.data?.emailSent;
        const message = emailSent
          ? "Product deleted successfully. Supplier has been notified via email."
          : "Product deleted successfully.";
        toast.success(message);
      },
      onError: (error) => {
        console.error("Failed to delete product:", error);
        // Don't show error here since we handle it in the onClick
        // The onClick will handle showing appropriate error messages
      },
    }
  );
  // Handle moderation actions
  const handleModerationAction = (product, action) => {
    setModerationAction({ product, action });
    setModerationReason("");
  };

  const confirmModerationAction = () => {
    if (!moderationAction) return;

    const { product, action } = moderationAction;

    if (action === "approve") {
      approveProductMutation.mutate({
        productId: product._id,
        reason: moderationReason || "Approved by admin",
      });
    } else if (action === "reject") {
      if (!moderationReason.trim()) {
        toast.error("Please provide a reason for rejection");
        return;
      }
      rejectProductMutation.mutate({
        productId: product._id,
        reason: moderationReason,
      });
    }
  };

  // Other handlers
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleSelectProduct = (productId) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const getStatusBadge = (product) => {
    let status = "draft";
    let isActive = product.isActive !== false;
    let isApproved = product.isApproved === true;

    if (isApproved && isActive) {
      status = "approved";
    } else if (isApproved && !isActive) {
      status = "inactive";
    } else if (!isApproved && isActive) {
      status = "pending";
    }

    const statusConfig = {
      approved: {
        icon: "✅",
        color: "#10b981",
        bg: "#d1fae5",
        text: "Approved",
      },
      inactive: {
        icon: "⏸️",
        color: "#ef4444",
        bg: "#fecaca",
        text: "Inactive",
      },
      pending: { icon: "⏳", color: "#f59e0b", bg: "#fef3c7", text: "Pending" },
      draft: { icon: "📝", color: "#6b7280", bg: "#f3f4f6", text: "Draft" },
    };

    const config = statusConfig[status];

    return (
      <span className="status-badge">
        <span className="status-icon">{config.icon}</span>
        {config.text}
      </span>
    );
  };

  const categories = [
    { value: "aggregate", label: "Aggregate" },
    { value: "sand", label: "Sand" },
    { value: "tmt_steel", label: "TMT Steel" },
    { value: "bricks_blocks", label: "Bricks & Blocks" },
    { value: "cement", label: "Cement" },
  ];

  // Error state
  if (productsError) {
    return (
      <div className="admin-products-page">
        <div className="error-state">
          <div className="error-icon">❌</div>
          <h3 style={{ marginBottom: "1rem" }}>Failed to load products</h3>
          <p>
            {productsError?.response?.data?.message ||
              productsError.message ||
              "Something went wrong"}
          </p>
          <button className="btn btn-primary" onClick={() => refetchProducts()}>
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-products-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <div className="header-text">
            <h1>🛍️ Product Management</h1>
            <p>
              Manage base products, moderate supplier products, and monitor
              inventory
            </p>
          </div>
         
        </div>
      </div>

      {/* Analytics Cards */}
      {!analyticsLoading && analytics && (
        <div className="analytics-grid">
          <div className="analytics-card">
            <div className="card-icon">📦</div>
            <div className="card-content">
              <h3>{analytics.totalProducts || products.length || 0}</h3>
              <p>Total Products</p>
            </div>
          </div>

          <div className="analytics-card">
            <div className="card-icon">✅</div>
            <div className="card-content">
              <h3>
                {products.filter((p) => p.isApproved && p.isActive).length || 0}
              </h3>
              <p>Approved Products</p>
            </div>
          </div>

          <div className="analytics-card">
            <div className="card-icon" style={{ fontSize: "2rem" }}>
              ⏳
            </div>
            <div className="card-content">
              <h3 style={{ margin: 0, fontSize: "1.5rem", color: "#f59e0b" }}>
                {pendingProducts.length || 0}
              </h3>
              <p>Pending Approval</p>
            </div>
          </div>

          <div className="analytics-card">
            <div className="card-icon">🏷️</div>
            <div className="card-content">
              <h3>{new Set(products.map((p) => p.category)).size || 0}</h3>
              <p>Categories</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div
        className="tab-navigation"
        style={{
          display: "flex",
          borderBottom: "2px solid #e5e7eb",
          marginBottom: "2rem",
        }}
      >
        <button
          className={`tab-btn ${activeTab === "products" ? "active" : ""}`}
          onClick={() => setActiveTab("products")}
        >
          📦 All Products
        </button>
        <button
          className={`tab-btn ${activeTab === "moderation" ? "active" : ""}`}
          onClick={() => setActiveTab("moderation")}
        >
          ⚖️ Product Moderation
          {pendingProducts.length > 0 && <span>{pendingProducts.length}</span>}
        </button>
        <button
          className={`tab-btn ${activeTab === "create" ? "active" : ""}`}
          onClick={() => setActiveTab("create")}
        >
          ➕ Create Base Product
        </button>
        <button
          className={`tab-btn ${activeTab === "analytics" ? "active" : ""}`}
          onClick={() => setActiveTab("analytics")}
        >
          📊 Analytics
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* All Products Tab */}
        {activeTab === "products" && (
          <div className="products-section">
            {/* Filters */}
            <div className="filters-section">
              <div className="filters-row">
                <div className="search-box">
                  <span className="search-icon">🔍</span>
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={filters.search}
                    onChange={(e) =>
                      handleFilterChange("search", e.target.value)
                    }
                  />
                </div>

                <select
                  value={filters.category}
                  onChange={(e) =>
                    handleFilterChange("category", e.target.value)
                  }
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>

                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                >
                  <option value="">All Status</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            {/* Products Table */}
            <div className="products-table-container">
              {productsLoading ? (
                <div className="loading-state">
                  <div className="loading-spinner"></div>
                  <p>Loading products...</p>
                </div>
              ) : products.length === 0 ? (
                <div
                  className="empty-state"
                  style={{
                    padding: "4rem 2rem",
                    textAlign: "center",
                  }}
                >
                  <div
                    className="empty-icon"
                    style={{ fontSize: "4rem", marginBottom: "1rem" }}
                  >
                    📦
                  </div>
                  <h3>No products found</h3>
                  <p>Create base products for suppliers to add pricing</p>
                  <button
                    className="btn btn-primary"
                    onClick={() => setActiveTab("create")}
                  >
                    ➕ Create Base Product
                  </button>
                </div>
              ) : (
                <div className="products-table">
                  <div className="table-header">
                    <div className="header-cell">Product</div>
                    <div className="header-cell">Category</div>
                    <div className="header-cell">Status</div>
                    <div className="header-cell">Suppliers</div>
                    <div className="header-cell">Created</div>
                    <div className="header-cell">Actions</div>
                  </div>

                  <div className="table-body">
                    {products.map((product) => (
                      <div key={product._id} className="table-row">
                        <div className="table-cell product-cell">
                          <div
                            className="product-info"
                            style={{
                              display: "flex",
                              gap: "12px",
                              alignItems: "center",
                            }}
                          >
                            <div className="product-image">
                              {product.images?.[0]?.url ? (
                                <img
                                  src={product.images[0].url}
                                  alt={product.name}
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                  }}
                                />
                              ) : (
                                <div
                                  className="placeholder-image"
                                  style={{ fontSize: "1.5rem" }}
                                >
                                  📦
                                </div>
                              )}
                            </div>
                            <div className="product-details">
                              <h4
                                style={{
                                  margin: 0,
                                  fontSize: "14px",
                                  fontWeight: "600",
                                }}
                              >
                                {product.name}
                              </h4>
                              <p>{product.description?.substring(0, 60)}...</p>
                              {product.supplier && (
                                <span>{product.supplier.businessName}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="table-cell">
                          <span className="category-tag">
                            {product.category?.charAt(0).toUpperCase() +
                              product.category?.slice(1)}
                          </span>
                        </div>

                        <div className="table-cell">
                          {getStatusBadge(product)}
                        </div>

                        <div className="table-cell">
                          <div
                            className="suppliers-count"
                            style={{ textAlign: "center" }}
                          >
                            <span className="count">
                              {product.supplierCount || 0}
                            </span>
                            <small style={{ fontSize: "11px", color: "#666" }}>
                              suppliers
                            </small>
                          </div>
                        </div>

                        <div className="table-cell">
                          <div className="date-info">
                            <span>
                              {new Date(product.createdAt).toLocaleDateString()}
                            </span>
                            <small style={{ fontSize: "11px", color: "#666" }}>
                              {new Date(product.createdAt).toLocaleTimeString(
                                [],
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </small>
                          </div>
                        </div>

                        <div className="table-cell actions-cell">
                          <div
                            className="action-buttons"
                            style={{ display: "flex", gap: "4px" }}
                          >
                            <button
                              className="action-btn view-btn"
                              onClick={() =>
                                navigate(`/admin/products/${product._id}`)
                              }
                              title="View Details"
                            >
                              👁️
                            </button>
                            <button
                              className="action-btn delete-btn"
                              // Replace the onClick handler around line 574 with this simple version:
                              onClick={() => {
                                const reason = prompt(
                                  "Please provide a reason for deleting this product (this will be sent to the supplier):"
                                );
                                if (!reason) {
                                  toast.error("Deletion reason is required");
                                  return;
                                }

                                // Ask if they want to force delete from the start
                                const hasOrders = window.confirm(
                                  "This product may have existing orders. Do you want to force delete it anyway? " +
                                    "This will permanently remove the product and notify the supplier."
                                );

                                deleteProductMutation.mutate({
                                  productId: product._id,
                                  data: { reason, forceDelete: hasOrders },
                                });
                              }}
                              disabled={deleteProductMutation.isLoading}
                              title="Delete Product"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Product Moderation Tab - NEW SECTION */}
        {activeTab === "moderation" && (
          <div className="moderation-section">
            <div className="moderation-header" style={{ marginBottom: "2rem" }}>
              <h2>⚖️ Product Moderation</h2>
              <p>Review and approve supplier products pending moderation</p>
            </div>

            {pendingLoading ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Loading pending products...</p>
              </div>
            ) : pendingProducts.length === 0 ? (
              <div
                className="empty-state"
                style={{
                  padding: "4rem 2rem",
                  textAlign: "center",
                  background: "white",
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                }}
              >
                <div
                  className="empty-icon"
                  style={{ fontSize: "4rem", marginBottom: "1rem" }}
                >
                  ✅
                </div>
                <h3 style={{ marginBottom: "0.5rem" }}>All caught up!</h3>
                <p style={{ color: "#666" }}>
                  No products pending moderation at the moment.
                </p>
              </div>
            ) : (
              <div
                className="pending-products"
                style={{
                  display: "grid",
                  gap: "1.5rem",
                }}
              >
                {pendingProducts.map((product) => (
                  <div key={product._id} className="moderation-card">
                    {/* Product Image */}
                    <div className="product-image">
                      {product.images?.[0]?.url ? (
                        <img
                          src={product.images[0].url}
                          alt={product.name}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <div style={{ fontSize: "3rem" }}>📦</div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="product-details">
                      <div
                        className="product-header"
                        style={{ marginBottom: "1rem" }}
                      >
                        <h3>{product.name}</h3>
                        <p>{product.description}</p>
                      </div>

                      <div className="product-meta">
                        <div className="meta-item">
                          <strong>Category:</strong> {product.category}
                          {product.subcategory && (
                            <span> / {product.subcategory}</span>
                          )}
                        </div>
                        <div className="meta-item">
                          <strong>Price:</strong> ₹
                          {product.pricing?.basePrice || 0} /{" "}
                          {product.pricing?.unit || "unit"}
                        </div>
                        <div className="meta-item">
                          <strong>Supplier:</strong>{" "}
                          {product.supplier?.businessName || "Unknown"}
                        </div>
                        <div className="meta-item">
                          <strong>Stock:</strong>{" "}
                          {product.stock?.available || 0} units
                        </div>
                        <div className="meta-item">
                          <strong>Delivery:</strong>{" "}
                          {product.deliveryTime || "Not specified"}
                        </div>
                        <div className="meta-item">
                          <strong>Submitted:</strong>{" "}
                          {new Date(product.createdAt).toLocaleDateString()}
                        </div>
                      </div>

                      {product.hsnCode && (
                        <div
                          className="hsn-code"
                          style={{
                            fontSize: "12px",
                            color: "#666",
                            backgroundColor: "#f3f4f6",
                            padding: "4px 8px",
                            borderRadius: "4px",
                            display: "inline-block",
                          }}
                        >
                          HSN: {product.hsnCode}
                        </div>
                      )}
                    </div>

                    {/* Moderation Actions */}
                    <div
                      className="moderation-actions"
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.5rem",
                        minWidth: "120px",
                      }}
                    >
                      <button
                        onClick={() =>
                          handleModerationAction(product, "approve")
                        }
                        disabled={approveProductMutation.isLoading}
                        style={{
                          padding: "8px 16px",
                          backgroundColor: "#10b981",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontSize: "14px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "4px",
                        }}
                      >
                        ✅ Approve
                      </button>
                      <button
                        onClick={() =>
                          handleModerationAction(product, "reject")
                        }
                        disabled={rejectProductMutation.isLoading}
                        style={{
                          padding: "8px 16px",
                          backgroundColor: "#ef4444",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontSize: "14px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "4px",
                        }}
                      >
                        ❌ Reject
                      </button>
                      <button
                        onClick={() =>
                          navigate(`/admin/products/${product._id}`)
                        }
                        style={{
                          padding: "8px 16px",
                          backgroundColor: "#6b7280",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontSize: "14px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "4px",
                        }}
                      >
                        👁️ Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Create Base Product Tab */}
        {activeTab === "create" && (
          <div className="create-section">
            <BaseProductCreator />
          </div>
        )}

        {/* Analytics Tab */}
        {/* Analytics Tab */}
        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <div className="analytics-section">
            {productAnalyticsLoading ? (
              <div className="loading-state">Loading analytics...</div>
            ) : (
              <>
                {/* Charts Grid */}
                <div
                  className="analytics-grid"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(500px, 1fr))",
                    gap: "2rem",
                    marginBottom: "2rem",
                  }}
                >
                  {/* Category Bar Chart */}
                  <div className="analytics-card large">
                    <h3 style={{ marginBottom: "1rem" }}>
                      📊 Products by Category
                    </h3>
                    {productAnalytics.categoryStats &&
                    productAnalytics.categoryStats.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                          data={productAnalytics.categoryStats.map((cat) => ({
                            name:
                              cat._id.charAt(0).toUpperCase() +
                              cat._id.slice(1),
                            total: cat.totalProducts,
                            active: cat.activeProducts,
                            approved: cat.approvedProducts,
                          }))}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar
                            dataKey="total"
                            fill="#8884d8"
                            name="Total Products"
                          />
                          <Bar
                            dataKey="active"
                            fill="#82ca9d"
                            name="Active Products"
                          />
                          <Bar
                            dataKey="approved"
                            fill="#ffc658"
                            name="Approved Products"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="chart-placeholder">
                        <p>No category data available</p>
                      </div>
                    )}
                  </div>

                  {/* Category Pie Chart */}
                  <div className="analytics-card large">
                    <h3 style={{ marginBottom: "1rem" }}>
                      🥧 Category Distribution
                    </h3>
                    {productAnalytics.categoryStats &&
                    productAnalytics.categoryStats.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={productAnalytics.categoryStats.map(
                              (cat, index) => ({
                                name:
                                  cat._id.charAt(0).toUpperCase() +
                                  cat._id.slice(1),
                                value: cat.totalProducts,
                                fill: [
                                  "#0088FE",
                                  "#00C49F",
                                  "#FFBB28",
                                  "#FF8042",
                                  "#8884d8",
                                ][index % 5],
                              })
                            )}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) =>
                              `${name} ${(percent * 100).toFixed(0)}%`
                            }
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {productAnalytics.categoryStats.map(
                              (entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={
                                    [
                                      "#0088FE",
                                      "#00C49F",
                                      "#FFBB28",
                                      "#FF8042",
                                      "#8884d8",
                                    ][index % 5]
                                  }
                                />
                              )
                            )}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="chart-placeholder">
                        <p>No category data available</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Detailed Statistics */}
                <div
                  className="analytics-grid"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
                    gap: "2rem",
                    marginBottom: "2rem",
                  }}
                >
                  {/* Category Details Table */}
                  <div className="analytics-card large">
                    <h3 style={{ marginBottom: "1rem" }}>
                      📋 Category Details
                    </h3>
                    {productAnalytics.categoryStats &&
                    productAnalytics.categoryStats.length > 0 ? (
                      <div className="category-stats">
                        <div
                          className="stats-header"
                          style={{
                            display: "grid",
                            gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
                            padding: "0.75rem 0",
                            borderBottom: "2px solid #e5e7eb",
                            fontWeight: "600",
                            fontSize: "0.85rem",
                            color: "#374151",
                          }}
                        >
                          <div>Category</div>
                          <div>Total</div>
                          <div>Active</div>
                          <div>Approved</div>
                          <div>Avg Price</div>
                        </div>
                        {productAnalytics.categoryStats.map(
                          (category, index) => (
                            <div
                              key={index}
                              className="category-row"
                              style={{
                                display: "grid",
                                gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
                                padding: "0.75rem 0",
                                borderBottom: "1px solid #f0f0f0",
                                alignItems: "center",
                              }}
                            >
                              <div>
                                <span
                                  style={{
                                    fontWeight: "600",
                                    textTransform: "capitalize",
                                  }}
                                >
                                  {category._id}
                                </span>
                              </div>
                              <div
                                style={{ fontWeight: "600", color: "#1f2937" }}
                              >
                                {category.totalProducts}
                              </div>
                              <div style={{ color: "#059669" }}>
                                {category.activeProducts}
                              </div>
                              <div style={{ color: "#d97706" }}>
                                {category.approvedProducts}
                              </div>
                              <div
                                style={{ fontSize: "0.9rem", color: "#6b7280" }}
                              >
                                ₹
                                {Math.round(
                                  category.avgPrice || 0
                                ).toLocaleString()}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <div className="chart-placeholder">
                        <p>No category data available</p>
                      </div>
                    )}
                  </div>

                  {/* Top Suppliers Chart */}
                  <div className="analytics-card large">
                    <h3 style={{ marginBottom: "1rem" }}>
                      🏪 Top Suppliers Performance
                    </h3>
                    {productAnalytics.topSuppliers &&
                    productAnalytics.topSuppliers.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                          data={productAnalytics.topSuppliers
                            .slice(0, 5)
                            .map((supplier) => ({
                              name:
                                (
                                  supplier.supplierInfo?.companyName ||
                                  "Unknown"
                                ).substring(0, 15) +
                                ((supplier.supplierInfo?.companyName || "")
                                  .length > 15
                                  ? "..."
                                  : ""),
                              products: supplier.productCount,
                              categories: supplier.categories?.length || 0,
                            }))}
                          layout="horizontal"
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis dataKey="name" type="category" width={120} />
                          <Tooltip />
                          <Legend />
                          <Bar
                            dataKey="products"
                            fill="#3b82f6"
                            name="Products"
                          />
                          <Bar
                            dataKey="categories"
                            fill="#10b981"
                            name="Categories"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="chart-placeholder">
                        <p>No supplier data available</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Summary Cards */}
                <div
                  className="analytics-summary"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                    gap: "1rem",
                  }}
                >
                  <div
                    className="summary-card"
                    style={{
                      background:
                        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      color: "white",
                      padding: "1.5rem",
                      borderRadius: "12px",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "2rem",
                        fontWeight: "bold",
                        marginBottom: "0.5rem",
                      }}
                    >
                      {productAnalytics.categoryStats?.reduce(
                        (sum, cat) => sum + cat.totalProducts,
                        0
                      ) || 0}
                    </div>
                    <div style={{ fontSize: "0.9rem", opacity: 0.9 }}>
                      Total Products
                    </div>
                  </div>

                  <div
                    className="summary-card"
                    style={{
                      background:
                        "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                      color: "white",
                      padding: "1.5rem",
                      borderRadius: "12px",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "2rem",
                        fontWeight: "bold",
                        marginBottom: "0.5rem",
                      }}
                    >
                      {productAnalytics.categoryStats?.reduce(
                        (sum, cat) => sum + cat.activeProducts,
                        0
                      ) || 0}
                    </div>
                    <div style={{ fontSize: "0.9rem", opacity: 0.9 }}>
                      Active Products
                    </div>
                  </div>

                  <div
                    className="summary-card"
                    style={{
                      background:
                        "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                      color: "white",
                      padding: "1.5rem",
                      borderRadius: "12px",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "2rem",
                        fontWeight: "bold",
                        marginBottom: "0.5rem",
                      }}
                    >
                      {productAnalytics.categoryStats?.length || 0}
                    </div>
                    <div style={{ fontSize: "0.9rem", opacity: 0.9 }}>
                      Categories
                    </div>
                  </div>

                  <div
                    className="summary-card"
                    style={{
                      background:
                        "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
                      color: "white",
                      padding: "1.5rem",
                      borderRadius: "12px",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "2rem",
                        fontWeight: "bold",
                        marginBottom: "0.5rem",
                      }}
                    >
                      {productAnalytics.topSuppliers?.length || 0}
                    </div>
                    <div style={{ fontSize: "0.9rem", opacity: 0.9 }}>
                      Active Suppliers
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Moderation Modal */}
      {moderationAction && (
        <div
          className="modal-overlay"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            className="modal-content"
            style={{
              background: "white",
              borderRadius: "8px",
              padding: "2rem",
              maxWidth: "500px",
              width: "90%",
              maxHeight: "90vh",
              overflow: "auto",
            }}
          >
            <h3 style={{ marginBottom: "1rem" }}>
              {moderationAction.action === "approve"
                ? "✅ Approve Product"
                : "❌ Reject Product"}
            </h3>

            <div
              className="product-summary"
              style={{
                background: "#f9fafb",
                padding: "1rem",
                borderRadius: "6px",
                marginBottom: "1rem",
              }}
            >
              <h4 style={{ margin: 0, marginBottom: "0.5rem" }}>
                {moderationAction.product.name}
              </h4>
              <p style={{ margin: 0, fontSize: "14px", color: "#666" }}>
                by {moderationAction.product.supplier?.businessName}
              </p>
            </div>

            <div className="form-group" style={{ marginBottom: "1.5rem" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontWeight: "500",
                }}
              >
                {moderationAction.action === "approve"
                  ? "Approval Notes (Optional)"
                  : "Rejection Reason (Required)"}
              </label>
              <textarea
                value={moderationReason}
                onChange={(e) => setModerationReason(e.target.value)}
                placeholder={
                  moderationAction.action === "approve"
                    ? "Add any notes for approval..."
                    : "Please provide a reason for rejection..."
                }
                rows={4}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "14px",
                  resize: "vertical",
                }}
                required={moderationAction.action === "reject"}
              />
            </div>

            <div
              className="modal-actions"
              style={{
                display: "flex",
                gap: "1rem",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => {
                  setModerationAction(null);
                  setModerationReason("");
                }}
                style={{
                  padding: "8px 16px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  background: "white",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmModerationAction}
                disabled={
                  approveProductMutation.isLoading ||
                  rejectProductMutation.isLoading ||
                  (moderationAction.action === "reject" &&
                    !moderationReason.trim())
                }
                style={{
                  padding: "8px 16px",
                  backgroundColor:
                    moderationAction.action === "approve"
                      ? "#10b981"
                      : "#ef4444",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  opacity:
                    approveProductMutation.isLoading ||
                    rejectProductMutation.isLoading ||
                    (moderationAction.action === "reject" &&
                      !moderationReason.trim())
                      ? 0.6
                      : 1,
                }}
              >
                {approveProductMutation.isLoading ||
                rejectProductMutation.isLoading
                  ? "Processing..."
                  : moderationAction.action === "approve"
                    ? "Approve"
                    : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS Animation */}
      <style jsx>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default AdminProductsPage;
