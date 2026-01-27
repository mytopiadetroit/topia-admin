import React, { useEffect, useMemo, useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown,
  X,
  Eye,
  Mail,
  Download,
  BarChart3,
  LayoutDashboard
} from 'lucide-react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import AnalyticsTab from '@/components/AnalyticsTab';
// import { useRouter } from 'next/router';
import { fetchAllUsers, fetchAllOrders, fetchTodayRegistrations, fetchTodayLogins, fetchRegistrationsByDate, fetchLoginsByDate, fetchPendingVerificationsCount, fetchUserById, toast, fetchAllProducts, fetchAllVisitors, exportCustomersData } from '@/service/service';
import { RegistrationsModal, LoginsModal } from '@/components/dashboard-modals';
import BirthdayCard from '@/components/BirthdayCard';

export default function Dashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [todayLogins, setTodayLogins] = useState(0);
  const [pendingVerifications, setPendingVerifications] = useState(0);
  const [todayCheckIns, setTodayCheckIns] = useState(0);
  const [showRegistrationsModal, setShowRegistrationsModal] = useState(false);
  const [showLoginsModal, setShowLoginsModal] = useState(false);
  const [registrationsList, setRegistrationsList] = useState([]);
  const [loginsList, setLoginsList] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [registrationsPagination, setRegistrationsPagination] = useState(null);
  const [loginsPagination, setLoginsPagination] = useState(null);
  const [registrationsPage, setRegistrationsPage] = useState(1);
  const [loginsPage, setLoginsPage] = useState(1);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userModalLoading, setUserModalLoading] = useState(false);
  const [michiganTime, setMichiganTime] = useState('');
  const [exportLoading, setExportLoading] = useState(false);

  // Export customers data - Using service helper
  const handleExportCustomers = async () => {
    try {
      setExportLoading(true);
      toast.info('Preparing export... Please wait');

      await exportCustomersData(router);
      
      toast.success('Customer data exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data. Please try again.');
    } finally {
      setExportLoading(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [uRes, oRes, pRes, lRes, pvRes, vRes] = await Promise.all([
          fetchAllUsers(router, { page: 1, limit: 10000 }), // High limit for birthday calculations
          fetchAllOrders(router, { page: 1, limit: 100 }),
          fetchAllProducts(router, { page: 1, limit: 100 }),
          fetchTodayLogins(router),
          fetchPendingVerificationsCount(router),
          fetchAllVisitors(router, { page: 1, limit: 1 }) // Just need statistics
        ]);
        if (uRes?.success) setUsers(uRes.data || []);
        if (oRes?.success) setOrders(oRes.data || []);
        if (pRes?.success) setProducts(pRes.data || []);
        if (lRes?.success) setTodayLogins(lRes.count || 0);
        if (pvRes?.success) setPendingVerifications(pvRes.count || 0);
        if (vRes?.success) setTodayCheckIns(vRes.statistics?.todayVisitors || 0);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [router]);

  // Timer for Michigan time display
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      
      // Get Michigan time
      const michiganTimeStr = now.toLocaleString('en-US', {
        timeZone: 'America/Detroit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
      setMichiganTime(michiganTimeStr);
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const handleViewUser = async (userId) => {
    try {
      setUserModalLoading(true);
      setShowUserModal(true);
      const response = await fetchUserById(userId, router);
      if (response.success) {
        setSelectedUser(response.data);
      } else {
        toast.error('Failed to load user details');
        setShowUserModal(false);
      }
    } catch (error) {
      console.error('Error loading user details:', error);
      toast.error('Error loading user details');
      setShowUserModal(false);
    } finally {
      setUserModalLoading(false);
    }
  };

  const closeUserModal = () => {
    setShowUserModal(false);
    setSelectedUser(null);
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800',
      suspend: 'bg-red-100 text-red-800',
      verified: 'bg-green-100 text-green-800',
      incomplete: 'bg-purple-100 text-purple-800'
    };
    const label = status || 'pending';
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[label] || 'bg-gray-100 text-gray-800'}`}>
        {label}
      </span>
    );
  };

  const handleViewRegistrations = async (page = 1) => {
    try {
      setModalLoading(true);
      setShowRegistrationsModal(true);
      setRegistrationsPage(page);
      const res = await fetchTodayRegistrations(router, { page, limit: 200 });
      if (res?.success) {
        setRegistrationsList(res.data || []);
        setRegistrationsPagination(res.pagination || null);
      }
    } catch (error) {
      console.error('Error loading registrations:', error);
    } finally {
      setModalLoading(false);
    }
  };

  const handleViewLogins = async (page = 1) => {
    try {
      setModalLoading(true);
      setShowLoginsModal(true);
      setLoginsPage(page);
      const res = await fetchTodayLogins(router, { page, limit: 200 });
      if (res?.success) {
        setLoginsList(res.data || []);
        setLoginsPagination(res.pagination || null);
      }
    } catch (error) {
      console.error('Error loading logins:', error);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDateRangeSearch = async (type, page = 1) => {
    if (!dateRange.start || !dateRange.end) {
      alert('Please select both start and end dates');
      return;
    }
    
    try {
      setModalLoading(true);
      if (type === 'registrations') {
        setRegistrationsPage(page);
        const res = await fetchRegistrationsByDate(router, dateRange.start, dateRange.end, { page, limit: 200 });
        if (res?.success) {
          setRegistrationsList(res.data || []);
          setRegistrationsPagination(res.pagination || null);
        }
      } else {
        setLoginsPage(page);
        const res = await fetchLoginsByDate(router, dateRange.start, dateRange.end, { page, limit: 200 });
        if (res?.success) {
          setLoginsList(res.data || []);
          setLoginsPagination(res.pagination || null);
        }
      }
    } catch (error) {
      console.error('Error loading data by date:', error);
    } finally {
      setModalLoading(false);
    }
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const todayRegistrations = useMemo(() => {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    return users.filter(u => {
      const created = new Date(u.createdAt);
      return created >= start && created < end;
    }).length;
  }, [users]);

  // Removed useMemo - now using state from API

  const totalRegistrations = useMemo(() => users.length, [users]);
  const verifiedRegistrations = useMemo(() => users.filter(u => u.status === 'verified').length, [users]);
  const fulfilledOrders = useMemo(() => orders.filter(o => o.status === 'fulfilled').length, [orders]);
  const completedOrders = useMemo(() => orders.filter(o => o.status === 'completed').length, [orders]);
  const pendingOrders = useMemo(() => orders.filter(o => o.status === 'pending').length, [orders]);
  const outOfStockProducts = useMemo(() => products.filter(p => p.stock === 0).length, [products]);

  const stats = [
    {
      title: 'Total Registrations',
      value: String(totalRegistrations),
      icon: '👥',
      bgColor: 'bg-blue-50',
      iconBg: 'bg-blue-100',
      link: '/users'
    },
    {
      title: 'Verified Registrations',
      value: String(verifiedRegistrations),
      icon: '✅',
      bgColor: 'bg-green-50',
      iconBg: 'bg-green-100',
      link: '/users'
    },
    {
      title: 'Total Registrations Today',
      value: String(todayRegistrations),
      icon: '📝',
      bgColor: 'bg-cyan-50',
      iconBg: 'bg-cyan-100',
      hasDetailView: true,
      onViewDetails: handleViewRegistrations
    },
    {
      title: 'Total Logins Today',
      value: String(todayLogins),
      icon: '🔐',
      bgColor: 'bg-purple-50',
      iconBg: 'bg-purple-100',
      hasDetailView: true,
      onViewDetails: handleViewLogins
    },
    {
      title: 'Total Check-ins Today',
      value: String(todayCheckIns),
      icon: '✔️',
      bgColor: 'bg-indigo-50',
      iconBg: 'bg-indigo-100',
      link: '/visitors'
    },
    {
      title: 'Pending ID Verifications',
      value: String(pendingVerifications),
      icon: '🏷️',
      bgColor: 'bg-yellow-50',
      iconBg: 'bg-yellow-100',
      link: '/users'
    },
    {
      title: 'Pending Orders',
      value: String(pendingOrders),
      icon: '⏳',
      bgColor: 'bg-amber-50',
      iconBg: 'bg-amber-100',
      link: '/admin/orders'
    },
    {
      title: 'Out of Stock Products',
      value: String(outOfStockProducts),
      icon: '🚫',
      bgColor: 'bg-red-50',
      iconBg: 'bg-red-100'
    },
    {
      title: 'Fulfilled Orders',
      value: String(fulfilledOrders),
      icon: '📋',
      bgColor: 'bg-orange-50',
      iconBg: 'bg-orange-100',
      link: '/admin/orders'
    },
    {
      title: 'Completed Orders',
      value: String(completedOrders),
      icon: '✅',
      bgColor: 'bg-green-50',
      iconBg: 'bg-green-100',
      link: '/admin/orders'
    }
  ];

  const lowStockItems = useMemo(() => {
    // Filter products with stock less than 5
    const lows = (products || [])
      .filter(p => p.stock != null && p.stock < 5)
      .slice(0, 5)
      .map(p => ({
        name: p.name,
        remaining: p.stock || 0,
        status: p.stock === 0 ? 'Out' : 'Low',
        bgColor: p.stock === 0 ? 'bg-red-100' : 'bg-yellow-100',
        textColor: p.stock === 0 ? 'text-red-800' : 'text-yellow-800'
      }));
    return lows;
  }, [products]);

  const topSellingItems = useMemo(() => {
    // Count occurrences of product names in orders and match with product details
    const countMap = new Map();
    for (const order of orders) {
      for (const item of order.items || []) {
        const key = item.name || (item.product && item.product.name) || 'Unknown';
        countMap.set(key, (countMap.get(key) || 0) + (item.quantity || 1));
      }
    }
    
    const list = Array.from(countMap.entries()).map(([name, sold]) => {
      
      const product = products.find(p => p.name === name);
      return {
        name,
        sold,
        remaining: product ? (product.stock || 0) : 0,
        price: (() => {
          if (!product) return 'N/A';
          if (product.price != null && product.price > 0) return `$${product.price}`;
          if (product.variants && product.variants.length > 0) {
            const minPrice = Math.min(...product.variants.map(v => v.price));
            return `$${minPrice}`;
          }
          return 'N/A';
        })()
      };
    });
    
    list.sort((a, b) => b.sold - a.sold);
    return list.slice(0, 5);
  }, [orders, products]);

  return (
    <Layout title="Dashboard">
      <div className="p-6">
        {/* Tab Navigation */}
        <div className="mb-6 flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-all border-b-2 ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <LayoutDashboard className="h-5 w-5" />
            <span>Overview</span>
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-all border-b-2 ${
              activeTab === 'analytics'
                ? 'border-purple-600 text-purple-600 bg-purple-50'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <BarChart3 className="h-5 w-5" />
            <span>Analytics</span>
          </button>
        </div>

        {/* Analytics Tab Content */}
        {activeTab === 'analytics' && <AnalyticsTab />}

        {/* Overview Tab Content */}
        {activeTab === 'overview' && (
          <>
            {loading && (
              <div className="mb-6 flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
              </div>
            )}
            {/* Header with Export Button */}
            <div className="mb-6 flex bg-white p-4 rounded-lg shadow-sm items-center justify-between">
          <div>
          
            <p className="text-sm text-gray-500 mt-1">Export customer data with complete order history</p>
          </div>
          <button
            onClick={handleExportCustomers}
            disabled={exportLoading}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              exportLoading 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-green-600 text-white hover:bg-green-700 shadow-md hover:shadow-lg'
            }`}
          >
            {exportLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <Download className="h-5 w-5" />
                <span>Export to Excel</span>
              </>
            )}
          </button>
        </div>

        {/* Dashboard Content */}
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {stats.map((stat, index) => (
              <div 
                key={index} 
                className={`${stat.bgColor} rounded-2xl p-6 border border-gray-100 ${stat.link ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
                onClick={() => stat.link && router.push(stat.link)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-gray-600 text-sm font-medium mb-2">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900 mb-3">{stat.value}</p>
                    {stat.hasDetailView && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          stat.onViewDetails();
                        }}
                        className="flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium mt-2"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View Details
                      </button>
                    )}
                    {stat.trend && (
                      <div className="flex items-center space-x-1">
                        {stat.trend.isUp ? (
                          <TrendingUp className="w-4 h-4 text-green-500" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-500" />
                        )}
                        <span className={`text-sm font-medium ${
                          stat.trend.isUp ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {stat.trend.value}
                        </span>
                        <span className="text-gray-500 text-sm">{stat.trend.text}</span>
                      </div>
                    )}
                  </div>
                  <div className={`${stat.iconBg} p-3 rounded-xl`}>
                    <span className="text-2xl">{stat.icon}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Michigan Time Display */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow-sm p-6 mb-6 border border-blue-100">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-500 p-3 rounded-full">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Michigan Time (EST/EDT)</p>
                <p className="text-2xl font-bold text-gray-900">{michiganTime || 'Loading...'}</p>
                <p className="text-xs text-gray-500 mt-1">All birthday dates are shown in Michigan timezone</p>
              </div>
            </div>
          </div>

          {/* Middle Section - Birthday Notifications */}
          <div className="mb-6">
            <BirthdayCard users={users} onViewUser={handleViewUser} />
          </div>

          {/* Bottom Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Low Quantity Stock */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Low Quantity Stock</h3>
                <button className="text-blue-600 text-sm font-medium hover:text-blue-700">
                  See All
                </button>
              </div>
              
              <div className="space-y-4">
                {lowStockItems.map((item, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                      <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-red-400 rounded-lg"></div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{item.name}</h4>
                      <p className="text-sm text-gray-500">Remaining Quantity : {item.remaining} Items</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${item.bgColor} ${item.textColor}`}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Selling Stock */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Top Selling Stock</h3>
                <button className="text-blue-600 text-sm font-medium hover:text-blue-700">
                  See All
                </button>
              </div>
              
              {/* Table Header */}
              <div className="grid grid-cols-4 gap-4 text-sm font-medium text-gray-500 mb-4 pb-2 border-b">
                <div>Name</div>
                <div>Sold Quantity</div>
                <div>Remaining Quantity</div>
                <div>Price</div>
              </div>
              
              {/* Table Rows */}
              <div className="space-y-3">
                {topSellingItems.map((item, index) => (
                  <div key={index} className="grid grid-cols-4 gap-4 text-sm py-2">
                    <div className="font-medium text-gray-900">{item.name}</div>
                    <div className="text-gray-600">{item.sold}</div>
                    <div className="text-gray-600">{item.remaining}</div>
                    <div className="font-medium text-gray-900">{item.price}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Modals */}
        <RegistrationsModal
          show={showRegistrationsModal}
          onClose={() => setShowRegistrationsModal(false)}
          loading={modalLoading}
          data={registrationsList}
          dateRange={dateRange}
          onDateChange={setDateRange}
          onSearch={() => handleDateRangeSearch('registrations', 1)}
          onTodayClick={() => handleViewRegistrations(1)}
          formatDateTime={formatDateTime}
          pagination={registrationsPagination}
          onPageChange={(page) => {
            if (dateRange.start && dateRange.end) {
              handleDateRangeSearch('registrations', page);
            } else {
              handleViewRegistrations(page);
            }
          }}
        />

        <LoginsModal
          show={showLoginsModal}
          onClose={() => setShowLoginsModal(false)}
          loading={modalLoading}
          data={loginsList}
          dateRange={dateRange}
          onDateChange={setDateRange}
          onSearch={() => handleDateRangeSearch('logins', 1)}
          onTodayClick={() => handleViewLogins(1)}
          formatDateTime={formatDateTime}
          pagination={loginsPagination}
          onPageChange={(page) => {
            if (dateRange.start && dateRange.end) {
              handleDateRangeSearch('logins', page);
            } else {
              handleViewLogins(page);
            }
          }}
        />

        {/* User Details Modal */}
        {showUserModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">User Details</h2>
                <button onClick={closeUserModal} className="text-gray-400 hover:text-gray-500">
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="p-6">
                {userModalLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : selectedUser ? (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      {selectedUser.avatar ? (
                        <img className="h-16 w-16 rounded-full" src={selectedUser.avatar} alt={selectedUser.fullName} />
                      ) : (
                        <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-600 font-bold text-xl">{selectedUser.fullName?.charAt(0)?.toUpperCase()}</span>
                        </div>
                      )}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{selectedUser.fullName}</h3>
                        <p className="text-sm text-gray-500">User ID: {selectedUser._id}</p>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                        <Mail className="h-4 w-4 mr-2" />
                        Contact Information
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-center text-sm">
                          <span className="font-medium text-gray-600 w-20">Email:</span>
                          <span className="text-gray-900">{selectedUser.email}</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <span className="font-medium text-gray-600 w-20">Phone:</span>
                          <span className="text-gray-900">{selectedUser.phone}</span>
                        </div>
                      </div>
                    </div>

                    {selectedUser.birthday && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Date of Birth</h4>
                        <p className="text-sm text-gray-900">
                          {selectedUser.birthday.month}/{selectedUser.birthday.day}/{selectedUser.birthday.year}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-xs font-medium text-gray-500 uppercase">Account Created</h3>
                        <p className="mt-1 text-sm text-gray-900">
                          {new Date(selectedUser.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-xs font-medium text-gray-500 uppercase">Status</h3>
                        <p className="mt-1">{getStatusBadge(selectedUser.status)}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-xs font-medium text-gray-500 uppercase">Reward Points</h3>
                        <p className="mt-1 text-2xl font-bold text-green-600">${selectedUser.rewardPoints || 0}</p>
                      </div>
                    </div>

                    {selectedUser.governmentId && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Government ID</h4>
                        <img
                          src={selectedUser.governmentId}
                          alt="Government ID"
                          className="max-h-64 rounded object-contain"
                        />
                        <div className="mt-2">
                          <a href={selectedUser.governmentId} target="_blank" rel="noreferrer" className="text-blue-600 underline text-sm">
                            Open original
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-center text-gray-500">No user data available</p>
                )}
              </div>
              <div className="flex justify-end p-6 border-t border-gray-200">
                <button onClick={closeUserModal} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
          </>
        )}
      </div>
    </Layout>
  );
}