"use server";

import { revalidatePath } from "next/cache";
import { requireHousehold } from "@/lib/household";
import { newIngredientSchema } from "@/lib/schemas/pantry";
import type { ActionResult } from "@/lib/actions/household";

export async function toggleInPantry(ingredientId: string, inPantry: boolean): Promise<ActionResult> {
  const { supabase, householdId } = await requireHousehold();
  const { error } = await supabase
    .from("ingredients")
    .update({ in_pantry: inPantry })
    .eq("id", ingredientId)
    .eq("household_id", householdId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/pantry");
  return { ok: true };
}

export async function updateSwedishName(ingredientId: string, nameSv: string): Promise<ActionResult> {
  const { supabase, householdId } = await requireHousehold();
  const trimmed = nameSv.trim();
  const { error } = await supabase
    .from("ingredients")
    .update({ name_sv: trimmed.length > 0 ? trimmed : null })
    .eq("id", ingredientId)
    .eq("household_id", householdId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/pantry");
  return { ok: true };
}

export async function addIngredient(formData: FormData): Promise<ActionResult> {
  const parsed = newIngredientSchema.safeParse({
    name: formData.get("name"),
    name_sv: formData.get("name_sv") ?? "",
    section: formData.get("section"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "invalid ingredient" };
  }
  const { supabase, householdId } = await requireHousehold();

  const { data: existing } = await supabase
    .from("ingredients")
    .select("id")
    .eq("household_id", householdId)
    .ilike("name", parsed.data.name)
    .maybeSingle();
  if (existing) return { ok: false, error: "That ingredient already exists." };

  const { error } = await supabase.from("ingredients").insert({
    household_id: householdId,
    name: parsed.data.name,
    name_sv: parsed.data.name_sv,
    section: parsed.data.section,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/pantry");
  return { ok: true };
}

export async function deleteIngredient(ingredientId: string): Promise<ActionResult> {
  const { supabase, householdId } = await requireHousehold();
  const { error } = await supabase
    .from("ingredients")
    .delete()
    .eq("id", ingredientId)
    .eq("household_id", householdId);
  if (error) {
    if (error.code === "23503") return { ok: false, error: "Used by a recipe, so it stays." };
    return { ok: false, error: error.message };
  }
  revalidatePath("/pantry");
  return { ok: true };
}
