import DashboardHeader from '@/components/DashboardHeader';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/utils/db/prisma';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SAAS Starter Kit',
  description: 'SAAS Starter Kit with Stripe, Supabase, Postgres',
};

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Check if user has plan selected. If not redirect to subscibe
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // check user plan in db
  const dbUser = await prisma.user.findUnique({ where: { email: user!.email! } });
  if (dbUser && dbUser.plan === 'none') {
    console.log('User has no plan selected');
    return redirect('/subscribe');
  }

  return (
    <html lang="en">
      <DashboardHeader />
      {children}
    </html>
  );
}
