import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import { useUser } from '../context/UserContext';

const Menu = () => {
  const router = useRouter();
  const { isLoggedIn, loading } = useUser();
  const [categoryOpen, setCategoryOpen] = useState(true);
  const [primaryUseOpen, setPrimaryUseOpen] = useState(true);
  
  useEffect(() => {
    // Only check after loading is complete
    if (!loading) {
      // Check if user is logged in
      if (!isLoggedIn) {
        // Show toast notification
        toast.error('Please login to access the menu', {
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
  
  const [categoryFilters, setCategoryFilters] = useState({
    deals: false,
    gummies: false,
    chocolates: false,
    drinks: false,
    dried: false,
    capsules: false,
    merch: false
  });
  
  const [primaryUseFilters, setPrimaryUseFilters] = useState({
    therapeutic: false,
    functional: false
  });

  const handleCategoryChange = (category) => {
    setCategoryFilters(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const handlePrimaryUseChange = (useType) => {
    setPrimaryUseFilters(prev => ({
      ...prev,
      [useType]: !prev[useType]
    }));
  };

  const products = [
    {
      id: 1,
      name: "Lion's Mane Capsules",
      price: "$ 50",
      image: "/images/details.png",
      tags: ["Joy", "Euphoric", "Creative"],
      hasStock: true
    },
    {
      id: 2,
      name: "Product Name",
      price: "$ 00.00",
      image: null,
      tags: ["Effects / Experiences", "Effects / Experiences"],
      hasStock: false
    },
    {
      id: 3,
      name: "Product Name",
      price: "$ 00.00",
      image: null,
      tags: ["Effects / Experiences", "Effects / Experiences"],
      hasStock: false
    },
    {
      id: 4,
      name: "Product Name",
      price: "$ 00.00",
      image: null,
      tags: ["Effects / Experiences", "Effects / Experiences"],
      hasStock: false
    }
  ];

  // Add this mapping above the Menu component
  const tagEmojis = {
    Joy: '😀',
    Euphoric: '😍',
    Creative: '🎨',
    Focus: '🎯',
    'Effects / Experiences': '✨',
    // Add more as needed
  };

  return (
    <div className="min-h-screen lg:px-14 bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <span className="hover:text-gray-900 cursor-pointer">Home</span>
          <span className="text-gray-400">/</span>
          <span className="text-gray-900 font-medium">Menu</span>
        </div>
      </nav>

      <div className="flex flex-col lg:flex-row">
        {/* Sidebar */}
        <div className="w-full lg:w-64 bg-white border-r border-gray-200 p-6">
          {/* Category Filter */}
          <div className="mb-8">
            <button
              onClick={() => setCategoryOpen(!categoryOpen)}
              className="flex items-center justify-between w-full text-left font-medium text-gray-900 mb-4"
            >
              Category
              {categoryOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            
            {categoryOpen && (
              <div className="space-y-3">
                {[
                  { key: 'deals', label: 'Deals' },
                  { key: 'gummies', label: 'Gummies' },
                  { key: 'chocolates', label: 'Chocolates' },
                  { key: 'drinks', label: 'Drinks' },
                  { key: 'dried', label: 'Dried' },
                  { key: 'capsules', label: 'Capsules' },
                  { key: 'merch', label: 'Merch' }
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={categoryFilters[key]}
                      onChange={() => handleCategoryChange(key)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-3 text-sm text-gray-700">{label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Primary Use Filter */}
          <div>
            <button
              onClick={() => setPrimaryUseOpen(!primaryUseOpen)}
              className="flex items-center justify-between w-full text-left font-medium text-gray-900 mb-4"
            >
              Primary Use
              {primaryUseOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            
            {primaryUseOpen && (
              <div className="space-y-3">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={primaryUseFilters.therapeutic}
                    onChange={() => handlePrimaryUseChange('therapeutic')}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-3 text-sm text-gray-700">Therapeutic</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={primaryUseFilters.functional}
                    onChange={() => handlePrimaryUseChange('functional')}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-3 text-sm text-gray-700">Functional / Medicinal</span>
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {/* Header Banner */}
          <div className="bg-slate-400 rounded-lg h-24 mb-8"></div>

          {/* Deals Section */}
          <div className="mb-6">
            <div className="flex items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">Deals</h2>
              <ChevronDown className="ml-2 text-gray-600" size={20} />
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="relative rounded-4xl border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                  style={{ backgroundColor: '#8EAFF633' }}
                  onClick={() => product.hasStock && router.push(`/productdetails?id=${product.id}`)}
                >
                  {/* Product Image with Coming Soon overlay inside */}
                  <div className="w-full h-64 bg-gray-100 rounded-t-4xl overflow-hidden relative">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200"></div>
                    )}
                    {/* Coming Soon Watermark inside image */}
                    {!product.hasStock && (
                      <div className="absolute inset-0 flex items-center justify-center z-10">
                        <div className="text-3xl font-bold text-gray-300 rotate-12 select-none text-center">
                          Coming<br />Soon
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Card Content */}
                  <div className="p-4">
                    <div className="space-y-3">
                      <h3 className="font-medium text-gray-900 text-sm">{product.name}</h3>
                      <p className="text-lg font-semibold text-gray-900">{product.price}</p>
                      {/* Tags */}
                      <div className="flex flex-wrap p-4  gap-1">
                        {product.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs rounded-full"
                            style={{
                              backgroundColor: index === 0 ? '#B3194275' : index === 1 ? '#8b5cf6' : '#CD45B480',
                              color: 'white'
                            }}
                          >
                            {tagEmojis[tag] || '❓'} {tag}
                          </span>
                        ))}
                      </div>
                      {/* Add to Cart Button */}
                      <div className="flex justify-center mt-4">
                        <button
                          className={`w-[40%] py-2 px-4 rounded-4xl text-sm font-medium transition-colors ${
                            product.hasStock
                              ? 'bg-[#536690] text-white hover:bg-[#536690]'
                              : 'bg-slate-400 text-white cursor-not-allowed'
                          }`}
                          disabled={!product.hasStock}
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent card click event
                            if (product.hasStock) {
                              alert(`Added ${product.name} to cart!`);
                            }
                          }}
                        >
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Menu;