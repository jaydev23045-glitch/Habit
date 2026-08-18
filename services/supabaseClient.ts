// services/supabaseClient.ts
// Flow OS — Supabase client (MomProject)
// NOTE: This app uses CDN imports (importmap), so we use hardcoded keys here.
// These are safe to use — the anon key is a public key by design (protected by RLS).

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL  = 'https://jsnregpqyxjqtbkjclmc.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzbnJlZ3BxeXhqcXRia2pjbG1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2NDAwODAsImV4cCI6MjA5MzIxNjA4MH0.tyrgC9A5lYie8yelfHLg6oMvUSKgiEm_e0utfNnpOso';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    persistSession: true,        // Keeps user logged in across browser tabs
    autoRefreshToken: true,      // Auto-refresh JWT before expiry
    storageKey: 'flow-os-auth',  // localStorage key for session
    detectSessionInUrl: true,    // Handle OAuth redirects
  }
});
