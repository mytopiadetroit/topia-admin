import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { fetchProductsByCategory, fetchAllCategories, createProduct, deleteProduct, updateProductApi, toast, fetchAllReviewTags } from '../../service/service';
import Swal from 'sweetalert2';
// import { CURRENCY_SIGN } from '../../utils/constants';
import { 
  Package, 
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
  ArrowLeft
} from 'lucide-react';

export default function ProductsByCategory() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [productModalLoading, setProductModalLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    price: '',
    stock: '',
    descriptionMain: '',
    descriptionDetails: '',
    primaryUse: 'therapeutic',
    hasStock: true,
    images: [],
    reviewTagIds: []
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    id: '',
    name: '',
    price: '',
    stock: '',
    descriptionMain: '',
    descriptionDetails: '',
    primaryUse: 'therapeutic',
    hasStock: true,
    imagesNew: [],
     imageAltName: '',
  metaTitle: '',
  metaDescription: '',
  reviewTagIds: []
  });
  const [editKeepImages, setEditKeepImages] = useState([]);
  const [category, setCategory] = useState(null);
  const [availableTags, setAvailableTags] = useState([]);
  const fileInputRef = useRef(null);
  const router = useRouter();
  const { categoryId } = router.query;

  useEffect(() => {
    if (categoryId) {
      loadProducts();
      loadCategoryInfo();
      loadReviewTags();
    }
  }, [categoryId]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await fetchProductsByCategory(categoryId, router);
      if (response.success) {
        setProducts(response.data || []);
      } else {
        toast.error('Failed to load products');
      }
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Error loading products');
    } finally {
      setLoading(false);
    }
  };

  const loadCategoryInfo = async () => {
    try {
      const response = await fetchAllCategories(router);
      if (response.success) {
        const categoryData = response.data.find(cat => cat._id === categoryId);
        setCategory(categoryData);
      }
    } catch (error) {
      console.error('Error loading category info:', error);
    }
  };

  const loadReviewTags = async () => {
    try {
      const res = await fetchAllReviewTags(router, { active: true });
      if (res?.success) setAvailableTags(res.data || []);
    } catch (e) {
      console.error('Error loading review tags:', e);
    }
  };

  const handleViewProduct = async (productId) => {
    try {
      setProductModalLoading(true);
      setShowProductModal(true);
      const product = products.find(p => p._id === productId);
      if (product) {
        setSelectedProduct(product);
      } else {
        toast.error('Product not found');
        setShowProductModal(false);
      }
    } catch (error) {
      console.error('Error loading product details:', error);
      toast.error('Error loading product details');
      setShowProductModal(false);
    } finally {
      setProductModalLoading(false);
    }
  };

  const closeProductModal = () => {
    setShowProductModal(false);
    setSelectedProduct(null);
  };

  const handleEditProduct = (productId) => {
    const product = products.find(p => p._id === productId);
    if (!product) return;
    setSelectedProduct(product);
    setEditForm({
      id: product._id,
      name: product.name || '',
      price: product.price || '',
      stock: product.stock ?? '',
      descriptionMain: product.description?.main || '',
      descriptionDetails: product.description?.details || '',
      primaryUse: product.primaryUse || 'therapeutic',
      hasStock: !!product.hasStock,
      imagesNew: [],
       imageAltName: product.imageAltName || '',
    metaTitle: product.metaTitle || '',
    metaDescription: product.metaDescription || '',
    reviewTagIds: (product.reviewTags || []).map(t => t._id)
    });
    setEditKeepImages([...(product.images || [])]);
    setShowEditModal(true);
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleEditFileChange = (e) => {
    setEditForm(prev => ({ ...prev, imagesNew: Array.from(e.target.files || []) }));
  };

  const toggleKeepImage = (img) => {
    setEditKeepImages(prev => prev.includes(img) ? prev.filter(i => i !== img) : [...prev, img]);
  };

  const submitEditProduct = async (e) => {
    e.preventDefault();
    try {
      setEditSaving(true);
      const fd = new FormData();
      fd.append('name', editForm.name);
      fd.append('price', String(editForm.price));
      fd.append('stock', String(editForm.stock || 0));
      fd.append('primaryUse', editForm.primaryUse);
      fd.append('hasStock', String(editForm.hasStock));
      fd.append('category', categoryId);
      fd.append('description', JSON.stringify({ main: editForm.descriptionMain, details: editForm.descriptionDetails }));
      fd.append('existingImages', JSON.stringify(editKeepImages));
      (editForm.imagesNew || []).forEach((file) => fd.append('images', file));
       fd.append('imageAltName', editForm.imageAltName || '');
    fd.append('metaTitle', editForm.metaTitle || '');
    fd.append('metaDescription', editForm.metaDescription || '');
      fd.append('reviewTags', JSON.stringify(editForm.reviewTagIds || []));

      const res = await updateProductApi(editForm.id, fd, router);
      if (res?.success) {
        await Swal.fire({ title: 'Updated!', text: 'Product updated successfully', icon: 'success', confirmButtonText: 'OK' });
        setShowEditModal(false);
        await loadProducts();
      } else {
        Swal.fire({ title: 'Error!', text: res?.message || 'Failed to update product', icon: 'error', confirmButtonText: 'OK' });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({ title: 'Error!', text: 'Error updating product', icon: 'error', confirmButtonText: 'OK' });
    } finally {
      setEditSaving(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        const res = await deleteProduct(productId, router);
        if (res?.success) {
          await Swal.fire('Deleted!', 'Product has been deleted.', 'success');
          await loadProducts();
        } else {
          Swal.fire('Error!', res?.message || 'Failed to delete product.', 'error');
        }
      } catch (error) {
        console.error('Error deleting product:', error);
        Swal.fire('Error!', 'Failed to delete product.', 'error');
      }
    }
  };

  const openAddModal = () => {
    setForm({
      name: '',
      price: '',
      stock: '',
      descriptionMain: '',
      descriptionDetails: '',
      primaryUse: 'therapeutic',
      hasStock: true,
      images: [],
      reviewTagIds: []
    });
    setShowAddModal(true);
  };

  const handleFileChange = (e) => {
    setForm(prev => ({ ...prev, images: Array.from(e.target.files || []) }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const submitAddProduct = async (e) => {
    e.preventDefault();
    if (!categoryId) return;
    try {
      setSaving(true);
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('price', String(form.price));
      fd.append('stock', String(form.stock || 0));
      fd.append('primaryUse', form.primaryUse);
      fd.append('hasStock', String(form.hasStock));
      fd.append('category', categoryId);
      fd.append('description', JSON.stringify({ main: form.descriptionMain, details: form.descriptionDetails }));
      form.images.forEach((file) => fd.append('images', file));
       fd.append('imageAltName', form.imageAltName || '');
    fd.append('metaTitle', form.metaTitle || '');
    fd.append('metaDescription', form.metaDescription || '');
      fd.append('reviewTags', JSON.stringify(form.reviewTagIds || []));

      const res = await createProduct(fd, router);
      if (res?.success) {
        await Swal.fire({
          title: 'Success!',
          text: 'Product created successfully',
          icon: 'success',
          confirmButtonText: 'OK'
        });
        setShowAddModal(false);
        await loadProducts();
      } else {
        Swal.fire({
          title: 'Error!',
          text: res?.message || 'Failed to create product',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({ title: 'Error!', text: 'Error creating product', icon: 'error', confirmButtonText: 'OK' });
    } finally {
      setSaving(false);
    }
  };

  const filteredProducts = products.filter(product => {
    return product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           product.description?.main?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const formatPrice = (price) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  const truncateWords = (text, limit = 3) => {
    if (!text || typeof text !== 'string') return '';
    const words = text.trim().split(/\s+/);
    return words.length > limit ? words.slice(0, limit).join(' ') + '...' : text;
  };

  if (loading) {
    return (
      <Layout title="Products">
        <div className="p-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Products">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <button onClick={() => router.back()} className="flex items-center text-gray-600 hover:text-gray-900">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back
                </button>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">{category ? category.category : 'Products'}</h1>
              <p className="text-gray-600 mt-2">Manage products in {category ? category.category : 'this category'}</p>
            </div>
            <div className="flex items-center space-x-3">
              <button onClick={openAddModal} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </button>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input type="text" placeholder="Search products..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
            </div>
            <div className="text-sm text-gray-500">{filteredProducts.length} of {products.length} products</div>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr key={product._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                          {product.images && product.images.length > 0 ? (
                            <img src={product.images[0]} alt={product.name} className="h-12 w-12 object-cover" />
                          ) : (
                            <Package className="h-6 w-6 text-gray-400" />
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          <div className="text-xs text-gray-500">{truncateWords(product.description?.main, 3)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">{formatPrice(product.price)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${product.hasStock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {product.hasStock ? `In Stock (${product.stock ?? 0})` : 'Out of Stock'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(product.createdAt)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button onClick={() => handleViewProduct(product._id)} className="text-blue-600 hover:text-blue-900 p-1" title="View Product">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleEditProduct(product._id)} className="text-green-600 hover:text-green-900 p-1" title="Edit Product">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDeleteProduct(product._id)} className="text-red-600 hover:text-red-900 p-1" title="Delete Product">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Empty State */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
            <p className="mt-1 text-sm text-gray-500">{searchTerm ? 'Try adjusting your search criteria.' : 'Get started by adding a new product.'}</p>
          </div>
        )}

        {/* Product Details Modal */}
        {showProductModal && selectedProduct && (
          <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Product Details</h2>
                <button onClick={closeProductModal} className="text-gray-400 hover:text-gray-600 p-1">
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="p-6">
                {productModalLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Product Images</h4>
                      <div className="grid grid-cols-2 gap-4">
                        {selectedProduct.images && selectedProduct.images.length > 0 ? (
                          selectedProduct.images.map((image, index) => (
                            <img key={index} src={image} alt={`${selectedProduct.name} - Image ${index + 1}`} className="w-full h-32 object-cover rounded-lg" />
                          ))
                        ) : (
                          <div className="col-span-2 h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                            <Package className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{selectedProduct.name}</h3>
                        <p className="text-2xl font-bold text-blue-600">{formatPrice(selectedProduct.price)}</p>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <h4 className="text-sm font-medium text-gray-700">Description</h4>
                          <p className="text-sm text-gray-900 mt-1">{selectedProduct.description?.main}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-700">Category</h4>
                          <p className="text-sm text-gray-900 mt-1">{selectedProduct.category?.category || 'N/A'}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-700">Primary Use</h4>
                          <p className="text-sm text-gray-900 mt-1 capitalize">{selectedProduct.primaryUse}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-700">Stock Status</h4>
                          <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full mt-1 ${selectedProduct.hasStock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {selectedProduct.hasStock ? `In Stock (${selectedProduct.stock ?? 0})` : 'Out of Stock'}
                          </span>
                        </div>
                        {selectedProduct.tags && selectedProduct.tags.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-700">Tags</h4>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {selectedProduct.tags.map((tag, index) => (
                                <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">{tag}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        <div>
                          <h4 className="text-sm font-medium text-gray-700">Created</h4>
                          <p className="text-sm text-gray-900 mt-1">{formatDate(selectedProduct.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
                <button onClick={closeProductModal} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">Close</button>
                <button onClick={() => { closeProductModal(); handleEditProduct(selectedProduct._id); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Product
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Product Modal */}
      {showAddModal && (
  <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[80vh] overflow-y-auto">
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Add Product</h2>
        <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 p-1">
          <X className="h-6 w-6" />
        </button>
      </div>
      <form onSubmit={submitAddProduct} className="p-6 space-y-4">
        
        {/* Name + Price */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Name</label>
            <input name="name" value={form.name} onChange={handleChange} required className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700" />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Price</label>
            <input type="number" name="price" value={form.price} onChange={handleChange} required min="0" step="0.01" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700" />
          </div>
        </div>

        {/* Descriptions */}
        <div>
          <label className="block text-sm text-gray-700 mb-1">Main Description</label>
          <textarea name="descriptionMain" value={form.descriptionMain} onChange={handleChange} required rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700" />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Detailed Description</label>
          <textarea name="descriptionDetails" value={form.descriptionDetails} onChange={handleChange} rows={4} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700" />
        </div>

        {/* Primary Use + Stock */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Primary Use</label>
            <select name="primaryUse" value={form.primaryUse} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700">
              <option value="therapeutic">Therapeutic</option>
              <option value="functional">Functional</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Stock Quantity</label>
            <input type="number" min="0" name="stock" value={form.stock} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700" placeholder="e.g., 10" />
          </div>
          <div className="flex items-center space-x-2 mt-6">
            <input id="hasStock" type="checkbox" name="hasStock" checked={form.hasStock} onChange={handleChange} className="h-4 w-4 text-blue-600 border-gray-300 rounded" />
            <label htmlFor="hasStock" className="text-sm text-gray-700">In Stock</label>
          </div>
        </div>

        {/* Images */}
        <div>
          <label className="block text-sm text-gray-700 mb-1">Images</label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <p className="text-sm text-gray-600">Click to choose files or drag and drop</p>
            <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB each</p>
            <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleFileChange} className="hidden" />
            {form.images && form.images.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {form.images.map((file, idx) => (
                  <div key={idx} className="h-20 w-full bg-gray-100 rounded overflow-hidden flex items-center justify-center text-xs text-gray-500">{file.name}</div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Review Tags (multiple select) */}
        <div>
          <label className="block text-sm text-gray-700 mb-1">Review Tags</label>
          <div className="flex flex-wrap gap-2">
            {availableTags.map((t) => {
              const checked = (form.reviewTagIds || []).includes(t._id);
              return (
                <label key={t._id} className={`px-3 py-1 rounded-full text-sm cursor-pointer border ${checked ? 'bg-blue-100 border-blue-300 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                  <input
                    type="checkbox"
                    className="mr-2 align-middle"
                    checked={checked}
                    onChange={(e) => {
                      setForm(prev => {
                        const set = new Set(prev.reviewTagIds || []);
                        if (e.target.checked) set.add(t._id); else set.delete(t._id);
                        return { ...prev, reviewTagIds: Array.from(set) };
                      });
                    }}
                  />
                  {t.label}
                </label>
              );
            })}
            {availableTags.length === 0 && (
              <div className="text-sm text-gray-500">No review tags. Create some in Review Tags page.</div>
            )}
          </div>
        </div>

        {/* 👇 New SEO Fields */}
        <div>
          <label className="block text-sm text-gray-700 mb-1">Image Alt Name</label>
          <input type="text" name="imageAltName" value={form.imageAltName} onChange={handleChange} placeholder="Describe the image (for SEO)" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700" />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Meta Title</label>
          <input type="text" name="metaTitle" value={form.metaTitle} onChange={handleChange} placeholder="SEO Meta Title" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700" />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Meta Description</label>
          <textarea name="metaDescription" value={form.metaDescription} onChange={handleChange} rows={3} placeholder="SEO Meta Description" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700" />
        </div>

        {/* Submit */}
        <div className="flex justify-end space-x-3 pt-2">
          <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">Cancel</button>
          <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60">{saving ? 'Saving...' : 'Create Product'}</button>
        </div>
      </form>
    </div>
  </div>
)}


        {/* Edit Product Modal */}
      {showEditModal && (
  <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[80vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Edit Product</h2>
        <button
          onClick={() => setShowEditModal(false)}
          className="text-gray-400 hover:text-gray-600 p-1"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={submitEditProduct} className="p-6 space-y-4">
        {/* Name & Price */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Name</label>
            <input
              name="name"
              value={editForm.name}
              onChange={handleEditChange}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 
                focus:ring-blue-500 focus:border-transparent text-gray-700"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Price</label>
            <input
              type="number"
              name="price"
              value={editForm.price}
              onChange={handleEditChange}
              required
              min="0"
              step="0.01"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 
                focus:ring-blue-500 focus:border-transparent text-gray-700"
            />
          </div>
        </div>

        {/* Main Description */}
        <div>
          <label className="block text-sm text-gray-700 mb-1">Main Description</label>
          <textarea
            name="descriptionMain"
            value={editForm.descriptionMain}
            onChange={handleEditChange}
            required
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 
              focus:ring-blue-500 focus:border-transparent text-gray-700"
          />
        </div>

        {/* Detailed Description */}
        <div>
          <label className="block text-sm text-gray-700 mb-1">Detailed Description</label>
          <textarea
            name="descriptionDetails"
            value={editForm.descriptionDetails}
            onChange={handleEditChange}
            rows={4}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 
              focus:ring-blue-500 focus:border-transparent text-gray-700"
          />
        </div>

        {/* Primary Use + Stock + In Stock */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Primary Use</label>
            <select
              name="primaryUse"
              value={editForm.primaryUse}
              onChange={handleEditChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 
                focus:ring-blue-500 focus:border-transparent text-gray-700"
            >
              <option value="therapeutic">Therapeutic</option>
              <option value="functional">Functional</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Stock Quantity</label>
            <input
              type="number"
              min="0"
              name="stock"
              value={editForm.stock}
              onChange={handleEditChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 
                focus:ring-blue-500 focus:border-transparent text-gray-700"
              placeholder="e.g., 10"
            />
          </div>
          <div className="flex items-center space-x-2 mt-6">
            <input
              id="editHasStock"
              type="checkbox"
              name="hasStock"
              checked={editForm.hasStock}
              onChange={handleEditChange}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
            />
            <label htmlFor="editHasStock" className="text-sm text-gray-700">
              In Stock
            </label>
          </div>
        </div>

        {/* Existing Images */}
        <div>
          <label className="block text-sm text-gray-700 mb-1">
            Existing Images (uncheck to remove)
          </label>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
            {(selectedProduct?.images || []).map((img, idx) => (
              <label key={idx} className="flex items-center space-x-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={editKeepImages.includes(img)}
                  onChange={() => toggleKeepImage(img)}
                />
                <img
                  src={img}
                  alt={`img-${idx}`}
                  className="h-16 w-16 object-cover rounded"
                />
              </label>
            ))}
            {(!selectedProduct?.images || selectedProduct.images.length === 0) && (
              <div className="text-sm text-gray-500">No images</div>
            )}
          </div>
        </div>

        {/* Add New Images */}
        <div>
          <label className="block text-sm text-gray-700 mb-1">Add New Images</label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleEditFileChange}
            className="block w-full text-sm text-gray-700"
          />
        </div>
        {/* Review Tags (multiple select) */}
        <div>
          <label className="block text-sm text-gray-700 mb-1">Review Tags</label>
          <div className="flex flex-wrap gap-2">
            {availableTags.map((t) => {
              const checked = (editForm.reviewTagIds || []).includes(t._id);
              return (
                <label key={t._id} className={`px-3 py-1 rounded-full text-sm cursor-pointer border ${checked ? 'bg-blue-100 border-blue-300 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                  <input
                    type="checkbox"
                    className="mr-2 align-middle"
                    checked={checked}
                    onChange={(e) => {
                      setEditForm(prev => {
                        const set = new Set(prev.reviewTagIds || []);
                        if (e.target.checked) set.add(t._id); else set.delete(t._id);
                        return { ...prev, reviewTagIds: Array.from(set) };
                      });
                    }}
                  />
                  {t.label}
                </label>
              );
            })}
            {availableTags.length === 0 && (
              <div className="text-sm text-gray-500">No review tags. Create some in Review Tags page.</div>
            )}
          </div>
        </div>
        <div>
  <label className="block text-sm text-gray-700 mb-1">Image Alt Name</label>
  <input
    type="text"
    name="imageAltName"
    value={editForm.imageAltName}
    onChange={handleEditChange}
    placeholder="Describe the image (for SEO)"
    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 
      focus:ring-blue-500 focus:border-transparent text-gray-700"
  />
</div>
<div>
  <label className="block text-sm text-gray-700 mb-1">Meta Title</label>
  <input
    type="text"
    name="metaTitle"
    value={editForm.metaTitle}
    onChange={handleEditChange}
    placeholder="SEO Meta Title"
    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 
      focus:ring-blue-500 focus:border-transparent text-gray-700"
  />
</div>
<div>
  <label className="block text-sm text-gray-700 mb-1">Meta Description</label>
  <textarea
    name="metaDescription"
    value={editForm.metaDescription}
    onChange={handleEditChange}
    rows={3}
    placeholder="SEO Meta Description"
    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 
      focus:ring-blue-500 focus:border-transparent text-gray-700"
  />
</div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={() => setShowEditModal(false)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={editSaving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
          >
            {editSaving ? "Saving..." : "Update Product"}
          </button>
        </div>
      </form>
    </div>
  </div>
)}

      </div>
    </Layout>
  );
}
