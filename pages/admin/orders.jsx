"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
// import { toast } from 'react-toastify';
import { fetchAllOrders, updateOrderStatusApi, archiveOrderApi, toast, fetchUserById, fetchUserNotes, createUserNote, updateUserNote, deleteUserNote, adminCheckInUser, fetchVisitorByUserId, updateUser } from '../../service/service';
import Swal from 'sweetalert2';
import Sidebar from '../../components/sidebar';
import {
  User,
  ShoppingBag,
  X,
  Mail,
  Shield,
  Pencil,
  UserCircle,
  Trash2
} from 'lucide-react';

export default function AdminOrders() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalOrders, setTotalOrders] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [userModalLoading, setUserModalLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState('');
  const [userNotes, setUserNotes] = useState([]);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [hiddenVisits, setHiddenVisits] = useState([]); // Track hidden visits (UI only)
  const [showCheckInHistory, setShowCheckInHistory] = useState(false);
  const [checkInHistoryLoading, setCheckInHistoryLoading] = useState(false);
  const [checkInHistory, setCheckInHistory] = useState([]);
  const [showAdjustPointsModal, setShowAdjustPointsModal] = useState(false);
  const [adjustingPoints, setAdjustingPoints] = useState(false);
  const [adjustmentData, setAdjustmentData] = useState({
    adjustmentType: 'add',
    points: '',
    reason: '',
    customReason: '',
    notes: ''
  });
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: 'user',
    status: 'pending',
    birthday: {
      day: '',
      month: '',
      year: ''
    }
  });

  // Ref for infinite scroll
  const observerRef = useRef();

  // Load orders with infinite scroll support
  const loadOrders = useCallback(async (pageNum = 1, append = false) => {
    try {
      console.log(`Loading orders - Page: ${pageNum}, Append: ${append}`);
      
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const params = {
        page: pageNum,
        limit: 30, // Load 30 orders per request
        status: selectedStatus === 'all' ? undefined : selectedStatus,
        infiniteScroll: 'true'
      };

      console.log('API params:', params);

      const response = await fetchAllOrders(router, params);
      console.log('API response:', response);
      
      if (response.success) {
        const newOrders = response.data || [];
        console.log(`Received ${newOrders.length} orders`);
        
        if (append && pageNum > 1) {
          // Append new orders to existing list
          setOrders(prevOrders => {
            const combined = [...prevOrders, ...newOrders];
            console.log(`Total orders after append: ${combined.length}`);
            return combined;
          });
        } else {
          // Replace orders list (for initial load or filter change)
          setOrders(newOrders);
          console.log(`Set orders to ${newOrders.length} orders`);
        }
        
        if (response.meta) {
          setHasMore(response.meta.page < response.meta.totalPages);
          setTotalOrders(response.meta.total || 0);
          console.log(`HasMore: ${response.meta.page < response.meta.totalPages}, Total: ${response.meta.total}`);
        }
      } else {
        Swal.fire({ icon: 'error', title: 'Error', text: response.message || 'Failed to load orders' });
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load orders' });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [selectedStatus, router]);

  // Load more orders for infinite scroll
  const loadMoreOrders = useCallback(() => {
    console.log(`loadMoreOrders called - loadingMore: ${loadingMore}, hasMore: ${hasMore}, page: ${page}`);
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      console.log(`Loading page ${nextPage}`);
      setPage(nextPage);
      loadOrders(nextPage, true);
    }
  }, [loadingMore, hasMore, page, loadOrders]);

  // Intersection Observer for infinite scroll
  const lastOrderElementRefCallback = useCallback((node) => {
    if (loading || loadingMore) return;
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loadingMore) {
        console.log('Loading more orders...');
        loadMoreOrders();
      }
    }, {
      threshold: 0.1,
      rootMargin: '50px'
    });
    
    if (node) observerRef.current.observe(node);
  }, [loading, loadingMore, hasMore, loadMoreOrders]);

  // Initial load and filter changes
  useEffect(() => {
    setPage(1);
    setOrders([]);
    setHasMore(true);
    loadOrders(1, false);
  }, [selectedStatus]);

  // Cleanup intersection observer on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  const updateOrderStatus = async (orderId, newStatus) => {
    const textMap = {
      pending: 'Set order to Pending?',
      incomplete: 'Mark order as Incomplete? Reserved stock will be returned.',
      fulfilled: 'Mark order as Fulfilled? Order is ready for customer pickup.',
      completed: 'Mark order as Completed? Customer has picked up the order.',
      cancelled: 'Cancel this order? Reserved stock will be returned.'
    };
    const confirm = await Swal.fire({
      title: 'Confirm Status Change',
      text: textMap[newStatus] || 'Are you sure?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, update',
      cancelButtonText: 'Cancel'
    });
    if (!confirm.isConfirmed) return;
    try {
      const response = await updateOrderStatusApi(orderId, newStatus, router);
      if (response.success) {
        await Swal.fire({ icon: 'success', title: 'Updated', text: 'Order status updated', timer: 1200, showConfirmButton: false });
        
        // Update the order in the current list instead of reloading
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order._id === orderId 
              ? { ...order, status: newStatus }
              : order
          )
        );
      } else {
        Swal.fire({ icon: 'error', title: 'Error', text: response.message || 'Failed to update status' });
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to update status' });
    }
  };

  const archiveOrder = async (orderId) => {
    const confirm = await Swal.fire({
      title: 'Archive Order?',
      html: `
        <p>Are you sure you want to archive this order?</p>
        <p class="text-sm text-gray-600 mt-2">The order data will be preserved and can be restored later if needed.</p>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#F59E0B',
      confirmButtonText: 'Yes, archive it',
      cancelButtonText: 'Cancel'
    });
    if (!confirm.isConfirmed) return;
    try {
      const response = await archiveOrderApi(orderId, router);
      if (response.success) {
        await Swal.fire({ icon: 'success', title: 'Archived', text: 'Order archived successfully', timer: 1200, showConfirmButton: false });
        
        // Remove the archived order from the current list
        setOrders(prevOrders => prevOrders.filter(order => order._id !== orderId));
        setTotalOrders(prev => prev - 1);
      } else {
        Swal.fire({ icon: 'error', title: 'Error', text: response.message || 'Failed to archive order' });
      }
    } catch (error) {
      console.error('Error archiving order:', error);
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to archive order' });
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'fulfilled': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'incomplete': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-200 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleViewUser = async (userId) => {
    try {
      setUserModalLoading(true);
      setShowUserModal(true);
      setIsEditMode(false);

      const response = await fetchUserById(userId, router);
      if (response.success) {
        setSelectedUser(response.data);
        
        // Fetch user notes
        const notesResponse = await fetchUserNotes(userId, router);
        if (notesResponse.success) {
          setUserNotes(notesResponse.data || []);
        }
        
        // Fetch visitor data to get visit history
        try {
          const visitorData = await fetchVisitorByUserId(userId, router);
          if (visitorData.success && visitorData.data) {
            // Add visit history to selected user
            setSelectedUser(prev => ({
              ...prev,
              visitHistory: visitorData.data.visits || [],
              visitCount: visitorData.data.visitCount || 0
            }));
          }
        } catch (error) {
          console.error('Error fetching visitor data:', error);
          // It's okay if visitor record doesn't exist yet
        }
        
        // Initialize form data with user data including birthday
        setFormData({
          fullName: response.data.fullName || '',
          email: response.data.email || '',
          phone: response.data.phone || '',
          role: response.data.role || 'user',
          status: response.data.status || 'pending',
          birthday: response.data.birthday || {
            day: '',
            month: '',
            year: ''
          }
        });
      } else {
        toast.error('Failed to load user details');
        setShowUserModal(false);
      }
    } catch (error) {
      console.error('Error loading user details:', error);
      toast.error('Error loading user details');
      setShowUserModal(false);
    } finally {
      setUserModalLoading(false);
    }
  };

  const handleViewOrder = (order) => {
    console.log('=== ORDER DATA ===');
    console.log('Full Order:', order);
    console.log('Order Items:', order.items);
    order.items.forEach((item, index) => {
      console.log(`Item ${index + 1}:`, {
        name: item.name,
        selectedVariant: item.selectedVariant,
        selectedFlavor: item.selectedFlavor,
        quantity: item.quantity,
        price: item.price
      });
    });
    console.log('==================');
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  const closeUserModal = () => {
    setShowUserModal(false);
    setSelectedUser(null);
    setIsEditMode(false);
  };

  const handleViewCheckInHistory = async (userId) => {
    try {
      setCheckInHistoryLoading(true);
      setShowCheckInHistory(true);
      
      const response = await fetchVisitorByUserId(userId, router);
      if (response.success && response.data) {
        setCheckInHistory(response.data.visits || []);
      } else {
        setCheckInHistory([]);
        toast.info('No check-in history found for this user');
      }
    } catch (error) {
      console.error('Error loading check-in history:', error);
      toast.error('Failed to load check-in history');
      setCheckInHistory([]);
    } finally {
      setCheckInHistoryLoading(false);
    }
  };

  const closeCheckInHistoryModal = () => {
    setShowCheckInHistory(false);
    setCheckInHistory([]);
    setIsEditingNotes(false);
    setNotesText('');
    setUserNotes([]);
    setEditingNoteId(null);
    setHiddenVisits([]); // Reset hidden visits when modal closes
  };

  const handleHideVisit = async (visitIndex) => {
    const result = await Swal.fire({
      title: 'Hide Visit from UI?',
      html: `
        <p>This will hide the visit from this view only.</p>
        <p class="text-sm text-yellow-600 mt-2"><strong>Note:</strong> The visit data will NOT be deleted from the database. It will only be hidden from this UI to keep the display clean.</p>
      `,
      icon: 'info',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, Hide It',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      setHiddenVisits(prev => [...prev, visitIndex]);
      toast.success('Visit hidden from view');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateChange = (e) => {
    const { value } = e.target;
    if (value) {
      const date = new Date(value);
      setFormData(prev => ({
        ...prev,
        birthday: {
          day: date.getDate(),
          month: date.getMonth() + 1, // Months are 0-indexed
          year: date.getFullYear()
        }
      }));
    }
  };

  const handleSaveNote = async () => {
    if (!selectedUser?._id || !notesText.trim()) return;
    
    try {
      setUserModalLoading(true);
      
      let response;
      if (editingNoteId) {
        // Update existing note
        response = await updateUserNote(editingNoteId, notesText, router);
      } else {
        // Create new note
        response = await createUserNote(selectedUser._id, notesText, router);
      }
      
      if (response.success) {
        await Swal.fire({
          title: 'Success!',
          text: editingNoteId ? 'Note updated successfully.' : 'Note added successfully.',
          icon: 'success',
          confirmButtonColor: '#3085d6',
          timer: 2000,
          timerProgressBar: true
        });
        
        // Refresh notes
        const notesResponse = await fetchUserNotes(selectedUser._id, router);
        if (notesResponse.success) {
          setUserNotes(notesResponse.data || []);
        }
        
        setIsEditingNotes(false);
        setNotesText('');
        setEditingNoteId(null);
      } else {
        throw new Error(response.message || 'Failed to save note');
      }
    } catch (error) {
      console.error('Error saving note:', error);
      toast.error(error.message || 'Error saving note');
    } finally {
      setUserModalLoading(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    const result = await Swal.fire({
      title: 'Delete Note?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    try {
      setUserModalLoading(true);
      const response = await deleteUserNote(noteId, router);
      
      if (response.success) {
        await Swal.fire({
          title: 'Deleted!',
          text: 'Note has been deleted.',
          icon: 'success',
          confirmButtonColor: '#10B981',
          timer: 2000,
          timerProgressBar: true
        });
        
        // Refresh notes
        const notesResponse = await fetchUserNotes(selectedUser._id, router);
        if (notesResponse.success) {
          setUserNotes(notesResponse.data || []);
        }
      } else {
        throw new Error(response.message || 'Failed to delete note');
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error(error.message || 'Error deleting note');
    } finally {
      setUserModalLoading(false);
    }
  };

  const handleEditNote = (note) => {
    setEditingNoteId(note._id);
    setNotesText(note.note);
    setIsEditingNotes(true);
  };

  const handleManualCheckIn = async (userId, userName) => {
    const result = await Swal.fire({
      title: 'Manual Check-In',
      html: `
        <p>Are you sure you want to check-in <strong>${userName}</strong>?</p>
        <p class="text-sm text-gray-600 mt-2">This will increase their visit count by 1.</p>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, Check-In',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    try {
      setUserModalLoading(true);
      const response = await adminCheckInUser(userId, router);
      
      if (response.success) {
        await Swal.fire({
          title: 'Success!',
          text: `${userName} has been checked in successfully!`,
          icon: 'success',
          confirmButtonColor: '#10B981',
          timer: 2000,
          timerProgressBar: true
        });
        
        // Refresh user data if modal is open
        if (showUserModal && selectedUser?._id === userId) {
          const userResponse = await fetchUserById(userId, router);
          if (userResponse.success) {
            setSelectedUser(userResponse.data);
            
            // Refresh visitor data to get updated visit history
            try {
              const visitorData = await fetchVisitorByUserId(userId, router);
              if (visitorData.success && visitorData.data) {
                setSelectedUser(prev => ({
                  ...prev,
                  visitHistory: visitorData.data.visits || [],
                  visitCount: visitorData.data.visitCount || 0
                }));
              }
            } catch (error) {
              console.error('Error fetching visitor data:', error);
            }
          }
        }
      } else {
        throw new Error(response.message || 'Failed to check-in user');
      }
    } catch (error) {
      console.error('Error checking in user:', error);
      Swal.fire({
        title: 'Error!',
        text: error.message || 'Failed to check-in user',
        icon: 'error',
        confirmButtonColor: '#EF4444'
      });
    } finally {
      setUserModalLoading(false);
    }
  };

  // Open adjust points modal
  const handleOpenAdjustPointsModal = (user) => {
    setSelectedUser(user);
    setAdjustmentData({
      adjustmentType: 'add',
      points: '',
      reason: '',
      customReason: '',
      notes: ''
    });
    setShowAdjustPointsModal(true);
  };

  // Close adjust points modal
  const handleCloseAdjustPointsModal = () => {
    setShowAdjustPointsModal(false);
    setAdjustmentData({
      adjustmentType: 'add',
      points: '',
      reason: '',
      customReason: '',
      notes: ''
    });
  };

  // Handle adjust points submission
  const handleAdjustPoints = async (e) => {
    e.preventDefault();

    if (!adjustmentData.points || adjustmentData.points <= 0) {
      toast.error('Please enter a valid points amount');
      return;
    }

    if (!adjustmentData.reason) {
      toast.error('Please select a reason');
      return;
    }

    if (adjustmentData.reason === 'custom' && !adjustmentData.customReason.trim()) {
      toast.error('Please enter a custom reason');
      return;
    }

    // Prevent negative balance
    if (adjustmentData.adjustmentType === 'subtract') {
      const currentBalance = selectedUser.rewardPoints || 0;
      const pointsToSubtract = parseFloat(adjustmentData.points);
      
      if (pointsToSubtract > currentBalance) {
        Swal.fire({
          title: 'Insufficient Balance!',
          html: `
            <p>Cannot subtract <strong>${pointsToSubtract}</strong></p>
            <p>User <strong>${selectedUser.fullName}</strong> only has <strong>${currentBalance}</strong> balance.</p>
          `,
          icon: 'error',
          confirmButtonColor: '#EF4444'
        });
        return;
      }
    }

    const confirmResult = await Swal.fire({
      title: `${adjustmentData.adjustmentType === 'add' ? 'Add' : 'Subtract'} Points?`,
      html: `
        <p>User: <strong>${selectedUser.fullName}</strong></p>
        <p>Current Balance: <strong>${selectedUser.rewardPoints || 0}</strong></p>
        <p>Points to ${adjustmentData.adjustmentType}: <strong>${adjustmentData.points}</strong></p>
        <p>New Balance: <strong>${adjustmentData.adjustmentType === 'add' 
          ? (selectedUser.rewardPoints || 0) + parseFloat(adjustmentData.points)
          : Math.max(0, (selectedUser.rewardPoints || 0) - parseFloat(adjustmentData.points))
        }</strong></p>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: adjustmentData.adjustmentType === 'add' ? '#10B981' : '#EF4444',
      cancelButtonColor: '#6B7280',
      confirmButtonText: `Yes, ${adjustmentData.adjustmentType} points!`,
      cancelButtonText: 'Cancel'
    });

    if (!confirmResult.isConfirmed) {
      return;
    }

    setAdjustingPoints(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.mypsyguide.io'}/api/points/admin/adjust/${selectedUser._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `jwt ${localStorage.getItem('adminToken') || localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          adjustmentType: adjustmentData.adjustmentType,
          points: parseFloat(adjustmentData.points),
          reason: adjustmentData.reason === 'custom' ? adjustmentData.customReason : adjustmentData.reason,
          customReason: adjustmentData.reason === 'custom' ? adjustmentData.customReason : '',
          notes: adjustmentData.notes
        })
      });

      const data = await response.json();

      if (data.success) {
        await Swal.fire({
          title: 'Success!',
          text: `Points ${adjustmentData.adjustmentType === 'add' ? 'added' : 'subtracted'} successfully!`,
          icon: 'success',
          confirmButtonColor: '#10B981',
          timer: 2000,
          timerProgressBar: true
        });
        handleCloseAdjustPointsModal();
        
        // Update the selected user data
        setSelectedUser(prev => ({
          ...prev,
          rewardPoints: data.user?.rewardPoints || prev.rewardPoints
        }));
      } else {
        toast.error(data.message || 'Failed to adjust points');
      }
    } catch (error) {
      console.error('Error adjusting points:', error);
      toast.error('An error occurred while adjusting points');
    } finally {
      setAdjustingPoints(false);
    }
  };

  const handleSaveUser = async () => {
    if (!selectedUser?._id) return;
    
    try {
      setUserModalLoading(true);
      
      // Prepare the data to be sent (without notes)
      const updateData = {
        ...formData,
        // Include the birthday data in the correct format
        birthday: formData.birthday
      };
      
      // Use the updateUser service function
      const response = await updateUser(selectedUser._id, updateData, router);
      
      if (response.success) {
        // Show SweetAlert2 confirmation
        await Swal.fire({
          title: 'Success!',
          text: 'User profile has been updated successfully.',
          icon: 'success',
          confirmButtonColor: '#3085d6',
          timer: 2000,
          timerProgressBar: true
        });
        
        toast.success('User updated successfully');
        setSelectedUser(response.data);
        setIsEditMode(false);
      } else {
        throw new Error(response.message || 'Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      // Check if this is a network error or API error
      if (error.message.includes('Network Error')) {
        toast.error('Cannot connect to the server. Please check your connection.');
      } else if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        console.error('Error response headers:', error.response.headers);
        toast.error(error.response.data?.message || 'Error updating user');
      } else if (error.request) {
        // The request was made but no response was received
        console.error('Error request:', error.request);
        toast.error('No response from server. Please try again.');
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error message:', error.message);
        toast.error(error.message || 'Error updating user');
      }
    } finally {
      setUserModalLoading(false);
    }
  };

  const getRoleBadge = (role) => {
    const roleColors = {
      admin: 'bg-red-100 text-red-800',
      user: 'bg-green-100 text-green-800'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${roleColors[role] || 'bg-gray-100 text-gray-800'}`}>
        {role}
      </span>
    );
  };

  const formatBirthday = (birthday) => {
    if (!birthday || !birthday.day || !birthday.month || !birthday.year) {
      return 'Not provided';
    }
    
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    return `${months[birthday.month - 1]} ${birthday.day}, ${birthday.year}`;
  };

  const closeOrderModal = () => {
    setShowOrderModal(false);
    setSelectedOrder(null);
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800',
      fulfilled: 'bg-orange-100 text-orange-800',
      completed: 'bg-green-100 text-green-800',
      incomplete: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-200 text-gray-800'
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };


  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <div className="hidden md:block"><Sidebar /></div>
        <div className="flex-1 md:ml-[240px] p-8 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#536690] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading orders...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
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
        <span className="font-semibold">Orders</span>
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
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Management</h1>
              <p className="text-gray-600">View and manage all customer orders</p>
            </div>
            <button
              onClick={() => router.push('/archived-orders')}
              className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              View Archive
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'All' },
              { key: 'pending', label: 'Pending' },
              { key: 'fulfilled', label: 'Fulfilled' },
              { key: 'completed', label: 'Completed' },
              { key: 'incomplete', label: 'Incomplete' },
              { key: 'cancelled', label: 'Cancelled' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setSelectedStatus(tab.key)}
                className={`px-4 py-2 rounded-lg border ${selectedStatus === tab.key ? 'bg-[#536690] text-white border-[#536690]' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                 {orders.map((order, index) => (
                  <tr 
                    key={order._id} 
                    className="hover:bg-gray-50"
                    ref={index === orders.length - 1 ? lastOrderElementRefCallback : null}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {order.orderNumber}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDate(order.createdAt)}
                        </div>
                      </div>
                    </td>
                   <td className="px-6 py-4 whitespace-nowrap">
  <div className="flex items-center space-x-2">
    <div>
      <div className="text-sm text-gray-900">
        {order.user?.fullName || 'N/A'}
      </div>
      <div className="text-sm text-gray-500">
        {order.user?.phone || 'N/A'}
      </div>
    </div>
    {order.user?._id && (
      <button
        onClick={() => handleViewUser(order.user._id)}
        className="text-blue-600 hover:text-blue-900 p-1"
        title="View User Details"
      >
        <User className="h-4 w-4" />
      </button>
    )}
  </div>
</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <div>
                          <div className="text-sm text-gray-900">
                            {order.items.length} item(s)
                          </div>
                          <div className="text-sm text-gray-500">
                            {order.items.map(item => item.name).join(', ')}
                          </div>
                        </div>
                        <button
                          onClick={() => handleViewOrder(order)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="View Order Details"
                        >
                          <ShoppingBag className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ${order.totalAmount.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-500">
                         ${order.subtotal.toFixed(2)} + ${order.tax.toFixed(2)} tax
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <select
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                          className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-[#536690]"
                        >
                           <option value="pending">Pending</option>
                           <option value="fulfilled">Fulfilled</option>
                           <option value="completed">Completed</option>
                           <option value="incomplete">Incomplete</option>
                           <option value="cancelled">Cancel Order</option>
                        </select>
                        
                        <button
                          onClick={() => archiveOrder(order._id)}
                          className="px-2 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
                        >
                          Archive
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                
                {/* Loading row for infinite scroll */}
                {loadingMore && (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#536690]"></div>
                        <span className="text-sm text-gray-600">Loading more orders...</span>
                      </div>
                    </td>
                  </tr>
                )}
                
                {/* Load More button as fallback */}
                {!loadingMore && hasMore && orders.length > 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center">
                      <button
                        onClick={loadMoreOrders}
                        className="px-4 py-2 bg-[#536690] text-white rounded-md hover:bg-[#4a5a7a] focus:outline-none focus:ring-2 focus:ring-[#536690] focus:ring-offset-2"
                      >
                        Load More Orders
                      </button>
                    </td>
                  </tr>
                )}
                
                {/* End of data indicator */}
                {!hasMore && !loading && orders.length > 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                      All orders loaded ({totalOrders} total)
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {orders.length === 0 && !loading && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No orders found</p>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-[#536690]">{totalOrders}</div>
              <div className="text-sm text-gray-600">Total Orders</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {orders.filter(o => o.status === 'pending').length}
              </div>
              <div className="text-sm text-gray-600">Pending (Loaded)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {orders.filter(o => o.status === 'completed').length}
              </div>
              <div className="text-sm text-gray-600">Completed (Loaded)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                ${orders.reduce((total, order) => total + order.totalAmount, 0).toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Revenue (Loaded)</div>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* User Details Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {isEditMode ? 'Edit User' : 'User Details'}
              </h2>
              <div className="flex items-center space-x-2">
                {!isEditMode && selectedUser && (
                  <>
                    <button
                      type="button"
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                      onClick={() => handleOpenAdjustPointsModal(selectedUser)}
                    >
                      <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Adjust Points
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      onClick={() => handleManualCheckIn(selectedUser._id, selectedUser.fullName)}
                    >
                      <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Check-In
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      onClick={() => setIsEditMode(true)}
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      Edit User
                    </button>
                  </>
                )}
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-500"
                  onClick={closeUserModal}
                >
                  <span className="sr-only">Close</span>
                  <X className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {userModalLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : selectedUser ? (
                <div className="space-y-6">
                  {/* User Avatar and Basic Info */}
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {selectedUser.avatar ? (
                        <img
                          className="h-16 w-16 rounded-full"
                          src={selectedUser.avatar}
                          alt={selectedUser.fullName}
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-600 font-bold text-xl">
                            {selectedUser.fullName?.charAt(0)?.toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {selectedUser.fullName}
                      </h3>
                      <p className="text-sm text-gray-500">User ID: {selectedUser._id}</p>
                      <div className="mt-1">
                        {getRoleBadge(selectedUser.role)}
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                      <Mail className="h-4 w-4 mr-2" />
                      Contact Information
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <span className="font-medium text-gray-600 w-20">Email:</span>
                        <span className="text-gray-900">{selectedUser.email}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <span className="font-medium text-gray-600 w-20">Phone:</span>
                        <span className="text-gray-900">{selectedUser.phone}</span>
                      </div>
                    </div>
                  </div>

                  {/* User Info */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                      <UserCircle className="h-4 w-4 mr-2" />
                      Basic Information
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <label className="text-sm font-medium text-gray-600 w-20">Name:</label>
                        {isEditMode ? (
                          <input
                            type="text"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleInputChange}
                            className="ml-2 flex-1 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          <span className="text-gray-900 ml-2">{selectedUser.fullName}</span>
                        )}
                      </div>
                      <div className="flex items-center">
                        <label className="text-sm font-medium text-gray-600 w-20">Email:</label>
                        {isEditMode ? (
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="ml-2 flex-1 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          <span className="text-gray-900 ml-2">{selectedUser.email}</span>
                        )}
                      </div>
                      <div className="flex items-center">
                        <label className="text-sm font-medium text-gray-600 w-20">Phone:</label>
                        {isEditMode ? (
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            className="ml-2 flex-1 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          <span className="text-gray-900 ml-2">{selectedUser.phone || 'N/A'}</span>
                        )}
                      </div>
                      <div className="flex items-center">
                        <label className="text-sm font-medium text-gray-600 w-20">Role:</label>
                        {isEditMode ? (
                          <select
                            name="role"
                            value={formData.role}
                            onChange={handleInputChange}
                            className="ml-2 flex-1 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        ) : (
                          <span className="text-gray-900 ml-2">{getRoleBadge(selectedUser.role)}</span>
                        )}
                      </div>
                      <div className="flex items-center">
                        <label className="text-sm font-medium text-gray-600 w-20">Status:</label>
                        {isEditMode ? (
                          <select
                            name="status"
                            value={formData.status}
                            onChange={handleInputChange}
                            className="ml-2 flex-1 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="pending">Pending</option>
                            <option value="verified">Verified</option>
                            <option value="suspend">Suspended</option>
                          </select>
                        ) : (
                          <span className="text-gray-900 ml-2">{getStatusBadge(selectedUser.status)}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mt-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Account Created</h3>
                      <p className="mt-1 text-sm text-gray-900">
                        {new Date(selectedUser.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Status</h3>
                      <div className="mt-1">
                        {getStatusBadge(selectedUser.status)}
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                      <h3 className="text-xs font-medium text-green-700 uppercase tracking-wider flex items-center">
                        <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Reward Points
                      </h3>
                      <p className="mt-1 text-2xl font-bold text-green-600">
                        ${selectedUser.rewardPoints || 0}
                      </p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h3 className="text-xs font-medium text-blue-700 uppercase tracking-wider flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Store Visits
                      </h3>
                      <p className="mt-1 text-2xl font-bold text-blue-600">
                        {selectedUser.visitCount || 0}
                      </p>
                      {selectedUser.lastVisit && (
                        <p className="text-xs text-gray-500 mt-1">
                          Last: {new Date(selectedUser.lastVisit).toLocaleDateString('en-US', {
                            timeZone: 'America/Detroit',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      )}
                      {(selectedUser.visitCount || 0) > 0 && (
                        <button
                          onClick={() => handleViewCheckInHistory(selectedUser._id)}
                          className="mt-2 w-full text-xs px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center"
                        >
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          View History
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Medication Information */}
                  <div className="mt-6 space-y-2">
                    <h3 className="text-sm font-medium text-gray-700">Medication Information</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-xs font-medium text-gray-500">Takes Medication</h4>
                          <p className="mt-1 text-sm text-gray-900">
                            {selectedUser.takesMedication ? 'Yes' : 'No'}
                          </p>
                        </div>
                        {selectedUser.takesMedication && selectedUser.medicationDetails && (
                          <div>
                            <h4 className="text-xs font-medium text-gray-500">Medication Details</h4>
                            <p className="mt-1 text-sm text-gray-900 break-words">
                              {selectedUser.medicationDetails}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Account Information */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                      <Shield className="h-4 w-4 mr-2" />
                      Account Information
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <span className="font-medium text-gray-600 w-24">Role:</span>
                        <span className="text-gray-900">{getRoleBadge(selectedUser.role)}</span>
                      </div>
                      <div className="flex items-center">
                        <label className="text-sm font-medium text-gray-600 w-24">Birthday:</label>
                        {isEditMode ? (
                          <div className="flex space-x-2">
                            <input
                              type="date"
                              value={formData.birthday && formData.birthday.year 
                                ? `${formData.birthday.year}-${String(formData.birthday.month).padStart(2, '0')}-${String(formData.birthday.day).padStart(2, '0')}`
                                : ''}
                              onChange={handleDateChange}
                              className="ml-2 flex-1 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        ) : (
                          <span className="text-gray-900 ml-2">{formatBirthday(selectedUser.birthday)}</span>
                        )}
                      </div>
                      {selectedUser.status && (
                        <div className="flex items-center text-sm">
                          <span className="font-medium text-gray-600 w-24">Status:</span>
                          <span className="text-gray-900">{getStatusBadge(selectedUser.status)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Admin Notes Section */}
                  <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-700 flex items-center">
                        <svg className="h-4 w-4 mr-2 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Admin Notes ({userNotes.length})
                      </h4>
                      {!isEditingNotes && (
                        <button
                          onClick={() => {
                            setIsEditingNotes(true);
                            setEditingNoteId(null);
                            setNotesText('');
                          }}
                          className="text-xs px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                        >
                          Add Note
                        </button>
                      )}
                    </div>
                    
                    {isEditingNotes ? (
                      <div className="mb-3">
                        <textarea
                          value={notesText}
                          onChange={(e) => setNotesText(e.target.value)}
                          rows={3}
                          placeholder="Add notes about this customer (e.g., 'Gave 10% discount', 'Prescription missing', 'Check ID on next visit')"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm mb-2"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveNote}
                            disabled={userModalLoading || !notesText.trim()}
                            className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                          >
                            {userModalLoading ? 'Saving...' : (editingNoteId ? 'Update Note' : 'Save Note')}
                          </button>
                          <button
                            onClick={() => {
                              setIsEditingNotes(false);
                              setNotesText('');
                              setEditingNoteId(null);
                            }}
                            className="px-3 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : null}
                    
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {userNotes.length > 0 ? (
                        userNotes.map((note) => (
                          <div key={note._id} className="bg-white p-3 rounded border border-yellow-200">
                            <div className="flex justify-between items-start mb-1">
                              <span className="text-xs text-gray-500">
                                {new Date(note.createdAt).toLocaleString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleEditNote(note)}
                                  className="text-blue-600 hover:text-blue-800 p-1"
                                  title="Edit note"
                                >
                                  <Pencil className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={() => handleDeleteNote(note._id)}
                                  className="text-red-600 hover:text-red-800 p-1"
                                  title="Delete note"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.note}</p>
                            {note.createdBy && (
                              <p className="text-xs text-gray-500 mt-1">
                                By: {note.createdBy.fullName || note.createdBy.email}
                              </p>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-2">No notes added yet.</p>
                      )}
                    </div>
                  </div>

                  {/* Visit History Section */}
                  {selectedUser.visitHistory && selectedUser.visitHistory.length > 0 && (
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-gray-700 flex items-center">
                          <svg className="h-4 w-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Visit History ({selectedUser.visitCount || 0} total visits)
                        </h4>
                        {hiddenVisits.length > 0 && (
                          <button
                            onClick={() => setHiddenVisits([])}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            Show All ({hiddenVisits.length} hidden)
                          </button>
                        )}
                      </div>
                      
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {selectedUser.visitHistory.slice().reverse().map((visit, index) => {
                          // Skip if this visit is hidden
                          if (hiddenVisits.includes(index)) return null;
                          
                          return (
                            <div key={index} className="bg-white p-3 rounded border border-blue-200">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-xs text-gray-500">
                                      {new Date(visit.timestamp).toLocaleString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </span>
                                    {visit.checkedInBy === 'admin' && (
                                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                                        Admin Check-In
                                      </span>
                                    )}
                                    {visit.checkedInBy === 'self' && (
                                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                        Self Check-In
                                      </span>
                                    )}
                                  </div>
                                  {visit.adminId && (
                                    <p className="text-xs text-gray-600 mt-1">
                                      By: {visit.adminId.fullName || visit.adminId.email}
                                    </p>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleHideVisit(index)}
                                  className="text-gray-400 hover:text-red-600 p-1"
                                  title="Hide from view (data will not be deleted)"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Additional Information */}
                  {selectedUser.avatar && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Profile Picture</h4>
                      <img
                        src={selectedUser.avatar}
                        alt={selectedUser.fullName}
                        className="h-32 w-32 rounded-lg object-cover"
                      />
                    </div>
                  )}

                  {selectedUser.governmentId && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Government ID</h4>
                      {/\.pdf($|\?)/i.test(selectedUser.governmentId) ? (
                        <div className="w-full h-96">
                          <iframe src={selectedUser.governmentId} className="w-full h-full rounded" />
                        </div>
                      ) : (
                        <img
                          src={selectedUser.governmentId}
                          alt="Government ID"
                          className="max-h-96 rounded object-contain"
                        />
                      )}
                      <div className="mt-2">
                        <a href={selectedUser.governmentId} target="_blank" rel="noreferrer" className="text-blue-600 underline text-sm">
                          Open original
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">No user data available</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
              {isEditMode ? (
                <>
                  <button
                    type="button"
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    onClick={() => setIsEditMode(false)}
                    disabled={userModalLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    onClick={handleSaveUser}
                    disabled={userModalLoading}
                  >
                    {userModalLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={closeUserModal}
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Order Details</h2>
              <button onClick={closeOrderModal} className="text-gray-400 hover:text-gray-500">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{selectedOrder.orderNumber}</h3>
                    <p className="text-sm text-gray-500">{formatDate(selectedOrder.createdAt)}</p>
                  </div>
                  {getStatusBadge(selectedOrder.status)}
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Customer Information</h4>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <span className="font-medium text-gray-600 w-24">Name:</span>
                      <span className="text-gray-900">{selectedOrder.user?.fullName || 'N/A'}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <span className="font-medium text-gray-600 w-24">Phone:</span>
                      <span className="text-gray-900">{selectedOrder.user?.phone || 'N/A'}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <span className="font-medium text-gray-600 w-24">Email:</span>
                      <span className="text-gray-900">{selectedOrder.user?.email || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Order Items</h4>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item, index) => (
                      <div key={index} className="flex items-center space-x-4 bg-white p-3 rounded">
                        {item.image && (
                          <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded" />
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{item.name}</p>
                          {item.selectedVariant ? (
                            <p className="text-sm text-blue-600 font-medium">
                              ✓ Size: {typeof item.selectedVariant === 'object' ? 
                                (item.selectedVariant.size ? 
                                  `${item.selectedVariant.size.value || ''}${item.selectedVariant.size.unit || ''}` : 
                                  'N/A') : 
                                item.selectedVariant}
                            </p>
                          ) : item.product?.variants && item.product.variants.length === 1 ? (
                            <p className="text-sm text-blue-500">
                              Size: {typeof item.product.variants[0].size === 'object' ? 
                                `${item.product.variants[0].size.value || ''}${item.product.variants[0].size.unit || ''}` : 
                                item.product.variants[0].size || 'N/A'}
                            </p>
                          ) : item.product?.variants && item.product.variants.length > 1 ? (
                            <p className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded inline-block">
                              ⚠️ Size not recorded - Contact customer
                            </p>
                          ) : null}
                          
                          {item.selectedFlavor ? (
                            <p className="text-sm text-purple-600 font-medium">
                              ✓ Flavor: {typeof item.selectedFlavor === 'object' ? 
                                item.selectedFlavor.name || 'N/A' : 
                                item.selectedFlavor}
                            </p>
                          ) : item.product?.flavors && item.product.flavors.filter(f => f.isActive).length === 1 ? (
                            <p className="text-sm text-purple-500">
                              Flavor: {item.product.flavors.find(f => f.isActive)?.name || 'N/A'}
                            </p>
                          ) : item.product?.flavors && item.product.flavors.filter(f => f.isActive).length > 1 ? (
                            <p className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded inline-block">
                              ⚠️ Flavor not recorded - Contact customer
                            </p>
                          ) : null}
                          
                          <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
                          <p className="text-sm text-gray-500">${item.price} each</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Order Summary</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="text-gray-900">${selectedOrder.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tax:</span>
                      <span className="text-gray-900">${selectedOrder.tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-base font-semibold pt-2 border-t">
                      <span className="text-gray-900">Total:</span>
                      <span className="text-gray-900">${selectedOrder.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end p-6 border-t border-gray-200">
              <button onClick={closeOrderModal} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Adjust Points Modal */}
      {showAdjustPointsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Adjust Points</h2>
              <button onClick={handleCloseAdjustPointsModal} className="text-gray-400 hover:text-gray-500">
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleAdjustPoints} className="p-6">
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900">{selectedUser?.fullName}</h3>
                  <p className="text-sm text-gray-600">Current Balance: <span className="font-medium">${selectedUser?.rewardPoints || 0}</span></p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Action</label>
                  <select
                    value={adjustmentData.adjustmentType}
                    onChange={(e) => setAdjustmentData(prev => ({ ...prev, adjustmentType: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="add">Add Points</option>
                    <option value="subtract">Subtract Points</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Points Amount</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={adjustmentData.points}
                    onChange={(e) => setAdjustmentData(prev => ({ ...prev, points: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter points amount"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
                  <select
                    value={adjustmentData.reason}
                    onChange={(e) => setAdjustmentData(prev => ({ ...prev, reason: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select a reason</option>
                    <option value="Purchase bonus">Purchase bonus</option>
                    <option value="Loyalty reward">Loyalty reward</option>
                    <option value="Referral bonus">Referral bonus</option>
                    <option value="Compensation">Compensation</option>
                    <option value="Correction">Correction</option>
                    <option value="Expired points">Expired points</option>
                    <option value="Refund adjustment">Refund adjustment</option>
                    <option value="custom">Custom reason</option>
                  </select>
                </div>

                {adjustmentData.reason === 'custom' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Custom Reason</label>
                    <input
                      type="text"
                      value={adjustmentData.customReason}
                      onChange={(e) => setAdjustmentData(prev => ({ ...prev, customReason: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter custom reason"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                  <textarea
                    value={adjustmentData.notes}
                    onChange={(e) => setAdjustmentData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Additional notes about this adjustment"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={handleCloseAdjustPointsModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  disabled={adjustingPoints}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 rounded-md text-white font-medium ${
                    adjustmentData.adjustmentType === 'add' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  } disabled:opacity-50`}
                  disabled={adjustingPoints}
                >
                  {adjustingPoints ? 'Processing...' : `${adjustmentData.adjustmentType === 'add' ? 'Add' : 'Subtract'} Points`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Check-in History Modal */}
      {showCheckInHistory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Check-in History</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedUser?.fullName} - Total visits: {checkInHistory.length}
                </p>
              </div>
              <button
                onClick={closeCheckInHistoryModal}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {checkInHistoryLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : checkInHistory.length > 0 ? (
                <div className="space-y-3">
                  {checkInHistory.slice().reverse().map((visit, index) => {
                    const visitDate = new Date(visit.timestamp);
                    const michiganDate = visitDate.toLocaleString('en-US', {
                      timeZone: 'America/Detroit',
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    });
                    
                    return (
                      <div key={index} className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="text-sm font-semibold text-gray-900">
                                Visit #{checkInHistory.length - index}
                              </span>
                              {visit.checkedInBy === 'admin' && (
                                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                                  Admin Check-In
                                </span>
                              )}
                              {visit.checkedInBy === 'self' && (
                                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                  Self Check-In
                                </span>
                              )}
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm text-gray-700">
                                <span className="font-medium">Date:</span> {michiganDate}
                              </p>
                              <p className="text-xs text-gray-500">
                                Michigan Time (EST/EDT)
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="mt-4 text-gray-500">No check-in history found</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
              <div className="text-sm text-gray-600">
                {checkInHistory.length > 0 && (
                  <span>
                    Showing all {checkInHistory.length} visit{checkInHistory.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <button
                onClick={closeCheckInHistoryModal}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}