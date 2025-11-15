'use client';

import { useState, useEffect } from 'react';
import { AdminGuard } from '@/components/admin/AdminGuard';

interface User {
  id: string;
  username: string;
  email: string;
  created_at: string;
  role: string;
  status: 'active' | 'suspended' | 'banned';
  suspended_until: string | null;
  banned_at: string | null;
  suspension_reason: string | null;
  tier: 'free' | 'event_pass' | 'evidence_analyst';
  subscription_status: string | null;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended' | 'banned'>('all');
  const [tierFilter, setTierFilter] = useState<'all' | 'free' | 'event_pass' | 'evidence_analyst'>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionType, setActionType] = useState<'suspend' | 'unsuspend' | 'ban' | null>(null);
  const [durationDays, setDurationDays] = useState(7);
  const [actionReason, setActionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch users
  useEffect(() => {
    fetchUsers();
  }, [searchQuery, statusFilter, tierFilter]);

  async function fetchUsers() {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        limit: '50',
        offset: '0',
      });

      if (searchQuery) {
        params.append('search', searchQuery);
      }
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      if (tierFilter !== 'all') {
        params.append('tier', tierFilter);
      }

      const response = await fetch(`/api/admin/users?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  // Handle user action
  async function handleUserAction() {
    if (!selectedUser || !actionType || !actionReason || actionReason.length < 10) {
      alert('Please provide a reason (min 10 characters)');
      return;
    }

    if (actionType === 'ban' && !confirm('Are you sure you want to permanently ban this user? This action is severe.')) {
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: selectedUser.id,
          action: actionType,
          duration_days: actionType === 'suspend' ? durationDays : undefined,
          reason: actionReason,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to perform action');
      }

      // Refresh users list
      await fetchUsers();

      // Reset form
      setSelectedUser(null);
      setActionType(null);
      setActionReason('');
      setDurationDays(7);
      alert(`Action '${actionType}' completed successfully`);

    } catch (err) {
      alert(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              User Management
            </h1>
            <p className="text-gray-600">
              View and manage user accounts, suspensions, and bans
            </p>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search by username or email
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search users..."
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              {/* Status filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="banned">Banned</option>
                </select>
              </div>

              {/* Tier filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subscription Tier
                </label>
                <select
                  value={tierFilter}
                  onChange={(e) => setTierFilter(e.target.value as any)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="all">All Tiers</option>
                  <option value="free">Free</option>
                  <option value="event_pass">Event Pass</option>
                  <option value="evidence_analyst">Evidence Analyst</option>
                </select>
              </div>
            </div>
          </div>

          {/* Error state */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6">
              <p className="font-medium">Error loading users</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading users...</p>
            </div>
          )}

          {/* Users table */}
          {!loading && !error && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {users.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No users found for the selected filters
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Username
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tier
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Join Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {user.username}
                                </div>
                                {user.role === 'admin' && (
                                  <span className="text-xs text-blue-600 font-medium">
                                    Admin
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded ${
                              user.tier === 'evidence_analyst' ? 'bg-purple-100 text-purple-800' :
                              user.tier === 'event_pass' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {user.tier.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded ${
                              user.status === 'banned' ? 'bg-red-100 text-red-800' :
                              user.status === 'suspended' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {user.status}
                            </span>
                            {user.status === 'suspended' && user.suspended_until && (
                              <p className="text-xs text-gray-500 mt-1">
                                Until {new Date(user.suspended_until).toLocaleDateString()}
                              </p>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {user.role !== 'admin' && (
                              <div className="flex gap-2">
                                {user.status === 'active' && (
                                  <>
                                    <button
                                      onClick={() => {
                                        setSelectedUser(user);
                                        setActionType('suspend');
                                      }}
                                      className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition text-xs"
                                    >
                                      Suspend
                                    </button>
                                    <button
                                      onClick={() => {
                                        setSelectedUser(user);
                                        setActionType('ban');
                                      }}
                                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition text-xs"
                                    >
                                      Ban
                                    </button>
                                  </>
                                )}
                                {user.status === 'suspended' && (
                                  <button
                                    onClick={() => {
                                      setSelectedUser(user);
                                      setActionType('unsuspend');
                                    }}
                                    className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition text-xs"
                                  >
                                    Unsuspend
                                  </button>
                                )}
                              </div>
                            )}
                            {user.role === 'admin' && (
                              <span className="text-xs text-gray-500 italic">
                                Cannot modify admins
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Action Modal */}
          {selectedUser && actionType && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h2 className="text-2xl font-bold mb-4">
                  {actionType === 'suspend' && 'Suspend User'}
                  {actionType === 'unsuspend' && 'Unsuspend User'}
                  {actionType === 'ban' && 'Ban User'}
                </h2>

                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-1">Username:</p>
                  <p className="font-medium">{selectedUser.username}</p>
                </div>

                {actionType === 'suspend' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duration
                    </label>
                    <select
                      value={durationDays}
                      onChange={(e) => setDurationDays(parseInt(e.target.value))}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value={1}>1 day</option>
                      <option value={7}>7 days</option>
                      <option value={14}>14 days</option>
                      <option value={30}>30 days</option>
                      <option value={90}>90 days</option>
                    </select>
                  </div>
                )}

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason (min 10 characters) *
                  </label>
                  <textarea
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    rows={3}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Explain why you are taking this action..."
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleUserAction}
                    disabled={submitting || actionReason.length < 10}
                    className={`flex-1 px-4 py-2 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed transition ${
                      actionType === 'ban' ? 'bg-red-600 hover:bg-red-700' :
                      actionType === 'suspend' ? 'bg-yellow-600 hover:bg-yellow-700' :
                      'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    {submitting ? 'Processing...' : `Confirm ${actionType}`}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedUser(null);
                      setActionType(null);
                      setActionReason('');
                      setDurationDays(7);
                    }}
                    className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminGuard>
  );
}
