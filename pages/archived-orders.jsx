import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import Sidebar from '../components/sidebar';
import { fetchArchivedOrders, unarchiveOrderApi, toast } from '../service/service';
import Swal from 'sweetalert2';
import { Archive, RotateCcw, Search } from 'lucide-react';

const ArchivedOrders = () => {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    loadArchivedOrders();
  }, [searchTerm, dateFilter, statusFilter, currentPage]);

  const loadArchivedOrders = async () => {
    try {
      setLoading(true);
      const response = await fetchArchivedOrders(router, {
        page: currentPage,
        limit: 30,
        search: searchTerm,
        date: dateFilter,
        status: statusFilter,
      });

      if (response.success) {
        setOrders(response.data);
        setTotalPages(response.pagination?.pages || 1);
        setTotalCount(response.pagination?.total || 0);
      }
    } catch (error) {
      console.error('Error loading archived orders:', error);
      toast.error('Failed to load archived orders');
    } finally {
      setLoading(false);
    }
  };

  const handleUnarchive = async (order) => {
    const result = await Swal.fire({
      title: 'Restore Order?',
      html: `
        <p>Are you sure you want to restore order <strong>${order.orderNumber}</strong>?</p>
        <p class="text-sm text-gray-600 mt-2">This will move the order back to the active list.</p>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10B981',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, restore it!',
      cancelButtonText: 'Cancel',
    });

    if (!result.isConfirmed) return;

    try {
      const response = await unarchiveOrderApi(order._id, router);
      if (response.success) {
        Swal.fire({
          title: 'Restored!',
          text: 'Order has been restored successfully.',
          icon: 'success',
          confirmButtonColor: '#10B981',
        });
        loadArchivedOrders();
      }
    } catch (error) {
      console.error('Error restoring order:', error);
      toast.error('Failed to restore order');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Detroit',
      timeZoneName: 'short'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'fulfilled': return 'bg-green-100 text-green-800';
      case 'incomplete': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-200 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Layout>
      <div className="flex min-h-screen bg-gray-50">
        {/* Mobile top bar */}
        <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-[#80A6F7] text-white flex items-center justify-between px-4 py-3">
          <button onClick={() => setSidebarOpen(true)} className="p-2">
            <span className="sr-only">Open sidebar</span>
            <div className="space-y-1">
              <span className="block w-6 h-0.5 bg-white"></span>
              <span className="block w-6 h-0.5 bg-white"></span>
              <span className="block w-6 h-0.5 bg-white"></span>
            </div>
          </button>
          <span className="font-semibold">Archived Orders</span>
          <div className="w-8" />
        </div>

        {/* Sidebar */}
        <div className="hidden md:block"><Sidebar /></div>
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 md:hidden" onClick={() => setSidebarOpen(false)}>
            <div className="absolute inset-0 bg-black/50" />
          </div>
        )}
        <div className="md:hidden">
          <Sidebar isMobileOpen={sidebarOpen} />
        </div>

        <div className="flex-1 md:ml-20 p-6 pt-20 md:pt-6">
          <div className="w-full">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
                    <Archive className="w-8 h-8 mr-3 text-orange-600" />
                    Archived Orders
                  </h1>
                  <p className="text-gray-600">View and restore archived order records</p>
                </div>
                <button
                  onClick={() => router.push('/admin/orders')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Back to Active Orders
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by order number..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => {
                      setDateFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  {dateFilter && (
                    <button
                      onClick={() => {
                        setDateFilter('');
                        setCurrentPage(1);
                      }}
                      className="mt-2 text-sm text-orange-600 hover:text-orange-700"
                    >
                      Clear date filter
                    </button>
                  )}
                </div>
                <div>
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="fulfilled">Fulfilled</option>
                    <option value="incomplete">Incomplete</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading archived orders...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="p-8 text-center">
                  <Archive className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No archived orders found</p>
                  <p className="text-gray-400 text-sm mt-2">Archived orders will appear here</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Order Details
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Customer
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Items
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {orders.map((order) => (
                          <tr key={order._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {order.orderNumber}
                              </div>
                              <div className="text-sm text-gray-500">
                                {formatDate(order.createdAt)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {order.user?.fullName || 'N/A'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {order.user?.phone || 'N/A'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {order.items.length} item(s)
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                ${order.totalAmount.toFixed(2)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => handleUnarchive(order)}
                                className="inline-flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                              >
                                <RotateCcw className="w-4 h-4 mr-2" />
                                Restore
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="px-4 py-3 bg-white border-t border-gray-200 flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        Showing {((currentPage - 1) * 30) + 1} to {Math.min(currentPage * 30, totalCount)} of {totalCount} orders
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className={`px-4 py-2 rounded-lg border ${currentPage === 1 ? 'text-gray-400 border-gray-200 cursor-not-allowed' : 'text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                        >
                          Previous
                        </button>
                        <span className="px-4 py-2 text-sm text-gray-700">
                          Page {currentPage} of {totalPages}
                        </span>
                        <button
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className={`px-4 py-2 rounded-lg border ${currentPage === totalPages ? 'text-gray-400 border-gray-200 cursor-not-allowed' : 'text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ArchivedOrders;
