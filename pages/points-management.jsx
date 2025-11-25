import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Sidebar from '@/components/sidebar';
import Swal from 'sweetalert2';
import { toast } from '../service/service';

const PointsManagement = () => {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [rewardTasks, setRewardTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userPagination, setUserPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 40
  });
  const [adjustmentData, setAdjustmentData] = useState({
    adjustmentType: 'add',
    points: '',
    reason: '',
    rewardTaskId: '',
    customReason: '',
    notes: ''
  });
  const [stats, setStats] = useState(null);
  const [adjustments, setAdjustments] = useState([]);
  const [adjusting, setAdjusting] = useState(false);
  const [adjustmentsPagination, setAdjustmentsPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20
  });
  const [adjustmentFilters, setAdjustmentFilters] = useState({
    search: '',
    type: 'all', // all, add, subtract
    userId: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadUsers(),
        loadRewardTasks(),
        loadStats(),
        loadAdjustments()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async (page = 1, search = '') => {
    try {
      const response = await fetch(`http://localhost:5000/api/users?page=${page}&limit=40&search=${search}&status=verified`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setUsers(data.data || []);
        if (data.pagination) {
          setUserPagination(data.pagination);
        }
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleUserSearch = (query) => {
    setUserSearchQuery(query);
    loadUsers(1, query);
  };

  const handleUserPageChange = (page) => {
    loadUsers(page, userSearchQuery);
  };

  const loadRewardTasks = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/rewards/admin/tasks', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setRewardTasks(data.data || []);
      }
    } catch (error) {
      console.error('Error loading reward tasks:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/points/admin/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadAdjustments = async (page = 1) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      });
      
      if (adjustmentFilters.search) params.append('search', adjustmentFilters.search);
      if (adjustmentFilters.type !== 'all') params.append('type', adjustmentFilters.type);
      if (adjustmentFilters.userId) params.append('userId', adjustmentFilters.userId);
      if (adjustmentFilters.startDate) params.append('startDate', adjustmentFilters.startDate);
      if (adjustmentFilters.endDate) params.append('endDate', adjustmentFilters.endDate);
      
      const response = await fetch(`http://localhost:5000/api/points/admin/adjustments?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setAdjustments(data.data || []);
        if (data.pagination) {
          setAdjustmentsPagination(data.pagination);
        }
      }
    } catch (error) {
      console.error('Error loading adjustments:', error);
    }
  };

  const handleAdjustmentPageChange = (page) => {
    loadAdjustments(page);
  };

  const handleAdjustmentFilterChange = (key, value) => {
    setAdjustmentFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyAdjustmentFilters = () => {
    loadAdjustments(1);
  };

  const clearAdjustmentFilters = () => {
    setAdjustmentFilters({
      search: '',
      type: 'all',
      userId: '',
      startDate: '',
      endDate: ''
    });
    setTimeout(() => loadAdjustments(1), 100);
  };

  const handleOpenAdjustModal = (user) => {
    setSelectedUser(user);
    setAdjustmentData({
      adjustmentType: 'add',
      points: '',
      reason: '',
      rewardTaskId: '',
      customReason: '',
      notes: ''
    });
    setShowAdjustModal(true);
  };

  const handleCloseAdjustModal = () => {
    setShowAdjustModal(false);
    setSelectedUser(null);
    setAdjustmentData({
      adjustmentType: 'add',
      points: '',
      reason: '',
      rewardTaskId: '',
      customReason: '',
      notes: ''
    });
  };

  const handleAdjustPoints = async (e) => {
    e.preventDefault();

    if (!adjustmentData.points || adjustmentData.points <= 0) {
      toast.error('Please enter a valid points amount');
      return;
    }

    if (!adjustmentData.reason) {
      toast.error('Please select a reason');
      return;
    }

    if (adjustmentData.reason === 'custom' && !adjustmentData.customReason.trim()) {
      toast.error('Please enter a custom reason');
      return;
    }

    // Prevent negative balance
    if (adjustmentData.adjustmentType === 'subtract') {
      const currentBalance = selectedUser.rewardPoints || 0;
      const pointsToSubtract = parseFloat(adjustmentData.points);
      
      if (pointsToSubtract > currentBalance) {
        Swal.fire({
          title: 'Insufficient Balance!',
          html: `
            <p>Cannot subtract <strong>$${pointsToSubtract}</strong></p>
            <p>User <strong>${selectedUser.fullName}</strong> only has <strong>$${currentBalance}</strong> balance.</p>
          `,
          icon: 'error',
          confirmButtonColor: '#EF4444'
        });
        return;
      }
    }

    const confirmResult = await Swal.fire({
      title: `${adjustmentData.adjustmentType === 'add' ? 'Add' : 'Subtract'} Points?`,
      html: `
        <p>User: <strong>${selectedUser.fullName}</strong></p>
        <p>Current Balance: <strong>$${selectedUser.rewardPoints || 0}</strong></p>
        <p>Points to ${adjustmentData.adjustmentType}: <strong>$${adjustmentData.points}</strong></p>
        <p>New Balance: <strong>$${adjustmentData.adjustmentType === 'add' 
          ? (selectedUser.rewardPoints || 0) + parseFloat(adjustmentData.points)
          : Math.max(0, (selectedUser.rewardPoints || 0) - parseFloat(adjustmentData.points))
        }</strong></p>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: adjustmentData.adjustmentType === 'add' ? '#10B981' : '#EF4444',
      cancelButtonColor: '#6B7280',
      confirmButtonText: `Yes, ${adjustmentData.adjustmentType} points!`,
      cancelButtonText: 'Cancel'
    });

    if (!confirmResult.isConfirmed) {
      return;
    }

    setAdjusting(true);
    try {
      const response = await fetch(`http://localhost:5000/api/points/admin/adjust/${selectedUser._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
          adjustmentType: adjustmentData.adjustmentType,
          points: parseFloat(adjustmentData.points),
          reason: adjustmentData.reason === 'custom' ? adjustmentData.customReason : adjustmentData.reason,
          rewardTaskId: adjustmentData.rewardTaskId || null,
          customReason: adjustmentData.reason === 'custom' ? adjustmentData.customReason : '',
          notes: adjustmentData.notes
        })
      });

      const data = await response.json();

      if (data.success) {
        Swal.fire({
          title: 'Success!',
          text: `Points ${adjustmentData.adjustmentType === 'add' ? 'added' : 'subtracted'} successfully!`,
          icon: 'success',
          confirmButtonColor: '#10B981'
        });
        handleCloseAdjustModal();
        loadData();
      } else {
        toast.error(data.message || 'Failed to adjust points');
      }
    } catch (error) {
      console.error('Error adjusting points:', error);
      toast.error('An error occurred while adjusting points');
    } finally {
      setAdjusting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 lg:ml-64 w-full">
        <div className="p-6 w-full">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Points Management</h1>
            <p className="text-gray-600">Manually adjust user reward points</p>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="text-xs font-medium text-gray-500 mb-1">Total Adjustments</h3>
                <p className="text-xl font-bold text-gray-900">{stats.overview.totalAdjustments}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="text-xs font-medium text-gray-500 mb-1">Points Added</h3>
                <p className="text-xl font-bold text-green-600">${stats.overview.totalPointsAdded}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="text-xs font-medium text-gray-500 mb-1">Points Subtracted</h3>
                <p className="text-xl font-bold text-red-600">${stats.overview.totalPointsSubtracted}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="text-xs font-medium text-gray-500 mb-1">Total in Circulation</h3>
                <p className="text-xl font-bold text-blue-600">${stats.totalPointsInCirculation}</p>
              </div>
            </div>
          )}

          {/* Users Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
            <div className="p-4 border-b border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Users & Points Balance</h2>
              </div>
              {/* Search Bar */}
              <div className="mt-4">
                <input
                  type="text"
                  value={userSearchQuery}
                  onChange={(e) => handleUserSearch(e.target.value)}
                  placeholder="Search by name, email, or phone..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading users...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Points Balance
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{user.fullName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-green-600">${user.rewardPoints || 0}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleOpenAdjustModal(user)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Adjust Points
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Pagination */}
            {!loading && userPagination.totalPages > 1 && (
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-gray-700">
                    Showing {((userPagination.currentPage - 1) * userPagination.itemsPerPage) + 1} to{' '}
                    {Math.min(userPagination.currentPage * userPagination.itemsPerPage, userPagination.totalItems)} of{' '}
                    {userPagination.totalItems} users
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleUserPageChange(userPagination.currentPage - 1)}
                      disabled={userPagination.currentPage === 1}
                      className={`px-3 py-1.5 rounded border text-sm ${
                        userPagination.currentPage === 1 
                          ? 'text-gray-400 border-gray-200 cursor-not-allowed' 
                          : 'text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Previous
                    </button>
                    
                    {/* Page numbers */}
                    <div className="hidden sm:flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, userPagination.totalPages) }, (_, i) => {
                        let pageNum;
                        if (userPagination.currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (userPagination.currentPage >= userPagination.totalPages - 2) {
                          pageNum = userPagination.totalPages - 4 + i;
                        } else {
                          pageNum = userPagination.currentPage - 2 + i;
                        }
                        
                        if (pageNum > 0 && pageNum <= userPagination.totalPages) {
                          return (
                            <button
                              key={pageNum}
                              onClick={() => handleUserPageChange(pageNum)}
                              className={`w-8 h-8 flex items-center justify-center rounded text-sm ${
                                userPagination.currentPage === pageNum
                                  ? 'bg-blue-600 text-white'
                                  : 'text-gray-700 border border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        }
                        return null;
                      })}
                      
                      {/* Page dropdown for desktop */}
                      {userPagination.totalPages > 5 && (
                        <div className="relative ml-1">
                          <select
                            value={userPagination.currentPage}
                            onChange={(e) => handleUserPageChange(Number(e.target.value))}
                            className="appearance-none pl-2 pr-8 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          >
                            {Array.from({ length: userPagination.totalPages }, (_, i) => i + 1).map((pageNum) => (
                              <option key={pageNum} value={pageNum}>
                                Page {pageNum}
                              </option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Mobile page dropdown */}
                    <div className="sm:hidden">
                      <select
                        value={userPagination.currentPage}
                        onChange={(e) => handleUserPageChange(Number(e.target.value))}
                        className="block w-20 px-2 py-1 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      >
                        {Array.from({ length: userPagination.totalPages }, (_, i) => i + 1).map((pageNum) => (
                          <option key={pageNum} value={pageNum}>
                            {pageNum}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <button
                      onClick={() => handleUserPageChange(userPagination.currentPage + 1)}
                      disabled={userPagination.currentPage === userPagination.totalPages}
                      className={`px-3 py-1.5 rounded border text-sm ${
                        userPagination.currentPage === userPagination.totalPages
                          ? 'text-gray-400 border-gray-200 cursor-not-allowed'
                          : 'text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Recent Adjustments */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Adjustments</h2>
              
              {/* Filters */}
              <div className="flex flex-wrap gap-6">
                {/* Search */}
                <input
                  type="text"
                  placeholder="Search user or reason..."
                  value={adjustmentFilters.search}
                  onChange={(e) => handleAdjustmentFilterChange('search', e.target.value)}
                  className="flex min-w-[400px] px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                
                {/* Type Filter */}
                <select
                  value={adjustmentFilters.type}
                  onChange={(e) => handleAdjustmentFilterChange('type', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Types</option>
                  <option value="add">Add Only</option>
                  <option value="subtract">Subtract Only</option>
                </select>
                
                {/* User Filter */}
                {/* <select
                  value={adjustmentFilters.userId}
                  onChange={(e) => handleAdjustmentFilterChange('userId', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Users</option>
                  {users.map(user => (
                    <option key={user._id} value={user._id}>
                      {user.fullName}
                    </option>
                  ))}
                </select> */}
                
                {/* Date Range */}
                <input
                  type="date"
                  value={adjustmentFilters.startDate}
                  onChange={(e) => handleAdjustmentFilterChange('startDate', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Start Date"
                />
                <input
                  type="date"
                  value={adjustmentFilters.endDate}
                  onChange={(e) => handleAdjustmentFilterChange('endDate', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="End Date"
                />
                
                {/* Action Buttons */}
                <button
                  onClick={applyAdjustmentFilters}
                  className="px-10 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                >
                  Apply
                </button>
                <button
                  onClick={clearAdjustmentFilters}
                  className="px-8 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm font-medium"
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Points
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reason
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Adjusted By
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {adjustments.map((adj) => (
                    <tr key={adj._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(adj.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {adj.user?.fullName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          adj.adjustmentType === 'add' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {adj.adjustmentType === 'add' ? '+ Add' : '- Subtract'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        ${adj.points}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {adj.rewardTask?.title || adj.reason}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {adj.adjustedBy?.fullName}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination for Adjustments */}
            {adjustmentsPagination.totalPages > 1 && (
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-gray-700">
                    Showing {((adjustmentsPagination.currentPage - 1) * adjustmentsPagination.itemsPerPage) + 1} to{' '}
                    {Math.min(adjustmentsPagination.currentPage * adjustmentsPagination.itemsPerPage, adjustmentsPagination.totalItems)} of{' '}
                    {adjustmentsPagination.totalItems} adjustments
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleAdjustmentPageChange(adjustmentsPagination.currentPage - 1)}
                      disabled={adjustmentsPagination.currentPage === 1}
                      className={`px-3 py-1.5 rounded border text-sm ${
                        adjustmentsPagination.currentPage === 1 
                          ? 'text-gray-400 border-gray-200 cursor-not-allowed' 
                          : 'text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Previous
                    </button>
                    
                    <div className="hidden sm:flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, adjustmentsPagination.totalPages) }, (_, i) => {
                        let pageNum;
                        if (adjustmentsPagination.currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (adjustmentsPagination.currentPage >= adjustmentsPagination.totalPages - 2) {
                          pageNum = adjustmentsPagination.totalPages - 4 + i;
                        } else {
                          pageNum = adjustmentsPagination.currentPage - 2 + i;
                        }
                        
                        if (pageNum > 0 && pageNum <= adjustmentsPagination.totalPages) {
                          return (
                            <button
                              key={pageNum}
                              onClick={() => handleAdjustmentPageChange(pageNum)}
                              className={`w-8 h-8 flex items-center justify-center rounded text-sm ${
                                adjustmentsPagination.currentPage === pageNum
                                  ? 'bg-blue-600 text-white'
                                  : 'text-gray-700 border border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        }
                        return null;
                      })}
                      
                      {adjustmentsPagination.totalPages > 5 && (
                        <div className="relative ml-1">
                          <select
                            value={adjustmentsPagination.currentPage}
                            onChange={(e) => handleAdjustmentPageChange(Number(e.target.value))}
                            className="appearance-none pl-2 pr-8 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          >
                            {Array.from({ length: adjustmentsPagination.totalPages }, (_, i) => i + 1).map((pageNum) => (
                              <option key={pageNum} value={pageNum}>
                                Page {pageNum}
                              </option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="sm:hidden">
                      <select
                        value={adjustmentsPagination.currentPage}
                        onChange={(e) => handleAdjustmentPageChange(Number(e.target.value))}
                        className="block w-20 px-2 py-1 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      >
                        {Array.from({ length: adjustmentsPagination.totalPages }, (_, i) => i + 1).map((pageNum) => (
                          <option key={pageNum} value={pageNum}>
                            {pageNum}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <button
                      onClick={() => handleAdjustmentPageChange(adjustmentsPagination.currentPage + 1)}
                      disabled={adjustmentsPagination.currentPage === adjustmentsPagination.totalPages}
                      className={`px-3 py-1.5 rounded border text-sm ${
                        adjustmentsPagination.currentPage === adjustmentsPagination.totalPages
                          ? 'text-gray-400 border-gray-200 cursor-not-allowed'
                          : 'text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Adjust Points Modal */}
      {showAdjustModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Adjust Points for {selectedUser.fullName}</h3>
              <button
                onClick={handleCloseAdjustModal}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-700">
                <span className="font-medium">Current Balance:</span> ${selectedUser.rewardPoints || 0}
              </p>
            </div>

            <form onSubmit={handleAdjustPoints} className="space-y-4">
              {/* Adjustment Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adjustment Type *
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="adjustmentType"
                      value="add"
                      checked={adjustmentData.adjustmentType === 'add'}
                      onChange={(e) => setAdjustmentData({ ...adjustmentData, adjustmentType: e.target.value })}
                      className="mr-2"
                    />
                    <span className="text-green-600 font-medium">Add Points</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="adjustmentType"
                      value="subtract"
                      checked={adjustmentData.adjustmentType === 'subtract'}
                      onChange={(e) => setAdjustmentData({ ...adjustmentData, adjustmentType: e.target.value })}
                      className="mr-2"
                    />
                    <span className="text-red-600 font-medium">Subtract Points</span>
                  </label>
                </div>
              </div>

              {/* Points Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Points Amount ($) *
                </label>
                <input
                  type="number"
                  value={adjustmentData.points}
                  onChange={(e) => setAdjustmentData({ ...adjustmentData, points: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter points amount"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              {/* Reason Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason *
                </label>
                <select
                  value={adjustmentData.reason}
                  onChange={(e) => setAdjustmentData({ ...adjustmentData, reason: e.target.value, rewardTaskId: '' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a reason</option>
                  <optgroup label="Reward Tasks">
                    {rewardTasks.map(task => (
                      <option key={task._id} value={task.title} data-task-id={task._id}>
                        {task.title} (${task.reward})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Other">
                    <option value="Store Redemption">Store Redemption</option>
                    <option value="Manual Correction">Manual Correction</option>
                    <option value="Bonus Reward">Bonus Reward</option>
                    <option value="Refund">Refund</option>
                    <option value="custom">Custom Reason</option>
                  </optgroup>
                </select>
              </div>

              {/* Custom Reason */}
              {adjustmentData.reason === 'custom' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Reason *
                  </label>
                  <input
                    type="text"
                    value={adjustmentData.customReason}
                    onChange={(e) => setAdjustmentData({ ...adjustmentData, customReason: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter custom reason"
                    required
                  />
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={adjustmentData.notes}
                  onChange={(e) => setAdjustmentData({ ...adjustmentData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add any additional notes"
                />
              </div>

              {/* Preview */}
              {adjustmentData.points && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                  <p className="text-sm text-gray-600">
                    Current Balance: ${selectedUser.rewardPoints || 0}
                  </p>
                  <p className="text-sm text-gray-600">
                    {adjustmentData.adjustmentType === 'add' ? 'Adding' : 'Subtracting'}: ${adjustmentData.points}
                  </p>
                  <p className="text-sm font-bold text-gray-900">
                    New Balance: ${adjustmentData.adjustmentType === 'add' 
                      ? (selectedUser.rewardPoints || 0) + parseFloat(adjustmentData.points || 0)
                      : Math.max(0, (selectedUser.rewardPoints || 0) - parseFloat(adjustmentData.points || 0))
                    }
                  </p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={handleCloseAdjustModal}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjusting}
                  className={`px-4 py-2 text-white rounded-md hover:opacity-90 disabled:opacity-50 ${
                    adjustmentData.adjustmentType === 'add' ? 'bg-green-600' : 'bg-red-600'
                  }`}
                >
                  {adjusting ? 'Processing...' : `${adjustmentData.adjustmentType === 'add' ? 'Add' : 'Subtract'} Points`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PointsManagement;
