'use client';

import { useState, useEffect } from 'react';
import { FollowButton } from './FollowButton';
import Link from 'next/link';
import { Bell } from 'lucide-react';

interface ISODetailHeaderProps {
  isoId: string;
  isoName: string;
  isoDesignation: string;
}

export function ISODetailHeader({ isoId, isoName, isoDesignation }: ISODetailHeaderProps) {
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/status');
        if (response.ok) {
          const data = await response.json();
          setUserId(data.user?.id);
        }
      } catch {
        setUserId(undefined);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  return (
    <div className="mb-8">
      <Link href="/iso-objects" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
        ← Back to Objects
      </Link>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{isoName}</h1>
          <p className="text-gray-700 font-medium">{isoDesignation}</p>
        </div>
        <div className="flex items-center gap-3">
          {!isLoading && (
            <>
              <FollowButton isoId={isoId} userId={userId} />
              {userId && (
                <Link
                  href="/settings/notifications"
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                  title="Notification Settings"
                >
                  <Bell className="w-5 h-5" />
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
