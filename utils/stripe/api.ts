// Stripe disabled in dev: provide safe stubs
export async function getStripePlan(_email: string) {
  return 'No plan';
}

export async function createStripeCustomer(_id: string, _email: string, _name?: string) {
  return 'stub_stripe_customer_id';
}

export async function createStripeCheckoutSession(_email: string) {
  return 'stub_checkout_session_secret';
}

export async function generateStripeBillingPortalLink(_email: string) {
  return '/dashboard';
}
