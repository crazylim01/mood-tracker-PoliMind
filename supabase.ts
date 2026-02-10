
import { createClient } from '@supabase/supabase-js';

// The project reference in your API key is 'mougssyyjplyxqfflfqht'
const supabaseUrl = 'https://mougssyyjplyxqfflfqht.supabase.co';

// Anon Public Key
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vdWdzc3l5anBseHFmZmxmcWh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0MTAyNDksImV4cCI6MjA4NDk4NjI0OX0.GwLN8f2481wgrYcax4pto5bOV5VsBHm5s-wWzIVKOYs';

export const supabase = createClient(supabaseUrl, supabaseKey);
