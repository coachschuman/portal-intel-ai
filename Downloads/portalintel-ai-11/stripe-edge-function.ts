// This file is intended to be deployed as a Supabase Edge Function
// Location: /supabase/functions/stripe-checkout/index.ts

// Declare Deno global to satisfy TypeScript compiler in non-Deno environments.
declare const Deno: any;

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Get the user from the authorization header (Supabase Auth)
    // In a real app, use the Supabase Admin Client to verify the JWT
    // const authHeader = req.headers.get('Authorization')!;
    // const token = authHeader.replace('Bearer ', '');
    // const { data: { user } } = await supabase.auth.getUser(token);

    // 2. Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: "price_YOUR_STRIPE_PRICE_ID", // Replace with your actual Price ID from Stripe
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${req.headers.get("origin")}/?session_id={CHECKOUT_SESSION_ID}&status=success`,
      cancel_url: `${req.headers.get("origin")}/?status=cancelled`,
      // metadata: { user_id: user?.id }, // Pass user ID to associate payment in webhook
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});