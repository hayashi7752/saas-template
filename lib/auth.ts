import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { UserRole } from '@/lib/generated/prisma';
import crypto from 'crypto';

export type AuthUser = {
  id: string;
  organizationId: string;
  authUserId: string;
  email: string;
  name: string | null;
  role: UserRole;
  status: string;
  organization: {
    id: string;
    name: string;
    domain: string | null;
  };
};

/**
 * Get the current authenticated user from session and database
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const supabase = createClient();
    const {
      data: { user: authUser },
      error,
    } = await supabase.auth.getUser();

    if (error || !authUser) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { authUserId: authUser.id },
      include: {
        organization: true,
      },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      organizationId: user.organizationId,
      authUserId: user.authUserId,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      organization: user.organization,
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Check if user has required role
 */
export function hasRole(user: AuthUser, requiredRole: UserRole): boolean {
  if (requiredRole === UserRole.ORG_ADMIN) {
    return user.role === UserRole.ORG_ADMIN;
  }
  return true; // USER role has access to USER-level operations
}

/**
 * Check if user belongs to the specified organization
 */
export function belongsToOrganization(user: AuthUser, organizationId: string): boolean {
  return user.organizationId === organizationId;
}

/**
 * Validate that user has access to organization and required role
 */
export function validateOrgAccess(
  user: AuthUser,
  organizationId: string,
  requiredRole?: UserRole
): { valid: boolean; error?: string } {
  if (!belongsToOrganization(user, organizationId)) {
    return { valid: false, error: 'Access denied: User does not belong to this organization' };
  }

  if (requiredRole && !hasRole(user, requiredRole)) {
    return { valid: false, error: `Access denied: ${requiredRole} role required` };
  }

  return { valid: true };
}

/**
 * Generate a secure token for invitations
 */
export function generateInviteToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash a token for secure storage
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Verify token against hash
 */
export function verifyToken(token: string, hash: string): boolean {
  return hashToken(token) === hash;
}

/**
 * Generate invite URL
 */
export function generateInviteUrl(token: string): string {
  const baseUrl = process.env.APP_URL || 'http://localhost:3000';
  return `${baseUrl}/accept-invite?token=${token}`;
}

/**
 * Check if invitation is valid and not expired
 */
export async function validateInvitation(token: string): Promise<{
  valid: boolean;
  invitation?: {
    id: string;
    organizationId: string;
    email: string;
    role: UserRole;
  };
  error?: string;
}> {
  try {
    const tokenHash = hashToken(token);

    const invitation = await prisma.invitation.findUnique({
      where: { tokenHash },
      include: { organization: true },
    });

    if (!invitation) {
      return { valid: false, error: 'Invalid invitation token' };
    }

    if (invitation.usedAt) {
      return { valid: false, error: 'Invitation has already been used' };
    }

    if (invitation.expiresAt < new Date()) {
      return { valid: false, error: 'Invitation has expired' };
    }

    return {
      valid: true,
      invitation: {
        id: invitation.id,
        organizationId: invitation.organizationId,
        email: invitation.email,
        role: invitation.role,
      },
    };
  } catch (error) {
    console.error('Error validating invitation:', error);
    return { valid: false, error: 'Error validating invitation' };
  }
}

/**
 * Get organization by subdomain (optional feature)
 */
export async function getOrganizationBySubdomain(subdomain: string): Promise<{
  id: string;
  name: string;
  domain: string | null;
} | null> {
  try {
    const organization = await prisma.organization.findFirst({
      where: { domain: subdomain },
    });
    return organization;
  } catch (error) {
    console.error('Error getting organization by subdomain:', error);
    return null;
  }
}

/**
 * Extract subdomain from request headers (for use in API routes)
 */
export function getSubdomainFromHeaders(headers: Headers): string | null {
  return headers.get('x-organization-subdomain');
}
