import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Package, 
  Users, 
  FileText, 
  Grid3X3, 
  TrendingUp, 
  TrendingDown,
  Menu,
  X,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { Api, fetchAllCategories } from '../service/service';
import Link from 'next/link';
import { useRouter } from 'next/router';

// Sidebar Component
const Sidebar = ({ isOpen, toggleSidebar, isMobile }) => {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [productDropdownOpen, setProductDropdownOpen] = useState(false);
  
  // Determine active state based on current route
  const isActive = (path) => router.pathname === path;
  const isProductRelated = router.pathname.startsWith('/product');
  
  const menuItems = [
    { name: 'Dashboard', icon: BarChart3, path: '/dashboard' },
    { 
      name: 'Product', 
      icon: Package, 
      path: '/product',
      hasDropdown: true,
      dropdownItems: categories.map(cat => ({
        name: cat.category,
        path: `/product?category=${cat._id}`
      }))
    },
    { name: 'Orders', icon: FileText, path: '/orders' },
    { name: 'Users', icon: Users, path: '/users' },
    { name: 'Categories', icon: Grid3X3, path: '/categories' },
  ];
  
useEffect(() => {
  const getCategories = async () => {
    try {
      const result = await Api('get', 'categories/categories', null, router);
      setCategories(result.data || []);
    } catch (error) {
      console.error('Error fetching categories for sidebar:', error);
    }
  };
  
  getCategories();
}, [router]);

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && isMobile && (
        <div 
          className="fixed inset-0 bg-black/50 bg-opacity-50 z-40"
          onClick={toggleSidebar}
        />
      )}
      
      {/* Sidebar */}
      <div 
        className={`fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-[#80A6F7] to-[#80A6F7] transform transition-transform duration-300 ease-in-out z-50 ${isMobile ? (isOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'} ${!isMobile ? 'static z-auto' : ''}`}
      >
        
        {/* Logo Section */}
        <div className="border-b flex justify-between items-center border-blue-400/30 px-4">
          <div className="flex items-center space-x-3">
            <img src="/logo.png" alt="ShroomTopia Logo" className="h-32 w-36" />
          </div>
          
          {/* Close button for mobile */}
          {isMobile && (
            <button 
              onClick={toggleSidebar}
              className="p-1 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Menu Items */}
        <nav className="mt-6 px-2">
          {menuItems.map((item, index) => (
            <div key={index} className="mb-1">
              <div
                className={`mx-2 mb-1 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 flex items-center justify-between ${
                  (isActive(item.path) || (item.hasDropdown && isProductRelated))
                    ? 'bg-white/20 text-white shadow-lg' 
                    : 'text-blue-100 hover:bg-white/10 hover:text-white'
                } ${isMobile ? 'active:bg-white/30' : ''}`}
                onClick={() => {
                  if (item.hasDropdown) {
                    setProductDropdownOpen(!productDropdownOpen);
                  } else {
                    router.push(item.path);
                    if (isMobile) toggleSidebar();
                  }
                }}
              >
                <div className="flex items-center space-x-3">
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </div>
                {item.hasDropdown && (
                  productDropdownOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
                )}
              </div>
              
              {/* Dropdown for categories under Product */}
              {item.hasDropdown && productDropdownOpen && (
                <div className="ml-8 mt-1 mb-2 space-y-1 animate-fadeIn">
                  {categories.length > 0 ? (
                    categories.map((category) => (
                      <Link 
                        href={`/product?category=${category._id}`} 
                        key={category._id}
                        passHref
                      >
                        <div 
                          className={`px-4 py-2 rounded-lg text-sm cursor-pointer ${
                            router.asPath === `/product?category=${category._id}`
                              ? 'bg-white/20 text-white' 
                              : 'text-blue-100 hover:bg-white/10 hover:text-white'
                          } ${isMobile ? 'active:bg-white/30' : ''}`}
                          onClick={() => isMobile && toggleSidebar()}
                        >
                          {category.category}
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-sm text-blue-100 italic">No categories found</div>
                  )}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>
    </>
  );
};

export default Sidebar;