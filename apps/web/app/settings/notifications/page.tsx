'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface NotificationPreferences {
  reply_notifications: boolean;
  evidence_notifications: boolean;
  observation_window_alerts: boolean;
}

interface NotificationLimits {
  reply_limit: number;
  evidence_limit: number;
  observation_window_limit: number;
}

export default function NotificationSettingsPage() {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    reply_notifications: true,
    evidence_notifications: true,
    observation_window_alerts: false,
  });
  const [limits, setLimits] = useState<NotificationLimits>({
    reply_limit: 10,
    evidence_limit: 5,
    observation_window_limit: 0,
  });
  const [email, setEmail] = useState('');
  const [unsubscribed, setUnsubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const response = await fetch('/api/notifications/preferences');
      if (!response.ok) throw new Error('Failed to load preferences');

      const data = await response.json();
      setPreferences(data.preferences);
      setLimits(data.limits);
      setEmail(data.email);
      setUnsubscribed(data.unsubscribed);
    } catch (error) {
      console.error('Failed to load preferences:', error);
      alert('Failed to load notification preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    setIsSaving(true);
    setSaved(false);

    try {
      const response = await fetch('/api/notifications/preferences', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save preferences');
      }

      setSaved(true);
    } catch (error) {
      console.error('Failed to save preferences:', error);
      alert(error instanceof Error ? error.message : 'Failed to save preferences');
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const handleResubscribe = async () => {
    try {
      const response = await fetch('/api/notifications/unsubscribe', {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to resubscribe');

      setUnsubscribed(false);
      loadPreferences(); // Reload preferences
    } catch (error) {
      console.error('Failed to resubscribe:', error);
      alert('Failed to resubscribe to notifications');
    }
  };

  const formatLimit = (limit: number) => {
    if (limit === -1) return 'Unlimited';
    if (limit === 0) return 'Not available';
    return `${limit} per day`;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-4xl py-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Notification Settings</h1>
        <p className="text-gray-600 mt-2">
          Manage how you receive updates about ISO activity
        </p>
      </div>

      {unsubscribed && (
        <div className="mb-6 p-4 bg-orange-50 border border-orange-500 rounded-md">
          <p className="text-orange-900">
            You are currently unsubscribed from all email notifications.{' '}
            <button
              onClick={handleResubscribe}
              className="font-semibold text-orange-600 underline"
            >
              Click here to resubscribe
            </button>
          </p>
        </div>
      )}

      <div className="bg-white shadow rounded-lg">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Email Notifications</h2>
          <p className="text-sm text-gray-600 mt-1">
            Notifications will be sent to: <strong>{email}</strong>
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Reply Notifications */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <label htmlFor="reply-notifications" className="text-base font-medium">
                Reply Notifications
              </label>
              <p className="text-sm text-gray-600">
                Get notified when someone replies to your comments
              </p>
              <p className="text-xs text-gray-500">
                Limit: {formatLimit(limits.reply_limit)}
              </p>
            </div>
            <input
              id="reply-notifications"
              type="checkbox"
              checked={preferences.reply_notifications}
              onChange={(e) =>
                setPreferences({ ...preferences, reply_notifications: e.target.checked })
              }
              disabled={unsubscribed}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 disabled:opacity-50"
            />
          </div>

          <div className="border-t" />

          {/* Evidence Notifications */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <label htmlFor="evidence-notifications" className="text-base font-medium">
                Evidence Notifications
              </label>
              <p className="text-sm text-gray-600">
                Get notified when new evidence is submitted for ISOs you follow
              </p>
              <p className="text-xs text-gray-500">
                Limit: {formatLimit(limits.evidence_limit)}
              </p>
            </div>
            <input
              id="evidence-notifications"
              type="checkbox"
              checked={preferences.evidence_notifications}
              onChange={(e) =>
                setPreferences({ ...preferences, evidence_notifications: e.target.checked })
              }
              disabled={unsubscribed}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 disabled:opacity-50"
            />
          </div>

          <div className="border-t" />

          {/* Observation Window Alerts */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <label htmlFor="observation-alerts" className="text-base font-medium">
                Observation Window Alerts
              </label>
              <p className="text-sm text-gray-600">
                Get alerts when observation windows approach for ISOs you follow
              </p>
              <p className="text-xs text-gray-500">
                Limit: {formatLimit(limits.observation_window_limit)}
              </p>
              {limits.observation_window_limit === 0 && (
                <p className="text-xs text-orange-600 font-medium">
                  Upgrade to Event Pass tier or higher to enable this feature
                </p>
              )}
            </div>
            <input
              id="observation-alerts"
              type="checkbox"
              checked={preferences.observation_window_alerts}
              onChange={(e) =>
                setPreferences({ ...preferences, observation_window_alerts: e.target.checked })
              }
              disabled={unsubscribed || limits.observation_window_limit === 0}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 disabled:opacity-50"
            />
          </div>

          <div className="border-t pt-4" />

          <div className="flex justify-end gap-3">
            <button
              onClick={loadPreferences}
              disabled={isSaving}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
            >
              Reset
            </button>
            <button
              onClick={handleSavePreferences}
              disabled={isSaving || saved || unsubscribed}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : saved ? '✓ Saved' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-white shadow rounded-lg p-6">
        <h3 className="text-base font-medium mb-2">About Notification Limits</h3>
        <p className="text-sm text-gray-600">
          Notification limits are based on your tier and reset daily. This helps us maintain a
          high-quality notification experience for all users.
        </p>
      </div>
    </div>
  );
}
