import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { 
  fetchContentById,
  updateContentApi, 
  fetchContentCategories,
  toast 
} from '../../../service/service';
import Swal from 'sweetalert2';

const JoditEditor = dynamic(() => import('jodit-react'), { ssr: false });

const EditContent = () => {
  const router = useRouter();
  const { id } = router.query;
  const editor = useRef(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
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
  const [existingImages, setExistingImages] = useState({
    featuredImage: '',
    videoThumbnail: ''
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const config = useMemo(
    () => ({
      readonly: false,
      placeholder: 'Start typing your content...',
      height: 500,
      toolbar: true,
      spellcheck: true,
      language: 'en',
      toolbarButtonSize: 'medium',
      toolbarAdaptive: false,
      showCharsCounter: true,
      showWordsCounter: true,
      showXPathInStatusbar: false,
      askBeforePasteHTML: false,
      askBeforePasteFromWord: false,
      buttons: [
        'source', '|',
        'bold', 'italic', 'underline', 'strikethrough', '|',
        'ul', 'ol', '|',
        'outdent', 'indent', '|',
        'font', 'fontsize', 'brush', 'paragraph', '|',
        'image', 'video', 'table', 'link', '|',
        'align', 'undo', 'redo', '|',
        'hr', 'eraser', 'copyformat', '|',
        'symbol', 'fullsize', 'print', 'about'
      ],
      uploader: {
        insertImageAsBase64URI: true
      },
      removeButtons: [],
      disablePlugins: [],
      events: {},
      textIcons: false,
    }),
    []
  );

  useEffect(() => {
    if (id) {
      loadContent();
      loadCategories();
    }
  }, [id]);

  const loadContent = async () => {
    try {
      setInitialLoading(true);
      const response = await fetchContentById(id, router);
      if (response.success) {
        const content = response.data;
        setFormData({
          title: content.title || '',
          description: content.description || '',
          content: content.content || '',
          type: content.type || 'blog',
          category: content.category || '',
          tags: content.tags ? content.tags.join(', ') : '',
          videoUrl: content.videoUrl || '',
          status: content.status || 'draft',
          seo: {
            metaTitle: content.seo?.metaTitle || '',
            metaDescription: content.seo?.metaDescription || '',
            metaKeywords: content.seo?.metaKeywords ? content.seo.metaKeywords.join(', ') : ''
          }
        });
        setExistingImages({
          featuredImage: content.featuredImage || '',
          videoThumbnail: content.videoThumbnail || ''
        });
      }
    } catch (error) {
      toast.error('Error loading content');
    } finally {
      setInitialLoading(false);
    }
  };

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

    // Add files only if new ones are selected
    if (files.featuredImage) {
      submitData.append('featuredImage', files.featuredImage);
    }
    if (files.videoThumbnail) {
      submitData.append('videoThumbnail', files.videoThumbnail);
    }
    if (files.featuredVideo) {
      submitData.append('featuredVideo', files.featuredVideo);
    }

    const response = await updateContentApi(id, submitData, router);
    
    if (response.success) {
      Swal.fire({
        title: 'Success!',
        text: 'Content updated successfully',
        icon: 'success',
        confirmButtonColor: '#3085d6'
      }).then(() => {
        router.push('/content');
      });
    }
  } catch (error) {
    Swal.fire({
      title: 'Error!',
      text: 'Error updating content',
      icon: 'error',
      confirmButtonColor: '#d33'
    });
  } finally {
    setLoading(false);
  }
};
  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading content...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Content</h1>
              <p className="text-gray-600">Update your blog post or video content</p>
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
                <div className={`border rounded-lg ${
                  errors.content ? 'border-red-500' : 'border-gray-300'
                }`}>
                  <JoditEditor
                    ref={editor}
                    value={formData.content}
                    config={config}
                    tabIndex={1}
                    onBlur={(newContent) => {
                      setFormData(prev => ({ ...prev, content: newContent }));
                      setTouched(prev => ({ ...prev, content: true }));
                      validateField('content', newContent);
                    }}
                  />
                </div>
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
                {existingImages.featuredImage && (
                  <div className="mb-2">
                    <img
                      src={`http://localhost:5000${existingImages.featuredImage}`}
                      alt="Current featured image"
                      className="h-20 w-20 object-cover rounded"
                    />
                    <p className="text-xs text-gray-500 mt-1">Current image</p>
                  </div>
                )}
                <input
                  type="file"
                  name="featuredImage"
                  onChange={handleFileChange}
                  accept="image/*"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Upload new image to replace current one</p>
              </div>

              {formData.type === 'video' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Video Thumbnail
                  </label>
                  {existingImages.videoThumbnail && (
                    <div className="mb-2">
                      <img
                        src={`http://localhost:5000${existingImages.videoThumbnail}`}
                        alt="Current video thumbnail"
                        className="h-20 w-20 object-cover rounded"
                      />
                      <p className="text-xs text-gray-500 mt-1">Current thumbnail</p>
                    </div>
                  )}
                  <input
                    type="file"
                    name="videoThumbnail"
                    onChange={handleFileChange}
                    accept="image/*"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Upload new thumbnail to replace current one</p>
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
                {loading ? 'Updating...' : 'Update Content'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditContent;
