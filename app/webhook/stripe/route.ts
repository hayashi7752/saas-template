import { prisma } from '@/utils/db/prisma';

export async function POST(req: Request) {
  try {
    const event = await req.json();

    // NOTE: handle other event types as you need
    switch (event.type) {
      case 'customer.subscription.created':
        console.log('Subscription created');
        console.log('event:', event);
        await prisma.user.updateMany({
          where: { stripeId: event.data.object.customer as string },
          data: { plan: event.data.object.id as string },
        });
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return new Response('Success', { status: 200 });
  } catch (err) {
    return new Response(`Webhook error: ${err instanceof Error ? err.message : 'Unknown error'}`, {
      status: 400,
    });
  }
}
