// import StripePricingTable from '@/components/StripePricingTable';
import Image from 'next/image';
import { createClient } from '@/utils/supabase/server';
// import { createStripeCheckoutSession } from '@/utils/stripe/api';
export default async function Subscribe() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // Stripe disabled
  const checkoutSessionSecret = '';

  return (
    <div className="flex min-h-screen flex-col bg-secondary">
      <header className="fixed flex h-16 w-full items-center  border-b border-b-slate-200 bg-white px-4 lg:px-6">
        <Image src="/logo.png" alt="logo" width={50} height={50} />
        <span className="sr-only">Acme Inc</span>
      </header>
      <div className="w-full py-20 lg:py-32 xl:py-40">
        <div className="py-6 text-center md:py-10 lg:py-12 ">
          <h1 className="text-xl font-bold md:text-3xl lg:text-4xl ">Pricing</h1>
          <h1 className="md:text-md pt-4 text-sm text-muted-foreground lg:text-lg">
            Choose the right plan for your team! Cancel anytime!
          </h1>
        </div>
        {/* <StripePricingTable checkoutSessionSecret={checkoutSessionSecret} /> */}
        <div className="text-center text-muted-foreground">
          Stripe is disabled in this environment.
        </div>
      </div>
    </div>
  );
}
