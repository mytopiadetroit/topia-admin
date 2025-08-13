import React, { useState, useEffect } from 'react';
import { ChevronRight, Shield, Lock, Eye, Users, FileText, AlertCircle, CheckCircle, Clock } from 'lucide-react';

export default function PrivacyPolicy() {
  const [isVisible, setIsVisible] = useState(false);
  const [activeSection, setActiveSection] = useState('');

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const sections = [
    { id: 'information-collection', title: 'Information We Collect', icon: <FileText className="w-5 h-5" /> },
    { id: 'how-we-use', title: 'How We Use Information', icon: <Eye className="w-5 h-5" /> },
    { id: 'data-sharing', title: 'Data Sharing & Disclosure', icon: <Users className="w-5 h-5" /> },
    { id: 'data-security', title: 'Data Security', icon: <Shield className="w-5 h-5" /> },
    { id: 'your-rights', title: 'Your Privacy Rights', icon: <Lock className="w-5 h-5" /> },
    // { id: 'cookies', title: 'Cookies & Tracking', icon: <AlertCircle className="w-5 h-5" /> },
    { id: 'contact', title: 'Contact Us', icon: <CheckCircle className="w-5 h-5" /> },
  ];

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100;
      
      sections.forEach(section => {
        const element = document.getElementById(section.id);
        if (element) {
          const top = element.offsetTop;
          const height = element.offsetHeight;
          
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(section.id);
          }
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        {/* Background Gradient */}
        <div 
          className="absolute inset-0 z-0"
          style={{
            background: 'linear-gradient(135deg, #8CABFF 0%, #ffffff 50%, #8EAFF6 100%)',
            opacity: 0.1
          }}
        />
        
        {/* Decorative Elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-blue-100 rounded-full opacity-50 animate-pulse" />
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-gray-100 rounded-full opacity-30" />
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-blue-200 rounded-full opacity-40" />
        
        <div className={`relative z-10 max-w-4xl mx-auto text-center transform transition-all duration-1000 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`}>
          <div className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
            <Shield className="w-5 h-5 text-[#8CABFF]" />
            <span className="text-sm font-semibold text-[#2E2E2E]">Your Privacy Matters</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight text-[#2E2E2E]">
            Privacy Policy
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            We're committed to protecting your privacy and being transparent about how we collect, use, and safeguard your personal information.
          </p>
          
          <div className="flex items-center justify-center space-x-2 text-gray-500">
            <Clock className="w-4 h-4" />
            <span className="text-sm">Last updated: January 15, 2025</span>
          </div>
        </div>
      </section>

      {/* Navigation & Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-4 gap-12">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <h3 className="font-bold text-[#2E2E2E] mb-4">Quick Navigation</h3>
                <nav className="space-y-2">
                  {sections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      className={`w-full text-left flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                        activeSection === section.id
                          ? 'bg-[#8CABFF] text-white'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {section.icon}
                      <span className="text-sm font-medium">{section.title}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="space-y-16">
              
              {/* Information Collection */}
              <section id="information-collection" className="scroll-mt-8">
                <div className="bg-white rounded-3xl border border-gray-200 p-8 lg:p-12 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-12 h-12 bg-[#8CABFF] rounded-full flex items-center justify-center">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-2xl lg:text-3xl font-bold text-[#2E2E2E]">Information We Collect</h2>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h4 className="font-semibold text-[#2E2E2E] mb-3">Personal Information</h4>
                      <ul className="space-y-2 text-gray-600">
                        <li className="flex items-start space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                          <span>Name, email address, and contact information</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                          <span>Account credentials and profile information</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                          <span>Payment and billing information</span>
                        </li>
                      </ul>
                    </div>
                    
                    <div className="bg-blue-50 rounded-xl p-6">
                      <h4 className="font-semibold text-[#2E2E2E] mb-3">Usage Information</h4>
                      <p className="text-gray-600 leading-relaxed">
                        We collect information about how you interact with our platform, including pages visited, features used, and engagement patterns to improve your wellness journey.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* How We Use Information */}
              <section id="how-we-use" className="scroll-mt-8">
                <div className="bg-white rounded-3xl border border-gray-200 p-8 lg:p-12 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-12 h-12 bg-[#8EAFF6] rounded-full flex items-center justify-center">
                      <Eye className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-2xl lg:text-3xl font-bold text-[#2E2E2E]">How We Use Your Information</h2>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-6 border border-blue-100">
                        <h4 className="font-semibold text-[#2E2E2E] mb-2">Service Delivery</h4>
                        <p className="text-gray-600 text-sm">Provide personalized wellness recommendations and maintain your account</p>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-white rounded-xl p-6 border border-green-100">
                        <h4 className="font-semibold text-[#2E2E2E] mb-2">Communication</h4>
                        <p className="text-gray-600 text-sm">Send important updates, newsletters, and respond to your inquiries</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl p-6 border border-purple-100">
                        <h4 className="font-semibold text-[#2E2E2E] mb-2">Platform Improvement</h4>
                        <p className="text-gray-600 text-sm">Analyze usage patterns to enhance our services and user experience</p>
                      </div>
                      <div className="bg-gradient-to-br from-orange-50 to-white rounded-xl p-6 border border-orange-100">
                        <h4 className="font-semibold text-[#2E2E2E] mb-2">Legal Compliance</h4>
                        <p className="text-gray-600 text-sm">Meet legal obligations and protect against fraud</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Data Sharing */}
              <section id="data-sharing" className="scroll-mt-8">
                <div className="bg-white rounded-3xl border border-gray-200 p-8 lg:p-12 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-12 h-12 bg-[#2E2E2E] rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-2xl lg:text-3xl font-bold text-[#2E2E2E]">Data Sharing & Disclosure</h2>
                  </div>
                  
                  <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="w-5 h-5 text-red-500 mt-1" />
                      <div>
                        <h4 className="font-semibold text-red-800 mb-2">We Never Sell Your Data</h4>
                        <p className="text-red-700 text-sm">Your personal information is never sold to third parties for marketing purposes.</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-semibold text-[#2E2E2E]">We may share information only in these specific circumstances:</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-xl p-4">
                        <h5 className="font-medium text-[#2E2E2E] mb-2">Service Providers</h5>
                        <p className="text-gray-600 text-sm">Trusted partners who help us deliver services (payment processing, hosting)</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4">
                        <h5 className="font-medium text-[#2E2E2E] mb-2">Legal Requirements</h5>
                        <p className="text-gray-600 text-sm">When required by law or to protect rights and safety</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Data Security */}
              <section id="data-security" className="scroll-mt-8">
                <div className="bg-white rounded-3xl border border-gray-200 p-8 lg:p-12 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-2xl lg:text-3xl font-bold text-[#2E2E2E]">Data Security</h2>
                  </div>
                  
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-8 mb-6">
                    <p className="text-gray-700 leading-relaxed mb-4">
                      We implement industry-standard security measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction.
                    </p>
                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
                          <Lock className="w-6 h-6 text-white" />
                        </div>
                        <p className="font-medium text-gray-700">SSL Encryption</p>
                      </div>
                      <div className="text-center">
                        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                          <Shield className="w-6 h-6 text-white" />
                        </div>
                        <p className="font-medium text-gray-700">Secure Storage</p>
                      </div>
                      <div className="text-center">
                        <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-2">
                          <Eye className="w-6 h-6 text-white" />
                        </div>
                        <p className="font-medium text-gray-700">Access Controls</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Your Rights */}
              <section id="your-rights" className="scroll-mt-8">
                <div className="bg-white rounded-3xl border border-gray-200 p-8 lg:p-12 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                      <Lock className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-2xl lg:text-3xl font-bold text-[#2E2E2E]">Your Privacy Rights</h2>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="border border-gray-200 rounded-xl p-4">
                        <h4 className="font-semibold text-[#2E2E2E] mb-2">Access & Portability</h4>
                        <p className="text-gray-600 text-sm">Request copies of your personal data in a portable format</p>
                      </div>
                      <div className="border border-gray-200 rounded-xl p-4">
                        <h4 className="font-semibold text-[#2E2E2E] mb-2">Correction</h4>
                        <p className="text-gray-600 text-sm">Update or correct inaccurate personal information</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="border border-gray-200 rounded-xl p-4">
                        <h4 className="font-semibold text-[#2E2E2E] mb-2">Deletion</h4>
                        <p className="text-gray-600 text-sm">Request deletion of your personal data (subject to legal requirements)</p>
                      </div>
                      <div className="border border-gray-200 rounded-xl p-4">
                        <h4 className="font-semibold text-[#2E2E2E] mb-2">Opt-out</h4>
                        <p className="text-gray-600 text-sm">Unsubscribe from marketing communications at any time</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Cookies */}
              {/* <section id="cookies" className="scroll-mt-8">
                <div className="bg-white rounded-3xl border border-gray-200 p-8 lg:p-12 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-2xl lg:text-3xl font-bold text-[#2E2E2E]">Cookies & Tracking Technologies</h2>
                  </div>
                  
                  <div className="bg-orange-50 rounded-xl p-6">
                    <p className="text-gray-700 leading-relaxed mb-4">
                      We use cookies and similar technologies to enhance your browsing experience, remember your preferences, and analyze site traffic. You can control cookie preferences through your browser settings.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="bg-white px-3 py-1 rounded-full text-sm text-gray-600">Essential Cookies</span>
                      <span className="bg-white px-3 py-1 rounded-full text-sm text-gray-600">Analytics</span>
                      <span className="bg-white px-3 py-1 rounded-full text-sm text-gray-600">Preferences</span>
                      <span className="bg-white px-3 py-1 rounded-full text-sm text-gray-600">Marketing</span>
                    </div>
                  </div>
                </div>
              </section> */}

              {/* Contact */}
              <section id="contact" className="scroll-mt-8">
                <div className="bg-gradient-to-r from-[#8CABFF] to-[#8EAFF6] rounded-3xl p-8 lg:p-12 text-white">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-2xl lg:text-3xl font-bold">Contact Our Privacy Team</h2>
                  </div>
                  
                  <p className="text-white/90 leading-relaxed mb-8">
                    Have questions about this Privacy Policy or how we handle your personal information? Our dedicated privacy team is here to help.
                  </p>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-white/10 rounded-xl p-6">
                      <h4 className="font-semibold mb-3">Email Us</h4>
                      <p className="text-white/80 text-sm">privacy@wellnessplatform.com</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-6">
                      <h4 className="font-semibold mb-3">Response Time</h4>
                      <p className="text-white/80 text-sm">We respond within 48 hours</p>
                    </div>
                  </div>
                  
                  <button className="bg-white text-[#8CABFF] hover:bg-gray-100 px-8 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 flex items-center space-x-2 mt-8">
                    <span>Contact Privacy Team</span>
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}