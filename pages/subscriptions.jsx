import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Eye, Settings, Users, Search, Filter } from 'lucide-react'
import Swal from 'sweetalert2'
import Layout from '@/components/Layout'
import { 
  fetchAllSubscriptions, 
  fetchSubscriptionSettings, 
  updateSubscriptionSettings,
  fetchMonthlyBoxFAQs,
  addMonthlyBoxFAQ,
  updateMonthlyBoxFAQ,
  deleteMonthlyBoxFAQ,
  fetchBillingFAQs,
  addBillingFAQ,
  updateBillingFAQ,
  deleteBillingFAQ,
  updatePaymentStatus,
  toast 
} from '../service/service'

export default function Subscriptions() {
  const router = useRouter()
  const [subscriptions, setSubscriptions] = useState([])
  const [settings, setSettings] = useState(null)
  const [faqs, setFaqs] = useState([])
  const [billingFaqs, setBillingFaqs] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('subscriptions')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 })
  const [showFAQModal, setShowFAQModal] = useState(false)
  const [editingFAQ, setEditingFAQ] = useState(null)
  const [faqForm, setFaqForm] = useState({ question: '', answer: '', order: 0 })
  const [activeFAQType, setActiveFAQType] = useState('monthly')

  useEffect(() => {
    loadData()
  }, [pagination.page, statusFilter, activeTab])

  const loadData = async () => {
    try {
      setLoading(true)
      
      if (activeTab === 'faqs') {
        const faqsData = await fetchMonthlyBoxFAQs(router)
        if (faqsData.success) {
          setFaqs(faqsData.data)
        }
      } else if (activeTab === 'billing-faqs') {
        const billingFaqsData = await fetchBillingFAQs(router)
        if (billingFaqsData.success) {
          setBillingFaqs(billingFaqsData.data)
        }
      } else {
        const [subscriptionsData, settingsData] = await Promise.all([
          fetchAllSubscriptions(router, {
            page: pagination.page,
            limit: pagination.limit,
            status: statusFilter !== 'all' ? statusFilter : ''
          }),
          fetchSubscriptionSettings(router)
        ])

        if (subscriptionsData.success) {
          setSubscriptions(subscriptionsData.data)
          setPagination(prev => ({ ...prev, ...subscriptionsData.pagination }))
        }

        if (settingsData.success) {
          setSettings(settingsData.data)
        }
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const updateSettings = async (updatedSettings) => {
    try {
      const data = await updateSubscriptionSettings(updatedSettings, router)
      if (data.success) {
        setSettings(data.data)
        toast.success('Settings updated successfully')
      } else {
        toast.error(data.message || 'Failed to update settings')
      }
    } catch (error) {
      console.error('Error updating settings:', error)
      toast.error('Failed to update settings')
    }
  }

  const handleUpdatePaymentStatus = async (subscriptionId, paymentStatus) => {
    try {
      const response = await updatePaymentStatus(subscriptionId, paymentStatus, router)
      if (response.success) {
        toast.success('Payment status updated')
        setSubscriptions(prev => prev.map(s => s._id === subscriptionId ? { ...s, paymentStatus } : s))
      } else {
        toast.error(response.message || 'Failed to update payment status')
      }
    } catch (error) {
      toast.error('Failed to update payment status')
    }
  }

  const handleAddFAQ = () => {
    setActiveFAQType(activeTab === 'billing-faqs' ? 'billing' : 'monthly')
    setEditingFAQ(null)
    setFaqForm({ question: '', answer: '', order: 0 })
    setShowFAQModal(true)
  }

  const handleEditFAQ = (faq, type) => {
    setActiveFAQType(type)
    setEditingFAQ(faq)
    setFaqForm({ question: faq.question, answer: faq.answer, order: faq.order })
    setShowFAQModal(true)
  }

  const handleSaveFAQ = async () => {
    if (!faqForm.question.trim() || !faqForm.answer.trim()) {
      toast.error('Question and answer required')
      return
    }

    try {
      let response
      if (activeFAQType === 'billing') {
        response = editingFAQ
          ? await updateBillingFAQ(editingFAQ._id, faqForm, router)
          : await addBillingFAQ(faqForm, router)
      } else {
        response = editingFAQ
          ? await updateMonthlyBoxFAQ(editingFAQ._id, faqForm, router)
          : await addMonthlyBoxFAQ(faqForm, router)
      }

      if (response.success) {
        toast.success(editingFAQ ? 'FAQ updated' : 'FAQ added')
        setShowFAQModal(false)
        setFaqForm({ question: '', answer: '', order: 0 })
        setEditingFAQ(null)
        loadData()
      } else {
        toast.error(response.message || 'Failed to save FAQ')
      }
    } catch (error) {
      console.error('Error saving FAQ:', error)
      toast.error('Failed to save FAQ')
    }
  }

  const handleDeleteFAQ = async (faqId, type) => {
    const result = await Swal.fire({
      title: 'Delete FAQ?',
      text: 'This action cannot be undone',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel'
    })

    if (!result.isConfirmed) return

    try {
      const response = type === 'billing'
        ? await deleteBillingFAQ(faqId, router)
        : await deleteMonthlyBoxFAQ(faqId, router)

      if (response.success) {
        toast.success('FAQ deleted')
        loadData()
      } else {
        toast.error(response.message || 'Failed to delete FAQ')
      }
    } catch (error) {
      console.error('Error deleting FAQ:', error)
      toast.error('Failed to delete FAQ')
    }
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusBadge = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      expired: 'bg-gray-100 text-gray-800'
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const filteredSubscriptions = subscriptions.filter(sub =>
    sub.userId?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.userId?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading subscriptions...</p>
        </div>
      </div>
    )
  }

  return (
    <Layout title="Topia Circle Management">
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('subscriptions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'subscriptions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Members ({pagination.total})
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'settings'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Settings className="w-4 h-4 inline mr-2" />
              Settings
            </button>
            <button
              onClick={() => setActiveTab('faqs')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'faqs'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              FAQs ({faqs.length})
            </button>
            <button
              onClick={() => setActiveTab('billing-faqs')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'billing-faqs'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Billing FAQs ({billingFaqs.length})
            </button>
          </nav>
        </div>

        {activeTab === 'subscriptions' && (
          <div className="p-6">
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Member
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Monthly Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Start Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Next Billing
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSubscriptions.map((subscription) => (
                    <tr key={subscription._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {subscription.userId?.fullName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {subscription.userId?.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(subscription.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${subscription.monthlyPrice}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(subscription.startDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {subscription.status === 'active' ? formatDate(subscription.nextBillingDate) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={subscription.paymentStatus || 'pending'}
                          onChange={(e) => handleUpdatePaymentStatus(subscription._id, e.target.value)}
                          className={`text-xs font-medium px-2 py-1 rounded border-0 cursor-pointer focus:ring-2 focus:ring-blue-500 ${
                            subscription.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                            subscription.paymentStatus === 'declined' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          <option value="pending">Pending</option>
                          <option value="paid">Paid</option>
                          <option value="declined">Declined</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => router.push(`/subscriptions/${subscription._id}`)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination.pages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-700">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page === pagination.pages}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && settings && (
          <div className="p-6">
            <div className="max-w-2xl">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Subscription Settings</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monthly Price ($)
                  </label>
                  <input
                    type="number"
                    value={settings.monthlyPrice}
                    onChange={(e) => setSettings(prev => ({ ...prev, monthlyPrice: parseFloat(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={settings.description}
                    onChange={(e) => setSettings(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Subscription Months
                  </label>
                  <input
                    type="number"
                    value={settings.minimumSubscriptionMonths}
                    onChange={(e) => setSettings(prev => ({ ...prev, minimumSubscriptionMonths: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={settings.isActive}
                    onChange={(e) => setSettings(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                    Enable Topia Circle Subscriptions
                  </label>
                </div>

                <button
                  onClick={() => updateSettings(settings)}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'faqs' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Monthly Box FAQs</h2>
              <button
                onClick={handleAddFAQ}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                + Add FAQ
              </button>
            </div>

            {faqs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No FAQs yet. Click "Add FAQ" to create one.
              </div>
            ) : (
              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <div key={faq._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 mb-2">
                          {index + 1}. {faq.question}
                        </h3>
                        <p className="text-gray-600 text-sm">{faq.answer}</p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleEditFAQ(faq, 'monthly')}
                          className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteFAQ(faq._id, 'monthly')}
                          className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'billing-faqs' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Billing FAQs</h2>
              <button
                onClick={handleAddFAQ}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                + Add FAQ
              </button>
            </div>

            {billingFaqs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No FAQs yet. Click "Add FAQ" to create one.
              </div>
            ) : (
              <div className="space-y-4">
                {billingFaqs.map((faq, index) => (
                  <div key={faq._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 mb-2">
                          {index + 1}. {faq.question}
                        </h3>
                        <p className="text-gray-600 text-sm">{faq.answer}</p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleEditFAQ(faq, 'billing')}
                          className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteFAQ(faq._id, 'billing')}
                          className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showFAQModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                {editingFAQ ? 'Edit FAQ' : 'Add New FAQ'}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Question *
                  </label>
                  <input
                    type="text"
                    value={faqForm.question}
                    onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter question"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Answer *
                  </label>
                  <textarea
                    value={faqForm.answer}
                    onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
                    rows="5"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter answer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Order
                  </label>
                  <input
                    type="number"
                    value={faqForm.order}
                    onChange={(e) => setFaqForm({ ...faqForm, order: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowFAQModal(false)
                    setFaqForm({ question: '', answer: '', order: 0 })
                    setEditingFAQ(null)
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveFAQ}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingFAQ ? 'Update' : 'Add'} FAQ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}