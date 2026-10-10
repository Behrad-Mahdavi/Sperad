import { createClient } from '@supabase/supabase-js';
import type { Database } from '@sperad/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-anon-key';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
