import { createClient } from "@supabase/supabase-js";
import type { AppData } from "../types";
import { normalizeData } from "./storage";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

function isValidSupabaseUrl(value: string | undefined) {
  if (!value) return false;

  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export const isSupabaseConfigured = Boolean(
  isValidSupabaseUrl(supabaseUrl) && supabaseAnonKey,
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export async function loadCloudData(userId: string) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("north_user_data")
    .select("data")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data?.data ? normalizeData(data.data) : null;
}

export async function saveCloudData(userId: string, data: AppData) {
  if (!supabase) return;

  const { error } = await supabase.from("north_user_data").upsert({
    user_id: userId,
    data,
    updated_at: new Date().toISOString(),
  });

  if (error) throw error;
}
