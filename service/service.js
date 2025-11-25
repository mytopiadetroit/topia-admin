import axios from "axios";


// const ConstantsUrl = typeof window !== 'undefined' && window.location.host.includes('localhost')
//   ? "http://localhost:5000/api/"
//   : "https://api.mypsyguide.io/api/";

  // const ConstantsUrl = "http://localhost:5000/api/";
 const ConstantsUrl = "https://api.mypsyguide.io/api/";

let isRedirecting = false;

// Api function for making API calls
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
    return await Api('get', `products/category/paginated/${categoryId}?page=${page}&limlt=${limit}`, null, router);
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

const deleteOrderApi = async (orderId, router) => {
  try {
    return await Api('delete', `admin/orders/${orderId}`, null, router);
  } catch (error) {
    console.error('Error deleting order:', error);
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
const updateUserStatusAdmin = async (id, status, router) => {
  try {
    return await Api('put', `users/${id}/status`, { 
      status,
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
const fetchTodayRegistrations = async (router) => {
  try {
    return await Api('get', 'users/admin/today-registrations', null, router);
  } catch (error) {
    console.error('Error fetching today registrations:', error);
    throw error;
  }
};

const fetchTodayLogins = async (router) => {
  try {
    return await Api('get', 'users/admin/today-logins', null, router);
  } catch (error) {
    console.error('Error fetching today logins:', error);
    throw error;
  }
};

const fetchRegistrationsByDate = async (router, startDate, endDate) => {
  try {
    return await Api('get', 'users/admin/registrations-by-date', null, router, { startDate, endDate });
  } catch (error) {
    console.error('Error fetching registrations by date:', error);
    throw error;
  }
};

const fetchLoginsByDate = async (router, startDate, endDate) => {
  try {
    return await Api('get', 'users/admin/logins-by-date', null, router, { startDate, endDate });
  } catch (error) {
    console.error('Error fetching logins by date:', error);
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
  fetchAllUsers,
  fetchUserById,
  updateUser,
  deleteUser,
  fetchAllOrders,
  updateOrderStatusApi,
  deleteOrderApi,
  fetchLoginStatsLast7,
  fetchLoginStats,
  fetchAllReviews,
  createReviewApi,
  updateReviewApi,
  deleteReviewApi,
  fetchSubscribers,
  updateUserStatusAdmin,
  fetchAllProducts,
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
  updateSettingImage
};