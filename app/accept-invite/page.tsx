'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import Image from 'next/image';

export default function AcceptInvite() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState<any>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const supabase = createClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      setUser(authUser);
    };
    checkUser();
  }, []);

  const handleAcceptInvite = async () => {
    if (!token) {
      setError('Invalid invitation link');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        // Redirect to sign in with the token preserved
        router.push(`/signin?redirect=/accept-invite?token=${token}`);
        return;
      }

      const response = await fetch('/api/auth/accept-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to accept invitation');
      }

      setSuccess(true);
      // Redirect to dashboard after successful acceptance
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = () => {
    router.push(`/signin?redirect=/accept-invite?token=${token}`);
  };

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted">
        <Card className="mx-auto w-[400px]">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">Invalid Invitation</CardTitle>
            <CardDescription>This invitation link is invalid or malformed.</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/signin">
              <Button>Go to Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted">
        <Card className="mx-auto w-[400px]">
          <CardHeader className="text-center">
            <div className="flex justify-center py-4">
              <Image src="/logo.png" alt="logo" width={50} height={50} />
            </div>
            <CardTitle className="text-green-600">Welcome!</CardTitle>
            <CardDescription>
              You have successfully joined the organization. Redirecting to dashboard...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <Card className="mx-auto w-[400px]">
        <CardHeader className="text-center">
          <div className="flex justify-center py-4">
            <Image src="/logo.png" alt="logo" width={50} height={50} />
          </div>
          <CardTitle>Accept Invitation</CardTitle>
          <CardDescription>You have been invited to join an organization</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {!user ? (
            <div className="space-y-4">
              <p className="text-center text-sm text-muted-foreground">
                Please sign in to accept this invitation
              </p>
              <Button onClick={handleSignIn} className="w-full">
                Sign In to Accept Invitation
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-center text-sm text-muted-foreground">
                Signed in as: {user.email}
              </p>
              <Button onClick={handleAcceptInvite} disabled={loading} className="w-full">
                {loading ? 'Processing...' : 'Accept Invitation'}
              </Button>
            </div>
          )}

          <div className="text-center">
            <Link href="/signin" className="text-sm text-muted-foreground hover:underline">
              Sign in with a different account
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
