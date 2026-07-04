import { supabase } from "@/integrations/supabase/client";

export function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function createVerificationCode(
  email: string,
  purpose: "signup" | "password_reset",
  ttlMinutes = 15,
): Promise<string> {
  const code = generateCode();
  const expires_at = new Date(Date.now() + ttlMinutes * 60_000).toISOString();
  const { error } = await supabase
    .from("verification_codes")
    .insert({ email: email.toLowerCase(), purpose, code, expires_at });
  if (error) throw error;
  return code;
}

export async function validateVerificationCode(
  email: string,
  code: string,
  purpose: "signup" | "password_reset",
): Promise<boolean> {
  const { data, error } = await supabase
    .from("verification_codes")
    .select("id, expires_at, used")
    .eq("email", email.toLowerCase())
    .eq("code", code)
    .eq("purpose", purpose)
    .eq("used", false)
    .order("created_at", { ascending: false })
    .limit(1);
  if (error) throw error;
  const row = data?.[0];
  if (!row) return false;
  if (new Date(row.expires_at) < new Date()) return false;
  const { error: updErr } = await supabase.from("verification_codes").update({ used: true }).eq("id", row.id);
  if (updErr) throw updErr;
  return true;
}
