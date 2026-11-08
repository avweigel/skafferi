"use server";

import { revalidatePath } from "next/cache";
import { requireHousehold } from "@/lib/household";
import { ensureWeekPlan } from "@/lib/plan";
import { planDaySchema, type PlanDayInput } from "@/lib/schemas/plan";
import type { ActionResult } from "@/lib/actions/household";
import type { Ingredient, PlanDay, Recipe, RecipeIngredient, ShoppingItem } from "@/lib/types";

export async function savePlanDay(input: PlanDayInput): Promise<ActionResult> {
  const parsed = planDaySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "invalid day" };
  }
  const { supabase, householdId } = await requireHousehold();
  const d = parsed.data;
  const isRecipe = d.slot === "recipe";

  try {
    const plan = await ensureWeekPlan(supabase, householdId, d.weekStart);
    const { error } = await supabase.from("plan_days").upsert(
      {
        week_plan_id: plan.id,
        day_of_week: d.dayOfWeek,
        slot: d.slot,
        recipe_id: isRecipe ? d.recipeId : null,
        servings: isRecipe ? d.servings : null,
        buy_day_of: isRecipe ? d.buyDayOf : false,
      },
      { onConflict: "week_plan_id,day_of_week" },
    );
    if (error) throw new Error(error.message);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "could not save" };
  }

  revalidatePath("/plan");
  revalidatePath("/");
  return { ok: true };
}

type PlanDayRow = PlanDay & {
  recipes: (Pick<Recipe, "id" | "servings"> & {
    recipe_ingredients: (RecipeIngredient & { ingredients: Ingredient | null })[];
  }) | null;
};

type Aggregate = {
  ingredient_id: string;
  name: string;
  name_sv: string | null;
  section: string;
  quantity: number | null;
  unit: string | null;
  days: Set<number>;
  buy_day_of: boolean;
};

function round(n: number) {
  return Math.round(n * 100) / 100;
}

export async function buildShoppingList(weekStart: string): Promise<ActionResult> {
  const { supabase, householdId } = await requireHousehold();

  try {
    const plan = await ensureWeekPlan(supabase, householdId, weekStart);

    const { data: daysData, error: daysErr } = await supabase
      .from("plan_days")
      .select(
        "id, week_plan_id, day_of_week, slot, recipe_id, servings, buy_day_of, recipes(id, servings, recipe_ingredients(id, recipe_id, ingredient_id, quantity, unit, note, order_index, ingredients(id, household_id, name, name_sv, section, in_pantry, created_at)))",
      )
      .eq("week_plan_id", plan.id)
      .eq("slot", "recipe");
    if (daysErr) throw new Error(daysErr.message);
    const days = (daysData ?? []) as unknown as PlanDayRow[];

    const agg = new Map<string, Aggregate>();
    for (const day of days) {
      const recipe = day.recipes;
      if (!recipe) continue;
      const factor = recipe.servings > 0 ? (day.servings ?? recipe.servings) / recipe.servings : 1;
      for (const ri of recipe.recipe_ingredients) {
        const ing = ri.ingredients;
        if (!ing || ing.in_pantry) continue;
        const unit = ri.unit?.trim() || null;
        const key = `${ing.id}|${(unit ?? "").toLowerCase()}`;
        const qty = ri.quantity === null ? null : round(ri.quantity * factor);
        const current = agg.get(key);
        if (current) {
          if (qty !== null) current.quantity = round((current.quantity ?? 0) + qty);
          current.days.add(day.day_of_week);
          current.buy_day_of = current.buy_day_of || day.buy_day_of;
        } else {
          agg.set(key, {
            ingredient_id: ing.id,
            name: ing.name,
            name_sv: ing.name_sv,
            section: ing.section,
            quantity: qty,
            unit,
            days: new Set([day.day_of_week]),
            buy_day_of: day.buy_day_of,
          });
        }
      }
    }

    // keep checked state for ingredients already on the list
    const { data: existingData, error: exErr } = await supabase
      .from("shopping_items")
      .select("id, ingredient_id, checked, manual")
      .eq("week_plan_id", plan.id);
    if (exErr) throw new Error(exErr.message);
    const existing = (existingData ?? []) as Pick<ShoppingItem, "id" | "ingredient_id" | "checked" | "manual">[];
    const checkedByIngredient = new Set<string>();
    for (const item of existing) {
      if (!item.manual && item.checked && item.ingredient_id) checkedByIngredient.add(item.ingredient_id);
    }

    const { error: delErr } = await supabase
      .from("shopping_items")
      .delete()
      .eq("week_plan_id", plan.id)
      .eq("manual", false);
    if (delErr) throw new Error(delErr.message);

    const rows = Array.from(agg.values()).map((a) => ({
      week_plan_id: plan.id,
      ingredient_id: a.ingredient_id,
      name: a.name,
      name_sv: a.name_sv,
      section: a.section,
      quantity: a.quantity,
      unit: a.unit,
      for_days: Array.from(a.days).sort((x, y) => x - y),
      buy_day_of: a.buy_day_of,
      manual: false,
      checked: checkedByIngredient.has(a.ingredient_id),
    }));

    if (rows.length > 0) {
      const { error: insErr } = await supabase.from("shopping_items").insert(rows);
      if (insErr) throw new Error(insErr.message);
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "could not build list" };
  }

  revalidatePath("/list");
  revalidatePath("/plan");
  return { ok: true };
}
