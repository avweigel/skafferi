import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Household, HouseholdMember } from "@/lib/types";

export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

// the first household the user joined. one household per person is the
// expected case; a second one is reachable later if that ever matters.
export async function getMembership() {
  const { supabase, user } = await requireUser();
  const { data } = await supabase
    .from("household_members")
    .select("household_id, user_id, role, joined_at")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  const membership = (data as HouseholdMember | null) ?? null;
  return { supabase, user, membership };
}

export async function requireHousehold() {
  const { supabase, user, membership } = await getMembership();
  if (!membership) redirect("/household/new");
  const { data } = await supabase
    .from("households")
    .select("id, name, created_by, created_at")
    .eq("id", membership.household_id)
    .single();
  const household = data as Household;
  return { supabase, user, membership, household, householdId: membership.household_id };
}
