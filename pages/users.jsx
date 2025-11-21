import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import Sidebar from '../components/sidebar';
import { fetchAllUsers, deleteUser, fetchUserById, toast, updateUserStatusAdmin, updateUser } from '../service/service';
import Swal from 'sweetalert2';
import {
  Users,
  Search,
  Edit,
  Trash2,
  Eye,
  Plus,
  Filter,
  Download,
  MoreHorizontal,
  X,
  Mail,
  Phone,
  Calendar,
  User,
  Shield,
  Pencil,
  UserCircle
} from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  // State for data and UI

  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // UI State
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [bulkStatus, setBulkStatus] = useState('');
  const [selectAll, setSelectAll] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userModalLoading, setUserModalLoading] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: 'user',
    status: 'pending',
    birthday: {
      day: '',
      month: '',
      year: ''
    }
  });

  const router = useRouter();

  // Load users when page or filters change
  useEffect(() => {
    const controller = new AbortController();

    const loadUsers = async () => {
      try {
        setLoading(true);
        const params = {
          page,
          limit: 10,
          status: filterStatus === 'all' ? undefined : filterStatus,
          search: searchTerm
        };

        const response = await fetchAllUsers(router, params);
        if (response.success) {
          setUsers(response.data || []);
          if (response.meta) {
            setTotalPages(response.meta.totalPages || 1);
          }
        } else {
          toast.error('Failed to load users');
        }
      } catch (error) {
        console.error('Error loading users:', error);
        toast.error('Error loading users');
      } finally {
        setLoading(false);
      }
    };

    loadUsers();

    return () => {
      controller.abort();
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [page, filterStatus, searchTerm]);

  const handleSearch = useCallback((e) => {
    const value = e.target.value;

    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Set a new timeout
    const newTimeout = setTimeout(() => {
      setSearchTerm(value); // Move searchTerm update inside timeout
      setPage(1);
    }, 500);

    setSearchTimeout(newTimeout);
  }, [searchTimeout]);

  // Memoize filtered users to prevent unnecessary re-renders
  const filteredUsers = useMemo(() =>
    users.filter(user => filterRole === 'all' || user.role === filterRole),
    [users, filterRole]
  );

  // Handle delete user
  useEffect(() => {
    const controller = new AbortController();

    const fetchData = async () => {
      try {
        setLoading(true);
        const params = {
          page,
          limit: 10,
          status: filterStatus === 'all' ? undefined : filterStatus,
          search: searchTerm
        };

        const response = await fetchAllUsers(router, params);

        if (response.success) {
          setUsers(response.data || []);
          if (response.meta) {
            setTotalPages(response.meta.totalPages || 1);
          }
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error loading users:', error);
          toast.error('Error loading users');
        }
      } finally {
        setLoading(false);
        if (isInitialLoad) setIsInitialLoad(false);
      }
    };

    fetchData();

    return () => {
      controller.abort();
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [page, filterStatus, searchTerm, isInitialLoad]);

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const response = await deleteUser(userId, router);
        if (response.success) {
          toast.success('User deleted successfully');
          loadUsers(); // Reload the list
        } else {
          toast.error('Failed to delete user');
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        toast.error('Error deleting user');
      }
    }
  };

  const handleEditUser = (userId) => {
    // Navigate to edit user page (you can implement this later)
    router.push(`/users/edit/${userId}`);
  };

  const handleViewUser = async (userId) => {
    try {
      setUserModalLoading(true);
      setShowUserModal(true);
      setIsEditMode(false);

      const response = await fetchUserById(userId, router);
      if (response.success) {
        setSelectedUser(response.data);
        // Initialize form data with user data including birthday
        setFormData({
          fullName: response.data.fullName || '',
          email: response.data.email || '',
          phone: response.data.phone || '',
          role: response.data.role || 'user',
          status: response.data.status || 'pending',
          birthday: response.data.birthday || {
            day: '',
            month: '',
            year: ''
          }
        });
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
    setIsEditMode(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateChange = (e) => {
    const { value } = e.target;
    if (value) {
      const date = new Date(value);
      setFormData(prev => ({
        ...prev,
        birthday: {
          day: date.getDate(),
          month: date.getMonth() + 1, // Months are 0-indexed
          year: date.getFullYear()
        }
      }));
    }
  };

  const handleSaveUser = async () => {
    if (!selectedUser?._id) return;
    
    try {
      setUserModalLoading(true);
      
      // Prepare the data to be sent
      const updateData = {
        ...formData,
        // Include the birthday data in the correct format
        birthday: formData.birthday
      };
      
      // Use the updateUser service function
      const response = await updateUser(selectedUser._id, updateData, router);
      
      if (response.success) {
        // Show SweetAlert2 confirmation
        await Swal.fire({
          title: 'Success!',
          text: 'User profile has been updated successfully.',
          icon: 'success',
          confirmButtonColor: '#3085d6',
          timer: 2000,
          timerProgressBar: true
        });
        
        toast.success('User updated successfully');
        setSelectedUser(response.data);
        setIsEditMode(false);
        
        // Refresh users list
        const usersResponse = await fetchAllUsers(router, {
          page,
          limit: 10,
          status: filterStatus === 'all' ? undefined : filterStatus,
          search: searchTerm
        });
        
        if (usersResponse.success) {
          setUsers(usersResponse.data || []);
          if (usersResponse.meta) {
            setTotalPages(usersResponse.meta.totalPages || 1);
          }
        }
      } else {
        throw new Error(response.message || 'Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      // Check if this is a network error or API error
      if (error.message.includes('Network Error')) {
        toast.error('Cannot connect to the server. Please check your connection.');
      } else if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        console.error('Error response headers:', error.response.headers);
        toast.error(error.response.data?.message || 'Error updating user');
      } else if (error.request) {
        // The request was made but no response was received
        console.error('Error request:', error.request);
        toast.error('No response from server. Please try again.');
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error message:', error.message);
        toast.error(error.message || 'Error updating user');
      }
    } finally {
      setUserModalLoading(false);
    }
  };

  // Status filter options
  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'verified', label: 'Verified' },
    { value: 'suspend', label: 'Suspended' },
    { value: 'incomplete', label: 'Incomplete' }
  ];

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getRoleBadge = (role) => {
    const roleColors = {
      admin: 'bg-red-100 text-red-800',
      user: 'bg-green-100 text-green-800'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${roleColors[role] || 'bg-gray-100 text-gray-800'}`}>
        {role}
      </span>
    );
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

  // Toggle select/deselect all users
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(user => user._id));
    }
    setSelectAll(!selectAll);
  };

  // Toggle selection for a single user
  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Update status for multiple users
  const handleBulkStatusUpdate = async () => {
    if (!bulkStatus || selectedUsers.length === 0) return;

    try {
      const result = await Swal.fire({
        title: 'Confirm Status Update',
        text: `Are you sure you want to update status for ${selectedUsers.length} user(s) to ${bulkStatus}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, update all!',
        cancelButtonText: 'Cancel'
      });

      if (result.isConfirmed) {
        const updatePromises = selectedUsers.map(userId => 
          updateUserStatusAdmin(userId, bulkStatus, router)
        );
        
        const results = await Promise.all(updatePromises);
        const successCount = results.filter(res => res?.success).length;
        
        if (successCount > 0) {
          await Swal.fire({
            title: 'Success!',
            text: `Updated status for ${successCount} user(s) successfully.`,
            icon: 'success',
            confirmButtonColor: '#3085d6',
            timer: 2000,
            timerProgressBar: true
          });
          
          // Refresh the users list
          const response = await fetchAllUsers(router, {
            page,
            limit: 10,
            status: filterStatus === 'all' ? undefined : filterStatus,
            search: searchTerm
          });

          if (response.success) {
            setUsers(response.data || []);
            if (response.meta) {
              setTotalPages(response.meta.totalPages || 1);
            }
          }
          
          // Reset selection
          setSelectedUsers([]);
          setSelectAll(false);
          setBulkStatus('');
        } else {
          throw new Error('Failed to update any users');
        }
      }
    } catch (error) {
      console.error('Bulk update error:', error);
      Swal.fire({
        title: 'Error!',
        text: 'Failed to update some or all users',
        icon: 'error',
        confirmButtonColor: '#3085d6'
      });
    }
  };

  const handleChangeStatus = async (userId, status) => {
    try {
      // First show confirmation dialog
      const result = await Swal.fire({
        title: 'Confirm Status Change',
        text: `Are you sure you want to change status to ${status}?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, update it!',
        cancelButtonText: 'Cancel'
      });

      if (result.isConfirmed) {
        const res = await updateUserStatusAdmin(userId, status, router);
        if (res.success) {
          // Show success message with SweetAlert2
          await Swal.fire({
            title: 'Success!',
            text: 'User status has been updated successfully.',
            icon: 'success',
            confirmButtonColor: '#3085d6',
            timer: 2000,
            timerProgressBar: true
          });
          // Refresh the users list after successful status update
          const response = await fetchAllUsers(router, {
            page,
            limit: 10,
            status: filterStatus === 'all' ? undefined : filterStatus,
            search: searchTerm
          });

          if (response.success) {
            setUsers(response.data || []);
            if (response.meta) {
              setTotalPages(response.meta.totalPages || 1);
            }
          }
        } else {
          // Show error message with SweetAlert2
          await Swal.fire({
            title: 'Error!',
            text: res.message || 'Failed to update status',
            icon: 'error',
            confirmButtonColor: '#3085d6'
          });
        }
      }
    } catch (error) {
      console.error('Status update error:', error);

      await Swal.fire({
        title: 'Error!',
        text: 'Error updating status',
        icon: 'error',
        confirmButtonColor: '#3085d6'
      });
    }
  };

  const formatBirthday = (birthday) => {
    if (!birthday) return 'Not provided';
    return `${birthday.day} ${birthday.month} ${birthday.year}`;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <div className="hidden md:block"><Sidebar /></div>
        <div className="flex-1 md:ml-[240px] p-8">
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 relative">
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
        <span className="font-semibold">Users</span>
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
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Users</h1>
              <p className="text-gray-600 mt-2">Manage all registered users</p>
            </div>
            {/* <div className="flex items-center space-x-3">
               <button className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                 <Download className="h-4 w-4 mr-2" />
                 Export
               </button>
               <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                 <Plus className="h-4 w-4 mr-2" />
                 Add User
               </button>
             </div> */}
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedUsers.length > 0 && (
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-4 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="text-sm text-blue-800">
                {selectedUsers.length} user(s) selected
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <select
                  value={bulkStatus}
                  onChange={(e) => setBulkStatus(e.target.value)}
                  className="block w-full sm:w-40 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select status</option>
                  <option value="verified">Mark as Verified</option>
                  <option value="pending">Mark as Pending</option>
                  <option value="suspend">Mark as Suspended</option>
                  <option value="incomplete">Mark as Incomplete</option>
                </select>
                <button
                  onClick={handleBulkStatusUpdate}
                  disabled={!bulkStatus}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${bulkStatus ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
                >
                  Apply
                </button>
                <button
                  onClick={() => {
                    setSelectedUsers([]);
                    setSelectAll(false);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={searchInput}
                  onChange={(e) => {
                    setSearchInput(e.target.value); // Update local state immediately
                    handleSearch(e); // Debounced search
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && fetchAllUsers(router, {
                    page,
                    limit: 10,
                    status: filterStatus === 'all' ? undefined : filterStatus,
                    search: searchInput
                  })}
                />
              </div>

              <div className="w-full sm:w-48">
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="user">User</option>
                </select>
              </div>

              <div className="w-full sm:w-48">
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {filteredUsers.length} of {users.length} users
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectAll && users.length > 0}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-2"
                      />
                      User
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user._id} className={`hover:bg-gray-50 ${selectedUsers.includes(user._id) ? 'bg-blue-50' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user._id)}
                          onChange={() => toggleUserSelection(user._id)}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-3"
                        />
                        <div className="flex-shrink-0 h-10 w-10">
                          {user.avatar ? (
                            <img
                              className="h-10 w-10 rounded-full"
                              src={user.avatar}
                              alt={user.fullName}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-blue-600 font-medium">
                                {user.fullName?.charAt(0)?.toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.fullName}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {user._id.slice(-8)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email}</div>
                      <div className="text-sm text-gray-500">{user.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(user.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewUser(user._id)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="View User"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => router.push(`/admin/order/${user._id}`)}
                          className="text-blue-600 hover:text-blue-900 p-1 border-2 rounded-lg"
                          title="View User"
                        >
                          Orders
                        </button>
                        <select
                          value={user.status || 'pending'}
                          onChange={(e) => handleChangeStatus(user._id, e.target.value)}
                          className="px-2 py-1 text-xs border border-gray-300 rounded"
                        >
                          <option value="pending">Pending</option>
                          <option value="suspend">Suspend</option>
                          <option value="verified">Verified</option>
                          <option value="incomplete">Incomplete</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || filterRole !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Get started by adding a new user.'
                }
              </p>
            </div>
          )}
        </div>

        {/* Pagination inside table area */}
        <div className="px-4 py-3 bg-white border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-600">
            Showing page {page} of {totalPages}
          </div>
          
          {/* Page selection dropdown for mobile */}
          <div className="sm:hidden w-full">
            <div className="flex items-center justify-center space-x-2">
              <span className="text-sm text-gray-600">Go to page:</span>
              <select
                value={page}
                onChange={(e) => setPage(Number(e.target.value))}
                className="block w-20 px-2 py-1 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              >
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <option key={pageNum} value={pageNum}>
                    {pageNum}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className={`px-3 py-1.5 rounded border ${page === 1 ? 'text-gray-400 border-gray-200' : 'text-gray-700 border-gray-300 hover:bg-gray-50'}`}
            >
              Previous
            </button>
            
            {/* Page numbers - only show on larger screens */}
            <div className="hidden sm:flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                // Show first 2 pages, current page, and last 2 pages
                let pageNum;
                if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                
                if (pageNum > 0 && pageNum <= totalPages) {
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-8 h-8 flex items-center justify-center rounded ${page === pageNum
                        ? 'bg-indigo-600 text-white'
                        : 'text-gray-700 border border-gray-300 hover:bg-gray-50'}`}
                    >
                      {pageNum}
                    </button>
                  );
                }
                return null;
              })}
              
              {/* Page dropdown for desktop */}
              {totalPages > 5 && (
                <div className="relative ml-1">
                  <select
                    value={page}
                    onChange={(e) => setPage(Number(e.target.value))}
                    className="appearance-none pl-2 pr-8 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                      <option key={pageNum} value={pageNum}>
                        {pageNum}
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
            
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className={`px-3 py-1.5 rounded border ${page === totalPages ? 'text-gray-400 border-gray-200' : 'text-gray-700 border-gray-300 hover:bg-gray-50'}`}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* User Details Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {isEditMode ? 'Edit User' : 'User Details'}
              </h2>
              <div className="flex items-center space-x-2">
                {!isEditMode && (
                  <button
                    type="button"
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    onClick={() => setIsEditMode(true)}
                  >
                    <Pencil className="h-3 w-3 mr-1" />
                    Edit User
                  </button>
                )}
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-500"
                  onClick={closeUserModal}
                >
                  <span className="sr-only">Close</span>
                  <X className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {userModalLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : selectedUser ? (
                <div className="space-y-6">
                  {/* User Avatar and Basic Info */}
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {selectedUser.avatar ? (
                        <img
                          className="h-16 w-16 rounded-full"
                          src={selectedUser.avatar}
                          alt={selectedUser.fullName}
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-600 font-bold text-xl">
                            {selectedUser.fullName?.charAt(0)?.toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {selectedUser.fullName}
                      </h3>
                      <p className="text-sm text-gray-500">User ID: {selectedUser._id}</p>
                      <div className="mt-1">
                        {getRoleBadge(selectedUser.role)}
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
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

                  {/* User Info */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                      <UserCircle className="h-4 w-4 mr-2" />
                      Basic Information
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <label className="text-sm font-medium text-gray-600 w-20">Name:</label>
                        {isEditMode ? (
                          <input
                            type="text"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleInputChange}
                            className="ml-2 flex-1 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          <span className="text-gray-900 ml-2">{selectedUser.fullName}</span>
                        )}
                      </div>
                      <div className="flex items-center">
                        <label className="text-sm font-medium text-gray-600 w-20">Email:</label>
                        {isEditMode ? (
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="ml-2 flex-1 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          <span className="text-gray-900 ml-2">{selectedUser.email}</span>
                        )}
                      </div>
                      <div className="flex items-center">
                        <label className="text-sm font-medium text-gray-600 w-20">Phone:</label>
                        {isEditMode ? (
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            className="ml-2 flex-1 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          <span className="text-gray-900 ml-2">{selectedUser.phone || 'N/A'}</span>
                        )}
                      </div>
                      <div className="flex items-center">
                        <label className="text-sm font-medium text-gray-600 w-20">Role:</label>
                        {isEditMode ? (
                          <select
                            name="role"
                            value={formData.role}
                            onChange={handleInputChange}
                            className="ml-2 flex-1 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        ) : (
                          <span className="text-gray-900 ml-2">{getRoleBadge(selectedUser.role)}</span>
                        )}
                      </div>
                      <div className="flex items-center">
                        <label className="text-sm font-medium text-gray-600 w-20">Status:</label>
                        {isEditMode ? (
                          <select
                            name="status"
                            value={formData.status}
                            onChange={handleInputChange}
                            className="ml-2 flex-1 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="pending">Pending</option>
                            <option value="verified">Verified</option>
                            <option value="suspend">Suspended</option>
                          </select>
                        ) : (
                          <span className="text-gray-900 ml-2">{getStatusBadge(selectedUser.status)}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Account Created</h3>
                      <p className="mt-1 text-sm text-gray-900">
                        {new Date(selectedUser.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Status</h3>
                      <div className="mt-1">
                        {getStatusBadge(selectedUser.status)}
                      </div>
                    </div>
                  </div>

                  {/* Medication Information */}
                  <div className="mt-6 space-y-2">
                    <h3 className="text-sm font-medium text-gray-700">Medication Information</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-xs font-medium text-gray-500">Takes Medication</h4>
                          <p className="mt-1 text-sm text-gray-900">
                            {selectedUser.takesMedication ? 'Yes' : 'No'}
                          </p>
                        </div>
                        {selectedUser.takesMedication && selectedUser.medicationDetails && (
                          <div>
                            <h4 className="text-xs font-medium text-gray-500">Medication Details</h4>
                            <p className="mt-1 text-sm text-gray-900 break-words">
                              {selectedUser.medicationDetails}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Account Information */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                      <Shield className="h-4 w-4 mr-2" />
                      Account Information
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <span className="font-medium text-gray-600 w-24">Role:</span>
                        <span className="text-gray-900">{getRoleBadge(selectedUser.role)}</span>
                      </div>
                      <div className="flex items-center">
                        <label className="text-sm font-medium text-gray-600 w-24">Birthday:</label>
                        {isEditMode ? (
                          <div className="flex space-x-2">
                            <input
                              type="date"
                              value={formData.birthday && formData.birthday.year 
                                ? `${formData.birthday.year}-${String(formData.birthday.month).padStart(2, '0')}-${String(formData.birthday.day).padStart(2, '0')}`
                                : ''}
                              onChange={handleDateChange}
                              className="ml-2 flex-1 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        ) : (
                          <span className="text-gray-900 ml-2">{formatBirthday(selectedUser.birthday)}</span>
                        )}
                      </div>
                      {selectedUser.status && (
                        <div className="flex items-center text-sm">
                          <span className="font-medium text-gray-600 w-24">Status:</span>
                          <span className="text-gray-900">{getStatusBadge(selectedUser.status)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Additional Information */}
                  {selectedUser.avatar && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Profile Picture</h4>
                      <img
                        src={selectedUser.avatar}
                        alt={selectedUser.fullName}
                        className="h-32 w-32 rounded-lg object-cover"
                      />
                    </div>
                  )}

                  {selectedUser.governmentId && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Government ID</h4>
                      {/\.pdf($|\?)/i.test(selectedUser.governmentId) ? (
                        <div className="w-full h-96">
                          <iframe src={selectedUser.governmentId} className="w-full h-full rounded" />
                        </div>
                      ) : (
                        <img
                          src={selectedUser.governmentId}
                          alt="Government ID"
                          className="max-h-96 rounded object-contain"
                        />
                      )}
                      <div className="mt-2">
                        <a href={selectedUser.governmentId} target="_blank" rel="noreferrer" className="text-blue-600 underline text-sm">
                          Open original
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">No user data available</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
              {isEditMode ? (
                <>
                  <button
                    type="button"
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    onClick={() => setIsEditMode(false)}
                    disabled={userModalLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    onClick={handleSaveUser}
                    disabled={userModalLoading}
                  >
                    {userModalLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </>
              ) : (
                <button
                  onClick={closeUserModal}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
