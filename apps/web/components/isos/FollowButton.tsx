'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface FollowButtonProps {
  isoId: string;
  userId?: string;
}

export function FollowButton({ isoId, userId }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (!userId) return;

    // Check if user is following this ISO
    const checkFollowStatus = async () => {
      const { data } = await supabase
        .from('iso_follows')
        .select('id')
        .eq('user_id', userId)
        .eq('iso_id', isoId)
        .single();

      setIsFollowing(!!data);
    };

    checkFollowStatus();
  }, [userId, isoId, supabase]);

  const handleToggleFollow = async () => {
    if (!userId) {
      // Redirect to sign in
      window.location.href = '/auth/signin';
      return;
    }

    setIsLoading(true);

    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('iso_follows')
          .delete()
          .eq('user_id', userId)
          .eq('iso_id', isoId);

        if (error) throw error;

        setIsFollowing(false);
      } else {
        // Follow
        const { error } = await supabase
          .from('iso_follows')
          .insert({
            user_id: userId,
            iso_id: isoId,
          });

        if (error) throw error;

        setIsFollowing(true);
      }
    } catch (error) {
      console.error('Failed to toggle follow:', error);
      alert('Failed to update follow status');
    } finally {
      setIsLoading(false);
    }
  };

  if (!userId) {
    return null; // Don't show button if user not logged in
  }

  return (
    <button
      onClick={handleToggleFollow}
      disabled={isLoading}
      className={`px-4 py-2 rounded-md font-medium transition-colors ${
        isFollowing
          ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          : 'bg-blue-600 text-white hover:bg-blue-700'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {isLoading ? 'Loading...' : isFollowing ? 'Unfollow' : 'Follow for Alerts'}
    </button>
  );
}
