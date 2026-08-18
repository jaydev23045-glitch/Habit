// services/cloudService.ts
// Flow OS — Cloud sync via Supabase (MomProject)
// Table: flow_os_vaults  (one JSONB row per user)

import { supabase } from './supabaseClient';
import { AppData } from '../types';

// ────────────────────────────────────────────────────────────────────────────
//  AUTH
// ────────────────────────────────────────────────────────────────────────────

/** Sign up a new user — Supabase hashes the password automatically (bcrypt) */
export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw new Error(error.message);
  return data.user;
};

/** Sign in an existing user */
export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  return data.user;
};

/** Sign out and clear session */
export const signOut = async () => {
  await supabase.auth.signOut();
};

/** Get the currently authenticated user */
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

/** Listen for auth state changes (login / logout across tabs) */
export const onAuthChange = (callback: (user: any) => void) => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });
  return subscription; // call subscription.unsubscribe() to clean up
};

// ────────────────────────────────────────────────────────────────────────────
//  VAULT (Data Sync)
// ────────────────────────────────────────────────────────────────────────────

/** Push the entire AppData state to Supabase */
export const pushVault = async (appData: AppData): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('[Flow OS] Not authenticated — cannot push vault.');

  const { error } = await supabase
    .from('flow_os_vaults')
    .upsert(
      { user_id: user.id, data: appData },
      { onConflict: 'user_id' }   // UPDATE if row exists, INSERT if new
    );

  if (error) throw new Error(`[Flow OS] Vault push failed: ${error.message}`);
};

/** Pull the AppData from Supabase for the current user */
export const pullVault = async (): Promise<AppData | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('flow_os_vaults')
    .select('data')
    .eq('user_id', user.id)
    .single();

  if (error || !data) return null;
  return data.data as AppData;
};

// ────────────────────────────────────────────────────────────────────────────
//  REAL-TIME SYNC (optional — multi-device / multi-tab live sync)
// ────────────────────────────────────────────────────────────────────────────

/**
 * Subscribe to live updates from other tabs or devices.
 * Returns the channel — call channel.unsubscribe() to clean up.
 */
export const subscribeToVault = (userId: string, onUpdate: (data: AppData) => void) => {
  const channel = supabase
    .channel(`flow-os-vault-${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'flow_os_vaults',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        if (payload.new?.data) {
          onUpdate(payload.new.data as AppData);
        }
      }
    )
    .subscribe();

  return channel;
};
