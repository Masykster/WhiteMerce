import Stripe from "stripe";
import { getEnv } from "./env";

let stripeSingleton: Stripe | null = null;

export function getStripeClient(): Stripe | null {
  const secretKey = getEnv().STRIPE_SECRET_KEY.trim();
  if (!secretKey) {
    return null;
  }
  if (!stripeSingleton) {
    stripeSingleton = new Stripe(secretKey);
  }
  return stripeSingleton;
}
