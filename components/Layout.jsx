import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { LogOut } from 'lucide-react';
import Sidebar from './sidebar';

const resolveTitleFromPath = (pathname) => {
  if (!pathname) return 'Dashboard';
  if (pathname.includes('/dashboard')) return 'Dashboard';
  if (pathname.includes('/categories')) return 'Categories';
  if (pathname.includes('/users')) return 'Users';
  if (pathname.includes('/reviews')) return 'Reviews';
  if (pathname.includes('/admin/orders')) return 'Orders';
  if (pathname.includes('/product')) return 'Products';
  if (pathname.includes('/products/')) return 'Products';
  return 'Dashboard';
};

export default function Layout({ children, title }) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);
  const pageTitle = title || resolveTitleFromPath(router.pathname);

  const handleLogoutClick = () => {
    setShowLogoutPopup(true);
  };

  const handleLogoutConfirm = () => {
    // Remove user tokens from localStorage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('token');
    localStorage.removeItem('userToken');
    localStorage.removeItem('userDetail');
    localStorage.removeItem('topiaDetail');
    
    // Close the popup
    setShowLogoutPopup(false);
    
    // Navigate to the home page
    router.push('/');
  };

  const handleLogoutCancel = () => {
    setShowLogoutPopup(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* App Sidebar (fixed and responsive) */}
      <Sidebar isMobileOpen={sidebarOpen} />

      {/* Main content */}
      <div className="main-content">
        {/* Top bar */}
        <div className="sticky top-0 z-30 bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              aria-label="Open sidebar"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h2 className="text-lg font-semibold text-gray-900">{pageTitle}</h2>
            <button
              onClick={handleLogoutClick}
              className="flex items-center justify-center text-gray-600 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
              title="Log out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>

        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* Logout Confirmation Popup */}
      {showLogoutPopup && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-72 max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Log out Confirmation</h3>
              <button
                onClick={handleLogoutCancel}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mb-5">
              <p className="text-sm text-gray-500">Are you sure you want to log out?</p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleLogoutCancel}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleLogoutConfirm}
                className="px-4 py-2 bg-[#80A6F7] hover:bg-blue-700 text-white text-sm font-medium rounded-md"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


