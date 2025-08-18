import { createClient } from '@supabase/supabase-js';

// Service role client for admin operations
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Regular server client for user operations
export { createClient } from '@/utils/supabase/server';
