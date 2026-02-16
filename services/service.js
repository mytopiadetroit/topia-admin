import axios from "axios";
            // const ConstantsUrl = "http://localhost:5000/api/";
          const ConstantsUrl = "https://api.mypsyguide.io/api/";

// export const ConstantsUrl = "";




axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401 && typeof window !== "undefined") {
      if (!isRedirecting) {
        isRedirecting = true;

        // Clear all tokens
        localStorage.removeItem("adminDetail");
        localStorage.removeItem("adminToken");
        localStorage.removeItem("userDetail");
        localStorage.removeItem("token");

        window.dispatchEvent(new Event('storage'));
        document.dispatchEvent(new Event('auth-state-changed'));

        if (window.router && !window.router.pathname.includes("login")) {
          window.router.push("/");
        } else {
          window.location.href = "/";
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

  window.dispatchEvent(new Event('storage'));
  document.dispatchEvent(new Event('auth-state-changed'));
}

const handleTokenExpiration = (router) => {
  if (isRedirecting) return true;

  console.log("Token expired, logging out user...");
  isRedirecting = true;

  try {
    // Clear all tokens
    localStorage.removeItem("adminDetail");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("userDetail");
    localStorage.removeItem("token");

    // Notify all components about auth change
    notifyAuthChange();

    // Navigate to login page if not already there
    if (router && !router.pathname.includes("login")) {
      router.push("/");
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
export const setGlobalRouter = (router) => {
  if (typeof window !== "undefined") {
    window.router = router;
  }
};


let isRedirecting = false;


// const handleTokenExpiration = (router) => {
//   if (isRedirecting) return true;

//   console.log("Token expired, logging out user...");
//   isRedirecting = true;

//   try {

//     localStorage.removeItem("userDetail");
//     localStorage.removeItem("token");

//     window.dispatchEvent(new Event('storage'));
//     window.dispatchEvent(new Event('auth-state-changed'));


//     if (router && !router.pathname.includes("signIn")) {
//       router.push("/auth/signIn");
//     }


//     setTimeout(() => {
//       isRedirecting = false;
//     }, 2000);

//     return true;
//   } catch (error) {
//     console.error("Error during logout:", error);
//     isRedirecting = false;
//     return false;
//   }
// };

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


function ApiFormData(method, url, data, router) {
  return new Promise(function (resolve, reject) {

    if (isRedirecting) {
      resolve({ redirect: true, message: "Logging you out. Please wait..." });
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
        "Content-Type": "multipart/form-data",
      },
    }).then(
      (res) => {
        resolve(res.data);
      },
      (err) => {
        console.log(err);
        if (err.response) {
          if (err?.response?.status === 401) {
            if (typeof window !== "undefined") {
              // Use the helper function
              if (handleTokenExpiration(router)) {
                return resolve({ redirect: true, message: "Session expired. Please login again." });
              }
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

// Analytics API functions
export const fetchReturningCustomers = async (router, period = 30) => {
  try {
    return await Api('get', 'analytics/returning-customers', null, router, { period });
  } catch (error) {
    console.error('Error fetching returning customers:', error);
    throw error;
  }
};

export const fetchSalesComparison = async (router) => {
  try {
    return await Api('get', 'analytics/sales-comparison', null, router);
  } catch (error) {
    console.error('Error fetching sales comparison:', error);
    throw error;
  }
};

export const fetchTopSellingProducts = async (router, limit = 10, period = 30) => {
  try {
    return await Api('get', 'analytics/top-selling-products', null, router, { limit, period });
  } catch (error) {
    console.error('Error fetching top selling products:', error);
    throw error;
  }
};

export const fetchRevenueAnalytics = async (router, period = 30) => {
  try {
    return await Api('get', 'analytics/revenue', null, router, { period });
  } catch (error) {
    console.error('Error fetching revenue analytics:', error);
    throw error;
  }
};

export const fetchCustomerGrowth = async (router, period = 30) => {
  try {
    return await Api('get', 'analytics/customer-growth', null, router, { period });
  } catch (error) {
    console.error('Error fetching customer growth:', error);
    throw error;
  }
};

export const fetchRegistrationsVsVisits = async (router, period = 30) => {
  try {
    return await Api('get', 'analytics/registrations-vs-visits', null, router, { period });
  } catch (error) {
    console.error('Error fetching registrations vs visits:', error);
    throw error;
  }
};

export { Api, timeSince, ApiFormData };
