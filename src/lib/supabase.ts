import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://emznpmkvhslmhdznzfem.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_n4ICOF5ABaOfZ7Ou0oi2fA_Z-8iwiJo";


export const supabase = createClient(supabaseUrl, supabaseAnonKey);
