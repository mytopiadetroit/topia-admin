import axios from "axios";


// const ConstantsUrl = typeof window !== 'undefined' && window.location.host.includes('localhost')
//   ? "http://localhost:5000/api/"
//   : "https://api.mypsyguide.io/api/";

        // const ConstantsUrl = "http://localhost:5000/api/";
         const ConstantsUrl = "https://api.mypsyguide.io/api/";

let isRedirecting = false;


function Api(method, url, data, router, params) {
  return new Promise(function (resolve, reject) {
    if (isRedirecting) {
      resolve({ success: false, redirect: true });
      return;
    }

    let token = "";
    if (typeof window !== "undefined") {
      token = localStorage?.getItem("adminToken") || localStorage?.getItem("token") || "";
    }

    axios({
      method,
      url: ConstantsUrl + url,
      data,
      headers: { Authorization: `jwt ${token}` },
      params
    }).then(
      (res) => {
        resolve(res.data);
      },
      (err) => {
        if (err.response) {
          if (err?.response?.status === 401) {
            if (typeof window !== "undefined") {
              handleTokenExpiration(router);
              return resolve({ success: false, redirect: true });
            }
          }
          reject(err.response.data);
        } else {
          reject(err);
        }
      }
    );
  });
}

// ApiFormData function for making API calls with FormData
function ApiFormData(method, url, data, router, params) {
  return new Promise(function (resolve, reject) {
    if (isRedirecting) {
      resolve({ success: false, redirect: true });
      return;
    }

    let token = "";
    if (typeof window !== "undefined") {
      token = localStorage?.getItem("adminToken") || localStorage?.getItem("token") || "";
    }

    axios({
      method,
      url: ConstantsUrl + url,
      data,
      headers: {
        Authorization: `jwt ${token}`,
        'Content-Type': 'multipart/form-data'
      },
      params
    }).then(
      (res) => {
        resolve(res.data);
      },
      (err) => {
        if (err.response) {
          if (err?.response?.status === 401) {
            if (typeof window !== "undefined") {
              handleTokenExpiration(router);
              return resolve({ success: false, redirect: true });
            }
          }
          reject(err.response.data);
        } else {
          reject(err);
        }
      }
    );
  });
}

// Axios interceptor for global error handling
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401 && typeof window !== "undefined") {
      if (!isRedirecting) {
        isRedirecting = true;

        if (typeof window !== "undefined") {
          localStorage.removeItem("adminDetail");
          localStorage.removeItem("adminToken");
          window.location.href = "/";
          window.dispatchEvent(new Event('storage'));
          document.dispatchEvent(new Event('auth-state-changed'));

          if (window.router && !window.router.pathname.includes("login")) {
            window.router.push("/");
          } else {
            window.location.href = "/";
          }
        }

        setTimeout(() => {
          isRedirecting = false;
        }, 2000);
      }

      return Promise.resolve({
        data: { success: false, redirect: true }
      });
    }
    return Promise.reject(error);
  }
);

function notifyAuthChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event('storage'));
    document.dispatchEvent(new Event('auth-state-changed'));
  }
}

const handleTokenExpiration = (router) => {
  if (isRedirecting) return true;

  console.log("Token expired, logging out user...");
  isRedirecting = true;

  try {
    if (typeof window !== "undefined") {
      localStorage.removeItem("adminDetail");
      localStorage.removeItem("adminToken");

      notifyAuthChange();

      if (router && !router.pathname.includes("login")) {
        router.push("/");
      }
    }

    setTimeout(() => {
      isRedirecting = false;
    }, 2000);

    return true;
  } catch (error) {
    console.error("Error during logout:", error);
    isRedirecting = false;
    return false;
  }
};

const timeSince = (date) => {
  date = new Date(date);
  const diff = new Date().valueOf() - date.valueOf();
  const seconds = Math.floor(diff / 1000);
  var interval = seconds / 31536000;

  if (interval > 1) {
    return Math.floor(interval) + " Years";
  }
  interval = seconds / 2592000;
  if (interval > 1) {
    return (
      Math.floor(interval) +
      (Math.floor(interval) > 1 ? " Months" : " Month") +
      " ago"
    );
  }
  interval = seconds / 604800;
  if (interval > 1) {
    return (
      Math.floor(interval) +
      (Math.floor(interval) > 1 ? " Weeks" : " Week") +
      " ago"
    );
  }

  interval = seconds / 86400;
  if (interval > 1) {
    return (
      Math.floor(interval) +
      (Math.floor(interval) > 1 ? " Days" : " Day") +
      " ago"
    );
  }
  interval = seconds / 3600;
  if (interval > 1) {
    return (
      Math.floor(interval) +
      (Math.floor(interval) > 1 ? " Hours" : " Hour") +
      " ago"
    );
  }
  interval = seconds / 60;
  if (interval > 1) {
    return (
      Math.floor(interval) +
      (Math.floor(interval) > 1 ? " Min" : " min") +
      " ago"
    );
  }
  return "Just now";
};

// Helper function to fetch all categories
const fetchAllCategories = async (router) => {
  try {
    return await Api('get', 'categories/categories', null, router);
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

// Helper function to fetch products by category
const fetchProductsByCategory = async (categoryId, router, page, limit) => {
  try {
    return await Api('get', `products/category/paginated/${categoryId}?page=${page}&limit=${limit}&includeInactive=true`, null, router);
  } catch (error) {
    console.error('Error fetching products by category:', error);
    throw error;
  }
};

// Helper function to create product (multipart/form-data)
const createProduct = async (formData, router) => {
  try {
    return await ApiFormData('post', 'products', formData, router);
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
};

// Helper function to update product (multipart/form-data)
const updateProductApi = async (id, formData, router) => {
  try {
    return await ApiFormData('put', `products/${id}`, formData, router);
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

// Helper function to delete product
const deleteProduct = async (id, router) => {
  try {
    return await Api('delete', `products/${id}`, null, router);
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};

// Helper function to toggle product active/inactive status
const toggleProductStatus = async (productId, router) => {
  try {
    return await Api('patch', `products/${productId}/toggle-status`, null, router);
  } catch (error) {
    console.error('Error toggling product status:', error);
    throw error;
  }
};

// Helper function to fetch all users (supports pagination params)
const fetchAllUsers = async (router, params = {}) => {
  try {
    // params: { page, limit, search, role }
    return await Api('get', 'users', null, router, params);
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

// Helper function to fetch user by ID
const fetchUserById = async (id, router) => {
  try {
    return await Api('get', `users/${id}`, null, router);
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
};

// Helper function to update user
const updateUser = (id, userData, router) => {
  return Api('put', `users/${id}`, userData, router);
};

// Helper function to delete user
const deleteUser = async (id, router) => {
  try {
    return await Api('delete', `users/${id}`, null, router);
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

// Orders helpers (admin)
const fetchAllOrders = async (router, params = {}) => {
  try {
    return await Api('get', 'admin/orders', null, router, params);
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }
};

const updateOrderStatusApi = async (orderId, status, router) => {
  try {
    return await Api('put', `admin/orders/${orderId}/status`, { status }, router);
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
};

const archiveOrderApi = async (orderId, router) => {
  try {
    return await Api('put', `admin/orders/${orderId}/archive`, null, router);
  } catch (error) {
    console.error('Error archiving order:', error);
    throw error;
  }
};

const unarchiveOrderApi = async (orderId, router) => {
  try {
    return await Api('put', `admin/orders/${orderId}/unarchive`, null, router);
  } catch (error) {
    console.error('Error unarchiving order:', error);
    throw error;
  }
};

const fetchArchivedOrders = async (router, params = {}) => {
  try {
    const queryParams = new URLSearchParams(params).toString();
    return await Api('get', `admin/orders/archived/all?${queryParams}`, null, router);
  } catch (error) {
    console.error('Error fetching archived orders:', error);
    throw error;
  }
};

// Toast notification function
const toast = {
  success: (message) => {
    if (typeof window !== "undefined" && window.toast) {
      window.toast({ type: "success", message });
    }
  },
  error: (message) => {
    if (typeof window !== "undefined" && window.toast) {
      window.toast({ type: "error", message });
    }
  },
  info: (message) => {
    if (typeof window !== "undefined" && window.toast) {
      window.toast({ type: "info", message });
    }
  }
};

// Set global toast function
const setGlobalToast = (toastFunction) => {
  if (typeof window !== "undefined") {
    window.toast = toastFunction;
  }
};

// Set global router function
const setGlobalRouter = (routerInstance) => {
  if (typeof window !== "undefined") {
    window.router = routerInstance;
  }
};


// Admin stats helpers
const fetchLoginStatsLast7 = async (router) => {
  try {
    return await Api('get', 'users/admin/login-stats/last7', null, router);
  } catch (error) {
    console.error('Error fetching login stats:', error);
    throw error;
  }
};

// Admin stats helpers with range param: weekly | monthly | yearly
const fetchLoginStats = async (router, range = 'weekly') => {
  try {
    return await Api('get', 'users/admin/login-stats', null, router, { range });
  } catch (error) {
    console.error('Error fetching login stats:', error);
    throw error;
  }
};

// Reviews helpers (admin) — manage simple options (label + emoji)
const fetchAllReviews = async (router, params = {}) => {
  try {
    return await Api('get', 'reviews', null, router, params);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    throw error;
  }
};

const createReviewApi = async (data, router) => {
  try {
    return await Api('post', 'reviews', data, router);
  } catch (error) {
    console.error('Error creating review:', error);
    throw error;
  }
};

const updateReviewApi = async (id, data, router) => {
  try {
    return await Api('put', `reviews/${id}`, data, router);
  } catch (error) {
    console.error('Error updating review:', error);
    throw error;
  }
};

const deleteReviewApi = async (id, router) => {
  try {
    return await Api('delete', `reviews/${id}`, null, router);
  } catch (error) {
    console.error('Error deleting review:', error);
    throw error;
  }
};

// Review Tags helpers (separate module)
const fetchAllReviewTags = async (router, params = {}) => {
  try {
    return await Api('get', 'review-tags', null, router, params);
  } catch (error) {
    console.error('Error fetching review tags:', error);
    throw error;
  }
};

const createReviewTagApi = async (data, router) => {
  try {
    return await Api('post', 'review-tags', data, router);
  } catch (error) {
    console.error('Error creating review tag:', error);
    throw error;
  }
};

const updateReviewTagApi = async (id, data, router) => {
  try {
    return await Api('put', `review-tags/${id}`, data, router);
  } catch (error) {
    console.error('Error updating review tag:', error);
    throw error;
  }
};

const deleteReviewTagApi = async (id, router) => {
  try {
    return await Api('delete', `review-tags/${id}`, null, router);
  } catch (error) {
    console.error('Error deleting review tag:', error);
    throw error;
  }
};

// Members/Subscribers helpers (admin)
const fetchSubscribers = async (router, params = {}) => {
  try {
    return await Api('get', 'subscribers', null, router, params);
  } catch (error) {
    console.error('Error fetching subscribers:', error);
    throw error;
  }
};

// Update user status (admin)
const updateUserStatusAdmin = async (id, status, router, suspensionReason = '') => {
  try {
    return await Api('put', `users/${id}/status`, { 
      status,
      suspensionReason,
      forceUpdateSession: true  // This will force the backend to update the user's session
    }, router);
  } catch (error) {
    console.error('Error updating user status:', error);
    throw error;
  }
};

// Products helpers
const fetchAllProducts = async (router, params = {}) => {
  try {
    return await Api('get', 'products', null, router, params);
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

// Helper function to fetch all products without pagination
const fetchAllProductsNoPagination = async (router) => {
  try {
    return await Api('get', 'products/all-no-pagination', null, router);
  } catch (error) {
    console.error('Error fetching all products:', error);
    throw error;
  }
};

// Reward Management helpers (admin)
const fetchAllRewardRequests = async (router, params = {}) => {
  try {
    return await Api('get', 'rewards/admin/requests', null, router, params);
  } catch (error) {
    console.error('Error fetching reward requests:', error);
    throw error;
  }
};

const updateRewardStatus = async (id, data, router) => {
  try {
    return await Api('put', `rewards/admin/requests/${id}`, data, router);
  } catch (error) {
    console.error('Error updating reward status:', error);
    throw error;
  }
};

const fetchRewardStats = async (router) => {
  try {
    return await Api('get', 'rewards/admin/stats', null, router);
  } catch (error) {
    console.error('Error fetching reward stats:', error);
    throw error;
  }
};

// Admin Profile APIs
const fetchAdminProfile = async (router) => {
  try {
    return await Api('get', 'admin/profile', null, router);
  } catch (error) {
    console.error('Error fetching admin profile:', error);
    throw error;
  }
};

const updateAdminProfile = async (router, profileData) => {
  try {
    return await Api('put', 'admin/profile', profileData, router);
  } catch (error) {
    console.error('Error updating admin profile:', error);
    throw error;
  }
};

// Content Management helpers (admin)
const fetchAllContent = async (router, params = {}) => {
  try {
    return await Api('get', 'content/admin', null, router, params);
  } catch (error) {
    console.error('Error fetching content:', error);
    throw error;
  }
};

const fetchContentById = async (id, router) => {
  try {
    return await Api('get', `content/admin/${id}`, null, router);
  } catch (error) {
    console.error('Error fetching content:', error);
    throw error;
  }
};

const createContentApi = async (formData, router) => {
  try {
    return await ApiFormData('post', 'content/admin', formData, router);
  } catch (error) {
    console.error('Error creating content:', error);
    throw error;
  }
};

const updateContentApi = async (id, formData, router) => {
  try {
    return await ApiFormData('put', `content/admin/${id}`, formData, router);
  } catch (error) {
    console.error('Error updating content:', error);
    throw error;
  }
};

const deleteContentApi = async (id, router) => {
  try {
    return await Api('delete', `content/admin/${id}`, null, router);
  } catch (error) {
    console.error('Error deleting content:', error);
    throw error;
  }
};

const fetchContentStats = async (router) => {
  try {
    return await Api('get', 'content/admin/stats', null, router);
  } catch (error) {
    console.error('Error fetching content stats:', error);
    throw error;
  }
};

const fetchContentCategories = async (router) => {
  try {
    return await Api('get', 'content/categories', null, router);
  } catch (error) {
    console.error('Error fetching content categories:', error);
    throw error;
  }
};

// Activity tracking helpers
const fetchTodayRegistrations = async (router, params = {}) => {
  try {
    const queryParams = new URLSearchParams(params).toString();
    return await Api('get', `users/admin/today-registrations?${queryParams}`, null, router);
  } catch (error) {
    console.error('Error fetching today registrations:', error);
    throw error;
  }
};

const fetchTodayLogins = async (router, params = {}) => {
  try {
    const queryParams = new URLSearchParams(params).toString();
    return await Api('get', `users/admin/today-logins?${queryParams}`, null, router);
  } catch (error) {
    console.error('Error fetching today logins:', error);
    throw error;
  }
};

const fetchRegistrationsByDate = async (router, startDate, endDate, params = {}) => {
  try {
    const queryParams = new URLSearchParams({ startDate, endDate, ...params }).toString();
    return await Api('get', `users/admin/registrations-by-date?${queryParams}`, null, router);
  } catch (error) {
    console.error('Error fetching registrations by date:', error);
    throw error;
  }
};

const fetchLoginsByDate = async (router, startDate, endDate, params = {}) => {
  try {
    const queryParams = new URLSearchParams({ startDate, endDate, ...params }).toString();
    return await Api('get', `users/admin/logins-by-date?${queryParams}`, null, router);
  } catch (error) {
    console.error('Error fetching logins by date:', error);
    throw error;
  }
};

const fetchPendingVerificationsCount = async (router) => {
  try {
    return await Api('get', 'users/admin/pending-verifications-count', null, router);
  } catch (error) {
    console.error('Error fetching pending verifications count:', error);
    throw error;
  }
};

// Reward Task Management helpers (admin)
const fetchAllRewardTasks = async (router) => {
  try {
    return await Api('get', 'rewards/admin/tasks', null, router);
  } catch (error) {
    console.error('Error fetching reward tasks:', error);
    throw error;
  }
};

const createRewardTaskApi = async (data, router) => {
  try {
    return await Api('post', 'rewards/admin/tasks', data, router);
  } catch (error) {
    console.error('Error creating reward task:', error);
    throw error;
  }
};

const updateRewardTaskApi = async (id, data, router) => {
  try {
    return await Api('put', `rewards/admin/tasks/${id}`, data, router);
  } catch (error) {
    console.error('Error updating reward task:', error);
    throw error;
  }
};

const deleteRewardTaskApi = async (id, router) => {
  try {
    return await Api('delete', `rewards/admin/tasks/${id}`, null, router);
  } catch (error) {
    console.error('Error deleting reward task:', error);
    throw error;
  }
};

const toggleRewardTaskVisibility = async (id, router) => {
  try {
    return await Api('patch', `rewards/admin/tasks/${id}/toggle-visibility`, null, router);
  } catch (error) {
    console.error('Error toggling task visibility:', error);
    throw error;
  }
};

// stting management (admin)
const fetchAllsettingImages = async (router, page) => {
  try {
    return await Api('get', `setting/admin/pageimage/all?pagename=${page}`, null, router);
  } catch (error) {
    console.error('Error fetching gallery images:', error);
    throw error;
  }
};

const uploadSettingImage = async (formData, router) => {
  try {
    return await ApiFormData('post', 'setting/admin/pageimage/upload', formData, router);
  } catch (error) {
    console.error('Error uploading gallery image:', error);
    throw error;
  }
};

const updateSettingImage = async (id, formData, router) => {
  try {
    return await ApiFormData('put', `setting/admin/pageimage/${id}`, formData, router);
  } catch (error) {
    console.error('Error updating gallery image:', error);
    throw error;
  }
};

const deleteSettingImage = async (id, router) => {
  try {
    return await Api('delete', `setting/admin/pageimage/${id}`, null, router);
  } catch (error) {
    console.error('Error deleting setting image:', error);
    throw error;
  }
};

// Homepage Images Management (admin)
const fetchAllHomepageImages = async (router, section) => {
  try {
    const url = section ? `homepage-images/admin/all?section=${section}` : 'homepage-images/admin/all';
    return await Api('get', url, null, router);
  } catch (error) {
    console.error('Error fetching homepage images:', error);
    throw error;
  }
};

const uploadHomepageImage = async (formData, router) => {
  try {
    return await ApiFormData('post', 'homepage-images/admin/upload', formData, router);
  } catch (error) {
    console.error('Error uploading homepage image:', error);
    throw error;
  }
};

const updateHomepageImage = async (id, formData, router) => {
  try {
    return await ApiFormData('put', `homepage-images/admin/${id}`, formData, router);
  } catch (error) {
    console.error('Error updating homepage image:', error);
    throw error;
  }
};

const deleteHomepageImage = async (id, router) => {
  try {
    return await Api('delete', `homepage-images/admin/${id}`, null, router);
  } catch (error) {
    console.error('Error deleting homepage image:', error);
    throw error;
  }
};

// Visitors Management (admin)
const fetchAllVisitors = async (router, params = {}) => {
  try {
    const queryParams = new URLSearchParams(params).toString();
    return await Api('get', `visitors/admin/all?${queryParams}`, null, router);
  } catch (error) {
    console.error('Error fetching visitors:', error);
    throw error;
  }
};

const archiveVisitor = async (id, router) => {
  try {
    return await Api('put', `visitors/admin/${id}/archive`, null, router);
  } catch (error) {
    console.error('Error archiving visitor:', error);
    throw error;
  }
};

const unarchiveVisitor = async (id, router) => {
  try {
    return await Api('put', `visitors/admin/${id}/unarchive`, null, router);
  } catch (error) {
    console.error('Error unarchiving visitor:', error);
    throw error;
  }
};

const fetchArchivedVisitors = async (router, params = {}) => {
  try {
    const queryParams = new URLSearchParams(params).toString();
    return await Api('get', `visitors/admin/archived/all?${queryParams}`, null, router);
  } catch (error) {
    console.error('Error fetching archived visitors:', error);
    throw error;
  }
};

const adminCheckInUser = async (userId, router) => {
  try {
    return await Api('post', `visitors/admin/checkin/${userId}`, null, router);
  } catch (error) {
    console.error('Error checking in user:', error);
    throw error;
  }
};

const fetchVisitorByPhone = async (phone, router) => {
  try {
    return await Api('get', 'visitors/admin/all', null, router, { search: phone });
  } catch (error) {
    console.error('Error fetching visitor by phone:', error);
    throw error;
  }
};

const fetchVisitorByUserId = async (userId, router) => {
  try {
    return await Api('get', `visitors/admin/user/${userId}`, null, router);
  } catch (error) {
    console.error('Error fetching visitor by user ID:', error);
    throw error;
  }
};

// Export customers data to Excel
const exportCustomersData = async (router) => {
  try {
    let token = "";
    if (typeof window !== "undefined") {
      token = localStorage?.getItem("adminToken") || localStorage?.getItem("token") || "";
    }

    const response = await axios({
      method: 'get',
      url: ConstantsUrl + 'admin/export-customers',
      headers: { Authorization: `jwt ${token}` },
      responseType: 'blob' // Important for file download
    });

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.download = `Shroomtopia_Customers_${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return { success: true };
  } catch (error) {
    console.error('Error exporting customers data:', error);
    throw error;
  }
};

// Gallery Management helpers (admin)
const fetchAllGalleryImages = async (router) => {
  try {
    return await Api('get', 'gallery/admin/all', null, router);
  } catch (error) {
    console.error('Error fetching gallery images:', error);
    throw error;
  }
};

const uploadGalleryImage = async (formData, router) => {
  try {
    return await ApiFormData('post', 'gallery/admin/upload', formData, router);
  } catch (error) {
    console.error('Error uploading gallery image:', error);
    throw error;
  }
};

const updateGalleryImage = async (id, formData, router) => {
  try {
    return await ApiFormData('put', `gallery/admin/${id}`, formData, router);
  } catch (error) {
    console.error('Error updating gallery image:', error);
    throw error;
  }
};

const deleteGalleryImage = async (id, router) => {
  try {
    return await Api('delete', `gallery/admin/${id}`, null, router);
  } catch (error) {
    console.error('Error deleting gallery image:', error);
    throw error;
  }
};

const toggleGalleryImageStatus = async (id, router) => {
  try {
    return await Api('patch', `gallery/admin/${id}/toggle`, null, router);
  } catch (error) {
    console.error('Error toggling gallery image status:', error);
    throw error;
  }
};

// Homepage Settings helpers (admin)
const fetchHomepageSettings = async (router) => {
  try {
    return await Api('get', 'homepage-settings', null, router);
  } catch (error) {
    console.error('Error fetching homepage settings:', error);
    throw error;
  }
};

const updateHomepageSettings = async (data, router) => {
  try {
    return await Api('put', 'homepage-settings', data, router);
  } catch (error) {
    console.error('Error updating homepage settings:', error);
    throw error;
  }
};

const toggleRewardsSection = async (router) => {
  try {
    return await Api('put', 'homepage-settings/toggle-rewards', null, router);
  } catch (error) {
    console.error('Error toggling rewards section:', error);
    throw error;
  }
};

const toggleFeedbackSection = async (router) => {
  try {
    return await Api('put', 'homepage-settings/toggle-feedback', null, router);
  } catch (error) {
    console.error('Error toggling feedback section:', error);
    throw error;
  }
};

// Analytics API functions
const fetchReturningCustomers = async (router, period = 30) => {
  try {
    return await Api('get', 'analytics/returning-customers', null, router, { period });
  } catch (error) {
    console.error('Error fetching returning customers:', error);
    throw error;
  }
};

const fetchSalesComparison = async (router) => {
  try {
    return await Api('get', 'analytics/sales-comparison', null, router);
  } catch (error) {
    console.error('Error fetching sales comparison:', error);
    throw error;
  }
};

const fetchTopSellingProducts = async (router, limit = 10, period = 30) => {
  try {
    return await Api('get', 'analytics/top-selling-products', null, router, { limit, period });
  } catch (error) {
    console.error('Error fetching top selling products:', error);
    throw error;
  }
};

const fetchRevenueAnalytics = async (router, period = 30) => {
  try {
    return await Api('get', 'analytics/revenue', null, router, { period });
  } catch (error) {
    console.error('Error fetching revenue analytics:', error);
    throw error;
  }
};

const fetchCustomerGrowth = async (router, period = 30) => {
  try {
    return await Api('get', 'analytics/customer-growth', null, router, { period });
  } catch (error) {
    console.error('Error fetching customer growth:', error);
    throw error;
  }
};

// Deals Management helpers (admin)
const fetchAllDeals = async (router) => {
  try {
    return await Api('get', 'deals', null, router);
  } catch (error) {
    console.error('Error fetching deals:', error);
    throw error;
  }
};

const fetchDealById = async (id, router) => {
  try {
    return await Api('get', `deals/${id}`, null, router);
  } catch (error) {
    console.error('Error fetching deal:', error);
    throw error;
  }
};

const createDealApi = async (formData, router) => {
  try {
    return await ApiFormData('post', 'deals', formData, router);
  } catch (error) {
    console.error('Error creating deal:', error);
    throw error;
  }
};

const updateDealApi = async (id, formData, router) => {
  try {
    return await ApiFormData('put', `deals/${id}`, formData, router);
  } catch (error) {
    console.error('Error updating deal:', error);
    throw error;
  }
};

const deleteDealApi = async (id, router) => {
  try {
    return await Api('delete', `deals/${id}`, null, router);
  } catch (error) {
    console.error('Error deleting deal:', error);
    throw error;
  }
};

// SMS Notification helpers (admin)
const sendBulkSMSApi = async (data, router) => {
  try {
    return await Api('post', 'sms/send-bulk', data, router);
  } catch (error) {
    console.error('Error sending bulk SMS:', error);
    throw error;
  }
};

const fetchSMSHistory = async (router, params = {}) => {
  try {
    return await Api('get', 'sms/history', null, router, params);
  } catch (error) {
    console.error('Error fetching SMS history:', error);
    throw error;
  }
};

const fetchSMSDetails = async (id, router) => {
  try {
    return await Api('get', `sms/${id}`, null, router);
  } catch (error) {
    console.error('Error fetching SMS details:', error);
    throw error;
  }
};

const fetchSMSStats = async (router) => {
  try {
    return await Api('get', 'sms/stats/overview', null, router);
  } catch (error) {
    console.error('Error fetching SMS stats:', error);
    throw error;
  }
};

const previewSMSRecipients = async (data, router) => {
  try {
    return await Api('post', 'sms/preview-recipients', data, router);
  } catch (error) {
    console.error('Error previewing SMS recipients:', error);
    throw error;
  }
};

// Birthday SMS helpers
const sendBirthdaySMSManually = async (router) => {
  try {
    return await Api('post', 'sms/send-birthday-manual', null, router);
  } catch (error) {
    console.error('Error sending birthday SMS:', error);
    throw error;
  }
};

const previewBirthdayUsers = async (router) => {
  try {
    return await Api('get', 'sms/preview-birthday-users', null, router);
  } catch (error) {
    console.error('Error previewing birthday users:', error);
    throw error;
  }
};

const debugBirthdayData = async (router) => {
  try {
    return await Api('get', 'sms/debug-birthday-data', null, router);
  } catch (error) {
    console.error('Error debugging birthday data:', error);
    throw error;
  }
};

// Individual SMS helpers
const searchUsersForSMS = async (search, router) => {
  try {
    return await Api('get', 'sms/search-users', null, router, { search });
  } catch (error) {
    console.error('Error searching users:', error);
    throw error;
  }
};

const sendIndividualSMS = async (data, router) => {
  try {
    return await Api('post', 'sms/send-individual', data, router);
  } catch (error) {
    console.error('Error sending individual SMS:', error);
    throw error;
  }
};

// SMS Reply helpers
const fetchSMSReplies = async (router, params = {}) => {
  try {
    return await Api('get', 'sms-replies', null, router, params);
  } catch (error) {
    console.error('Error fetching SMS replies:', error);
    throw error;
  }
};

const fetchSMSReplyStats = async (router) => {
  try {
    return await Api('get', 'sms-replies/stats', null, router);
  } catch (error) {
    console.error('Error fetching SMS reply stats:', error);
    throw error;
  }
};

const respondToSMSReply = async (replyId, message, router) => {
  try {
    return await Api('post', `sms-replies/${replyId}/respond`, { message }, router);
  } catch (error) {
    console.error('Error responding to SMS reply:', error);
    throw error;
  }
};

const updateSMSReplyStatus = async (replyId, status, router) => {
  try {
    return await Api('patch', `sms-replies/${replyId}/status`, { status }, router);
  } catch (error) {
    console.error('Error updating SMS reply status:', error);
    throw error;
  }
};

const fetchSMSReplyDetails = async (replyId, router) => {
  try {
    return await Api('get', `sms-replies/${replyId}`, null, router);
  } catch (error) {
    console.error('Error fetching SMS reply details:', error);
    throw error;
  }
};

const fetchAllSubscriptions = async (router, params = {}) => {
  try {
    return await Api('get', 'subscriptions/admin/all', null, router, params);
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    throw error;
  }
};

const fetchSubscriptionSettings = async (router) => {
  try {
    return await Api('get', 'subscriptions/settings', null, router);
  } catch (error) {
    console.error('Error fetching subscription settings:', error);
    throw error;
  }
};

const updateSubscriptionSettings = async (data, router) => {
  try {
    return await Api('put', 'subscriptions/settings', data, router);
  } catch (error) {
    console.error('Error updating subscription settings:', error);
    throw error;
  }
};

const fetchSubscriptionById = async (id, router) => {
  try {
    return await Api('get', `subscriptions/admin/all`, null, router, { page: 1, limit: 100 });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    throw error;
  }
};

const updateSubscriptionAdmin = async (id, data, router) => {
  try {
    return await Api('put', `subscriptions/admin/${id}`, data, router);
  } catch (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }
};

// Product statistics helper
const fetchProductStats = async (router) => {
  try {
    return await Api('get', 'admin/product-stats', null, router);
  } catch (error) {
    console.error('Error fetching product stats:', error);
    throw error;
  }
};

const createBoxPickup = async (data, router) => {
  try {
    return await Api('post', 'box-pickups', data, router);
  } catch (error) {
    console.error('Error creating box pickup:', error);
    throw error;
  }
};

const fetchBoxPickups = async (router, params = {}) => {
  try {
    return await Api('get', 'box-pickups', null, router, params);
  } catch (error) {
    console.error('Error fetching box pickups:', error);
    throw error;
  }
};

const fetchUserBoxHistory = async (userId, router) => {
  try {
    return await Api('get', `box-pickups/user/${userId}`, null, router);
  } catch (error) {
    console.error('Error fetching user box history:', error);
    throw error;
  }
};

const markBoxPickupStatus = async (id, data, router) => {
  try {
    return await Api('put', `box-pickups/${id}/status`, data, router);
  } catch (error) {
    console.error('Error marking box pickup:', error);
    throw error;
  }
};

const updateBoxPickup = async (id, data, router) => {
  try {
    return await Api('put', `box-pickups/${id}`, data, router);
  } catch (error) {
    console.error('Error updating box pickup:', error);
    throw error;
  }
};

const fetchPendingChanges = async (router, params = {}) => {
  try {
    return await Api('get', 'pending-changes/admin/all', null, router, params);
  } catch (error) {
    console.error('Error fetching pending changes:', error);
    throw error;
  }
};

const reviewPendingChange = async (id, data, router) => {
  try {
    return await Api('put', `pending-changes/admin/${id}/review`, data, router);
  } catch (error) {
    console.error('Error reviewing change:', error);
    throw error;
  }
};

export {
  Api,
  timeSince,
  ApiFormData,
  setGlobalRouter,
  toast,
  setGlobalToast,
  fetchAllCategories,
  fetchProductsByCategory,
  createProduct,
  updateProductApi,
  deleteProduct,
  toggleProductStatus,
  fetchAllUsers,
  fetchUserById,
  updateUser,
  deleteUser,
  fetchAllOrders,
  updateOrderStatusApi,
  archiveOrderApi,
  unarchiveOrderApi,
  fetchArchivedOrders,
  fetchLoginStatsLast7,
  fetchLoginStats,
  fetchAllReviews,
  createReviewApi,
  updateReviewApi,
  deleteReviewApi,
  fetchSubscribers,
  updateUserStatusAdmin,
  fetchAllProducts,
  fetchAllProductsNoPagination,
  fetchAllReviewTags,
  createReviewTagApi,
  updateReviewTagApi,
  deleteReviewTagApi,
  fetchAllRewardRequests,
  updateRewardStatus,
  fetchRewardStats,
  fetchAdminProfile,
  updateAdminProfile,
  fetchAllContent,
  fetchContentById,
  createContentApi,
  updateContentApi,
  deleteContentApi,
  fetchContentStats,
  fetchContentCategories,
  fetchTodayRegistrations,
  fetchTodayLogins,
  fetchRegistrationsByDate,
  fetchLoginsByDate,
  fetchAllRewardTasks,
  createRewardTaskApi,
  updateRewardTaskApi,
  deleteRewardTaskApi,
  toggleRewardTaskVisibility,
  fetchAllGalleryImages,
  uploadGalleryImage,
  updateGalleryImage,
  deleteGalleryImage,
  toggleGalleryImageStatus,
  fetchHomepageSettings,
  updateHomepageSettings,
  toggleRewardsSection,
  toggleFeedbackSection,
  fetchAllsettingImages,
  uploadSettingImage,
  updateSettingImage,
  deleteSettingImage,
  fetchAllHomepageImages,
  uploadHomepageImage,
  updateHomepageImage,
  deleteHomepageImage,
  fetchAllVisitors,
  archiveVisitor,
  unarchiveVisitor,
  fetchArchivedVisitors,
  fetchUserNotes,
  createUserNote,
  updateUserNote,
  deleteUserNote,
  fetchPendingVerificationsCount,
  adminCheckInUser,
  fetchVisitorByPhone,
  fetchVisitorByUserId,
  exportCustomersData,
  fetchReturningCustomers,
  fetchSalesComparison,
  fetchTopSellingProducts,
  fetchRevenueAnalytics,
  fetchCustomerGrowth,
  fetchAllDeals,
  fetchDealById,
  createDealApi,
  updateDealApi,
  deleteDealApi,
  sendBulkSMSApi,
  fetchSMSHistory,
  fetchSMSDetails,
  fetchSMSStats,
  previewSMSRecipients,
  sendBirthdaySMSManually,
  previewBirthdayUsers,
  debugBirthdayData,
  searchUsersForSMS,
  sendIndividualSMS,
  fetchSMSReplies,
  fetchSMSReplyStats,
  respondToSMSReply,
  updateSMSReplyStatus,
  fetchSMSReplyDetails,
  fetchAllSubscriptions,
  fetchSubscriptionSettings,
  updateSubscriptionSettings,
  fetchSubscriptionById,
  updateSubscriptionAdmin,
  fetchProductStats,
  createBoxPickup,
  fetchBoxPickups,
  fetchUserBoxHistory,
  markBoxPickupStatus,
  updateBoxPickup,
  fetchPendingChanges,
  reviewPendingChange
};

// User Notes Management helpers
const fetchUserNotes = async (userId, router) => {
  try {
    return await Api('get', `user-notes/${userId}`, null, router);
  } catch (error) {
    console.error('Error fetching user notes:', error);
    throw error;
  }
};

const createUserNote = async (userId, note, router) => {
  try {
    return await Api('post', `user-notes/${userId}`, { note }, router);
  } catch (error) {
    console.error('Error creating user note:', error);
    throw error;
  }
};

const updateUserNote = async (noteId, note, router) => {
  try {
    return await Api('put', `user-notes/${noteId}`, { note }, router);
  } catch (error) {
    console.error('Error updating user note:', error);
    throw error;
  }
};

const deleteUserNote = async (noteId, router) => {
  try {
    return await Api('delete', `user-notes/${noteId}`, null, router);
  } catch (error) {
    console.error('Error deleting user note:', error);
    throw error;
  }
};
export const fetchDashboardStats = async (period = 'all', router) => {
  try {
    return await Api('get', `analytics/dashboard-stats?period=${period}`, null, router);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
};

export const previewTopiaMembers = async (router) => {
  try {
    return await Api('get', 'sms/preview-topia-members', null, router);
  } catch (error) {
    console.error('Error previewing Topia members:', error);
    throw error;
  }
};

export const sendToTopiaMembers = async (message, selectedMembers, router) => {
  try {
    return await Api('post', 'sms/send-to-topia-members', { message, selectedMembers }, router);
  } catch (error) {
    console.error('Error sending SMS to Topia members:', error);
    throw error;
  }
};

// Points Management APIs
export const loadPointsUsers = async (page = 1, search = '', router) => {
  try {
    return await Api('get', `users?page=${page}&limit=40&search=${search}&status=verified`, null, router);
  } catch (error) {
    console.error('Error loading users:', error);
    throw error;
  }
};

export const loadRewardTasksForPoints = async (router) => {
  try {
    return await Api('get', 'rewards/admin/tasks', null, router);
  } catch (error) {
    console.error('Error loading reward tasks:', error);
    throw error;
  }
};

export const loadPointsStats = async (router) => {
  try {
    return await Api('get', 'points/admin/stats', null, router);
  } catch (error) {
    console.error('Error loading points stats:', error);
    throw error;
  }
};

export const loadPointsAdjustments = async (filters, page, router) => {
  try {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('limit', 20);
    if (filters.search) params.append('search', filters.search);
    if (filters.type && filters.type !== 'all') params.append('type', filters.type);
    if (filters.userId) params.append('userId', filters.userId);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    
    return await Api('get', `points/admin/adjustments?${params}`, null, router);
  } catch (error) {
    console.error('Error loading adjustments:', error);
    throw error;
  }
};

export const adjustUserPoints = async (userId, adjustmentData, router) => {
  try {
    return await Api('post', `points/admin/adjust/${userId}`, adjustmentData, router);
  } catch (error) {
    console.error('Error adjusting points:', error);
    throw error;
  }
};

export const adminUpgradeUserToTopia = async (userId, billingAddress, paymentNote, router) => {
  try {
    return await Api('post', `subscriptions/admin/upgrade/${userId}`, { billingAddress, paymentNote }, router);
  } catch (error) {
    console.error('Error upgrading user to Topia Circle:', error);
    throw error;
  }
};

export const updateSubscriptionBillingDate = async (subscriptionId, billingDayOfMonth, router, nextBillingDate) => {
  try {
    const payload = nextBillingDate 
      ? { nextBillingDate } 
      : { billingDayOfMonth };
    return await Api('put', `subscriptions/admin/${subscriptionId}/billing-date`, payload, router);
  } catch (error) {
    console.error('Error updating billing date:', error);
    throw error;
  }
};

export const updateSubscriptionPaymentMethod = async (subscriptionId, paymentMethodId, router) => {
  try {
    return await Api('put', `subscriptions/admin/${subscriptionId}/payment-method`, { paymentMethodId }, router);
  } catch (error) {
    console.error('Error updating payment method:', error);
    throw error;
  }
};

export const toggleSubscriptionStatus = async (subscriptionId, action, router) => {
  try {
    return await Api('put', `subscriptions/admin/${subscriptionId}/status`, { action }, router);
  } catch (error) {
    console.error('Error toggling subscription status:', error);
    throw error;
  }
};

export const updatePaymentInfo = async (subscriptionId, paymentInfo, router) => {
  try {
    return await Api('put', `subscriptions/admin/${subscriptionId}/payment-info`, paymentInfo, router);
  } catch (error) {
    console.error('Error updating payment info:', error);
    throw error;
  }
};
