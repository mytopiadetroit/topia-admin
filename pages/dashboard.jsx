import React, { useEffect, useMemo, useState } from 'react';
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
import { fetchAllUsers, fetchAllOrders, fetchAllCategories, fetchAllProducts } from '@/service/service';

export default function Dashboard({ user, loader }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [uRes, oRes, cRes, pRes] = await Promise.all([
          fetchAllUsers(router, { page: 1, limit: 100 }),
          fetchAllOrders(router, { page: 1, limit: 100 }),
          fetchAllCategories(router),
          fetchAllProducts(router, { page: 1, limit: 100 })
        ]);
        if (uRes?.success) setUsers(uRes.data || []);
        if (oRes?.success) setOrders(oRes.data || []);
        if (cRes?.success) setCategories(cRes.data || []);
        if (pRes?.success) setProducts(pRes.data || []);
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

  // Stats
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
    { title: 'Total Registrations Today', value: String(todayRegistrations), icon: '👥', bgColor: 'bg-blue-50', iconBg: 'bg-blue-100' },
    { title: 'Pending ID Verifications', value: String(pendingVerifications), icon: '🏷️', bgColor: 'bg-yellow-50', iconBg: 'bg-yellow-100' },
    { title: 'Total Submitted Orders', value: String(orders.length), icon: '📊', bgColor: 'bg-green-50', iconBg: 'bg-green-100', link: '/admin/orders' },
    { title: 'Categories', value: String(categories.length), icon: '🏷️', bgColor: 'bg-orange-50', iconBg: 'bg-orange-100' }
  ];

  // Low Stock Items
  const lowStockItems = useMemo(() => {
    const lows = (products || [])
      .filter(p => p.hasStock === false || (Array.isArray(p.tags) && p.tags.some(t => /low/i.test(t))))
      .slice(0, 5)
      .map(p => ({
        name: p.name,
        remaining: p.hasStock === false ? 0 : 5,
        status: p.hasStock === false ? 'Out' : 'Low',
        price: p.price || 'N/A', // Price added
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-800'
      }));
    return lows;
  }, [products]);

  // Top Selling Items
  const topSellingItems = useMemo(() => {
    const countMap = new Map();
    const priceMap = new Map();

    for (const order of orders) {
      for (const item of order.items || []) {
        const key = item.name || (item.product && item.product.name) || 'Unknown';
        countMap.set(key, (countMap.get(key) || 0) + (item.quantity || 1));

        // Store price from item or product
        if (item.price) priceMap.set(key, item.price);
        else if (item.product?.price) priceMap.set(key, item.product.price);
      }
    }

    const list = Array.from(countMap.entries()).map(([name, sold]) => ({
      name,
      sold,
      price: priceMap.get(name) || 'N/A',
      remaining: 0
    }));

    list.sort((a, b) => b.sold - a.sold);

    return list.slice(0, 5);
  }, [orders]);

  // Optional: console check
  console.log("Top Selling Items:", topSellingItems);

  return (
    <Layout title="Dashboard">
      <div className="p-6">
        {loading && (
          <div className="mb-6 flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        )}

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
                </div>
                <div className={`${stat.iconBg} p-3 rounded-xl`}>
                  <span className="text-2xl">{stat.icon}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">

          {/* Low Stock */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Low Quantity Stock</h3>
              <button className="text-blue-600 text-sm font-medium hover:text-blue-700">See All</button>
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
                    {item.status} | ${item.price}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Selling Stock */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Top Selling Stock</h3>
              <button className="text-blue-600 text-sm font-medium hover:text-blue-700">See All</button>
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
                  <div className="font-medium text-gray-900">${item.price}</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}
