/* 
FILE: c:\Users\KIIT0001\Desktop\builder_website using mern\front-end\app\src\components\admin\AdminAnalytics.jsx
LINES: 1-300
PURPOSE: Component for comprehensive admin analytics and insights
*/

import React, { useState, useMemo } from 'react'
import { useQuery } from 'react-query'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  ShoppingBag,
  Store,
  Calendar,
  Download,
  RefreshCw
} from 'lucide-react'
import { adminAPI } from '../../services/api'
import './AdminAnalytics.css'

const AdminAnalytics = () => {
  const [timeRange, setTimeRange] = useState('30d')
  const [analyticsType, setAnalyticsType] = useState('overview')

  // Fetch analytics data
  const { data: analyticsData, isLoading, refetch } = useQuery(
    ['admin-analytics', timeRange, analyticsType],
    () => adminAPI.getAnalytics({ timeRange, type: analyticsType }),
    {
      refetchInterval: 300000, // Refresh every 5 minutes
    }
  )

  // Sample data for demonstration
  const sampleRevenueData = [
    { date: '2025-07-01', revenue: 45000, orders: 120, users: 15 },
    { date: '2025-07-02', revenue: 52000, orders: 135, users: 22 },
    { date: '2025-07-03', revenue: 48000, orders: 128, users: 18 },
    { date: '2025-07-04', revenue: 61000, orders: 142, users: 28 },
    { date: '2025-07-05', revenue: 58000, orders: 155, users: 25 },
    { date: '2025-07-06', revenue: 67000, orders: 168, users: 31 },
    { date: '2025-07-07', revenue: 72000, orders: 175, users: 35 }
  ]

  const sampleCategoryData = [
    { name: 'Cement', value: 35, amount: 450000 },
    { name: 'Steel', value: 25, amount: 320000 },
    { name: 'Bricks', value: 20, amount: 280000 },
    { name: 'Tiles', value: 12, amount: 150000 },
    { name: 'Others', value: 8, amount: 100000 }
  ]

  const sampleUserGrowth = [
    { month: 'Jan', customers: 1200, suppliers: 85 },
    { month: 'Feb', customers: 1350, suppliers: 92 },
    { month: 'Mar', customers: 1480, suppliers: 98 },
    { month: 'Apr', customers: 1620, suppliers: 105 },
    { month: 'May', customers: 1750, suppliers: 112 },
    { month: 'Jun', customers: 1890, suppliers: 118 },
    { month: 'Jul', customers: 2020, suppliers: 125 }
  ]

  const pieColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric'
    })
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="analytics-tooltip">
          <p className="tooltip-label">{label}</p>
          {payload.map((item, index) => (
            <p key={index} className="tooltip-item" style={{ color: item.color }}>
              {item.name}: {
                item.name.toLowerCase().includes('revenue') || item.name.toLowerCase().includes('amount')
                  ? formatCurrency(item.value)
                  : item.value.toLocaleString()
              }
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  const calculateTrend = (data, key) => {
    if (!data || data.length < 2) return 0
    const latest = data[data.length - 1][key]
    const previous = data[data.length - 2][key]
    return ((latest - previous) / previous) * 100
  }

  const revenueTrend = calculateTrend(sampleRevenueData, 'revenue')
  const ordersTrend = calculateTrend(sampleRevenueData, 'orders')
  const usersTrend = calculateTrend(sampleRevenueData, 'users')

  if (isLoading) {
    return (
      <div className="admin-analytics">
        <div className="analytics-header">
          <h3>Analytics Dashboard</h3>
        </div>
        <div className="loading-analytics">
          <div className="loading-spinner"></div>
          <p>Loading analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-analytics">
      <div className="analytics-header">
        <h3>Analytics Dashboard</h3>
        <div className="analytics-controls">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="time-range-select"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 3 Months</option>
            <option value="1y">Last Year</option>
          </select>
          
          <button 
            className="btn btn-outline btn-sm"
            onClick={() => refetch()}
          >
            <RefreshCw size={14} />
            Refresh
          </button>
          
          <button className="btn btn-primary btn-sm">
            <Download size={14} />
            Export
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="key-metrics">
        <div className="metric-card">
          <div className="metric-icon revenue">
            <DollarSign size={24} />
          </div>
          <div className="metric-content">
            <div className="metric-value">{formatCurrency(450000)}</div>
            <div className="metric-label">Total Revenue</div>
            <div className={`metric-trend ${revenueTrend >= 0 ? 'positive' : 'negative'}`}>
              {revenueTrend >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {Math.abs(revenueTrend).toFixed(1)}%
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon orders">
            <ShoppingBag size={24} />
          </div>
          <div className="metric-content">
            <div className="metric-value">1,234</div>
            <div className="metric-label">Total Orders</div>
            <div className={`metric-trend ${ordersTrend >= 0 ? 'positive' : 'negative'}`}>
              {ordersTrend >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {Math.abs(ordersTrend).toFixed(1)}%
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon users">
            <Users size={24} />
          </div>
          <div className="metric-content">
            <div className="metric-value">2,145</div>
            <div className="metric-label">Active Users</div>
            <div className={`metric-trend ${usersTrend >= 0 ? 'positive' : 'negative'}`}>
              {usersTrend >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {Math.abs(usersTrend).toFixed(1)}%
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon suppliers">
            <Store size={24} />
          </div>
          <div className="metric-content">
            <div className="metric-value">125</div>
            <div className="metric-label">Active Suppliers</div>
            <div className="metric-trend positive">
              <TrendingUp size={14} />
              8.2%
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        {/* Revenue Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <h4>Revenue & Orders Trend</h4>
            <div className="chart-legend">
              <span className="legend-item">
                <span className="legend-dot revenue"></span>
                Revenue
              </span>
              <span className="legend-item">
                <span className="legend-dot orders"></span>
                Orders
              </span>
            </div>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={sampleRevenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  stroke="#6b7280"
                  fontSize={12}
                />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stackId="1"
                  stroke="#3b82f6" 
                  fill="#3b82f6"
                  fillOpacity={0.3}
                />
                <Area 
                  type="monotone" 
                  dataKey="orders" 
                  stackId="2"
                  stroke="#10b981" 
                  fill="#10b981"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="chart-card">
          <div className="chart-header">
            <h4>Sales by Category</h4>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sampleCategoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {sampleCategoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* User Growth */}
        <div className="chart-card full-width">
          <div className="chart-header">
            <h4>User Growth Over Time</h4>
            <div className="chart-legend">
              <span className="legend-item">
                <span className="legend-dot customers"></span>
                Customers
              </span>
              <span className="legend-item">
                <span className="legend-dot suppliers"></span>
                Suppliers
              </span>
            </div>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={sampleUserGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="month" 
                  stroke="#6b7280"
                  fontSize={12}
                />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="customers" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="suppliers" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Insights Section */}
      <div className="insights-section">
        <h4>Key Insights</h4>
        <div className="insights-grid">
          <div className="insight-card">
            <div className="insight-icon positive">
              <TrendingUp size={20} />
            </div>
            <div className="insight-content">
              <h5>Revenue Growth</h5>
              <p>Monthly revenue increased by 15.3% compared to last month, driven by higher order values.</p>
            </div>
          </div>

          <div className="insight-card">
            <div className="insight-icon neutral">
              <Users size={20} />
            </div>
            <div className="insight-content">
              <h5>User Acquisition</h5>
              <p>Customer growth rate is steady at 12% month-over-month with improved retention rates.</p>
            </div>
          </div>

          <div className="insight-card">
            <div className="insight-icon warning">
              <Store size={20} />
            </div>
            <div className="insight-content">
              <h5>Supplier Onboarding</h5>
              <p>New supplier registrations have slowed down. Consider improving the onboarding process.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminAnalytics