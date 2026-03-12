import React, { useEffect, useState } from 'react';
import { Lock, Unlock, X } from 'lucide-react';
import api from '../services/api';

interface BlockListProps {
  onClose: () => void;
}

const BlockList: React.FC<BlockListProps> = ({ onClose }) => {
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBlockedUsers();
  }, []);

  const fetchBlockedUsers = async () => {
    try {
      const { data } = await api.get('/api/chat/blocked-users');
      setBlockedUsers(data);
    } catch (error) {
      console.error('Error fetching blocked users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async (userId: string) => {
    try {
      await api.post(`/api/chat/block/${userId}`);
      setBlockedUsers((prev) => prev.filter((u) => u._id !== userId));
    } catch (error) {
      console.error('Error unblocking user:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full mx-4 max-h-96 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">Blocked Users</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-700 rounded"
            title="Close block list"
            aria-label="Close block list"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading...</div>
          ) : blockedUsers.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <Lock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No blocked users</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700">
              {blockedUsers.map((user) => (
                <div
                  key={user._id}
                  className="p-4 flex items-center justify-between hover:bg-slate-700/50 transition"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <img
                      src={
                        user.profile_picture ||
                        `https://ui-avatars.com/api/?name=${user.name}`
                      }
                      alt={user.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-white">{user.name}</p>
                      <p className="text-sm text-slate-400">{user.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleUnblock(user._id)}
                    className="p-2 hover:bg-slate-600 rounded-lg transition text-slate-400 hover:text-white"
                    title="Unblock user"
                  >
                    <Unlock className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BlockList;
