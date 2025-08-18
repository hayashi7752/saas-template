import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SAAS Starter Kit',
  description: 'SAAS Starter Kit with Stripe, Supabase, Postgres',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* Stripe disabled */}
      {/* <script async src="https://js.stripe.com/v3/pricing-table.js"></script> */}
      <body className={`${inter.className} min-h-dvh bg-background text-foreground`}>
        {children}
      </body>
    </html>
  );
}
