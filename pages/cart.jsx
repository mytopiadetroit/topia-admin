import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import { useUser } from '../context/UserContext';

const Cart = () => {
  const router = useRouter();
  const { isLoggedIn, loading } = useUser();
  
  useEffect(() => {
    // Only check after loading is complete
    if (!loading) {
      // Check if user is logged in
      if (!isLoggedIn) {
        // Show toast notification
        toast.error('Please login to access your cart', {
          position: "top-center",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          style: {
            backgroundColor: '#f44336',
            color: 'white',
            fontWeight: '500',
            borderRadius: '8px'
          }
        });
        
        // Redirect to login page
        router.push('/auth/login');
      }
    }
  }, [isLoggedIn, loading, router]);
  
  return (
    <div className="min-h-screen bg-gray-50 pt-20 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-8"> {/* Reset gap to normal */}
          {/* Left Side - Cart Items */}
          <div className="flex-1">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <button className="p-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                  </svg>
                </button>
                <h1 className="text-xl font-semibold text-gray-900">My Cart</h1>
              </div>
              <button onClick={() => window.location.href = '/menu'} className="flex items-center gap-2 px-4 py-1 border border-gray-500 border-b  rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50">
                Continue Shopping
               
              </button>
            </div>

            {/* Cart Items */}
            <div className="space-y-4">
              {/* Item 1 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full">
  <div className="flex items-center gap-4">
    <div className="w-32 rounded-2xl h-30 overflow-hidden flex-shrink-0">
      <img 
        src="/images/cart.png" 
        alt="Lion's Mane Capsules"
        className="w-full h-full object-cover"
      />
    </div>
    <div className="flex-1">
      <h3 className="font-semibold text-gray-900 text-sm">Lion's Mane Capsules</h3>
      <p className="text-gray-500 text-sm mt-1">Quantity: 1</p>
      <p className="font-semibold text-lg text-gray-900 mt-10">$ 50</p>
    </div>
    {/* Quantity Controls and Delete */}
    <div className="flex items-end mt-14 gap-3 mr-4">
      {/* Quantity Controls */}
      <div className="flex items-center border bg-[#BABABA80] border-gray-300 rounded-full">
        <button className="p-2 hover:bg-gray-50 rounded-lg-full">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"  className="w-4 h-4 text-gray-800 hover:text-black" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14"/>
          </svg>
        </button>
        <span className="px-3 py-1 text-sm text-gray-800 font-medium">1</span>
        <button className="p-2 hover:bg-gray-50 rounded-r-full">
          <svg width="16" height="16" viewBox="0 0 24 24"  className="w-4 h-4 text-gray-800 hover:text-black" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
        </button>
      </div>
      {/* Delete Button */}
      <button className="p-2 text-gray-400 hover:text-red-500">
        <svg width="20" height="20" viewBox="0 0 24 24"  fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c0 1 1 2 2 2v2"/>
          <path d="M10 11v6M14 11v6"/>
        </svg>
      </button>
    </div>
  </div>
</div>

              {/* Item 2 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full">
  <div className="flex items-center gap-4">
    <div className="w-32 rounded-2xl h-28 overflow-hidden flex-shrink-0">
      <img 
        src="/images/cart.png" 
        alt="Mush Love Chocolate"
        className="w-full h-full object-cover"
      />
    </div>
    <div className="flex-1">
      <h3 className="font-semibold text-gray-900 text-sm">Mush Love Chocolate</h3>
      <p className="text-gray-500 text-sm mt-1">Quantity: 1</p>
      <p className="font-semibold text-lg text-gray-900 mt-1">$ 20</p>
    </div>
    {/* Quantity Controls and Delete */}
    <div className="flex mt-10  items-end gap-3 mr-4">
      {/* Quantity Controls */}
      <div className="flex items-center border bg-[#BABABA80] border-gray-300 rounded-full">
        <button className="p-2 hover:bg-gray-50 rounded-l-full">
          <svg width="16" height="16"  className="w-4 h-4 text-gray-800 hover:text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14"/>
          </svg>
        </button>
        <span className="px-3 py-1 text-sm text-gray-800 font-medium">1</span>
        <button className="p-2 hover:bg-gray-50 rounded-r-full">
          <svg
      className="w-4 h-4 text-gray-800 hover:text-black"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
        </button>
      </div>
      {/* Delete Button */}
      <button className="p-2 text-gray-400 hover:text-red-500">
        <svg width="20" height="20"  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c0 1 1 2 2 2v2"/>
          <path d="M10 11v6M14 11v6"/>
        </svg>
      </button>
    </div>
  </div>
</div>
            </div>
          </div>
          <img src="/images/line2.png" alt="abc" className="ml-24 hidden sm:block" />

          {/* Right Side - Bill Summary */}
          <div className="w-full lg:w-80 flex flex-col items-center lg:ml-44"> {/* Add margin-left for spacing on large screens */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 w-full">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Bill Summary</h2>
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold text-gray-900">$ 70</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-semibold text-gray-900">$ 5</span>
                </div>
              </div>
              <div className="border-t border-gray-200 pt-4 mb-2">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-semibold text-gray-900">Grand Total</span>
                  <span className="text-xl font-semibold text-gray-900">$ 75</span>
                </div>
              </div>
            </div>
            <button className="w-full mt-6 bg-[#536690] hover:bg-slate-700 text-white font-semibold py-4 px-6 rounded-4xl transition-colors">
              Submit Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;