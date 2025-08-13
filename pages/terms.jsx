'use client';
import { useState, useEffect } from 'react';
import { ChevronRight, Shield, FileText, Users, AlertCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '@/components/Footer';
import Image from 'next/image';

export default function Terms() {
  const [isVisible, setIsVisible] = useState(false);
  const [activeSection, setActiveSection] = useState('terms');

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Top notification bar */}
     

    

      {/* Navigation Pills */}
      <section className="py-8 px-4 border-b border-gray-200">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-wrap gap-4 justify-center">
            {[
              { id: 'terms', label: 'Terms Overview', icon: FileText },
              { id: 'usage', label: 'Platform Usage', icon: Users },
              { id: 'content', label: 'Content Policy', icon: Shield },
              { id: 'liability', label: 'Liability', icon: AlertCircle }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-4xl font-semibold transition-all duration-300 ${
                  activeSection === item.id 
                    ? 'bg-[#2E2E2E] text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span className="text-sm">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          
          {/* Terms Overview */}
          <div id="terms" className="mb-16">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl p-8 lg:p-12 mb-12 border border-blue-100">
              <div className="flex items-center mb-6">
                <div className="bg-[#8EAFF633] rounded-full p-3 mr-4">
                  <FileText className="w-6 h-6 text-[#2E2E2E]" />
                </div>
                <h2 className="text-2xl lg:text-3xl font-bold text-[#2E2E2E]">Welcome to Our Community</h2>
              </div>
              <p className="text-gray-700 text-lg leading-relaxed mb-6">
                These Terms of Use govern your access to and use of our wellness platform, including our website, mobile applications, and all related services. By accessing or using our platform, you agree to be bound by these terms.
              </p>
              <div className="bg-white rounded-2xl p-6 border-l-4 border-[#8EAFF6]">
                <h3 className="font-semibold text-[#2E2E2E] mb-3">Key Points:</h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start">
                    <ChevronRight className="w-4 h-4 mt-1 mr-2 text-[#8EAFF6]" />
                    You must be 18 years or older to use our services
                  </li>
                  <li className="flex items-start">
                    <ChevronRight className="w-4 h-4 mt-1 mr-2 text-[#8EAFF6]" />
                    Our platform is for informational and community purposes
                  </li>
                  <li className="flex items-start">
                    <ChevronRight className="w-4 h-4 mt-1 mr-2 text-[#8EAFF6]" />
                    You're responsible for maintaining account security
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Platform Usage */}
          <div id="usage" className="mb-16">
            <div className="grid lg:grid-cols-2 gap-12 items-center mb-12">
              <div>
                <div className="mb-4">
                  <span className="inline-block text-[#2E2E2E] text-sm font-semibold px-4 py-2 bg-gray-100 rounded-full">
                    Platform Guidelines
                  </span>
                </div>
                <h2 className="text-3xl lg:text-4xl font-bold text-[#2E2E2E] mb-6">
                  Acceptable Use<br />
                  Policy
                </h2>
                <p className="text-[#2E2E2E] text-lg mb-8 leading-relaxed">
                  Our platform is designed to foster a supportive wellness community. Please use our services responsibly and respectfully.
                </p>
              </div>
              {/* <div className="flex justify-center">
                <Image 
                  src="/images/img2.png"
                  alt="Community guidelines"
                  className="w-full max-w-[300px] h-[250px] object-contain rounded-2xl"
                  width={300}
                  height={250}
                />
              </div> */}
            </div>

            <div className="space-y-8">
              <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
                <h3 className="text-xl font-bold text-[#2E2E2E] mb-4">Permitted Activities</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <ChevronRight className="w-4 h-4 mt-1 mr-2 text-green-500" />
                      <span className="text-gray-600">Browse and purchase wellness products</span>
                    </li>
                    <li className="flex items-start">
                      <ChevronRight className="w-4 h-4 mt-1 mr-2 text-green-500" />
                      <span className="text-gray-600">Share authentic product reviews</span>
                    </li>
                    <li className="flex items-start">
                      <ChevronRight className="w-4 h-4 mt-1 mr-2 text-green-500" />
                      <span className="text-gray-600">Participate in community discussions</span>
                    </li>
                  </ul>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <ChevronRight className="w-4 h-4 mt-1 mr-2 text-green-500" />
                      <span className="text-gray-600">Access educational resources</span>
                    </li>
                    <li className="flex items-start">
                      <ChevronRight className="w-4 h-4 mt-1 mr-2 text-green-500" />
                      <span className="text-gray-600">Earn and redeem rewards</span>
                    </li>
                    <li className="flex items-start">
                      <ChevronRight className="w-4 h-4 mt-1 mr-2 text-green-500" />
                      <span className="text-gray-600">Connect with like-minded individuals</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="bg-red-50 rounded-2xl p-8 border border-red-200">
                <h3 className="text-xl font-bold text-red-800 mb-4">Prohibited Activities</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <AlertCircle className="w-4 h-4 mt-1 mr-2 text-red-500" />
                      <span className="text-red-700">Posting false or misleading information</span>
                    </li>
                    <li className="flex items-start">
                      <AlertCircle className="w-4 h-4 mt-1 mr-2 text-red-500" />
                      <span className="text-red-700">Harassment or inappropriate behavior</span>
                    </li>
                    <li className="flex items-start">
                      <AlertCircle className="w-4 h-4 mt-1 mr-2 text-red-500" />
                      <span className="text-red-700">Unauthorized commercial activities</span>
                    </li>
                  </ul>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <AlertCircle className="w-4 h-4 mt-1 mr-2 text-red-500" />
                      <span className="text-red-700">Violation of intellectual property rights</span>
                    </li>
                    <li className="flex items-start">
                      <AlertCircle className="w-4 h-4 mt-1 mr-2 text-red-500" />
                      <span className="text-red-700">Attempting to hack or compromise security</span>
                    </li>
                    <li className="flex items-start">
                      <AlertCircle className="w-4 h-4 mt-1 mr-2 text-red-500" />
                      <span className="text-red-700">Sharing personal medical advice</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Content Policy */}
          <div id="content" className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-[#2E2E2E] mb-6">
                Content Guidelines
              </h2>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto leading-relaxed">
                We believe in fostering authentic, helpful, and respectful communication within our wellness community.
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8 mb-12">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 text-center">
                <div className="bg-blue-200 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Shield className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="font-bold text-[#2E2E2E] mb-3">User-Generated Content</h3>
                <p className="text-gray-600 text-sm">
                  You retain ownership of your content but grant us license to use it on our platform for community benefit.
                </p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 text-center">
                <div className="bg-green-200 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Users className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="font-bold text-[#2E2E2E] mb-3">Community Standards</h3>
                <p className="text-gray-600 text-sm">
                  All content must be respectful, truthful, and contribute positively to our wellness community.
                </p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 text-center">
                <div className="bg-purple-200 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <FileText className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="font-bold text-[#2E2E2E] mb-3">Content Moderation</h3>
                <p className="text-gray-600 text-sm">
                  We reserve the right to review, edit, or remove content that violates our community guidelines.
                </p>
              </div>
            </div>
          </div>

          {/* Liability Section */}
          <div id="liability" className="mb-16">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-3xl p-8 lg:p-12">
              <div className="text-center mb-8">
                <div className="bg-yellow-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-yellow-600" />
                </div>
                <h2 className="text-3xl lg:text-4xl font-bold text-[#2E2E2E] mb-4">
                  Important Disclaimers
                </h2>
                <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                  Please read these important limitations and disclaimers carefully.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-white rounded-2xl p-6">
                  <h3 className="font-bold text-[#2E2E2E] mb-4">Medical Disclaimer</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Our platform provides general wellness information for educational purposes only. Content on our platform is not intended as medical advice, diagnosis, or treatment. Always consult with qualified healthcare professionals before making any health-related decisions.
                  </p>
                </div>

                <div className="bg-white rounded-2xl p-6">
                  <h3 className="font-bold text-[#2E2E2E] mb-4">Limitation of Liability</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    We provide our platform "as is" and make no warranties about its availability, accuracy, or suitability for your needs. Our liability is limited to the maximum extent permitted by applicable law.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Section */}
          <div className="text-center">
            <div className="bg-gradient-to-r from-[#8EAFF633] to-[#8EAFF650] rounded-3xl p-8 lg:p-12">
              <h2 className="text-3xl font-bold text-[#2E2E2E] mb-6">
                Questions About Our Terms?
              </h2>
              <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
                If you have any questions about these Terms of Use, please don't hesitate to contact our support team.
              </p>
              <button className="bg-[#2E2E2E] hover:bg-gray-800 text-white px-8 py-4 rounded-4xl font-semibold transition-all duration-300 transform hover:scale-105 flex items-center space-x-2 mx-auto">
                <span>Contact Support</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}