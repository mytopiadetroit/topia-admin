import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { 
  fetchAllRewardRequests, 
  updateRewardStatus, 
  fetchRewardStats,
  toast 
} from '../service/service';
import Swal from 'sweetalert2';
import Sidebar from '@/components/sidebar';

const RewardsManagement = () => {
  const router = useRouter();
  const [rewardRequests, setRewardRequests] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'pending',
    page: 1,
    limit: 10
  });
  const [pagination, setPagination] = useState({});
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadRewardRequests();
    loadStats();
  }, [filters]);

  const loadRewardRequests = async () => {
    try {
      setLoading(true);
      const response = await fetchAllRewardRequests(router, filters);
      console.log('Reward requests:', response);
      if (response.success) {
        setRewardRequests(response.data);
        setPagination(response.pagination);
      }
    } catch (error) {
      toast.error('Error loading reward requests');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetchRewardStats(router);
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleStatusUpdate = async (rewardId, newStatus) => {
    const actionText = newStatus === 'approved' ? 'approve' : 'reject';
    const confirmResult = await Swal.fire({
      title: `${actionText.charAt(0).toUpperCase() + actionText.slice(1)} Reward?`,
      text: `Are you sure you want to ${actionText} this reward request?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: newStatus === 'approved' ? '#10B981' : '#EF4444',
      cancelButtonColor: '#6B7280',
      confirmButtonText: `Yes, ${actionText} it!`,
      cancelButtonText: 'Cancel'
    });

    if (!confirmResult.isConfirmed) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await updateRewardStatus(rewardId, {
        status: newStatus,
        adminNotes: ''
      }, router);
      
      if (response.success) {
        // Show success message
        Swal.fire({
          title: 'Success!',
          text: `Reward has been ${newStatus} successfully.`,
          icon: 'success',
          confirmButtonColor: '#10B981'
        });
        
        // Refresh the data
        loadRewardRequests();
        loadStats();
      } else {
        Swal.fire({
          title: 'Error!',
          text: response.message || 'Failed to update reward status.',
          icon: 'error',
          confirmButtonColor: '#EF4444'
        });
      }
    } catch (error) {
      console.error('Error updating reward status:', error);
      Swal.fire({
        title: 'Error!',
        text: 'An error occurred while updating the reward status.',
        icon: 'error',
        confirmButtonColor: '#EF4444'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1
    }));
  };

  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const openDetailModal = (request) => {
    setSelectedRequest(request);
    setShowDetailModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      {/* Main Content - Fixed the layout structure */}
      <div className="flex-1 lg:ml-64 w-full">
        <div className="p-6 w-full">
          {/* Header */}
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Reward Management</h1>
              <p className="text-gray-600">Manage and verify reward claims</p>
            </div>
            <button
              onClick={() => router.push('/reward-tasks')}
              className="px-4 py-2 bg-[#80A6F7] text-white rounded-md hover:bg-[#6B8FE6] transition-colors"
            >
              Manage Tasks
            </button>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="text-xs font-medium text-gray-500 mb-1">Total Requests</h3>
                <p className="text-xl font-bold text-gray-900">{stats.overview.totalRequests}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="text-xs font-medium text-gray-500 mb-1">Pending</h3>
                <p className="text-xl font-bold text-yellow-600">{stats.overview.pendingRequests}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="text-xs font-medium text-gray-500 mb-1">Approved</h3>
                <p className="text-xl font-bold text-green-600">{stats.overview.approvedRequests}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="text-xs font-medium text-gray-500 mb-1">Rejected</h3>
                <p className="text-xl font-bold text-red-600">{stats.overview.rejectedRequests}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="text-xs font-medium text-gray-500 mb-1">Total Paid</h3>
                <p className="text-xl font-bold text-blue-600">${stats.overview.totalAmountPaid}</p>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* Requests Table - Full Width Container */}
          <div className="w-full bg-white rounded-lg shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading requests...</p>
              </div>
            ) : rewardRequests.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500">No reward requests found</p>
              </div>
            ) : (
              <>
                {/* Table with full width */}
                <div className="w-full overflow-x-auto">
                  <table className="w-full min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Task
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Submitted
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {rewardRequests.map((request) => (
                        <tr key={request._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {request.user?.fullName || 'Unknown User'}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {request.user?.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{request.taskTitle}</div>
                            <div className="text-sm text-gray-500">ID: {request.taskId}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${request.amount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(request.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(request.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex space-x-3">
                              <button
                                onClick={() => openDetailModal(request)}
                                className="text-white bg-[#80A6F7] rounded-2xl py-1 px-3 hover:text-white"
                              >
                                View Details
                              </button>
                              {/* {request.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleStatusUpdate(request._id, 'approved')}
                                    className="text-green-600 hover:text-green-900"
                                    disabled={actionLoading}
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleStatusUpdate(request._id, 'rejected')}
                                    className="text-red-600 hover:text-red-900"
                                    disabled={actionLoading}
                                  >
                                    Reject
                                  </button>
                                </>
                              )} */}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                    <div className="flex-1 flex justify-between sm:hidden">
                      <button
                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                        disabled={pagination.currentPage === 1}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                        disabled={pagination.currentPage === pagination.totalPages}
                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Showing{' '}
                          <span className="font-medium">
                            {(pagination.currentPage - 1) * pagination.itemsPerPage + 1}
                          </span>{' '}
                          to{' '}
                          <span className="font-medium">
                            {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)}
                          </span>{' '}
                          of{' '}
                          <span className="font-medium">{pagination.totalItems}</span> results
                        </p>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                            <button
                              key={page}
                              onClick={() => handlePageChange(page)}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                page === pagination.currentPage
                                  ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                              }`}
                            >
                              {page}
                            </button>
                          ))}
                        </nav>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Reward Request Details</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">User</label>
                  <p className="text-sm text-gray-900">{selectedRequest.user?.name}</p>
                  <p className="text-xs text-gray-500">{selectedRequest.user?.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Task</label>
                  <p className="text-sm text-gray-900">{selectedRequest.taskTitle}</p>
                  <p className="text-xs text-gray-500">ID: {selectedRequest.taskId}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Amount</label>
                  <p className="text-sm text-gray-900">${selectedRequest.amount}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  {getStatusBadge(selectedRequest.status)}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Proof Type</label>
                <p className="text-sm text-gray-900 capitalize">{selectedRequest.proofType}</p>
              </div>

              {selectedRequest.proofText && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Proof Description</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded">{selectedRequest.proofText}</p>
                </div>
              )}

              {selectedRequest.proofImage && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Proof Image</label>
                  <img
                    src={selectedRequest.proofImage.startsWith('http') ? selectedRequest.proofImage : `http://localhost:5000${selectedRequest.proofImage}`}
                    alt="Proof"
                    className="max-w-full h-auto rounded border"
                  />
                </div>
              )}

              {selectedRequest.proofAudio && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Proof Audio</label>
                  <audio controls className="w-full">
                    <source src={selectedRequest.proofAudio.startsWith('http') ? selectedRequest.proofAudio : `http://localhost:5000${selectedRequest.proofAudio}`} />
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}

              {selectedRequest.proofVideo && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Proof Video</label>
                  <video controls className="w-full max-h-64">
                    <source src={selectedRequest.proofVideo.startsWith('http') ? selectedRequest.proofVideo : `http://localhost:5000${selectedRequest.proofVideo}`} />
                    Your browser does not support the video element.
                  </video>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">Submitted</label>
                <p className="text-sm text-gray-900">{new Date(selectedRequest.createdAt).toLocaleString()}</p>
              </div>

              {selectedRequest.adminNotes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Admin Notes</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded">{selectedRequest.adminNotes}</p>
                </div>
              )}
            </div>

            {selectedRequest.status === 'pending' && (
              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                <button
                  onClick={() => handleStatusUpdate(selectedRequest._id, 'rejected')}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Processing...' : 'Reject'}
                </button>
                <button
                  onClick={() => handleStatusUpdate(selectedRequest._id, 'approved')}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Processing...' : 'Approve'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RewardsManagement;