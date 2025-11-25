import { createContext, useState, useContext, useEffect } from 'react';
import { useRouter } from 'next/router';

// Create the context
const UserContext = createContext();

// Custom hook to use the user context
export const useUser = () => {
  return useContext(UserContext);
};

// Provider component that wraps the app
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Check if user is logged in on initial load
  useEffect(() => {
    const checkUserLoggedIn = () => {
      try {
        let token = localStorage.getItem('adminToken');
        let userDetail = localStorage.getItem('adminDetail');
        
        // MIGRATION: Check for old token key and migrate to new key (ONE TIME ONLY)
        if (!token) {
          const oldToken = localStorage.getItem('token');
          const oldUserDetail = localStorage.getItem('userDetail');
          
          // Check if old data exists and user is admin
          if (oldToken && oldUserDetail) {
            try {
              const userData = JSON.parse(oldUserDetail);
              // Only migrate if user is admin
              if (userData.role === 'admin') {
                localStorage.setItem('adminToken', oldToken);
                localStorage.setItem('adminDetail', oldUserDetail);
                token = oldToken;
                userDetail = oldUserDetail;
                
                // IMPORTANT: Delete old tokens after migration
                localStorage.removeItem('token');
                localStorage.removeItem('userDetail');
                console.log('Migrated old admin token to new key and cleaned up old tokens');
              }
            } catch (e) {
              console.error('Migration error:', e);
            }
          }
        }
        
        if (token && userDetail) {
          setUser(JSON.parse(userDetail));
          setIsLoggedIn(true);
        } else {
          setUser(null);
          setIsLoggedIn(false);
        }
      } catch (error) {
        console.error('Error checking user login status:', error);
        setUser(null);
        setIsLoggedIn(false);
      } finally {
        setLoading(false);
      }
    };

    // Initial check
    checkUserLoggedIn();
    
    // Listen for storage events (when localStorage changes in other tabs)
    const handleStorageChange = (event) => {
      if (event.key === 'adminToken' || event.key === 'adminDetail' || !event.key) {
        checkUserLoggedIn();
      }
    };
    
    // Listen for custom auth state changed event
    const handleAuthStateChanged = () => {
      checkUserLoggedIn();
    };
    
    // Add event listeners
    window.addEventListener('storage', handleStorageChange);
    document.addEventListener('auth-state-changed', handleAuthStateChanged);
    
    // Clean up event listeners
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('auth-state-changed', handleAuthStateChanged);
    };
  }, []);

  // Login function
  const login = (userData, token) => {
    try {
      // Clear any old tokens first
      localStorage.removeItem('token');
      localStorage.removeItem('userDetail');
      
      // Save to localStorage with admin-specific keys
      localStorage.setItem('adminToken', token);
      localStorage.setItem('adminDetail', JSON.stringify(userData));
      
      // Update state
      setUser(userData);
      setIsLoggedIn(true);
      
      // Dispatch auth-state-changed event
      document.dispatchEvent(new Event('auth-state-changed'));
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  // Logout function
  const logout = () => {
    try {
      // Clear localStorage with admin-specific keys
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminDetail');
      
      // Also remove old tokens to prevent re-migration
      localStorage.removeItem('token');
      localStorage.removeItem('userDetail');
      
      // Update state
      setUser(null);
      setIsLoggedIn(false);
      
      // Dispatch auth-state-changed event
      document.dispatchEvent(new Event('auth-state-changed'));
      
      // Redirect to login page
      router.push('/');
      
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      return false;
    }
  };

  // Update user data
  const updateUser = (newUserData) => {
    try {
      const updatedUser = { ...user, ...newUserData };
      
      // Update localStorage with admin-specific key
      localStorage.setItem('adminDetail', JSON.stringify(updatedUser));
      
      // Update state
      setUser(updatedUser);
      
      return true;
    } catch (error) {
      console.error('Update user error:', error);
      return false;
    }
  };

  // Context value
  const value = {
    user,
    isLoggedIn,
    loading,
    login,
    logout,
    updateUser
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};