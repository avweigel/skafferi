"use server";

import { revalidatePath } from "next/cache";
import { requireHousehold } from "@/lib/household";
import { ensureWeekPlan } from "@/lib/plan";
import { manualItemSchema, type ManualItemInput } from "@/lib/schemas/plan";
import type { ActionResult } from "@/lib/actions/household";

export async function toggleItemChecked(itemId: string, checked: boolean): Promise<ActionResult> {
  const { supabase } = await requireHousehold();
  const { error } = await supabase
    .from("shopping_items")
    .update({ checked })
    .eq("id", itemId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/list");
  return { ok: true };
}

export async function addManualItem(input: ManualItemInput): Promise<ActionResult> {
  const parsed = manualItemSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "invalid item" };
  }
  const { supabase, householdId } = await requireHousehold();
  const d = parsed.data;
  try {
    const plan = await ensureWeekPlan(supabase, householdId, d.weekStart);
    const { error } = await supabase.from("shopping_items").insert({
      week_plan_id: plan.id,
      ingredient_id: null,
      name: d.name,
      name_sv: null,
      section: d.section,
      quantity: d.quantity,
      unit: d.unit,
      for_days: [],
      buy_day_of: false,
      manual: true,
      checked: false,
    });
    if (error) throw new Error(error.message);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "could not add item" };
  }
  revalidatePath("/list");
  return { ok: true };
}

export async function removeItem(itemId: string): Promise<ActionResult> {
  const { supabase } = await requireHousehold();
  const { error } = await supabase.from("shopping_items").delete().eq("id", itemId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/list");
  return { ok: true };
}

const TOKEN_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

function randomToken(length: number) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = "";
  for (const b of bytes) out += TOKEN_ALPHABET[b % TOKEN_ALPHABET.length];
  return out;
}

export async function getOrCreateShareToken(
  weekStart: string,
): Promise<{ ok: true; token: string } | { ok: false; error: string }> {
  const { supabase, householdId } = await requireHousehold();
  try {
    const plan = await ensureWeekPlan(supabase, householdId, weekStart);
    const { data: found, error } = await supabase
      .from("share_links")
      .select("token")
      .eq("week_plan_id", plan.id)
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (found) return { ok: true, token: (found as { token: string }).token };

    const token = randomToken(12);
    const { error: insErr } = await supabase
      .from("share_links")
      .insert({ token, week_plan_id: plan.id });
    if (insErr) throw new Error(insErr.message);
    return { ok: true, token };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "could not create link" };
  }
}
