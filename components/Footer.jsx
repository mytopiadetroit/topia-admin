import React from 'react';
import Footer from './Footer.jsx';

function App() {
  return (
    <div >
     
      
      {/* Footer Component */}
      <footer className="bg-gradient-to-r from-[#80A6F7] via-[#80A6F7] to-[#80A6F7] text-white">
        {/* Main Footer Content */}
        <div className="container mx-auto px-6 py-16">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            
            {/* Logo Section */}
            <div className="flex-shrink-0 ">
              <div className="flex items-center space-x-3">
                <div className="w-40 h-40   flex items-center justify-center">
                  <img src='/images/logo.png' className='mb-20'/>
                </div>
                
              </div>
            </div>

            {/* Newsletter Section */}
            <div className="text-center flex-1 max-w-md">
              <h3 className="text-2xl font-bold mb-3">Stay Updated With the Latest Insights</h3>
              <p className="text-sm opacity-90 mb-6 leading-relaxed">
                Subscribe to our newsletter to get insider tips, expert advice, and exclusive insights and updates tailored just for you.
              </p>
              <div className="flex border-white">
                 <input 
  type="email" 
  placeholder="Enter your email"
  className="flex-1 px-2 py-3 rounded-lg bg-[#80A6F7] text-white placeholder-white border border-white focus:outline-none focus:ring-2 focus:ring-white"
/>
                {/* <button className="bg-white text-purple-500 px-6 py-3 rounded-r-lg font-semibold hover:bg-gray-100 transition-colors">
                  Subscribe
                </button> */}
              </div>
            </div>

            {/* Navigation Links */}
            <div className="flex space-x-16">
              <div className="space-y-4">
                <a href="#" className="block hover:text-gray-200 transition-colors">Home</a>
                <a href="#" className="block hover:text-gray-200 transition-colors">Articles</a>
                <a href="#" className="block hover:text-gray-200 transition-colors">Events</a>
                <a href="#" className="block hover:text-gray-200 transition-colors">Podcast</a>
                <a href="#" className="block hover:text-gray-200 transition-colors">Contact</a>
              </div>
              <div className="space-y-4">
                <a href="#" className="block hover:text-gray-200 transition-colors">Register</a>
                <a href="#" className="block hover:text-gray-200 transition-colors">About Us</a>
                <a href="#" className="block hover:text-gray-200 transition-colors">Blogs</a>
                <a href="#" className="block hover:text-gray-200 transition-colors">Rewards</a>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="border-t border-white border-opacity-20">
          <div className="container mx-auto px-6 py-6">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <div className="flex items-center space-x-2 text-sm opacity-80">
                <span>©</span>
                <span>Copyright</span>
              </div>
              <div className="flex flex-wrap items-center space-x-6 text-sm">
                <a href="/terms" className="hover:text-gray-200 transition-colors opacity-80">Terms of Use</a>
                <span className="opacity-60">|</span>
                <a href="/privacypolicy" className="hover:text-gray-200 transition-colors opacity-80">Privacy Policy</a>
                <span className="opacity-60">|</span>
                <a href="#" className="hover:text-gray-200 transition-colors opacity-80">Cookie Policy</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;