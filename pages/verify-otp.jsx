import { useState, useEffect } from 'react';
import { ArrowRight, User } from 'lucide-react';
import { useRouter } from 'next/router.js';
import { Api, toast } from '../service/service.js';
// import { toast } from 'react-toastify';

export default function OtpVerificationPage({ user, loader }) {
  const router = useRouter();
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [userPhone, setUserPhone] = useState('');

  useEffect(() => {
    // Get user details from temporary storage
    if (typeof window !== 'undefined') {
      const userDetail = localStorage.getItem('tempAdminDetail');
      if (userDetail) {
        const user = JSON.parse(userDetail);
        if (user.phone) {
          setUserPhone(user.phone);
        }
      } else {
        // If no temp data, redirect back to login
        router.push('/');
      }
    }
  }, [router]);

  const handleInputChange = (e) => {
    setOtp(e.target.value);
    setError('');
  };

  const handleSubmit = async () => {
    // Basic validation
    if (!otp || otp.trim() === '') {
      setError('Please enter OTP');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      
      const response = await Api('post', 'auth/admin-verify-otp', {
        otp,
        phone: userPhone
      }, router);
      
      if (response.success) {
        if (response.token && response.user) {
          console.log('OTP Response User:', response.user);
          
          // Clear temporary storage
          localStorage.removeItem('tempAdminDetail');
          localStorage.removeItem('tempAdminToken');
          
          // Clear any old tokens
          localStorage.removeItem('token');
          localStorage.removeItem('userDetail');
          
          // Store with proper admin keys
          localStorage.setItem('adminToken', response.token);
          localStorage.setItem('adminDetail', JSON.stringify(response.user));
          
          // Dispatch auth state changed event
          document.dispatchEvent(new Event('auth-state-changed'));
          
          // Show success toast message
          toast.success('Login successful!', {
            position: "top-center",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
          
          // Redirect to dashboard
          router.push('/dashboard');
        }
      } else {
        toast.error(response.message || 'OTP verification failed. Please try again.', {
          position: "top-center",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        setError(response.message || 'OTP verification failed. Please try again.');
      }
    } catch (err) {
      console.error('OTP verification error:', err);
      toast.error('An error occurred during OTP verification. Please try again.', {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gradient-to-r from-blue-400/20 to-purple-400/20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-gradient-to-r from-indigo-400/20 to-blue-400/20 blur-3xl"></div>
      </div>

      {/* Main container */}
      <div className="relative w-full max-w-lg">
        {/* Glass morphism card */}
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 sm:p-10">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-[#80A6F7] to-[#80A6F7] rounded-full mb-4 shadow-lg">
              <User className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">
              Verify OTP
            </h1>
            <p className="text-gray-600 text-sm">
              Enter the OTP sent to your phone
            </p>
          </div>

          {/* Form */}
          <div className="space-y-6">
            {/* OTP field */}
            <div className="group">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                One-Time Password
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="otp"
                  value={otp}
                  onChange={handleInputChange}
                  className="w-full px-4 text-center text-gray-700 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm placeholder-gray-400 text-lg tracking-widest"
                  placeholder="Enter OTP"
                  maxLength={6}
                  required
                />
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="text-red-500 text-sm mb-4 p-3 bg-red-50 rounded-xl border border-red-200">
                {error}
              </div>
            )}
            
            {/* Submit button */}
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-[#80A6F7] to-[#6366f1] hover:from-[#6366f1] hover:to-[#80A6F7] text-white font-semibold py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <span>Verify & Login</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            {/* Resend OTP */}
            <div className="text-center mt-4">
              <button 
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                onClick={() => router.push('/')}
              >
                Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}