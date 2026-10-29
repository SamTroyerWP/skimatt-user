import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://caffytcqvkvdqpuwzxno.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhZmZ5dGNxdmt2ZHFwdXd6eG5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTIxNDc0NzAsImV4cCI6MjAyNzcyMzQ3MH0.cwA6UWiAJFIbOXO9Oy2JX5Nl_G9LnXTHFaUBYEScsMk';

export const supabase = createClient(supabaseUrl, supabaseKey);