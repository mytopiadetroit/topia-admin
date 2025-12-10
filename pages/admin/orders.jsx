"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
// import { toast } from 'react-toastify';
import { fetchAllOrders, updateOrderStatusApi, archiveOrderApi, toast, fetchUserById } from '../../service/service';
import Swal from 'sweetalert2';
import Sidebar from '../../components/sidebar';
import { User, ShoppingBag, X, Mail } from 'lucide-react';

export default function AdminOrders() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [selectedStatus, page]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetchAllOrders(router, { page, limit: 10, status: selectedStatus });
      console.log('=== FETCH ORDERS RESPONSE ===');
      console.log('Full Response:', response);
      if (response.success && response.data.length > 0) {
        console.log('First Order Items:', response.data[0].items);
        console.log('First Item Details:', response.data[0].items[0]);
      }
      console.log('============================');
      if (response.success) {
        setOrders(response.data);
        if (response.meta) setTotalPages(response.meta.totalPages || 1);
      } else {
        Swal.fire({ icon: 'error', title: 'Error', text: response.message || 'Failed to load orders' });
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load orders' });
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    const textMap = {
      pending: 'Set order to Pending?',
      incomplete: 'Mark order as Incomplete? Reserved stock will be returned.',
      fulfilled: 'Mark order as Fulfilled? Order is ready for customer pickup.',
      completed: 'Mark order as Completed? Customer has picked up the order.',
      cancelled: 'Cancel this order? Reserved stock will be returned.'
    };
    const confirm = await Swal.fire({
      title: 'Confirm Status Change',
      text: textMap[newStatus] || 'Are you sure?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, update',
      cancelButtonText: 'Cancel'
    });
    if (!confirm.isConfirmed) return;
    try {
      const response = await updateOrderStatusApi(orderId, newStatus, router);
      if (response.success) {
        await Swal.fire({ icon: 'success', title: 'Updated', text: 'Order status updated', timer: 1200, showConfirmButton: false });
        fetchOrders();
      } else {
        Swal.fire({ icon: 'error', title: 'Error', text: response.message || 'Failed to update status' });
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to update status' });
    }
  };

  const archiveOrder = async (orderId) => {
    const confirm = await Swal.fire({
      title: 'Archive Order?',
      html: `
        <p>Are you sure you want to archive this order?</p>
        <p class="text-sm text-gray-600 mt-2">The order data will be preserved and can be restored later if needed.</p>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#F59E0B',
      confirmButtonText: 'Yes, archive it',
      cancelButtonText: 'Cancel'
    });
    if (!confirm.isConfirmed) return;
    try {
      const response = await archiveOrderApi(orderId, router);
      if (response.success) {
        await Swal.fire({ icon: 'success', title: 'Archived', text: 'Order archived successfully', timer: 1200, showConfirmButton: false });
        fetchOrders();
      } else {
        Swal.fire({ icon: 'error', title: 'Error', text: response.message || 'Failed to archive order' });
      }
    } catch (error) {
      console.error('Error archiving order:', error);
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to archive order' });
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'fulfilled': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'incomplete': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-200 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleViewUser = async (userId) => {
    try {
      setModalLoading(true);
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
      setModalLoading(false);
    }
  };

  const handleViewOrder = (order) => {
    console.log('=== ORDER DATA ===');
    console.log('Full Order:', order);
    console.log('Order Items:', order.items);
    order.items.forEach((item, index) => {
      console.log(`Item ${index + 1}:`, {
        name: item.name,
        selectedVariant: item.selectedVariant,
        selectedFlavor: item.selectedFlavor,
        quantity: item.quantity,
        price: item.price
      });
    });
    console.log('==================');
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  const closeUserModal = () => {
    setShowUserModal(false);
    setSelectedUser(null);
  };

  const closeOrderModal = () => {
    setShowOrderModal(false);
    setSelectedOrder(null);
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800',
      fulfilled: 'bg-orange-100 text-orange-800',
      completed: 'bg-green-100 text-green-800',
      incomplete: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-200 text-gray-800'
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const filteredOrders = selectedStatus === 'all' 
    ? orders 
    : orders.filter(order => order.status === selectedStatus);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <div className="hidden md:block"><Sidebar /></div>
        <div className="flex-1 md:ml-[240px] p-8 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#536690] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading orders...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
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
        <span className="font-semibold">Orders</span>
        <div className="w-8" />
      </div>

      {/* Sidebar */}
      <div className="hidden md:block"><Sidebar /></div>
      {/* Mobile sidebar drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setSidebarOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
        </div>
      )}
      <div className="md:hidden">
        <Sidebar isMobileOpen={sidebarOpen} />
      </div>

      <div className="flex-1 md:ml-[240px] p-6 pt-20 md:pt-6">
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Management</h1>
              <p className="text-gray-600">View and manage all customer orders</p>
            </div>
            <button
              onClick={() => router.push('/archived-orders')}
              className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              View Archive
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'All' },
              { key: 'pending', label: 'Pending' },
              { key: 'fulfilled', label: 'Fulfilled' },
              { key: 'completed', label: 'Completed' },
              { key: 'incomplete', label: 'Incomplete' },
              { key: 'cancelled', label: 'Cancelled' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => { setSelectedStatus(tab.key); setPage(1); }}
                className={`px-4 py-2 rounded-lg border ${selectedStatus === tab.key ? 'bg-[#536690] text-white border-[#536690]' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
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
                 {filteredOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {order.orderNumber}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDate(order.createdAt)}
                        </div>
                      </div>
                    </td>
                   <td className="px-6 py-4 whitespace-nowrap">
  <div className="flex items-center space-x-2">
    <div>
      <div className="text-sm text-gray-900">
        {order.user?.fullName || 'N/A'}
      </div>
      <div className="text-sm text-gray-500">
        {order.user?.phone || 'N/A'}
      </div>
    </div>
    {order.user?._id && (
      <button
        onClick={() => handleViewUser(order.user._id)}
        className="text-blue-600 hover:text-blue-900 p-1"
        title="View User Details"
      >
        <User className="h-4 w-4" />
      </button>
    )}
  </div>
</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <div>
                          <div className="text-sm text-gray-900">
                            {order.items.length} item(s)
                          </div>
                          <div className="text-sm text-gray-500">
                            {order.items.map(item => item.name).join(', ')}
                          </div>
                        </div>
                        <button
                          onClick={() => handleViewOrder(order)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="View Order Details"
                        >
                          <ShoppingBag className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ${order.totalAmount.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-500">
                         ${order.subtotal.toFixed(2)} + ${order.tax.toFixed(2)} tax
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <select
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                          className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-[#536690]"
                        >
                           <option value="pending">Pending</option>
                           <option value="fulfilled">Fulfilled</option>
                           <option value="completed">Completed</option>
                           <option value="incomplete">Incomplete</option>
                           <option value="cancelled">Cancel Order</option>
                        </select>
                        
                        <button
                          onClick={() => archiveOrder(order._id)}
                          className="px-2 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
                        >
                          Archive
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredOrders.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No orders found</p>
            </div>
          )}
        </div>

        {/* Pagination under table */}
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">Page {page} of {totalPages}</div>
          <div className="space-x-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className={`px-3 py-2 rounded border ${page === 1 ? 'text-gray-400 border-gray-200' : 'text-gray-700 border-gray-300 hover:bg-gray-50'}`}
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className={`px-3 py-2 rounded border ${page === totalPages ? 'text-gray-400 border-gray-200' : 'text-gray-700 border-gray-300 hover:bg-gray-50'}`}
            >
              Next
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-[#536690]">{orders.length}</div>
              <div className="text-sm text-gray-600">Total Orders</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {orders.filter(o => o.status === 'pending').length}
              </div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {orders.filter(o => o.status === 'delivered').length}
              </div>
              <div className="text-sm text-gray-600">Delivered</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                ${orders.reduce((total, order) => total + order.totalAmount, 0).toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Total Revenue</div>
            </div>
          </div>
        </div>
        </div>
      </div>

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
              {modalLoading ? (
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
                        {selectedUser.birthday.day} {selectedUser.birthday.month} {selectedUser.birthday.year}
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

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Order Details</h2>
              <button onClick={closeOrderModal} className="text-gray-400 hover:text-gray-500">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{selectedOrder.orderNumber}</h3>
                    <p className="text-sm text-gray-500">{formatDate(selectedOrder.createdAt)}</p>
                  </div>
                  {getStatusBadge(selectedOrder.status)}
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Customer Information</h4>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <span className="font-medium text-gray-600 w-24">Name:</span>
                      <span className="text-gray-900">{selectedOrder.user?.fullName || 'N/A'}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <span className="font-medium text-gray-600 w-24">Phone:</span>
                      <span className="text-gray-900">{selectedOrder.user?.phone || 'N/A'}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <span className="font-medium text-gray-600 w-24">Email:</span>
                      <span className="text-gray-900">{selectedOrder.user?.email || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Order Items</h4>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item, index) => (
                      <div key={index} className="flex items-center space-x-4 bg-white p-3 rounded">
                        {item.image && (
                          <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded" />
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{item.name}</p>
                          {item.selectedVariant ? (
                            <p className="text-sm text-blue-600 font-medium">
                              ✓ Size: {item.selectedVariant.size?.value}{item.selectedVariant.size?.unit}
                            </p>
                          ) : item.product?.variants && item.product.variants.length === 1 ? (
                            <p className="text-sm text-blue-500">
                              Size: {item.product.variants[0].size?.value}{item.product.variants[0].size?.unit}
                            </p>
                          ) : item.product?.variants && item.product.variants.length > 1 ? (
                            <p className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded inline-block">
                              ⚠️ Size not recorded - Contact customer
                            </p>
                          ) : null}
                          
                          {item.selectedFlavor ? (
                            <p className="text-sm text-purple-600 font-medium">
                              ✓ Flavor: {item.selectedFlavor.name}
                            </p>
                          ) : item.product?.flavors && item.product.flavors.filter(f => f.isActive).length === 1 ? (
                            <p className="text-sm text-purple-500">
                              Flavor: {item.product.flavors.find(f => f.isActive)?.name}
                            </p>
                          ) : item.product?.flavors && item.product.flavors.filter(f => f.isActive).length > 1 ? (
                            <p className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded inline-block">
                              ⚠️ Flavor not recorded - Contact customer
                            </p>
                          ) : null}
                          
                          <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
                          <p className="text-sm text-gray-500">${item.price} each</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Order Summary</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="text-gray-900">${selectedOrder.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tax:</span>
                      <span className="text-gray-900">${selectedOrder.tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-base font-semibold pt-2 border-t">
                      <span className="text-gray-900">Total:</span>
                      <span className="text-gray-900">${selectedOrder.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end p-6 border-t border-gray-200">
              <button onClick={closeOrderModal} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
