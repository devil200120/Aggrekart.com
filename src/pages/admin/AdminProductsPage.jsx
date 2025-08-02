import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { adminAPI } from '../../services/api';
import BaseProductCreator from '../../components/admin/BaseProductCreator';
import toast from 'react-hot-toast';
import './AdminProductsPage.css';

const AdminProductsPage = () => {
  const [activeTab, setActiveTab] = useState('products');
  const [filters, setFilters] = useState({
    category: '',
    status: '',
    search: ''
  });
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [moderationAction, setModerationAction] = useState(null); // For moderation modal
  const [moderationReason, setModerationReason] = useState('');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Function to clean filters
  const getCleanFilters = (filters) => {
    const cleanFilters = {};
    Object.keys(filters).forEach(key => {
      if (filters[key] && filters[key].trim() !== '') {
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
    refetch: refetchProducts 
  } = useQuery(
    ['admin-products', filters],
    () => adminAPI.getAllProducts(getCleanFilters(filters)),
    {
      staleTime: 5 * 60 * 1000,
      retry: 2,
      onError: (error) => {
        console.error('Failed to fetch products:', error);
        toast.error('Failed to load products');
      }
    }
  );

  // Fetch pending products for moderation
  const { 
    data: pendingProductsResponse, 
    isLoading: pendingLoading,
    refetch: refetchPending 
  } = useQuery(
    ['admin-pending-products'],
    () => adminAPI.getAllProducts({ status: 'pending' }),
    {
      staleTime: 2 * 60 * 1000,
      retry: 2,
      onError: (error) => {
        console.error('Failed to fetch pending products:', error);
      }
    }
  );

  // Fetch analytics
  const { 
    data: analyticsResponse, 
    isLoading: analyticsLoading 
  } = useQuery(
    ['admin-products-analytics'],
    () => adminAPI.getAnalytics({ period: '30' }),
    {
      staleTime: 10 * 60 * 1000,
      retry: 2
    }
  );

  // Extract data from responses
  const products = productsResponse?.data?.products || [];
  const pendingProducts = pendingProductsResponse?.data?.products || [];
  const analytics = analyticsResponse?.data || {};

  // Product approval mutation
  const approveProductMutation = useMutation(
    ({ productId, reason }) => adminAPI.approveProduct(productId, { reason }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['admin-products']);
        queryClient.invalidateQueries(['admin-pending-products']);
        toast.success('Product approved successfully');
        setModerationAction(null);
        setModerationReason('');
      },
      onError: (error) => {
        console.error('Failed to approve product:', error);
        toast.error('Failed to approve product');
      }
    }
  );

  // Product rejection mutation
  const rejectProductMutation = useMutation(
    ({ productId, reason }) => adminAPI.rejectProduct(productId, { reason }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['admin-products']);
        queryClient.invalidateQueries(['admin-pending-products']);
        toast.success('Product rejected successfully');
        setModerationAction(null);
        setModerationReason('');
      },
      onError: (error) => {
        console.error('Failed to reject product:', error);
        toast.error('Failed to reject product');
      }
    }
  );

  // Delete product mutation
  const deleteProductMutation = useMutation(
    adminAPI.deleteProduct,
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['admin-products']);
        queryClient.invalidateQueries(['admin-pending-products']);
        setSelectedProducts([]);
        toast.success('Product deleted successfully');
      },
      onError: (error) => {
        console.error('Failed to delete product:', error);
        toast.error('Failed to delete product');
      }
    }
  );

  // Handle moderation actions
  const handleModerationAction = (product, action) => {
    setModerationAction({ product, action });
    setModerationReason('');
  };

  const confirmModerationAction = () => {
    if (!moderationAction) return;

    const { product, action } = moderationAction;

    if (action === 'approve') {
      approveProductMutation.mutate({ 
        productId: product._id, 
        reason: moderationReason || 'Approved by admin' 
      });
    } else if (action === 'reject') {
      if (!moderationReason.trim()) {
        toast.error('Please provide a reason for rejection');
        return;
      }
      rejectProductMutation.mutate({ 
        productId: product._id, 
        reason: moderationReason 
      });
    }
  };

  // Other handlers
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSelectProduct = (productId) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const getStatusBadge = (product) => {
    let status = 'draft';
    let isActive = product.isActive !== false;
    let isApproved = product.isApproved === true;

    if (isApproved && isActive) {
      status = 'approved';
    } else if (isApproved && !isActive) {
      status = 'inactive';
    } else if (!isApproved && isActive) {
      status = 'pending';
    }

    const statusConfig = {
      approved: { icon: '✅', color: '#10b981', bg: '#d1fae5', text: 'Approved' },
      inactive: { icon: '⏸️', color: '#ef4444', bg: '#fecaca', text: 'Inactive' },
      pending: { icon: '⏳', color: '#f59e0b', bg: '#fef3c7', text: 'Pending' },
      draft: { icon: '📝', color: '#6b7280', bg: '#f3f4f6', text: 'Draft' }
    };
    
    const config = statusConfig[status];
    
    return (
      <span 
        className="status-badge"
        style={{ 
          backgroundColor: config.bg, 
          color: config.color,
          border: `1px solid ${config.color}20`,
          padding: '4px 8px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: '500',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px'
        }}
      >
        <span className="status-icon">{config.icon}</span>
        {config.text}
      </span>
    );
  };

  const categories = [
    { value: 'aggregate', label: 'Aggregate' },
    { value: 'sand', label: 'Sand' },
    { value: 'tmt_steel', label: 'TMT Steel' },
    { value: 'bricks_blocks', label: 'Bricks & Blocks' },
    { value: 'cement', label: 'Cement' }
  ];

  // Error state
  if (productsError) {
    return (
      <div className="admin-products-page">
        <div className="error-state" style={{ 
          textAlign: 'center', 
          padding: '4rem 2rem',
          minHeight: '400px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <div className="error-icon" style={{ fontSize: '4rem', marginBottom: '1rem' }}>❌</div>
          <h3 style={{ marginBottom: '1rem' }}>Failed to load products</h3>
          <p style={{ color: '#666', marginBottom: '2rem' }}>
            {productsError?.response?.data?.message || productsError.message || 'Something went wrong'}
          </p>
          <button 
            className="btn btn-primary"
            onClick={() => refetchProducts()}
            style={{
              padding: '12px 24px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-products-page" style={{ padding: '2rem' }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <div className="header-content" style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div className="header-text">
            <h1 style={{ margin: 0, marginBottom: '0.5rem' }}>🛍️ Product Management</h1>
            <p style={{ margin: 0, color: '#666' }}>
              Manage base products, moderate supplier products, and monitor inventory
            </p>
          </div>
          <div className="header-actions" style={{ display: 'flex', gap: '1rem' }}>
            <button 
              className="btn btn-secondary"
              onClick={() => setActiveTab('analytics')}
              style={{
                padding: '8px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                background: 'white',
                cursor: 'pointer'
              }}
            >
              📊 Analytics
            </button>
            <button 
              className="btn btn-primary"
              onClick={() => setActiveTab('create')}
              style={{
                padding: '8px 16px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              ➕ Add Base Product
            </button>
          </div>
        </div>
      </div>

      {/* Analytics Cards */}
      {!analyticsLoading && analytics && (
        <div className="analytics-grid" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <div className="analytics-card" style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div className="card-icon" style={{ fontSize: '2rem' }}>📦</div>
            <div className="card-content">
              <h3 style={{ margin: 0, fontSize: '1.5rem' }}>
                {analytics.totalProducts || products.length || 0}
              </h3>
              <p style={{ margin: 0, color: '#666' }}>Total Products</p>
            </div>
          </div>
          
          <div className="analytics-card" style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div className="card-icon" style={{ fontSize: '2rem' }}>✅</div>
            <div className="card-content">
              <h3 style={{ margin: 0, fontSize: '1.5rem' }}>
                {products.filter(p => p.isApproved && p.isActive).length || 0}
              </h3>
              <p style={{ margin: 0, color: '#666' }}>Approved Products</p>
            </div>
          </div>

          <div className="analytics-card" style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div className="card-icon" style={{ fontSize: '2rem' }}>⏳</div>
            <div className="card-content">
              <h3 style={{ margin: 0, fontSize: '1.5rem', color: '#f59e0b' }}>
                {pendingProducts.length || 0}
              </h3>
              <p style={{ margin: 0, color: '#666' }}>Pending Approval</p>
            </div>
          </div>

          <div className="analytics-card" style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div className="card-icon" style={{ fontSize: '2rem' }}>🏷️</div>
            <div className="card-content">
              <h3 style={{ margin: 0, fontSize: '1.5rem' }}>
                {new Set(products.map(p => p.category)).size || 0}
              </h3>
              <p style={{ margin: 0, color: '#666' }}>Categories</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="tab-navigation" style={{ 
        display: 'flex', 
        borderBottom: '2px solid #e5e7eb',
        marginBottom: '2rem'
      }}>
        <button 
          className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
          style={{
            padding: '12px 24px',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'products' ? '2px solid #3b82f6' : '2px solid transparent',
            color: activeTab === 'products' ? '#3b82f6' : '#666',
            cursor: 'pointer',
            fontWeight: activeTab === 'products' ? '600' : '400'
          }}
        >
          📦 All Products
        </button>
        <button 
          className={`tab-btn ${activeTab === 'moderation' ? 'active' : ''}`}
          onClick={() => setActiveTab('moderation')}
          style={{
            padding: '12px 24px',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'moderation' ? '2px solid #3b82f6' : '2px solid transparent',
            color: activeTab === 'moderation' ? '#3b82f6' : '#666',
            cursor: 'pointer',
            fontWeight: activeTab === 'moderation' ? '600' : '400',
            position: 'relative'
          }}
        >
          ⚖️ Product Moderation
          {pendingProducts.length > 0 && (
            <span style={{
              position: 'absolute',
              top: '4px',
              right: '8px',
              backgroundColor: '#ef4444',
              color: 'white',
              borderRadius: '50%',
              width: '20px',
              height: '20px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {pendingProducts.length}
            </span>
          )}
        </button>
        <button 
          className={`tab-btn ${activeTab === 'create' ? 'active' : ''}`}
          onClick={() => setActiveTab('create')}
          style={{
            padding: '12px 24px',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'create' ? '2px solid #3b82f6' : '2px solid transparent',
            color: activeTab === 'create' ? '#3b82f6' : '#666',
            cursor: 'pointer',
            fontWeight: activeTab === 'create' ? '600' : '400'
          }}
        >
          ➕ Create Base Product
        </button>
        <button 
          className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
          style={{
            padding: '12px 24px',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'analytics' ? '2px solid #3b82f6' : '2px solid transparent',
            color: activeTab === 'analytics' ? '#3b82f6' : '#666',
            cursor: 'pointer',
            fontWeight: activeTab === 'analytics' ? '600' : '400'
          }}
        >
          📊 Analytics
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* All Products Tab */}
        {activeTab === 'products' && (
          <div className="products-section">
            {/* Filters */}
            <div className="filters-section" style={{ 
              background: 'white',
              padding: '1.5rem',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              marginBottom: '1.5rem'
            }}>
              <div className="filters-row" style={{ 
                display: 'flex', 
                gap: '1rem', 
                alignItems: 'center',
                flexWrap: 'wrap'
              }}>
                <div className="search-box" style={{ position: 'relative', flex: '1', minWidth: '250px' }}>
                  <span className="search-icon" style={{ 
                    position: 'absolute', 
                    left: '12px', 
                    top: '50%', 
                    transform: 'translateY(-50%)',
                    fontSize: '1rem'
                  }}>🔍</span>
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px 8px 40px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>
                
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    minWidth: '150px'
                  }}
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>

                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    minWidth: '120px'
                  }}
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
            <div className="products-table-container" style={{
              background: 'white',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              overflow: 'hidden'
            }}>
              {productsLoading ? (
                <div className="loading-state" style={{ 
                  padding: '4rem 2rem',
                  textAlign: 'center'
                }}>
                  <div className="loading-spinner" style={{ 
                    width: '40px',
                    height: '40px',
                    border: '4px solid #f3f4f6',
                    borderTop: '4px solid #3b82f6',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto 1rem'
                  }}></div>
                  <p>Loading products...</p>
                </div>
              ) : products.length === 0 ? (
                <div className="empty-state" style={{ 
                  padding: '4rem 2rem',
                  textAlign: 'center'
                }}>
                  <div className="empty-icon" style={{ fontSize: '4rem', marginBottom: '1rem' }}>📦</div>
                  <h3 style={{ marginBottom: '0.5rem' }}>No products found</h3>
                  <p style={{ color: '#666', marginBottom: '2rem' }}>
                    Create base products for suppliers to add pricing
                  </p>
                  <button 
                    className="btn btn-primary"
                    onClick={() => setActiveTab('create')}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    ➕ Create Base Product
                  </button>
                </div>
              ) : (
                <div className="products-table">
                  <div className="table-header" style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 120px 100px 80px 120px 120px',
                    gap: '1rem',
                    padding: '1rem',
                    background: '#f9fafb',
                    fontWeight: '600',
                    fontSize: '14px',
                    color: '#374151'
                  }}>
                    <div className="header-cell">Product</div>
                    <div className="header-cell">Category</div>
                    <div className="header-cell">Status</div>
                    <div className="header-cell">Suppliers</div>
                    <div className="header-cell">Created</div>
                    <div className="header-cell">Actions</div>
                  </div>

                  <div className="table-body">
                    {products.map((product) => (
                      <div key={product._id} className="table-row" style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 120px 100px 80px 120px 120px',
                        gap: '1rem',
                        padding: '1rem',
                        borderBottom: '1px solid #e5e7eb',
                        alignItems: 'center'
                      }}>
                        <div className="table-cell product-cell">
                          <div className="product-info" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <div className="product-image" style={{ 
                              width: '50px', 
                              height: '50px', 
                              borderRadius: '6px',
                              overflow: 'hidden',
                              background: '#f3f4f6',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              {product.images?.[0]?.url ? (
                                <img 
                                  src={product.images[0].url} 
                                  alt={product.name}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                              ) : (
                                <div className="placeholder-image" style={{ fontSize: '1.5rem' }}>📦</div>
                              )}
                            </div>
                            <div className="product-details">
                              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>
                                {product.name}
                              </h4>
                              <p style={{ 
                                margin: 0, 
                                fontSize: '12px', 
                                color: '#666',
                                marginTop: '2px'
                              }}>
                                {product.description?.substring(0, 60)}...
                              </p>
                              {product.supplier && (
                                <span style={{ 
                                  fontSize: '11px',
                                  color: '#888',
                                  backgroundColor: '#f3f4f6',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  marginTop: '4px',
                                  display: 'inline-block'
                                }}>
                                  {product.supplier.businessName}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="table-cell">
                          <span className="category-tag" style={{
                            backgroundColor: '#e0f2fe',
                            color: '#0369a1',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '500'
                          }}>
                            {product.category?.charAt(0).toUpperCase() + product.category?.slice(1)}
                          </span>
                        </div>

                        <div className="table-cell">
                          {getStatusBadge(product)}
                        </div>

                        <div className="table-cell">
                          <div className="suppliers-count" style={{ textAlign: 'center' }}>
                            <span className="count" style={{ 
                              display: 'block', 
                              fontWeight: '600',
                              fontSize: '16px'
                            }}>
                              {product.supplierCount || 0}
                            </span>
                            <small style={{ fontSize: '11px', color: '#666' }}>suppliers</small>
                          </div>
                        </div>

                        <div className="table-cell">
                          <div className="date-info">
                            <span style={{ 
                              display: 'block', 
                              fontSize: '12px',
                              fontWeight: '500'
                            }}>
                              {new Date(product.createdAt).toLocaleDateString()}
                            </span>
                            <small style={{ fontSize: '11px', color: '#666' }}>
                              {new Date(product.createdAt).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </small>
                          </div>
                        </div>

                        <div className="table-cell actions-cell">
                          <div className="action-buttons" style={{ display: 'flex', gap: '4px' }}>
                            <button 
                              className="action-btn view-btn"
                              onClick={() => navigate(`/admin/products/${product._id}`)}
                              title="View Details"
                              style={{
                                padding: '6px',
                                border: '1px solid #d1d5db',
                                borderRadius: '4px',
                                background: 'white',
                                cursor: 'pointer',
                                fontSize: '14px'
                              }}
                            >
                              👁️
                            </button>
                            <button 
                              className="action-btn delete-btn"
                              onClick={() => {
                                if (window.confirm('Are you sure you want to delete this product?')) {
                                  deleteProductMutation.mutate(product._id);
                                }
                              }}
                              disabled={deleteProductMutation.isLoading}
                              title="Delete Product"
                              style={{
                                padding: '6px',
                                border: '1px solid #ef4444',
                                borderRadius: '4px',
                                background: 'white',
                                color: '#ef4444',
                                cursor: 'pointer',
                                fontSize: '14px',
                                opacity: deleteProductMutation.isLoading ? 0.6 : 1
                              }}
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
        {activeTab === 'moderation' && (
          <div className="moderation-section">
            <div className="moderation-header" style={{ marginBottom: '2rem' }}>
              <h2 style={{ margin: 0, marginBottom: '0.5rem' }}>⚖️ Product Moderation</h2>
              <p style={{ margin: 0, color: '#666' }}>
                Review and approve supplier products pending moderation
              </p>
            </div>

            {pendingLoading ? (
              <div className="loading-state" style={{ 
                padding: '4rem 2rem',
                textAlign: 'center'
              }}>
                <div className="loading-spinner" style={{ 
                  width: '40px',
                  height: '40px',
                  border: '4px solid #f3f4f6',
                  borderTop: '4px solid #3b82f6',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 1rem'
                }}></div>
                <p>Loading pending products...</p>
              </div>
            ) : pendingProducts.length === 0 ? (
              <div className="empty-state" style={{ 
                padding: '4rem 2rem',
                textAlign: 'center',
                background: 'white',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}>
                <div className="empty-icon" style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
                <h3 style={{ marginBottom: '0.5rem' }}>All caught up!</h3>
                <p style={{ color: '#666' }}>
                  No products pending moderation at the moment.
                </p>
              </div>
            ) : (
              <div className="pending-products" style={{
                display: 'grid',
                gap: '1.5rem'
              }}>
                {pendingProducts.map((product) => (
                  <div key={product._id} className="moderation-card" style={{
                    background: 'white',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    padding: '1.5rem',
                    display: 'grid',
                    gridTemplateColumns: '120px 1fr auto',
                    gap: '1.5rem',
                    alignItems: 'start'
                  }}>
                    {/* Product Image */}
                    <div className="product-image" style={{
                      width: '120px',
                      height: '120px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      background: '#f3f4f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {product.images?.[0]?.url ? (
                        <img 
                          src={product.images[0].url} 
                          alt={product.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ fontSize: '3rem' }}>📦</div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="product-details">
                      <div className="product-header" style={{ marginBottom: '1rem' }}>
                        <h3 style={{ margin: 0, marginBottom: '0.5rem' }}>{product.name}</h3>
                        <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                          {product.description}
                        </p>
                      </div>

                      <div className="product-meta" style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '1rem',
                        marginBottom: '1rem'
                      }}>
                        <div className="meta-item">
                          <strong>Category:</strong> {product.category}
                          {product.subcategory && <span> / {product.subcategory}</span>}
                        </div>
                        <div className="meta-item">
                          <strong>Price:</strong> ₹{product.pricing?.basePrice || 0} / {product.pricing?.unit || 'unit'}
                        </div>
                        <div className="meta-item">
                          <strong>Supplier:</strong> {product.supplier?.businessName || 'Unknown'}
                        </div>
                        <div className="meta-item">
                          <strong>Stock:</strong> {product.stock?.available || 0} units
                        </div>
                        <div className="meta-item">
                          <strong>Delivery:</strong> {product.deliveryTime || 'Not specified'}
                        </div>
                        <div className="meta-item">
                          <strong>Submitted:</strong> {new Date(product.createdAt).toLocaleDateString()}
                        </div>
                      </div>

                      {product.hsnCode && (
                        <div className="hsn-code" style={{
                          fontSize: '12px',
                          color: '#666',
                          backgroundColor: '#f3f4f6',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          display: 'inline-block'
                        }}>
                          HSN: {product.hsnCode}
                        </div>
                      )}
                    </div>

                    {/* Moderation Actions */}
                    <div className="moderation-actions" style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                      minWidth: '120px'
                    }}>
                      <button
                        onClick={() => handleModerationAction(product, 'approve')}
                        disabled={approveProductMutation.isLoading}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px'
                        }}
                      >
                        ✅ Approve
                      </button>
                      <button
                        onClick={() => handleModerationAction(product, 'reject')}
                        disabled={rejectProductMutation.isLoading}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px'
                        }}
                      >
                        ❌ Reject
                      </button>
                      <button
                        onClick={() => navigate(`/admin/products/${product._id}`)}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#6b7280',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px'
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
        {activeTab === 'create' && (
          <div className="create-section">
            <BaseProductCreator />
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="analytics-section">
            <div className="analytics-grid" style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
              gap: '2rem'
            }}>
              <div className="analytics-card large" style={{
                background: 'white',
                padding: '2rem',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}>
                <h3 style={{ marginBottom: '1rem' }}>📈 Product Performance</h3>
                <div className="chart-placeholder" style={{
                  height: '300px',
                  background: '#f9fafb',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#666'
                }}>
                  <p>Product performance charts will be displayed here</p>
                </div>
              </div>
              <div className="analytics-card large" style={{
                background: 'white',
                padding: '2rem',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}>
                <h3 style={{ marginBottom: '1rem' }}>🏷️ Category Distribution</h3>
                <div className="chart-placeholder" style={{
                  height: '300px',
                  background: '#f9fafb',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#666'
                }}>
                  <p>Category distribution charts will be displayed here</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Moderation Modal */}
      {moderationAction && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="modal-content" style={{
            background: 'white',
            borderRadius: '8px',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h3 style={{ marginBottom: '1rem' }}>
              {moderationAction.action === 'approve' ? '✅ Approve Product' : '❌ Reject Product'}
            </h3>
            
            <div className="product-summary" style={{
              background: '#f9fafb',
              padding: '1rem',
              borderRadius: '6px',
              marginBottom: '1rem'
            }}>
              <h4 style={{ margin: 0, marginBottom: '0.5rem' }}>{moderationAction.product.name}</h4>
              <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                by {moderationAction.product.supplier?.businessName}
              </p>
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                {moderationAction.action === 'approve' ? 'Approval Notes (Optional)' : 'Rejection Reason (Required)'}
              </label>
              <textarea
                value={moderationReason}
                onChange={(e) => setModerationReason(e.target.value)}
                placeholder={
                  moderationAction.action === 'approve' 
                    ? 'Add any notes for approval...' 
                    : 'Please provide a reason for rejection...'
                }
                rows={4}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
                required={moderationAction.action === 'reject'}
              />
            </div>

            <div className="modal-actions" style={{ 
              display: 'flex', 
              gap: '1rem', 
              justifyContent: 'flex-end' 
            }}>
              <button
                onClick={() => {
                  setModerationAction(null);
                  setModerationReason('');
                }}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  background: 'white',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmModerationAction}
                disabled={
                  (approveProductMutation.isLoading || rejectProductMutation.isLoading) ||
                  (moderationAction.action === 'reject' && !moderationReason.trim())
                }
                style={{
                  padding: '8px 16px',
                  backgroundColor: moderationAction.action === 'approve' ? '#10b981' : '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  opacity: 
                    (approveProductMutation.isLoading || rejectProductMutation.isLoading) ||
                    (moderationAction.action === 'reject' && !moderationReason.trim()) 
                      ? 0.6 : 1
                }}
              >
                {(approveProductMutation.isLoading || rejectProductMutation.isLoading) 
                  ? 'Processing...' 
                  : moderationAction.action === 'approve' ? 'Approve' : 'Reject'
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS Animation */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AdminProductsPage;