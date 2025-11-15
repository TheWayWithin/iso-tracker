'use client';

import { useState, useEffect } from 'react';
import { AdminGuard } from '@/components/admin/AdminGuard';

interface ModerationFlag {
  id: string;
  content_type: 'comment' | 'evidence' | 'argument';
  content_id: string;
  reason: string;
  status: 'pending' | 'reviewed' | 'dismissed';
  created_at: string;
  reviewed_at: string | null;
  reporter: {
    id: string;
    username: string;
  };
  reviewer: {
    id: string;
    username: string;
  } | null;
  content_preview: string;
  content_link: string;
}

export default function ModerationPage() {
  const [flags, setFlags] = useState<ModerationFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'reviewed' | 'dismissed'>('pending');
  const [typeFilter, setTypeFilter] = useState<'all' | 'comment' | 'evidence' | 'argument'>('all');
  const [selectedFlag, setSelectedFlag] = useState<ModerationFlag | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch flags
  useEffect(() => {
    fetchFlags();
  }, [statusFilter, typeFilter]);

  async function fetchFlags() {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        status: statusFilter,
        limit: '50',
        offset: '0',
      });

      if (typeFilter !== 'all') {
        params.append('type', typeFilter);
      }

      const response = await fetch(`/api/admin/moderation?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch flags');
      }

      const data = await response.json();
      setFlags(data.flags);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  // Handle moderation action
  async function handleAction(action: 'approve' | 'reject' | 'remove') {
    if (!selectedFlag || !actionReason || actionReason.length < 10) {
      alert('Please provide a reason (min 10 characters)');
      return;
    }

    if (action === 'remove' && !confirm('Are you sure you want to remove this content? This action cannot be undone.')) {
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch('/api/admin/moderation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flag_id: selectedFlag.id,
          action,
          reason: actionReason,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to perform action');
      }

      // Refresh flags list
      await fetchFlags();

      // Reset form
      setSelectedFlag(null);
      setActionReason('');
      alert(`Action '${action}' completed successfully`);

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
              Content Moderation Queue
            </h1>
            <p className="text-gray-600">
              Review flagged content and take moderation actions
            </p>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <option value="pending">Pending</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="dismissed">Dismissed</option>
                </select>
              </div>

              {/* Type filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content Type
                </label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as any)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="comment">Comments</option>
                  <option value="evidence">Evidence</option>
                  <option value="argument">Arguments</option>
                </select>
              </div>
            </div>
          </div>

          {/* Error state */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6">
              <p className="font-medium">Error loading flags</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading flags...</p>
            </div>
          )}

          {/* Flags table */}
          {!loading && !error && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {flags.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No flags found for the selected filters
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Preview
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Reporter
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Reason
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {flags.map((flag) => (
                        <tr key={flag.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800">
                              {flag.content_type}
                            </span>
                          </td>
                          <td className="px-6 py-4 max-w-xs truncate">
                            <p className="text-sm text-gray-900 truncate">
                              {flag.content_preview}
                            </p>
                            <a
                              href={flag.content_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline"
                            >
                              View full content →
                            </a>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {flag.reporter.username}
                          </td>
                          <td className="px-6 py-4 max-w-xs">
                            <p className="text-sm text-gray-900 line-clamp-2">
                              {flag.reason}
                            </p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(flag.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {statusFilter === 'pending' && (
                              <button
                                onClick={() => setSelectedFlag(flag)}
                                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                              >
                                Review
                              </button>
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
          {selectedFlag && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold mb-4">Review Flag</h2>

                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Content Type:</p>
                  <p className="font-medium">{selectedFlag.content_type}</p>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Content Preview:</p>
                  <p className="bg-gray-50 p-3 rounded text-sm">{selectedFlag.content_preview}</p>
                  <a
                    href={selectedFlag.content_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline mt-2 inline-block"
                  >
                    View full content →
                  </a>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Flag Reason:</p>
                  <p className="bg-yellow-50 p-3 rounded text-sm">{selectedFlag.reason}</p>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Reason (min 10 characters) *
                  </label>
                  <textarea
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    rows={3}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Explain your decision..."
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => handleAction('approve')}
                    disabled={submitting || actionReason.length < 10}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Approve (Keep Content)
                  </button>
                  <button
                    onClick={() => handleAction('reject')}
                    disabled={submitting || actionReason.length < 10}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Reject (No Action)
                  </button>
                  <button
                    onClick={() => handleAction('remove')}
                    disabled={submitting || actionReason.length < 10}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Remove Content
                  </button>
                </div>

                <button
                  onClick={() => {
                    setSelectedFlag(null);
                    setActionReason('');
                  }}
                  className="mt-4 w-full px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminGuard>
  );
}
