/* 
FILE: c:\Users\KIIT0001\Desktop\builder_website using mern\front-end\app\src\components\admin\ReportsManager.jsx
LINES: 1-250
PURPOSE: Component for generating and managing admin reports
*/

import React, { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { 
  Download, 
  FileText, 
  Calendar, 
  Filter, 
  Search,
  Clock,
  CheckCircle,
  AlertCircle,
  Trash2,
  Eye,
  Users,
  ShoppingBag,
  DollarSign,
  TrendingUp
} from 'lucide-react'
import { adminAPI } from '../../services/api'
import toast from 'react-hot-toast'
import './ReportsManager.css'

const ReportsManager = () => {
  const [activeTab, setActiveTab] = useState('generate')
  const [reportType, setReportType] = useState('sales')
  const [dateRange, setDateRange] = useState('month')
  const [customDateFrom, setCustomDateFrom] = useState('')
  const [customDateTo, setCustomDateTo] = useState('')
  const [reportFilters, setReportFilters] = useState({})
  const queryClient = useQueryClient()

  // Fetch existing reports
  const { data: reports, isLoading: reportsLoading } = useQuery(
    'admin-reports',
    () => adminAPI.getReports?.() || Promise.resolve([]),
    {
      refetchInterval: 30000,
    }
  )

  // Generate report mutation
  const generateReportMutation = useMutation(
    (reportData) => adminAPI.generateReport(reportData.type, reportData.params),
    {
      onSuccess: () => {
        toast.success('Report generation started! You will be notified when ready.')
        queryClient.invalidateQueries('admin-reports')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to generate report')
      }
    }
  )

  // Download report mutation
  const downloadReportMutation = useMutation(
    (reportId) => adminAPI.downloadReport(reportId),
    {
      onSuccess: (blob, reportId) => {
        // Create download link
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `report-${reportId}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        toast.success('Report downloaded successfully!')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to download report')
      }
    }
  )

  // Delete report mutation
  const deleteReportMutation = useMutation(
    (reportId) => adminAPI.deleteReport?.(reportId) || Promise.resolve(),
    {
      onSuccess: () => {
        toast.success('Report deleted successfully!')
        queryClient.invalidateQueries('admin-reports')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete report')
      }
    }
  )

  const reportTypes = [
    {
      id: 'sales',
      name: 'Sales Report',
      description: 'Revenue, orders, and sales analytics',
      icon: DollarSign,
      color: 'blue'
    },
    {
      id: 'users',
      name: 'User Report',
      description: 'User registration and activity data',
      icon: Users,
      color: 'green'
    },
    {
      id: 'orders',
      name: 'Orders Report',
      description: 'Order details and fulfillment data',
      icon: ShoppingBag,
      color: 'purple'
    },
    {
      id: 'suppliers',
      name: 'Supplier Report',
      description: 'Supplier performance and metrics',
      icon: TrendingUp,
      color: 'orange'
    }
  ]

  const dateRangeOptions = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' },
    { value: 'year', label: 'This Year' },
    { value: 'custom', label: 'Custom Range' }
  ]

  const handleGenerateReport = () => {
    const params = {
      dateRange,
      customDateFrom: dateRange === 'custom' ? customDateFrom : undefined,
      customDateTo: dateRange === 'custom' ? customDateTo : undefined,
      filters: reportFilters
    }

    generateReportMutation.mutate({
      type: reportType,
      params
    })
  }

  const handleDownload = (reportId) => {
    downloadReportMutation.mutate(reportId)
  }

  const handleDelete = (reportId) => {
    if (window.confirm('Are you sure you want to delete this report?')) {
      deleteReportMutation.mutate(reportId)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} className="status-completed" />
      case 'processing':
        return <Clock size={16} className="status-processing" />
      case 'failed':
        return <AlertCircle size={16} className="status-failed" />
      default:
        return <Clock size={16} className="status-pending" />
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      completed: { label: 'Completed', className: 'status-completed' },
      processing: { label: 'Processing', className: 'status-processing' },
      failed: { label: 'Failed', className: 'status-failed' },
      pending: { label: 'Pending', className: 'status-pending' }
    }
    
    const badge = badges[status] || badges.pending
    return <span className={`status-badge ${badge.className}`}>{badge.label}</span>
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatFileSize = (bytes) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  // Sample reports data for demonstration
  const sampleReports = [
    {
      id: '1',
      name: 'Sales Report - July 2025',
      type: 'sales',
      status: 'completed',
      createdAt: '2025-07-18T10:30:00Z',
      fileSize: 2048576,
      downloadCount: 5
    },
    {
      id: '2',
      name: 'User Activity Report - Q2 2025',
      type: 'users',
      status: 'processing',
      createdAt: '2025-07-18T09:15:00Z',
      fileSize: null,
      downloadCount: 0
    },
    {
      id: '3',
      name: 'Orders Report - June 2025',
      type: 'orders',
      status: 'completed',
      createdAt: '2025-07-17T14:20:00Z',
      fileSize: 1536000,
      downloadCount: 3
    }
  ]

  const displayReports = reports || sampleReports

  return (
    <div className="reports-manager">
      <div className="reports-header">
        <h3>Reports Manager</h3>
        <div className="reports-tabs">
          <button 
            className={`tab ${activeTab === 'generate' ? 'active' : ''}`}
            onClick={() => setActiveTab('generate')}
          >
            <FileText size={16} />
            Generate Report
          </button>
          <button 
            className={`tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <Clock size={16} />
            Report History
          </button>
        </div>
      </div>

      <div className="reports-content">
        {activeTab === 'generate' && (
          <div className="generate-report-section">
            <div className="report-config">
              <div className="config-section">
                <h4>Report Type</h4>
                <div className="report-types-grid">
                  {reportTypes.map((type) => {
                    const IconComponent = type.icon
                    return (
                      <div
                        key={type.id}
                        className={`report-type-card ${reportType === type.id ? 'selected' : ''} ${type.color}`}
                        onClick={() => setReportType(type.id)}
                      >
                        <div className="type-icon">
                          <IconComponent size={24} />
                        </div>
                        <div className="type-info">
                          <h5>{type.name}</h5>
                          <p>{type.description}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="config-section">
                <h4>Date Range</h4>
                <div className="date-range-config">
                  <select 
                    value={dateRange} 
                    onChange={(e) => setDateRange(e.target.value)}
                    className="date-range-select"
                  >
                    {dateRangeOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  {dateRange === 'custom' && (
                    <div className="custom-date-inputs">
                      <div className="date-input-group">
                        <label>From Date</label>
                        <input
                          type="date"
                          value={customDateFrom}
                          onChange={(e) => setCustomDateFrom(e.target.value)}
                        />
                      </div>
                      <div className="date-input-group">
                        <label>To Date</label>
                        <input
                          type="date"
                          value={customDateTo}
                          onChange={(e) => setCustomDateTo(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="config-section">
                <h4>Report Format</h4>
                <div className="format-options">
                  <label className="format-option">
                    <input type="radio" name="format" value="pdf" defaultChecked />
                    <span>PDF Document</span>
                  </label>
                  <label className="format-option">
                    <input type="radio" name="format" value="excel" />
                    <span>Excel Spreadsheet</span>
                  </label>
                  <label className="format-option">
                    <input type="radio" name="format" value="csv" />
                    <span>CSV File</span>
                  </label>
                </div>
              </div>

              <div className="generate-actions">
                <button
                  className="btn btn-primary"
                  onClick={handleGenerateReport}
                  disabled={generateReportMutation.isLoading}
                >
                  <FileText size={16} />
                  {generateReportMutation.isLoading ? 'Generating...' : 'Generate Report'}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="reports-history-section">
            <div className="history-controls">
              <div className="search-box">
                <Search size={20} />
                <input
                  type="text"
                  placeholder="Search reports..."
                />
              </div>
              <div className="filter-controls">
                <select className="status-filter">
                  <option value="">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="processing">Processing</option>
                  <option value="failed">Failed</option>
                </select>
                <select className="type-filter">
                  <option value="">All Types</option>
                  {reportTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="reports-list">
              {reportsLoading ? (
                <div className="loading-reports">
                  <div className="loading-spinner"></div>
                  <p>Loading reports...</p>
                </div>
              ) : (
                <>
                  {displayReports.map((report) => (
                    <div key={report.id} className="report-item">
                      <div className="report-info">
                        <div className="report-header">
                          <h5>{report.name}</h5>
                          {getStatusBadge(report.status)}
                        </div>
                        <div className="report-meta">
                          <span className="report-type">
                            {reportTypes.find(t => t.id === report.type)?.name}
                          </span>
                          <span className="report-date">
                            <Calendar size={14} />
                            {formatDate(report.createdAt)}
                          </span>
                          {report.fileSize && (
                            <span className="report-size">
                              {formatFileSize(report.fileSize)}
                            </span>
                          )}
                          {report.downloadCount > 0 && (
                            <span className="download-count">
                              <Download size={14} />
                              {report.downloadCount} downloads
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="report-actions">
                        {report.status === 'completed' && (
                          <>
                            <button
                              className="btn btn-outline btn-sm"
                              onClick={() => handleDownload(report.id)}
                              disabled={downloadReportMutation.isLoading}
                            >
                              <Download size={14} />
                              Download
                            </button>
                            <button
                              className="btn btn-outline btn-sm"
                            >
                              <Eye size={14} />
                              Preview
                            </button>
                          </>
                        )}
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(report.id)}
                          disabled={deleteReportMutation.isLoading}
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}

                  {displayReports.length === 0 && (
                    <div className="no-reports">
                      <div className="no-reports-icon">📊</div>
                      <h4>No reports found</h4>
                      <p>Generate your first report to see it here.</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ReportsManager