import { createClient } from '@supabase/supabase-js';

// Validate environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_SERVICE_KEY in environment variables.');
  console.error('You can get these from: https://app.supabase.com/project/_/settings/api');
}

// Create Supabase client for storage operations
export const supabase = createClient(
  supabaseUrl || '',
  supabaseKey || '',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

// Storage bucket names
export const STORAGE_BUCKETS = {
  PRODUCTS: 'products',        // Menu items, categories, cake flavors, themes
  PAYMENT_QR: 'payment-qr',    // Payment QR codes (GCash, PayMaya)
  SESSION_QR: 'session-qr',    // Custom cake session QR codes
} as const;

// Check if Supabase is properly configured
export const isSupabaseConfigured = (): boolean => {
  return !!(supabaseUrl && supabaseKey);
};

// Helper to get public URL for a file
export const getPublicUrl = (bucket: string, path: string): string => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};
