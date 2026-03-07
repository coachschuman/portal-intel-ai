
import { createClient } from '@supabase/supabase-js';

/**
 * PROJECT CREDENTIALS
 * Direct injection from provided configuration
 */
const supabaseUrl = 'https://yubhdtdhadqldrnoeyrr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1YmhkdGRoYWRxbGRybm9leXJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwNDU4MjAsImV4cCI6MjA4MjYyMTgyMH0.F1T-xr2NLXop912sy1iWQZOm_5dMuWOUTwAnEB-P1zs';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1YmhkdGRoYWRxbGRybm9leXJyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzA0NTgyMCwiZXhwIjoyMDgyNjIxODIwfQ.xkKZZyXLRd34Vc_QiAsUY_eSPb4CHOE8rchz2HjqXII';

// Standard Client (Respects RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Administrative Client (Bypasses RLS - FOR ADMIN USE ONLY)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

/**
 * Utility to check if Supabase has been properly configured.
 */
export const isSupabaseConfigured = () => {
  return !!supabaseUrl && !!supabaseAnonKey && !supabaseUrl.includes('placeholder');
};
