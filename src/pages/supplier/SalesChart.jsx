import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import './SalesChart.css';

const SalesChart = ({ data = [], loading = false, error = null, onRetry }) => {
  const [activeFilter, setActiveFilter] = useState('7d');

  // Sample data for demonstration
  const sampleData = [
    { date: '2025-07-01', sales: 4500, orders: 12, revenue: 8500 },
    { date: '2025-07-02', sales: 3200, orders: 8, revenue: 6200 },
    { date: '2025-07-03', sales: 5800, orders: 15, revenue: 9800 },
    { date: '2025-07-04', sales: 4100, orders: 11, revenue: 7300 },
    { date: '2025-07-05', sales: 6200, orders: 18, revenue: 11200 },
    { date: '2025-07-06', sales: 3800, orders: 9, revenue: 6800 },
    { date: '2025-07-07', sales: 5500, orders: 14, revenue: 9500 }
  ];

  const chartData = data.length > 0 ? data : sampleData;

  // Filter data based on selected time period
  const filteredData = useMemo(() => {
    const now = new Date();
    const filterDays = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    };

    const days = filterDays[activeFilter] || 7;
    const startDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));

    return chartData.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= startDate;
    });
  }, [chartData, activeFilter]);

  // Calculate statistics from the data
  const stats = useMemo(() => {
    if (filteredData.length === 0) {
      return {
        totalSales: 0,
        totalOrders: 0,
        totalRevenue: 0,
        avgOrderValue: 0,
        salesChange: 0,
        ordersChange: 0
      };
    }

    const totalSales = filteredData.reduce((sum, item) => sum + item.sales, 0);
    const totalOrders = filteredData.reduce((sum, item) => sum + item.orders, 0);
    const totalRevenue = filteredData.reduce((sum, item) => sum + item.revenue, 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Calculate percentage change from previous period
    const midPoint = Math.floor(filteredData.length / 2);
    const firstHalf = filteredData.slice(0, midPoint);
    const secondHalf = filteredData.slice(midPoint);

    const firstHalfSales = firstHalf.reduce((sum, item) => sum + item.sales, 0);
    const secondHalfSales = secondHalf.reduce((sum, item) => sum + item.sales, 0);
    const firstHalfOrders = firstHalf.reduce((sum, item) => sum + item.orders, 0);
    const secondHalfOrders = secondHalf.reduce((sum, item) => sum + item.orders, 0);

    const salesChange = firstHalfSales > 0 ? 
      ((secondHalfSales - firstHalfSales) / firstHalfSales) * 100 : 0;
    const ordersChange = firstHalfOrders > 0 ? 
      ((secondHalfOrders - firstHalfOrders) / firstHalfOrders) * 100 : 0;

    return {
      totalSales,
      totalOrders,
      totalRevenue,
      avgOrderValue,
      salesChange,
      ordersChange
    };
  }, [filteredData]);

  // Format currency in Indian Rupees
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Format dates for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric'
    });
  };

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="recharts-default-tooltip">
          <p className="recharts-tooltip-label">{formatDate(label)}</p>
          {payload.map((item, index) => (
            <p key={index} className="recharts-tooltip-item" style={{ color: item.color }}>
              {item.name}: {item.name === 'Revenue' ? formatCurrency(item.value) : item.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Show loading state
  if (loading) {
    return (
      <div className="sales-chart">
        <div className="chart-header">
          <h3>Sales Analytics</h3>
        </div>
        <div className="chart-loading">
          <div>Loading chart data...</div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="sales-chart">
        <div className="chart-header">
          <h3>Sales Analytics</h3>
        </div>
        <div className="chart-error">
          <div className="chart-error-icon">📊</div>
          <div className="chart-error-message">Failed to load chart data</div>
          {onRetry && (
            <button className="retry-btn" onClick={onRetry}>
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="sales-chart">
      {/* Chart header with time period filters */}
      <div className="chart-header">
        <h3>Sales Analytics</h3>
        <div className="chart-filters">
          {['7d', '30d', '90d', '1y'].map(filter => (
            <button
              key={filter}
              className={`filter-btn ${activeFilter === filter ? 'active' : ''}`}
              onClick={() => setActiveFilter(filter)}
            >
              {filter === '7d' ? '7 Days' : 
               filter === '30d' ? '30 Days' : 
               filter === '90d' ? '90 Days' : '1 Year'}
            </button>
          ))}
        </div>
      </div>

      <div className="chart-content">
        {/* Interactive chart using Recharts library */}
        <div className="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filteredData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                stroke="#6b7280"
                fontSize={12}
              />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="sales" 
                stroke="var(--primary-color)" 
                strokeWidth={3}
                dot={{ fill: 'var(--primary-color)', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: 'var(--primary-color)', strokeWidth: 2 }}
              />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#f59e0b" 
                strokeWidth={2}
                dot={{ fill: '#f59e0b', strokeWidth: 2, r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Chart legend */}
        <div className="chart-legend">
          <div className="legend-item">
            <div className="legend-color sales"></div>
            <span>Sales Volume</span>
          </div>
          <div className="legend-item">
            <div className="legend-color orders"></div>
            <span>Orders Count</span>
          </div>
          <div className="legend-item">
            <div className="legend-color revenue"></div>
            <span>Revenue</span>
          </div>
        </div>

        {/* Statistics summary */}
        <div className="chart-stats">
          <div className="stat-item">
            <div className="stat-value">{formatCurrency(stats.totalRevenue)}</div>
            <div className="stat-label">Total Revenue</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{stats.totalOrders}</div>
            <div className="stat-label">Total Orders</div>
            <div className={`stat-change ${stats.ordersChange >= 0 ? 'positive' : 'negative'}`}>
              {stats.ordersChange >= 0 ? '↗' : '↘'} {Math.abs(stats.ordersChange).toFixed(1)}%
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{formatCurrency(stats.avgOrderValue)}</div>
            <div className="stat-label">Avg Order Value</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{stats.totalSales.toLocaleString()}</div>
            <div className="stat-label">Sales Volume</div>
            <div className={`stat-change ${stats.salesChange >= 0 ? 'positive' : 'negative'}`}>
              {stats.salesChange >= 0 ? '↗' : '↘'} {Math.abs(stats.salesChange).toFixed(1)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesChart;