export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { validateInvitation, hashToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: 'Invitation token is required' }, { status: 400 });
    }

    // Validate the invitation token
    const validation = await validateInvitation(token);
    if (!validation.valid || !validation.invitation) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { invitation } = validation;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { authUserId: authUser.id },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists and is associated with an organization' },
        { status: 409 }
      );
    }

    // Check if email matches the invitation
    if (authUser.email !== invitation.email) {
      return NextResponse.json({ error: 'Email does not match the invitation' }, { status: 400 });
    }

    // Create user and mark invitation as used
    const tokenHash = hashToken(token);

    const result = await prisma.$transaction(async (tx) => {
      // Create the user
      const newUser = await tx.user.create({
        data: {
          authUserId: authUser.id,
          organizationId: invitation.organizationId,
          email: invitation.email,
          name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || null,
          role: invitation.role,
          status: 'active',
        },
        include: {
          organization: true,
        },
      });

      // Mark invitation as used
      await tx.invitation.update({
        where: { tokenHash },
        data: { usedAt: new Date() },
      });

      return newUser;
    });

    return NextResponse.json({
      success: true,
      user: {
        id: result.id,
        organizationId: result.organizationId,
        email: result.email,
        name: result.name,
        role: result.role,
        organization: result.organization,
      },
    });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
