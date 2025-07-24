import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { supplierAPI } from '../../services/api';
import './SalesChart.css';

const SalesChart = ({ supplierId, initialDateRange = '30' }) => {
  const [dateRange, setDateRange] = useState(initialDateRange);
  const [chartType, setChartType] = useState('combined'); // 'sales', 'orders', 'combined'
  const [viewMode, setViewMode] = useState('daily'); // 'daily', 'weekly', 'monthly'

  // Fetch dynamic sales data from API
  const { data: salesData, isLoading, error, refetch } = useQuery(
    ['supplier-sales-chart', supplierId, dateRange, viewMode],
    () => supplierAPI.getSalesData({
      supplierId,
      days: dateRange,
      groupBy: viewMode
    }),
    {
      enabled: !!supplierId,
      staleTime: 2 * 60 * 1000, // 2 minutes
      refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
      refetchOnWindowFocus: true,
    }
  );

  // Process and format the data
  const processedData = React.useMemo(() => {
    if (!salesData?.data) return [];
    
    return salesData.data.map(item => ({
      date: item.date,
      sales: item.totalSales || 0,
      orders: item.totalOrders || 0,
      customers: item.uniqueCustomers || 0,
      avgOrderValue: item.totalSales / (item.totalOrders || 1)
    }));
  }, [salesData]);

  // Calculate chart dimensions
  const maxSales = Math.max(...processedData.map(d => d.sales), 1);
  const maxOrders = Math.max(...processedData.map(d => d.orders), 1);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format date based on view mode
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    switch(viewMode) {
      case 'weekly':
        return `Week ${Math.ceil(date.getDate() / 7)}`;
      case 'monthly':
        return date.toLocaleDateString('en-IN', { month: 'short' });
      default:
        return date.toLocaleDateString('en-IN', { 
          month: 'short', 
          day: 'numeric' 
        });
    }
  };

  // Calculate growth percentage
  const calculateGrowth = () => {
    if (processedData.length < 2) return 0;
    const recent = processedData.slice(-7).reduce((sum, item) => sum + item.sales, 0);
    const previous = processedData.slice(-14, -7).reduce((sum, item) => sum + item.sales, 0);
    return previous > 0 ? ((recent - previous) / previous * 100).toFixed(1) : 0;
  };

  if (isLoading) {
    return (
      <div className="sales-chart loading">
        <div className="loading-skeleton">
          <div className="skeleton-header"></div>
          <div className="skeleton-chart"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sales-chart error">
        <div className="error-message">
          <h3>Unable to load sales data</h3>
          <p>{error.message}</p>
          <button onClick={() => refetch()} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="sales-chart dynamic">
      <div className="sales-chart-header">
        <div className="header-left">
          <h3>Sales Performance</h3>
          <div className="growth-indicator">
            <span className={`growth ${calculateGrowth() >= 0 ? 'positive' : 'negative'}`}>
              {calculateGrowth() >= 0 ? '↗' : '↘'} {Math.abs(calculateGrowth())}%
            </span>
            <span className="growth-label">vs last period</span>
          </div>
        </div>

        <div className="chart-controls">
          {/* Date Range Selector */}
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
            className="control-select"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 3 months</option>
            <option value="365">Last year</option>
          </select>

          {/* View Mode Selector */}
          <select 
            value={viewMode} 
            onChange={(e) => setViewMode(e.target.value)}
            className="control-select"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>

          {/* Chart Type Selector */}
          <div className="chart-type-tabs">
            <button 
              className={chartType === 'combined' ? 'active' : ''}
              onClick={() => setChartType('combined')}
            >
              Both
            </button>
            <button 
              className={chartType === 'sales' ? 'active' : ''}
              onClick={() => setChartType('sales')}
            >
              Sales
            </button>
            <button 
              className={chartType === 'orders' ? 'active' : ''}
              onClick={() => setChartType('orders')}
            >
              Orders
            </button>
          </div>
        </div>
      </div>

      {/* Chart Legend */}
      <div className="chart-legend">
        {(chartType === 'combined' || chartType === 'sales') && (
          <div className="legend-item">
            <span className="legend-color sales"></span>
            <span>Sales Revenue</span>
          </div>
        )}
        {(chartType === 'combined' || chartType === 'orders') && (
          <div className="legend-item">
            <span className="legend-color orders"></span>
            <span>Orders Count</span>
          </div>
        )}
      </div>

      {/* Main Chart */}
      <div className="chart-container">
        <div className="chart-y-axis">
          {chartType !== 'orders' && (
            <>
              <div className="y-axis-label">{formatCurrency(maxSales)}</div>
              <div className="y-axis-label">{formatCurrency(maxSales * 0.75)}</div>
              <div className="y-axis-label">{formatCurrency(maxSales * 0.5)}</div>
              <div className="y-axis-label">{formatCurrency(maxSales * 0.25)}</div>
              <div className="y-axis-label">₹0</div>
            </>
          )}
          {chartType === 'orders' && (
            <>
              <div className="y-axis-label">{maxOrders}</div>
              <div className="y-axis-label">{Math.round(maxOrders * 0.75)}</div>
              <div className="y-axis-label">{Math.round(maxOrders * 0.5)}</div>
              <div className="y-axis-label">{Math.round(maxOrders * 0.25)}</div>
              <div className="y-axis-label">0</div>
            </>
          )}
        </div>

        <div className="chart-main">
          <div className="chart-grid">
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} className="grid-line"></div>
            ))}
          </div>

          <div className="chart-bars">
            {processedData.map((item, index) => {
              const salesHeight = chartType !== 'orders' ? (item.sales / maxSales) * 100 : 0;
              const ordersHeight = chartType !== 'sales' ? (item.orders / maxOrders) * 100 : 0;
              
              return (
                <div key={index} className="bar-group" data-index={index}>
                  <div className="bar-container">
                    {chartType !== 'orders' && (
                      <div 
                        className="bar sales-bar"
                        style={{ height: `${salesHeight}%` }}
                        title={`Sales: ${formatCurrency(item.sales)}\nOrders: ${item.orders}\nAvg: ${formatCurrency(item.avgOrderValue)}`}
                        onMouseEnter={(e) => showTooltip(e, item)}
                        onMouseLeave={hideTooltip}
                      ></div>
                    )}
                    {chartType !== 'sales' && (
                      <div 
                        className="bar orders-bar"
                        style={{ height: `${ordersHeight}%` }}
                        title={`Orders: ${item.orders}\nSales: ${formatCurrency(item.sales)}`}
                        onMouseEnter={(e) => showTooltip(e, item)}
                        onMouseLeave={hideTooltip}
                      ></div>
                    )}
                  </div>
                  <div className="bar-label">
                    {formatDate(item.date)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Dynamic Summary */}
      <div className="chart-summary">
        <div className="summary-item">
          <span className="summary-label">Total Sales:</span>
          <span className="summary-value">
            {formatCurrency(processedData.reduce((sum, item) => sum + item.sales, 0))}
          </span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Total Orders:</span>
          <span className="summary-value">
            {processedData.reduce((sum, item) => sum + item.orders, 0)}
          </span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Avg Order Value:</span>
          <span className="summary-value">
            {formatCurrency(
              processedData.reduce((sum, item) => sum + item.sales, 0) /
              processedData.reduce((sum, item) => sum + item.orders, 0) || 0
            )}
          </span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Unique Customers:</span>
          <span className="summary-value">
            {processedData.reduce((sum, item) => sum + item.customers, 0)}
          </span>
        </div>
      </div>

      {/* Tooltip */}
      <div id="chart-tooltip" className="chart-tooltip"></div>
    </div>
  );

  // Tooltip functions
  function showTooltip(e, item) {
    const tooltip = document.getElementById('chart-tooltip');
    tooltip.innerHTML = `
      <div class="tooltip-date">${formatDate(item.date)}</div>
      <div class="tooltip-item">
        <span class="tooltip-color sales"></span>
        Sales: ${formatCurrency(item.sales)}
      </div>
      <div class="tooltip-item">
        <span class="tooltip-color orders"></span>
        Orders: ${item.orders}
      </div>
      <div class="tooltip-item">
        Customers: ${item.customers}
      </div>
      <div class="tooltip-item">
        Avg Order: ${formatCurrency(item.avgOrderValue)}
      </div>
    `;
    tooltip.style.display = 'block';
    tooltip.style.left = e.pageX + 10 + 'px';
    tooltip.style.top = e.pageY - 10 + 'px';
  }

  function hideTooltip() {
    const tooltip = document.getElementById('chart-tooltip');
    tooltip.style.display = 'none';
  }
};

export default SalesChart;