// ⚠️ IMPORTANT: Replace these with YOUR Supabase credentials
// Get these from: Supabase Dashboard → Settings → API

const SUPABASE_URL = 'https://zkzfuwpriwsuaegtwita.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpremZ1d3ByaXdzdWFlZ3R3aXRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNDM4MjQsImV4cCI6MjA4NTYxOTgyNH0.QVA57ZWIDU8jBJK4BTIoBv_1M6dEcox5MZDjHIC8O3M'

// Initialize Supabase client
const { createClient } = supabase
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Export for use in other files
window.supabaseClient = supabaseClient
