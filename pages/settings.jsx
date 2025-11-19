import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import Sidebar from '../components/sidebar';
import { fetchAdminProfile, updateAdminProfile } from '../service/service';
import { fetchShopSettings, updateShopSettings } from '../service/shopSettingsService';
import Swal from 'sweetalert2';
import LoginPageSetting from '@/components/loginPageSetting';

const daysOfWeek = [
  { id: 'monday', label: 'Monday' },
  { id: 'tuesday', label: 'Tuesday' },
  { id: 'wednesday', label: 'Wednesday' },
  { id: 'thursday', label: 'Thursday' },
  { id: 'friday', label: 'Friday' },
  { id: 'saturday', label: 'Saturday' },
  { id: 'sunday', label: 'Sunday' }
];

const AdminSettings = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  // Admin profile state
  const [adminData, setAdminData] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: 'admin'
  });

  // Profile form state
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Shop settings state
  const [shopSettings, setShopSettings] = useState({
    phone: '',
    timings: daysOfWeek.map(day => ({
      day: day.id,
      isOpen: true,
      openingTime: '09:00',
      closingTime: '18:00'
    }))
  });

  useEffect(() => {
    loadAdminProfile();
    loadShopSettings();
  }, []);

  const loadAdminProfile = async () => {
    setLoading(true);
    try {
      const response = await fetchAdminProfile(router);
      if (response.success) {
        setAdminData(response.data);
        setFormData({
          fullName: response.data.fullName || '',
          email: response.data.email || '',
          phone: response.data.phone || '',
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }
    } catch (error) {
      console.error('Error loading admin profile:', error);
      Swal.fire({
        title: 'Error!',
        text: 'Failed to load admin profile.',
        icon: 'error',
        confirmButtonColor: '#EF4444'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const loadShopSettings = async () => {
    try {
      const response = await fetchShopSettings(router);
      if (response.success) {
        setShopSettings(response.data);
      } else {
        throw new Error(response.message || 'Failed to load shop settings');
      }
    } catch (error) {
      console.error('Error loading shop settings:', error);
      Swal.fire({
        title: 'Error!',
        text: error.message || 'Failed to load shop settings.',
        icon: 'error',
        confirmButtonColor: '#EF4444'
      });
    }
  };

  const handleTimingChange = (index, field, value) => {
    const updatedTimings = [...shopSettings.timings];
    updatedTimings[index] = {
      ...updatedTimings[index],
      [field]: field === 'isOpen' ? !updatedTimings[index].isOpen : value
    };
    setShopSettings({
      ...shopSettings,
      timings: updatedTimings
    });
  };

  const handleShopPhoneChange = (e) => {
    setShopSettings({
      ...shopSettings,
      phone: e.target.value
    });
  };

  const handleSaveShopSettings = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await updateShopSettings(shopSettings, router);
      if (response.success) {
        Swal.fire({
          title: 'Success!',
          text: 'Shop settings updated successfully!',
          icon: 'success',
          confirmButtonColor: '#10B981'
        });
      } else {
        throw new Error(response.message || 'Failed to update shop settings');
      }
    } catch (error) {
      console.error('Error updating shop settings:', error);
      Swal.fire({
        title: 'Error!',
        text: error.message || 'Failed to update shop settings',
        icon: 'error',
        confirmButtonColor: '#EF4444'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate passwords if changing
    if (formData.newPassword) {
      if (formData.newPassword !== formData.confirmPassword) {
        Swal.fire({
          title: 'Error!',
          text: 'New passwords do not match.',
          icon: 'error',
          confirmButtonColor: '#EF4444'
        });
        return;
      }

      if (formData.newPassword.length < 6) {
        Swal.fire({
          title: 'Error!',
          text: 'New password must be at least 6 characters long.',
          icon: 'error',
          confirmButtonColor: '#EF4444'
        });
        return;
      }

      if (!formData.currentPassword) {
        Swal.fire({
          title: 'Error!',
          text: 'Current password is required to change password.',
          icon: 'error',
          confirmButtonColor: '#EF4444'
        });
        return;
      }
    }

    const confirmResult = await Swal.fire({
      title: 'Update Profile?',
      text: 'Are you sure you want to update your profile?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10B981',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, update it!',
      cancelButtonText: 'Cancel'
    });

    if (!confirmResult.isConfirmed) {
      return;
    }

    setSaving(true);
    try {
      const updateData = {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone
      };

      if (formData.newPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }

      const response = await updateAdminProfile(router, updateData);

      if (response.success) {
        Swal.fire({
          title: 'Success!',
          text: 'Profile updated successfully.',
          icon: 'success',
          confirmButtonColor: '#10B981'
        });

        // Reset password fields
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));

        // Reload profile data
        loadAdminProfile();
      } else {
        Swal.fire({
          title: 'Error!',
          text: response.message || 'Failed to update profile.',
          icon: 'error',
          confirmButtonColor: '#EF4444'
        });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Swal.fire({
        title: 'Error!',
        text: 'An error occurred while updating profile.',
        icon: 'error',
        confirmButtonColor: '#EF4444'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="flex min-h-screen bg-gray-100">
        <Sidebar />

        <div className="flex-1 ml-0 md:ml-20">
          <div className="p-8">
            {/* Header */}
            <h1 className="text-2xl font-semibold text-gray-800">Settings</h1>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`${activeTab === 'profile' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Profile
                </button>
                <button
                  onClick={() => setActiveTab('shop')}
                  className={`${activeTab === 'shop' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Shop Settings
                </button>

                <button
                  onClick={() => setActiveTab('page_setting')}
                  className={`${activeTab === 'page_setting' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Page Settings
                </button>
              </nav>
            </div>

            {activeTab === 'profile' && (
              <div className="max-w-5xl">
                {/* Profile Information Card */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile Information</h2>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Full Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Role (Read-only) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Role
                      </label>
                      <input
                        type="text"
                        value={adminData.role}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                        disabled
                      />
                    </div>

                    <hr className="my-6" />

                    {/* Password Change Section */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>
                      <p className="text-sm text-gray-600 mb-4">Leave blank if you don't want to change your password</p>

                      <div className="space-y-4">
                        {/* Current Password */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Current Password
                          </label>
                          <input
                            type="password"
                            name="currentPassword"
                            value={formData.currentPassword}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter current password"
                          />
                        </div>

                        {/* New Password */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            New Password
                          </label>
                          <input
                            type="password"
                            name="newPassword"
                            value={formData.newPassword}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter new password"
                          />
                        </div>

                        {/* Confirm New Password */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Confirm New Password
                          </label>
                          <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Confirm new password"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end pt-6">
                      <button
                        type="submit"
                        disabled={saving}
                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Account Information Card */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Information</h2>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Account Type:</span>
                      <span className="font-medium text-gray-900">Administrator</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Account Status:</span>
                      <span className="font-medium text-green-600">Active</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Login:</span>
                      <span className="font-medium text-gray-900">
                        {new Date().toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'shop' && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-6">Shop Settings</h2>

                <form onSubmit={handleSaveShopSettings}>
                  <div className="mb-6">
                    <label htmlFor="shop-phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Shop Phone Number
                    </label>
                    <input
                      type="tel"
                      id="shop-phone"
                      value={shopSettings.phone}
                      onChange={handleShopPhoneChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="+1234567890"
                      required
                    />
                  </div>

                  <div className="mb-6">
                    <h3 className="text-md font-medium text-gray-900 mb-4">Shop Timings</h3>
                    <div className="space-y-4">
                      {shopSettings.timings && shopSettings.timings.map((day, index) => (
                        <div key={day.day} className="flex items-center space-x-4">
                          <div className="w-24">
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                id={`day-${day.day}`}
                                checked={day.isOpen}
                                onChange={() => handleTimingChange(index, 'isOpen')}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <label htmlFor={`day-${day.day}`} className="ml-2 block text-sm text-gray-700">
                                {daysOfWeek.find(d => d.id === day.day)?.label || day.day}
                              </label>
                            </div>
                          </div>

                          <div className="flex-1 flex space-x-2">
                            <div className="flex-1">
                              <label htmlFor={`opening-${day.day}`} className="block text-xs text-gray-500 mb-1">
                                Opening
                              </label>
                              <input
                                type="time"
                                id={`opening-${day.day}`}
                                value={day.openingTime || ''}
                                onChange={(e) => handleTimingChange(index, 'openingTime', e.target.value)}
                                disabled={!day.isOpen}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                                required={day.isOpen}
                              />
                            </div>
                            <div className="flex-1">
                              <label htmlFor={`closing-${day.day}`} className="block text-xs text-gray-500 mb-1">
                                Closing
                              </label>
                              <input
                                type="time"
                                id={`closing-${day.day}`}
                                value={day.closingTime || ''}
                                onChange={(e) => handleTimingChange(index, 'closingTime', e.target.value)}
                                disabled={!day.isOpen}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                                required={day.isOpen}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'page_setting' && <div>
              <LoginPageSetting />
            </div>}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminSettings;
