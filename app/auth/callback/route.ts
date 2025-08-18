import { NextResponse } from 'next/server';
// The client you created from the Server-Side Auth instructions
import { createClient } from '@/utils/supabase/server';
import { createStripeCustomer } from '@/utils/stripe/api';
import { prisma } from '@/utils/db/prisma';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // check to see if user already exists in db
      const existingUser = await prisma.user.findUnique({ where: { email: user!.email! } });
      const isUserInDB = !!existingUser;
      if (!isUserInDB) {
        // create Stripe customers
        const stripeID = await createStripeCustomer(
          user!.id,
          user!.email!,
          user!.user_metadata.full_name
        );
        // Note: User creation is now handled through organization invitations
        // The user will be created when they accept an invitation
        // For now, we skip automatic user creation in favor of invitation-based flow
      }

      const forwardedHost = request.headers.get('x-forwarded-host'); // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === 'development';
      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
