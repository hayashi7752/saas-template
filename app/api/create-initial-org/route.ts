export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { UserRole } from '@/lib/generated/prisma';

/**
 * Temporary endpoint to create initial organization and admin user
 * This should only be used during development/setup
 */
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
    const { organizationName, domain } = body;

    if (!organizationName) {
      return NextResponse.json({ error: 'Organization name is required' }, { status: 400 });
    }

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

    // Create organization and user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create organization
      const organization = await tx.organization.create({
        data: {
          name: organizationName,
          domain,
        },
      });

      // Create admin user
      const user = await tx.user.create({
        data: {
          authUserId: authUser.id,
          organizationId: organization.id,
          email: authUser.email!,
          name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || null,
          role: UserRole.ORG_ADMIN,
          status: 'active',
        },
        include: {
          organization: true,
        },
      });

      return { organization, user };
    });

    return NextResponse.json({
      success: true,
      organization: result.organization,
      user: {
        id: result.user.id,
        organizationId: result.user.organizationId,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
      },
    });
  } catch (error) {
    console.error('Error creating initial organization:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}