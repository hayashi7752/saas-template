'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';

type User = {
  id: string;
  organizationId: string;
  email: string;
  name: string | null;
  role: 'ORG_ADMIN' | 'USER';
  status: string;
};

type CurrentUser = {
  id: string;
  organizationId: string;
  email: string;
  name: string | null;
  role: 'ORG_ADMIN' | 'USER';
  organization: {
    id: string;
    name: string;
    domain: string | null;
  };
};

export default function OrganizationUsers() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'ORG_ADMIN' | 'USER'>('USER');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch('/api/auth/me');

        if (response.status === 401) {
          router.push('/signin');
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to fetch user info');
        }

        const data = await response.json();
        setCurrentUser(data.user);

        // Check if user has ORG_ADMIN role
        if (data.user.role !== 'ORG_ADMIN') {
          setError('Access denied: Organization admin role required');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, [router]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) return;

    setInviteLoading(true);
    setError(null);
    setSuccess(null);
    setInviteUrl(null);

    try {
      const response = await fetch('/api/auth/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId: currentUser.organizationId,
          email,
          role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create invitation');
      }

      setSuccess(`Invitation created successfully for ${email}`);
      setInviteUrl(data.inviteUrl);
      setEmail('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setInviteLoading(false);
    }
  };

  const copyInviteUrl = () => {
    if (inviteUrl) {
      navigator.clipboard.writeText(inviteUrl);
      alert('Invite URL copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted p-8">
        <div className="mx-auto max-w-4xl">
          <Card>
            <CardContent className="p-8">
              <div className="text-center">Loading...</div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!currentUser || currentUser.role !== 'ORG_ADMIN') {
    return (
      <div className="min-h-screen bg-muted p-8">
        <div className="mx-auto max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Access Denied</CardTitle>
              <CardDescription>
                You need Organization Admin privileges to access this page.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push('/dashboard')}>Go to Dashboard</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle>Organization Users</CardTitle>
            <CardDescription>
              Manage users and invitations for {currentUser.organization.name}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Current User Info */}
        <Card>
          <CardHeader>
            <CardTitle>Your Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p>
                <strong>Email:</strong> {currentUser.email}
              </p>
              <p>
                <strong>Name:</strong> {currentUser.name || 'Not set'}
              </p>
              <p>
                <strong>Role:</strong> <Badge variant="outline">{currentUser.role}</Badge>
              </p>
              <p>
                <strong>Organization:</strong> {currentUser.organization.name}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Invite Form */}
        <Card>
          <CardHeader>
            <CardTitle>Invite New User</CardTitle>
            <CardDescription>
              Send an invitation to add a new user to your organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'ORG_ADMIN' | 'USER')}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="USER">User</option>
                  <option value="ORG_ADMIN">Organization Admin</option>
                </select>
              </div>

              <Button type="submit" disabled={inviteLoading}>
                {inviteLoading ? 'Creating Invitation...' : 'Send Invitation'}
              </Button>
            </form>

            {error && (
              <div className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {success && (
              <div className="mt-4 rounded border border-green-200 bg-green-50 p-3 text-sm text-green-600">
                {success}
              </div>
            )}

            {inviteUrl && (
              <div className="mt-4 rounded border border-blue-200 bg-blue-50 p-4">
                <Label className="text-sm font-medium">Invitation URL:</Label>
                <div className="mt-2 break-all rounded border bg-white p-2 font-mono text-sm">
                  {inviteUrl}
                </div>
                <Button onClick={copyInviteUrl} variant="outline" size="sm" className="mt-2">
                  Copy URL
                </Button>
                <p className="mt-2 text-xs text-muted-foreground">
                  Share this URL with the person you want to invite. The link expires in 7 days.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <Card>
          <CardContent className="pt-6">
            <Button onClick={() => router.push('/dashboard')} variant="outline">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
