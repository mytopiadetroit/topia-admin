import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { 
  createContentApi, 
  fetchContentCategories,
  toast 
} from '../../service/service';
import Swal from 'sweetalert2';

const CreateContent = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    type: 'blog',
    category: '',
    tags: '',
    videoUrl: '',
    status: 'draft',
    seo: {
      metaTitle: '',
      metaDescription: '',
      metaKeywords: ''
    }
  });
  const [files, setFiles] = useState({
    featuredImage: null,
    videoThumbnail: null,
    featuredVideo: null
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await fetchContentCategories(router);
      if (response.success) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const validateField = (name, value) => {
    const newErrors = { ...errors };
    
    switch (name) {
      case 'title':
        if (!value.trim()) {
          newErrors.title = 'Title is required';
        } else if (value.trim().length < 3) {
          newErrors.title = 'Title must be at least 3 characters long';
        } else {
          delete newErrors.title;
        }
        break;
      case 'description':
        if (!value.trim()) {
          newErrors.description = 'Description is required';
        } else if (value.trim().length < 10) {
          newErrors.description = 'Description must be at least 10 characters long';
        } else {
          delete newErrors.description;
        }
        break;
      case 'content':
        if (!value.trim()) {
          newErrors.content = 'Content is required';
        } else if (value.trim().length < 50) {
          newErrors.content = 'Content must be at least 50 characters long';
        } else {
          delete newErrors.content;
        }
        break;
      case 'category':
        if (!value.trim()) {
          newErrors.category = 'Category is required';
        } else {
          delete newErrors.category;
        }
        break;
      case 'videoUrl':
        if (formData.type === 'video' && !value.trim() && !files.featuredVideo) {
          newErrors.video = 'Video URL or video file is required for video content';
        } else {
          delete newErrors.video;
        }
        break;
      default:
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('seo.')) {
      const seoField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        seo: {
          ...prev.seo,
          [seoField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
      
      // Validate field if it has been touched
      if (touched[name]) {
        validateField(name, value);
      }
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name, value);
  };

  const handleFileChange = (e) => {
    const { name, files: selectedFiles } = e.target;
    if (name === 'featuredVideo') {
      setFiles(prev => ({
        ...prev,
        [name]: selectedFiles[0]
      }));
      // Clear videoUrl when file is selected
      setFormData(prev => ({ ...prev, videoUrl: '' }));
      // Clear video validation error
      const newErrors = { ...errors };
      delete newErrors.video;
      setErrors(newErrors);
    } else {
      setFiles(prev => ({
        ...prev,
        [name]: selectedFiles[0]
      }));
    }
  };

 const validateForm = () => {
    const newErrors = {};
    
    // Validate required fields
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters long';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters long';
    }
    
    if (!formData.content.trim()) {
      newErrors.content = 'Content is required';
    } else if (formData.content.trim().length < 50) {
      newErrors.content = 'Content must be at least 50 characters long';
    }
    
    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    }
    
    // Validate video content
    if (formData.type === 'video') {
      if (!formData.videoUrl.trim() && !files.featuredVideo) {
        newErrors.video = 'Video URL or video file is required for video content';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

 const handleSubmit = async (e) => {
  e.preventDefault();
  
  // Mark all fields as touched
  setTouched({
    title: true,
    description: true,
    content: true,
    category: true,
    videoUrl: true
  });
  
  // Validate form
  if (!validateForm()) {
    Swal.fire({
      title: 'Validation Error!',
      text: 'Please fill in all required fields correctly.',
      icon: 'error',
      confirmButtonColor: '#d33'
    });
    return;
  }
  
  setLoading(true);

  try {
    const submitData = new FormData();
    
    // Add form fields
    Object.keys(formData).forEach(key => {
      if (key === 'seo') {
        submitData.append('seo', JSON.stringify(formData.seo));
      } else {
        submitData.append(key, formData[key]);
      }
    });

    // Add files
    if (files.featuredImage) {
      submitData.append('featuredImage', files.featuredImage);
    }
    if (files.videoThumbnail) {
      submitData.append('videoThumbnail', files.videoThumbnail);
    }
    if (files.featuredVideo) {
      submitData.append('featuredVideo', files.featuredVideo);
    }

    const response = await createContentApi(submitData, router);
    
    if (response.success) {
      Swal.fire({
        title: 'Success!',
        text: 'Content created successfully',
        icon: 'success',
        confirmButtonColor: '#3085d6'
      }).then(() => {
        router.push('/content');
      });
    }
  } catch (error) {
    Swal.fire({
      title: 'Error!',
      text: 'Error creating content',
      icon: 'error',
      confirmButtonColor: '#d33'
    });
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Content</h1>
              <p className="text-gray-600">Add a new blog post or video to your resource center</p>
            </div>
            <button
              onClick={() => router.push('/content')}
              className="text-gray-600 hover:text-gray-900"
            >
              ← Back to Content
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  required
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
                    errors.title ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  placeholder="Enter content title"
                />
                {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type *
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="blog">Blog Post</option>
                  <option value="video">Video</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  required
                  list="categories"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
                    errors.category ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  placeholder="Enter or select category"
                />
                {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
                <datalist id="categories">
                  {categories.map((cat, index) => (
                    <option key={index} value={cat} />
                  ))}
                </datalist>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  required
                  rows={3}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
                    errors.description ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  placeholder="Enter content description"
                />
                {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter tags separated by commas"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Content</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content *
                </label>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  required
                  rows={15}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
                    errors.content ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  placeholder="Enter your content here..."
                />
                {errors.content && <p className="mt-1 text-sm text-red-600">{errors.content}</p>}
              </div>

        {formData.type === 'video' && (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Video (URL or Upload)
    </label>
    
    {/* URL Input */}
    <input
      type="url"
      name="videoUrl"
      value={formData.videoUrl}
      onChange={(e) => {
        handleInputChange(e);
        if (e.target.value) {
          setFiles(prev => ({...prev, featuredVideo: null}));
        }
      }}
      onBlur={handleBlur}
      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent mb-2 ${
        errors.video ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
      }`}
      placeholder="Enter video URL (YouTube, Vimeo, etc.)"
    />
    {errors.video && <p className="mt-1 text-sm text-red-600">{errors.video}</p>}
    
    {/* File Upload */}
    <input
      type="file"
      name="featuredVideo"
      onChange={handleFileChange}
      accept="video/*"
      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    />
    
    <p className="text-xs text-gray-500 mt-1">
      Choose either URL or upload a video file
    </p>
  </div>
)}
            </div>
          </div>

          {/* Media */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Media</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Featured Image
                </label>
                <input
                  type="file"
                  name="featuredImage"
                  onChange={handleFileChange}
                  accept="image/*"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {formData.type === 'video' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Video Thumbnail
                  </label>
                  <input
                    type="file"
                    name="videoThumbnail"
                    onChange={handleFileChange}
                    accept="image/*"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>
          </div>

          {/* SEO */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">SEO Settings</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meta Title
                </label>
                <input
                  type="text"
                  name="seo.metaTitle"
                  value={formData.seo.metaTitle}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter meta title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meta Description
                </label>
                <textarea
                  name="seo.metaDescription"
                  value={formData.seo.metaDescription}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter meta description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meta Keywords
                </label>
                <input
                  type="text"
                  name="seo.metaKeywords"
                  value={formData.seo.metaKeywords}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter keywords separated by commas"
                />
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.push('/content')}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Content'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateContent;
