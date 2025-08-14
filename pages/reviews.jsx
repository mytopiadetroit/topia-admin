import React, { useEffect, useMemo, useRef, useState } from 'react';
import Layout from '@/components/Layout';
import { useRouter } from 'next/router';
import { 
  fetchAllReviews, 
  createReviewApi, 
  updateReviewApi, 
  deleteReviewApi, 
  toast 
} from '@/service/service';
import Swal from 'sweetalert2';

const DEFAULT_EMOJIS = [
  '😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','😇','🥰','😍','🤩','😘','😗','☺️','😚','😙','🥲','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🤐','🤨','😐','😑','😶','😶‍🌫️','😏','😒','🙄','😬','🤥','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🤧','🥵','🥶','🥴','😵','😵‍💫','🤯','🤠','🥳','🥸','😎','🤓','🧐','😕','😟','🙁','☹️','😮','😯','😲','😳','🥺','😦','😧','😨','😰','😥','😢','😭','😱','😖','😣','😞','😓','😩','😫','🥱','😤','😡','😠','🤬','😈','👿','💀','☠️','💩','🤡','👹','👺','👻','👽','👾','🤖','😺','😸','😹','😻','😼','😽','🙀','😿','😾','🙈','🙉','🙊','💋','💌','💘','💝','💖','💗','💓','💞','💕','💟','❣️','💔','❤️‍🔥','❤️‍🩹','❤️','🧡','💛','💚','💙','💜','🤎','🖤','🤍','💯','💢','💥','💫','💦','💨','🕳️','💣','💬','👁️‍🗨️','🗨️','🗯️','💭','💤','👋','🤚','🖐️','✋','🖖','👌','🤌','🤏','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','👍','👎','👊','✊','🤛','🤜','👏','🙌','👐','🤲','🤝','🙏','✍️','💅','🤳','💪','🦾','🦿','🦵','🦶','👂','🦻','👃','🧠','🫀','🫁','🦷','🦴','👀','👁️','👅','👄','👶','🧒','👦','👧','🧑','👱','👨','🧔','👩','🧓','👴','👵','🙍','🙎','🙅','🙆','💁','🙋','🧏','🙇','🤦','🤷','👮','🕵️','💂','🥷','👷','🤴','👸','👳','👲','🧕','🤵','👰','🤰','🤱','👼','🎅','🤶','🦸','🦹','🧙','🧚','🧛','🧜','🧝','🧞','🧟','💆','💇','🚶','🧍','🧎','🏃','💃','🕺','🕴️','👯','🧖','🧘','🛀','🛌','👭','👫','👬','💏','💑','👪','👨‍👩‍👧','👨‍👩‍👧‍👦','👨‍👩‍👦‍👦','👨‍👩‍👧‍👧','👨‍👨‍👦','👨‍👨‍👧','👨‍👨‍👧‍👦','👨‍👨‍👦‍👦','👨‍👨‍👧‍👧','👩‍👩‍👦','👩‍👩‍👧','👩‍👩‍👧‍👦','👩‍👩‍👦‍👦','👩‍👩‍👧‍👧','👨‍👦','👨‍👦‍👦','👨‍👧','👨‍👧‍👦','👨‍👧‍👧','👩‍👦','👩‍👦‍👦','👩‍👧','👩‍👧‍👦','👩‍👧‍👧','🗣️','👤','👥','🫂','👣'
];

export default function ReviewsPage() {
  const router = useRouter();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // add | edit
  const [current, setCurrent] = useState({ _id: '', label: '', isActive: true });
  const [saving, setSaving] = useState(false);
  const labelInputRef = useRef(null);

  useEffect(() => { loadReviews(); }, []);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const res = await fetchAllReviews(router);
      if (res.success) setReviews(res.data || []);
      else toast.error(res.message || 'Failed to load reviews');
    } catch (e) {
      console.error(e);
      toast.error('Failed to load reviews');
    } finally { setLoading(false); }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return reviews;
    return reviews.filter(r => (r.label||'').toLowerCase().includes(q));
  }, [reviews, search]);

  const openAdd = () => {
    setModalMode('add');
    setCurrent({ _id: '', label: '', isActive: true });
    setShowModal(true);
  };

  const openEdit = (r) => {
    setModalMode('edit');
    setCurrent({ ...r });
    setShowModal(true);
  };

const remove = async (id) => {
  const result = await Swal.fire({
    title: 'Are you sure?',
    text: "You won't be able to revert this!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, delete it!'
  });
  
  if (!result.isConfirmed) return;
  
  try {
    const res = await deleteReviewApi(id, router);
    if (res.success) { 
      Swal.fire('Deleted!', 'Review option has been deleted.', 'success');
      loadReviews(); 
    } else {
      Swal.fire('Error!', res.message || 'Delete failed', 'error');
    }
  } catch (e) { 
    Swal.fire('Error!', 'Delete failed', 'error');
  }
};

  // Insert selected emoji into label at caret position
  const insertEmojiIntoLabel = (emoji) => {
    const input = labelInputRef.current;
    const existing = current.label || '';
    if (!input || typeof input.selectionStart !== 'number') {
      const updated = `${existing}${emoji}`;
      setCurrent(c => ({ ...c, label: updated }));
      return;
    }
    const start = input.selectionStart;
    const end = input.selectionEnd ?? start;
    const updated = `${existing.slice(0, start)}${emoji}${existing.slice(end)}`;
    const caret = start + emoji.length;
    setCurrent(c => ({ ...c, label: updated }));
    setTimeout(() => {
      try {
        input.focus();
        input.setSelectionRange(caret, caret);
      } catch (_) {}
    }, 0);
  };

 const handleSubmit = async (e) => {
  e.preventDefault();
  setSaving(true);
  try {
    const payload = { label: current.label, isActive: !!current.isActive };
    const res = modalMode === 'add' 
      ? await createReviewApi(payload, router)
      : await updateReviewApi(current._id, payload, router);
    if (res.success) {
      Swal.fire('Success!', `Review option ${modalMode === 'add' ? 'created' : 'updated'} successfully!`, 'success');
      setShowModal(false);
      loadReviews();
    } else {
      Swal.fire('Error!', res.message || 'Save failed', 'error');
    }
  } catch (e) {
    Swal.fire('Error!', 'Save failed', 'error');
  } finally { setSaving(false); }
};

const EmojiPicker = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  
  if (open) {
    return (
      <>
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/50 bg-opacity-50 z-40" 
          onClick={() => setOpen(false)}
        ></div>
        
        {/* Emoji Modal */}
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Select Emoji</h3>
              <button 
                onClick={() => setOpen(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ×
              </button>
            </div>
            
            <div className="grid grid-cols-8 gap-2 max-h-60 overflow-y-auto">
              {DEFAULT_EMOJIS.map((e) => (
                <button 
                  key={e} 
                  type="button" 
                  onClick={() => { onChange(e); setOpen(false); }} 
                  className="hover:bg-gray-100 rounded text-2xl p-2 h-12 w-12 flex items-center justify-center border"
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }
  
  return (
     <button type="button" onClick={() => setOpen(true)} className="px-3 py-2 border rounded-md text-sm">
      {value || 'Emoji'}
    </button>
  );
};

  return (
    <Layout title="Reviews">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search options" className="px-3 py-2 border rounded-md text-sm w-64" />
          </div>
          <button onClick={openAdd} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md">Add Option</button>
        </div>

        {loading ? (
          <div className="py-10 text-center text-gray-500">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="text-left text-xs text-gray-500">
                  <th className="px-4 py-3">LABEL</th>
                  <th className="px-4 py-3">ACTIVE</th>
                  <th className="px-4 py-3 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r._id} className="border-t">
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <div className="font-medium">{r.label}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${r.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{r.isActive ? 'Yes' : 'No'}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => openEdit(r)} className="text-blue-600 hover:text-blue-800 mr-3 text-sm">Edit</button>
                      <button onClick={() => remove(r._id)} className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="3" className="text-center py-10 text-gray-500">No options found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{modalMode === 'add' ? 'Add Option' : 'Edit Option'}</h3>
              <button onClick={()=>setShowModal(false)} className="text-gray-500">✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Label</label>
                  <div className="flex gap-2 items-center">
                    <input ref={labelInputRef} value={current.label} onChange={(e)=>setCurrent({...current, label: e.target.value})} required className="w-full px-3 py-2 border rounded-md" placeholder="e.g. 🍄 Creative" />
                    <EmojiPicker value={''} onChange={(v)=>insertEmojiIntoLabel(v)} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Active</label>
                  <select value={current.isActive ? '1':'0'} onChange={(e)=>setCurrent({...current, isActive: e.target.value==='1'})} className="w-full px-3 py-2 border rounded-md">
                    <option value="1">Yes</option>
                    <option value="0">No</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={()=>setShowModal(false)} className="px-4 py-2 border rounded-md">Cancel</button>
                <button disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-md">{saving ? 'Saving...' : modalMode === 'add' ? 'Create' : 'Update'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}


