import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://wrdswykpupwgqatrliiu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyZHN3eWtwdXB3Z3FhdHJsaWl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NjIwMjEsImV4cCI6MjA4ODIzODAyMX0.eI_05nyZ0U9HkpdhKFkP3tsU32fD0cy1jwtU9KPsyyU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
