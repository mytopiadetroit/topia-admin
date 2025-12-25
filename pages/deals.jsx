import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Clock, Flame } from 'lucide-react';
import Sidebar from '../components/sidebar';
import Swal from 'sweetalert2';
import { 
  fetchAllDeals, 
  fetchAllProducts, 
  createDealApi, 
  updateDealApi, 
  deleteDealApi 
} from '../service/service';
import { useRouter } from 'next/router';

export default function DealsManagement() {
  const router = useRouter();
  const [deals, setDeals] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDeal, setEditingDeal] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    discountType: 'percentage',
    discountPercentage: '',
    discountAmount: '',
    startDate: '',
    endDate: '',
    products: [],
    isActive: true,
    showBanner: true,
    bannerInterval: 30,
  });
  const [bannerImageFile, setBannerImageFile] = useState(null);
  const [bannerImagePreview, setBannerImagePreview] = useState('');

  useEffect(() => {
    fetchDeals();
    fetchProducts();
  }, []);

  const fetchDeals = async () => {
    try {
      const response = await fetchAllDeals(router);
      if (response.success) {
        setDeals(response.data);
      }
    } catch (error) {
      console.error('Error fetching deals:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      // Request all products without pagination limit
      const response = await fetchAllProducts(router, { limit: 1000 });
      if (response.success) {
        setProducts(response.data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate banner image for new deals
    if (!editingDeal && !bannerImageFile) {
      Swal.fire({
        icon: 'warning',
        title: 'Banner Image Required',
        text: 'Please select a banner image for the deal',
        confirmButtonColor: '#9333ea',
      });
      return;
    }
    
    try {
      const formDataToSend = new FormData();
      
      // Append all form fields
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('discountType', formData.discountType);
      
      if (formData.discountType === 'percentage') {
        formDataToSend.append('discountPercentage', formData.discountPercentage);
      } else {
        formDataToSend.append('discountAmount', formData.discountAmount);
      }
      
      formDataToSend.append('startDate', formData.startDate);
      formDataToSend.append('endDate', formData.endDate);
      formDataToSend.append('products', JSON.stringify(formData.products));
      formDataToSend.append('isActive', formData.isActive);
      formDataToSend.append('showBanner', formData.showBanner);
      formDataToSend.append('bannerInterval', formData.bannerInterval);
      
      // Append banner image if selected
      if (bannerImageFile) {
        formDataToSend.append('bannerImage', bannerImageFile);
      }
      
      const response = editingDeal 
        ? await updateDealApi(editingDeal._id, formDataToSend, router)
        : await createDealApi(formDataToSend, router);
      
      if (response.success) {
        await Swal.fire({
          icon: 'success',
          title: editingDeal ? 'Deal Updated!' : 'Deal Created!',
          text: editingDeal 
            ? 'The deal has been updated successfully' 
            : 'New crazy deal has been created successfully',
          confirmButtonColor: '#9333ea',
          timer: 2000,
          showConfirmButton: true,
        });
        setShowModal(false);
        resetForm();
        fetchDeals();
      }
    } catch (error) {
      console.error('Error saving deal:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: 'Failed to save the deal. Please try again.',
        confirmButtonColor: '#ef4444',
      });
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Delete Deal?',
      text: 'This action cannot be undone. All deal data will be permanently removed.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Delete It',
      cancelButtonText: 'Cancel',
    });

    if (!result.isConfirmed) return;
    
    try {
      const response = await deleteDealApi(id, router);
      if (response.success) {
        await Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'The deal has been deleted successfully',
          confirmButtonColor: '#9333ea',
          timer: 2000,
        });
        fetchDeals();
      }
    } catch (error) {
      console.error('Error deleting deal:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: 'Failed to delete the deal. Please try again.',
        confirmButtonColor: '#ef4444',
      });
    }
  };

  const handleEdit = (deal) => {
    setEditingDeal(deal);
    setFormData({
      title: deal.title,
      description: deal.description || '',
      discountType: deal.discountType || 'percentage',
      discountPercentage: deal.discountPercentage || '',
      discountAmount: deal.discountAmount || '',
      startDate: new Date(deal.startDate).toISOString().slice(0, 16),
      endDate: new Date(deal.endDate).toISOString().slice(0, 16),
      products: deal.products.map(p => p._id),
      isActive: deal.isActive,
      showBanner: deal.showBanner,
      bannerInterval: deal.bannerInterval,
    });
    setBannerImagePreview(deal.bannerImage);
    setShowModal(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBannerImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setEditingDeal(null);
    setFormData({
      title: '',
      description: '',
      discountType: 'percentage',
      discountPercentage: '',
      discountAmount: '',
      startDate: '',
      endDate: '',
      products: [],
      isActive: true,
      showBanner: true,
      bannerInterval: 30,
    });
    setBannerImageFile(null);
    setBannerImagePreview('');
  };

  const toggleProductSelection = (productId) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.includes(productId)
        ? prev.products.filter(id => id !== productId)
        : [...prev.products, productId]
    }));
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDealStatus = (deal) => {
    const now = new Date();
    const start = new Date(deal.startDate);
    const end = new Date(deal.endDate);

    if (!deal.isActive) return { text: 'Inactive', color: 'bg-gray-500' };
    if (now < start) return { text: 'Scheduled', color: 'bg-blue-500' };
    if (now > end) return { text: 'Expired', color: 'bg-red-500' };
    return { text: 'Active', color: 'bg-green-500' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading deals...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Sidebar />
      <div className="main-content">
        <div className="p-6 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Flame className="w-8 h-8 text-orange-500" />
            Crazy Deals Management
          </h1>
          <p className="text-gray-600 mt-2">Create and manage limited-time offers</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all"
        >
          <Plus className="w-5 h-5" />
          Create New Deal
        </button>
      </div>

      {/* Deals List */}
      <div className="grid gap-6">
        {deals.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Flame className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Deals Yet</h3>
            <p className="text-gray-500 mb-6">Create your first crazy deal to get started!</p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold"
            >
              Create Deal
            </button>
          </div>
        ) : (
          deals.map((deal) => {
            const status = getDealStatus(deal);
            return (
              <div key={deal._id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-2xl font-bold text-gray-900">{deal.title}</h3>
                        <span className={`${status.color} text-white px-3 py-1 rounded-full text-xs font-semibold`}>
                          {status.text}
                        </span>
                        {deal.showBanner && (
                          <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
                            Banner Active
                          </span>
                        )}
                      </div>
                      {deal.description && (
                        <p className="text-gray-600 mb-3">{deal.description}</p>
                      )}
                      <div className="flex items-center gap-6 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>Start: {formatDate(deal.startDate)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>End: {formatDate(deal.endDate)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-3">
                      <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-6 py-3 rounded-xl text-center">
                        <div className="text-3xl font-extrabold">
                          {deal.discountType === 'percentage' 
                            ? `${deal.discountPercentage}%` 
                            : `$${deal.discountAmount}`}
                        </div>
                        <div className="text-xs font-semibold">OFF</div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(deal)}
                          className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(deal._id)}
                          className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Products */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm font-semibold text-gray-700 mb-2">
                      Products in this deal: {deal.products.length}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {deal.products.slice(0, 5).map((product) => (
                        <span key={product._id} className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs">
                          {product.name}
                        </span>
                      ))}
                      {deal.products.length > 5 && (
                        <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs">
                          +{deal.products.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingDeal ? 'Edit Deal' : 'Create New Deal'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Deal Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., Flash Sale - 50% Off!"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows="3"
                  placeholder="Brief description of the deal"
                />
              </div>

              {/* Banner Image Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Banner Image * {editingDeal && '(Leave empty to keep current image)'}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                {bannerImagePreview && (
                  <div className="mt-3">
                    <img 
                      src={bannerImagePreview} 
                      alt="Banner preview" 
                      className="w-full h-48 object-cover rounded-xl"
                    />
                  </div>
                )}
              </div>

              {/* Discount & Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Discount Type *
                  </label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      discountType: e.target.value,
                      discountPercentage: '',
                      discountAmount: ''
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="percentage">Percentage Off (%)</option>
                    <option value="fixed">Fixed Amount Off ($)</option>
                  </select>
                </div>
                
                {formData.discountType === 'percentage' ? (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Discount Percentage * (%)
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      max="100"
                      value={formData.discountPercentage}
                      onChange={(e) => setFormData({ ...formData, discountPercentage: e.target.value })}
                      placeholder="e.g., 25"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Discount Amount * ($)
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.discountAmount}
                      onChange={(e) => setFormData({ ...formData, discountAmount: e.target.value })}
                      placeholder="e.g., 10.00"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Start Date *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    End Date *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Settings */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="isActive" className="ml-3 text-sm font-semibold text-gray-700">
                    Active Deal
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="showBanner"
                    checked={formData.showBanner}
                    onChange={(e) => setFormData({ ...formData, showBanner: e.target.checked })}
                    className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="showBanner" className="ml-3 text-sm font-semibold text-gray-700">
                    Show Banner
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Banner Interval (sec)
                  </label>
                  <input
                    type="number"
                    min="10"
                    value={formData.bannerInterval}
                    onChange={(e) => setFormData({ ...formData, bannerInterval: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Products Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Select Products * ({formData.products.length} selected)
                </label>
                <div className="max-h-64 overflow-y-auto border border-gray-300 rounded-xl p-4 space-y-2">
                  {products.map((product) => (
                    <div key={product._id} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`product-${product._id}`}
                        checked={formData.products.includes(product._id)}
                        onChange={() => toggleProductSelection(product._id)}
                        className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                      />
                      <label htmlFor={`product-${product._id}`} className="ml-3 text-sm text-gray-700">
                        {product.name} - ${product.price}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-500 text-white py-3 rounded-xl font-semibold transition-all"
                >
                  {editingDeal ? 'Update Deal' : 'Create Deal'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-6 py-3 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        </div>
      </div>
    </>
  );
}
