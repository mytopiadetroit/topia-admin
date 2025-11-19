import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { Api, fetchProductsByCategory, fetchAllCategories, createProduct, deleteProduct, updateProductApi, toast, fetchAllReviewTags } from '../../service/service';
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
  ArrowLeft,
  GripVertical
} from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// SortableItem component for drag and drop
function SortableItem({ id, children }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : 'auto',
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={isDragging ? 'bg-gray-100' : ''}
    >
      {React.Children.map(children, (child, index) => {
        if (index === 0) {
          return React.cloneElement(child, {
            children: (
              <div className="flex items-center">
                <button
                  {...attributes}
                  {...listeners}
                  className="p-1 mr-2 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
                >
                  <GripVertical className="h-4 w-4" />
                </button>
                {child.props.children}
              </div>
            )
          });
        }
        return child;
      })}
    </tr>
  );
}

export default function ProductsByCategory() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [productModalLoading, setProductModalLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });

  // Set up sensors for DnD
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end event
  const handleDragEnd = async (event) => {
    const { active, over } = event;
    console.log('Drag end - Active:', active.id, 'Over:', over?.id);

    if (!over || active.id === over.id) {
      console.log('No position change or invalid drop target');
      return;
    }

    // Create a copy of current products to avoid state batching issues
    const currentProducts = [...products];
    const oldIndex = currentProducts.findIndex(item => item._id === active.id);
    const newIndex = currentProducts.findIndex(item => item._id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      console.error('Could not find items in the array');
      return;
    }

    console.log('Moving item from index', oldIndex, 'to', newIndex);

    // Create new array with updated order
    const newItems = arrayMove(currentProducts, oldIndex, newIndex).map((item, index) => ({
      ...item,
      order: index
    }));

    // Update local state immediately for better UX
    setProducts(newItems);

    // Update order in the database
    try {
      await updateProductOrderInDatabase(newItems);
      // Refresh products to ensure we have the latest data
      await loadProducts();
    } catch (error) {
      console.error('Error updating product order:', error);
      // If there's an error, revert to the previous state
      await loadProducts();
    }
  };

  // Update product order in the database
  const updateProductOrderInDatabase = async (reorderedProducts) => {
    try {
      console.log('=== UPDATING PRODUCT ORDER ===');
      console.log('Products to update:', reorderedProducts.map((p, index) => ({
        id: p._id,
        name: p.name,
        newOrder: index,
        oldOrder: p.order
      })));

      // Only update products that actually changed position
      const updates = reorderedProducts
        .map((product, index) => ({
          ...product,
          newOrder: index
        }))
        .filter((product, index) => {
          const originalProduct = products.find(p => p._id === product._id);
          const shouldUpdate = !originalProduct || originalProduct.order !== index;
          console.log(`Product ${product._id} (${product.name}):`, {
            oldOrder: originalProduct?.order,
            newOrder: index,
            shouldUpdate
          });
          return shouldUpdate;
        })
        .map((product) => {
          console.log(`Will update product ${product._id} (${product.name}) to order ${product.newOrder}`);

          // Create a clean request body with just the order
          const requestBody = { order: product.newOrder };
          console.log('Request body:', JSON.stringify(requestBody));

          return Api('put', `products/${product._id}/order`, requestBody, router, {
            headers: {
              'Content-Type': 'application/json',
            },
          })
            .then(res => {
              console.log(`Order update success for ${product._id}:`, res);
              return res;
            })
            .catch(err => {
              console.error(`Error updating order for ${product._id}:`, {
                message: err.message,
                response: err.response?.data,
                status: err.response?.status,
                config: {
                  url: err.config?.url,
                  method: err.config?.method,
                  data: err.config?.data,
                  headers: err.config?.headers,
                },
              });
              throw err;
            });
        });

      if (updates.length === 0) {
        console.log('No order changes detected, skipping update');
        return [];
      }

      console.log(`Sending ${updates.length} order updates to the server...`);
      const results = await Promise.all(updates);
      console.log('All order updates completed successfully');

      // Refresh the products list to ensure we have the latest data
      await loadProducts();

      toast.success('Product order updated successfully');
      return results;
    } catch (error) {
      console.error('Error in updateProductOrderInDatabase:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error; // Re-throw to be handled by the caller
    }
  };

  // Toggle reorder mode
  const toggleReorderMode = () => {
    setIsReordering(!isReordering);
  };
  const [form, setForm] = useState({
    name: '',
    price: '',
    stock: '',
    descriptionMain: '',
    descriptionDetails: '',
    primaryUse: 'therapeutic',
    hasStock: true,
    images: [],
    reviewTagIds: [],
    imageAltName: '',
    metaTitle: '',
    metaDescription: '',
    hasVariants: false,
    variants: [],
    flavors: []
  });
  const [errors, setErrors] = useState({});
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
    reviewTagIds: [],
    hasVariants: false,
    variants: [],
    flavors: []
  });
  const [editErrors, setEditErrors] = useState({});
  const [editKeepImages, setEditKeepImages] = useState([]);
  const [category, setCategory] = useState(null);
  const [availableTags, setAvailableTags] = useState([]);
  const fileInputRef = useRef(null);
  const router = useRouter();
  const { categoryId } = router.query;

  useEffect(() => {
    if (categoryId) {
      loadProducts(1);
      loadCategoryInfo();
      loadReviewTags();
    }
  }, [categoryId]);

  //   const paginate = (pageNumber) => {
  //   fetchCategories(pageNumber, pagination.itemsPerPage, searchTerm);
  // };

  const goToPrevPage = () => {
    if (pagination.currentPage > 1) {
      loadProducts(pagination.currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (pagination.currentPage < pagination.totalPages) {
      loadProducts(pagination.currentPage + 1);
    }
  };

  const loadProducts = async (page) => {
    try {
      setLoading(true);
      const response = await fetchProductsByCategory(categoryId, router, page, pagination.itemsPerPage);
      if (response.success) {
        console.log(response)
        setProducts(response.data || []);
        setPagination({
          ...pagination,
          currentPage: response?.page || 1,
          totalPages: response?.totalPages || 1,
          totalItems: response?.total || 0,
          // itemsPerPage: response?.count || 10
        })
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
      short_description: product.short_description || '',
      descriptionMain: product.description?.main || '',
      descriptionDetails: product.description?.details || '',
      primaryUse: product.primaryUse || 'therapeutic',
      hasStock: !!product.hasStock,
      imagesNew: [],
      imageAltName: product.imageAltName || '',
      metaTitle: product.metaTitle || '',
      metaDescription: product.metaDescription || '',
      reviewTagIds: (product.reviewTags || []).map(t => t._id),
      hasVariants: product.hasVariants || false,
      variants: product.variants || [],
      flavors: product.flavors || []
    });
    setEditKeepImages([...(product.images || [])]);
    setShowEditModal(true);
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    // Clear error when user starts typing
    if (editErrors[name]) {
      setEditErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleEditFileChange = (e) => {
    setEditForm(prev => ({ ...prev, imagesNew: Array.from(e.target.files || []) }));
  };

  const toggleKeepImage = (img) => {
    setEditKeepImages(prev => {
      // If image is already in the array, remove it (unchecked)
      if (prev.includes(img)) {
        return prev.filter(i => i !== img);
      }
      // If image is not in the array, add it (checked)
      return [...prev, img];
    });
  };

  const validateEditForm = (formData) => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Product name is required';
    }
    if (formData.price && formData.price < 0) {
      errors.price = 'Price cannot be negative';
    }
    if (formData.stock !== undefined && formData.stock !== '' && formData.stock < 0) {
      errors.stock = 'Stock quantity cannot be negative';
    }
    if (!formData.descriptionMain.trim()) {
      errors.descriptionMain = 'Main description is required';
    }
    if (!formData.descriptionDetails.trim()) {
      errors.descriptionDetails = 'Detailed description is required';
    }
    if (!formData.primaryUse) {
      errors.primaryUse = 'Primary use is required';
    }
    // Check if there are either new images or at least one kept image
    const hasNewImages = formData.imagesNew && formData.imagesNew.length > 0;
    const hasKeptImages = editKeepImages && editKeepImages.length > 0;

    if (!hasNewImages && !hasKeptImages) {
      errors.images = 'At least one product image is required';
    }
    if (!formData.imageAltName || !formData.imageAltName.trim()) {
      errors.imageAltName = 'Image alt name is required for SEO';
    }
    if (!formData.metaTitle || !formData.metaTitle.trim()) {
      errors.metaTitle = 'Meta title is required for SEO';
    }
    if (!formData.metaDescription || !formData.metaDescription.trim()) {
      errors.metaDescription = 'Meta description is required for SEO';
    }

    return errors;
  };

  const submitEditProduct = async (e) => {
    e.preventDefault();

    const formErrors = validateEditForm(editForm);
    if (Object.keys(formErrors).length > 0) {
      setEditErrors(formErrors);

      // Scroll to the first error field
      const firstErrorField = Object.keys(formErrors)[0];
      if (firstErrorField) {
        const element = document.querySelector(`[name="${firstErrorField}"]`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.focus({ preventScroll: true });
        }
      }

      toast.error(
        <div>
          <div className="font-bold mb-2">Please fix the following errors:</div>
          <ul className="list-disc pl-5">
            {Object.values(formErrors).map((error, index) => (
              <li key={index} className="text-sm">• {error}</li>
            ))}
          </ul>
        </div>,
        {
          position: "top-right",
          autoClose: 5000,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        }
      );
      return;
    }

    try {
      setEditSaving(true);
      const fd = new FormData();
      fd.append('name', editForm.name);
      fd.append('price', String(editForm.price));

      fd.append('primaryUse', editForm.primaryUse);
      // Calculate hasStock based on variants if they exist
      let finalHasStock = editForm.hasStock;
      if (editForm.hasVariants && editForm.variants && editForm.variants.length > 0) {
        // If variants exist, hasStock should be true if any variant has stock > 0
        const total = editForm.variants.reduce((sum, item) => sum + Number(item.stock || 0), 0);
        editForm.stock = total || 0
        const hasVariantStock = total > 0;
        finalHasStock = hasVariantStock;
        console.log('Calculated edit hasStock from variants:', finalHasStock, 'variants:', editForm.variants.map(v => ({ stock: v.stock })));
      }
      fd.append('stock', String(editForm.stock || 0));
      console.log('Submitting edit hasStock value:', finalHasStock, 'as string:', String(finalHasStock));
      fd.append('hasStock', String(finalHasStock));
      fd.append('category', categoryId);
      fd.append('description', JSON.stringify({ main: editForm.descriptionMain, details: editForm.descriptionDetails }));
      fd.append('existingImages', JSON.stringify(editKeepImages));
      (editForm.imagesNew || []).forEach((file) => fd.append('images', file));
      fd.append('imageAltName', editForm.imageAltName || '');
      fd.append('metaTitle', editForm.metaTitle || '');
      fd.append('metaDescription', editForm.metaDescription || '');
      fd.append('reviewTags', JSON.stringify(editForm.reviewTagIds || []));
      fd.append('hasVariants', String(editForm.hasVariants));
      fd.append('variants', JSON.stringify(editForm.variants || []));
      fd.append('flavors', JSON.stringify(editForm.flavors || []));
      fd.append('short_description', editForm.short_description || '');

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
      stock: '0',
      intensity: '5', // Default to medium intensity
      descriptionMain: '',
      descriptionDetails: '',
      primaryUse: 'therapeutic',
      hasStock: true,
      images: [],
      imageAltName: '',
      metaTitle: '',
      metaDescription: '',
      reviewTagIds: [],
      hasVariants: false,
      variants: [],
      flavors: [],
      short_description: '',
    });
    setShowAddModal(true);
  };

  const handleFileChange = (e) => {
    setForm(prev => ({ ...prev, images: Array.from(e.target.files || []) }));
  };


  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  // Flavor management for Add/Edit form
  const addFlavor = () => {
    setForm(prev => ({
      ...prev,
      flavors: [...prev.flavors, {
        name: '',
        price: '',
        stock: 0,
        sku: '',
        isActive: true
      }]
    }));
  };

  const removeFlavor = (index) => {
    setForm(prev => ({
      ...prev,
      flavors: prev.flavors.filter((_, i) => i !== index)
    }));
  };

  const updateFlavor = (index, field, value) => {
    setForm(prev => ({
      ...prev,
      flavors: prev.flavors.map((f, i) => {
        if (i !== index) return f;
        // Handle nested fields if needed
        if (field.includes('.')) {
          const [parent, child] = field.split('.');
          return {
            ...f,
            [parent]: {
              ...f[parent],
              [child]: value
            }
          };
        }
        return { ...f, [field]: value };
      })
    }));
  };

  // Variant management for Add form
  const addVariant = () => {
    setForm(prev => ({
      ...prev,
      variants: [...prev.variants, { size: { value: '', unit: 'grams' }, price: '', stock: 0, sku: '' }]
    }));
  };

  const removeVariant = (index) => {
    setForm(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index)
    }));
  };

  const updateVariant = (index, field, value) => {
    setForm(prev => ({
      ...prev,
      variants: prev.variants.map((v, i) => {
        if (i !== index) return v;
        if (field === 'sizeValue') {
          return { ...v, size: { ...v.size, value } };
        } else if (field === 'sizeUnit') {
          return { ...v, size: { ...v.size, unit: value } };
        }
        return { ...v, [field]: value };
      })
    }));
  };

  // Variant management for Edit form
  const addEditVariant = () => {
    setEditForm(prev => ({
      ...prev,
      variants: [...prev.variants, { size: { value: '', unit: 'grams' }, price: '', stock: 0, sku: '' }]
    }));
  };

  const removeEditVariant = (index) => {
    setEditForm(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index)
    }));
  };

  const updateEditVariant = (index, field, value) => {
    setEditForm(prev => ({
      ...prev,
      variants: prev.variants.map((v, i) => {
        if (i !== index) return v;
        if (field === 'sizeValue') {
          return { ...v, size: { ...v.size, value } };
        } else if (field === 'sizeUnit') {
          return { ...v, size: { ...v.size, unit: value } };
        }
        return { ...v, [field]: value };
      })
    }));
  };

  // Flavor management for Edit form
  const addEditFlavor = () => {
    setEditForm(prev => ({
      ...prev,
      flavors: [...prev.flavors, { name: '', price: '' }]
    }));
  };

  const removeEditFlavor = (index) => {
    setEditForm(prev => ({
      ...prev,
      flavors: prev.flavors.filter((_, i) => i !== index)
    }));
  };

  const updateEditFlavor = (index, field, value) => {
    setEditForm(prev => ({
      ...prev,
      flavors: prev.flavors.map((f, i) => i === index ? { ...f, [field]: value } : f)
    }));
  };

  const submitAddProduct = async (e) => {
    e.preventDefault();

    // Check all validations first and collect error messages
    const errorMessages = [];
    const fieldErrors = {};

    if (!form.name.trim()) {
      errorMessages.push('• Product name is required');
      fieldErrors.name = 'Product name is required';
    }
    if (form.price !== undefined && form.price !== '' && form.price < 0) {
      errorMessages.push('• Price cannot be negative');
      fieldErrors.price = 'Price cannot be negative';
    }
    if (form.stock !== undefined && form.stock !== '' && form.stock < 0) {
      errorMessages.push('• Stock quantity cannot be negative');
      fieldErrors.stock = 'Stock quantity cannot be negative';
    }
    if (!form.intensity || form.intensity < 1 || form.intensity > 10) {
      errorMessages.push('• Intensity must be between 1 and 10');
      fieldErrors.intensity = 'Intensity must be between 1 and 10';
    }
    if (!form.descriptionMain.trim()) {
      errorMessages.push('• Main description is required');
      fieldErrors.descriptionMain = 'Main description is required';
    }
    if (!form.descriptionDetails.trim()) {
      errorMessages.push('• Detailed description is required');
      fieldErrors.descriptionDetails = 'Detailed description is required';
    }
    if (!form.primaryUse) {
      errorMessages.push('• Primary use is required');
      fieldErrors.primaryUse = 'Primary use is required';
    }
    if (!form.images || form.images.length === 0) {
      errorMessages.push('• At least one product image is required');
      fieldErrors.images = 'At least one image is required';
    }
    if (!form.imageAltName || !form.imageAltName.trim()) {
      errorMessages.push('• Image alt name is required for SEO');
      fieldErrors.imageAltName = 'Image alt name is required';
    }
    if (!form.metaTitle || !form.metaTitle.trim()) {
      errorMessages.push('• Meta title is required for SEO');
      fieldErrors.metaTitle = 'Meta title is required';
    }
    if (!form.metaDescription || !form.metaDescription.trim()) {
      errorMessages.push('• Meta description is required for SEO');
      fieldErrors.metaDescription = 'Meta description is required';
    }

    // If there are validation errors, show them in a single toast
    if (errorMessages.length > 0) {
      setErrors(fieldErrors);

      // Scroll to the first error field
      const firstErrorField = Object.keys(fieldErrors)[0];
      if (firstErrorField) {
        const element = document.querySelector(`[name="${firstErrorField}"]`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.focus({ preventScroll: true });
        }
      }

      toast.error(
        <div>
          <div className="font-bold mb-2">Please fix the following errors:</div>
          <ul className="list-disc pl-5">
            {errorMessages.map((error, index) => (
              <li key={index} className="text-sm">{error}</li>
            ))}
          </ul>
        </div>,
        {
          position: "top-right",
          autoClose: 5000,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        }
      );
      return;
    }

    if (!categoryId) {
      toast.error('Category ID is missing');
      return;
    }
    try {
      setSaving(true);
      const fd = new FormData();
      fd.append('name', form.name);
      if (form.price !== '' && form.price !== null && form.price !== undefined) {
        fd.append('price', String(form.price));
      }
      if (form.stock !== '' && form.stock !== null && form.stock !== undefined) {
        fd.append('stock', String(form.stock));
      }
      fd.append('primaryUse', form.primaryUse);
      // Calculate hasStock based on variants if they exist
      let finalHasStock = form.hasStock;
      if (form.hasVariants && form.variants && form.variants.length > 0) {
        // If variants exist, hasStock should be true if any variant has stock > 0
        const hasVariantStock = form.variants.some(variant => Number(variant.stock || 0) > 0);
        finalHasStock = hasVariantStock;
        console.log('Calculated hasStock from variants:', finalHasStock, 'variants:', form.variants.map(v => ({ stock: v.stock })));
      }
      console.log('Submitting hasStock value:', finalHasStock, 'as string:', String(finalHasStock));
      fd.append('hasStock', String(finalHasStock));
      fd.append('category', categoryId);
      fd.append('description', JSON.stringify({
        main: form.descriptionMain,
        details: form.descriptionDetails
      }));
      form.images.forEach((file) => fd.append('images', file));
      fd.append('imageAltName', form.imageAltName || '');
      fd.append('metaTitle', form.metaTitle || '');
      fd.append('metaDescription', form.metaDescription || '');
      fd.append('intensity', form.intensity || '5');
      fd.append('reviewTags', JSON.stringify(form.reviewTagIds || []));
      fd.append('hasVariants', String(form.hasVariants));
      fd.append('variants', JSON.stringify(form.variants || []));
      fd.append('flavors', JSON.stringify(form.flavors || []));
      fd.append('short_description', form.short_description || '');
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

        // Reset form after successful submission
        setForm({
          name: '',
          price: '',
          stock: '0',
          intensity: '5',
          descriptionMain: '',
          descriptionDetails: '',
          primaryUse: 'therapeutic',
          hasStock: true,
          images: [],
          imageAltName: '',
          metaTitle: '',
          metaDescription: '',
          reviewTagIds: [],
          hasVariants: false,
          variants: [],
          flavors: [],
          short_description: ''
        });
        setErrors({});
      } else {
        throw new Error(res?.message || 'Failed to create product');
      }
    } catch (error) {
      console.error('Error creating product:', error);
      Swal.fire({
        title: 'Error!',
        text: error.message || 'Failed to create product. Please try again.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
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
              {/* <button 
                onClick={toggleReorderMode} 
                className={`flex items-center px-4 py-2 rounded-lg ${isReordering ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                {isReordering ? (
                  <>
                    <X className="h-4 w-4 mr-2" />
                    Done Reordering
                  </>
                ) : (
                  <>
                    <GripVertical className="h-4 w-4 mr-2" />
                    Reorder Products
                  </>
                )}
              </button> */}
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
                <input type="text" required placeholder="Search products..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
            </div>
            <div className="text-sm text-gray-500">{filteredProducts.length} of {products.length} products</div>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={filteredProducts.map(p => p._id)}
                strategy={verticalListSortingStrategy}
              >
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
                        <SortableItem key={product._id} id={product._id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {isReordering && (
                                <button
                                  {...attributes}
                                  {...listeners}
                                  className="p-1 mr-2 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
                                >
                                  <GripVertical className="h-4 w-4" />
                                </button>
                              )}
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
                            {product.hasVariants && product.variants && product.variants.length > 0 ? (
                              <div>
                                <div className="text-sm font-semibold text-gray-900">
                                  {formatPrice(Math.min(...product.variants.map(v => v.price)))} - {formatPrice(Math.max(...product.variants.map(v => v.price)))}
                                </div>
                                <div className="text-xs text-gray-500">{product.variants.length} variants</div>
                              </div>
                            ) : (
                              <div className="text-sm font-semibold text-gray-900">{formatPrice(product.price)}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {product.hasVariants && product.variants && product.variants.length > 0 ? (
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                Total: {product.variants.reduce((sum, v) => sum + (v.stock || 0), 0)} units
                              </span>
                            ) : (
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${product.hasStock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {product.hasStock ? `In Stock (${product.stock ?? 0})` : 'Out of Stock'}
                              </span>
                            )}
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
                        </SortableItem>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </div>

        {/* Pagination */}
        {!loading && filteredProducts.length > 0 && (
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
                    onClick={() => loadProducts(pageNum)}
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
                        {!selectedProduct.hasVariants && (
                          <p className="text-2xl font-bold text-blue-600">{formatPrice(selectedProduct.price)}</p>
                        )}
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

                        {/* Show variants if available */}
                        {selectedProduct.hasVariants && selectedProduct.variants && selectedProduct.variants.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Size Variants</h4>
                            <div className="space-y-2">
                              {selectedProduct.variants.map((variant, idx) => (
                                <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="text-sm font-semibold text-gray-900">
                                        {variant.size?.value} {variant.size?.unit}
                                      </p>
                                      <p className="text-xs text-gray-600 mt-0.5">
                                        {variant.sku && `SKU: ${variant.sku} • `}Stock: {variant.stock || 0}
                                      </p>
                                    </div>
                                    <p className="text-lg font-bold text-blue-600">{formatPrice(variant.price)}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Show flavors if available */}
                        {selectedProduct.flavors && selectedProduct.flavors.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Available Flavors</h4>
                            <div className="space-y-2">
                              {selectedProduct.flavors.map((flavor, idx) => (
                                <div key={idx} className="bg-green-50 border border-green-200 rounded-lg p-3">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-semibold text-gray-900">{flavor.name}</span>
                                    <span className="text-lg font-bold text-green-600">{formatPrice(flavor.price)}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Show stock status only for non-variant products */}
                        {!selectedProduct.hasVariants && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-700">Stock Status</h4>
                            <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full mt-1 ${selectedProduct.hasStock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {selectedProduct.hasStock ? `In Stock (${selectedProduct.stock ?? 0})` : 'Out of Stock'}
                            </span>
                          </div>
                        )}
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

                {/* Name */}
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Product Name</label>
                  <input name="name" value={form.name} onChange={handleChange} required className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700" />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-1">Short Description</label>
                  <input name="short_description" value={form.short_description} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700" />
                </div>

                {/* Use Variants Toggle */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-1">Enable Size Variants</label>
                      <p className="text-xs text-gray-600">Enable this to add different sizes (grams, kg, etc.) with individual pricing</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={form.hasVariants}
                      onChange={(e) => {
                        const hasVariants = e.target.checked;
                        setForm(prev => ({
                          ...prev,
                          hasVariants,
                          // When enabling variants, ensure hasStock is true by default
                          hasStock: hasVariants ? true : prev.hasStock
                        }));
                      }}
                      className="h-5 w-5 text-blue-600 border-gray-300 rounded"
                    />
                  </div>
                </div>

                {/* If variants are disabled, show regular price/stock */}
                {!form.hasVariants && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Price</label>
                      <input type="number" name="price" value={form.price} onChange={handleChange} required min="0" step="0.01" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Stock Quantity</label>
                      <input type="number" required min="0" name="stock" value={form.stock} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700" />
                    </div>
                  </div>
                )}

                {/* Variants Section */}
                {form.hasVariants && (
                  <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-gray-900">Product Variants</h3>
                      <button
                        type="button"
                        onClick={addVariant}
                        className="flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Variant
                      </button>
                    </div>

                    {form.variants.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">No variants added yet. Click "Add Variant" to create one.</p>
                    )}

                    <div className="space-y-3">
                      {form.variants.map((variant, index) => (
                        <div key={index} className="bg-white border border-gray-200 rounded-lg p-3">
                          <div className="flex items-start justify-between mb-3">
                            <span className="text-xs font-semibold text-gray-600">Variant #{index + 1}</span>
                            <button
                              type="button"
                              onClick={() => removeVariant(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs text-gray-700 mb-1">Size (Value)</label>
                              <input
                                type="number"
                                value={variant.size?.value || ''}
                                onChange={(e) => updateVariant(index, 'sizeValue', e.target.value)}
                                placeholder="e.g., 250"
                                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-700 mb-1">Unit</label>
                              <select
                                value={variant.size?.unit || 'grams'}
                                onChange={(e) => updateVariant(index, 'sizeUnit', e.target.value)}
                                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="grams">Grams</option>
                                <option value="kg">Kg</option>
                                <option value="ml">ML</option>
                                <option value="liters">Liters</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-700 mb-1">Price</label>
                              <input
                                type="number"
                                value={variant.price || ''}
                                onChange={(e) => updateVariant(index, 'price', e.target.value)}
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
                                required
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                            <div>
                              <label className="block text-xs text-gray-700 mb-1">Stock</label>
                              <input
                                type="number"
                                value={variant.stock || 0}
                                onChange={(e) => updateVariant(index, 'stock', e.target.value)}
                                placeholder="0"
                                min="0"
                                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-700 mb-1">SKU (Optional)</label>
                              <input
                                type="text"
                                value={variant.sku || ''}
                                onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                                placeholder="e.g., CHOC-250G"
                                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Flavors Section (Optional) */}
                <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">Available Flavors (Optional)</h3>
                      <p className="text-xs text-gray-600 mt-1">Add flavors available for this product</p>
                    </div>
                    <button
                      type="button"
                      onClick={addFlavor}
                      className="flex items-center px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Flavor
                    </button>
                  </div>

                  {form.flavors.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">No flavors added. Flavors are optional.</p>
                  )}

                  <div className="space-y-2">
                    {form.flavors.map((flavor, index) => (
                      <div key={index} className="bg-white border border-gray-200 rounded-lg p-3">
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-xs font-semibold text-gray-600">Flavor #{index + 1}</span>
                          <button
                            type="button"
                            onClick={() => removeFlavor(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-700 mb-1">Flavor Name</label>
                            <input
                              type="text"
                              value={flavor.name || ''}
                              onChange={(e) => updateFlavor(index, 'name', e.target.value)}
                              placeholder="e.g., Chocolate, Vanilla"
                              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-700 mb-1">Price</label>
                            <input
                              type="number"
                              value={flavor.price || ''}
                              onChange={(e) => updateFlavor(index, 'price', e.target.value)}
                              placeholder="0.00"
                              min="0"
                              step="0.01"
                              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                              required
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                          <div>
                            <label className="block text-xs text-gray-700 mb-1">Stock</label>
                            <input
                              type="number"
                              value={flavor.stock || 0}
                              onChange={(e) => updateFlavor(index, 'stock', parseInt(e.target.value) || 0)}
                              placeholder="0"
                              min="0"
                              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-700 mb-1">SKU (Optional)</label>
                            <input
                              type="text"
                              value={flavor.sku || ''}
                              onChange={(e) => updateFlavor(index, 'sku', e.target.value)}
                              placeholder="e.g., CHOC-250G"
                              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                        <div className="flex items-center mt-2">
                          <input
                            type="checkbox"
                            id={`flavor-active-${index}`}
                            checked={flavor.isActive !== false}
                            onChange={(e) => updateFlavor(index, 'isActive', e.target.checked)}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <label htmlFor={`flavor-active-${index}`} className="ml-2 block text-xs text-gray-700">
                            Active
                          </label>
                        </div>
                      </div>
                    ))}
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

                {/* Primary Use + Intensity + In Stock */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Primary Use</label>
                    <select name="primaryUse" value={form.primaryUse} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700">
                      <option value="therapeutic">Therapeutic</option>
                      <option value="functional">Functional</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Intensity (1-10)</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="range"
                        name="intensity"
                        min="1"
                        max="10"
                        value={form.intensity || 5}
                        onChange={handleChange}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="text-sm font-medium min-w-[20px] text-center">
                        {form.intensity || 5}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Mild</span>
                      <span>Medium</span>
                      <span>Strong</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 mt-6">
                    <input
                      id="hasStock"
                      type="checkbox"
                      name="hasStock"
                      checked={form.hasStock}
                      onChange={(e) => {
                        console.log('hasStock checkbox changed:', e.target.checked);
                        setForm(prev => ({ ...prev, hasStock: e.target.checked }));
                      }}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                      disabled={form.hasVariants && form.variants && form.variants.length > 0}
                    />
                    <label htmlFor="hasStock" className="text-sm text-gray-700">
                      In Stock
                      {form.hasVariants && form.variants && form.variants.length > 0 && (
                        <span className="text-xs text-blue-600 ml-2">(Auto-calculated from variants)</span>
                      )}
                    </label>
                  </div>
                </div>

                {/* Images */}
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Images <span className="text-red-500">*</span></label>
                  <div className={`border-2 border-dashed rounded-lg p-4 text-center hover:border-blue-400 transition cursor-pointer ${form.images.length === 0 ? 'border-red-300 bg-red-50' : 'border-gray-300'}`} onClick={() => fileInputRef.current?.click()}>
                    <p className="text-sm text-gray-600">Click to choose files or drag and drop</p>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB each (Required)</p>
                    <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleFileChange} required className="hidden" />
                    {form.images && form.images.length > 0 && (
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        {form.images.map((file, idx) => (
                          <div key={idx} className="h-20 w-full bg-gray-100 rounded overflow-hidden flex items-center justify-center text-xs text-gray-500">{file.name}</div>
                        ))}
                      </div>
                    )}
                    {form.images.length === 0 && (
                      <p className="text-xs text-red-500 mt-2">Please select at least one image</p>
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
                  <input
                    type="text"
                    name="imageAltName"
                    value={form.imageAltName}
                    onChange={handleChange}
                    placeholder="Describe the image (for SEO)"
                    className={`w-full border ${errors.imageAltName ? 'border-red-500' : 'border-gray-300'} rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700`}
                    required
                  />
                  {errors.imageAltName && (
                    <p className="mt-1 text-sm text-red-600">{errors.imageAltName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Meta Title</label>
                  <input
                    type="text"
                    name="metaTitle"
                    value={form.metaTitle}
                    onChange={handleChange}
                    placeholder="SEO Meta Title"
                    className={`w-full border ${errors.metaTitle ? 'border-red-500' : 'border-gray-300'} rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700`}
                    required
                  />
                  {errors.metaTitle && (
                    <p className="mt-1 text-sm text-red-600">{errors.metaTitle}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Meta Description</label>
                  <textarea
                    name="metaDescription"
                    value={form.metaDescription}
                    onChange={handleChange}
                    rows={3}
                    placeholder="SEO Meta Description"
                    className={`w-full border ${errors.metaDescription ? 'border-red-500' : 'border-gray-300'} rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700`}
                    required
                  />
                  {errors.metaDescription && (
                    <p className="mt-1 text-sm text-red-600">{errors.metaDescription}</p>
                  )}
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
                {/* Name */}
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Product Name</label>
                  <input
                    name="name"
                    value={editForm.name}
                    onChange={handleEditChange}
                    required
                    className={`w-full border ${editErrors.name ? 'border-red-500' : 'border-gray-300'} rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700`}
                  />
                  {editErrors.name && (
                    <p className="mt-1 text-sm text-red-600">{editErrors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-1">Short Description</label>
                  <input name="short_description" value={editErrors.short_description} onChange={handleEditChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700" />
                </div>

                {/* Use Variants Toggle */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-1">Enable Size Variants</label>
                      <p className="text-xs text-gray-600">Enable this to add different sizes (grams, kg, etc.) with individual pricing</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={editForm.hasVariants}
                      onChange={(e) => setEditForm(prev => ({ ...prev, hasVariants: e.target.checked }))}
                      className="h-5 w-5 text-blue-600 border-gray-300 rounded"
                    />
                  </div>
                </div>



                {/* If variants are disabled, show regular price/stock */}
                {!editForm.hasVariants && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Stock Quantity</label>
                      <input
                        type="number"
                        min="0"
                        name="stock"
                        required
                        value={editForm.stock}
                        onChange={handleEditChange}
                        className={`w-full border ${editErrors.stock ? 'border-red-500' : 'border-gray-300'} rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700`}
                        placeholder="e.g., 10"
                      />
                      {editErrors.stock && (
                        <p className="mt-1 text-sm text-red-600">{editErrors.stock}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Variants Section */}
                {editForm.hasVariants && (
                  <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-gray-900">Product Variants</h3>
                      <button
                        type="button"
                        onClick={addEditVariant}
                        className="flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Variant
                      </button>
                    </div>

                    {editForm.variants.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">No variants added yet. Click "Add Variant" to create one.</p>
                    )}

                    <div className="space-y-3">
                      {editForm.variants.map((variant, index) => (
                        <div key={index} className="bg-white border border-gray-200 rounded-lg p-3">
                          <div className="flex items-start justify-between mb-3">
                            <span className="text-xs font-semibold text-gray-600">Variant #{index + 1}</span>
                            <button
                              type="button"
                              onClick={() => removeEditVariant(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs text-gray-700 mb-1">Size (Value)</label>
                              <input
                                type="number"
                                value={variant.size?.value || ''}
                                onChange={(e) => updateEditVariant(index, 'sizeValue', e.target.value)}
                                placeholder="e.g., 250"
                                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-700 mb-1">Unit</label>
                              <select
                                value={variant.size?.unit || 'grams'}
                                onChange={(e) => updateEditVariant(index, 'sizeUnit', e.target.value)}
                                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="grams">Grams</option>
                                <option value="kg">Kg</option>
                                <option value="ml">ML</option>
                                <option value="liters">Liters</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-700 mb-1">Price</label>
                              <input
                                type="number"
                                value={variant.price || ''}
                                onChange={(e) => updateEditVariant(index, 'price', e.target.value)}
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
                                required
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                            <div>
                              <label className="block text-xs text-gray-700 mb-1">Stock</label>
                              <input
                                type="number"
                                value={variant.stock || 0}
                                onChange={(e) => updateEditVariant(index, 'stock', e.target.value)}
                                placeholder="0"
                                min="0"
                                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-700 mb-1">SKU (Optional)</label>
                              <input
                                type="text"
                                value={variant.sku || ''}
                                onChange={(e) => updateEditVariant(index, 'sku', e.target.value)}
                                placeholder="e.g., CHOC-250G"
                                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Flavors Section (Optional) */}
                <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">Available Flavors (Optional)</h3>
                      <p className="text-xs text-gray-600 mt-1">Add flavors available for this product</p>
                    </div>
                    <button
                      type="button"
                      onClick={addEditFlavor}
                      className="flex items-center px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Flavor
                    </button>
                  </div>

                  {editForm.flavors.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">No flavors added. Flavors are optional.</p>
                  )}

                  <div className="space-y-2">
                    {editForm.flavors.map((flavor, index) => (
                      <div key={index} className="bg-white border border-gray-200 rounded-lg p-3">
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-xs font-semibold text-gray-600">Flavor #{index + 1}</span>
                          <button
                            type="button"
                            onClick={() => removeEditFlavor(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-700 mb-1">Flavor Name</label>
                            <input
                              type="text"
                              value={flavor.name || ''}
                              onChange={(e) => updateEditFlavor(index, 'name', e.target.value)}
                              placeholder="e.g., Chocolate, Vanilla"
                              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-700 mb-1">Price</label>
                            <input
                              type="number"
                              value={flavor.price || ''}
                              onChange={(e) => updateEditFlavor(index, 'price', e.target.value)}
                              placeholder="0.00"
                              min="0"
                              step="0.01"
                              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                        {/* ✅ Add Stock & SKU fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                          <div>
                            <label className="block text-xs text-gray-700 mb-1">Stock</label>
                            <input
                              type="number"
                              value={flavor.stock ?? 0}
                              onChange={(e) => updateEditFlavor(index, 'stock', parseInt(e.target.value) || 0)}
                              placeholder="0"
                              min="0"
                              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-700 mb-1">SKU (Optional)</label>
                            <input
                              type="text"
                              value={flavor.sku || ''}
                              onChange={(e) => updateEditFlavor(index, 'sku', e.target.value)}
                              placeholder="e.g., CHOC-250G"
                              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                        {/* ✅ Add Active checkbox */}
                        <div className="flex items-center mt-2">
                          <input
                            type="checkbox"
                            id={`edit-flavor-active-${index}`}
                            checked={flavor.isActive !== false}
                            onChange={(e) => updateEditFlavor(index, 'isActive', e.target.checked)}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <label htmlFor={`edit-flavor-active-${index}`} className="ml-2 block text-xs text-gray-700">
                            Active
                          </label>
                        </div>
                      </div>
                    ))}
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700"
                  />
                </div>

                {/* Detailed Description */}
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Detailed Description</label>
                  <textarea
                    name="descriptionDetails"
                    value={editForm.descriptionDetails}
                    onChange={handleEditChange}
                    required
                    rows={4}
                    className={`w-full border ${editErrors.descriptionDetails ? 'border-red-500' : 'border-gray-300'} rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700`}
                  />
                  {editErrors.descriptionDetails && (
                    <p className="mt-1 text-sm text-red-600">{editErrors.descriptionDetails}</p>
                  )}
                </div>

                {/* Primary Use + In Stock */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Primary Use</label>
                    <select
                      name="primaryUse"
                      value={editForm.primaryUse}
                      onChange={handleEditChange}
                      className={`w-full border ${editErrors.primaryUse ? 'border-red-500' : 'border-gray-300'} rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700`}
                    >
                      <option value="therapeutic">Therapeutic</option>
                      <option value="functional">Functional</option>
                    </select>
                    {editErrors.primaryUse && (
                      <p className="mt-1 text-sm text-red-600">{editErrors.primaryUse}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 mt-6">
                    <input
                      id="editHasStock"
                      type="checkbox"
                      name="hasStock"
                      checked={editForm.hasStock}
                      onChange={(e) => {
                        console.log('Edit hasStock checkbox changed:', e.target.checked);
                        setEditForm(prev => ({ ...prev, hasStock: e.target.checked }));
                      }}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                      disabled={editForm.hasVariants && editForm.variants && editForm.variants.length > 0}
                    />
                    <label htmlFor="editHasStock" className="text-sm text-gray-700">
                      In Stock
                      {editForm.hasVariants && editForm.variants && editForm.variants.length > 0 && (
                        <span className="text-xs text-blue-600 ml-2">(Auto-calculated from variants)</span>
                      )}
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
                          className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
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
                  <label className="block text-sm text-gray-700 mb-1">Add New Images (Optional)</label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleEditFileChange}
                    className="block w-full text-sm text-gray-700"
                  />
                  {editErrors.images && (
                    <p className="mt-1 text-sm text-red-600">{editErrors.images}</p>
                  )}
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
                    required
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
                    required
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
