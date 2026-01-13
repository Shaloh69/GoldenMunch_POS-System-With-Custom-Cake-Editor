import { createClient } from '@supabase/supabase-js';

// Validate environment variables
// Trim to remove any trailing whitespace or newlines that could cause DNS errors
const supabaseUrl = process.env.SUPABASE_URL?.trim();
const supabaseKey = process.env.SUPABASE_SERVICE_KEY?.trim();

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_SERVICE_KEY in environment variables.');
  console.error('You can get these from: https://app.supabase.com/project/_/settings/api');
}

// Log config for debugging (hide key for security)
if (supabaseUrl) {
  console.log(`📦 Supabase URL: ${supabaseUrl}`);
  console.log(`📦 Supabase Key: ${supabaseKey ? '***' + supabaseKey.slice(-8) : 'missing'}`);
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
