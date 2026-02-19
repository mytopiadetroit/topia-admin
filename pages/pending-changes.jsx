import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { CheckCircle, XCircle, Clock, User, FileText, ZoomIn, X, Calendar } from 'lucide-react'
import Layout from '@/components/Layout'
import Swal from 'sweetalert2'
import { fetchPendingChanges, reviewPendingChange, toast } from '../service/service'

export default function PendingChanges() {
  const router = useRouter()
  const [changes, setChanges] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [filter, setFilter] = useState('all')
  const [selectedChange, setSelectedChange] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [zoomedImage, setZoomedImage] = useState(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const observerTarget = useRef(null)

  useEffect(() => {
    setChanges([])
    setPage(1)
    setHasMore(true)
    loadChanges(1, true)
  }, [filter, dateRange])

  const loadChanges = async (pageNum = 1, reset = false) => {
    try {
      if (reset) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }
      
      const params = {
        page: pageNum,
        limit: 20
      }
      
      if (filter !== 'all') {
        params.status = filter
      }
      
      if (dateRange.start) {
        params.startDate = dateRange.start
      }
      if (dateRange.end) {
        params.endDate = dateRange.end
      }
      
      const data = await fetchPendingChanges(router, params)
      if (data.success) {
        if (reset) {
          setChanges(data.data)
        } else {
          setChanges(prev => [...prev, ...data.data])
        }
        setHasMore(data.pagination?.hasMore || false)
      }
    } catch (error) {
      console.error('Error loading changes:', error)
      toast.error('Failed to load pending changes')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          const nextPage = page + 1
          setPage(nextPage)
          loadChanges(nextPage, false)
        }
      },
      { threshold: 0.1 }
    )

    if (observerTarget.current) {
      observer.observe(observerTarget.current)
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current)
      }
    }
  }, [hasMore, loading, loadingMore, page])

  const handleDateFilter = () => {
    if (!dateRange.start || !dateRange.end) {
      toast.error('Please select both start and end dates')
      return
    }
    setChanges([])
    setPage(1)
    setHasMore(true)
    loadChanges(1, true)
  }

  const clearDateFilter = () => {
    setDateRange({ start: '', end: '' })
  }

  const formatDateTimeDetroit = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      timeZone: 'America/Detroit',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const handleReview = async (id, status) => {
    const result = await Swal.fire({
      title: `${status === 'approved' ? 'Approve' : 'Reject'} Change?`,
      text: 'Add review notes (optional)',
      input: 'textarea',
      inputPlaceholder: 'Enter review notes...',
      showCancelButton: true,
      confirmButtonColor: status === 'approved' ? '#10B981' : '#EF4444',
      cancelButtonColor: '#6B7280',
      confirmButtonText: status === 'approved' ? 'Approve' : 'Reject',
      cancelButtonText: 'Cancel'
    })

    if (!result.isConfirmed) return

    try {
      // Show loading
      Swal.fire({
        title: 'Processing...',
        text: 'Please wait while we process your request',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading()
        }
      })

      const data = await reviewPendingChange(id, {
        status,
        reviewNotes: result.value || ''
      }, router)

      if (data.success) {
        await Swal.fire({
          title: 'Success!',
          text: `Change ${status} successfully`,
          icon: 'success',
          confirmButtonColor: status === 'approved' ? '#10B981' : '#EF4444',
          timer: 2000
        })
        setChanges([])
        setPage(1)
        setHasMore(true)
        await loadChanges(1, true)
        setShowDetailModal(false)
      } else {
        Swal.fire({
          title: 'Error!',
          text: data.message || 'Failed to review change',
          icon: 'error',
          confirmButtonColor: '#EF4444'
        })
      }
    } catch (error) {
      console.error('Error reviewing change:', error)
      Swal.fire({
        title: 'Error!',
        text: 'Failed to review change',
        icon: 'error',
        confirmButtonColor: '#EF4444'
      })
    }
  }

  const getStatusBadge = (status) => {
    const config = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle }
    }
    const { color, icon: Icon } = config[status] || config.pending
    return (
      <span className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${color}`}>
        <Icon className="w-4 h-4 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const getChangeTypeLabel = (type) => {
    const labels = {
      profile: 'Profile Update',
      subscription: 'Subscription Update',
      account: 'Account Update'
    }
    return labels[type] || type
  }

  const renderChangeDiff = (current, requested) => {
    const changes = []
    Object.keys(requested).forEach(key => {
      if (!shouldHideField(key) && JSON.stringify(current[key]) !== JSON.stringify(requested[key])) {
        changes.push({ key, old: current[key], new: requested[key] })
      }
    })
    return changes
  }

  const isImageField = (key) => {
    return key === 'avatar' || key === 'governmentId'
  }

  const shouldHideField = (key) => {
    return key === 'governmentIdFileName' || key === 'avatarFileName'
  }

  const renderValue = (key, value) => {
    if (isImageField(key) && value && typeof value === 'string') {
      const isBase64 = value.startsWith('data:image')
      const imageUrl = isBase64 ? value : value
      
      return (
        <div className="relative group">
          <img 
            src={imageUrl} 
            alt={key}
            className="max-w-[200px] max-h-[200px] object-cover rounded border cursor-pointer hover:opacity-80 transition"
            onClick={() => setZoomedImage(imageUrl)}
          />
          <button
            onClick={() => setZoomedImage(imageUrl)}
            className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      )
    }
    
    if (typeof value === 'object') {
      return <pre className="text-sm bg-gray-50 p-2 rounded overflow-auto">{JSON.stringify(value, null, 2)}</pre>
    }
    
    return <p className="text-sm p-2 rounded">{String(value || 'N/A')}</p>
  }

  return (
    <Layout title="Pending Changes">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Pending Changes</h1>
        <p className="text-gray-600 mt-1">Review and approve user change requests</p>
      </div>

      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b space-y-4">
          <div className="flex space-x-2">
            {['all', 'pending', 'approved', 'rejected'].map(status => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium ${
                  filter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>

          {/* Date Filter */}
          <div className="flex items-center space-x-3 pt-2 border-t">
            <Calendar className="w-5 h-5 text-gray-500" />
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Start Date"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="End Date"
            />
            <button
              onClick={handleDateFilter}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Filter
            </button>
            {(dateRange.start || dateRange.end) && (
              <button
                onClick={clearDateFilter}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading changes...</p>
            </div>
          ) : changes.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No changes found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {changes.map(change => (
                <div key={change._id} className="border rounded-lg p-4 hover:shadow-md transition">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <User className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-semibold">{change.userId?.fullName}</p>
                        <p className="text-sm text-gray-500">{change.userId?.email}</p>
                      </div>
                    </div>
                    {getStatusBadge(change.status)}
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        {getChangeTypeLabel(change.changeType)}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        Requested: {formatDateTimeDetroit(change.requestedAt)}
                      </p>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedChange(change)
                          setShowDetailModal(true)
                        }}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                      >
                        View Details
                      </button>
                      {change.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleReview(change._id, 'approved')}
                            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReview(change._id, 'rejected')}
                            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Infinite Scroll Trigger */}
              {hasMore && !loading && (
                <div ref={observerTarget} className="py-4 text-center">
                  {loadingMore && (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-gray-600">Loading more...</span>
                    </div>
                  )}
                </div>
              )}
              
              {!hasMore && changes.length > 0 && (
                <div className="py-4 text-center text-gray-500">
                  No more changes to load
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showDetailModal && selectedChange && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Change Request Details</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">User</p>
                  <p className="font-medium">{selectedChange.userId?.fullName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Type</p>
                  <p className="font-medium">{getChangeTypeLabel(selectedChange.changeType)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  {getStatusBadge(selectedChange.status)}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Requested</p>
                  <p className="font-medium">{formatDateTimeDetroit(selectedChange.requestedAt)}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Changes:</h4>
                <div className="space-y-3">
                  {renderChangeDiff(selectedChange.currentData, selectedChange.requestedData).map((diff, idx) => (
                    <div key={idx} className="border rounded-lg p-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">{diff.key}</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Current</p>
                          <div className="bg-red-50 p-2 rounded">
                            {renderValue(diff.key, diff.old)}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Requested</p>
                          <div className="bg-green-50 p-2 rounded">
                            {renderValue(diff.key, diff.new)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedChange.reviewNotes && (
                <div>
                  <p className="text-sm text-gray-500">Review Notes</p>
                  <p className="mt-1 p-3 bg-gray-50 rounded">{selectedChange.reviewNotes}</p>
                </div>
              )}

              {selectedChange.status === 'pending' && (
                <div className="flex space-x-3 pt-4 border-t">
                  <button
                    onClick={() => handleReview(selectedChange._id, 'approved')}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReview(selectedChange._id, 'rejected')}
                    className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {zoomedImage && (
        <div 
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => setZoomedImage(null)}
        >
          <button
            onClick={() => setZoomedImage(null)}
            className="absolute top-4 right-4 text-white bg-black/50 p-2 rounded-full hover:bg-black/70"
          >
            <X className="w-6 h-6" />
          </button>
          <img 
            src={zoomedImage} 
            alt="Zoomed view"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </Layout>
  )
}
