import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://didsrngfiojuqnjbuktj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZHNybmdmaW9qdXFuamJ1a3RqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NzUzNzQsImV4cCI6MjA3NjA1MTM3NH0.vf24Gk__mXuk21-cA_7oyswlmLoUTh6L_gwkvYloWEE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);