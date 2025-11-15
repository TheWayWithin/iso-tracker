'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface AdminGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * AdminGuard Component
 * Protects admin routes by checking user role
 *
 * Security:
 * - Client-side check for UX (fast redirect)
 * - Server-side enforcement in API routes (actual security)
 * - Redirects non-admins to home page
 * - Redirects unauthenticated users to sign-in
 *
 * Usage:
 * <AdminGuard>
 *   <AdminDashboard />
 * </AdminGuard>
 */
export function AdminGuard({ children, fallback }: AdminGuardProps) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function checkAdminRole() {
      try {
        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          console.log('AdminGuard: No authenticated user, redirecting to sign-in');
          router.push('/auth/signin?redirect=/admin');
          setIsAdmin(false);
          setIsLoading(false);
          return;
        }

        // Check admin role
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('AdminGuard: Error fetching profile:', profileError);
          router.push('/');
          setIsAdmin(false);
          setIsLoading(false);
          return;
        }

        if (profile?.role === 'admin') {
          console.log('AdminGuard: Admin role verified');
          setIsAdmin(true);
        } else {
          console.log('AdminGuard: User is not admin, redirecting to home');
          router.push('/');
          setIsAdmin(false);
        }

      } catch (error) {
        console.error('AdminGuard: Unexpected error:', error);
        router.push('/');
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkAdminRole();
  }, [supabase, router]);

  // Loading state
  if (isLoading || isAdmin === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // Access denied
  if (isAdmin === false) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-4">
            <svg
              className="w-16 h-16 text-red-500 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Access Denied
            </h2>
            <p className="text-gray-600 mb-4">
              You do not have permission to access this page. Admin privileges are required.
            </p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  // Admin access granted
  return <>{children}</>;
}
