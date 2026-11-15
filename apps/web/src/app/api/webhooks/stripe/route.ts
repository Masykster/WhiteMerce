import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { toHttpErrorResponse } from "@/lib/api-error";
import { getEnv } from "@/lib/env";
import { getStripeClient } from "@/lib/stripe";
import {
  cancelUnpaidOrder,
  fulfillPaidOrder,
} from "@/services/payment-fulfillment";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const stripe = getStripeClient();
  const webhookSecret = getEnv().STRIPE_WEBHOOK_SECRET.trim();

  if (!stripe || !webhookSecret) {
    return NextResponse.json(
      { error: "Stripe webhook is not configured" },
      { status: 503 },
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 },
    );
  }

  const rawBody = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId;
      if (orderId) {
        await fulfillPaidOrder({
          eventId: event.id,
          provider: "stripe",
          eventType: event.type,
          orderId,
          stripePaymentIntentId:
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : session.payment_intent?.id ?? null,
        });
      }
    } else if (event.type === "checkout.session.expired") {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId;
      if (orderId) {
        await cancelUnpaidOrder({
          eventId: event.id,
          provider: "stripe",
          eventType: event.type,
          orderId,
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const { status, body } = toHttpErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
