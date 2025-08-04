import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';
import './AdminProductDetailPage.css';

const AdminProductDetailPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState('');
  const [approvalReason, setApprovalReason] = useState('');

  // Fetch product details
  const { 
    data: response, 
    isLoading, 
    error 
  } = useQuery(
    ['admin-product-detail', productId],
    () => adminAPI.getProductDetails(productId),
    {
      enabled: !!productId,
      retry: 2,
      onError: (error) => {
        console.error('Failed to fetch product details:', error);
        toast.error('Failed to load product details');
      }
    }
  );

  const product = response?.data;

  // Delete mutation
  const deleteProductMutation = useMutation(
    () => adminAPI.deleteProduct(productId),
    {
      onSuccess: () => {
        toast.success('Product deleted successfully');
        navigate('/admin/products');
      },
      onError: (error) => {
        console.error('Failed to delete product:', error);
        toast.error('Failed to delete product');
      }
    }
  );

  // Approval mutations
  const approveProductMutation = useMutation(
    (reason) => adminAPI.approveProduct(productId, { reason }),
    {
      onSuccess: () => {
        toast.success('Product approved successfully');
        queryClient.invalidateQueries(['admin-product-detail', productId]);
        setShowApprovalModal(false);
        setApprovalReason('');
      },
      onError: (error) => {
        console.error('Failed to approve product:', error);
        toast.error('Failed to approve product');
      }
    }
  );

  const rejectProductMutation = useMutation(
    (reason) => adminAPI.rejectProduct(productId, { reason }),
    {
      onSuccess: () => {
        toast.success('Product rejected successfully');
        queryClient.invalidateQueries(['admin-product-detail', productId]);
        setShowApprovalModal(false);
        setApprovalReason('');
      },
      onError: (error) => {
        console.error('Failed to reject product:', error);
        toast.error('Failed to reject product');
      }
    }
  );

  // Handlers
  const handleDelete = () => {
    deleteProductMutation.mutate();
  };

  const handleApprovalAction = (action) => {
    setApprovalAction(action);
    setShowApprovalModal(true);
  };

  const confirmApprovalAction = () => {
    if (approvalAction === 'approve') {
      approveProductMutation.mutate(approvalReason || 'Approved by admin');
    } else if (approvalAction === 'reject') {
      if (!approvalReason.trim()) {
        toast.error('Please provide a reason for rejection');
        return;
      }
      rejectProductMutation.mutate(approvalReason);
    }
  };

  const getStatusBadge = () => {
    if (!product) return null;
    
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
      approved: { color: '#10b981', bg: '#d1fae5', text: 'Approved' },
      inactive: { color: '#ef4444', bg: '#fecaca', text: 'Inactive' },
      pending: { color: '#f59e0b', bg: '#fef3c7', text: 'Pending' },
      draft: { color: '#6b7280', bg: '#f3f4f6', text: 'Draft' }
    };

    const config = statusConfig[status];
    
    return (
      <span 
        className="status-badge"
        style={{
          color: config.color,
          backgroundColor: config.bg,
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: '500'
        }}
      >
        {config.text}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <p>Loading product details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-error">
        <h3>Error Loading Product</h3>
        <p>{error.message}</p>
        <button onClick={() => navigate('/admin/products')}>
          Back to Products
        </button>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="admin-error">
        <h3>Product Not Found</h3>
        <button onClick={() => navigate('/admin/products')}>
          Back to Products
        </button>
      </div>
    );
  }

  return (
    <div className="admin-product-detail">
      {/* Header */}
      <div className="detail-header">
        <div className="header-left">
          <button 
            className="back-btn"
            onClick={() => navigate('/admin/products')}
          >
            ← Back to Products
          </button>
          <div className="header-info">
            <h1>{product.name}</h1>
            <div className="header-meta">
              {getStatusBadge()}
              <span className="product-id">ID: {product._id}</span>
            </div>
          </div>
        </div>
        
        <div className="header-actions">
          {!product.isApproved && (
            <>
              <button 
                className="btn btn-success"
                onClick={() => handleApprovalAction('approve')}
                disabled={approveProductMutation.isLoading}
              >
                ✅ Approve
              </button>
              <button 
                className="btn btn-warning"
                onClick={() => handleApprovalAction('reject')}
                disabled={rejectProductMutation.isLoading}
              >
                ❌ Reject
              </button>
            </>
          )}
          <button 
            className="btn btn-danger"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={deleteProductMutation.isLoading}
          >
            🗑️ Delete
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="detail-content">
        {/* Product Images */}
        <div className="detail-section">
          <h3>Product Images</h3>
          <div className="product-images">
            {product.images && product.images.length > 0 ? (
              product.images.map((image, index) => (
                <img 
                  key={index}
                  src={image.url || image}
                  alt={`${product.name} ${index + 1}`}
                  className="product-image"
                />
              ))
            ) : (
              <div className="no-images">No images available</div>
            )}
          </div>
        </div>

        {/* Basic Information */}
        <div className="detail-section">
          <h3>Basic Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <label>Name:</label>
              <span>{product.name}</span>
            </div>
            <div className="info-item">
              <label>Category:</label>
              <span>{product.category}</span>
            </div>
            <div className="info-item">
              <label>Subcategory:</label>
              <span>{product.subcategory || 'N/A'}</span>
            </div>
            <div className="info-item full-width">
              <label>Description:</label>
              <span>{product.description}</span>
            </div>
          </div>
        </div>

        {/* Pricing Information */}
        {product.pricing && (
          <div className="detail-section">
            <h3>Pricing Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <label>Base Price:</label>
                <span>₹{product.pricing.basePrice}</span>
              </div>
              <div className="info-item">
                <label>Unit:</label>
                <span>{product.pricing.unit}</span>
              </div>
              <div className="info-item">
                <label>Min Order:</label>
                <span>{product.pricing.minimumOrderQuantity}</span>
              </div>
              <div className="info-item">
                <label>Bulk Available:</label>
                <span>{product.pricing.bulkPricingAvailable ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Supplier Information */}
        {product.supplier && (
          <div className="detail-section">
            <h3>Supplier Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <label>Company:</label>
                <span>{product.supplier.companyName}</span>
              </div>
              <div className="info-item">
                <label>Owner:</label>
                <span>{product.supplier.tradeOwnerName}</span>
              </div>
              <div className="info-item">
                <label>Email:</label>
                <span>{product.supplier.email}</span>
              </div>
              <div className="info-item">
                <label>Phone:</label>
                <span>{product.supplier.phoneNumber}</span>
              </div>
              <div className="info-item full-width">
                <label>Address:</label>
                <span>{product.supplier.businessAddress}</span>
              </div>
            </div>
          </div>
        )}

        {/* Order Statistics */}
        <div className="detail-section">
          <h3>Order Statistics</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-number">{product.statistics.totalOrders}</span>
              <span className="stat-label">Total Orders</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{product.statistics.totalQuantity}</span>
              <span className="stat-label">Total Quantity Sold</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">₹{product.statistics.totalRevenue?.toFixed(2) || '0.00'}</span>
              <span className="stat-label">Total Revenue</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">₹{product.statistics.avgOrderValue?.toFixed(2) || '0.00'}</span>
              <span className="stat-label">Avg Order Value</span>
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        {product.recentOrders && product.recentOrders.length > 0 && (
          <div className="detail-section">
            <h3>Recent Orders</h3>
            <div className="orders-table">
              <div className="table-header">
                <span>Order #</span>
                <span>Customer</span>
                <span>Quantity</span>
                <span>Price</span>
                <span>Date</span>
                <span>Status</span>
              </div>
              {product.recentOrders.map((order, index) => (
                <div key={index} className="table-row">
                  <span>{order.orderNumber}</span>
                  <span>{order.customer?.name || 'N/A'}</span>
                  <span>{order.quantity}</span>
                  <span>₹{order.price}</span>
                  <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                  <span className={`status-${order.status}`}>{order.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete this product? This action cannot be undone.</p>
            <div className="modal-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-danger"
                onClick={handleDelete}
                disabled={deleteProductMutation.isLoading}
              >
                {deleteProductMutation.isLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {showApprovalModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{approvalAction === 'approve' ? 'Approve Product' : 'Reject Product'}</h3>
            <div className="modal-form">
              <label>
                {approvalAction === 'approve' ? 'Approval Note (Optional):' : 'Rejection Reason (Required):'}
              </label>
              <textarea
                value={approvalReason}
                onChange={(e) => setApprovalReason(e.target.value)}
                placeholder={approvalAction === 'approve' 
                  ? 'Add any notes about the approval...' 
                  : 'Please provide a reason for rejection...'
                }
                rows={4}
              />
            </div>
            <div className="modal-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  setShowApprovalModal(false);
                  setApprovalReason('');
                }}
              >
                Cancel
              </button>
              <button 
                className={`btn ${approvalAction === 'approve' ? 'btn-success' : 'btn-warning'}`}
                onClick={confirmApprovalAction}
                disabled={approveProductMutation.isLoading || rejectProductMutation.isLoading}
              >
                {approvalAction === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProductDetailPage;