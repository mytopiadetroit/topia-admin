import React, { useEffect, useMemo, useState } from 'react';
import { 
  BarChart3, 
  Package, 
  Users, 
  FileText, 
  Grid3X3, 
  TrendingUp, 
  TrendingDown,
  LogOut,
  X,
  Eye,
  Calendar,
  UserPlus,
  LogIn
} from 'lucide-react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
// import { useRouter } from 'next/router';
import { fetchAllUsers, fetchAllOrders, fetchTodayRegistrations, fetchTodayLogins, fetchRegistrationsByDate, fetchLoginsByDate } from '@/service/service';
import { fetchAllCategories } from '@/service/service';
import { fetchAllProducts } from '@/service/service';
import { RegistrationsModal, LoginsModal } from '@/components/dashboard-modals';
import BirthdayCard from '@/components/BirthdayCard';

export default function Dashboard({ user, loader }) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [todayLogins, setTodayLogins] = useState(0);
  const [showRegistrationsModal, setShowRegistrationsModal] = useState(false);
  const [showLoginsModal, setShowLoginsModal] = useState(false);
  const [registrationsList, setRegistrationsList] = useState([]);
  const [loginsList, setLoginsList] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [uRes, oRes, cRes, pRes, lRes] = await Promise.all([
          fetchAllUsers(router, { page: 1, limit: 100 }),
          fetchAllOrders(router, { page: 1, limit: 100 }),
          fetchAllCategories(router),
          fetchAllProducts(router, { page: 1, limit: 100 }),
          fetchTodayLogins(router)
        ]);
        if (uRes?.success) setUsers(uRes.data || []);
        if (oRes?.success) setOrders(oRes.data || []);
        if (cRes?.success) setCategories(cRes.data || []);
        if (pRes?.success) setProducts(pRes.data || []);
        if (lRes?.success) setTodayLogins(lRes.count || 0);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('userDetail');
    localStorage.removeItem('token');
    router.push('/');
  };

  const handleViewRegistrations = async () => {
    try {
      setModalLoading(true);
      setShowRegistrationsModal(true);
      const res = await fetchTodayRegistrations(router);
      if (res?.success) {
        setRegistrationsList(res.data || []);
      }
    } catch (error) {
      console.error('Error loading registrations:', error);
    } finally {
      setModalLoading(false);
    }
  };

  const handleViewLogins = async () => {
    try {
      setModalLoading(true);
      setShowLoginsModal(true);
      const res = await fetchTodayLogins(router);
      if (res?.success) {
        setLoginsList(res.data || []);
      }
    } catch (error) {
      console.error('Error loading logins:', error);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDateRangeSearch = async (type) => {
    if (!dateRange.start || !dateRange.end) {
      alert('Please select both start and end dates');
      return;
    }
    
    try {
      setModalLoading(true);
      if (type === 'registrations') {
        const res = await fetchRegistrationsByDate(router, dateRange.start, dateRange.end);
        if (res?.success) {
          setRegistrationsList(res.data || []);
        }
      } else {
        const res = await fetchLoginsByDate(router, dateRange.start, dateRange.end);
        if (res?.success) {
          setLoginsList(res.data || []);
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

  const pendingVerifications = useMemo(() => users.filter(u => (u.status || 'pending') === 'pending').length, [users]);

  const stats = [
    {
      title: 'Total Registrations Today',
      value: String(todayRegistrations),
      icon: '👥',
      bgColor: 'bg-blue-50',
      iconBg: 'bg-blue-100',
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
      title: 'Pending ID Verifications',
      value: String(pendingVerifications),
      icon: '🏷️',
      bgColor: 'bg-yellow-50',
      iconBg: 'bg-yellow-100',
       link: '/users'
    },
    {
      title: 'Total Submitted Orders',
      value: String(orders.length),
      icon: '📊',
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
        price: product ? `$${product.price}` : 'N/A'
      };
    });
    
    list.sort((a, b) => b.sold - a.sold);
    return list.slice(0, 5);
  }, [orders, products]);

  return (
    <Layout title="Dashboard">
      <div className="p-6">
        {loading && (
          <div className="mb-6 flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        )}
        {/* Header */}
        {/* <div className="mb-6 flex bg-white p-4 rounded-lg shadow-sm items-center justify-between">
          <h1 className="text-2xl text-gray-700 font-bold">Dashboard</h1>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-700">
                {user?.name || user?.phone || 'Admin'}
              </p>
              <p className="text-xs text-gray-500">Admin</p>
            </div>
            <div className="h-10 w-10 rounded-full overflow-hidden">
              <div className="w-full h-full bg-gradient-to-r from-pink-400 to-red-400 flex items-center justify-center">
                <span className="text-white font-medium text-sm">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
                </span>
              </div>
            </div>
          </div>
        </div> */}

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

          {/* Middle Section - Birthday Notifications */}
          <div className="mb-6">
            <BirthdayCard users={users} />
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
          onSearch={() => handleDateRangeSearch('registrations')}
          onTodayClick={handleViewRegistrations}
          formatDateTime={formatDateTime}
        />

        <LoginsModal
          show={showLoginsModal}
          onClose={() => setShowLoginsModal(false)}
          loading={modalLoading}
          data={loginsList}
          dateRange={dateRange}
          onDateChange={setDateRange}
          onSearch={() => handleDateRangeSearch('logins')}
          onTodayClick={handleViewLogins}
          formatDateTime={formatDateTime}
        />
      </div>
    </Layout>
  );
}