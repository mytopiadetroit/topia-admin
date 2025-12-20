import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import {
  fetchReturningCustomers,
  fetchSalesComparison,
  fetchTopSellingProducts,
  fetchRevenueAnalytics,
  fetchCustomerGrowth
} from '@/services/service';
import { toast } from 'react-toastify';


const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

const MotionDiv = motion.div;

const AnalyticsTab = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');
  const [showReturningCustomersModal, setShowReturningCustomersModal] = useState(false);
  
  // Analytics data states
  const [returningCustomers, setReturningCustomers] = useState(null);
  const [salesComparison, setSalesComparison] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [revenueData, setRevenueData] = useState(null);
  const [customerGrowth, setCustomerGrowth] = useState(null);



  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [returning, sales, products, revenue, growth] = await Promise.all([
        fetchReturningCustomers(router, period),
        fetchSalesComparison(router),
        fetchTopSellingProducts(router, 10, period),
        fetchRevenueAnalytics(router, period),
        fetchCustomerGrowth(router, period)
      ]);

      if (returning?.success) setReturningCustomers(returning.data);
      if (sales?.success) setSalesComparison(sales.data);
      if (products?.success) setTopProducts(products.data);
      if (revenue?.success) setRevenueData(revenue.data);
      if (growth?.success) setCustomerGrowth(growth.data);
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  // Chart configurations
  const salesChartOptions = {
    chart: {
      type: 'bar',
      toolbar: { show: false },
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800
      }
    },
    plotOptions: {
      bar: {
        borderRadius: 8,
        columnWidth: '60%',
        dataLabels: { position: 'top' }
      }
    },
    dataLabels: {
      enabled: true,
      formatter: (val) => `$${val.toFixed(0)}`,
      offsetY: -20,
      style: {
        fontSize: '12px',
        colors: ['#304758']
      }
    },
    xaxis: {
      categories: ['2 Weeks Ago', 'Last Week', 'This Week'],
      labels: {
        style: { fontSize: '12px' }
      }
    },
    yaxis: {
      labels: {
        formatter: (val) => `$${val.toFixed(0)}`
      }
    },
    colors: ['#4299E1', '#48BB78', '#9F7AEA'],
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'light',
        type: 'vertical',
        shadeIntensity: 0.5,
        opacityFrom: 0.9,
        opacityTo: 0.7
      }
    }
  };

  const salesChartSeries = salesComparison ? [{
    name: 'Sales',
    data: [
      salesComparison.twoWeeksAgo?.sales || 0,
      salesComparison.previousWeek?.sales || 0,
      salesComparison.currentWeek?.sales || 0
    ]
  }] : [];

  const dailySalesChartOptions = {
    chart: {
      type: 'area',
      toolbar: { show: false },
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800
      }
    },
    stroke: {
      curve: 'smooth',
      width: 3
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.2
      }
    },
    xaxis: {
      categories: salesComparison?.dailySales?.map(d => {
        const date = new Date(d._id);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }) || [],
      labels: {
        style: { fontSize: '11px' }
      }
    },
    yaxis: {
      labels: {
        formatter: (val) => `$${val.toFixed(0)}`
      }
    },
    colors: ['#9F7AEA'],
    dataLabels: { enabled: false },
    tooltip: {
      y: {
        formatter: (val) => `$${val.toFixed(2)}`
      }
    }
  };

  const dailySalesChartSeries = [{
    name: 'Daily Sales',
    data: salesComparison?.dailySales?.map(d => d.sales) || []
  }];

  const returningCustomersChartOptions = {
    chart: {
      type: 'donut',
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800
      }
    },
    labels: ['Returning Customers', 'New Customers'],
    colors: ['#48BB78', '#4299E1'],
    legend: {
      position: 'bottom',
      fontSize: '14px'
    },
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total Visitors',
              fontSize: '16px',
              fontWeight: 600
            }
          }
        }
      }
    },
    dataLabels: {
      enabled: true,
      formatter: (val) => `${val.toFixed(1)}%`
    }
  };

  const returningCustomersChartSeries = returningCustomers ? [
    returningCustomers.totalReturning || 0,
    (returningCustomers.totalVisitors - returningCustomers.totalReturning) || 0
  ] : [];

  const customerGrowthChartOptions = {
    chart: {
      type: 'line',
      toolbar: { show: false },
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800
      }
    },
    stroke: {
      curve: 'smooth',
      width: 3
    },
    xaxis: {
      categories: customerGrowth?.dailyRegistrations?.map(d => {
        const date = new Date(d._id);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }) || [],
      labels: {
        style: { fontSize: '11px' }
      }
    },
    colors: ['#F56565'],
    markers: {
      size: 5,
      colors: ['#F56565'],
      strokeWidth: 2,
      hover: { size: 7 }
    },
    dataLabels: { enabled: false },
    tooltip: {
      y: {
        formatter: (val) => `${val} customers`
      }
    }
  };

  const customerGrowthChartSeries = [{
    name: 'New Registrations',
    data: customerGrowth?.dailyRegistrations?.map(d => d.count) || []
  }];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header with Period Selector */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <div className="bg-[#80A6F7] p-4 rounded-2xl shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-[#80A6F7]">
              Analytics Dashboard
            </h2>
            <p className="text-gray-600 mt-1 font-medium">Comprehensive insights into your business performance</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm font-semibold text-gray-700">Time Period:</label>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-5 py-3 border-2 border-[#80A6F7]/30 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#80A6F7] focus:border-transparent font-medium text-gray-700 shadow-sm hover:shadow-md transition-all cursor-pointer"
          >
            <option value="7">📅 Last 7 Days</option>
            <option value="30">📅 Last 30 Days</option>
            <option value="60">📅 Last 60 Days</option>
            <option value="90">📅 Last 90 Days</option>
          </select>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative bg-[#80A6F7] rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-white/90 uppercase tracking-wide">Total Revenue</p>
              <div className="bg-white/20 p-2 rounded-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-black text-white mb-2">
              ${revenueData?.totalRevenue?.toFixed(2) || '0.00'}
            </p>
            <p className="text-sm text-white/90 font-medium">
              Avg: ${revenueData?.avgOrderValue?.toFixed(2) || '0.00'} per order
            </p>
          </div>
        </MotionDiv>

        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative bg-[#80A6F7] rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-white/90 uppercase tracking-wide">Sales Growth</p>
              <div className="bg-white/20 p-2 rounded-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-black text-white mb-2">
              {salesComparison?.growth >= 0 ? '+' : ''}{salesComparison?.growth || 0}%
            </p>
            <p className="text-sm text-white/90 font-medium">
              {salesComparison?.growth >= 0 ? '↑ Increase' : '↓ Decrease'} vs last week
            </p>
          </div>
        </MotionDiv>

        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative bg-[#80A6F7] rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 overflow-hidden cursor-pointer"
          onClick={() => setShowReturningCustomersModal(true)}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-white/90 uppercase tracking-wide">Return Rate</p>
              <div className="bg-white/20 p-2 rounded-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-black text-white mb-2">
              {returningCustomers?.returnRate || 0}%
            </p>
            <div className="flex items-center justify-between">
              <p className="text-sm text-white/90 font-medium">
                {returningCustomers?.totalReturning || 0} returning
              </p>
              <div className="flex items-center gap-1 text-white/90 text-xs font-bold bg-white/20 px-2 py-1 rounded-lg">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                View
              </div>
            </div>
          </div>
        </MotionDiv>

        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="relative bg-[#80A6F7] rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-white/90 uppercase tracking-wide">Total Customers</p>
              <div className="bg-white/20 p-2 rounded-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-black text-white mb-2">
              {customerGrowth?.totalCustomers || 0}
            </p>
            <p className="text-sm text-white/90 font-medium">
              {customerGrowth?.verifiedCustomers || 0} verified members
            </p>
          </div>
        </MotionDiv>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Sales Comparison Chart */}
        <MotionDiv
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white border-2 border-[#80A6F7]/20 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-[#80A6F7] p-3 rounded-xl shadow-md">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">Weekly Sales Comparison</h3>
              <p className="text-sm text-gray-500 font-medium">
                Compare sales performance across weeks
              </p>
            </div>
          </div>
          <div className="bg-[#80A6F7]/10 rounded-xl p-4">
            {typeof window !== 'undefined' && (
              <Chart
                options={salesChartOptions}
                series={salesChartSeries}
                type="bar"
                height={300}
              />
            )}
          </div>
        </MotionDiv>

        {/* Returning Customers Chart */}
        <MotionDiv
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="bg-white border-2 border-[#80A6F7]/20 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-[#80A6F7] p-3 rounded-xl shadow-md">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">Customer Retention</h3>
              <p className="text-sm text-gray-500 font-medium">
                New vs returning customer distribution
              </p>
            </div>
          </div>
          <div className="bg-[#80A6F7]/10 rounded-xl p-4">
            {typeof window !== 'undefined' && (
              <Chart
                options={returningCustomersChartOptions}
                series={returningCustomersChartSeries}
                type="donut"
                height={300}
              />
            )}
          </div>
        </MotionDiv>
      </div>

      {/* Daily Sales Trend */}
      <MotionDiv
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="bg-white border-2 border-purple-100 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all mb-8"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-[#80A6F7] p-3 rounded-xl shadow-md">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">Daily Sales Trend</h3>
            <p className="text-sm text-gray-500 font-medium">
              Track daily sales performance over time
            </p>
          </div>
        </div>
        <div className="bg-[#80A6F7]/10 rounded-xl p-4">
          {typeof window !== 'undefined' && (
            <Chart
              options={dailySalesChartOptions}
              series={dailySalesChartSeries}
              type="area"
              height={300}
            />
          )}
        </div>
      </MotionDiv>

      {/* Customer Growth Trend */}
      <MotionDiv
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
        className="bg-white border-2 border-purple-100 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all mb-8"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-[#80A6F7] p-3 rounded-xl shadow-md">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">Customer Growth Trend</h3>
            <p className="text-sm text-gray-500 font-medium">
              Daily new customer registrations
            </p>
          </div>
        </div>
        <div className="bg-[#80A6F7]/10 rounded-xl p-4">
          {typeof window !== 'undefined' && (
            <Chart
              options={customerGrowthChartOptions}
              series={customerGrowthChartSeries}
              type="line"
              height={300}
            />
          )}
        </div>
      </MotionDiv>

      {/* Returning Customers Modal */}
      {showReturningCustomersModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <MotionDiv
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-[#80A6F7]/20"
          >
            {/* Modal Header */}
            <div className="relative bg-[#80A6F7] p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">Returning Customers</h3>
                    <p className="text-white/90 text-sm mt-1">
                      Customers who made repeat visits • Last {period} days
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowReturningCustomersModal(false)}
                  className="text-white/80 hover:text-white hover:bg-white/20 transition-all p-2 rounded-lg"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Stats Bar */}
              <div className="mt-4 grid grid-cols-3 gap-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                  <p className="text-white/90 text-xs font-medium">Total Returning</p>
                  <p className="text-white text-2xl font-bold mt-1">{returningCustomers?.totalReturning || 0}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                  <p className="text-white/90 text-xs font-medium">Return Rate</p>
                  <p className="text-white text-2xl font-bold mt-1">{returningCustomers?.returnRate || 0}%</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                  <p className="text-white/90 text-xs font-medium">Avg Visits</p>
                  <p className="text-white text-2xl font-bold mt-1">{returningCustomers?.avgVisits || 0}</p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="sticky top-0 bg-[#80A6F7]/10 shadow-sm z-10">
                    <tr className="border-b-2 border-[#80A6F7]/30">
                      <th className="text-left py-4 px-4 text-xs font-bold text-[#80A6F7] uppercase tracking-wider">Customer</th>
                      <th className="text-left py-4 px-4 text-xs font-bold text-[#80A6F7] uppercase tracking-wider">Phone</th>
                      <th className="text-center py-4 px-4 text-xs font-bold text-[#80A6F7] uppercase tracking-wider">Total Visits</th>
                      <th className="text-left py-4 px-4 text-xs font-bold text-[#80A6F7] uppercase tracking-wider">Last Visit</th>
                      <th className="text-left py-4 px-4 text-xs font-bold text-[#80A6F7] uppercase tracking-wider">Recent Visits</th>
                      <th className="text-center py-4 px-4 text-xs font-bold text-[#80A6F7] uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {returningCustomers?.returningCustomersList?.map((customer, index) => (
                      <tr 
                        key={customer._id} 
                        className="border-b border-gray-100 hover:bg-[#80A6F7]/10 transition-all duration-200 group"
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#80A6F7] flex items-center justify-center text-white font-bold shadow-md">
                              {customer.customerName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 group-hover:text-[#80A6F7] transition-colors">{customer.customerName}</p>
                              <p className="text-xs text-gray-500">{customer.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <span className="text-sm text-gray-700 font-medium">{customer.customerPhone}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#80A6F7] text-white shadow-md">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm font-bold">{customer.totalVisits}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-col bg-white rounded-lg p-2 shadow-sm border border-gray-100">
                            <span className="font-semibold text-gray-900 text-sm">
                              {new Date(customer.lastVisit).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </span>
                            <span className="text-xs text-[#80A6F7] font-medium">
                              {new Date(customer.lastVisit).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-col gap-1.5">
                            {customer.visits.slice(0, 3).map((visit, idx) => (
                              <div key={idx} className="flex items-center gap-2 bg-white rounded-md px-2 py-1 shadow-sm border border-gray-100">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#80A6F7]"></div>
                                <span className="text-xs text-gray-700 font-medium">
                                  {new Date(visit.timestamp).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {new Date(visit.timestamp).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                            ))}
                            {customer.visits.length > 3 && (
                              <span className="text-xs text-[#80A6F7] font-bold ml-2">
                                +{customer.visits.length - 3} more
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          {customer.isMember ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold bg-green-500 text-white shadow-md">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Member
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold bg-gray-200 text-gray-700 shadow-sm">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                              </svg>
                              Guest
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {(!returningCustomers?.returningCustomersList || returningCustomers.returningCustomersList.length === 0) && (
                  <div className="text-center py-16">
                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-[#80A6F7]/20 mb-6">
                      <svg className="w-12 h-12 text-[#80A6F7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <p className="text-xl font-bold text-gray-700 mb-2">No Returning Customers</p>
                    <p className="text-sm text-gray-500">Try selecting a different time period to see results</p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-6 border-t border-[#80A6F7]/20 bg-[#80A6F7]/10">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#80A6F7] animate-pulse"></div>
                <span className="text-sm font-medium text-gray-700">
                  Showing <span className="font-bold text-[#80A6F7]">{returningCustomers?.returningCustomersList?.length || 0}</span> returning customers
                </span>
              </div>
              <button
                onClick={() => setShowReturningCustomersModal(false)}
                className="px-6 py-3 bg-[#80A6F7] text-white rounded-xl hover:bg-[#80A6F7]/90 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Close
              </button>
            </div>
          </MotionDiv>
        </div>
      )}

      {/* Top Selling Products Table */}
      <MotionDiv
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.9 }}
        className="bg-white border-2 border-purple-100 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-[#80A6F7] p-3 rounded-xl shadow-md">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">Top Selling Products</h3>
            <p className="text-sm text-gray-500 font-medium">
              Best performing products in the selected period
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Rank</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Product</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Quantity Sold</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Revenue</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Orders</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Stock</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((product, index) => (
                <tr key={product._id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      index === 0 ? 'bg-yellow-100 text-yellow-800' :
                      index === 1 ? 'bg-gray-100 text-gray-800' :
                      index === 2 ? 'bg-orange-100 text-orange-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      #{index + 1}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      {product.image && (
                        <img
                          src={product.image}
                          alt={product.productName}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      )}
                      <span className="font-medium">{product.productName}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-purple-600">
                    {product.totalQuantity}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-green-600">
                    ${product.totalRevenue?.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right">{product.orderCount}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      product.currentStock === 0 ? 'bg-red-100 text-red-800' :
                      product.currentStock < 5 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {product.currentStock || 0} left
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </MotionDiv>
    </div>
  );
};

export default AnalyticsTab;
