import { PrismaClient, UserRole } from '../lib/generated/prisma';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  // Seed Organization
  const org = await prisma.organization.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'PeakState',
      domain: 'peakstate.local',
    },
  });

  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'test@example.com';
  const adminAuthId = process.env.SEED_ADMIN_AUTH_ID || randomUUID();

  // Seed Admin User (linked to organization)
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      organizationId: org.id,
      role: UserRole.ORG_ADMIN,
      status: 'active',
      isSystemAdmin: true,
    },
    create: {
      organizationId: org.id,
      authUserId: adminAuthId,
      email: adminEmail,
      name: 'System Admin',
      role: UserRole.ORG_ADMIN,
      status: 'active',
      plan: 'none',
      isSystemAdmin: true,
    },
  });

  // Seed a regular user invitation
  const inviteEmail = process.env.SEED_INVITE_EMAIL || 'user@peakstate.local';
  const inviteTokenHash = randomUUID().replace(/-/g, '');
  await prisma.invitation.upsert({
    where: { tokenHash: inviteTokenHash },
    update: {},
    create: {
      organizationId: org.id,
      email: inviteEmail,
      role: UserRole.USER,
      tokenHash: inviteTokenHash,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days
    },
  });

  // Log seed summary
  const users = await prisma.user.findMany({ where: { organizationId: org.id } });
  const invites = await prisma.invitation.findMany({ where: { organizationId: org.id } });
  console.log('Seed complete:');
  console.log(`- Organization: ${org.name} (${org.id})`);
  console.log(`- Users: ${users.length}`);
  console.log(`- Invitations: ${invites.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
