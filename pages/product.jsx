import { useState } from 'react';
import { ChevronDown, ChevronUp, ChevronRight } from 'lucide-react';

function Checkbox({ id, checked, onCheckedChange }) {
  return (
    <input
      id={id}
      type="checkbox"
      checked={checked}
      onChange={e => onCheckedChange(e.target.checked)}
      className="form-checkbox h-5 w-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
    />
  );
}

export default function ProductPage() {
  const [isDealsSectionOpen, setIsDealsSectionOpen] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedPrimaryUse, setSelectedPrimaryUse] = useState([]);

  const categories = [
    'Deals',
    'Gummies', 
    'Chocolates',
    'Drinks',
    'Dried',
    'Capsules',
    'Merch'
  ];

  const primaryUseOptions = [
    'Therapeutic',
    'Functional / Medicinal'
  ];

  const products = [
    {
      id: 1,
      name: "Lion's Mane Capsules",
      price: 50.00,
      image: "/images/img3.png",
      tags: ['Joy', 'Euphoric', 'Creative'],
      tagColors: ['bg-pink-300', 'bg-purple-300', 'bg-green-300']
    },
    {
      id: 2,
      name: "Product Name",
      price: 0.00,
      image: null,
      isComingSoon: true,
      tags: ['Effects / Experiences', 'Effects / Experiences'],
      tagColors: ['bg-blue-300', 'bg-blue-300']
    },
    {
      id: 3,
      name: "Product Name", 
      price: 0.00,
      image: null,
      isComingSoon: true,
      tags: ['Effects / Experiences', 'Effects / Experiences', 'Effects / Experiences'],
      tagColors: ['bg-blue-300', 'bg-blue-300', 'bg-blue-300']
    },
    {
      id: 4,
      name: "Product Name",
      price: 0.00,
      image: null,
      isComingSoon: true,
      tags: ['Effects / Experiences', 'Effects / Experiences'],
      tagColors: ['bg-blue-300', 'bg-blue-300']
    }
  ];

  const handleCategoryChange = (category, checked) => {
    if (checked) {
      setSelectedCategories([...selectedCategories, category]);
    } else {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    }
  };

  const handlePrimaryUseChange = (option, checked) => {
    if (checked) {
      setSelectedPrimaryUse([...selectedPrimaryUse, option]);
    } else {
      setSelectedPrimaryUse(selectedPrimaryUse.filter(o => o !== option));
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="flex flex-col md:flex-row max-w-7xl mx-auto">
        {/* Sidebar - Category Filters */}
        <div className="w-full md:w-64 p-4 md:p-6 border-b md:border-b-0 md:border-r border-gray-200">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm text-gray-800">Category</h3>
              <ChevronUp className="w-4 h-4 text-gray-600" />
            </div>
            <div className="space-y-3">
              {categories.map((category) => (
                <div key={category} className="flex items-center space-x-2">
                  <Checkbox
                    id={category}
                    checked={selectedCategories.includes(category)}
                    onCheckedChange={(checked) => handleCategoryChange(category, checked)}
                  />
                  <label htmlFor={category} className="text-sm cursor-pointer text-gray-700">
                    {category}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Primary Use Filter */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm text-gray-800">Primary Use</h3>
              <ChevronUp className="w-4 h-4 text-gray-600" />
            </div>
            <div className="space-y-3">
              {primaryUseOptions.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <Checkbox
                    id={option}
                    checked={selectedPrimaryUse.includes(option)}
                    onCheckedChange={(checked) => handlePrimaryUseChange(option, checked)}
                  />
                  <label htmlFor={option} className="text-sm cursor-pointer text-gray-700">
                    {option}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 md:p-6">
          {/* Breadcrumb */}
          <div className="mb-6">
            <nav className="text-sm text-gray-500">
              <span>Home</span>
              <span className="mx-2">&gt;</span>
              <span>Menu</span>
            </nav>
          </div>

          {/* Main Content Area */}
          <div className="w-full overflow-hidden rounded-lg bg-gray-200 md:bg-blue-200 mb-6 h-16 md:h-24 flex items-center justify-center">
            {/* Placeholder for banner/header image */}
            <span className="text-gray-500 md:text-blue-500 font-medium">Banner Area</span>
          </div>

          {/* Deals Section */}
          <div className="mb-8">
            <div 
              className="flex items-center gap-2 mb-6 cursor-pointer"
              onClick={() => setIsDealsSectionOpen(!isDealsSectionOpen)}
            >
              <h2 className="text-2xl font-bold text-gray-900">Deals</h2>
              {isDealsSectionOpen ? (
                <ChevronUp className="w-6 h-6 text-gray-600" />
              ) : (
                <ChevronDown className="w-6 h-6 text-gray-600" />
              )}
            </div>

            {isDealsSectionOpen && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {products.map((product) => (
                  <div key={product.id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow overflow-hidden">
                    {/* Product Image */}
                    <div className="aspect-square mb-4 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                      {product.image ? (
                        <img 
                          src={product.image} 
                          alt={product.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <div className="text-gray-300 text-5xl font-bold text-center leading-tight opacity-50 transform -rotate-12">
                          Coming<br />Soon
                        </div>
                      )}
                    </div>

                    {/* Product Info with Background */}
                    <div className="mb-4 bg-[#8EAFF6CC] p-3 rounded-lg -mt-2 text-white">
                      <h3 className="font-semibold mb-1">{product.name}</h3>
                      <p className="text-lg font-bold">${product.price.toFixed(2)}</p>
                      
                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {product.tags.map((tag, index) => (
                          <span 
                            key={`${product.id}-${tag}-${index}`}
                            className="text-xs font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Add to Cart Button */}
                    <button 
                      className={`w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-full transition-colors ${product.isComingSoon ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={product.isComingSoon}
                    >
                      Add to Cart
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}