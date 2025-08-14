import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import { useUser } from '../context/UserContext';

export default function MyOrders() {
  const router = useRouter();
  const { isLoggedIn, loading } = useUser();
  const [activeFilter, setActiveFilter] = useState('All');
  
  useEffect(() => {
    // Only check after loading is complete
    if (!loading) {
      // Check if user is logged in
      if (!isLoggedIn) {
        // Show toast notification
        toast.error('Please login to view your orders', {
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

  // Orders data
  const orders = [
    {
      id: "12345",
      total: 50,
      products: [
        {
          name: "Lion's Mane Capsule",
          status: "Ready for Pick-Up",
          amount: 50
        }
      ]
    },
    {
      id: "12345",
      total: 100,
      products: [
        {
          name: "Lion's Mane Capsule",
          status: "Picked",
          amount: 50
        },
        {
          name: "Shroom Chocolate",
          status: "Picked",
          amount: 50
        }
      ]
    },
    {
      id: "12345",
      total: 50,
      products: [
        {
          name: "Lion's Mane Capsule",
          status: "Picked",
          amount: 50
        }
      ]
    },
    {
      id: "12345",
      total: 50,
      products: [
        {
          name: "Shroom Chocolate",
          status: "Cancelled",
          amount: 50
        }
      ]
    }
  ];

  const filters = ['All', 'Processing', 'Ready for Pick-Up', 'Picked'];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Ready for Pick-Up':
        return 'text-blue-500';
      case 'Picked':
        return 'text-green-500';
      case 'Cancelled':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-6">My Orders</h1>
          
          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-3">
            {filters.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeFilter === filter
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-[#D9D9D9] text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {orders.map((order, orderIndex) => (
            <div key={orderIndex} className="bg-[#E7E7E7] rounded-xl shadow-lg border-b p-4 ">
              {/* Order Header */}
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-gray-600">Order ID: {order.id}</span>
                <span className="text-sm font-medium text-gray-900">Total: ${order.total}</span>
              </div>

              {/* Products */}
              <div className="space-y-3">
                {order.products.map((product, productIndex) => (
                  <div key={productIndex} className="flex items-center justify-between">
                    {/* Left Side - Product Info */}
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                      <div className="w-10 h-10 bg-[#2E2E2E40] rounded-lg"></div>
                      </div>
                      <span className="text-sm text-gray-900">{product.name}</span>
                    </div>

                    {/* Right Side - Status and Amount */}
                    <div className="flex items-center gap-4">
                      <span className={`text-sm font-medium ${getStatusColor(product.status)}`}>
                        Status: {product.status}
                      </span>
                      <span className="text-sm text-gray-600">Amount: ${product.amount}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
