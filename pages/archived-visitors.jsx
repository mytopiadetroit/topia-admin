import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import Sidebar from '../components/sidebar';
import { fetchArchivedVisitors, unarchiveVisitor, toast } from '../service/service';
import Swal from 'sweetalert2';
import { Search, Users, Archive, RotateCcw } from 'lucide-react';

const ArchivedVisitors = () => {
  const router = useRouter();
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    loadArchivedVisitors();
  }, [searchTerm, dateFilter, currentPage]);

  const loadArchivedVisitors = async () => {
    try {
      setLoading(true);
      const response = await fetchArchivedVisitors(router, {
        page: currentPage,
        limit: 30,
        search: searchTerm,
        date: dateFilter,
      });

      if (response.success) {
        setVisitors(response.data);
        setTotalPages(response.pagination?.pages || 1);
        setTotalCount(response.pagination?.total || 0);
      }
    } catch (error) {
      console.error('Error loading archived visitors:', error);
      toast.error('Failed to load archived visitors');
    } finally {
      setLoading(false);
    }
  };

  const handleUnarchive = async (visitor) => {
    const result = await Swal.fire({
      title: 'Restore Visitor?',
      html: `
        <p>Are you sure you want to restore visitor <strong>${visitor.phone}</strong>?</p>
        <p class="text-sm text-gray-600 mt-2">This will move the visitor back to the active list.</p>
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
      const response = await unarchiveVisitor(visitor._id, router);
      if (response.success) {
        Swal.fire({
          title: 'Restored!',
          text: 'Visitor has been restored successfully.',
          icon: 'success',
          confirmButtonColor: '#10B981',
        });
        loadArchivedVisitors();
      }
    } catch (error) {
      console.error('Error restoring visitor:', error);
      toast.error('Failed to restore visitor');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Detroit',
      timeZoneName: 'short'
    });
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
                  <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
                    <Archive className="w-8 h-8 mr-3 text-orange-600" />
                    Archived Visitors
                  </h1>
                  <p className="text-gray-600">View and restore archived visitor records</p>
                </div>
                <button
                  onClick={() => router.push('/visitors')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Back to Active Visitors
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>
            </div>

            {/* Visitors Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading archived visitors...</p>
                </div>
              ) : visitors.length === 0 ? (
                <div className="p-8 text-center">
                  <Archive className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No archived visitors found</p>
                  <p className="text-gray-400 text-sm mt-2">Archived visitors will appear here</p>
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
                              <button
                                onClick={() => handleUnarchive(visitor)}
                                className="inline-flex items-center px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                                title="Restore"
                              >
                                <RotateCcw className="w-4 h-4 mr-1" />
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
                        Showing {((currentPage - 1) * 30) + 1} to {Math.min(currentPage * 30, totalCount)} of {totalCount} visitors
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

export default ArchivedVisitors;
