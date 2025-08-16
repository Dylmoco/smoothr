import type { SupabaseClient } from "npm:@supabase/supabase-js@2.38.4";

export async function findOrCreateCustomer(
  supabase: SupabaseClient,
  storeId: string,
  email: string,
): Promise<string | null> {
  const { data: existing, error: lookupError } = await supabase
    .from("customers")
    .select("id")
    .eq("store_id", storeId)
    .eq("email", email)
    .maybeSingle();

  if (lookupError) throw new Error(lookupError.message);

  if (existing) {
    return existing.id as string;
  }

  const { data: inserted, error: insertError } = await supabase
    .from("customers")
    .insert({ store_id: storeId, email })
    .select("id")
    .single();

  if (insertError) throw new Error(insertError.message);

  return inserted?.id ?? null;
}
