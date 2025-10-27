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
  toggleRewardsSection,
  toggleFeedbackSection,
  toast 
} from '../service/service';
import Swal from 'sweetalert2';

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
    order: 0
  });

  useEffect(() => {
    loadTasks();
  }, []);

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
      if (response.success) {
        setTasks(response.data);
      }
    } catch (error) {
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
        order: task.order || 0
      });
    } else {
      setEditingTask(null);
      setFormData({
        taskId: '',
        title: '',
        description: '',
        reward: 1,
        isVisible: true,
        order: 0
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
      order: 0
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.taskId.trim() || !formData.title.trim()) {
      toast.error('Task ID and Title are required');
      return;
    }

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

  const handleToggleHomepageSection = async (section) => {
    try {
      let response;
      if (section === 'rewards') {
        response = await toggleRewardsSection(router);
      } else if (section === 'feedback') {
        response = await toggleFeedbackSection(router);
      } else {
        toast.error('Invalid section');
        return;
      }

      if (response.success) {
        toast.success(response.message);
        // Refresh the page to reflect changes
        window.location.reload();
      } else {
        toast.error(response.message || `Failed to toggle ${section} section`);
      }
    } catch (error) {
      console.error(`Error toggling ${section} section:`, error);
      toast.error(`An error occurred while toggling ${section} section`);
    }
  };

  const handleShowHomepageSection = async (section) => {
    try {
      const response = await updateHomepageSettings({
        [`${section}SectionVisible`]: true
      }, router);

      if (response.success) {
        toast.success(`${section.charAt(0).toUpperCase() + section.slice(1)} section shown successfully`);
        // Refresh the page to reflect changes
        window.location.reload();
      } else {
        toast.error(response.message || `Failed to show ${section} section`);
      }
    } catch (error) {
      console.error(`Error showing ${section} section:`, error);
      toast.error(`An error occurred while showing ${section} section`);
    }
  };

  const handleHideHomepageSection = async (section) => {
    try {
      const response = await updateHomepageSettings({
        [`${section}SectionVisible`]: false
      }, router);

      if (response.success) {
        toast.success(`${section.charAt(0).toUpperCase() + section.slice(1)} section hidden successfully`);
        // Refresh the page to reflect changes
        window.location.reload();
      } else {
        toast.error(response.message || `Failed to hide ${section} section`);
      }
    } catch (error) {
      console.error(`Error hiding ${section} section:`, error);
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
              {/* Homepage Section Toggle Buttons */}
              <div className="flex gap-1 mr-2">
                <button
                  onClick={() => homepageSettings.rewardsSectionVisible ? handleHideHomepageSection('rewards') : handleShowHomepageSection('rewards')}
                  className={`px-3 py-2 text-white text-sm rounded-md hover:opacity-80 transition-colors ${
                    homepageSettings.rewardsSectionVisible ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                  }`}
                  title={homepageSettings.rewardsSectionVisible ? 'Hide Rewards Section' : 'Show Rewards Section'}
                >
                  {homepageSettings.rewardsSectionVisible ? '👁️‍🗨️ Hide Rewards' : '👁️ Show Rewards'}
                </button>
                <button
                  onClick={() => homepageSettings.feedbackSectionVisible ? handleHideHomepageSection('feedback') : handleShowHomepageSection('feedback')}
                  className={`px-3 py-2 text-white text-sm rounded-md hover:opacity-80 transition-colors ${
                    homepageSettings.feedbackSectionVisible ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                  }`}
                  title={homepageSettings.feedbackSectionVisible ? 'Hide Feedback Section' : 'Show Feedback Section'}
                >
                  {homepageSettings.feedbackSectionVisible ? '👁️‍🗨️ Hide Feedback' : '👁️ Show Feedback'}
                </button>
              </div>

              {tasks.length > 0 && (
                <>
                  <button
                    onClick={() => handleBulkVisibility(false)}
                    className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors"
                    disabled={loading}
                  >
                    👁️‍🗨️ Hide All
                  </button>
                  <button
                    onClick={() => handleBulkVisibility(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    disabled={loading}
                  >
                    👁️ Show All
                  </button>
                </>
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
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{task.title}</div>
                          {task.description && (
                            <div className="text-xs text-gray-500 mt-1">{task.description}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${task.reward}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {task.order}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            task.isVisible 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {task.isVisible ? 'Visible' : 'Hidden'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-3">
                            <button
                              onClick={() => handleToggleVisibility(task)}
                              className={`${
                                task.isVisible 
                                  ? 'text-yellow-600 hover:text-yellow-900' 
                                  : 'text-green-600 hover:text-green-900'
                              }`}
                              title={task.isVisible ? 'Hide' : 'Show'}
                            >
                              {task.isVisible ? '👁️' : '👁️‍🗨️'}
                            </button>
                            <button
                              onClick={() => handleOpenModal(task)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(task)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
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
    </div>
  );
};

export default RewardTasksManagement;
