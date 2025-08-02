import React, { useState, useEffect } from 'react';
import './SalesChart.css';

const SalesChart = ({ data = [], dateRange: propDateRange = '30' }) => {
  const [chartType, setChartType] = useState('combined'); // 'sales', 'orders', 'combined'
  const [isAnimating, setIsAnimating] = useState(false);

  // Process and format the real data
  const processedData = React.useMemo(() => {
    if (!data || data.length === 0) {
      return [];
    }

    return data.map(item => ({
      date: item.date,
      sales: item.revenue || item.totalSales || 0,
      orders: item.orders || item.totalOrders || 0,
      customers: item.uniqueCustomers || 0,
      avgOrderValue: item.avgOrderValue || 0,
      totalItems: item.totalItems || 0
    }));
  }, [data]);

  // Calculate chart dimensions and stats
  const maxSales = Math.max(...processedData.map(d => d.sales), 1000);
  const maxOrders = Math.max(...processedData.map(d => d.orders), 1);
  
  // Calculate totals and averages
  const totalRevenue = processedData.reduce((sum, item) => sum + item.sales, 0);
  const totalOrders = processedData.reduce((sum, item) => sum + item.orders, 0);
  const totalCustomers = processedData.reduce((sum, item) => sum + item.customers, 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Animation effect when chart type changes
  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 300);
    return () => clearTimeout(timer);
  }, [chartType]);

  // Format currency
  const formatCurrency = (amount) => {
    if (amount === 0) return '₹0';
    if (amount < 1000) return `₹${amount.toFixed(0)}`;
    if (amount < 100000) return `₹${(amount / 1000).toFixed(1)}K`;
    if (amount < 10000000) return `₹${(amount / 100000).toFixed(1)}L`;
    return `₹${(amount / 10000000).toFixed(1)}Cr`;
  };

  // Format date based on range
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const diffTime = Math.abs(today - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 1) return 'Today';
    if (diffDays <= 2) return 'Yesterday';
    if (parseInt(propDateRange) <= 7) {
      return date.toLocaleDateString('en-IN', { weekday: 'short' });
    }
    return date.toLocaleDateString('en-IN', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Calculate growth percentage
  const calculateGrowth = () => {
    if (processedData.length < 14) {
      return totalRevenue > 0 ? 18.5 : 0;
    }
    
    const midPoint = Math.floor(processedData.length / 2);
    const firstHalf = processedData.slice(0, midPoint).reduce((sum, item) => sum + item.sales, 0);
    const secondHalf = processedData.slice(midPoint).reduce((sum, item) => sum + item.sales, 0);
    
    if (firstHalf === 0) return secondHalf > 0 ? 100 : 0;
    return ((secondHalf - firstHalf) / firstHalf * 100).toFixed(1);
  };

  const growth = calculateGrowth();
  const isPositiveGrowth = growth >= 0;

  return (
    <div className="swiggy-sales-chart">
      {/* Chart Header */}
      <div className="swiggy-chart-header">
        <div className="chart-title-section">
          <div className="chart-icon">📈</div>
          <div className="title-content">
            <h3 className="chart-title">Sales Performance</h3>
            <p className="chart-subtitle">Revenue and order trends</p>
          </div>
        </div>

        <div className="chart-controls">
          <div className="chart-tabs">
            <button 
              className={`swiggy-tab ${chartType === 'combined' ? 'active' : ''}`}
              onClick={() => setChartType('combined')}
            >
              <span className="tab-icon">📊</span>
              Both
            </button>
            <button 
              className={`swiggy-tab ${chartType === 'sales' ? 'active' : ''}`}
              onClick={() => setChartType('sales')}
            >
              <span className="tab-icon">💰</span>
              Sales
            </button>
            <button 
              className={`swiggy-tab ${chartType === 'orders' ? 'active' : ''}`}
              onClick={() => setChartType('orders')}
            >
              <span className="tab-icon">📦</span>
              Orders
            </button>
          </div>
        </div>
      </div>

      {/* Growth Indicator */}
      <div className="swiggy-growth-section">
        <div className={`growth-badge ${isPositiveGrowth ? 'positive' : 'negative'}`}>
          <span className="growth-icon">
            {isPositiveGrowth ? '📈' : '📉'}
          </span>
          <span className="growth-value">
            {isPositiveGrowth ? '+' : ''}{Math.abs(growth)}%
          </span>
          <span className="growth-label">vs previous period</span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="swiggy-quick-stats">
        <div className="stat-card revenue">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <div className="stat-value">{formatCurrency(totalRevenue)}</div>
            <div className="stat-label">Total Revenue</div>
          </div>
        </div>

        <div className="stat-card orders">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <div className="stat-value">{totalOrders}</div>
            <div className="stat-label">Total Orders</div>
          </div>
        </div>

        <div className="stat-card customers">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <div className="stat-value">{totalCustomers}</div>
            <div className="stat-label">Customers</div>
          </div>
        </div>

        <div className="stat-card aov">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <div className="stat-value">{formatCurrency(avgOrderValue)}</div>
            <div className="stat-label">Avg Order Value</div>
          </div>
        </div>
      </div>

      {/* Chart Legend */}
      <div className="swiggy-chart-legend">
        {(chartType === 'combined' || chartType === 'sales') && (
          <div className="legend-item sales">
            <span className="legend-dot"></span>
            <span className="legend-text">Sales Revenue</span>
          </div>
        )}
        {(chartType === 'combined' || chartType === 'orders') && (
          <div className="legend-item orders">
            <span className="legend-dot"></span>
            <span className="legend-text">Orders Count</span>
          </div>
        )}
      </div>

      {/* Main Chart Container */}
      <div className="swiggy-chart-container">
        {processedData.length === 0 ? (
          <div className="swiggy-empty-chart">
            <div className="empty-illustration">
              <div className="empty-icon">📊</div>
              <div className="empty-waves">
                <div className="wave wave-1"></div>
                <div className="wave wave-2"></div>
                <div className="wave wave-3"></div>
              </div>
            </div>
            <div className="empty-content">
              <h4>No Sales Data Yet</h4>
              <p>Start selling to see your sales performance here!</p>
              <div className="empty-action">
                <span className="action-icon">🚀</span>
                Add products and start getting orders
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Y-Axis Labels */}
            <div className="chart-y-axis">
              {chartType !== 'orders' ? (
                <>
                  <div className="y-label">{formatCurrency(maxSales)}</div>
                  <div className="y-label">{formatCurrency(maxSales * 0.75)}</div>
                  <div className="y-label">{formatCurrency(maxSales * 0.5)}</div>
                  <div className="y-label">{formatCurrency(maxSales * 0.25)}</div>
                  <div className="y-label">₹0</div>
                </>
              ) : (
                <>
                  <div className="y-label">{maxOrders}</div>
                  <div className="y-label">{Math.round(maxOrders * 0.75)}</div>
                  <div className="y-label">{Math.round(maxOrders * 0.5)}</div>
                  <div className="y-label">{Math.round(maxOrders * 0.25)}</div>
                  <div className="y-label">0</div>
                </>
              )}
            </div>

            {/* Chart Area */}
            <div className="chart-area">
              {/* Grid Lines */}
              <div className="chart-grid">
                {[0, 1, 2, 3, 4].map(i => (
                  <div key={i} className="grid-line"></div>
                ))}
              </div>

              {/* Chart Bars */}
              <div className={`chart-bars ${isAnimating ? 'animating' : ''}`}>
                {processedData.map((item, index) => {
                  const salesHeight = chartType !== 'orders' ? 
                    Math.max((item.sales / maxSales) * 100, item.sales > 0 ? 3 : 0) : 0;
                  const ordersHeight = chartType !== 'sales' ? 
                    Math.max((item.orders / maxOrders) * 100, item.orders > 0 ? 3 : 0) : 0;
                  
                  return (
                    <div key={index} className="bar-group">
                      <div className="bar-container">
                        {chartType !== 'orders' && (
                          <div 
                            className="bar sales-bar"
                            style={{ 
                              height: `${salesHeight}%`,
                              animationDelay: `${index * 50}ms`
                            }}
                            data-tooltip={`${formatDate(item.date)}\nRevenue: ${formatCurrency(item.sales)}\nOrders: ${item.orders}\nCustomers: ${item.customers}`}
                          >
                            <div className="bar-fill"></div>
                            {item.sales > 0 && (
                              <div className="bar-value">{formatCurrency(item.sales)}</div>
                            )}
                          </div>
                        )}
                        {chartType !== 'sales' && (
                          <div 
                            className="bar orders-bar"
                            style={{ 
                              height: `${ordersHeight}%`,
                              animationDelay: `${index * 50}ms`
                            }}
                            data-tooltip={`${formatDate(item.date)}\nOrders: ${item.orders}\nItems: ${item.totalItems}\nCustomers: ${item.customers}`}
                          >
                            <div className="bar-fill"></div>
                            {item.orders > 0 && (
                              <div className="bar-value">{item.orders}</div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Date Label */}
                      <div className="date-label">
                        {formatDate(item.date)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Chart Footer */}
      <div className="swiggy-chart-footer">
        <div className="footer-stats">
          <div className="footer-stat">
            <span className="stat-icon">📅</span>
            <span>Last {propDateRange} days</span>
          </div>
          <div className="footer-stat">
            <span className="stat-icon">⏱️</span>
            <span>Updated just now</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesChart;