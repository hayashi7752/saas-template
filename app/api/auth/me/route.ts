export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        organizationId: user.organizationId,
        authUserId: user.authUserId,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        organization: {
          id: user.organization.id,
          name: user.organization.name,
          domain: user.organization.domain,
        },
      },
    });
  } catch (error) {
    console.error('Error getting current user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
