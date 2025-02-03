import { createClient } from "@supabase/supabase-js";
import { useSupabaseStore } from "src/stores/SupabaseStore";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
