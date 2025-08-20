import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { Api, timeSince } from '../service/service';
import { useRouter } from 'next/router';

export default function ContactsPage() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const res = await Api('get', `contacts`, null, router, search ? { search } : undefined);
      if (res.success) {
        setItems(res.data || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const markRead = async (id) => {
    const res = await Api('put', `contacts/${id}/read`, {}, router);
    if (res.success) load();
  };

  const remove = async (id) => {
    const res = await Api('delete', `contacts/${id}`, null, router);
    if (res.success) load();
  };

  const viewMessage = (message) => {
    setSelectedMessage(message);
    setShowModal(true);
    // Mark as read when viewing
    if (!message.isRead) {
      markRead(message._id);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedMessage(null);
  };

  return (
    <Layout>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">Contact Messages</h1>
          <div className="flex gap-2">
            <input 
              value={search} 
              onChange={(e)=>setSearch(e.target.value)} 
              placeholder="Search" 
              className="px-3 py-2 border rounded" 
            />
            <button onClick={load} className="px-4 py-2 bg-blue-600 text-white rounded">
              Search
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mobile</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td className="px-4 py-6 text-center" colSpan={5}>Loading...</td></tr>
              ) : items.length === 0 ? (
                <tr><td className="px-4 py-6 text-center" colSpan={5}>No messages</td></tr>
              ) : (
                items.map((m) => (
                  <tr key={m._id} className={m.isRead ? '' : 'bg-blue-50'}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        {!m.isRead && <div className="w-2 h-2 bg-blue-600 rounded-full mr-2"></div>}
                        {m.fullName}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{m.email}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{m.mobileNumber}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{timeSince(m.createdAt)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex justify-center gap-2">
                        <button 
                          onClick={() => viewMessage(m)} 
                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"
                          title="View Details"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View
                        </button>
                        <button 
                          onClick={() => remove(m._id)} 
                          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                          title="Delete Message"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        {showModal && selectedMessage && (
          <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-xl font-semibold">Message Details</h2>
                <button 
                  onClick={closeModal} 
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <p className="text-gray-900">{selectedMessage.fullName}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <p className="text-gray-900">{selectedMessage.email}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                  <p className="text-gray-900">{selectedMessage.mobileNumber}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-900 whitespace-pre-wrap">{selectedMessage.message}</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Received</label>
                  <p className="text-gray-900">{timeSince(selectedMessage.createdAt)}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    selectedMessage.isRead 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {selectedMessage.isRead ? 'Read' : 'Unread'}
                  </span>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
                {!selectedMessage.isRead && (
                  <button 
                    onClick={() => {
                      markRead(selectedMessage._id);
                      closeModal();
                    }} 
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Mark as Read
                  </button>
                )}
                <button 
                  onClick={() => {
                    remove(selectedMessage._id);
                    closeModal();
                  }} 
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Delete Message
                </button>
                <button 
                  onClick={closeModal} 
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}