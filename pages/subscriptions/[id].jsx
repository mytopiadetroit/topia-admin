import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { ArrowLeft, User, Calendar, Package, Edit, Save, X, CreditCard, Pause, Play, CheckCircle, Clock, Plus, History, ShoppingCart } from 'lucide-react'
import Layout from '@/components/Layout'
import Swal from 'sweetalert2'
import ProductDetailModal from '@/components/ProductDetailModal'
import SelectedProductsList from '@/components/SelectedProductsList'
import { 
  fetchAllSubscriptions, 
  updateSubscriptionAdmin, 
  updateSubscriptionBillingDate,
  updateSubscriptionPaymentMethod,
  toggleSubscriptionStatus,
  createBoxPickup,
  fetchUserBoxHistory,
  markBoxPickupStatus,
  fetchAllProductsNoPagination,
  updatePaymentInfo,
  toast 
} from '../../service/service'

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
  const [showBillingDateModal, setShowBillingDateModal] = useState(false)
  const [newBillingDay, setNewBillingDay] = useState('')
  const [allProducts, setAllProducts] = useState([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [newPaymentMethod, setNewPaymentMethod] = useState('')
  const [showPaymentInfoModal, setShowPaymentInfoModal] = useState(false)
  const [paymentInfo, setPaymentInfo] = useState({
    cardHolderName: '',
    cardLastFour: '',
    cardBrand: 'Visa',
    expiryMonth: '',
    expiryYear: '',
    billingZip: ''
  })
  const [boxHistory, setBoxHistory] = useState(null)
  const [showBoxHistoryModal, setShowBoxHistoryModal] = useState(false)
  const [showCreateBoxModal, setShowCreateBoxModal] = useState(false)
  const [showProductModal, setShowProductModal] = useState(false)
  const [selectedProducts, setSelectedProducts] = useState([])
  const [productVariants, setProductVariants] = useState({})
  const [showProductDetailModal, setShowProductDetailModal] = useState(false)
  const [currentProduct, setCurrentProduct] = useState(null)
  const [tempSelectedVariants, setTempSelectedVariants] = useState([])
  const [tempSelectedFlavors, setTempSelectedFlavors] = useState([])

  useEffect(() => {
    if (id) {
      loadSubscription()
    }
  }, [id])

  useEffect(() => {
    if (editing && allProducts.length === 0) {
      loadProducts()
    }
  }, [editing])

  const loadProducts = async () => {
    try {
      setLoadingProducts(true)
      const data = await fetchAllProductsNoPagination(router)
      if (data.success) {
        setAllProducts(data.data || [])
      }
    } catch (error) {
      console.error('Error loading products:', error)
    } finally {
      setLoadingProducts(false)
    }
  }

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

  const handleUpdateBillingDate = async () => {
    if (!newBillingDay) {
      toast.error('Please select a billing date')
      return
    }

    try {
      const data = await updateSubscriptionBillingDate(id, null, router, newBillingDay)
      if (data.success) {
        await loadSubscription()
        setShowBillingDateModal(false)
        setNewBillingDay('')
        toast.success('Billing date updated successfully')
      } else {
        toast.error(data.message || 'Failed to update billing date')
      }
    } catch (error) {
      console.error('Error updating billing date:', error)
      toast.error('Failed to update billing date')
    }
  }

  const handleUpdatePaymentMethod = async () => {
    if (!newPaymentMethod.trim()) {
      toast.error('Please enter payment method ID')
      return
    }

    try {
      const data = await updateSubscriptionPaymentMethod(id, newPaymentMethod, router)
      if (data.success) {
        // Reload the subscription to get the updated data with populated fields
        await loadSubscription()
        setShowPaymentModal(false)
        setNewPaymentMethod('')
        toast.success('Payment method updated successfully')
      } else {
        toast.error(data.message || 'Failed to update payment method')
      }
    } catch (error) {
      console.error('Error updating payment method:', error)
      toast.error('Failed to update payment method')
    }
  }

  const handleToggleStatus = async (action) => {
    const result = await Swal.fire({
      title: `${action === 'pause' ? 'Pause' : 'Activate'} Subscription?`,
      text: `Are you sure you want to ${action} this subscription?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: action === 'pause' ? '#EF4444' : '#10B981',
      cancelButtonColor: '#6B7280',
      confirmButtonText: `Yes, ${action}!`,
      cancelButtonText: 'Cancel'
    })

    if (!result.isConfirmed) return

    try {
      const data = await toggleSubscriptionStatus(id, action, router)
      if (data.success) {
        await loadSubscription()
        toast.success(`Subscription ${action === 'pause' ? 'paused' : 'activated'} successfully`)
      } else {
        toast.error(data.message || 'Failed to update status')
      }
    } catch (error) {
      console.error('Error toggling status:', error)
      toast.error('Failed to update status')
    }
  }

  const handleUpdatePaymentInfo = async () => {
    if (!paymentInfo.cardHolderName || !paymentInfo.cardLastFour) {
      toast.error('Card holder name and last 4 digits are required')
      return
    }

    try {
      const data = await updatePaymentInfo(id, paymentInfo, router)
      if (data.success) {
        await loadSubscription()
        setShowPaymentInfoModal(false)
        setPaymentInfo({
          cardHolderName: '',
          cardLastFour: '',
          cardBrand: 'Visa',
          expiryMonth: '',
          expiryYear: '',
          billingZip: ''
        })
        toast.success('Payment information updated successfully')
      } else {
        toast.error(data.message || 'Failed to update payment information')
      }
    } catch (error) {
      console.error('Error updating payment info:', error)
      toast.error('Failed to update payment information')
    }
  }

  const loadBoxHistory = async () => {
    try {
      const data = await fetchUserBoxHistory(subscription.userId._id, router)
      if (data.success) {
        setBoxHistory(data.data)
      }
    } catch (error) {
      console.error('Error loading box history:', error)
      toast.error('Failed to load box history')
    }
  }

  const handleCreateBoxPickup = async () => {
    // Show confirmation dialog
    const result = await Swal.fire({
      title: 'Create Box Pickup?',
      html: `
        <div class="text-left">
          <p class="mb-2">This will create a new box pickup for:</p>
          <p class="font-semibold">${subscription.userId?.fullName}</p>
          <p class="text-sm text-gray-600 mt-2">Items: ${subscription.currentBoxItems?.length || 0}</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10B981',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, Create Box',
      cancelButtonText: 'Cancel'
    })

    if (!result.isConfirmed) return

    try {
      // Show loading
      Swal.fire({
        title: 'Creating Box...',
        text: 'Please wait',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading()
        }
      })

      const data = await createBoxPickup({
        userId: subscription.userId._id,
        items: subscription.currentBoxItems || [],
        scheduledDate: new Date(),
        notes: 'Created by admin'
      }, router)
      
      if (data.success) {
        await Swal.fire({
          title: 'Success!',
          text: 'Box pickup created successfully',
          icon: 'success',
          confirmButtonColor: '#10B981',
          timer: 2000
        })
        setShowCreateBoxModal(false)
        if (showBoxHistoryModal) {
          await loadBoxHistory()
        }
      } else {
        Swal.fire({
          title: 'Error!',
          text: data.message || 'Failed to create box pickup',
          icon: 'error',
          confirmButtonColor: '#EF4444'
        })
      }
    } catch (error) {
      console.error('Error creating box pickup:', error)
      Swal.fire({
        title: 'Error!',
        text: 'Failed to create box pickup',
        icon: 'error',
        confirmButtonColor: '#EF4444'
      })
    }
  }

  const handleMarkBoxPickup = async (boxId, status) => {
    try {
      const data = await markBoxPickupStatus(boxId, {
        status,
        pickedUpBy: 'Admin'
      }, router)
      
      if (data.success) {
        toast.success(`Box marked as ${status}`)
        await loadBoxHistory()
      } else {
        toast.error(data.message || 'Failed to update box status')
      }
    } catch (error) {
      console.error('Error marking box pickup:', error)
      toast.error('Failed to update box status')
    }
  }

  const handleShowBoxHistory = async () => {
    setShowBoxHistoryModal(true)
    await loadBoxHistory()
  }

  const handleProductClick = (product) => {
    setCurrentProduct(product)
    setShowProductDetailModal(true)
  }

  const handleAddToSelection = (product, selectedVariants, selectedFlavors) => {
    const hasVariants = product.hasVariants && product.variants?.length > 0
    const hasFlavors = product.flavors?.length > 0

    if (hasVariants && selectedVariants.length === 0) {
      toast.error('Please select at least one size')
      return
    }

    if (hasFlavors && selectedFlavors.length === 0) {
      toast.error('Please select at least one flavor')
      return
    }

    if (hasVariants && hasFlavors) {
      selectedVariants.forEach(variant => {
        selectedFlavors.forEach(flavor => {
          const productCopy = {
            ...product,
            _id: `${product._id}_${variant.size.value}_${flavor.name}`,
            selectedVariant: variant,
            selectedFlavor: flavor
          }
          setSelectedProducts(prev => [...prev, productCopy])
          setProductVariants(prev => ({
            ...prev,
            [productCopy._id]: { selectedVariant: variant, selectedFlavor: flavor }
          }))
        })
      })
    } else if (hasVariants) {
      selectedVariants.forEach(variant => {
        const productCopy = {
          ...product,
          _id: `${product._id}_${variant.size.value}`,
          selectedVariant: variant,
          selectedFlavor: null
        }
        setSelectedProducts(prev => [...prev, productCopy])
        setProductVariants(prev => ({
          ...prev,
          [productCopy._id]: { selectedVariant: variant, selectedFlavor: null }
        }))
      })
    } else if (hasFlavors) {
      selectedFlavors.forEach(flavor => {
        const productCopy = {
          ...product,
          _id: `${product._id}_${flavor.name}`,
          selectedVariant: null,
          selectedFlavor: flavor
        }
        setSelectedProducts(prev => [...prev, productCopy])
        setProductVariants(prev => ({
          ...prev,
          [productCopy._id]: { selectedVariant: null, selectedFlavor: flavor }
        }))
      })
    } else {
      setSelectedProducts(prev => [...prev, product])
      setProductVariants(prev => ({
        ...prev,
        [product._id]: { selectedVariant: null, selectedFlavor: null }
      }))
    }

    setShowProductDetailModal(false)
    toast.success('Added to selection')
  }

  // const addProductToBox = (product) => {
  //   // Check if product is already selected
  //   if (selectedProducts.find(p => p._id === product._id)) {
  //     toast.error('Product already added')
  //     return
  //   }
    
  //   // Add to selected products list
  //   setSelectedProducts(prev => [...prev, product])
    
  //   // Initialize variant selection if product has variants
  //   if (product.hasVariants && product.variants && product.variants.length > 0) {
  //     setProductVariants(prev => ({
  //       ...prev,
  //       [product._id]: {
  //         selectedVariant: product.variants[0],
  //         selectedFlavor: product.flavors?.[0] || null
  //       }
  //     }))
  //   } else if (product.flavors && product.flavors.length > 0) {
  //     setProductVariants(prev => ({
  //       ...prev,
  //       [product._id]: {
  //         selectedVariant: null,
  //         selectedFlavor: product.flavors[0]
  //       }
  //     }))
  //   }
  // }

  const removeSelectedProduct = (productId) => {
    setSelectedProducts(prev => prev.filter(p => p._id !== productId))
    setProductVariants(prev => {
      const newVariants = { ...prev }
      delete newVariants[productId]
      return newVariants
    })
  }

  const updateProductVariant = (productId, variant) => {
    setProductVariants(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        selectedVariant: variant,
        selectedFlavor: null // Reset flavor when variant changes
      }
    }))
  }

  const updateProductFlavor = (productId, flavor) => {
    setProductVariants(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        selectedFlavor: flavor
      }
    }))
  }

  const addSelectedProductsToBoxItems = () => {
    const newItems = selectedProducts.map(product => {
      const variants = productVariants[product._id]
      const selectedVariant = variants?.selectedVariant
      const selectedFlavor = variants?.selectedFlavor
      
      // Calculate price
      let price = 0
      if (selectedFlavor && selectedFlavor.price) {
        price = Number(selectedFlavor.price)
      } else if (selectedVariant && selectedVariant.price) {
        price = Number(selectedVariant.price)
      } else {
        price = Number(product.price || 0)
      }
      
      // Build item name with variant and flavor info
      let itemName = product.name
      if (selectedVariant) {
        itemName += ` (${selectedVariant.size.value}${selectedVariant.size.unit === 'grams' ? 'G' : selectedVariant.size.unit === 'pieces' ? ' pcs' : selectedVariant.size.unit.toUpperCase()})`
      }
      if (selectedFlavor) {
        itemName += ` - ${selectedFlavor.name}`
      }
      
      // Build notes with price and details
      let notes = `Price: $${price.toFixed(2)}`
      if (selectedVariant) {
        notes += `, Size: ${selectedVariant.size.value}${selectedVariant.size.unit}`
      }
      if (selectedFlavor) {
        notes += `, Flavor: ${selectedFlavor.name}`
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
    
    // Clear selections and close modal
    setSelectedProducts([])
    setProductVariants({})
    setShowProductModal(false)
    toast.success(`${newItems.length} product(s) added to box`)
  }

  const addProductToBox = (product) => {
    const newItem = {
      itemName: product.name,
      quantity: 1,
      notes: `$${product.price}`
    }
    setEditData(prev => ({
      ...prev,
      currentBoxItems: [...prev.currentBoxItems, newItem]
    }))
    setShowProductModal(false)
    toast.success('Product added to box')
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
      expired: 'bg-gray-100 text-gray-800',
      paused: 'bg-yellow-100 text-yellow-800'
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
            
            <button
              onClick={() => setShowBillingDateModal(true)}
              className="flex items-center px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
            >
              <Calendar className="w-4 h-4 mr-1" />
              Billing Date
            </button>

            <button
              onClick={handleShowBoxHistory}
              className="flex items-center px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm"
            >
              <History className="w-4 h-4 mr-1" />
              Box History
            </button>

            <button
              onClick={() => setShowCreateBoxModal(true)}
              className="flex items-center px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm"
            >
              <Plus className="w-4 h-4 mr-1" />
              Create Box
            </button>

            {subscription.status === 'active' ? (
              <button
                onClick={() => handleToggleStatus('pause')}
                className="flex items-center px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm"
              >
                <Pause className="w-4 h-4 mr-1" />
                Pause
              </button>
            ) : subscription.status === 'paused' ? (
              <button
                onClick={() => handleToggleStatus('activate')}
                className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
              >
                <Play className="w-4 h-4 mr-1" />
                Activate
              </button>
            ) : null}

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
              {subscription.nextBillingDate && (
                <div>
                  <span className="text-sm text-gray-500">Next Billing Date:</span>
                  <p className="font-medium">{formatDate(subscription.nextBillingDate)}</p>
                </div>
              )}
              {subscription.billingDayOfMonth && (
                <div>
                  <span className="text-sm text-gray-500">Billing Day of Month:</span>
                  <p className="font-medium">Day {subscription.billingDayOfMonth}</p>
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

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <CreditCard className="w-5 h-5 text-purple-600 mr-2" />
                <h2 className="text-lg font-semibold">Payment Information</h2>
              </div>
              <button
                onClick={() => {
                  if (subscription.paymentInfo) {
                    setPaymentInfo(subscription.paymentInfo)
                  }
                  setShowPaymentInfoModal(true)
                }}
                className="text-purple-600 hover:text-purple-800"
              >
                <Edit className="w-4 h-4" />
              </button>
            </div>
            
            {subscription.paymentInfo ? (
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-500">Card Holder:</span>
                  <p className="font-medium">{subscription.paymentInfo.cardHolderName}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Card:</span>
                  <p className="font-medium">{subscription.paymentInfo.cardBrand} •••• {subscription.paymentInfo.cardLastFour}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Expires:</span>
                  <p className="font-medium">{subscription.paymentInfo.expiryMonth}/{subscription.paymentInfo.expiryYear}</p>
                </div>
                {subscription.paymentInfo.billingZip && (
                  <div>
                    <span className="text-sm text-gray-500">Billing ZIP:</span>
                    <p className="font-medium">{subscription.paymentInfo.billingZip}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500">No payment information added</p>
            )}
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
                onClick={() => setShowProductModal(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm flex items-center"
              >
                <ShoppingCart className="w-4 h-4 mr-1" />
                Select Products
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
      {showBillingDateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold mb-4">Change Next Billing Date</h3>
            <p className="text-sm text-gray-600 mb-4">
              Select the next billing date for this subscription
            </p>
            <input
              type="date"
              value={newBillingDay}
              onChange={(e) => setNewBillingDay(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-purple-500"
            />
            {newBillingDay && (
              <p className="text-sm text-center text-purple-600 mb-4">
                Next billing: {new Date(newBillingDay).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            )}
            <div className="flex space-x-3">
              <button
                onClick={handleUpdateBillingDate}
                className="flex-1 bg-[#80A6F7] text-white py-2 rounded-lg hover:bg-indigo-300"
              >
                Update
              </button>
              <button
                onClick={() => {
                  setShowBillingDateModal(false);
                  setNewBillingDay('');
                }}
                className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showBoxHistoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Box Pickup History</h3>
              <button
                onClick={() => setShowBoxHistoryModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {boxHistory ? (
              <>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Total Boxes</p>
                    <p className="text-2xl font-bold text-blue-600">{boxHistory.stats.totalBoxes}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Picked Up</p>
                    <p className="text-2xl font-bold text-green-600">{boxHistory.stats.pickedUp}</p>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-yellow-600">{boxHistory.stats.pending}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {boxHistory.history.map((box) => (
                    <div key={box._id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <span className="font-semibold">Box #{box.boxNumber}</span>
                          {box.status === 'picked_up' ? (
                            <span className="flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Picked Up
                            </span>
                          ) : (
                            <span className="flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                              <Clock className="w-4 h-4 mr-1" />
                              Pending
                            </span>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          {box.status === 'pending' && (
                            <button
                              onClick={() => handleMarkBoxPickup(box._id, 'picked_up')}
                              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                            >
                              Mark Picked Up
                            </button>
                          )}
                          {box.status === 'picked_up' && (
                            <button
                              onClick={() => handleMarkBoxPickup(box._id, 'pending')}
                              className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-sm"
                            >
                              Mark Pending
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-2">
                        <div>
                          <span className="font-medium">Scheduled:</span> {new Date(box.scheduledDate).toLocaleDateString()}
                        </div>
                        {box.pickedUpDate && (
                          <div>
                            <span className="font-medium">Picked Up:</span> {new Date(box.pickedUpDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>

                      {box.items && box.items.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-gray-700 mb-1">Items:</p>
                          <div className="space-y-1">
                            {box.items.map((item, idx) => (
                              <div key={idx} className="text-sm text-gray-600 pl-4">
                                • {item.itemName} x{item.quantity}
                                {item.notes && <span className="text-gray-500"> - {item.notes}</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {box.notes && (
                        <div className="mt-2 text-sm text-gray-600">
                          <span className="font-medium">Notes:</span> {box.notes}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {boxHistory.history.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No box pickup history yet</p>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading history...</p>
              </div>
            )}
          </div>
        </div>
      )}

      {showCreateBoxModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold mb-4">Create Box Pickup</h3>
            <p className="text-sm text-gray-600 mb-4">
              This will create a new box pickup record for this member using the current box items.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p className="text-sm font-medium mb-2">Current Box Items:</p>
              {subscription.currentBoxItems && subscription.currentBoxItems.length > 0 ? (
                <ul className="text-sm text-gray-600 space-y-1">
                  {subscription.currentBoxItems.map((item, idx) => (
                    <li key={idx}>• {item.itemName} x{item.quantity}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No items configured</p>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleCreateBoxPickup}
                className="flex-1 bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700"
              >
                Create Box
              </button>
              <button
                onClick={() => setShowCreateBoxModal(false)}
                className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showProductModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-7xl w-full max-h-[90vh] flex flex-col">
            <div className="p-6 border-b flex justify-between items-center flex-shrink-0">
              <div>
                <h3 className="text-xl font-semibold">Select Products for Box</h3>
                {selectedProducts.length > 0 && (
                  <p className="text-sm text-gray-600 mt-1">{selectedProducts.length} product(s) selected</p>
                )}
              </div>
              <button onClick={() => {
                setShowProductModal(false)
                setSelectedProducts([])
                setProductVariants({})
              }} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <SelectedProductsList
              selectedProducts={selectedProducts}
              productVariants={productVariants}
              onRemove={removeSelectedProduct}
              onAddToBox={addSelectedProductsToBoxItems}
            />
            
            <div className="p-6 overflow-y-auto flex-1">
              {loadingProducts ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading products...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {allProducts.map(product => {
                    const isSelected = selectedProducts.find(p => p._id === product._id)
                    const displayPrice = product.price || product.variants?.[0]?.price || product.flavors?.[0]?.price || 'N/A'
                    const displayImage = product.image || product.images?.[0] || ''
                    
                    // Check if product is out of stock
                    let isOutOfStock = false
                    if (product.hasVariants && product.variants?.length > 0) {
                      // Check if all variants are out of stock
                      isOutOfStock = product.variants.every(v => (v.stock || 0) <= 0)
                    } else if (product.flavors?.length > 0) {
                      // Check if all flavors are out of stock
                      isOutOfStock = product.flavors.every(f => (f.stock || 0) <= 0)
                    } else {
                      // Normal product - check direct stock
                      isOutOfStock = (product.stock || 0) <= 0
                    }
                    
                    return (
                      <div 
                        key={product._id} 
                        className={`border rounded-lg p-4 hover:shadow-lg transition ${isOutOfStock ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}`}
                        onClick={() => !isOutOfStock && handleProductClick(product)}
                      >
                        <div className="relative">
                          {displayImage && (
                            <img src={displayImage} alt={product.name} className="w-full h-40 object-cover rounded mb-3" />
                          )}
                          {isOutOfStock && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded mb-3">
                              <span className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-lg">
                                OUT OF STOCK
                              </span>
                            </div>
                          )}
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-1">{product.name}</h4>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {product.description?.main || product.description || ''}
                        </p>
                        
                        {/* Show variant/flavor info */}
                        {product.hasVariants && product.variants && product.variants.length > 0 && (
                          <p className="text-xs text-gray-500 mb-1">
                            {product.variants.length} size(s) available
                          </p>
                        )}
                        {product.flavors && product.flavors.length > 0 && (
                          <p className="text-xs text-gray-500 mb-1">
                            {product.flavors.length} flavor(s) available
                          </p>
                        )}
                        
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-lg font-bold text-green-600">
                            ${typeof displayPrice === 'number' ? displayPrice.toFixed(2) : displayPrice}
                          </span>
                          {!isOutOfStock && (
                            <button className={`px-3 py-1 rounded text-sm font-semibold ${isSelected ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                              {isSelected ? (
                                <>
                                  <CheckCircle className="w-4 h-4 inline mr-1" />
                                  Selected
                                </>
                              ) : (
                                <>
                                  <Plus className="w-4 h-4 inline mr-1" />
                                  Select
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <ProductDetailModal
        product={currentProduct}
        isOpen={showProductDetailModal}
        onClose={() => {
          setShowProductDetailModal(false)
          setCurrentProduct(null)
        }}
        onAddToSelection={handleAddToSelection}
      />

      {showPaymentInfoModal && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Update Payment Information</h3>
              <button
                onClick={() => setShowPaymentInfoModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Card Holder Name *
                </label>
                <input
                  type="text"
                  value={paymentInfo.cardHolderName}
                  onChange={(e) => setPaymentInfo(prev => ({ ...prev, cardHolderName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Card Brand
                </label>
                <select
                  value={paymentInfo.cardBrand}
                  onChange={(e) => setPaymentInfo(prev => ({ ...prev, cardBrand: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="Visa">Visa</option>
                  <option value="Mastercard">Mastercard</option>
                  <option value="American Express">American Express</option>
                  <option value="Discover">Discover</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last 4 Digits *
                </label>
                <input
                  type="text"
                  maxLength="4"
                  value={paymentInfo.cardLastFour}
                  onChange={(e) => setPaymentInfo(prev => ({ ...prev, cardLastFour: e.target.value.replace(/\D/g, '') }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="1234"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expiry Month
                  </label>
                  <input
                    type="text"
                    maxLength="2"
                    value={paymentInfo.expiryMonth}
                    onChange={(e) => setPaymentInfo(prev => ({ ...prev, expiryMonth: e.target.value.replace(/\D/g, '') }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="MM"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expiry Year
                  </label>
                  <input
                    type="text"
                    maxLength="4"
                    value={paymentInfo.expiryYear}
                    onChange={(e) => setPaymentInfo(prev => ({ ...prev, expiryYear: e.target.value.replace(/\D/g, '') }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="YYYY"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Billing ZIP Code
                </label>
                <input
                  type="text"
                  value={paymentInfo.billingZip}
                  onChange={(e) => setPaymentInfo(prev => ({ ...prev, billingZip: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="12345"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleUpdatePaymentInfo}
                  className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700"
                >
                  Save
                </button>
                <button
                  onClick={() => setShowPaymentInfoModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
