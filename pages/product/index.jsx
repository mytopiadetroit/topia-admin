import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Plus } from 'lucide-react';
import { toast } from 'react-toastify';
import { useRouter } from 'next/router';
import { Api, ApiFormData, fetchAllCategories } from '../../service/service';
import Sidebar from '@/components/sidebar';

// Product page component
const Product = ({ user, loader }) => {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [currentProduct, setCurrentProduct] = useState({ 
    id: '', 
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    image: null
  });

  const sidebarWidth = "240px";
  const { category: categoryId } = router.query;

  // Fetch products with pagination
  const fetchProducts = async (page = 1, limit = 10, search = '') => {
    try {
      setLoading(true);
      const response = await Api('get', 'products/products', null, router, {
        page,
        limit,
        search
      });
      
      setProducts(response.data || []);
      setPagination({
        currentPage: page,
        totalPages: response.totalPages || 1,
        totalItems: response.totalProducts || 0,
        itemsPerPage: limit
      });
      setError(null);
    } catch (err) {
      setError('Failed to fetch products. Please try again.');
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories for dropdown using service function
  const fetchCategories = async () => {
    try {
      const result = await fetchAllCategories(router);
      setCategories(result.data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      toast.error('Failed to load categories');
    }
  };

  useEffect(() => {
    // If category ID is provided in URL, filter products by that category
    if (categoryId) {
      fetchProductsByCategory(pagination.currentPage, pagination.itemsPerPage, searchTerm, categoryId);
    } else {
      fetchProducts(pagination.currentPage, pagination.itemsPerPage, searchTerm);
    }
    fetchCategories();
  }, [pagination.currentPage, categoryId]);
  
  // Fetch products filtered by category
  const fetchProductsByCategory = async (page = 1, limit = 10, search = '', categoryId = '') => {
    try {
      setLoading(true);
      const response = await Api('get', 'products/products', null, router, {
        page,
        limit,
        search,
        category: categoryId
      });
      
      setProducts(response.data || []);
      setPagination({
        currentPage: page,
        totalPages: response.totalPages || 1,
        totalItems: response.totalProducts || 0,
        itemsPerPage: limit
      });
      setError(null);
    } catch (err) {
      setError('Failed to fetch products. Please try again.');
      console.error('Error fetching products by category:', err);
    } finally {
      setLoading(false);
    }
  };

  // Search functionality
  const handleSearch = (searchValue) => {
    setSearchTerm(searchValue);
    if (categoryId) {
      fetchProductsByCategory(1, pagination.itemsPerPage, searchValue, categoryId);
    } else {
      fetchProducts(1, pagination.itemsPerPage, searchValue);
    }
  };

  // Pagination functions
  const paginate = (pageNumber) => {
    if (categoryId) {
      fetchProductsByCategory(pageNumber, pagination.itemsPerPage, searchTerm, categoryId);
    } else {
      fetchProducts(pageNumber, pagination.itemsPerPage, searchTerm);
    }
  };

  const goToPrevPage = () => {
    if (pagination.currentPage > 1) {
      paginate(pagination.currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (pagination.currentPage < pagination.totalPages) {
      paginate(pagination.currentPage + 1);
    }
  };

  // Modal functions
  const openAddModal = () => {
    setModalMode('add');
    setCurrentProduct({ 
      id: '', 
      name: '',
      description: '',
      price: '',
      category: '',
      stock: '',
      image: null
    });
    setShowModal(true);
  };

  const openEditModal = (product) => {
    setModalMode('edit');
    setCurrentProduct({ 
      id: product._id, 
      name: product.name,
      description: product.description || '',
      price: product.price,
      category: product.category,
      stock: product.stock || '',
      image: null
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setCurrentProduct({ 
      id: '', 
      name: '',
      description: '',
      price: '',
      category: '',
      stock: '',
      image: null
    });
  };

  const handleInputChange = (e) => {
    if (e.target.name === 'image') {
      setCurrentProduct({
        ...currentProduct,
        image: e.target.files[0]
      });
    } else {
      setCurrentProduct({
        ...currentProduct,
        [e.target.name]: e.target.value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const formData = new FormData();
      formData.append('name', currentProduct.name);
      formData.append('description', currentProduct.description);
      formData.append('price', currentProduct.price);
      formData.append('category', currentProduct.category);
      formData.append('stock', currentProduct.stock || 0);
      
      if (currentProduct.image) {
        formData.append('image', currentProduct.image);
      }
      
      if (modalMode === 'add') {
        // Create new product using ApiFormData
        const result = await ApiFormData('post', 'products/products', formData, router);
        if (result.success) {
          toast.success('Product created successfully');
        } else {
          toast.error(result.message || 'Failed to create product');
        }
      } else {
        // Update existing product using ApiFormData
        const result = await ApiFormData('put', `products/products/${currentProduct.id}`, formData, router);
        if (result.success) {
          toast.success('Product updated successfully');
        } else {
          toast.error(result.message || 'Failed to update product');
        }
      }
      
      // Refresh products list
      fetchProducts(pagination.currentPage, pagination.itemsPerPage, searchTerm);
      closeModal();
    } catch (err) {
      toast.error(err.message || 'An error occurred');
      console.error('Error saving product:', err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        const result = await Api('delete', `products/products/${id}`, null, router);
        if (result.success) {
          toast.success('Product deleted successfully');
        } else {
          toast.error(result.message || 'Failed to delete product');
        }
        
        // Refresh products list
        fetchProducts(pagination.currentPage, pagination.itemsPerPage, searchTerm);
      } catch (err) {
        toast.error(err.message || 'An error occurred');
        console.error('Error deleting product:', err);
      }
    }
  };

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
        <span className="font-semibold">Products</span>
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
        <div className="mb-6 flex bg-white p-4 rounded-lg shadow-sm items-center justify-between">
          <h1 className="text-2xl text-gray-700 font-bold">Products</h1>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-xl font-semibold text-gray-800">Products</h1>

            <div className="flex items-center space-x-4">
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search products"
                  className="pl-10 pr-4 py-2 border text-gray-500 rounded-md w-64 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <div className="absolute left-3 top-2.5">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                {searchTerm && (
                  <button
                    onClick={() => handleSearch("")}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              <button
                onClick={openAddModal}
                className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                <Plus size={18} className="mr-1" />
                Add Product
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex justify-center items-center py-10">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
              </div>
            ) : error ? (
              <div className="text-center py-10 text-red-500">
                {error}
              </div>
            ) : (
              <table className="min-w-full">
                <thead>
                  <tr className="text-left text-xs text-gray-500 border-b">
                    <th className="px-4 py-3 font-medium">IMAGE</th>
                    <th className="px-4 py-3 font-medium">NAME</th>
                    <th className="px-4 py-3 font-medium">CATEGORY</th>
                    <th className="px-4 py-3 font-medium">PRICE</th>
                    <th className="px-4 py-3 font-medium">STOCK</th>
                    <th className="px-4 py-3 font-medium text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {products.length > 0 ? (
                    products.map((product) => (
                      <tr key={product._id} className="border-b">
                        <td className="px-4 py-3">
                          {product.image ? (
                            <img 
                              src={product.image} 
                              alt={product.name} 
                              className="h-12 w-12 object-cover rounded-md"
                            />
                          ) : (
                            <div className="h-12 w-12 bg-gray-200 rounded-md flex items-center justify-center">
                              <span className="text-gray-500 text-xs">No image</span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{product.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{product.category}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">${parseFloat(product.price).toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{product.stock || 0}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => openEditModal(product)}
                            className="text-blue-600 hover:text-blue-800 mr-3"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(product._id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center py-10 text-gray-500">
                        No products found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {!loading && !error && products.length > 0 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1}-{Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of {pagination.totalItems}
              </div>
              
              <div className="flex items-center space-x-1">
                <button
                  onClick={goToPrevPage}
                  disabled={pagination.currentPage === 1}
                  className={`p-1 rounded-md border ${pagination.currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  // Determine which page numbers to show
                  let pageNum;
                  const totalPages = pagination.totalPages;

                  if (totalPages <= 5) {
                    // If we have 5 or fewer pages, show all pages
                    pageNum = i + 1;
                  } else {
                    // For more than 5 pages, create a window around current page
                    if (pagination.currentPage <= 3) {
                      // Near the start
                      pageNum = i + 1;
                      if (i === 4) pageNum = totalPages;
                    } else if (pagination.currentPage >= totalPages - 2) {
                      // Near the end
                      pageNum = totalPages - 4 + i;
                    } else {
                      // Somewhere in the middle
                      pageNum = pagination.currentPage - 2 + i;
                    }
                  }

                  // Add ellipsis for page number gaps
                  if ((totalPages > 5 && i === 3 && pagination.currentPage < totalPages - 2) ||
                    (totalPages > 5 && i === 1 && pagination.currentPage > 3)) {
                    return (
                      <span key={`ellipsis-${i}`} className="px-3 py-1 text-gray-500">...</span>
                    );
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => paginate(pageNum)}
                      className={`w-8 h-8 rounded-md border flex items-center justify-center text-sm
                        ${pagination.currentPage === pageNum
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={goToNextPage}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className={`p-1 rounded-md border ${pagination.currentPage === pagination.totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Add/Edit Product Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  {modalMode === 'add' ? 'Add New Product' : 'Edit Product'}
                </h3>
                <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Product Name*
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={currentProduct.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Enter product name"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                      Category*
                    </label>
                    <select
                      id="category"
                      name="category"
                      value={currentProduct.category}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select a category</option>
                      {categories.map(category => (
                        <option key={category._id} value={category.category}>
                          {category.category}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                      Price*
                    </label>
                    <input
                      type="text"
                      id="price"
                      name="price"
                      value={currentProduct.price}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Enter price"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-1">
                      Stock
                    </label>
                    <input
                      type="text"
                      id="stock"
                      name="stock"
                      value={currentProduct.stock}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Enter stock quantity"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={currentProduct.description}
                      onChange={handleInputChange}
                      rows="4"
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Enter product description"
                    ></textarea>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">
                      Product Image
                    </label>
                    <input
                      type="file"
                      id="image"
                      name="image"
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      accept="image/*"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {modalMode === 'edit' ? 'Leave empty to keep the current image' : 'Upload a product image'}
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    {modalMode === 'add' ? 'Add Product' : 'Update Product'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Product;