import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import Sidebar from '../components/sidebar';
import { fetchAllVisitors, archiveVisitor, toast } from '../service/service';
import Swal from 'sweetalert2';
import { Search, Users, UserCheck, UserX, Calendar } from 'lucide-react';

const Visitors = () => {
  const router = useRouter();
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState({
    totalVisitors: 0,
    totalMembers: 0,
    totalNonMembers: 0,
    todayVisitors: 0,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [memberFilter, setMemberFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userModalLoading, setUserModalLoading] = useState(false);
  const [michiganTime, setMichiganTime] = useState('');
  const [timeUntilReset, setTimeUntilReset] = useState('');

  useEffect(() => {
    loadVisitors();
  }, [searchTerm, memberFilter, dateFilter, currentPage]);

  // Timer for Michigan time and countdown to reset
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
        day: 'numeric'
      });
      setMichiganTime(michiganTimeStr);
      
      // Calculate time until midnight Michigan time
      const michiganDateStr = now.toLocaleString('en-US', {
        timeZone: 'America/Detroit',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      
      const [datePart, timePart] = michiganDateStr.split(', ');
      const [month, day, year] = datePart.split('/');
      const [hours, minutes, seconds] = timePart.split(':');
      
      // Calculate seconds until midnight
      const currentSeconds = parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds);
      const secondsUntilMidnight = 86400 - currentSeconds; // 86400 = 24 hours in seconds
      
      const hoursLeft = Math.floor(secondsUntilMidnight / 3600);
      const minutesLeft = Math.floor((secondsUntilMidnight % 3600) / 60);
      const secondsLeft = secondsUntilMidnight % 60;
      
      setTimeUntilReset(`${hoursLeft}h ${minutesLeft}m ${secondsLeft}s`);
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const loadVisitors = async () => {
    try {
      setLoading(true);
      const response = await fetchAllVisitors(router, {
        page: currentPage,
        limit: 20,
        search: searchTerm,
        memberFilter,
        date: dateFilter,
      });
      if (response.success) {
        setVisitors(response.data);
        setTotalPages(response.pagination?.pages || 1);
        setStatistics(response.statistics);
      }
    } catch (error) {
      console.error('Error loading visitors:', error);
      toast.error('Failed to load visitors');
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async (visitor) => {
    const result = await Swal.fire({
      title: 'Archive Visitor?',
      html: `
        <p>Are you sure you want to archive visitor <strong>${visitor.phone}</strong>?</p>
        <p class="text-sm text-gray-600 mt-2">The visitor data will be preserved and can be restored later if needed.</p>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#F59E0B',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, archive it!',
      cancelButtonText: 'Cancel',
    });

    if (!result.isConfirmed) return;

    try {
      const response = await archiveVisitor(visitor._id, router);
      if (response.success) {
        Swal.fire({
          title: 'Archived!',
          text: 'Visitor has been archived successfully.',
          icon: 'success',
          confirmButtonColor: '#10B981',
        });
        loadVisitors();
      }
    } catch (error) {
      console.error('Error archiving visitor:', error);
      toast.error('Failed to archive visitor');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Detroit', // Display in Michigan timezone
      timeZoneName: 'short'
    });
  };

  const handleViewUser = async (visitor) => {
    if (!visitor || !visitor.userId) return;
    
    try {
      setUserModalLoading(true);
      setShowUserModal(true);
      
      const response = await fetch(`https://api.mypsyguide.io/api/users/${visitor.userId._id}`, {
        headers: {
          'Authorization': `jwt ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        // Merge visitor data (visitCount, visits history) with user data
        const userData = {
          ...result.data,
          visitCount: visitor.visitCount || 0,
          lastVisit: visitor.lastVisit,
          visits: visitor.visits || [] // Include visit history
        };
        console.log('User data with visits:', userData);
        setSelectedUser(userData);
      } else {
        toast.error('Failed to load user details');
        setShowUserModal(false);
      }
    } catch (error) {
      console.error('Error loading user:', error);
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

  return (
    <Layout>
      <div className="flex min-h-screen bg-gray-100">
        <Sidebar />

        <div className="flex-1 ml-0 md:ml-20">
          <div className="p-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Store Visitors</h1>
                  <p className="text-gray-600">Track and manage store check-ins</p>
                </div>
                <button
                  onClick={() => router.push('/archived-visitors')}
                  className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                  View Archive
                </button>
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Visitors</p>
                    <p className="text-3xl font-bold text-gray-900">{statistics.totalVisitors}</p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-full">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Members</p>
                    <p className="text-3xl font-bold text-green-600">{statistics.totalMembers}</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <UserCheck className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Non-Members</p>
                    <p className="text-3xl font-bold text-orange-600">{statistics.totalNonMembers}</p>
                  </div>
                  <div className="bg-orange-100 p-3 rounded-full">
                    <UserX className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Today's Visitors</p>
                    <p className="text-3xl font-bold text-purple-600">{statistics.todayVisitors}</p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-full">
                    <Calendar className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Michigan Time & Reset Timer */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow-sm p-6 mb-6 border border-blue-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-blue-500 p-3 rounded-full">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Michigan Time (EST/EDT)</p>
                    <p className="text-2xl font-bold text-gray-900">{michiganTime || 'Loading...'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="bg-purple-500 p-3 rounded-full">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Reset In (Midnight EST/EDT)</p>
                    <p className="text-2xl font-bold text-purple-600">{timeUntilReset || 'Loading...'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by phone number..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Member Filter */}
                <select
                  value={memberFilter}
                  onChange={(e) => {
                    setMemberFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Visitors</option>
                  <option value="members">Members Only</option>
                  <option value="non-members">Non-Members Only</option>
                </select>

                {/* Date Filter */}
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => {
                    setDateFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Filter by date"
                />
              </div>
              {dateFilter && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Showing visitors for: <span className="font-semibold">{new Date(dateFilter).toLocaleDateString()}</span>
                  </p>
                  <button
                    onClick={() => setDateFilter('')}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Clear Date Filter
                  </button>
                </div>
              )}
            </div>

            {/* Visitors Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading visitors...</p>
                </div>
              ) : visitors.length === 0 ? (
                <div className="p-8 text-center">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No visitors found</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Phone Number
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Member Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Visit Count
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Last Visit
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {visitors.map((visitor) => (
                          <tr key={visitor._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{visitor.phone}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {visitor.isMember ? (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <UserCheck className="w-3 h-3 mr-1" />
                                  Member
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                  <UserX className="w-3 h-3 mr-1" />
                                  Not a Member
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {visitor.userId?.fullName || '-'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{visitor.visitCount}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{formatDate(visitor.lastVisit)}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <div className="flex items-center space-x-3">
                                {visitor.isMember && visitor.userId && (
                                  <button
                                    onClick={() => handleViewUser(visitor)}
                                    className="text-blue-600 hover:text-blue-900"
                                    title="View Details"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                  </button>
                                )}
                                <button
                                  onClick={() => handleArchive(visitor)}
                                  className="text-orange-600 hover:text-orange-900"
                                  title="Archive"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="px-4 py-3 bg-white border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="text-sm text-gray-600">
                        Showing page {currentPage} of {totalPages}
                      </div>
                      
                      {/* Page selection dropdown for mobile */}
                      <div className="sm:hidden w-full">
                        <div className="flex items-center justify-center space-x-2">
                          <span className="text-sm text-gray-600">Go to page:</span>
                          <select
                            value={currentPage}
                            onChange={(e) => setCurrentPage(Number(e.target.value))}
                            className="block w-20 px-2 py-1 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
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
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className={`px-3 py-1.5 rounded border ${currentPage === 1 ? 'text-gray-400 border-gray-200' : 'text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                        >
                          Previous
                        </button>
                        
                        {/* Page numbers - only show on larger screens */}
                        <div className="hidden sm:flex items-center space-x-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            // Show first 2 pages, current page, and last 2 pages
                            let pageNum;
                            if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }
                            
                            if (pageNum > 0 && pageNum <= totalPages) {
                              return (
                                <button
                                  key={pageNum}
                                  onClick={() => setCurrentPage(pageNum)}
                                  className={`w-8 h-8 flex items-center justify-center rounded ${currentPage === pageNum
                                    ? 'bg-blue-600 text-white'
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
                                value={currentPage}
                                onChange={(e) => setCurrentPage(Number(e.target.value))}
                                className="appearance-none pl-2 pr-8 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
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
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className={`px-3 py-1.5 rounded border ${currentPage === totalPages ? 'text-gray-400 border-gray-200' : 'text-gray-700 border-gray-300 hover:bg-gray-50'}`}
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

      {/* User Details Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Member Details</h2>
              <button
                onClick={closeUserModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              {userModalLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : selectedUser ? (
                <div className="space-y-6">
                  {/* User Info */}
                  <div className="flex items-center space-x-4">
                    <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-xl">
                        {selectedUser.fullName?.charAt(0)?.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{selectedUser.fullName}</h3>
                      <p className="text-sm text-gray-500">{selectedUser.email}</p>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-xs font-medium text-gray-500 uppercase">Reward Points</h3>
                      <p className="mt-1 text-2xl font-bold text-green-600">${selectedUser.rewardPoints || 0}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-xs font-medium text-gray-500 uppercase">Store Visits</h3>
                      <p className="mt-1 text-2xl font-bold text-blue-600">{selectedUser.visitCount || 0}</p>
                      {selectedUser.lastVisit && (
                        <p className="text-xs text-gray-500 mt-1">
                          Last: {new Date(selectedUser.lastVisit).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-xs font-medium text-gray-500 uppercase">Status</h3>
                      <p className="mt-1">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          selectedUser.status === 'active' ? 'bg-green-100 text-green-800' :
                          selectedUser.status === 'suspend' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {selectedUser.status}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-gray-700">Contact Information</h3>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <div className="flex items-center text-sm">
                        <span className="font-medium text-gray-600 w-24">Email:</span>
                        <span className="text-gray-900">{selectedUser.email}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <span className="font-medium text-gray-600 w-24">Phone:</span>
                        <span className="text-gray-900">{selectedUser.phone}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <span className="font-medium text-gray-600 w-24">Role:</span>
                        <span className="text-gray-900">{selectedUser.role}</span>
                      </div>
                    </div>
                  </div>

                  {/* Account Info */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-gray-700">Account Information</h3>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <div className="flex items-center text-sm">
                        <span className="font-medium text-gray-600 w-32">Created:</span>
                        <span className="text-gray-900">{new Date(selectedUser.createdAt).toLocaleDateString()}</span>
                      </div>
                      {selectedUser.birthday && (
                        <div className="flex items-center text-sm">
                          <span className="font-medium text-gray-600 w-32">Birthday:</span>
                          <span className="text-gray-900">
                            {selectedUser.birthday.month}/{selectedUser.birthday.day}/{selectedUser.birthday.year}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Government ID */}
                  {selectedUser.governmentId && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-gray-700">Government ID</h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <a
                          href={selectedUser.governmentId}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          View Government ID Document
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No user data available</p>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Visitors;
