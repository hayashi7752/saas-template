/* eslint-disable no-console */
const { createClient } = require('@supabase/supabase-js');
const { PrismaClient } = require('../lib/generated/prisma');
require('dotenv').config();

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRole) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
  }

  const email = process.env.SEED_ADMIN_EMAIL || 'test@example.com';
  const password = process.env.SEED_ADMIN_PASSWORD || 'password';

  const supabase = createClient(url, serviceRole);
  const prisma = new PrismaClient();

  try {
    // Ensure auth user exists
    const { data: existing, error: listErr } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1,
      email,
    });
    if (listErr) throw listErr;

    let authUserId;
    const found = existing?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (found) {
      authUserId = found.id;
      console.log('Auth user already exists:', authUserId);
    } else {
      const { data: created, error: createErr } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (createErr) throw createErr;
      authUserId = created.user.id;
      console.log('Created auth user:', authUserId);
    }

    // Link to Prisma users row
    const user = await prisma.user.upsert({
      where: { email },
      update: { authUserId, isSystemAdmin: true, status: 'active', role: 'ORG_ADMIN' },
      create: {
        organizationId: '00000000-0000-0000-0000-000000000001',
        authUserId,
        email,
        name: 'System Admin',
        role: 'ORG_ADMIN',
        status: 'active',
        plan: 'none',
        isSystemAdmin: true,
      },
    });
    console.log('Linked prisma user:', user.id);
    console.log('Done. You can now login with', email, '/', password);
  } catch (e) {
    console.error('Failed:', e?.message || e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
