import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Sidebar from '../components/sidebar';
import Swal from 'sweetalert2';
import { 
  MessageSquare, 
  Send, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  TrendingUp,
  Zap,
  Calendar,
  Eye
} from 'lucide-react';
import { 
  sendBulkSMSApi, 
  fetchSMSHistory, 
  fetchSMSStats, 
  previewSMSRecipients,
  sendBirthdaySMSManually,
  previewBirthdayUsers,
  searchUsersForSMS,
  sendIndividualSMS,
  fetchSMSReplies,
  fetchSMSReplyStats,
  respondToSMSReply,
  updateSMSReplyStatus,
  fetchSMSReplyDetails,
  previewTopiaMembers,
  sendToTopiaMembers
} from '../service/service';

const messageTemplates = {
  promotion: 'Special offer! Get 20% off on all products today. Visit Shroomtopia now!\n\nVisit: https://shroomtopiadetroit.com/',
  sale: 'Flash Sale Alert! Limited time offer on selected items. Shop now at Shroomtopia!\n\nVisit: https://shroomtopiadetroit.com/',
  event: 'Join us for our special event this weekend at Shroomtopia!\n\nVisit: https://shroomtopiadetroit.com/',
  reminder: 'You have unclaimed rewards! Visit Shroomtopia to redeem them.\n\nVisit: https://shroomtopiadetroit.com/'
};

export default function SMSNotifications() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('send');
  const [loading, setLoading] = useState(false);
  
  // Send SMS state
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('promotion');
  const [targetAudience, setTargetAudience] = useState('verified');
  const [recipients, setRecipients] = useState([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  
  // History state
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Stats state
  const [stats, setStats] = useState(null);
  
  // Birthday state
  const [birthdayUsers, setBirthdayUsers] = useState([]);
  const [birthdayLoading, setBirthdayLoading] = useState(false);
  
  // Detail view state
  const [selectedSMS, setSelectedSMS] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // Individual SMS state
  const [showIndividualModal, setShowIndividualModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]); // Changed to array for multiple users
  const [individualMessage, setIndividualMessage] = useState('');
  const [individualType, setIndividualType] = useState('custom');
  const [sendingIndividual, setSendingIndividual] = useState(false);

  // SMS Replies state
  const [smsReplies, setSmsReplies] = useState([]);
  const [repliesLoading, setRepliesLoading] = useState(false);
  const [repliesCurrentPage, setRepliesCurrentPage] = useState(1);
  const [repliesTotalPages, setRepliesTotalPages] = useState(1);
  const [repliesStats, setRepliesStats] = useState(null);
  const [repliesFilters, setRepliesFilters] = useState({
    messageType: 'all',
    status: 'all',
    search: ''
  });
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [selectedReply, setSelectedReply] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const [showTopiaModal, setShowTopiaModal] = useState(false);
  const [topiaMessage, setTopiaMessage] = useState('');
  const [topiaMembers, setTopiaMembers] = useState([]);
  const [selectedTopiaMembers, setSelectedTopiaMembers] = useState([]);
  const [topiaLoading, setTopiaLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/');
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistoryData();
    } else if (activeTab === 'stats') {
      fetchStatsData();
    } else if (activeTab === 'replies') {
      fetchRepliesData();
      fetchRepliesStatsData();
    }
  }, [activeTab, currentPage, repliesCurrentPage]);

  const previewRecipientsHandler = async () => {
    setPreviewLoading(true);
    try {
      const response = await previewSMSRecipients({ targetAudience }, router);
      if (response.success) {
        setRecipients(response.recipients);
        Swal.fire({
          icon: 'info',
          title: 'Recipients Preview',
          text: `Found ${response.count} recipients`,
          confirmButtonColor: '#80A6F7',
        });
      }
    } catch (error) {
      console.error('Error previewing recipients:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to preview recipients',
        confirmButtonColor: '#ef4444',
      });
    } finally {
      setPreviewLoading(false);
    }
  };

  const sendBulkSMS = async () => {
    if (!message.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Message Required',
        text: 'Please enter a message',
        confirmButtonColor: '#9333ea',
      });
      return;
    }

    const result = await Swal.fire({
      title: 'Send SMS?',
      text: `Send SMS to ${targetAudience.replace('_', ' ')} users?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#9333ea',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Send',
      cancelButtonText: 'Cancel',
    });

    if (!result.isConfirmed) return;

    setLoading(true);
    try {
      const response = await sendBulkSMSApi({
        message,
        type: messageType,
        targetAudience
      }, router);
      
      if (response.success) {
        await Swal.fire({
          icon: 'success',
          title: 'SMS Sending Started!',
          text: `SMS sending started! ${response.totalRecipients} recipients`,
          confirmButtonColor: '#9333ea',
          timer: 2000,
        });
        setMessage('');
        setActiveTab('history');
      }
    } catch (error) {
      console.error('Error sending SMS:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Failed to send SMS',
        confirmButtonColor: '#ef4444',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchHistoryData = async () => {
    setHistoryLoading(true);
    try {
      const response = await fetchSMSHistory(router, { page: currentPage, limit: 20 });
      if (response.success) {
        setHistory(response.notifications);
        setTotalPages(response.totalPages);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchStatsData = async () => {
    try {
      const response = await fetchSMSStats(router);
      if (response.success) {
        setStats(response.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };
  
  const previewBirthdayUsersHandler = async () => {
    setBirthdayLoading(true);
    try {
      const response = await previewBirthdayUsers(router);
      if (response.success) {
        setBirthdayUsers(response.users);
        Swal.fire({
          icon: 'info',
          title: 'Birthday Users Today',
          html: `
            <div class="text-left">
              <p class="mb-4"><strong>${response.count} users</strong> have birthday today:</p>
              ${response.users.slice(0, 10).map(u => `<p class="text-sm">🎂 ${u.fullName} - ${u.phone}</p>`).join('')}
              ${response.count > 10 ? `<p class="text-sm text-gray-500">...and ${response.count - 10} more</p>` : ''}
              <hr class="my-4">
              <div class="bg-blue-50 p-3 rounded">
                <p class="text-sm font-semibold text-blue-800 mb-2">Birthday Message:</p>
                <p class="text-sm text-blue-700">${response.message || '🎉 Happy Birthday [Name]! 🎂 Claim your special birthday gift at Shroomtopia today! Visit us or reply to redeem. - Shroomtopia Team'}</p>
              </div>
            </div>
          `,
          confirmButtonColor: '#9333ea',
          width: '600px'
        });
      }
    } catch (error) {
      console.error('Error previewing birthday users:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to preview birthday users',
        confirmButtonColor: '#ef4444',
      });
    } finally {
      setBirthdayLoading(false);
    }
  };
  
  const sendBirthdaySMSHandler = async () => {
    const result = await Swal.fire({
      title: 'Send Birthday SMS?',
      text: 'Send birthday wishes to all users with birthday today?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#9333ea',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Send',
      cancelButtonText: 'Cancel',
    });

    if (!result.isConfirmed) return;

    setBirthdayLoading(true);
    try {
      const response = await sendBirthdaySMSManually(router);
      
      if (response.success) {
        await Swal.fire({
          icon: 'success',
          title: 'Birthday SMS Sent!',
          text: `Birthday SMS sent to ${response.totalRecipients} users`,
          confirmButtonColor: '#9333ea',
          timer: 2000,
        });
        setActiveTab('history');
      }
    } catch (error) {
      console.error('Error sending birthday SMS:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Failed to send birthday SMS',
        confirmButtonColor: '#ef4444',
      });
    } finally {
      setBirthdayLoading(false);
    }
  };
  
  const viewSMSDetails = (sms) => {
    setSelectedSMS(sms);
    setShowDetailModal(true);
  };
  
  const searchUsersHandler = async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    setSearchLoading(true);
    try {
      const response = await searchUsersForSMS(query, router);
      if (response.success) {
        setSearchResults(response.users);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setSearchLoading(false);
    }
  };
  
  const sendIndividualSMSHandler = async () => {
    if (selectedUsers.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Users Selected',
        text: 'Please select at least one user',
        confirmButtonColor: '#9333ea',
      });
      return;
    }
    
    if (!individualMessage.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Message Required',
        text: 'Please enter a message',
        confirmButtonColor: '#9333ea',
      });
      return;
    }
    
    const result = await Swal.fire({
      title: 'Send SMS?',
      text: `Send SMS to ${selectedUsers.length} selected user${selectedUsers.length > 1 ? 's' : ''}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#9333ea',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Send',
      cancelButtonText: 'Cancel',
    });

    if (!result.isConfirmed) return;

    setSendingIndividual(true);
    try {
      // Send to multiple users using bulk SMS with custom target
      const response = await sendBulkSMSApi({
        message: individualMessage,
        type: individualType,
        targetAudience: 'custom',
        customUserIds: selectedUsers.map(u => u._id)
      }, router);
      
      if (response.success) {
        await Swal.fire({
          icon: 'success',
          title: 'SMS Sent!',
          text: `SMS sent to ${selectedUsers.length} user${selectedUsers.length > 1 ? 's' : ''}`,
          confirmButtonColor: '#9333ea',
          timer: 2000,
        });
        setShowIndividualModal(false);
        setSelectedUsers([]);
        setIndividualMessage('');
        setSearchQuery('');
        setSearchResults([]);
        setActiveTab('history');
      }
    } catch (error) {
      console.error('Error sending individual SMS:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Failed to send SMS',
        confirmButtonColor: '#ef4444',
      });
    } finally {
      setSendingIndividual(false);
    }
  };

  const previewTopiaMembersHandler = async () => {
    setTopiaLoading(true);
    try {
      const data = await previewTopiaMembers(router);
      if (data.success) {
        setTopiaMembers(data.members);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setTopiaLoading(false);
    }
  };

  const sendToTopiaMembersHandler = async () => {
    if (!topiaMessage.trim()) {
      Swal.fire({ icon: 'warning', title: 'Message Required', text: 'Please enter a message' });
      return;
    }

    if (selectedTopiaMembers.length === 0) {
      Swal.fire({ icon: 'warning', title: 'No Recipients', text: 'Please select at least one member' });
      return;
    }

    setTopiaLoading(true);
    try {
      const data = await sendToTopiaMembers(topiaMessage, selectedTopiaMembers, router);
      
      if (data.success) {
        Swal.fire({
          icon: 'success',
          title: 'SMS Sent!',
          text: `Message sent to ${data.totalMembers} Topia Circle members`,
          confirmButtonColor: '#10b981'
        });
        setShowTopiaModal(false);
        setTopiaMessage('');
        setSelectedTopiaMembers([]);
        setActiveTab('history');
        fetchHistoryData();
      } else {
        Swal.fire({ icon: 'error', title: 'Error', text: data.message });
      }
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to send SMS' });
    } finally {
      setTopiaLoading(false);
    }
  };

  // SMS Replies functions
  const fetchRepliesData = async () => {
    setRepliesLoading(true);
    try {
      const params = {
        page: repliesCurrentPage,
        limit: 20,
        ...repliesFilters
      };
      
      // Remove 'all' values
      if (params.messageType === 'all') delete params.messageType;
      if (params.status === 'all') delete params.status;
      if (!params.search || params.search.trim() === '') delete params.search;
      
      const response = await fetchSMSReplies(router, params);
      if (response.success) {
        setSmsReplies(response.replies);
        setRepliesTotalPages(response.totalPages);
      }
    } catch (error) {
      console.error('Error fetching SMS replies:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to fetch SMS replies',
        confirmButtonColor: '#ef4444',
      });
    } finally {
      setRepliesLoading(false);
    }
  };

  const fetchRepliesStatsData = async () => {
    try {
      const response = await fetchSMSReplyStats(router);
      if (response.success) {
        setRepliesStats(response.stats);
      }
    } catch (error) {
      console.error('Error fetching SMS reply stats:', error);
    }
  };

  const handleReplyToSMS = async () => {
    if (!replyMessage.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Message Required',
        text: 'Please enter a reply message',
        confirmButtonColor: '#9333ea',
      });
      return;
    }

    setSendingReply(true);
    try {
      const response = await respondToSMSReply(selectedReply._id, replyMessage, router);
      if (response.success) {
        await Swal.fire({
          icon: 'success',
          title: 'Reply Sent!',
          text: 'Your reply has been sent successfully',
          confirmButtonColor: '#9333ea',
          timer: 2000,
        });
        setShowReplyModal(false);
        setReplyMessage('');
        setSelectedReply(null);
        fetchRepliesData(); // Refresh the list
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Failed to send reply',
        confirmButtonColor: '#ef4444',
      });
    } finally {
      setSendingReply(false);
    }
  };

  const updateReplyStatus = async (replyId, status) => {
    try {
      const response = await updateSMSReplyStatus(replyId, status, router);
      if (response.success) {
        fetchRepliesData(); // Refresh the list
        Swal.fire({
          icon: 'success',
          title: 'Status Updated',
          text: `Reply marked as ${status}`,
          confirmButtonColor: '#9333ea',
          timer: 1500,
        });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to update status',
        confirmButtonColor: '#ef4444',
      });
    }
  };

  const openReplyModal = (reply) => {
    setSelectedReply(reply);
    setShowReplyModal(true);
    setReplyMessage('');
  };

  return (
    <>
      <Sidebar />
      <div className="main-content">
        <div className="p-6 max-w-7xl mx-auto">
        
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="w-6 h-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">SMS Notifications</h1>
            </div>
            <p className="text-gray-600 text-sm mb-4">Send SMS to your customers</p>
            
            <div className="flex gap-4">
              <button
                onClick={() => setShowIndividualModal(true)}
                className="bg-green-100 text-green-700 px-4 py-2.5 rounded-lg font-medium hover:bg-green-200 transition-all flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                Send to Individual
              </button>
              <button
                onClick={previewBirthdayUsersHandler}
                disabled={birthdayLoading}
                className="bg-purple-100 text-purple-700 px-4 py-2.5 rounded-lg font-medium hover:bg-purple-200 transition-all flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                Preview Birthday Users
              </button>
              <button
                onClick={sendBirthdaySMSHandler}
                disabled={birthdayLoading}
                className="bg-[#80A6F7] text-white px-5 py-2.5 rounded-lg font-medium hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg"
              >
                {birthdayLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    🎂 Send Birthday SMS
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowTopiaModal(true);
                  previewTopiaMembersHandler();
                }}
                className="bg-[#80A6F7] text-white px-5 py-2.5 rounded-lg font-medium hover:bg-[#6B92E8] transition-all flex items-center gap-2 shadow-lg"
              >
                👑 Send to Topia Members
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-xl shadow-lg mb-6">
            <div className="flex border-b">
              <button
                onClick={() => setActiveTab('send')}
                className={`px-6 py-4 font-semibold transition-all flex items-center gap-2 ${
                  activeTab === 'send'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                <Send className="w-5 h-5" />
                Send SMS
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-6 py-4 font-semibold transition-all flex items-center gap-2 ${
                  activeTab === 'history'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                <Clock className="w-5 h-5" />
                History
              </button>
              <button
                onClick={() => setActiveTab('stats')}
                className={`px-6 py-4 font-semibold transition-all flex items-center gap-2 ${
                  activeTab === 'stats'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                <TrendingUp className="w-5 h-5" />
                Statistics
              </button>
              <button
                onClick={() => setActiveTab('replies')}
                className={`px-6 py-4 font-semibold transition-all flex items-center gap-2 ${
                  activeTab === 'replies'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                <MessageSquare className="w-5 h-5" />
                SMS Replies
              </button>
            </div>
          </div>

        {/* Send SMS Tab */}
        {activeTab === 'send' && (
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl shadow-lg p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-[#80A6F7] p-3 rounded-lg">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Send Bulk SMS</h2>
            </div>
            
            <div className="bg-white rounded-xl p-6 space-y-6">
              {/* Message Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Message Type
                </label>
                <select
                  value={messageType}
                  onChange={(e) => setMessageType(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="promotion">🎁 Promotion</option>
                  <option value="sale">🔥 Sale</option>
                  <option value="event">📅 Event</option>
                  <option value="reminder">⏰ Reminder</option>
                  <option value="custom">✏️ Custom</option>
                </select>
              </div>

              {/* Target Audience */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Target Audience
                </label>
                <select
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="verified">✅ All Verified Users</option>
                  <option value="incomplete">⏳ Incomplete Users</option>
                </select>
                <button
                  onClick={previewRecipientsHandler}
                  disabled={previewLoading}
                  className="mt-3 flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  {previewLoading ? 'Loading...' : 'Preview Recipients'}
                </button>
              </div>

              {/* Message Templates */}
              {messageType !== 'custom' && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Quick Template
                  </label>
                  <button
                    onClick={() => setMessage(messageTemplates[messageType])}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors"
                  >
                    📝 Use {messageType} template
                  </button>
                </div>
              )}

              {/* Message */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Message ({message.length}/1600 characters)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const link = '\n\nVisit: https://shroomtopiadetroit.com/';
                      setMessage(message + link);
                    }}
                    className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-lg hover:bg-blue-200 transition-all font-medium"
                  >
                    + Add Website Link
                  </button>
                </div>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={1600}
                  rows={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  placeholder="Type your message here... 💬"
                />
                <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                  <span>
                    {message.length > 160 ? `${Math.ceil(message.length / 160)} SMS segments` : '1 SMS segment'}
                  </span>
                  <span>{1600 - message.length} characters remaining</span>
                </div>
              </div>

              {/* Send Button */}
              <button
                onClick={sendBulkSMS}
                disabled={loading || !message.trim()}
                className="w-full bg-[#80A6F7] text-white py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Send SMS
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-6 bg-[#80A6F7] rounded-t-xl">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <Clock className="w-6 h-6" />
                SMS History
              </h2>
              <p className="text-blue-100 mt-1">View all your sent SMS campaigns</p>
            </div>
            
            <div className="p-6">
              {historyLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading history...</p>
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">No SMS History</h3>
                  <p className="text-gray-500">You haven't sent any SMS campaigns yet</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              Date
                            </div>
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Type</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Message</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4" />
                              Recipients
                            </div>
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4" />
                              Success
                            </div>
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                            <div className="flex items-center gap-2">
                              <XCircle className="w-4 h-4" />
                              Failed
                            </div>
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {history.map((item) => (
                          <tr key={item._id} className="hover:bg-blue-50 transition-colors">
                            <td className="px-4 py-4 text-sm text-gray-900">
                              {new Date(item.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                            <td className="px-4 py-4 text-sm">
                              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 capitalize">
                                {item.type}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-600 max-w-xs truncate">
                              {item.message}
                            </td>
                            <td className="px-4 py-4 text-sm font-semibold text-gray-900">
                              {item.totalRecipients}
                            </td>
                            <td className="px-4 py-4 text-sm font-bold text-green-600">
                              {item.successCount}
                            </td>
                            <td className="px-4 py-4 text-sm font-bold text-red-600">
                              {item.failedCount}
                            </td>
                            <td className="px-4 py-4 text-sm">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                item.status === 'completed' ? 'bg-green-100 text-green-800' :
                                item.status === 'sending' ? 'bg-blue-100 text-blue-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {item.status.toUpperCase()}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-sm">
                              <button
                                onClick={() => viewSMSDetails(item)}
                                className="text-blue-600 hover:text-blue-700 font-semibold hover:underline flex items-center gap-1"
                              >
                                <Eye className="w-4 h-4" />
                                View Details
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-3 mt-6">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
                      >
                        Previous
                      </button>
                      <span className="px-4 py-2 bg-gray-100 rounded-lg font-semibold text-gray-700">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && stats && (
          <div className="space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#80A6F7] rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold opacity-90">Total Sent</h3>
                  <CheckCircle className="w-8 h-8 opacity-80" />
                </div>
                <p className="text-4xl font-extrabold">{stats.totalSent.toLocaleString()}</p>
                <p className="text-sm opacity-80 mt-2">Successfully delivered</p>
              </div>
              
              <div className="bg-[#80A6F7] rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold opacity-90">Total Failed</h3>
                  <XCircle className="w-8 h-8 opacity-80" />
                </div>
                <p className="text-4xl font-extrabold">{stats.totalFailed.toLocaleString()}</p>
                <p className="text-sm opacity-80 mt-2">Delivery failed</p>
              </div>
              
              <div className="bg-[#80A6F7] rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold opacity-90">Success Rate</h3>
                  <TrendingUp className="w-8 h-8 opacity-80" />
                </div>
                <p className="text-4xl font-extrabold">
                  {stats.totalSent + stats.totalFailed > 0
                    ? Math.round((stats.totalSent / (stats.totalSent + stats.totalFailed)) * 100)
                    : 0}%
                </p>
                <p className="text-sm opacity-80 mt-2">Overall performance</p>
              </div>
            </div>

            {/* By Type */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-6 bg-[#80A6F7]">
                <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                  <MessageSquare className="w-6 h-6" />
                  SMS by Type
                </h3>
                <p className="text-purple-100 mt-1">Breakdown of campaigns by message type</p>
              </div>
              <div className="p-6 space-y-4">
                {stats.byType.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No data available</p>
                ) : (
                  stats.byType.map((item) => (
                    <div key={item._id} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl hover:bg-blue-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-600 p-2 rounded-lg">
                          <MessageSquare className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-semibold text-gray-900 capitalize text-lg">{item._id}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-xl text-blue-600">{item.totalSent.toLocaleString()}</div>
                        <div className="text-gray-500 text-sm">
                          {item.count} {item.count === 1 ? 'campaign' : 'campaigns'}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* SMS Replies Tab */}
        {activeTab === 'replies' && (
          <div className="space-y-6">
            {/* Stats Overview */}
            {repliesStats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-blue-600 rounded-xl shadow-lg p-6 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold opacity-90">Total Replies</h3>
                    <MessageSquare className="w-8 h-8 opacity-80" />
                  </div>
                  <p className="text-4xl font-extrabold">{repliesStats.totalReplies.toLocaleString()}</p>
                </div>
                
                <div className="bg-red-600 rounded-xl shadow-lg p-6 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold opacity-90">Opt-Outs</h3>
                    <XCircle className="w-8 h-8 opacity-80" />
                  </div>
                  <p className="text-4xl font-extrabold">{repliesStats.optOutCount.toLocaleString()}</p>
                </div>
                
                <div className="bg-green-600 rounded-xl shadow-lg p-6 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold opacity-90">Processed</h3>
                    <CheckCircle className="w-8 h-8 opacity-80" />
                  </div>
                  <p className="text-4xl font-extrabold">
                    {repliesStats.byStatus.find(s => s._id === 'processed')?.count || 0}
                  </p>
                </div>
                
                <div className="bg-purple-600 rounded-xl shadow-lg p-6 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold opacity-90">Pending</h3>
                    <Clock className="w-8 h-8 opacity-80" />
                  </div>
                  <p className="text-4xl font-extrabold">
                    {repliesStats.byStatus.find(s => s._id === 'received')?.count || 0}
                  </p>
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                <button
                  onClick={() => {
                    setRepliesFilters({ messageType: 'all', status: 'all', search: '' });
                    setRepliesCurrentPage(1);
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear All Filters
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Message Type</label>
                  <select
                    value={repliesFilters.messageType}
                    onChange={(e) => {
                      setRepliesFilters({...repliesFilters, messageType: e.target.value});
                      setRepliesCurrentPage(1);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Types</option>
                    <option value="reply">Regular Reply</option>
                    <option value="opt_out">Opt Out</option>
                    <option value="opt_in">Opt In</option>
                    <option value="help">Help Request</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                  <select
                    value={repliesFilters.status}
                    onChange={(e) => {
                      setRepliesFilters({...repliesFilters, status: e.target.value});
                      setRepliesCurrentPage(1);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="received">Received</option>
                    <option value="processed">Processed</option>
                    <option value="responded">Responded</option>
                    <option value="ignored">Ignored</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Search</label>
                  <input
                    type="text"
                    value={repliesFilters.search}
                    onChange={(e) => setRepliesFilters({...repliesFilters, search: e.target.value})}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        setRepliesCurrentPage(1);
                        fetchRepliesData();
                      }
                    }}
                    placeholder="Search messages, names, phones..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="flex items-end gap-2">
                  <button
                    onClick={() => {
                      setRepliesCurrentPage(1);
                      fetchRepliesData();
                    }}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-all"
                  >
                    Apply Filters
                  </button>
                  <button
                    onClick={fetchRepliesData}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-700 transition-all"
                    title="Refresh"
                  >
                    🔄
                  </button>
                </div>
              </div>
            </div>

            {/* Replies List */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-6 bg-[#80A6F7] rounded-t-xl">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <MessageSquare className="w-6 h-6" />
                  SMS Replies
                </h2>
                <p className="text-blue-100 mt-1">View and respond to customer SMS replies</p>
              </div>
              
              <div className="p-6">
                {repliesLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading replies...</p>
                  </div>
                ) : smsReplies.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No SMS Replies</h3>
                    <p className="text-gray-500">No SMS replies found matching your criteria</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      {smsReplies.map((reply) => (
                        <div key={reply._id} className="border border-gray-200 rounded-xl p-4 hover:bg-blue-50 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-gray-900">
                                    {reply.userName || 'Unknown User'}
                                  </span>
                                  <span className="text-sm text-gray-600">
                                    {reply.userPhone}
                                  </span>
                                </div>
                                
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                  reply.messageType === 'opt_out' ? 'bg-red-100 text-red-800' :
                                  reply.messageType === 'opt_in' ? 'bg-green-100 text-green-800' :
                                  reply.messageType === 'help' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-blue-100 text-blue-800'
                                }`}>
                                  {reply.messageType.replace('_', ' ').toUpperCase()}
                                </span>
                                
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                  reply.status === 'received' ? 'bg-gray-100 text-gray-800' :
                                  reply.status === 'processed' ? 'bg-blue-100 text-blue-800' :
                                  reply.status === 'responded' ? 'bg-green-100 text-green-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {reply.status.toUpperCase()}
                                </span>
                              </div>
                              
                              <p className="text-gray-700 mb-2 bg-gray-50 p-3 rounded-lg">
                                "{reply.body}"
                              </p>
                              
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span>
                                  {new Date(reply.receivedAt).toLocaleString()}
                                </span>
                                {reply.adminResponse && (
                                  <span className="text-green-600 font-medium">
                                    ✓ Responded
                                  </span>
                                )}
                              </div>
                              
                              {reply.adminResponse && (
                                <div className="mt-3 bg-green-50 border-l-4 border-green-400 p-3 rounded">
                                  <p className="text-sm text-green-800">
                                    <strong>Admin Response:</strong> {reply.adminResponse.message}
                                  </p>
                                  <p className="text-xs text-green-600 mt-1">
                                    Sent {new Date(reply.adminResponse.sentAt).toLocaleString()}
                                  </p>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex flex-col gap-2 ml-4">
                              {!reply.adminResponse && reply.status !== 'ignored' && (
                                <button
                                  onClick={() => openReplyModal(reply)}
                                  className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all"
                                >
                                  Reply
                                </button>
                              )}
                              
                              {reply.status === 'received' && (
                                <div className="flex flex-col gap-1">
                                  <button
                                    onClick={() => updateReplyStatus(reply._id, 'processed')}
                                    className="bg-green-600 text-white px-3 py-1 rounded-lg text-xs font-semibold hover:bg-green-700 transition-all"
                                  >
                                    Mark Processed
                                  </button>
                                  <button
                                    onClick={() => updateReplyStatus(reply._id, 'ignored')}
                                    className="bg-gray-600 text-white px-3 py-1 rounded-lg text-xs font-semibold hover:bg-gray-700 transition-all"
                                  >
                                    Ignore
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Pagination */}
                    {repliesTotalPages > 1 && (
                      <div className="flex justify-center items-center gap-3 mt-6">
                        <button
                          onClick={() => setRepliesCurrentPage(p => Math.max(1, p - 1))}
                          disabled={repliesCurrentPage === 1}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
                        >
                          Previous
                        </button>
                        <span className="px-4 py-2 bg-gray-100 rounded-lg font-semibold text-gray-700">
                          Page {repliesCurrentPage} of {repliesTotalPages}
                        </span>
                        <button
                          onClick={() => setRepliesCurrentPage(p => Math.min(repliesTotalPages, p + 1))}
                          disabled={repliesCurrentPage === repliesTotalPages}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
      
      {/* Reply Modal */}
      {showReplyModal && selectedReply && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full">
            <div className="sticky top-0 bg-[#80A6F7] px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <MessageSquare className="w-6 h-6" />
                Reply to SMS
              </h2>
              <button
                onClick={() => {
                  setShowReplyModal(false);
                  setSelectedReply(null);
                  setReplyMessage('');
                }}
                className="text-white hover:bg-white/20 rounded-lg p-2 transition-all"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Original Message */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Original Message</h3>
                <div className="text-sm text-gray-600 mb-2">
                  From: {selectedReply.userName || 'Unknown'} ({selectedReply.userPhone})
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  Received: {new Date(selectedReply.receivedAt).toLocaleString()}
                </div>
                <p className="text-gray-700 bg-white p-3 rounded-lg border">
                  "{selectedReply.body}"
                </p>
              </div>

              {/* Reply Message */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Your Reply ({replyMessage.length}/1600)
                </label>
                <textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  maxLength={1600}
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Type your reply here..."
                />
              </div>

              {/* Send Button */}
              <button
                onClick={handleReplyToSMS}
                disabled={sendingReply || !replyMessage.trim()}
                className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 disabled:bg-gray-400 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                {sendingReply ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Send Reply
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Detail Modal */}
      {showDetailModal && selectedSMS && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-[#80A6F7] px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <MessageSquare className="w-6 h-6" />
                SMS Campaign Details
              </h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-white hover:bg-white/20 rounded-lg p-2 transition-all"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Campaign Info */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Campaign Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Type:</span>
                    <span className="ml-2 font-semibold capitalize">{selectedSMS.type}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <span className={`ml-2 px-2 py-1 rounded text-xs font-bold ${
                      selectedSMS.status === 'completed' ? 'bg-green-100 text-green-800' :
                      selectedSMS.status === 'sending' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {selectedSMS.status.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Created:</span>
                    <span className="ml-2 font-semibold">
                      {new Date(selectedSMS.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Completed:</span>
                    <span className="ml-2 font-semibold">
                      {selectedSMS.completedAt ? new Date(selectedSMS.completedAt).toLocaleString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Message */}
              <div className="bg-blue-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Message</h3>
                <p className="text-gray-700">{selectedSMS.message}</p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-100 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900">{selectedSMS.totalRecipients}</div>
                  <div className="text-sm text-gray-600">Total Recipients</div>
                </div>
                <div className="bg-green-100 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{selectedSMS.successCount}</div>
                  <div className="text-sm text-gray-600">Successful</div>
                </div>
                <div className="bg-red-100 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">{selectedSMS.failedCount}</div>
                  <div className="text-sm text-gray-600">Failed</div>
                </div>
              </div>

              {/* Recipients List */}
              {selectedSMS.recipients && selectedSMS.recipients.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Recipients Details</h3>
                  <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-xl">
                    <table className="w-full">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Phone</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Sent At</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {selectedSMS.recipients.map((recipient, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium">{recipient.name}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{recipient.phone}</td>
                            <td className="px-4 py-3 text-sm">
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                recipient.status === 'sent' ? 'bg-green-100 text-green-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {recipient.status === 'sent' ? '✓ Sent' : '✗ Failed'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {new Date(recipient.sentAt).toLocaleTimeString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Individual SMS Modal */}
      {showIndividualModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full my-8">
            <div className="sticky top-0 bg-[#80A6F7] px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <Users className="w-6 h-6" />
                Send SMS to Individual User
              </h2>
              <button
                onClick={() => {
                  setShowIndividualModal(false);
                  setSelectedUsers([]);
                  setSearchQuery('');
                  setSearchResults([]);
                  setIndividualMessage('');
                }}
                className="text-white hover:bg-white/20 rounded-lg p-2 transition-all"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[calc(90vh-80px)] overflow-y-auto">
              {/* Search User */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Search User (by name, email, or phone)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      searchUsersHandler(e.target.value);
                    }}
                    onFocus={() => {
                      // Show results again when focused
                      if (searchQuery.length >= 2) {
                        searchUsersHandler(searchQuery);
                      }
                    }}
                    placeholder="Type to search..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSearchResults([]);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  )}
                </div>
                
                {/* Search Results */}
                {searchLoading && (
                  <div className="mt-2 text-sm text-gray-500">Searching...</div>
                )}
                
                {searchResults.length > 0 && (
                  <div className="mt-2 max-h-60 overflow-y-auto border border-gray-200 rounded-xl bg-white shadow-lg">
                    <div className="sticky top-0 bg-gray-50 px-4 py-2 border-b flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-700">
                        {searchResults.length} user{searchResults.length > 1 ? 's' : ''} found
                      </span>
                      <button
                        onClick={() => setSearchResults([])}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Close
                      </button>
                    </div>
                    {searchResults.map((user) => {
                      const isSelected = selectedUsers.some(u => u._id === user._id);
                      return (
                        <button
                          key={user._id}
                          onClick={() => {
                            if (isSelected) {
                              // Remove user
                              setSelectedUsers(selectedUsers.filter(u => u._id !== user._id));
                            } else {
                              // Add user
                              setSelectedUsers([...selectedUsers, user]);
                            }
                          }}
                          className={`w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b last:border-b-0 flex items-center gap-3 ${
                            isSelected ? 'bg-blue-100 border-l-4 border-l-blue-600' : ''
                          }`}
                        >
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                            isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                          }`}>
                            {isSelected && <span className="text-white text-xs">✓</span>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-900 truncate">{user.fullName}</div>
                            <div className="text-sm text-gray-600 truncate">{user.phone} • {user.email}</div>
                            <div className="text-xs text-gray-500 capitalize">Status: {user.status}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
                
                {searchQuery.length >= 2 && !searchLoading && searchResults.length === 0 && (
                  <div className="mt-2 text-sm text-gray-500">No users found</div>
                )}
              </div>

              {/* Selected Users */}
              {selectedUsers.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-semibold text-gray-900">
                      Selected: {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''}
                    </div>
                    <button
                      onClick={() => setSelectedUsers([])}
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedUsers.map((user) => (
                      <div key={user._id} className="flex items-center justify-between bg-white p-2 rounded-lg">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">{user.fullName}</div>
                          <div className="text-xs text-gray-600">{user.phone}</div>
                        </div>
                        <button
                          onClick={() => setSelectedUsers(selectedUsers.filter(u => u._id !== user._id))}
                          className="text-red-500 hover:text-red-700 ml-2"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Message Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Message Type
                </label>
                <select
                  value={individualType}
                  onChange={(e) => setIndividualType(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="custom">✏️ Custom</option>
                  <option value="promotion">🎁 Promotion</option>
                  <option value="reminder">⏰ Reminder</option>
                  <option value="event">📅 Event</option>
                </select>
              </div>

              {/* Message */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Message ({individualMessage.length}/1600)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const link = '\n\nVisit: https://shroomtopiadetroit.com/';
                      setIndividualMessage(individualMessage + link);
                    }}
                    className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-lg hover:bg-blue-200 transition-all font-medium"
                  >
                    + Add Website Link
                  </button>
                </div>
                <textarea
                  value={individualMessage}
                  onChange={(e) => setIndividualMessage(e.target.value)}
                  maxLength={1600}
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  placeholder="Type your message here..."
                />
              </div>

              {/* Send Button */}
              <button
                onClick={sendIndividualSMSHandler}
                disabled={sendingIndividual || selectedUsers.length === 0 || !individualMessage.trim()}
                className="w-full bg-[#80A6F7] text-white py-4 rounded-xl font-bold text-lg hover:from-green-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                {sendingIndividual ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Send SMS
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Topia Circle Modal */}
      {showTopiaModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Send SMS to Topia Circle Members</h2>
            
            <div className="bg-purple-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-purple-700">
                {topiaLoading ? 'Loading...' : `${selectedTopiaMembers.length > 0 ? `Selected ${selectedTopiaMembers.length} of ${topiaMembers.length}` : `${topiaMembers.length} active Topia Circle members`}`}
              </p>
            </div>

            {topiaMembers.length > 0 && (
              <div className="mb-4 max-h-48 overflow-y-auto border rounded-lg">
                <div className="bg-gray-50 px-4 py-2 border-b flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-700">Recipients ({topiaMembers.length})</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedTopiaMembers(topiaMembers.map(m => m._id))}
                      className="text-xs text-blue-600 hover:text-blue-700"
                    >
                      Select All
                    </button>
                    <button
                      onClick={() => setSelectedTopiaMembers([])}
                      className="text-xs text-gray-600 hover:text-gray-700"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                <div className="divide-y">
                  {topiaMembers.map((member, index) => (
                    <div key={index} className="px-4 py-2 flex items-center justify-between hover:bg-gray-50">
                      <div className="flex items-center gap-3 flex-1">
                        <input
                          type="checkbox"
                          checked={selectedTopiaMembers.includes(member._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTopiaMembers([...selectedTopiaMembers, member._id]);
                            } else {
                              setSelectedTopiaMembers(selectedTopiaMembers.filter(id => id !== member._id));
                            }
                          }}
                          className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{member.fullName}</p>
                          <p className="text-xs text-gray-500">{member.phone}</p>
                        </div>
                      </div>
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                        Topia Member
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <textarea
              value={topiaMessage}
              onChange={(e) => setTopiaMessage(e.target.value)}
              placeholder="Enter your message..."
              className="w-full px-4 py-3 border rounded-lg mb-4"
              rows={5}
            />
            
            <div className="flex space-x-3">
              <button
                onClick={sendToTopiaMembersHandler}
                disabled={topiaLoading || !topiaMessage.trim() || selectedTopiaMembers.length === 0}
                className="flex-1 bg-[#5B8DE8] text-white py-2 rounded-lg hover:bg-[#4A7DD4] disabled:opacity-50"
              >
                {topiaLoading ? 'Sending...' : `Send SMS${selectedTopiaMembers.length > 0 ? ` (${selectedTopiaMembers.length})` : ''}`}
              </button>
              <button
                onClick={() => {
                  setShowTopiaModal(false);
                  setSelectedTopiaMembers([]);
                }}
                className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
}

