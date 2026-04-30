import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import Swal from 'sweetalert2';
import Layout from '../components/Layout';
import {
  fetchAboutUs,
  updateAboutUsContent,
  updateContactInfo,
  addFAQ,
  updateFAQ,
  deleteFAQ,
  toast
} from '../service/service';

const JoditEditor = dynamic(() => import('jodit-react'), { ssr: false });

export default function AboutUsPage() {
  const router = useRouter();
  const editor = useRef(null);
  const editor2 = useRef(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aboutUsData, setAboutUsData] = useState(null);
  
  // About Us Content
  const [content, setContent] = useState('');
  const [ourApproach, setOurApproach] = useState('');
  
  // Contact Info
  const [contactInfo, setContactInfo] = useState({
    address: '',
    workingHours: '',
    phone: ''
  });
  
  // FAQ Management
  const [faqs, setFaqs] = useState([]);
  const [showFAQModal, setShowFAQModal] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState(null);
  const [faqForm, setFaqForm] = useState({
    question: '',
    answer: ''
  });

  const config = useMemo(
    () => ({
      readonly: false,
      placeholder: 'Start typing your About Us content...',
      height: 500,
      toolbar: true,
      spellcheck: true,
      language: 'en',
      toolbarButtonSize: 'medium',
      toolbarAdaptive: false,
      showCharsCounter: true,
      showWordsCounter: true,
      showXPathInStatusbar: false,
      askBeforePasteHTML: false,
      askBeforePasteFromWord: false,
      buttons: [
        'source', '|',
        'bold', 'italic', 'underline', 'strikethrough', '|',
        'ul', 'ol', '|',
        'outdent', 'indent', '|',
        'font', 'fontsize', 'brush', 'paragraph', '|',
        'image', 'video', 'table', 'link', '|',
        'align', 'undo', 'redo', '|',
        'hr', 'eraser', 'copyformat', '|',
        'symbol', 'fullsize', 'print'
      ],
      controls: {
        fontsize: {
          list: '8,9,10,11,12,14,16,18,20,24,28,32,36,40,48,56,64,72'
        }
      },
      uploader: {
        insertImageAsBase64URI: true
      },
      removeButtons: ['about']
    }),
    []
  );

  useEffect(() => {
    loadAboutUsData();
  }, []);

  const loadAboutUsData = async () => {
    try {
      setLoading(true);
      const response = await fetchAboutUs(router);
      
      if (response.success) {
        setAboutUsData(response.data);
        setContent(response.data.content || '');
        setOurApproach(response.data.ourApproach || '');
        setContactInfo(response.data.contactInfo || {
          address: '',
          workingHours: '',
          phone: ''
        });
        setFaqs(response.data.faqs || []);
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: response.message || 'Failed to load About Us data'
        });
      }
    } catch (error) {
      console.error('Error loading About Us data:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Failed to load About Us data'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveContent = async () => {
    try {
      setSaving(true);
      const response = await updateAboutUsContent({ content, ourApproach }, router);
      
      if (response.success) {
        await Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'About Us content updated successfully',
          timer: 2000,
          showConfirmButton: false
        });
        setAboutUsData(response.data);
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: response.message || 'Failed to save content'
        });
      }
    } catch (error) {
      console.error('Error saving content:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Failed to save content'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveContactInfo = async () => {
    try {
      setSaving(true);
      const response = await updateContactInfo(contactInfo, router);
      
      if (response.success) {
        await Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Contact info updated successfully',
          timer: 2000,
          showConfirmButton: false
        });
        setAboutUsData(response.data);
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: response.message || 'Failed to save contact info'
        });
      }
    } catch (error) {
      console.error('Error saving contact info:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Failed to save contact info'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddFAQ = () => {
    setEditingFAQ(null);
    setFaqForm({ question: '', answer: '' });
    setShowFAQModal(true);
  };

  const handleEditFAQ = (faq) => {
    setEditingFAQ(faq);
    setFaqForm({
      question: faq.question,
      answer: faq.answer
    });
    setShowFAQModal(true);
  };

  const handleSaveFAQ = async () => {
    if (!faqForm.question.trim() || !faqForm.answer.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Information',
        text: 'Question and answer are required'
      });
      return;
    }

    try {
      setSaving(true);
      let response;
      
      if (editingFAQ) {
        response = await updateFAQ(editingFAQ._id, faqForm, router);
      } else {
        response = await addFAQ(faqForm, router);
      }
      
      if (response.success) {
        await Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: editingFAQ ? 'FAQ updated successfully' : 'FAQ added successfully',
          timer: 2000,
          showConfirmButton: false
        });
        setAboutUsData(response.data);
        setFaqs(response.data.faqs || []);
        setShowFAQModal(false);
        setFaqForm({ question: '', answer: '' });
        setEditingFAQ(null);
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: response.message || 'Failed to save FAQ'
        });
      }
    } catch (error) {
      console.error('Error saving FAQ:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Failed to save FAQ'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFAQ = async (faqId) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to delete this FAQ?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    try {
      setSaving(true);
      const response = await deleteFAQ(faqId, router);
      
      if (response.success) {
        await Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'FAQ deleted successfully',
          timer: 2000,
          showConfirmButton: false
        });
        setAboutUsData(response.data);
        setFaqs(response.data.faqs || []);
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: response.message || 'Failed to delete FAQ'
        });
      }
    } catch (error) {
      console.error('Error deleting FAQ:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Failed to delete FAQ'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout title="About Us Management">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="About Us Management">
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">About Us Management</h1>
          <p className="text-gray-600 mt-2">Manage your About Us page content, FAQs, and contact information</p>
        </div>

          {/* About Us Content Section */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Who We Are Content</h2>
              <button
                onClick={handleSaveContent}
                disabled={saving}
                className="px-6 py-2 bg-[#80A6F7] text-white rounded-lg  disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Saving...' : 'Save Content'}
              </button>
            </div>
            
            <div className="border rounded-lg overflow-hidden">
              <JoditEditor
                ref={editor}
                value={content}
                config={config}
                tabIndex={1}
                onBlur={(newContent) => setContent(newContent)}
                onChange={(newContent) => {}}
              />
            </div>
          </div>

          {/* Our Approach Section */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Our Approach Content</h2>
              <button
                onClick={handleSaveContent}
                disabled={saving}
                className="px-6 py-2 bg-[#80A6F7] text-white rounded-lg  disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Saving...' : 'Save Content'}
              </button>
            </div>
            
            <div className="border rounded-lg overflow-hidden">
              <JoditEditor
                ref={editor2}
                value={ourApproach}
                config={config}
                tabIndex={2}
                onBlur={(newContent) => setOurApproach(newContent)}
                onChange={(newContent) => {}}
              />
            </div>
          </div>

          {/* FAQ Section */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">FAQ Management</h2>
              <button
                onClick={handleAddFAQ}
                className="px-6 py-2 bg-[#80A6F7] text-white rounded-lg  transition-colors"
              >
                + Add FAQ
              </button>
            </div>

            {faqs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No FAQs added yet. Click "Add FAQ" to create one.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <div key={faq._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 mb-2">
                          {index + 1}. {faq.question}
                        </h3>
                        <p className="text-gray-600 text-sm">{faq.answer}</p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleEditFAQ(faq)}
                          className="px-3 py-1 bg-[#80A6F7] text-white text-sm rounded  transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteFAQ(faq._id)}
                          className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Contact Info Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Contact Information</h2>
              <button
                onClick={handleSaveContactInfo}
                disabled={saving}
                className="px-6 py-2 bg-[#80A6F7] text-white rounded-lg  disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Saving...' : 'Save Contact Info'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <textarea
                  value={contactInfo.address}
                  onChange={(e) => setContactInfo({ ...contactInfo, address: e.target.value })}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter your business address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Working Hours
                </label>
                <textarea
                  value={contactInfo.workingHours}
                  onChange={(e) => setContactInfo({ ...contactInfo, workingHours: e.target.value })}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., Mon-Fri: 9AM-6PM"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={contactInfo.phone}
                  onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter phone number"
                />
              </div>
            </div>
          </div>
        </div>

      {/* FAQ Modal */}
      {showFAQModal && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                {editingFAQ ? 'Edit FAQ' : 'Add New FAQ'}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Question *
                  </label>
                  <input
                    type="text"
                    value={faqForm.question}
                    onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter the question"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Answer *
                  </label>
                  <textarea
                    value={faqForm.answer}
                    onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
                    rows="5"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter the answer"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowFAQModal(false);
                    setFaqForm({ question: '', answer: '' });
                    setEditingFAQ(null);
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveFAQ}
                  disabled={saving}
                  className="px-6 py-2 bg-[#80A6F7] text-white rounded-lg  disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? 'Saving...' : editingFAQ ? 'Update FAQ' : 'Add FAQ'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
