import { supabase } from '../shared/supabase/browserClient.js';

window.smoothr = window.smoothr || {};
window.smoothr.supabase = supabase;

// Optional helpers for DevTools
window.smoothr.getSession = () => supabase.auth.getSession();
window.smoothr.getUser = () => supabase.auth.getUser();
