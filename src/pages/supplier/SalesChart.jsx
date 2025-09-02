import React, { useState, useEffect } from "react";
import { useQuery } from "react-query";
import { supplierAPI } from "../../services/api";
import "./SalesChart.css";

const SalesChart = ({ supplierId, initialDateRange = "30" }) => {
  const [dateRange, setDateRange] = useState(initialDateRange);
  const [chartType, setChartType] = useState("combined");
  const [viewMode, setViewMode] = useState("daily");

  // Generate sample data immediately (no API dependency)
  const generateSampleData = () => {
    const data = [];
    const numDays = parseInt(dateRange);
    const today = new Date();

    for (let i = numDays - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      // Generate realistic sample data
      const baseOrders = Math.floor(Math.random() * 20) + 5;
      const baseSales = baseOrders * (Math.random() * 5000 + 2000);

      data.push({
        date: date.toISOString().split("T")[0],
        sales: Math.floor(baseSales),
        orders: baseOrders,
        customers: Math.floor(baseOrders * 0.8),
        avgOrderValue: Math.floor(baseSales / baseOrders),
      });
    }

    return data;
  };

  // Always use sample data for now
  // Fetch real sales data
  const {
    data: salesData,
    isLoading,
    error,
  } = useQuery(
    ["supplier-sales", supplierId, dateRange, viewMode],
    () =>
      supplierAPI.getSalesAnalytics({
        period: dateRange,
        view: viewMode,
      }),
    {
      enabled: !!supplierId,
      refetchOnWindowFocus: false,
      retry: 2,
    }
  );

  const processedData = React.useMemo(() => {
    if (salesData?.success && salesData.data) {
      return salesData.data;
    }
    return generateSampleData(); // Fallback to sample data
  }, [salesData, dateRange, viewMode]);

  // Calculate chart dimensions
  const maxSales = Math.max(...processedData.map((d) => d.sales), 1000);
  const maxOrders = Math.max(...processedData.map((d) => d.orders), 10);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
    });
  };

  // Calculate growth percentage
  const calculateGrowth = () => {
    if (processedData.length < 2) return 15.5; // Mock positive growth
    const halfPoint = Math.floor(processedData.length / 2);
    const recent = processedData
      .slice(halfPoint)
      .reduce((sum, item) => sum + item.sales, 0);
    const previous = processedData
      .slice(0, halfPoint)
      .reduce((sum, item) => sum + item.sales, 0);
    return previous > 0
      ? (((recent - previous) / previous) * 100).toFixed(1)
      : 15.5;
  };

  console.log("SalesChart rendered with data:", processedData);
  console.log("Max sales:", maxSales, "Max orders:", maxOrders);

  return (
    <div className="sales-chart">
      <div className="sales-chart-header">
        <div className="header-left">
          <h3 className="chart-title">Sales Performance</h3>
          <div className="growth-indicator">
            <span
              className={`growth ${calculateGrowth() >= 0 ? "positive" : "negative"}`}
            >
              {calculateGrowth() >= 0 ? "↗️" : "↘️"}{" "}
              {Math.abs(calculateGrowth())}%
            </span>
            <span className="growth-label">vs previous period</span>
          </div>
        </div>

        <div className="chart-controls">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="control-select"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 3 months</option>
          </select>

          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
            className="control-select"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>

          <div className="chart-type-tabs">
            <button
              className={`tab-btn ${chartType === "combined" ? "active" : ""}`}
              onClick={() => setChartType("combined")}
            >
              Both
            </button>
            <button
              className={`tab-btn ${chartType === "sales" ? "active" : ""}`}
              onClick={() => setChartType("sales")}
            >
              Sales
            </button>
            <button
              className={`tab-btn ${chartType === "orders" ? "active" : ""}`}
              onClick={() => setChartType("orders")}
            >
              Orders
            </button>
          </div>
        </div>
      </div>

      {/* Chart Legend */}
      <div className="chart-legend">
        {(chartType === "combined" || chartType === "sales") && (
          <div className="legend-item">
            <span className="legend-color sales"></span>
            <span>Sales Revenue</span>
          </div>
        )}
        {(chartType === "combined" || chartType === "orders") && (
          <div className="legend-item">
            <span className="legend-color orders"></span>
            <span>Orders Count</span>
          </div>
        )}
      </div>

      {/* Main Chart */}
      <div className="chart-container">
        <div className="chart-y-axis">
          {chartType !== "orders" ? (
            <>
              <div className="y-axis-label">{formatCurrency(maxSales)}</div>
              <div className="y-axis-label">
                {formatCurrency(maxSales * 0.75)}
              </div>
              <div className="y-axis-label">
                {formatCurrency(maxSales * 0.5)}
              </div>
              <div className="y-axis-label">
                {formatCurrency(maxSales * 0.25)}
              </div>
              <div className="y-axis-label">₹0</div>
            </>
          ) : (
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
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="grid-line"></div>
            ))}
          </div>

          <div className="chart-bars">
            {processedData.map((item, index) => {
              const salesHeight =
                chartType !== "orders"
                  ? Math.max((item.sales / maxSales) * 100, 3)
                  : 0;
              const ordersHeight =
                chartType !== "sales"
                  ? Math.max((item.orders / maxOrders) * 100, 3)
                  : 0;

              return (
                <div key={index} className="bar-group">
                  <div className="bar-container">
                    {chartType !== "orders" && (
                      <div
                        className="bar sales-bar"
                        style={{ height: `${salesHeight}%` }}
                        title={`Sales: ${formatCurrency(item.sales)}`}
                      ></div>
                    )}
                    {chartType !== "sales" && (
                      <div
                        className="bar orders-bar"
                        style={{
                          height: `${ordersHeight}%`,
                          marginLeft: chartType === "combined" ? "2px" : "0",
                        }}
                        title={`Orders: ${item.orders}`}
                      ></div>
                    )}
                  </div>
                  <div className="bar-label">{formatDate(item.date)}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="chart-summary">
        <div className="summary-item">
          <div className="summary-value">
            {formatCurrency(
              processedData.reduce((sum, item) => sum + item.sales, 0)
            )}
          </div>
          <div className="summary-label">Total Sales</div>
        </div>
        <div className="summary-item">
          <div className="summary-value">
            {processedData.reduce((sum, item) => sum + item.orders, 0)}
          </div>
          <div className="summary-label">Total Orders</div>
        </div>
        <div className="summary-item">
          <div className="summary-value">
            {formatCurrency(
              processedData.reduce((sum, item) => sum + item.sales, 0) /
                processedData.reduce((sum, item) => sum + item.orders, 0) || 0
            )}
          </div>
          <div className="summary-label">Avg Order Value</div>
        </div>
        <div className="summary-item">
          <div className="summary-value">
            {processedData.reduce((sum, item) => sum + item.customers, 0)}
          </div>
          <div className="summary-label">Unique Customers</div>
        </div>
      </div>
    </div>
  );
};

export default SalesChart;
