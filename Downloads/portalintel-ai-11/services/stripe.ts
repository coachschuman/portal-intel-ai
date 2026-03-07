
/**
 * Utility for Stripe + Supabase Edge Function integration
 */

const SUPABASE_PROJECT_URL = 'https://your-project-id.supabase.co'; 
const EDGE_FUNCTION_NAME = 'stripe-checkout';

// Payment Links
const STRIPE_MONTHLY_LINK = 'https://buy.stripe.com/14A7sM1v01Zq40p4qkeME06';
const STRIPE_DAILY_LINK = 'https://buy.stripe.com/14A7sM1v01Zq40p4qkeME06?plan=daily'; // Placeholder, typically would be a separate link or handled via edge function

export const createStripeCheckout = async (planType: 'daily' | 'monthly' = 'monthly'): Promise<string> => {
  try {
    if (!SUPABASE_PROJECT_URL.includes('your-project-id')) {
      const response = await fetch(`${SUPABASE_PROJECT_URL}/functions/v1/${EDGE_FUNCTION_NAME}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plan: planType })
      });

      if (response.ok) {
        const { url } = await response.json();
        return url;
      }
    }
    
    // Fallback to direct links
    return planType === 'daily' ? STRIPE_DAILY_LINK : STRIPE_MONTHLY_LINK;
  } catch (err) {
    return planType === 'daily' ? STRIPE_DAILY_LINK : STRIPE_MONTHLY_LINK;
  }
};

export const checkSubscriptionStatus = async (): Promise<boolean> => {
  try {
    return localStorage.getItem('portal_pro_access') === 'true';
  } catch (err) {
    return false;
  }
};
