import { toast } from 'react-toastify';

// Safe toast wrapper to prevent undefined closeToast errors
export const safeToast = {
  success: (message, options = {}) => {
    try {
      return toast.success(message, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        ...options
      });
    } catch (error) {
      console.warn('Toast error:', error);
      // Fallback to console log if toast fails
      console.log('Success:', message);
    }
  },
  
  error: (message, options = {}) => {
    try {
      return toast.error(message, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        ...options
      });
    } catch (error) {
      console.warn('Toast error:', error);
      // Fallback to console log if toast fails
      console.error('Error:', message);
    }
  },
  
  warning: (message, options = {}) => {
    try {
      return toast.warning(message, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        ...options
      });
    } catch (error) {
      console.warn('Toast error:', error);
      // Fallback to console log if toast fails
      console.warn('Warning:', message);
    }
  },
  
  info: (message, options = {}) => {
    try {
      return toast.info(message, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        ...options
      });
    } catch (error) {
      console.warn('Toast error:', error);
      // Fallback to console log if toast fails
      console.info('Info:', message);
    }
  }
};

export default safeToast;
