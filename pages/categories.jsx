import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Plus, LogOut } from 'lucide-react';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { useRouter } from 'next/router';
import { Api } from '@/service/service';
import Layout from '@/components/Layout';

// API Helper Functions
const fetchAllCategories = async (router) => {
  try {
    return await Api('get', 'categories/categories', null, router);
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

const createCategory = async (data, router) => {
  try {
    return await Api('post', 'categories/categories', data, router);
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
};

const updateCategory = async (id, data, router) => {
  try {
    return await Api('put', `categories/categories/${id}`, data, router);
  } catch (error) {
    console.error('Error updating category:', error);
    throw error;
  }
};

const deleteCategory = async (id, router) => {
  try {
    return await Api('delete', `categories/categories/${id}`, null, router);
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
};

const Categories = ({ user, loader }) => {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');
  const [imagePreview, setImagePreview] = useState('');
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
  const [currentCategory, setCurrentCategory] = useState({ 
  id: '', 
  category: '', 
  metaTitle: '', 
  metaDescription: '' 
});

  const sidebarWidth = "240px";

  const handleLogout = () => {
    localStorage.removeItem('userDetail');
    localStorage.removeItem('token');
    router.push('/');
  };

  // Fetch categories with pagination using Api function
  const fetchCategories = async (page = 1, limit = 10, search = '') => {
    try {
      setLoading(true);
      // Using the Api function for API call
      const result = await fetchAllCategories(router);
      
      // If the API doesn't support pagination yet, handle it client-side
      const allCategories = result.data || [];
      
      // Simple client-side pagination and search if needed
      let filteredCategories = allCategories;
      if (search) {
        filteredCategories = allCategories.filter(cat => 
          cat.category.toLowerCase().includes(search.toLowerCase())
        );
      }
      
      // Calculate pagination
      const totalItems = filteredCategories.length;
      const totalPages = Math.ceil(totalItems / limit);
      const startIndex = (page - 1) * limit;
      const paginatedCategories = filteredCategories.slice(startIndex, startIndex + limit);
      
      setCategories(paginatedCategories);
      setPagination({
        currentPage: page,
        totalPages: totalPages,
        totalItems: totalItems,
        itemsPerPage: limit
      });
      setError(null);
    } catch (err) {
      setError('Failed to fetch categories. Please try again.');
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  // Search functionality
  const handleSearch = (searchValue) => {
    setSearchTerm(searchValue);
    fetchCategories(1, pagination.itemsPerPage, searchValue);
  };

  // Pagination functions
  const paginate = (pageNumber) => {
    fetchCategories(pageNumber, pagination.itemsPerPage, searchTerm);
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
  setCurrentCategory({ id: '', category: '', metaTitle: '', metaDescription: '', image: '' });
  setImagePreview('');
  setSelectedImage('');
  setShowModal(true);
};

 const openEditModal = (category) => {
  setModalMode('edit');
  setCurrentCategory({ 
    id: category._id, 
    category: category.category,
    metaTitle: category.metaTitle || '',
    metaDescription: category.metaDescription || '',
    image: category.image || ''
  });
  setImagePreview(category.image || '');
  setSelectedImage('');
  setShowModal(true);
};

 const closeModal = () => {
  setShowModal(false);
  setCurrentCategory({ id: '', category: '', metaTitle: '', metaDescription: '', image: '' });
  setImagePreview('');
  setSelectedImage('');
};

  const handleInputChange = (e) => {
    setCurrentCategory({
      ...currentCategory,
      [e.target.name]: e.target.value
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (response.ok) {
        setCurrentCategory(prev => ({
          ...prev,
          image: data.imageUrl
        }));
        setImagePreview(URL.createObjectURL(file));
      } else {
        throw new Error(data.message || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const formData = new FormData();
      formData.append('category', currentCategory.category);
      formData.append('metaTitle', currentCategory.metaTitle);
      formData.append('metaDescription', currentCategory.metaDescription);
      
      if (selectedImage) {
        formData.append('image', selectedImage);
      }

      if (modalMode === 'add') {
        // Create new category using Api function
        const result = await createCategory(formData, router);
        if (result.success) {
          await Swal.fire({
            icon: 'success',
            title: 'Created',
            text: 'Category created successfully',
            timer: 1500,
            showConfirmButton: false
          });
        } else {
          Swal.fire({ icon: 'error', title: 'Error', text: result.message || 'Failed to create category' });
        }
      } else {
        // Update existing category using Api function
        const result = await updateCategory(currentCategory.id, formData, router);
        if (result.success) {
          await Swal.fire({
            icon: 'success',
            title: 'Updated',
            text: 'Category updated successfully',
            timer: 1500,
            showConfirmButton: false
          });
        } else {
          Swal.fire({ icon: 'error', title: 'Error', text: result.message || 'Failed to update category' });
        }
      }
      
      // Refresh categories list
      fetchCategories(pagination.currentPage, pagination.itemsPerPage, searchTerm);
      closeModal();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message || 'An error occurred' });
      console.error('Error saving category:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      // First confirmation
      const firstConfirm = await Swal.fire({
        title: 'Are you sure?',
        text: 'You are about to delete this category and all its products!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel',
        reverseButtons: true,
        focusCancel: true
      });

      if (!firstConfirm.isConfirmed) return;

      // Second confirmation with stronger warning
      const secondConfirm = await Swal.fire({
        title: 'This action cannot be undone!',
        html: `
          <div class="text-left">
            <p class="text-lg font-medium mb-4">Are you absolutely sure you want to delete this category?</p>
            <div class="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
              <div class="flex">
                <div class="flex-shrink-0">
                  <svg class="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                  </svg>
                </div>
                <div class="ml-3">
                  <p class="text-sm text-red-700">
                    <strong>WARNING:</strong> This will permanently delete the category and <strong>ALL</strong> products associated with it. This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>
            <p class="text-red-600 font-semibold">Type <span class="bg-red-100 px-2 py-1 rounded">DELETE</span> to confirm</p>
          </div>
        `,
        input: 'text',
        inputPlaceholder: 'Type DELETE here',
        inputAttributes: {
          autocapitalize: 'off',
          autocorrect: 'off'
        },
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, delete everything',
        cancelButtonText: 'No, keep it safe',
        reverseButtons: true,
        focusCancel: true,
        inputValidator: (value) => {
          if (value !== 'DELETE') {
            return 'You must type DELETE to confirm';
          }
        }
      });

      if (!secondConfirm.isConfirmed || secondConfirm.value !== 'DELETE') {
        await Swal.fire({
          icon: 'info',
          title: 'Cancelled',
          text: 'Your category and products are safe!',
          timer: 1500,
          showConfirmButton: false
        });
        return;
      }

      // Show loading state
      Swal.fire({
        title: 'Deleting...',
        text: 'Please wait while we delete the category and its products',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      // Call the delete API
      const result = await deleteCategory(id, router);
      
      // Show success message
      if (result.success) {
        await Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: result.message || 'Category and its products have been deleted.',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        throw new Error(result.message || 'Failed to delete category');
      }
      
      // Refresh the categories list
      await fetchCategories(pagination.currentPage, pagination.itemsPerPage, searchTerm);
      
    } catch (err) {
      console.error('Error deleting category:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.response?.data?.message || err.message || 'An error occurred while deleting the category',
        confirmButtonColor: '#3b82f6'
      });
    }
  };

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <Layout title="Categories">
      <div className="p-6">
     
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-xl font-semibold text-gray-800">Categories</h1>

            <div className="flex items-center space-x-4">
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search categories"
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
                Add Category
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
                  <tr className="text-left text-xs text-gray-500">
                    <th className="px-4 py-3 font-medium">IMAGE</th>
                    <th className="px-4 py-3 font-medium">CATEGORY NAME</th>
                    <th className="px-4 py-3 font-medium text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.length > 0 ? (
                    categories.map((category) => (
                      <tr key={category._id}>
                        <td className="px-4 py-3">
                          {category.image && (
                            <div className="w-12 h-12 rounded-md overflow-hidden border">
                              <img 
                                src={category.image} 
                                alt={category.category} 
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{category.category}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => openEditModal(category)}
                            className="text-blue-600 hover:text-blue-800 mr-3"
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(category._id)}
                            className="text-red-600 hover:text-red-800"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="2" className="text-center py-10 text-gray-500">
                        No categories found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {!loading && !error && categories.length > 0 && (
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

        {/* Add/Edit Category Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg text-gray-700 font-semibold">
                  {modalMode === 'add' ? 'Add New Category' : 'Edit Category'}
                </h3>
                <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                    Category Name
                  </label>
                  <input
                    type="text"
                    id="category"
                    name="category"
                    value={currentCategory.category}
                    onChange={handleInputChange}
                    className="w-full text-gray-700 px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter category name"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category Image
                  </label>
                  <div className="mt-1 flex items-center">
                    <label
                      htmlFor="image-upload"
                      className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      {uploading ? 'Uploading...' : 'Choose Image'}
                      <input
                        id="image-upload"
                        name="image-upload"
                        type="file"
                        className="sr-only"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            setSelectedImage(file);
                            setImagePreview(URL.createObjectURL(file));
                            setCurrentCategory(prev => ({
                              ...prev,
                              image: file
                            }));
                          }
                        }}
                        accept="image/*"
                      />
                    </label>
                  </div>
                  
                  {(imagePreview || currentCategory.image) && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 mb-1">Preview:</p>
                      <div className="w-32 h-32 border rounded-md overflow-hidden">
                        <img
                          src={imagePreview || currentCategory.image}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}
                </div>
                <div className="mb-4">
                  <label htmlFor="metaTitle" className="block text-sm font-medium text-gray-700 mb-1">
                    Meta Title (SEO)
                  </label>
                  <input
                    type="text"
                    id="metaTitle"
                    name="metaTitle"
                    value={currentCategory.metaTitle}
                    onChange={handleInputChange}
                    className="w-full text-gray-700 px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter meta title for SEO"
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="metaDescription" className="block text-sm font-medium text-gray-700 mb-1">
                    Meta Description (SEO)
                  </label>
                  <textarea
                    id="metaDescription"
                    name="metaDescription"
                    value={currentCategory.metaDescription}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full text-gray-700 px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter meta description for SEO"
                  />
                </div>
                
                <div className="flex justify-end space-x-3">
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
                    {modalMode === 'add' ? 'Add Category' : 'Update Category'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Categories;