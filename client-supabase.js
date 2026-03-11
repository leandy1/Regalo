// SUPABASE CONFIGURATION
// Replace with your actual Project URL and Anon Key from Supabase Dashboard
const SUPABASE_URL = 'https://cqwmbwempndthxdesvgc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxd21id2VtcG5kdGh4ZGVzdmdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyNDMxMDMsImV4cCI6MjA4ODgxOTEwM30.33_O2M-3xuOooWUXjLR4LKsS9EC9c7dz-L5bYmAN3No';

// Usamos window.supabase para evitar conflictos de nombres (shadowing)
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Lo exponemos globalmente para que el resto de los scripts puedan usarlo
window.supabase = supabaseClient;

// Verification (optional)
console.log("Supabase inicializado ✨");
