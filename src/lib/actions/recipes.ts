"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Db } from "@/lib/supabase/types";
import { requireHousehold } from "@/lib/household";
import { recipeInputSchema, type RecipeInput, type RecipeParsed } from "@/lib/schemas/recipe";
import type { Ingredient } from "@/lib/types";

export type RecipeActionResult = { ok: true; id: string } | { ok: false; error: string };

// match ingredient names case-insensitively against what the household
// already has, create the rest, and hand back name -> ingredient id.
async function upsertIngredients(
  supabase: Db,
  householdId: string,
  rows: RecipeParsed["ingredients"],
) {
  const { data: existingData, error } = await supabase
    .from("ingredients")
    .select("id, name, name_sv, section, in_pantry, household_id, created_at")
    .eq("household_id", householdId);
  if (error) throw new Error(error.message);
  const existing = (existingData ?? []) as Ingredient[];

  const byLower = new Map<string, Ingredient>();
  for (const ing of existing) byLower.set(ing.name.toLowerCase(), ing);

  const ids = new Map<string, string>();
  const toInsert: { household_id: string; name: string; name_sv: string | null; section: string }[] = [];
  const seen = new Set<string>();

  for (const row of rows) {
    const key = row.name.toLowerCase();
    const found = byLower.get(key);
    if (found) {
      ids.set(key, found.id);
      // fill in a swedish name if the saved ingredient lacks one
      if (!found.name_sv && row.name_sv) {
        await supabase.from("ingredients").update({ name_sv: row.name_sv }).eq("id", found.id);
      }
      continue;
    }
    if (seen.has(key)) continue;
    seen.add(key);
    toInsert.push({
      household_id: householdId,
      name: row.name,
      name_sv: row.name_sv ?? null,
      section: row.section,
    });
  }

  if (toInsert.length > 0) {
    const { data: inserted, error: insErr } = await supabase
      .from("ingredients")
      .insert(toInsert)
      .select("id, name");
    if (insErr) throw new Error(insErr.message);
    for (const ing of (inserted ?? []) as Pick<Ingredient, "id" | "name">[]) {
      ids.set(ing.name.toLowerCase(), ing.id);
    }
  }

  return ids;
}

async function writeRecipeIngredients(
  supabase: Db,
  recipeId: string,
  rows: RecipeParsed["ingredients"],
  ids: Map<string, string>,
) {
  const payload = rows.map((row, i) => ({
    recipe_id: recipeId,
    ingredient_id: ids.get(row.name.toLowerCase()),
    quantity: row.quantity ?? null,
    unit: row.unit ?? null,
    note: row.note ?? null,
    order_index: i,
  }));
  if (payload.length === 0) return;
  const { error } = await supabase.from("recipe_ingredients").insert(payload);
  if (error) throw new Error(error.message);
}

export async function createRecipe(input: RecipeInput): Promise<RecipeActionResult> {
  const parsed = recipeInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "invalid recipe" };
  }
  const { supabase, user, householdId } = await requireHousehold();
  const data = parsed.data;

  try {
    const ids = await upsertIngredients(supabase, householdId, data.ingredients);
    const { data: recipe, error } = await supabase
      .from("recipes")
      .insert({
        household_id: householdId,
        title: data.title,
        servings: data.servings,
        steps: data.steps ?? null,
        source_url: data.source_url ?? null,
        source_text: data.source_text ?? null,
        tags: data.tags,
        notes: data.notes ?? null,
        created_by: user.id,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    const recipeId = (recipe as { id: string }).id;
    await writeRecipeIngredients(supabase, recipeId, data.ingredients, ids);
    revalidatePath("/recipes");
    revalidatePath("/pantry");
    return { ok: true, id: recipeId };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "could not save recipe" };
  }
}

export async function updateRecipe(recipeId: string, input: RecipeInput): Promise<RecipeActionResult> {
  const parsed = recipeInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "invalid recipe" };
  }
  const { supabase, householdId } = await requireHousehold();
  const data = parsed.data;

  try {
    const ids = await upsertIngredients(supabase, householdId, data.ingredients);
    const { error } = await supabase
      .from("recipes")
      .update({
        title: data.title,
        servings: data.servings,
        steps: data.steps ?? null,
        source_url: data.source_url ?? null,
        notes: data.notes ?? null,
        tags: data.tags,
      })
      .eq("id", recipeId)
      .eq("household_id", householdId);
    if (error) throw new Error(error.message);

    const { error: delErr } = await supabase
      .from("recipe_ingredients")
      .delete()
      .eq("recipe_id", recipeId);
    if (delErr) throw new Error(delErr.message);
    await writeRecipeIngredients(supabase, recipeId, data.ingredients, ids);

    revalidatePath("/recipes");
    revalidatePath(`/recipes/${recipeId}`);
    revalidatePath("/pantry");
    return { ok: true, id: recipeId };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "could not save recipe" };
  }
}

export async function deleteRecipe(recipeId: string) {
  const { supabase, householdId } = await requireHousehold();
  // planned days that pointed at this recipe go back to empty first
  await supabase
    .from("plan_days")
    .update({ slot: "empty", recipe_id: null, servings: null })
    .eq("recipe_id", recipeId);
  const { error } = await supabase
    .from("recipes")
    .delete()
    .eq("id", recipeId)
    .eq("household_id", householdId);
  if (error) throw new Error(error.message);
  revalidatePath("/recipes");
  revalidatePath("/plan");
  redirect("/recipes");
}
