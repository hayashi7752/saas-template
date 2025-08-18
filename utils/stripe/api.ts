import { Stripe } from 'stripe';
import { prisma } from '../db/prisma';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const PUBLIC_URL = process.env.NEXT_PUBLIC_WEBSITE_URL || 'http://localhost:3000';

export async function getStripePlan(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('User not found');
  const subscription = await stripe.subscriptions.retrieve(user.plan);
  const productId = subscription.items.data[0].plan.product as string;
  const product = await stripe.products.retrieve(productId);
  return product.name;
}

export async function createStripeCustomer(id: string, email: string, name?: string) {
  const customer = await stripe.customers.create({
    name: name ? name : '',
    email: email,
    metadata: {
      supabase_id: id,
    },
  });
  // Create a new customer in Stripe
  return customer.id;
}

export async function createStripeCheckoutSession(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('User not found');
  const customerSession = await stripe.customerSessions.create({
    customer: user.stripeId,
    components: {
      pricing_table: {
        enabled: true,
      },
    },
  });
  return customerSession.client_secret;
}

export async function generateStripeBillingPortalLink(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('User not found');
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: user.stripeId,
    return_url: `${PUBLIC_URL}/dashboard`,
  });
  return portalSession.url;
}
