export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  getCurrentUser,
  validateOrgAccess,
  generateInviteToken,
  hashToken,
  generateInviteUrl,
} from '@/lib/auth';
import { UserRole } from '@/lib/generated/prisma';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { organizationId, email, role = UserRole.USER } = body;

    if (!organizationId || !email) {
      return NextResponse.json(
        { error: 'Organization ID and email are required' },
        { status: 400 }
      );
    }

    // Validate user has ORG_ADMIN role and belongs to the organization
    const access = validateOrgAccess(user, organizationId, UserRole.ORG_ADMIN);
    if (!access.valid) {
      return NextResponse.json({ error: access.error }, { status: 403 });
    }

    // Check if user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
    }

    // Check if there's already a pending invitation for this email
    const existingInvitation = await prisma.invitation.findFirst({
      where: {
        organizationId,
        email,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (existingInvitation) {
      return NextResponse.json(
        { error: 'Pending invitation already exists for this email' },
        { status: 409 }
      );
    }

    // Generate invitation token and create invitation
    const token = generateInviteToken();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await prisma.invitation.create({
      data: {
        organizationId,
        email,
        role,
        tokenHash,
        expiresAt,
      },
    });

    const inviteUrl = generateInviteUrl(token);

    return NextResponse.json({
      success: true,
      inviteUrl,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
      },
    });
  } catch (error) {
    console.error('Error creating invitation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
