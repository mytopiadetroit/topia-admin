import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { ArrowLeft, User, Calendar, Package, Edit, Save, X } from 'lucide-react'
import Layout from '@/components/Layout'
import { fetchAllSubscriptions, updateSubscriptionAdmin, toast } from '../../service/service'

export default function SubscriptionDetail() {
  const router = useRouter()
  const { id } = router.query
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editData, setEditData] = useState({
    preferences: [],
    allergies: [],
    currentBoxItems: []
  })

  useEffect(() => {
    if (id) {
      loadSubscription()
    }
  }, [id])

  const loadSubscription = async () => {
    try {
      setLoading(true)
      const data = await fetchAllSubscriptions(router, { page: 1, limit: 100 })

      if (data.success) {
        const sub = data.data.find(s => s._id === id)
        if (sub) {
          setSubscription(sub)
          setEditData({
            preferences: sub.preferences || [],
            allergies: sub.allergies || [],
            currentBoxItems: sub.currentBoxItems || []
          })
        } else {
          toast.error('Subscription not found')
          router.push('/subscriptions')
        }
      }
    } catch (error) {
      console.error('Error loading subscription:', error)
      toast.error('Failed to load subscription')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      const data = await updateSubscriptionAdmin(id, editData, router)
      if (data.success) {
        setSubscription(prev => ({ ...prev, ...editData }))
        setEditing(false)
        toast.success('Subscription updated successfully')
      } else {
        toast.error(data.message || 'Failed to update subscription')
      }
    } catch (error) {
      console.error('Error updating subscription:', error)
      toast.error('Failed to update subscription')
    }
  }

  const addBoxItem = () => {
    setEditData(prev => ({
      ...prev,
      currentBoxItems: [...prev.currentBoxItems, { itemName: '', quantity: 1, notes: '' }]
    }))
  }

  const addSelectedProductsToBox = () => {
    if (!subscription.selectedProducts?.length) return
    
    const newItems = subscription.selectedProducts.map(product => {
      let itemName = product.productName
      let notes = `Price: $${product.productPrice}`
      
      // Add any additional product details that are available (excluding objects)
      const details = []
      
      // Handle type field
      if (product.type) {
        details.push(`Type: ${product.type}`)
      }
      
      // Handle other simple fields
      Object.entries(product).forEach(([key, value]) => {
        // Skip complex objects and common fields
        if (!['productName', 'productPrice', 'productId', '_id', 'type', 'createdAt', 'updatedAt'].includes(key) && 
            value && 
            typeof value !== 'object') {
          details.push(`${key}: ${String(value)}`)
        }
      })
      
      if (details.length > 0) {
        itemName += ` (${details.join(', ')})`
        notes += `, ${details.join(', ')}`
      }
      
      return {
        itemName: itemName,
        quantity: 1,
        notes: notes
      }
    })
    
    setEditData(prev => ({
      ...prev,
      currentBoxItems: [...prev.currentBoxItems, ...newItems]
    }))
  }

  const updateBoxItem = (index, field, value) => {
    setEditData(prev => ({
      ...prev,
      currentBoxItems: prev.currentBoxItems.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }))
  }

  const removeBoxItem = (index) => {
    setEditData(prev => ({
      ...prev,
      currentBoxItems: prev.currentBoxItems.filter((_, i) => i !== index)
    }))
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
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
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading subscription details...</p>
        </div>
      </div>
    )
  }

  if (!subscription) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Subscription not found</p>
          <button
            onClick={() => router.push('/subscriptions')}
            className="mt-4 text-blue-600 hover:text-blue-800"
          >
            Back to Subscriptions
          </button>
        </div>
      </div>
    )
  }

  return (
    <Layout title="Subscription Details">
      <div className="mb-6">
        <button
          onClick={() => router.push('/subscriptions')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Subscriptions
        </button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Subscription Details</h1>
            <p className="text-gray-600 mt-1">Member: {subscription.userId?.fullName}</p>
          </div>
          
          <div className="flex items-center space-x-3">
            {getStatusBadge(subscription.status)}
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </button>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={handleSave}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditing(false)
                    setEditData({
                      preferences: subscription.preferences || [],
                      allergies: subscription.allergies || [],
                      currentBoxItems: subscription.currentBoxItems || []
                    })
                  }}
                  className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <Package className="w-5 h-5 text-green-600 mr-2" />
              <h2 className="text-lg font-semibold">Selected Products</h2>
            </div>
            <div className="space-y-3">
              {subscription.selectedProducts?.length > 0 ? (
                subscription.selectedProducts.map((product, index) => {
                  // Debug: Log product structure to console
                  console.log('Product data:', product)
                  
                  return (
                    <div key={index} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-green-800">{product.productName}</h3>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {/* Show product type */}
                            {product.type && (
                              <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                                Type: {product.type}
                              </span>
                            )}
                            {/* Show productId details if available */}
                            {product.productId && (
                              <>
                                {product.productId.name && product.productId.name !== product.productName && (
                                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                                    Product ID: {product.productId.name}
                                  </span>
                                )}
                                {product.productId.category && (
                                  <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                                    Category: {product.productId.category}
                                  </span>
                                )}
                                {product.productId.size && (
                                  <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs">
                                    Size: {product.productId.size}
                                  </span>
                                )}
                                {product.productId.flavor && (
                                  <span className="px-2 py-1 bg-pink-100 text-pink-700 rounded text-xs">
                                    Flavor: {product.productId.flavor}
                                  </span>
                                )}
                              </>
                            )}
                            {/* Show any other simple fields */}
                            {Object.entries(product).map(([key, value]) => {
                              if (['productName', 'productPrice', 'productId', '_id', 'type', 'createdAt', 'updatedAt'].includes(key) || 
                                  !value || 
                                  typeof value === 'object') {
                                return null
                              }
                              return (
                                <span key={key} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                  {key}: {String(value)}
                                </span>
                              )
                            })}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-semibold text-green-600">${product.productPrice}</span>
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <p className="text-gray-500">No products selected</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <User className="w-5 h-5 text-blue-600 mr-2" />
              <h2 className="text-lg font-semibold">Member Information</h2>
            </div>
            
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-500">Name:</span>
                <p className="font-medium">{subscription.userId?.fullName}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Email:</span>
                <p className="font-medium">{subscription.userId?.email}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Phone:</span>
                <p className="font-medium">{subscription.userId?.phone}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <Calendar className="w-5 h-5 text-green-600 mr-2" />
              <h2 className="text-lg font-semibold">Subscription Details</h2>
            </div>
            
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-500">Monthly Price:</span>
                <p className="font-medium">${subscription.monthlyPrice}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Start Date:</span>
                <p className="font-medium">{formatDate(subscription.startDate)}</p>
              </div>
              {subscription.status === 'active' && (
                <div>
                  <span className="text-sm text-gray-500">Next Billing:</span>
                  <p className="font-medium">{formatDate(subscription.nextBillingDate)}</p>
                </div>
              )}
              {subscription.cancellationDate && (
                <div>
                  <span className="text-sm text-gray-500">Cancelled On:</span>
                  <p className="font-medium">{formatDate(subscription.cancellationDate)}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Preferences</h2>
            {editing ? (
              <div className="space-y-2">
                <textarea
                  value={editData.preferences.join(', ')}
                  onChange={(e) => setEditData(prev => ({ 
                    ...prev, 
                    preferences: e.target.value.split(',').map(p => p.trim()).filter(p => p) 
                  }))}
                  placeholder="Enter preferences separated by commas"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {subscription.preferences?.length > 0 ? (
                  subscription.preferences.map((pref, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {pref}
                    </span>
                  ))
                ) : (
                  <p className="text-gray-500">No preferences set</p>
                )}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Allergies</h2>
            {editing ? (
              <div className="space-y-2">
                <textarea
                  value={editData.allergies.join(', ')}
                  onChange={(e) => setEditData(prev => ({ 
                    ...prev, 
                    allergies: e.target.value.split(',').map(a => a.trim()).filter(a => a) 
                  }))}
                  placeholder="Enter allergies separated by commas"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {subscription.allergies?.length > 0 ? (
                  subscription.allergies.map((allergy, index) => (
                    <span key={index} className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                      {allergy}
                    </span>
                  ))
                ) : (
                  <p className="text-gray-500">No allergies listed</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Package className="w-5 h-5 text-purple-600 mr-2" />
            <div>
              <h2 className="text-lg font-semibold">Current Month Box Items</h2>
              <p className="text-sm text-gray-500">Admin can customize specific items for this month's box pickup</p>
            </div>
          </div>
          {editing && (
            <div className="flex space-x-2">
              {subscription.selectedProducts?.length > 0 && (
                <button
                  onClick={addSelectedProductsToBox}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm flex items-center"
                >
                  <Package className="w-4 h-4 mr-1" />
                  Add Selected Products
                </button>
              )}
              <button
                onClick={addBoxItem}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
              >
                Add Item
              </button>
            </div>
          )}
        </div>

        {editing ? (
          <div className="space-y-4">
            {editData.currentBoxItems.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-3 items-center p-3 border border-gray-200 rounded-lg">
                <div className="col-span-4">
                  <input
                    type="text"
                    placeholder="Item name"
                    value={item.itemName}
                    onChange={(e) => updateBoxItem(index, 'itemName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => updateBoxItem(index, 'quantity', parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="col-span-5">
                  <input
                    type="text"
                    placeholder="Notes"
                    value={item.notes}
                    onChange={(e) => updateBoxItem(index, 'notes', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="col-span-1">
                  <button
                    onClick={() => removeBoxItem(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {editData.currentBoxItems.length === 0 && (
              <p className="text-gray-500 text-center py-4">No items added yet</p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {subscription.currentBoxItems?.length > 0 ? (
              subscription.currentBoxItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <span className="font-medium">{item.itemName}</span>
                    <span className="text-gray-500 ml-2">x{item.quantity}</span>
                  </div>
                  {item.notes && (
                    <span className="text-sm text-gray-600">{item.notes}</span>
                  )}
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No items in current box</p>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}