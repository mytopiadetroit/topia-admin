import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Sidebar from '@/components/sidebar';
import { 
  fetchAllGalleryImages, 
  uploadGalleryImage,
  updateGalleryImage,
  deleteGalleryImage,
  toggleGalleryImageStatus,
  toast 
} from '../service/service';
import Swal from 'sweetalert2';

const GalleryManagement = () => {
  const router = useRouter();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingImage, setEditingImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    order: 0,
    imageFile: null
  });

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    try {
      setLoading(true);
      const response = await fetchAllGalleryImages(router);
      if (response.success) {
        setImages(response.data);
      }
    } catch (error) {
      toast.error('Error loading gallery images');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (image = null) => {
    if (image) {
      setEditingImage(image);
      setFormData({
        title: image.title,
        description: image.description || '',
        order: image.order || 0,
        imageFile: null
      });
      setPreviewUrl(image.imageUrl.startsWith('http') ? image.imageUrl : `http://localhost:5000${image.imageUrl}`);
    } else {
      setEditingImage(null);
      setFormData({
        title: '',
        description: '',
        order: 0,
        imageFile: null
      });
      setPreviewUrl('');
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingImage(null);
    setFormData({
      title: '',
      description: '',
      order: 0,
      imageFile: null
    });
    setPreviewUrl('');
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, imageFile: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (!editingImage && !formData.imageFile) {
      toast.error('Please select an image');
      return;
    }

    try {
      setLoading(true);
      const data = new FormData();
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('order', formData.order);
      if (formData.imageFile) {
        data.append('image', formData.imageFile);
      }

      let response;
      if (editingImage) {
        response = await updateGalleryImage(editingImage._id, data, router);
      } else {
        response = await uploadGalleryImage(data, router);
      }

      if (response.success) {
        Swal.fire({
          title: 'Success!',
          text: `Image ${editingImage ? 'updated' : 'uploaded'} successfully.`,
          icon: 'success',
          confirmButtonColor: '#10B981'
        });
        handleCloseModal();
        loadImages();
      } else {
        toast.error(response.message || 'Failed to save image');
      }
    } catch (error) {
      console.error('Error saving image:', error);
      toast.error(error.message || 'An error occurred while saving the image');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (image) => {
    try {
      const response = await toggleGalleryImageStatus(image._id, router);
      if (response.success) {
        toast.success(response.message);
        loadImages();
      } else {
        toast.error(response.message || 'Failed to toggle status');
      }
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('An error occurred while toggling status');
    }
  };

  const handleDelete = async (image) => {
    const result = await Swal.fire({
      title: 'Delete Image?',
      text: `Are you sure you want to delete "${image.title}"? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      const response = await deleteGalleryImage(image._id, router);
      if (response.success) {
        Swal.fire({
          title: 'Deleted!',
          text: 'Image has been deleted successfully.',
          icon: 'success',
          confirmButtonColor: '#10B981'
        });
        loadImages();
      } else {
        toast.error(response.message || 'Failed to delete image');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('An error occurred while deleting the image');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 lg:ml-64 w-full">
        <div className="p-6 w-full">
          {/* Header */}
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Gallery Management</h1>
              <p className="text-gray-600">Upload and manage visual guide images</p>
            </div>
            <button
              onClick={() => handleOpenModal()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              + Upload Image
            </button>
          </div>

          {/* Gallery Grid */}
          <div className="w-full bg-white rounded-lg shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading gallery...</p>
              </div>
            ) : images.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500 mb-4">No images found in gallery</p>
                <button
                  onClick={() => handleOpenModal()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Upload First Image
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
                {images.map((image) => (
                  <div key={image._id} className="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="relative aspect-video bg-gray-100">
                      <img
                        src={image.imageUrl.startsWith('http') ? image.imageUrl : `http://localhost:5000${image.imageUrl}`}
                        alt={image.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          image.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {image.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-1">{image.title}</h3>
                      {image.description && (
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{image.description}</p>
                      )}
                      <div className="text-xs text-gray-500 mb-3">Order: {image.order}</div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleToggleStatus(image)}
                          className={`flex-1 px-3 py-1.5 text-sm rounded ${
                            image.isActive 
                              ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' 
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {image.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleOpenModal(image)}
                          className="flex-1 px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(image)}
                          className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
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
        </div>
      </div>

      {/* Upload/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                {editingImage ? 'Edit Gallery Image' : 'Upload New Image'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Image Preview */}
              {previewUrl && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preview
                  </label>
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-64 object-cover rounded-lg border"
                  />
                </div>
              )}

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {editingImage ? 'Change Image (optional)' : 'Select Image *'}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required={!editingImage}
                />
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Mushroom Growing Process"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional description"
                />
              </div>

              {/* Order */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Order
                </label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
                <p className="text-xs text-gray-500 mt-1">Lower numbers appear first in carousel</p>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : editingImage ? 'Update Image' : 'Upload Image'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GalleryManagement;
