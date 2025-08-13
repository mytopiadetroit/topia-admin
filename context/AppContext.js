import { createContext, useState, useContext, useEffect } from 'react';

// Create the context
const AppContext = createContext();

// Custom hook to use the app context
export const useApp = () => {
  return useContext(AppContext);
};

// Provider component that wraps the app
export const AppProvider = ({ children }) => {
  // Cart state
  const [cart, setCart] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  
  // Theme state
  const [darkMode, setDarkMode] = useState(false);
  
  // Language state
  const [language, setLanguage] = useState('en');
  
  // Loading state
  const [isLoading, setIsLoading] = useState(false);

  // Initialize cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        setCart(parsedCart);
        setCartCount(parsedCart.reduce((total, item) => total + item.quantity, 0));
      }
      
      // Check for saved theme preference
      const savedTheme = localStorage.getItem('darkMode');
      if (savedTheme) {
        setDarkMode(savedTheme === 'true');
      }
      
      // Check for saved language preference
      const savedLanguage = localStorage.getItem('language');
      if (savedLanguage) {
        setLanguage(savedLanguage);
      }
    } catch (error) {
      console.error('Error initializing app state:', error);
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('cart', JSON.stringify(cart));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }, [cart]);

  // Add item to cart
  const addToCart = (product, quantity = 1) => {
    setCart(prevCart => {
      const existingItemIndex = prevCart.findIndex(item => item.id === product.id);
      
      if (existingItemIndex >= 0) {
        // Item exists, update quantity
        const updatedCart = [...prevCart];
        updatedCart[existingItemIndex].quantity += quantity;
        setCartCount(prevCount => prevCount + quantity);
        return updatedCart;
      } else {
        // Item doesn't exist, add new item
        setCartCount(prevCount => prevCount + quantity);
        return [...prevCart, { ...product, quantity }];
      }
    });
  };

  // Remove item from cart
  const removeFromCart = (productId) => {
    setCart(prevCart => {
      const itemToRemove = prevCart.find(item => item.id === productId);
      if (itemToRemove) {
        setCartCount(prevCount => prevCount - itemToRemove.quantity);
      }
      return prevCart.filter(item => item.id !== productId);
    });
  };

  // Update item quantity
  const updateCartItemQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCart(prevCart => {
      const updatedCart = prevCart.map(item => {
        if (item.id === productId) {
          const quantityDiff = quantity - item.quantity;
          setCartCount(prevCount => prevCount + quantityDiff);
          return { ...item, quantity };
        }
        return item;
      });
      return updatedCart;
    });
  };

  // Clear cart
  const clearCart = () => {
    setCart([]);
    setCartCount(0);
  };

  // Toggle theme
  const toggleDarkMode = () => {
    setDarkMode(prev => {
      const newValue = !prev;
      localStorage.setItem('darkMode', String(newValue));
      return newValue;
    });
  };

  // Change language
  const changeLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  // Set loading state
  const setLoading = (state) => {
    setIsLoading(state);
  };

  // Context value
  const value = {
    // Cart
    cart,
    cartCount,
    addToCart,
    removeFromCart,
    updateCartItemQuantity,
    clearCart,
    
    // Theme
    darkMode,
    toggleDarkMode,
    
    // Language
    language,
    changeLanguage,
    
    // Loading
    isLoading,
    setLoading
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};