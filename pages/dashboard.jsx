import React, { useState } from 'react';
import { 
  BarChart3, 
  Package, 
  Users, 
  FileText, 
  Grid3X3, 
  TrendingUp, 
  TrendingDown,
  LogOut
} from 'lucide-react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';

export default function Dashboard({ user, loader }) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('userDetail');
    localStorage.removeItem('token');
    router.push('/');
  };

  // Stats Data
  const stats = [
    {
      title: 'Total Registrations Today',
      value: '52',
      icon: '👥',
      trend: { value: '8.2%', isUp: true, text: 'Up from yesterday' },
      bgColor: 'bg-blue-50',
      iconBg: 'bg-blue-100'
    },
    {
      title: 'Pending ID Verifications',
      value: '65',
      icon: '🏷️',
      bgColor: 'bg-yellow-50',
      iconBg: 'bg-yellow-100'
    },
    {
      title: 'Total Submitted Orders',
      value: '250',
      icon: '📊',
      trend: { value: '4.3%', isUp: false, text: 'Down from yesterday' },
      bgColor: 'bg-green-50',
      iconBg: 'bg-green-100',
      link: '/admin/orders'
    },
    {
      title: 'Categories',
      value: '8',
      icon: '🏷️',
      bgColor: 'bg-orange-50',
      iconBg: 'bg-orange-100'
    }
  ];

  // Low Stock Data
  const lowStockItems = [
    {
      name: 'Shroom Chocolate',
      image: '/api/placeholder/40/40',
      remaining: 6,
      status: 'Low',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-800'
    },
    {
      name: "Lion's Mane Capsule",
      image: '/api/placeholder/40/40',
      remaining: 10,
      status: 'Low',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-800'
    },
    {
      name: 'Mush Gummies',
      image: '/api/placeholder/40/40',
      remaining: 15,
      status: 'Low',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-800'
    }
  ];

  // Top Selling Data
  const topSellingItems = [
    { name: 'Mush Gummies', sold: 30, remaining: 12, price: '₹ 100' },
    { name: "Lion's Mane Capsule", sold: 21, remaining: 15, price: '₹ 207' },
    { name: 'Shroom Chocolate', sold: 19, remaining: 17, price: '₹ 105' }
  ];

  return (
    <Layout title="Dashboard">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6 flex bg-white p-4 rounded-lg shadow-sm items-center justify-between">
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
      </div>
    </Layout>
  );
}