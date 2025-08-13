'use client';
import { useState, useEffect, useRef } from 'react';
import { Menu, X, User, ChevronDown, ShoppingCart, LogOut } from 'lucide-react';
import { useRouter } from 'next/router';
import { useUser } from '../context/UserContext';
import { useApp } from '../context/AppContext';

export default function Navbar() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  // Use context hooks
  const { user, isLoggedIn, logout } = useUser();
  const { cartCount } = useApp();
  
  // Create a ref for the profile dropdown
  const profileRef = useRef(null);
  
  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <>
     
      
      {/* Main navbar */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex-shrink-0">
              <div className="flex items-center space-x-2">
                <a href="/" className="flex items-center">
                  <img src="/images/logo4.png" alt="Logo" className="h-20 w-auto" />
                </a>
              </div>
            </div>

            {/* Desktop Navigation */}
         <div className="hidden md:block rounded-4xl bg-[url('/images/navbar.png')] bg-cover bg-center">
              <div className="ml-10 flex items-baseline space-x-8">
                <a href="/menu" className="text-gray-900 hover:text-blue-600 px-3 py-2 text-sm font-medium">Menu</a>
                <a href="#" className="text-gray-900 hover:text-blue-600 px-3 py-2 text-sm font-medium">Resource Centre</a>
                <a href="#" className="text-gray-900 hover:text-blue-600 px-3 py-2 text-sm font-medium">Join GAG</a>
                <a href="#" className="text-gray-900 hover:text-blue-600 px-3 py-2 text-sm font-medium">My Experiences</a>
                <a href="#" className="text-gray-900 hover:text-blue-600 px-3 py-2 text-sm font-medium">My Rewards</a>
              </div>
            </div>

            {/* Profile, Cart and Mobile menu button */}
            <div className="flex items-center space-x-4">
              {/* Cart Icon */}
              <a href="/cart" className="relative">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center cursor-pointer">
                  <ShoppingCart className="w-5 h-5 text-gray-600" />
                </div>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </a>
              <div className="relative" ref={profileRef}>
                <div 
                  className="flex items-center space-x-1 cursor-pointer"
                  onClick={() => isLoggedIn ? setIsProfileOpen(!isProfileOpen) : router.push('/auth/login')}
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden">
                    {isLoggedIn ? (
                      <img src={user?.avatar || "/images/avatar.png"} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-5 h-5 text-gray-600" />
                    )}
                  </div>
                  {isLoggedIn && <ChevronDown className="w-3 h-3 text-gray-600" />}
                </div>
                
                {/* Profile Dropdown */}
                {isLoggedIn && isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
                    <a href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      My Profile
                    </a>
                    <a href="/myorders" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      My Orders
                    </a>
                    <button 
                      onClick={() => {
                        logout();
                        setIsProfileOpen(false);
                      }} 
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <div className="flex items-center">
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                      </div>
                    </button>
                  </div>
                )}
              </div>
              
              {/* Mobile menu button */}
              <div className="md:hidden">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="bg-gray-50 p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                >
                  {isMenuOpen ? (
                    <X className="h-6 w-6" />
                  ) : (
                    <Menu className="h-6 w-6" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile menu */}
          {isMenuOpen && (
            <div className="md:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
                <a href="/menu" className="text-gray-900 hover:text-blue-600 block px-3 py-2 text-base font-medium">Menu</a>
                <a href="/cart" className="text-gray-900 hover:text-blue-600 block px-3 py-2 text-base font-medium flex items-center">
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Cart
                  {cartCount > 0 && (
                    <span className="ml-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </a>
                <a href="#" className="text-gray-900 hover:text-blue-600 block px-3 py-2 text-base font-medium">Resource Centre</a>
                <a href="#" className="text-gray-900 hover:text-blue-600 block px-3 py-2 text-base font-medium">Join GAG</a>
                <a href="#" className="text-gray-900 hover:text-blue-600 block px-3 py-2 text-base font-medium">My Experiences</a>
                <a href="#" className="text-gray-900 hover:text-blue-600 block px-3 py-2 text-base font-medium">My Rewards</a>
                <div className="border-t border-gray-200 mt-2 pt-2">
                  {isLoggedIn ? (
                    <>
                      <a href="/profile" className="text-gray-900 hover:text-blue-600 block px-3 py-2 text-base font-medium flex items-center">
                        <User className="w-5 h-5 mr-2" />
                        My Profile
                      </a>
                      <a href="/myorders" className="text-gray-900 hover:text-blue-600 block px-3 py-2 text-base font-medium">
                        My Orders
                      </a>
                      <button 
                        onClick={() => {
                          logout();
                          setIsMenuOpen(false);
                        }} 
                        className="text-gray-900 hover:text-blue-600 block w-full text-left px-3 py-2 text-base font-medium flex items-center"
                      >
                        <LogOut className="w-5 h-5 mr-2" />
                        Logout
                      </button>
                    </>
                  ) : (
                    <a 
                      href="/auth/login" 
                      className="text-gray-900 hover:text-blue-600 block px-3 py-2 text-base font-medium flex items-center"
                    >
                      <User className="w-5 h-5 mr-2" />
                      Login
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}