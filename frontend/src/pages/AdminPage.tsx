import React, { useState, useEffect, useCallback } from 'react';
import { Search, Trash2, ShieldOff, Shield, ChevronLeft, ChevronRight, Users, ShieldAlert, Crown } from 'lucide-react';
import api from '../services/api';
import { getMediaUrl } from '../utils/imageUrl';
import { useAuth } from '../context/AuthContext';

interface AdminUser {
  _id: string;
  name: string;
  email: string;
  student_id: string;
  department: string;
  level: string;
  role: 'user' | 'admin';
  isBanned: boolean;
  profile_picture: string;
  createdAt: string;
}

interface Stats {
  totalUsers: number;
  bannedUsers: number;
  adminUsers: number;
}

const AdminPage: React.FC = () => {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, bannedUsers: 0, adminUsers: 0 });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<AdminUser | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await api.get('/api/admin/stats');
      setStats(data);
    } catch {
      // silently fail
    }
  }, []);

  const fetchUsers = useCallback(async (q: string, p: number) => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/admin/users', { params: { search: q, page: p, limit: 20 } });
      setUsers(data.users);
      setPages(data.pages);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchUsers(search, 1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, fetchUsers]);

  useEffect(() => {
    fetchUsers(search, page);
  }, [page, fetchUsers, search]);

  const handleDelete = async (user: AdminUser) => {
    setActionLoading(user._id);
    try {
      await api.delete(`/api/admin/users/${user._id}`);
      setUsers(prev => prev.filter(u => u._id !== user._id));
      setStats(prev => ({ ...prev, totalUsers: prev.totalUsers - 1 }));
      setConfirmDelete(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleBan = async (user: AdminUser) => {
    setActionLoading(user._id + '-ban');
    try {
      const { data } = await api.patch(`/api/admin/users/${user._id}/ban`);
      setUsers(prev => prev.map(u => u._id === user._id ? { ...u, isBanned: data.isBanned } : u));
      setStats(prev => ({ ...prev, bannedUsers: data.isBanned ? prev.bannedUsers + 1 : prev.bannedUsers - 1 }));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update ban status');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePromote = async (user: AdminUser) => {
    setActionLoading(user._id + '-promote');
    try {
      const { data } = await api.patch(`/api/admin/users/${user._id}/promote`);
      setUsers(prev => prev.map(u => u._id === user._id ? { ...u, role: data.role } : u));
      setStats(prev => ({
        ...prev,
        adminUsers: data.role === 'admin' ? prev.adminUsers + 1 : prev.adminUsers - 1,
      }));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update role');
    } finally {
      setActionLoading(null);
    }
  };

  if (me?.role !== 'admin') {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="text-center">
          <ShieldAlert className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800">Access Denied</h2>
          <p className="text-gray-500 mt-1">You need admin privileges to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC] min-h-full">
      <div className="max-w-5xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-7 h-7 text-sky-500" />
            Admin Dashboard
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage users, roles, and access</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-sky-500 bg-sky-50' },
            { label: 'Banned', value: stats.bannedUsers, icon: ShieldOff, color: 'text-red-500 bg-red-50' },
            { label: 'Admins', value: stats.adminUsers, icon: Crown, color: 'text-amber-500 bg-amber-50' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-2xl p-4 border border-gray-100 flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email or student ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-gray-400 text-sm">Loading...</div>
          ) : users.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-sm">No users found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">User</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Student ID</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Dept / Level</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u._id} className="border-b border-gray-50 hover:bg-gray-50 transition-none">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={getMediaUrl(u.profile_picture) || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&size=32`}
                            alt={u.name}
                            className="w-8 h-8 rounded-full object-cover shrink-0"
                          />
                          <div>
                            <p className="font-medium text-gray-900 leading-tight">{u.name}</p>
                            <p className="text-xs text-gray-400">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 font-mono text-xs">{u.student_id}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{[u.department, u.level].filter(Boolean).join(' · ') || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${u.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                          {u.role === 'admin' && <Crown className="w-3 h-3" />}
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${u.isBanned ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                          {u.isBanned ? 'Banned' : 'Active'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {/* Ban / Unban */}
                          <button
                            onClick={() => handleBan(u)}
                            disabled={actionLoading === u._id + '-ban' || u._id === me?._id}
                            title={u.isBanned ? 'Unban user' : 'Ban user'}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-amber-500 hover:bg-amber-50 disabled:opacity-40 disabled:cursor-not-allowed transition-none"
                          >
                            {u.isBanned ? <Shield className="w-4 h-4" /> : <ShieldOff className="w-4 h-4" />}
                          </button>

                          {/* Promote / Demote */}
                          <button
                            onClick={() => handlePromote(u)}
                            disabled={actionLoading === u._id + '-promote' || u._id === me?._id}
                            title={u.role === 'admin' ? 'Demote to user' : 'Promote to admin'}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-amber-500 hover:bg-amber-50 disabled:opacity-40 disabled:cursor-not-allowed transition-none"
                          >
                            <Crown className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => setConfirmDelete(u)}
                            disabled={u._id === me?._id}
                            title="Delete user"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition-none"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-white border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-600">Page {page} of {pages}</span>
            <button
              onClick={() => setPage(p => Math.min(pages, p + 1))}
              disabled={page === pages}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-white border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirm Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-red-100 rounded-xl">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Delete User</h3>
                <p className="text-sm text-gray-500">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 mb-6">
              Are you sure you want to permanently delete <span className="font-semibold">{confirmDelete.name}</span>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                disabled={actionLoading === confirmDelete._id}
                className="flex-1 py-2 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 disabled:opacity-60"
              >
                {actionLoading === confirmDelete._id ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
