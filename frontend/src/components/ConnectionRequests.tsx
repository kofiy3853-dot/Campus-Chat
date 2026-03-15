import React, { useState, useEffect } from 'react';
import { X, Check, UserMinus, UserPlus, Clock } from 'lucide-react';
import api from '../services/api';
import { getMediaUrl } from '../utils/imageUrl';

interface ConnectionRequest {
  _id: string;
  sender: {
    _id: string;
    name: string;
    profile_picture: string;
    department: string;
  };
  status: string;
  createdAt: string;
}

interface ConnectionRequestsProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

const ConnectionRequests: React.FC<ConnectionRequestsProps> = ({ isOpen, onClose, onUpdate }) => {
  const [requests, setRequests] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/api/connections/incoming');
      setRequests(data);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRequests();
    }
  }, [isOpen]);

  const handleResponse = async (connectionId: string, status: 'accepted' | 'rejected') => {
    try {
      await api.post('/api/connections/respond', { connectionId, status });
      setRequests(prev => prev.filter(r => r._id !== connectionId));
      onUpdate?.();
    } catch (error) {
      console.error('Error responding to request:', error);
      alert('Failed to process request');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Requests</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Connect with students</p>
          </div>
          <button 
            onClick={onClose}
            title="Close modal"
            className="p-2 hover:bg-white rounded-xl transition-colors text-slate-400 hover:text-slate-600 border border-transparent hover:border-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-6 space-y-4">
          {loading ? (
             <div className="py-12 text-center">
                <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Loading requests...</p>
             </div>
          ) : requests.length > 0 ? (
            requests.map((request) => (
              <div 
                key={request._id}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-transparent hover:border-sky-100 hover:bg-white transition-all group"
              >
                <div className="flex items-center gap-3">
                  <img 
                    src={getMediaUrl(request.sender.profile_picture) || `https://ui-avatars.com/api/?name=${request.sender.name}&background=0EA5E9&color=fff`}
                    className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                    alt={request.sender.name}
                  />
                  <div>
                    <h4 className="text-sm font-black text-slate-800">{request.sender.name}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{request.sender.department || 'Student'}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleResponse(request._id, 'accepted')}
                    title="Accept request"
                    className="p-2.5 bg-sky-500 text-white rounded-xl hover:bg-sky-600 hover:scale-110 active:scale-95 transition-all shadow-lg shadow-sky-200"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleResponse(request._id, 'rejected')}
                    title="Reject request"
                    className="p-2.5 bg-white border border-slate-200 text-slate-400 rounded-xl hover:text-red-500 hover:border-red-100 hover:bg-red-50 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                <Clock className="w-8 h-8 text-slate-200" />
              </div>
              <h4 className="text-slate-800 font-black mb-1">All caught up!</h4>
              <p className="text-xs text-slate-400 font-medium">No pending connection requests.</p>
            </div>
          )}
        </div>
        
        <div className="p-6 bg-slate-50/50 border-t border-slate-50">
            <button 
                onClick={onClose}
                className="w-full py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 hover:text-white hover:border-slate-800 transition-all shadow-sm"
            >
                Close
            </button>
        </div>
      </div>
    </div>
  );
};

export default ConnectionRequests;
