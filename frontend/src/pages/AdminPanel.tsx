import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api.js';
import { useToast } from '../contexts/ToastContext.js';
import type { IUser } from '../types/index.js';
import { ShieldAlert, Trash2, Users, Database, Shield, ShieldCheck, Mail, CheckCircle } from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [usersPage, setUsersPage] = useState(1);

  // Fetch admin general stats
  const { data: statsData } = useQuery({
    queryKey: ['adminStats'],
    queryFn: async () => {
      const res = await api.get('/admin/stats');
      return res.data;
    },
  });

  // Fetch paginated user listing
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['adminUsersList', usersPage],
    queryFn: async () => {
      const res = await api.get(`/admin/users?page=${usersPage}&limit=10`);
      return res.data;
    },
  });

  // Modify user role mutation
  const changeRoleMutation = useMutation({
    mutationFn: async (payload: { id: string; role: 'user' | 'admin' }) => {
      const res = await api.put(`/admin/users/${payload.id}/role`, { role: payload.role });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['adminUsersList', usersPage] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
      showToast(data.message || 'User role modified successfully.', 'success');
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'Failed to modify role.', 'error');
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/admin/users/${id}`);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['adminUsersList', usersPage] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
      showToast(data.message || 'User database profiles purged.', 'success');
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'Failed to delete user.', 'error');
    },
  });

  const handleRoleToggle = (userId: string, currentRole: 'user' | 'admin') => {
    const nextRole = currentRole === 'user' ? 'admin' : 'user';
    changeRoleMutation.mutate({ id: userId, role: nextRole });
  };

  const handleDeleteUser = (userId: string, email: string) => {
    if (window.confirm(`Are you absolutely sure you want to delete user: ${email}? This will erase all meals, step, and weight history.`)) {
      deleteUserMutation.mutate(userId);
    }
  };

  const usersList = (usersData?.users || []) as IUser[];
  const usersTotalPages = usersData?.pages || 1;

  return (
    <div className="flex flex-col gap-8 pb-10">
      
      {/* Stats Summary Panel */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card rounded-3xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-brand-emerald/10 text-brand-emerald flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Members</span>
            <p className="text-2xl font-extrabold tracking-tight mt-0.5">{statsData?.stats?.totalUsers || '--'}</p>
          </div>
        </div>

        <div className="glass-card rounded-3xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-brand-indigo/10 text-brand-indigo flex items-center justify-center shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Logged Food Logs</span>
            <p className="text-2xl font-extrabold tracking-tight mt-0.5">{statsData?.stats?.totalMeals || '--'}</p>
          </div>
        </div>

        <div className="glass-card rounded-3xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-brand-amber/10 text-brand-amber flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Active Goals</span>
            <p className="text-2xl font-extrabold tracking-tight mt-0.5">{statsData?.stats?.totalGoals || '--'}</p>
          </div>
        </div>

        <div className="glass-card rounded-3xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Reports Built</span>
            <p className="text-2xl font-extrabold tracking-tight mt-0.5">{statsData?.stats?.totalMonthly || '--'}</p>
          </div>
        </div>
      </div>

      {/* Database Listing Panel */}
      <div className="glass-card rounded-3xl p-6">
        <h3 className="font-bold text-sm mb-4">Users Administration Panel</h3>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200/50 dark:border-slate-800/50 text-slate-400 font-semibold uppercase">
                <th className="py-3 px-3">Name / Email</th>
                <th className="py-3 px-3">Verify Status</th>
                <th className="py-3 px-3">User Role</th>
                <th className="py-3 px-3 text-right">Moderation Actions</th>
              </tr>
            </thead>
            <tbody>
              {usersLoading ? (
                <tr><td colSpan={4} className="py-8 text-center text-slate-400">Loading user lists...</td></tr>
              ) : usersList.length === 0 ? (
                <tr><td colSpan={4} className="py-8 text-center text-slate-400">No users found.</td></tr>
              ) : (
                usersList.map((usr) => (
                  <tr key={usr._id} className="border-b border-slate-100/50 dark:border-slate-800/10 text-slate-700 dark:text-slate-350">
                    <td className="py-3 px-3">
                      <p className="font-bold text-slate-900 dark:text-white">{usr.name || 'Anonymous User'}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5" />
                        {usr.email}
                      </p>
                    </td>
                    <td className="py-3 px-3">
                      {usr.isVerified ? (
                        <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-500 font-bold uppercase text-[9px] flex items-center gap-1 w-fit">
                          <CheckCircle className="w-3 h-3" /> verified
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-lg bg-rose-500/10 text-rose-500 font-bold uppercase text-[9px] w-fit">
                          unverified
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-semibold capitalize flex items-center gap-1.5 mt-2">
                      <Shield className={`w-4 h-4 ${usr.role === 'admin' ? 'text-brand-indigo' : 'text-slate-400'}`} />
                      {usr.role}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleRoleToggle(usr._id, usr.role)}
                          className="px-3 py-1.5 rounded-xl border border-slate-200/50 dark:border-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-900 text-xs font-medium cursor-pointer"
                        >
                          Change Role
                        </button>
                        <button
                          onClick={() => handleDeleteUser(usr._id, usr.email)}
                          className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-500 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginations controls */}
        {usersTotalPages > 1 && (
          <div className="flex justify-end gap-2 mt-4 border-t border-slate-200/20 pt-4">
            <button
              onClick={() => setUsersPage((p) => Math.max(1, p - 1))}
              disabled={usersPage === 1}
              className="px-3 py-1.5 rounded-xl border border-slate-250/20 text-xs disabled:opacity-50"
            >
              Prev
            </button>
            <span className="text-xs self-center px-2">Page {usersPage} of {usersTotalPages}</span>
            <button
              onClick={() => setUsersPage((p) => Math.min(usersTotalPages, p + 1))}
              disabled={usersPage === usersTotalPages}
              className="px-3 py-1.5 rounded-xl border border-slate-250/20 text-xs disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

    </div>
  );
};
