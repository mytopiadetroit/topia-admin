import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import { useUser } from '../context/UserContext';

export default function ProductDetails() {
  const [quantity, setQuantity] = useState(1);
  const router = useRouter();
  const { id } = router.query;
  const { isLoggedIn, loading } = useUser();
  
  useEffect(() => {
    // Only check after loading is complete
    if (!loading) {
      // Check if user is logged in
      if (!isLoggedIn) {
        // Show toast notification
        toast.error('Please login to view product details', {
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

  // This would typically come from an API call using the ID
  // For now, we'll use static data but in a real app you would fetch based on ID
  const [product, setProduct] = useState({
    id: 1,
    name: "Lion's Mane Capsules",
    price: 50.00,
    image: "/images/details.png",
    description: {
      main: "Unlock your brain's full potential with Shroomtopia's Lion's Mane Capsules, your daily dose of cognitive clarity and natural focus. Sourced from 100% organic Lion's Mane (Hericium erinaceus), this powerful nootropic mushroom has been used for centuries to support brain health, enhance memory, and promote a calm, clear mind.",
      details: "Each capsule delivers a potent dual extract for maximum bioavailability—no fillers, no fluff, just pure mushroom power. Whether you're studying, working, or simply staying sharp, Lion's Mane helps you stay mentally agile and balanced throughout the day."
    },
    tags: ['Connection', 'Insight', 'Euphoric', 'Creative']
  });
  
  useEffect(() => {
    // In a real application, you would fetch product data based on the ID
    // For example: fetchProductById(id).then(data => setProduct(data));
    
    // For this demo, we're just using static data
    // You could add more products and select based on ID
    if (id) {
      console.log(`Fetching product with ID: ${id}`);
      // This is where you would make an API call in a real app
    }
  }, [id]);

  // User ratings data
  const ratings = {
    count: 15,
    stats: [
      { effect: 'Euphoric', percentage: 85 },
      { effect: 'Joy', percentage: 75 },
      { effect: 'Creative', percentage: 80 }
    ]
  };

  // Tag color mapping with icons
  const tagData = [
    { name: 'Connection', color: 'bg-[#B3194275] text-gray-800', icon: '🔗' },
    { name: 'Insight', color: 'bg-[#CD45B4] text-gray-800', icon: '👀' },
    { name: 'Euphoric', color: 'bg-[#8A38F58C] text-gray-800', icon: '⭐' },
    { name: 'Creative', color: 'bg-[#53669080] text-gray-800', icon: '🌿' }
  ];

  // Handle quantity change
  const increaseQuantity = () => setQuantity(prev => prev + 1);
  const decreaseQuantity = () => setQuantity(prev => prev > 1 ? prev - 1 : 1);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center text-sm text-gray-500 mb-8">
          <Link href="/" className="hover:text-gray-700">Home</Link>
          <span className="mx-2">›</span>
          <Link href="/menu" className="hover:text-gray-700">Menu</Link>
          <span className="mx-2">›</span>
          <span className="text-gray-700">Product Page</span>
        </nav>

        {/* Product Section */}
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left Column - Images */}
          <div className="md:w-1/2">
            {/* Main Image */}
            <div className="bg-gray-50 rounded-4xl verflow-hidden mb-4">
              <img 
                src={product.image} 
                alt={product.name}
                className="w-full h-auto object-cover"
              />
            </div>
            
            {/* Thumbnail Images */}
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((item) => (
                <div key={item} className="bg-gray-200 rounded-lg aspect-square flex items-center justify-center">
                  <span className="text-gray-400 text-sm">Product Image</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Product Info */}
          <div className="md:w-1/2">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>
            
            {/* Tags */}
            {/* <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {tagData.map((tag) => (
                  <span 
                    key={tag.name} 
                    className={`px-3 py-2 rounded-full text-sm font-medium flex items-center gap-2 ${tag.color}`}
                  >
                    <span className="text-xs">{tag.icon}</span>
                    {tag.name}
                  </span>
                ))}
              </div>
            </div> */}
            
            <div className="mb-6">
              <h2 className="text-lg text-gray-700 font-semibold mb-2">Description</h2>
              <p className="text-gray-700 mb-4">{product.description.main}</p>
              <p className="text-gray-700">{product.description.details}</p>
            </div>

            {/* Add to Cart Section */}
            <div className="flex items-center gap-4 mb-8">
              <button 
                className="bg-[#536690] hover:bg-[#536690] text-white font-medium py-3 px-8 rounded-full flex items-center justify-center gap-2 flex-1 transition-colors"
              >
                <span>Add to Cart</span>
                <span className="text-xl">+</span>
              </button>
              
              <button className="border border-gray-300 bg-white text-gray-500 font-medium py-3 px-6 rounded-full hover:bg-gray-50 transition-colors flex items-center justify-center">
                <span className="mr-2">Wishlist</span>
                <Heart className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Ratings and Tags Section */}
        <div className="mt-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Ratings Section - Left Side */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Ratings</h2>
                <span className="text-sm text-gray-500">{ratings.count} Ratings</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {ratings.stats.map((stat) => (
                  <div key={stat.effect} className="flex flex-col items-center">
                    <div className="w-32 h-32 rounded-full flex items-center justify-center mb-4 relative">
                      {stat.effect === 'Euphoric' && (
                        <div className="absolute inset-0  flex items-center justify-center">
                        <img src="/images/g1.png" alt="" />
                        </div>
                      )}
                      {stat.effect === 'Joy' && (
                        <div className="absolute inset-0  flex items-center justify-center">
                        <img src="/images/g2.png" alt="" />
                        </div>
                      )}
                      {stat.effect === 'Creative' && (
                        <div className="absolute inset-0  flex items-center justify-center">
                         <img src="/images/g3.png" alt="" />
                        </div>
                      )}
                    </div>
                    {/* <p className="text-gray-700 font-medium">{stat.percentage}% Users felt {stat.effect}</p> */}
                  </div>
                ))}
              </div>
            </div>

            {/* Tags Section - Right Side */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Tags</h3>
              <div className="flex flex-wrap gap-3">
                {tagData.map((tag) => (
                  <span 
                    key={tag.name} 
                    className={`px-4 py-3 rounded-full text-sm font-medium flex items-center gap-2 ${tag.color}`}
                  >
                    <span className="text-sm">{tag.icon}</span>
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>


      </div>
    </div>
  );
}