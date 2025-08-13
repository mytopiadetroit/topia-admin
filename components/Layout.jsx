import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Sidebar from './sidebar';

const resolveTitleFromPath = (pathname) => {
  if (!pathname) return 'Dashboard';
  if (pathname.includes('/dashboard')) return 'Dashboard';
  if (pathname.includes('/categories')) return 'Categories';
  if (pathname.includes('/users')) return 'Users';
  if (pathname.includes('/admin/orders')) return 'Orders';
  if (pathname.includes('/product')) return 'Products';
  if (pathname.includes('/products/')) return 'Products';
  return 'Dashboard';
};

export default function Layout({ children, title }) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pageTitle = title || resolveTitleFromPath(router.pathname);

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
            <div className="w-8" />
          </div>
        </div>

        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}


