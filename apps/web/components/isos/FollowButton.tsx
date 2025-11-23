'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff, Users } from 'lucide-react';

interface FollowButtonProps {
  isoId: string;
  userId?: string;
  showCount?: boolean;
  size?: 'sm' | 'md';
}

export function FollowButton({ isoId, userId, showCount = false, size = 'md' }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [followCount, setFollowCount] = useState(0);

  useEffect(() => {
    // Check follow status via API
    const checkFollowStatus = async () => {
      try {
        const response = await fetch(`/api/iso/${isoId}/follow`);
        if (response.ok) {
          const data = await response.json();
          setIsFollowing(data.isFollowing);
          setFollowCount(data.followCount);
        }
      } catch (error) {
        console.error('Failed to check follow status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkFollowStatus();
  }, [isoId]);

  const handleToggleFollow = async () => {
    if (!userId) {
      // Redirect to sign in
      window.location.href = '/auth/sign-in';
      return;
    }

    setIsLoading(true);

    try {
      const method = isFollowing ? 'DELETE' : 'POST';
      const response = await fetch(`/api/iso/${isoId}/follow`, { method });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update follow status');
      }

      const data = await response.json();
      setIsFollowing(data.isFollowing);
      setFollowCount(data.followCount);
    } catch (error) {
      console.error('Failed to toggle follow:', error);
      alert('Failed to update follow status');
    } finally {
      setIsLoading(false);
    }
  };

  // Don't show button if user not logged in (unless showing count)
  if (!userId && !showCount) {
    return null;
  }

  const sizeClasses = size === 'sm'
    ? 'px-3 py-1.5 text-sm'
    : 'px-4 py-2';

  // Show count-only badge if no user
  if (!userId && showCount) {
    return (
      <div className="flex items-center gap-1 text-gray-500 text-sm">
        <Users className="w-4 h-4" />
        <span>{followCount}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleToggleFollow}
        disabled={isLoading}
        className={`${sizeClasses} rounded-md font-medium transition-colors flex items-center gap-2 ${
          isFollowing
            ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isLoading ? (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : isFollowing ? (
          <BellOff className="w-4 h-4" />
        ) : (
          <Bell className="w-4 h-4" />
        )}
        <span>{isLoading ? 'Loading...' : isFollowing ? 'Following' : 'Follow'}</span>
      </button>
      {showCount && followCount > 0 && (
        <span className="text-gray-500 text-sm flex items-center gap-1">
          <Users className="w-4 h-4" />
          {followCount}
        </span>
      )}
    </div>
  );
}
