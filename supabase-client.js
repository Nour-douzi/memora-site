const SUPABASE_URL = "https://pbvgyjsyvfvzcusldaez.supabase.co";
const SUPABASE_KEY = "sb_publishable_ggkhpZhDW8H-AZaTxdj2eg_oxsoPM8C";
if (typeof supabase === "undefined") {
    console.error("La bibliothèque supabase-js n'est pas chargée avant supabase-client.js.");
}

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);