import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Sidebar from '@/components/sidebar';
import { 
  fetchAllRewardTasks, 
  createRewardTaskApi,
  updateRewardTaskApi,
  deleteRewardTaskApi,
  toggleRewardTaskVisibility,
  fetchHomepageSettings,
  updateHomepageSettings,
  toast 
} from '../service/service';
import Swal from 'sweetalert2';
import { Eye, EyeOff, Edit2, Trash2, Globe } from 'lucide-react';

const RewardTasksManagement = () => {
  const router = useRouter();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [homepageSettings, setHomepageSettings] = useState({
    rewardsSectionVisible: true,
    feedbackSectionVisible: true
  });
  const [formData, setFormData] = useState({
    taskId: '',
    title: '',
    description: '',
    reward: 1,
    isVisible: true,
    order: 0,
    visibilityType: 'all',
    assignedUsers: []
  });
  const [allUsers, setAllUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showUserSelectionModal, setShowUserSelectionModal] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userPagination, setUserPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 40
  });
  const [filteredUsers, setFilteredUsers] = useState([]);

  useEffect(() => {
    loadTasks();
    loadUsers();
  }, []);

  const loadUsers = async (page = 1, search = '') => {
    try {
      setLoadingUsers(true);
      const response = await fetch(`http://localhost:5000/api/users?page=${page}&limit=40&search=${search}&status=verified`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setAllUsers(data.data || []);
        setFilteredUsers(data.data || []);
        if (data.pagination) {
          setUserPagination(data.pagination);
        }
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleUserSearch = (query) => {
    setUserSearchQuery(query);
    loadUsers(1, query);
  };

  const handleUserPageChange = (page) => {
    loadUsers(page, userSearchQuery);
  };

  const handleOpenUserSelectionModal = () => {
    setShowUserSelectionModal(true);
    loadUsers(1, '');
  };

  const handleCloseUserSelectionModal = () => {
    setShowUserSelectionModal(false);
    setUserSearchQuery('');
  };

  const handleToggleUserSelection = (userId) => {
    const currentUsers = [...formData.assignedUsers];
    const index = currentUsers.indexOf(userId);
    
    if (index > -1) {
      currentUsers.splice(index, 1);
    } else {
      currentUsers.push(userId);
    }
    
    setFormData({ ...formData, assignedUsers: currentUsers });
  };

  const handleSelectAllUsers = () => {
    const allUserIds = filteredUsers.map(u => u._id);
    setFormData({ ...formData, assignedUsers: allUserIds });
  };

  const handleDeselectAllUsers = () => {
    setFormData({ ...formData, assignedUsers: [] });
  };

  useEffect(() => {
    const loadHomepageSettings = async () => {
      try {
        const response = await fetchHomepageSettings(router);
        if (response.success) {
          setHomepageSettings(response.data);
        }
      } catch (err) {
        console.error('Failed to load homepage settings:', err);
      }
    };
    loadHomepageSettings();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const response = await fetchAllRewardTasks(router);
      console.log('📥 Tasks response:', response);
      if (response.success) {
        console.log('📋 Tasks data:', response.data);
        console.log('📋 First task details:', response.data[0]);
        setTasks(response.data);
      }
    } catch (error) {
      console.error('❌ Error loading tasks:', error);
      toast.error('Error loading reward tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (task = null) => {
    if (task) {
      setEditingTask(task);
      setFormData({
        taskId: task.taskId,
        title: task.title,
        description: task.description || '',
        reward: task.reward,
        isVisible: task.isVisible,
        order: task.order || 0,
        visibilityType: task.visibilityType || 'all',
        assignedUsers: task.assignedUsers?.map(u => u._id || u) || []
      });
    } else {
      setEditingTask(null);
      setFormData({
        taskId: '',
        title: '',
        description: '',
        reward: 1,
        isVisible: true,
        order: 0,
        visibilityType: 'all',
        assignedUsers: []
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTask(null);
    setFormData({
      taskId: '',
      title: '',
      description: '',
      reward: 1,
      isVisible: true,
      order: 0,
      visibilityType: 'all',
      assignedUsers: []
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.taskId.trim() || !formData.title.trim()) {
      toast.error('Task ID and Title are required');
      return;
    }

    // Validation for specific users
    if (formData.visibilityType === 'specific' && formData.assignedUsers.length === 0) {
      toast.error('Please select at least one user for specific visibility');
      return;
    }

    console.log('📤 Submitting task data:', {
      ...formData,
      assignedUsersCount: formData.assignedUsers.length
    });

    try {
      setLoading(true);
      let response;
      
      if (editingTask) {
        response = await updateRewardTaskApi(editingTask._id, formData, router);
      } else {
        response = await createRewardTaskApi(formData, router);
      }

      if (response.success) {
        Swal.fire({
          title: 'Success!',
          text: `Task ${editingTask ? 'updated' : 'created'} successfully.`,
          icon: 'success',
          confirmButtonColor: '#10B981'
        });
        handleCloseModal();
        loadTasks();
      } else {
        toast.error(response.message || 'Failed to save task');
      }
    } catch (error) {
      console.error('Error saving task:', error);
      toast.error(error.message || 'An error occurred while saving the task');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVisibility = async (task) => {
    try {
      const response = await toggleRewardTaskVisibility(task._id, router);
      if (response.success) {
        toast.success(response.message);
        loadTasks();
      } else {
        toast.error(response.message || 'Failed to toggle visibility');
      }
    } catch (error) {
      console.error('Error toggling visibility:', error);
      toast.error('An error occurred while toggling visibility');
    }
  };

  const handleDelete = async (task) => {
    const result = await Swal.fire({
      title: 'Delete Task?',
      text: `Are you sure you want to delete "${task.title}"? This action cannot be undone.`,
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
      const response = await deleteRewardTaskApi(task._id, router);
      if (response.success) {
        Swal.fire({
          title: 'Deleted!',
          text: 'Task has been deleted successfully.',
          icon: 'success',
          confirmButtonColor: '#10B981'
        });
        loadTasks();
      } else {
        toast.error(response.message || 'Failed to delete task');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('An error occurred while deleting the task');
    }
  };

  const handleBulkVisibility = async (makeVisible) => {
    const action = makeVisible ? 'show' : 'hide';
    const result = await Swal.fire({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} All Tasks?`,
      text: `Are you sure you want to ${action} all ${tasks.length} tasks?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: makeVisible ? '#10B981' : '#EAB308',
      cancelButtonColor: '#6B7280',
      confirmButtonText: `Yes, ${action} all!`,
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      setLoading(true);
      let successCount = 0;
      let errorCount = 0;

      // Update each task's visibility
      for (const task of tasks) {
        if (task.isVisible !== makeVisible) {
          try {
            const response = await updateRewardTaskApi(task._id, { isVisible: makeVisible }, router);
            if (response.success) {
              successCount++;
            } else {
              errorCount++;
            }
          } catch (error) {
            errorCount++;
          }
        }
      }

      if (successCount > 0) {
        Swal.fire({
          title: 'Success!',
          text: `${successCount} task(s) ${action === 'show' ? 'shown' : 'hidden'} successfully${errorCount > 0 ? `, ${errorCount} failed` : ''}.`,
          icon: errorCount > 0 ? 'warning' : 'success',
          confirmButtonColor: '#10B981'
        });
        loadTasks();
      } else {
        toast.error('No tasks were updated');
      }
    } catch (error) {
      console.error('Error updating tasks:', error);
      toast.error('An error occurred while updating tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleShowHomepageSection = async (section) => {
    try {
      console.log(`🔄 Showing ${section} section...`);
      const payload = {
        [`${section}SectionVisible`]: true
      };
      console.log('📤 Sending payload:', payload);
      
      const response = await updateHomepageSettings(payload, router);
      console.log('📥 Response:', response);

      if (response.success) {
        toast.success(`${section.charAt(0).toUpperCase() + section.slice(1)} section shown successfully`);
        // Update local state instead of reloading
        const newSettings = {
          ...homepageSettings,
          [`${section}SectionVisible`]: true
        };
        console.log('✅ Updating local state to:', newSettings);
        setHomepageSettings(newSettings);
      } else {
        toast.error(response.message || `Failed to show ${section} section`);
      }
    } catch (error) {
      console.error(`❌ Error showing ${section} section:`, error);
      toast.error(`An error occurred while showing ${section} section`);
    }
  };

  const handleHideHomepageSection = async (section) => {
    try {
      console.log(`🔄 Hiding ${section} section...`);
      const payload = {
        [`${section}SectionVisible`]: false
      };
      console.log('📤 Sending payload:', payload);
      
      const response = await updateHomepageSettings(payload, router);
      console.log('📥 Response:', response);

      if (response.success) {
        toast.success(`${section.charAt(0).toUpperCase() + section.slice(1)} section hidden successfully`);
        // Update local state instead of reloading
        const newSettings = {
          ...homepageSettings,
          [`${section}SectionVisible`]: false
        };
        console.log('✅ Updating local state to:', newSettings);
        setHomepageSettings(newSettings);
      } else {
        toast.error(response.message || `Failed to hide ${section} section`);
      }
    } catch (error) {
      console.error(`❌ Error hiding ${section} section:`, error);
      toast.error(`An error occurred while hiding ${section} section`);
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Reward Tasks Management</h1>
              <p className="text-gray-600">Create and manage reward tasks for users</p>
            </div>
            <div className="flex gap-2">
              {/* Homepage Sections Toggle */}
              <div className="flex gap-2 mr-2 border-r pr-2">
                <button
                  onClick={() => homepageSettings.rewardsSectionVisible ? handleHideHomepageSection('rewards') : handleShowHomepageSection('rewards')}
                  className={`px-3 py-2 text-white text-sm rounded-md hover:opacity-80 transition-colors ${
                    homepageSettings.rewardsSectionVisible ? 'bg-green-600' : 'bg-gray-500'
                  }`}
                  title={`Rewards Section: ${homepageSettings.rewardsSectionVisible ? 'Visible' : 'Hidden'}`}
                >
                  {homepageSettings.rewardsSectionVisible ? '🎁 Rewards ON' : '🎁 Rewards OFF'}
                </button>
                <button
                  onClick={() => homepageSettings.feedbackSectionVisible ? handleHideHomepageSection('feedback') : handleShowHomepageSection('feedback')}
                  className={`px-3 py-2 text-white text-sm rounded-md hover:opacity-80 transition-colors ${
                    homepageSettings.feedbackSectionVisible ? 'bg-green-600' : 'bg-gray-500'
                  }`}
                  title={`Feedback Section: ${homepageSettings.feedbackSectionVisible ? 'Visible' : 'Hidden'}`}
                >
                  {homepageSettings.feedbackSectionVisible ? '💬 Feedback ON' : '💬 Feedback OFF'}
                </button>
              </div>

              {/* Bulk Visibility Toggle */}
              {tasks.length > 0 && (
                <button
                  onClick={() => {
                    const allVisible = tasks.every(t => t.isVisible);
                    handleBulkVisibility(!allVisible);
                  }}
                  className={`px-4 py-2 text-white rounded-md transition-colors ${
                    tasks.every(t => t.isVisible) 
                      ? 'bg-yellow-500 hover:bg-yellow-600' 
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                  disabled={loading}
                >
                  {tasks.every(t => t.isVisible) ? '👁️‍🗨️ Hide All Tasks' : '👁️ Show All Tasks'}
                </button>
              )}
              <button
                onClick={() => handleOpenModal()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                + Create New Task
              </button>
            </div>
          </div>

          {/* Tasks Grid */}
          <div className="w-full bg-white rounded-lg shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading tasks...</p>
              </div>
            ) : tasks.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500 mb-4">No reward tasks found</p>
                <button
                  onClick={() => handleOpenModal()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Create First Task
                </button>
              </div>
            ) : (
              <div className="w-full overflow-x-auto">
                <table className="w-full min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Task ID
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reward
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Assigned To
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tasks.map((task) => (
                      <tr key={task._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{task.taskId}</div>
                        </td>
                        <td className="px-6 py-4 max-w-xs">
                          <div className="text-sm font-medium text-gray-900">{task.title}</div>
                          {task.description && (
                            <div 
                              className="text-xs text-gray-500 mt-1 overflow-hidden" 
                              style={{
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                maxHeight: '2.5rem'
                              }}
                              title={task.description}
                            >
                              {task.description}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${task.reward}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {task.order}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              task.isVisible 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {task.isVisible ? 'Visible' : 'Hidden'}
                            </span>
                            {task.visibilityType === 'specific' && (
                              <span 
                                className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 cursor-help"
                                title={task.assignedUsers?.map(u => u.fullName || u.email || 'User').join(', ') || 'No users assigned'}
                              >
                                🎯 {task.assignedUsers?.length || 0} User(s)
                              </span>
                            )}
                            {task.visibilityType === 'all' && (
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                                All Users
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {task.visibilityType === 'all' ? (
                            <span className="text-xs text-gray-500 italic">All Users</span>
                          ) : task.visibilityType === 'specific' ? (
                            <div className="flex flex-col gap-1">
                              {task.assignedUsers && task.assignedUsers.length > 0 ? (
                                task.assignedUsers.slice(0, 3).map((user, idx) => (
                                  <span key={idx} className="text-xs text-gray-700">
                                    • {user.fullName || user.email || `User ${idx + 1}`}
                                  </span>
                                ))
                              ) : (
                                <span className="text-xs text-red-500">No users assigned!</span>
                              )}
                              {task.assignedUsers && task.assignedUsers.length > 3 && (
                                <span className="text-xs text-gray-500 italic">
                                  +{task.assignedUsers.length - 3} more
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-500">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleToggleVisibility(task)}
                              className={`p-1.5 rounded hover:bg-gray-100 transition-colors ${
                                task.isVisible 
                                  ? 'text-yellow-600 hover:text-yellow-700' 
                                  : 'text-green-600 hover:text-green-700'
                              }`}
                              title={task.isVisible ? 'Hide Task' : 'Show Task'}
                            >
                              {task.isVisible ? <Eye size={18} /> : <EyeOff size={18} />}
                            </button>
                            {task.visibilityType === 'specific' && (
                              <button
                                onClick={async () => {
                                  const result = await Swal.fire({
                                    title: 'Convert to All Users?',
                                    text: `This will make "${task.title}" visible to all users instead of specific users.`,
                                    icon: 'question',
                                    showCancelButton: true,
                                    confirmButtonColor: '#10B981',
                                    cancelButtonColor: '#6B7280',
                                    confirmButtonText: 'Yes, convert it!',
                                    cancelButtonText: 'Cancel'
                                  });
                                  if (result.isConfirmed) {
                                    try {
                                      const response = await updateRewardTaskApi(task._id, { 
                                        visibilityType: 'all',
                                        assignedUsers: []
                                      }, router);
                                      if (response.success) {
                                        toast.success('Task converted to all users!');
                                        loadTasks();
                                      }
                                    } catch (error) {
                                      toast.error('Failed to convert task');
                                    }
                                  }
                                }}
                                className="p-1.5 rounded hover:bg-gray-100 text-purple-600 hover:text-purple-700 transition-colors"
                                title="Convert to All Users"
                              >
                                <Globe size={18} />
                              </button>
                            )}
                            <button
                              onClick={() => handleOpenModal(task)}
                              className="p-1.5 rounded hover:bg-gray-100 text-blue-600 hover:text-blue-700 transition-colors"
                              title="Edit Task"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(task)}
                              className="p-1.5 rounded hover:bg-gray-100 text-red-600 hover:text-red-700 transition-colors"
                              title="Delete Task"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {editingTask ? 'Edit Reward Task' : 'Create New Reward Task'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Task ID *
                </label>
                <input
                  type="text"
                  value={formData.taskId}
                  onChange={(e) => setFormData({ ...formData, taskId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., join-groove, follow-ig"
                  disabled={!!editingTask}
                  required
                />
                {editingTask && (
                  <p className="text-xs text-gray-500 mt-1">Task ID cannot be changed</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Join Groove Group"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional description for the task"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reward Amount ($) *
                  </label>
                  <input
                    type="number"
                    value={formData.reward}
                    onChange={(e) => setFormData({ ...formData, reward: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

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
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isVisible"
                  checked={formData.isVisible}
                  onChange={(e) => setFormData({ ...formData, isVisible: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isVisible" className="ml-2 block text-sm text-gray-900">
                  Make this task visible to users
                </label>
              </div>

              {/* User Assignment Section */}
              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Task Visibility Type *
                </label>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="visibilityAll"
                      name="visibilityType"
                      value="all"
                      checked={formData.visibilityType === 'all'}
                      onChange={(e) => setFormData({ ...formData, visibilityType: e.target.value, assignedUsers: [] })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <label htmlFor="visibilityAll" className="ml-2 block text-sm text-gray-900">
                      Show to All Users
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="visibilitySpecific"
                      name="visibilityType"
                      value="specific"
                      checked={formData.visibilityType === 'specific'}
                      onChange={(e) => setFormData({ ...formData, visibilityType: e.target.value })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <label htmlFor="visibilitySpecific" className="ml-2 block text-sm text-gray-900">
                      Show to Specific Users Only
                    </label>
                  </div>
                </div>

                {/* User Selection */}
                {formData.visibilityType === 'specific' && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Users *
                    </label>
                    
                    <button
                      type="button"
                      onClick={handleOpenUserSelectionModal}
                      className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-md hover:border-blue-500 hover:bg-blue-50 transition-colors text-center"
                    >
                      <span className="text-blue-600 font-medium">
                        {formData.assignedUsers.length > 0 
                          ? `${formData.assignedUsers.length} User(s) Selected - Click to Modify`
                          : '+ Select Users from List'
                        }
                      </span>
                    </button>

                    {formData.assignedUsers.length > 0 && (
                      <div className="mt-3">
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-xs font-medium text-gray-700">Selected Users ({formData.assignedUsers.length}):</p>
                          <button
                            type="button"
                            onClick={handleDeselectAllUsers}
                            className="text-xs text-red-600 hover:text-red-800"
                          >
                            Clear All
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 bg-gray-50 rounded-md">
                          {formData.assignedUsers.map(userId => {
                            const user = allUsers.find(u => u._id === userId);
                            return user ? (
                              <span key={userId} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {user.fullName}
                                <button
                                  type="button"
                                  onClick={() => handleToggleUserSelection(userId)}
                                  className="ml-1 text-blue-600 hover:text-blue-800 font-bold"
                                >
                                  ×
                                </button>
                              </span>
                            ) : (
                              <span key={userId} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                User ID: {userId.slice(-6)}
                                <button
                                  type="button"
                                  onClick={() => handleToggleUserSelection(userId)}
                                  className="ml-1 text-gray-600 hover:text-gray-800 font-bold"
                                >
                                  ×
                                </button>
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
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
                  {loading ? 'Saving...' : editingTask ? 'Update Task' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Selection Modal */}
      {showUserSelectionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Select Users</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {formData.assignedUsers.length} user(s) selected
                </p>
              </div>
              <button
                onClick={handleCloseUserSelectionModal}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Search Bar */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={userSearchQuery}
                  onChange={(e) => handleUserSearch(e.target.value)}
                  placeholder="Search by name or email..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleSelectAllUsers}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 whitespace-nowrap"
                >
                  Select All
                </button>
                <button
                  onClick={handleDeselectAllUsers}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 whitespace-nowrap"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Users List */}
            <div className="flex-1 overflow-y-auto p-4">
              {loadingUsers ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No verified users found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredUsers.map(user => {
                    const isSelected = formData.assignedUsers.includes(user._id);
                    return (
                      <div
                        key={user._id}
                        onClick={() => handleToggleUserSelection(user._id)}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}}
                                className="h-4 w-4 text-blue-600 rounded"
                              />
                              <h4 className="text-sm font-medium text-gray-900 truncate">
                                {user.fullName}
                              </h4>
                            </div>
                            <p className="text-xs text-gray-500 mt-1 truncate ml-6">
                              {user.email}
                            </p>
                            {user.phone && (
                              <p className="text-xs text-gray-400 mt-0.5 ml-6">
                                {user.phone}
                              </p>
                            )}
                          </div>
                          {isSelected && (
                            <span className="ml-2 flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              Selected
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Pagination */}
            {userPagination.totalPages > 1 && (
              <div className="p-4 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-gray-700">
                    Showing {((userPagination.currentPage - 1) * userPagination.itemsPerPage) + 1} to{' '}
                    {Math.min(userPagination.currentPage * userPagination.itemsPerPage, userPagination.totalItems)} of{' '}
                    {userPagination.totalItems} users
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleUserPageChange(userPagination.currentPage - 1)}
                      disabled={userPagination.currentPage === 1}
                      className={`px-3 py-1.5 rounded border text-sm ${
                        userPagination.currentPage === 1 
                          ? 'text-gray-400 border-gray-200 cursor-not-allowed' 
                          : 'text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Previous
                    </button>
                    
                    {/* Page numbers */}
                    <div className="hidden sm:flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, userPagination.totalPages) }, (_, i) => {
                        let pageNum;
                        if (userPagination.currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (userPagination.currentPage >= userPagination.totalPages - 2) {
                          pageNum = userPagination.totalPages - 4 + i;
                        } else {
                          pageNum = userPagination.currentPage - 2 + i;
                        }
                        
                        if (pageNum > 0 && pageNum <= userPagination.totalPages) {
                          return (
                            <button
                              key={pageNum}
                              onClick={() => handleUserPageChange(pageNum)}
                              className={`w-8 h-8 flex items-center justify-center rounded text-sm ${
                                userPagination.currentPage === pageNum
                                  ? 'bg-blue-600 text-white'
                                  : 'text-gray-700 border border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        }
                        return null;
                      })}
                      
                      {/* Page dropdown for desktop */}
                      {userPagination.totalPages > 5 && (
                        <div className="relative ml-1">
                          <select
                            value={userPagination.currentPage}
                            onChange={(e) => handleUserPageChange(Number(e.target.value))}
                            className="appearance-none pl-2 pr-8 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          >
                            {Array.from({ length: userPagination.totalPages }, (_, i) => i + 1).map((pageNum) => (
                              <option key={pageNum} value={pageNum}>
                                Page {pageNum}
                              </option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Mobile page dropdown */}
                    <div className="sm:hidden">
                      <select
                        value={userPagination.currentPage}
                        onChange={(e) => handleUserPageChange(Number(e.target.value))}
                        className="block w-20 px-2 py-1 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      >
                        {Array.from({ length: userPagination.totalPages }, (_, i) => i + 1).map((pageNum) => (
                          <option key={pageNum} value={pageNum}>
                            {pageNum}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <button
                      onClick={() => handleUserPageChange(userPagination.currentPage + 1)}
                      disabled={userPagination.currentPage === userPagination.totalPages}
                      className={`px-3 py-1.5 rounded border text-sm ${
                        userPagination.currentPage === userPagination.totalPages
                          ? 'text-gray-400 border-gray-200 cursor-not-allowed'
                          : 'text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  {formData.assignedUsers.length} user(s) selected
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleCloseUserSelectionModal}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCloseUserSelectionModal}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RewardTasksManagement;
