import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Menu, X } from 'lucide-react';
import Sidebar from './sidebar';

const Layout = ({ children, loader, toaster }) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Check if the screen is mobile size
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    // Initial check
    checkIfMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);
  
  // Toggle sidebar function for mobile view
  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };
  
  // Close sidebar when clicking outside on mobile
  const closeSidebar = () => {
    if (isMobile) {
      setIsOpen(false);
    }
  };
  
  // Skip layout for login page or other specific pages
  const isLoginPage = router.pathname === '/';
  
  if (isLoginPage) {
    return <>{children}</>;
  }
  
return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar isOpen={isOpen} toggleSidebar={toggleSidebar} isMobile={isMobile} />
      <div className={`flex-1 flex flex-col overflow-hidden ${isMobile ? 'ml-0' : 'lg:ml-64'}`}>
        {/* Mobile Header */}
        <header className="flex items-center justify-between p-4 bg-white border-b shadow-sm lg:hidden">
          <button 
            onClick={toggleSidebar}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            aria-label="Toggle sidebar"
          >
            <Menu size={24} className="text-gray-700" />
          </button>
          <h1 className="text-xl font-semibold text-gray-800">
            {router.pathname.substring(1).charAt(0).toUpperCase() + router.pathname.substring(2)}
          </h1>
          <div className="w-10"></div>
        </header>
        <main className="flex-1 overflow-auto p-4 bg-gray-100"> {/* Add bg-gray-100 here */}
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;